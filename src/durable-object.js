// ─────────────────────────────────────────────────────────────
// BakingSession — Durable Object
// Tracks conversation history, recipe context, user preferences,
// and active step progression across sessions.
// ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a warm, knowledgeable AI baking assistant. Your personality is encouraging, patient, and passionate about baking.

CORE RESPONSIBILITIES:
1. Generate personalized baking recipes based on user preferences, dietary needs, skill level, and available ingredients.
2. Provide step-by-step baking guidance with clear, detailed instructions.
3. Answer baking questions (techniques, substitutions, troubleshooting).
4. Track which step the user is on and help them progress through the recipe.

RESPONSE FORMAT RULES:
- When generating a recipe, ALWAYS structure it with this JSON block at the END of your message (after your conversational text):
  %%%RECIPE_JSON%%%
  {
    "title": "Recipe Name",
    "servings": "X servings",
    "prepTime": "X min",
    "bakeTime": "X min",
    "difficulty": "Beginner|Intermediate|Advanced",
    "ingredients": ["1 cup flour", "2 eggs", ...],
    "steps": ["Step 1 text", "Step 2 text", ...],
    "tips": ["Tip 1", "Tip 2"]
  }
  %%%END_RECIPE%%%
- When the user asks to start baking or begin steps, respond conversationally about the first step and include:
  %%%STEP_UPDATE%%%{"currentStep": 0, "totalSteps": N}%%%END_STEP%%%
- When the user says "next", "done", "next step", etc., advance the step and explain the next one with a step update block.
- For general conversation/questions, just respond naturally without any JSON blocks.

PERSONALITY:
- Use encouraging language ("Great choice!", "You've got this!")
- Offer pro tips and explain the "why" behind techniques
- Be concise but thorough — bakers need precision
- If the user seems stuck, offer troubleshooting proactively`;

export class BakingSession {
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.storage = state.storage;
  }

  async initialize() {
    this.conversationHistory = (await this.storage.get("conversationHistory")) || [];
    this.activeRecipe = (await this.storage.get("activeRecipe")) || null;
    this.currentStep = (await this.storage.get("currentStep")) ?? -1;
    this.userPreferences = (await this.storage.get("userPreferences")) || {
      dietaryRestrictions: [],
      skillLevel: "beginner",
      favoriteStyles: [],
    };
    this.createdAt = (await this.storage.get("createdAt")) || Date.now();
    if (!(await this.storage.get("createdAt"))) {
      await this.storage.put("createdAt", this.createdAt);
    }
  }

  async saveState() {
    await this.storage.put("conversationHistory", this.conversationHistory);
    await this.storage.put("activeRecipe", this.activeRecipe);
    await this.storage.put("currentStep", this.currentStep);
    await this.storage.put("userPreferences", this.userPreferences);
  }

  // Trim conversation to last N exchanges to stay within token limits
  getContextWindow(maxMessages = 20) {
    const history = this.conversationHistory.slice(-maxMessages);
    return history;
  }

  buildMessages(userMessage) {
    const contextMessages = this.getContextWindow();

    // Inject active recipe context if present
    let systemAddendum = "";
    if (this.activeRecipe) {
      systemAddendum += `\n\nACTIVE RECIPE CONTEXT:\n${JSON.stringify(this.activeRecipe)}`;
      systemAddendum += `\nUser is currently on step ${this.currentStep + 1} of ${this.activeRecipe.steps?.length || "?"} steps.`;
    }
    if (this.userPreferences.dietaryRestrictions.length > 0) {
      systemAddendum += `\nUser dietary restrictions: ${this.userPreferences.dietaryRestrictions.join(", ")}`;
    }
    systemAddendum += `\nUser skill level: ${this.userPreferences.skillLevel}`;

    const messages = [
      ...contextMessages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: userMessage },
    ];

    return { systemPrompt: SYSTEM_PROMPT + systemAddendum, messages };
  }

  parseAssistantResponse(text) {
    let recipe = null;
    let stepUpdate = null;
    let cleanText = text;

    // Extract recipe JSON
    const recipeMatch = text.match(/%%%RECIPE_JSON%%%([\s\S]*?)%%%END_RECIPE%%%/);
    if (recipeMatch) {
      try {
        recipe = JSON.parse(recipeMatch[1].trim());
      } catch (e) {
        console.error("Failed to parse recipe JSON:", e);
      }
      cleanText = cleanText.replace(/%%%RECIPE_JSON%%%[\s\S]*?%%%END_RECIPE%%%/, "").trim();
    }

    // Extract step update
    const stepMatch = text.match(/%%%STEP_UPDATE%%%([\s\S]*?)%%%END_STEP%%%/);
    if (stepMatch) {
      try {
        stepUpdate = JSON.parse(stepMatch[1].trim());
      } catch (e) {
        console.error("Failed to parse step update:", e);
      }
      cleanText = cleanText.replace(/%%%STEP_UPDATE%%%[\s\S]*?%%%END_STEP%%%/, "").trim();
    }

    return { cleanText, recipe, stepUpdate };
  }

  async fetch(request) {
    await this.initialize();
    const url = new URL(request.url);

    // ── GET /session — return session state ──
    if (request.method === "GET" && url.pathname === "/session") {
      return Response.json({
        conversationHistory: this.conversationHistory,
        activeRecipe: this.activeRecipe,
        currentStep: this.currentStep,
        userPreferences: this.userPreferences,
      });
    }

    // ── POST /preferences — update user preferences ──
    if (request.method === "POST" && url.pathname === "/preferences") {
      const prefs = await request.json();
      this.userPreferences = { ...this.userPreferences, ...prefs };
      await this.saveState();
      return Response.json({ ok: true, userPreferences: this.userPreferences });
    }

    // ── POST /chat — main chat endpoint ──
    if (request.method === "POST" && url.pathname === "/chat") {
      const { message } = await request.json();
      if (!message || typeof message !== "string") {
        return Response.json({ error: "Message is required" }, { status: 400 });
      }

      // Build messages for the LLM
      const { systemPrompt, messages } = this.buildMessages(message);

      // Call Llama 3.3 via Workers AI
      let aiResponse;
      try {
        aiResponse = await this.env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          max_tokens: 2048,
          temperature: 0.7,
        });
      } catch (err) {
        console.error("AI inference error:", err);
        return Response.json({ error: "AI service unavailable" }, { status: 502 });
      }

      const rawText = aiResponse.response || aiResponse?.result?.response || "";
      const { cleanText, recipe, stepUpdate } = this.parseAssistantResponse(rawText);

      // Update state
      this.conversationHistory.push(
        { role: "user", content: message, timestamp: Date.now() },
        { role: "assistant", content: rawText, timestamp: Date.now() }
      );

      if (recipe) {
        this.activeRecipe = recipe;
        this.currentStep = -1; // Recipe loaded but not started
      }

      if (stepUpdate && stepUpdate.currentStep !== undefined) {
        this.currentStep = stepUpdate.currentStep;
      }

      await this.saveState();

      return Response.json({
        reply: cleanText,
        recipe: recipe || this.activeRecipe,
        stepUpdate,
        currentStep: this.currentStep,
      });
    }

    // ── POST /reset — clear session ──
    if (request.method === "POST" && url.pathname === "/reset") {
      this.conversationHistory = [];
      this.activeRecipe = null;
      this.currentStep = -1;
      await this.saveState();
      return Response.json({ ok: true });
    }

    return Response.json({ error: "Not found" }, { status: 404 });
  }
}
