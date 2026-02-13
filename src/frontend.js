// Frontend served as an inline HTML string by the Worker
export const HTML_CONTENT = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>AI Baking Assistant</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=IBM+Plex+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --cream: #FDF6EC;
    --warm-white: #FAF3E8;
    --crust: #8B6914;
    --crust-dark: #6B4F10;
    --dough: #D4A847;
    --flour: #F5E6C8;
    --chocolate: #3E2723;
    --chocolate-light: #5D4037;
    --berry: #C62828;
    --berry-soft: #FFCDD2;
    --mint: #2E7D5F;
    --mint-soft: #E0F2EE;
    --shadow-sm: 0 1px 3px rgba(62,39,35,0.08);
    --shadow-md: 0 4px 16px rgba(62,39,35,0.10);
    --shadow-lg: 0 8px 32px rgba(62,39,35,0.14);
    --radius: 16px;
    --radius-sm: 10px;
  }

  html { height: 100%; }
  body {
    height: 100%;
    font-family: 'IBM Plex Sans', sans-serif;
    font-weight: 400;
    color: var(--chocolate);
    background: var(--cream);
    display: flex;
    overflow: hidden;
  }

  /* ── Sidebar ── */
  .sidebar {
    width: 320px;
    min-width: 320px;
    background: var(--chocolate);
    color: var(--flour);
    display: flex;
    flex-direction: column;
    padding: 28px 24px;
    gap: 24px;
    overflow-y: auto;
    transition: transform 0.3s ease;
  }
  .sidebar-brand {
    display: flex;
    align-items: center;
    gap: 14px;
    padding-bottom: 20px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
  }
  .brand-icon {
    width: 48px; height: 48px;
    background: var(--dough);
    border-radius: 14px;
    display: grid;
    place-items: center;
    font-size: 24px;
    flex-shrink: 0;
  }
  .brand-text h1 {
    font-family: 'DM Serif Display', serif;
    font-size: 20px;
    color: #fff;
    line-height: 1.2;
  }
  .brand-text p {
    font-size: 12px;
    opacity: 0.55;
    margin-top: 2px;
    font-weight: 300;
  }

  /* Preferences Panel */
  .prefs-section { display: flex; flex-direction: column; gap: 16px; }
  .prefs-section h3 {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1.4px;
    opacity: 0.45;
    font-weight: 500;
  }
  .pref-group { display: flex; flex-direction: column; gap: 6px; }
  .pref-group label {
    font-size: 13px;
    font-weight: 500;
    opacity: 0.8;
  }
  .pref-group select, .pref-group input {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    color: var(--flour);
    padding: 10px 12px;
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 13px;
    outline: none;
    transition: border-color 0.2s;
  }
  .pref-group select:focus, .pref-group input:focus {
    border-color: var(--dough);
  }
  .pref-group select option { background: var(--chocolate); }

  .chip-group { display: flex; flex-wrap: wrap; gap: 6px; }
  .chip {
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 500;
    border: 1px solid rgba(255,255,255,0.12);
    background: transparent;
    color: var(--flour);
    cursor: pointer;
    transition: all 0.2s;
    user-select: none;
  }
  .chip:hover { background: rgba(255,255,255,0.06); }
  .chip.active {
    background: var(--dough);
    border-color: var(--dough);
    color: var(--chocolate);
  }

  .sidebar-actions { margin-top: auto; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.08); }
  .btn-reset {
    width: 100%;
    padding: 12px;
    background: rgba(198,40,40,0.15);
    border: 1px solid rgba(198,40,40,0.25);
    color: #EF9A9A;
    border-radius: var(--radius-sm);
    font-family: inherit;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  .btn-reset:hover { background: rgba(198,40,40,0.25); }

  /* ── Main Chat Area ── */
  .main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  /* Top bar */
  .topbar {
    padding: 16px 28px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: var(--warm-white);
    border-bottom: 1px solid rgba(139,105,20,0.08);
  }
  .topbar-title {
    font-family: 'DM Serif Display', serif;
    font-size: 16px;
  }
  .mobile-toggle {
    display: none;
    background: none;
    border: none;
    font-size: 22px;
    cursor: pointer;
    color: var(--chocolate);
  }

  /* Recipe Card (appears above chat when active) */
  .recipe-panel {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.4s ease;
    background: var(--warm-white);
    border-bottom: 1px solid rgba(139,105,20,0.08);
  }
  .recipe-panel.open { max-height: 600px; overflow-y: auto; }
  .recipe-card {
    padding: 24px 28px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  .recipe-header {
    grid-column: 1 / -1;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }
  .recipe-header h2 {
    font-family: 'DM Serif Display', serif;
    font-size: 22px;
  }
  .recipe-meta {
    display: flex;
    gap: 16px;
    margin-top: 6px;
  }
  .recipe-meta span {
    font-size: 12px;
    font-weight: 500;
    color: var(--chocolate-light);
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .recipe-toggle-btn {
    background: none;
    border: 1px solid rgba(139,105,20,0.2);
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 12px;
    font-family: inherit;
    font-weight: 500;
    cursor: pointer;
    color: var(--crust);
    transition: all 0.2s;
    white-space: nowrap;
  }
  .recipe-toggle-btn:hover { background: var(--flour); }

  .recipe-ingredients, .recipe-steps-list {
    background: #fff;
    border-radius: var(--radius-sm);
    padding: 18px;
    box-shadow: var(--shadow-sm);
  }
  .recipe-ingredients h3, .recipe-steps-list h3 {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: var(--crust);
    margin-bottom: 12px;
    font-weight: 600;
  }
  .recipe-ingredients ul { list-style: none; display: flex; flex-direction: column; gap: 6px; }
  .recipe-ingredients li {
    font-size: 13px;
    padding: 4px 0;
    border-bottom: 1px dashed rgba(139,105,20,0.08);
    font-weight: 300;
  }
  .recipe-ingredients li::before { content: "• "; color: var(--dough); font-weight: 600; }
  .recipe-steps-list ol { list-style: none; counter-reset: steps; display: flex; flex-direction: column; gap: 8px; }
  .recipe-steps-list li {
    counter-increment: steps;
    font-size: 13px;
    padding: 8px 8px 8px 36px;
    position: relative;
    border-radius: 8px;
    font-weight: 300;
    line-height: 1.5;
    transition: background 0.2s;
  }
  .recipe-steps-list li::before {
    content: counter(steps);
    position: absolute;
    left: 8px;
    top: 8px;
    width: 22px; height: 22px;
    background: var(--flour);
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-size: 11px;
    font-weight: 600;
    color: var(--crust);
  }
  .recipe-steps-list li.active-step {
    background: var(--mint-soft);
  }
  .recipe-steps-list li.active-step::before {
    background: var(--mint);
    color: #fff;
  }
  .recipe-steps-list li.completed-step { opacity: 0.5; }
  .recipe-steps-list li.completed-step::before {
    background: var(--mint);
    color: #fff;
    content: "✓";
  }

  .recipe-tips {
    grid-column: 1 / -1;
    background: linear-gradient(135deg, #FFF8E1, #FFF3E0);
    border-radius: var(--radius-sm);
    padding: 16px 18px;
  }
  .recipe-tips h3 {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 1.2px;
    color: var(--crust);
    margin-bottom: 8px;
    font-weight: 600;
  }
  .recipe-tips p { font-size: 13px; font-weight: 300; line-height: 1.5; }

  /* Step Progress Bar */
  .step-tracker {
    display: none;
    padding: 12px 28px;
    background: var(--mint-soft);
    border-bottom: 1px solid rgba(46,125,95,0.15);
    align-items: center;
    gap: 14px;
  }
  .step-tracker.visible { display: flex; }
  .step-tracker-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--mint);
    white-space: nowrap;
  }
  .step-progress-bar {
    flex: 1;
    height: 6px;
    background: rgba(46,125,95,0.12);
    border-radius: 3px;
    overflow: hidden;
  }
  .step-progress-fill {
    height: 100%;
    background: var(--mint);
    border-radius: 3px;
    transition: width 0.4s ease;
  }
  .step-tracker-hint {
    font-size: 12px;
    color: var(--chocolate-light);
    font-weight: 300;
    white-space: nowrap;
  }

  /* Chat Messages */
  .chat-area {
    flex: 1;
    overflow-y: auto;
    padding: 28px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    scroll-behavior: smooth;
  }

  .message {
    max-width: 680px;
    display: flex;
    gap: 12px;
    animation: msgIn 0.3s ease;
  }
  @keyframes msgIn {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .message.user { align-self: flex-end; flex-direction: row-reverse; }
  .message.assistant { align-self: flex-start; }

  .msg-avatar {
    width: 36px; height: 36px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    font-size: 16px;
    flex-shrink: 0;
    align-self: flex-end;
  }
  .assistant .msg-avatar { background: var(--flour); }
  .user .msg-avatar { background: var(--chocolate); color: var(--flour); font-size: 13px; font-weight: 600; }

  .msg-bubble {
    padding: 14px 18px;
    border-radius: var(--radius);
    font-size: 14px;
    line-height: 1.65;
    font-weight: 300;
  }
  .assistant .msg-bubble {
    background: #fff;
    box-shadow: var(--shadow-sm);
    border-bottom-left-radius: 4px;
  }
  .user .msg-bubble {
    background: var(--chocolate);
    color: var(--flour);
    border-bottom-right-radius: 4px;
  }
  .msg-bubble p { margin-bottom: 8px; }
  .msg-bubble p:last-child { margin-bottom: 0; }
  .msg-bubble strong { font-weight: 600; }

  /* Typing indicator */
  .typing-indicator {
    display: none;
    align-self: flex-start;
    gap: 12px;
    align-items: center;
    padding: 0 4px;
  }
  .typing-indicator.visible { display: flex; }
  .typing-dots {
    display: flex;
    gap: 5px;
    padding: 14px 18px;
    background: #fff;
    border-radius: var(--radius);
    box-shadow: var(--shadow-sm);
  }
  .typing-dots span {
    width: 7px; height: 7px;
    background: var(--dough);
    border-radius: 50%;
    animation: bounce 1.2s infinite;
  }
  .typing-dots span:nth-child(2) { animation-delay: 0.15s; }
  .typing-dots span:nth-child(3) { animation-delay: 0.3s; }
  @keyframes bounce {
    0%, 60%, 100% { transform: translateY(0); }
    30% { transform: translateY(-6px); }
  }

  /* Welcome message */
  .welcome {
    text-align: center;
    padding: 60px 20px;
    max-width: 480px;
    align-self: center;
    animation: fadeUp 0.6s ease;
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .welcome-icon { font-size: 56px; margin-bottom: 16px; }
  .welcome h2 {
    font-family: 'DM Serif Display', serif;
    font-size: 26px;
    margin-bottom: 8px;
  }
  .welcome p {
    font-size: 14px;
    font-weight: 300;
    color: var(--chocolate-light);
    line-height: 1.6;
    margin-bottom: 24px;
  }
  .suggestions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    justify-content: center;
  }
  .suggestion-chip {
    padding: 10px 16px;
    border: 1px solid rgba(139,105,20,0.15);
    background: #fff;
    border-radius: 24px;
    font-size: 13px;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.2s;
    color: var(--chocolate);
    box-shadow: var(--shadow-sm);
  }
  .suggestion-chip:hover {
    background: var(--flour);
    border-color: var(--dough);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  /* Input bar */
  .input-bar {
    padding: 16px 28px 20px;
    background: var(--warm-white);
    border-top: 1px solid rgba(139,105,20,0.06);
  }
  .input-wrap {
    display: flex;
    gap: 10px;
    max-width: 780px;
    margin: 0 auto;
  }
  .input-wrap input {
    flex: 1;
    padding: 14px 20px;
    border: 1.5px solid rgba(139,105,20,0.12);
    border-radius: 28px;
    font-family: inherit;
    font-size: 14px;
    background: #fff;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
    color: var(--chocolate);
  }
  .input-wrap input::placeholder { color: #bba97a; font-weight: 300; }
  .input-wrap input:focus {
    border-color: var(--dough);
    box-shadow: 0 0 0 3px rgba(212,168,71,0.12);
  }
  .send-btn {
    width: 48px; height: 48px;
    border-radius: 50%;
    border: none;
    background: var(--chocolate);
    color: var(--flour);
    font-size: 18px;
    cursor: pointer;
    display: grid;
    place-items: center;
    transition: all 0.2s;
    flex-shrink: 0;
  }
  .send-btn:hover { background: var(--crust-dark); transform: scale(1.05); }
  .send-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  /* ── Mobile ── */
  @media (max-width: 768px) {
    .sidebar {
      position: fixed;
      left: 0; top: 0;
      height: 100%;
      z-index: 100;
      transform: translateX(-100%);
    }
    .sidebar.open { transform: translateX(0); }
    .mobile-toggle { display: block; }
    .recipe-card { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>

<!-- Sidebar -->
<aside class="sidebar" id="sidebar">
  <div class="sidebar-brand">
    <div class="brand-icon">🧁</div>
    <div class="brand-text">
      <h1>Baking Assistant</h1>
      <p>Powered by Llama 3.3</p>
    </div>
  </div>

  <div class="prefs-section">
    <h3>Your Preferences</h3>

    <div class="pref-group">
      <label>Skill Level</label>
      <select id="skillLevel" onchange="updatePreferences()">
        <option value="beginner">Beginner</option>
        <option value="intermediate">Intermediate</option>
        <option value="advanced">Advanced</option>
      </select>
    </div>

    <div class="pref-group">
      <label>Dietary Restrictions</label>
      <div class="chip-group" id="dietaryChips">
        <button class="chip" data-value="gluten-free" onclick="toggleChip(this)">Gluten-Free</button>
        <button class="chip" data-value="dairy-free" onclick="toggleChip(this)">Dairy-Free</button>
        <button class="chip" data-value="vegan" onclick="toggleChip(this)">Vegan</button>
        <button class="chip" data-value="nut-free" onclick="toggleChip(this)">Nut-Free</button>
        <button class="chip" data-value="egg-free" onclick="toggleChip(this)">Egg-Free</button>
        <button class="chip" data-value="low-sugar" onclick="toggleChip(this)">Low Sugar</button>
      </div>
    </div>
  </div>

  <div class="sidebar-actions">
    <button class="btn-reset" onclick="resetSession()">🗑️  New Conversation</button>
  </div>
</aside>

<!-- Main -->
<main class="main">
  <!-- Top Bar -->
  <div class="topbar">
    <button class="mobile-toggle" onclick="document.getElementById('sidebar').classList.toggle('open')">☰</button>
    <span class="topbar-title">Chat</span>
    <button class="recipe-toggle-btn" id="recipeToggleTop" style="display:none" onclick="toggleRecipePanel()">
      📖 View Recipe
    </button>
  </div>

  <!-- Recipe Panel (hidden until recipe loaded) -->
  <div class="recipe-panel" id="recipePanel">
    <div class="recipe-card" id="recipeCard"></div>
  </div>

  <!-- Step Progress Tracker -->
  <div class="step-tracker" id="stepTracker">
    <span class="step-tracker-label" id="stepLabel">Step 1 of 6</span>
    <div class="step-progress-bar">
      <div class="step-progress-fill" id="stepFill" style="width:0%"></div>
    </div>
    <span class="step-tracker-hint">Say <strong>"next step"</strong> to continue</span>
  </div>

  <!-- Chat Area -->
  <div class="chat-area" id="chatArea">
    <div class="welcome" id="welcomeBlock">
      <div class="welcome-icon">🍞</div>
      <h2>What shall we bake today?</h2>
      <p>I can help you find the perfect recipe, walk you through it step by step, troubleshoot problems, and adapt recipes to your needs.</p>
      <div class="suggestions">
        <button class="suggestion-chip" onclick="sendSuggestion(this)">Chocolate chip cookies</button>
        <button class="suggestion-chip" onclick="sendSuggestion(this)">Sourdough bread</button>
        <button class="suggestion-chip" onclick="sendSuggestion(this)">Lemon tart</button>
        <button class="suggestion-chip" onclick="sendSuggestion(this)">Cinnamon rolls</button>
        <button class="suggestion-chip" onclick="sendSuggestion(this)">What can I bake with bananas?</button>
      </div>
    </div>

    <div class="typing-indicator" id="typingIndicator">
      <div class="msg-avatar" style="background:var(--flour)">🧁</div>
      <div class="typing-dots"><span></span><span></span><span></span></div>
    </div>
  </div>

  <!-- Input Bar -->
  <div class="input-bar">
    <div class="input-wrap">
      <input
        type="text"
        id="chatInput"
        placeholder="Ask me anything about baking..."
        autocomplete="off"
        onkeydown="if(event.key==='Enter')sendMessage()"
      />
      <button class="send-btn" id="sendBtn" onclick="sendMessage()">➤</button>
    </div>
  </div>
</main>

<script>
// ── State ──
const SESSION_KEY = 'baking_session_id';
let sessionId = localStorage.getItem(SESSION_KEY);
if (!sessionId) {
  sessionId = 'session-' + crypto.randomUUID();
  localStorage.setItem(SESSION_KEY, sessionId);
}

let activeRecipe = null;
let currentStep = -1;
let isSending = false;

// ── API Helpers ──
async function api(path, method = 'GET', body = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', 'X-Session-Id': sessionId },
  };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch('/api' + path, opts);
  return res.json();
}

// ── Preferences ──
function toggleChip(el) {
  el.classList.toggle('active');
  updatePreferences();
}

async function updatePreferences() {
  const restrictions = [...document.querySelectorAll('#dietaryChips .chip.active')]
    .map(c => c.dataset.value);
  const skillLevel = document.getElementById('skillLevel').value;
  await api('/preferences', 'POST', { dietaryRestrictions: restrictions, skillLevel });
}

// ── Chat ──
function addMessage(role, text) {
  const welcome = document.getElementById('welcomeBlock');
  if (welcome) welcome.style.display = 'none';

  const area = document.getElementById('chatArea');
  const indicator = document.getElementById('typingIndicator');

  const div = document.createElement('div');
  div.className = 'message ' + role;

  const avatar = document.createElement('div');
  avatar.className = 'msg-avatar';
  avatar.textContent = role === 'assistant' ? '🧁' : 'U';

  const bubble = document.createElement('div');
  bubble.className = 'msg-bubble';
  bubble.innerHTML = formatText(text);

  div.appendChild(avatar);
  div.appendChild(bubble);
  area.insertBefore(div, indicator);
  area.scrollTop = area.scrollHeight;
}

function formatText(text) {
  // Basic markdown-lite formatting
  return text
    .replace(/\\n\\n/g, '</p><p>')
    .replace(/\\n/g, '<br>')
    .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
    .replace(/\\*(.+?)\\*/g, '<em>$1</em>')
    .split('\\n').join('<br>')
    .replace(/^/, '<p>') + '</p>';
}

function showTyping(show) {
  document.getElementById('typingIndicator').classList.toggle('visible', show);
  const area = document.getElementById('chatArea');
  area.scrollTop = area.scrollHeight;
}

async function sendMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text || isSending) return;

  isSending = true;
  document.getElementById('sendBtn').disabled = true;
  input.value = '';
  addMessage('user', text);
  showTyping(true);

  try {
    const data = await api('/chat', 'POST', { message: text });
    showTyping(false);

    if (data.error) {
      addMessage('assistant', 'Sorry, something went wrong. Please try again!');
    } else {
      addMessage('assistant', data.reply || 'Hmm, I didn\\'t get a response. Try again?');

      // Handle recipe
      if (data.recipe) {
        activeRecipe = data.recipe;
        renderRecipe(data.recipe);
        document.getElementById('recipeToggleTop').style.display = '';
      }

      // Handle step progression
      if (data.stepUpdate || data.currentStep >= 0) {
        currentStep = data.currentStep;
        updateStepTracker(currentStep, activeRecipe?.steps?.length || 0);
        highlightRecipeStep(currentStep);
      }
    }
  } catch (err) {
    showTyping(false);
    addMessage('assistant', 'Connection error — please check your network and try again.');
    console.error(err);
  }

  isSending = false;
  document.getElementById('sendBtn').disabled = false;
  input.focus();
}

function sendSuggestion(el) {
  document.getElementById('chatInput').value = el.textContent;
  sendMessage();
}

// ── Recipe Rendering ──
function renderRecipe(recipe) {
  const card = document.getElementById('recipeCard');
  const stepsHtml = (recipe.steps || [])
    .map((s, i) => '<li id="recipeStep' + i + '">' + s + '</li>')
    .join('');
  const ingredientsHtml = (recipe.ingredients || [])
    .map(ing => '<li>' + ing + '</li>')
    .join('');
  const tipsHtml = (recipe.tips || []).join(' · ');

  card.innerHTML = \`
    <div class="recipe-header">
      <div>
        <h2>\${recipe.title || 'Your Recipe'}</h2>
        <div class="recipe-meta">
          <span>🕐 Prep: \${recipe.prepTime || '?'}</span>
          <span>🔥 Bake: \${recipe.bakeTime || '?'}</span>
          <span>🍽️ \${recipe.servings || '?'}</span>
          <span>📊 \${recipe.difficulty || '?'}</span>
        </div>
      </div>
      <button class="recipe-toggle-btn" onclick="toggleRecipePanel()">✕ Close</button>
    </div>
    <div class="recipe-ingredients">
      <h3>Ingredients</h3>
      <ul>\${ingredientsHtml}</ul>
    </div>
    <div class="recipe-steps-list">
      <h3>Steps</h3>
      <ol>\${stepsHtml}</ol>
    </div>
    \${tipsHtml ? '<div class="recipe-tips"><h3>Pro Tips</h3><p>' + tipsHtml + '</p></div>' : ''}
  \`;

  // Auto-open
  document.getElementById('recipePanel').classList.add('open');
}

function toggleRecipePanel() {
  document.getElementById('recipePanel').classList.toggle('open');
}

function updateStepTracker(step, total) {
  if (step < 0 || total <= 0) return;
  const tracker = document.getElementById('stepTracker');
  tracker.classList.add('visible');
  document.getElementById('stepLabel').textContent = 'Step ' + (step + 1) + ' of ' + total;
  document.getElementById('stepFill').style.width = ((step + 1) / total * 100) + '%';
}

function highlightRecipeStep(step) {
  if (!activeRecipe?.steps) return;
  activeRecipe.steps.forEach((_, i) => {
    const el = document.getElementById('recipeStep' + i);
    if (!el) return;
    el.className = '';
    if (i < step) el.className = 'completed-step';
    else if (i === step) el.className = 'active-step';
  });
}

// ── Session ──
async function resetSession() {
  await api('/reset', 'POST');
  activeRecipe = null;
  currentStep = -1;
  document.getElementById('chatArea').querySelectorAll('.message').forEach(m => m.remove());
  document.getElementById('welcomeBlock').style.display = '';
  document.getElementById('recipePanel').classList.remove('open');
  document.getElementById('recipeToggleTop').style.display = 'none';
  document.getElementById('stepTracker').classList.remove('visible');
}

// ── Init: restore session ──
(async function init() {
  try {
    const session = await api('/session');
    if (session.userPreferences) {
      document.getElementById('skillLevel').value = session.userPreferences.skillLevel || 'beginner';
      (session.userPreferences.dietaryRestrictions || []).forEach(r => {
        const chip = document.querySelector('#dietaryChips .chip[data-value="' + r + '"]');
        if (chip) chip.classList.add('active');
      });
    }
    if (session.conversationHistory?.length) {
      session.conversationHistory.forEach(m => addMessage(m.role, m.content));
    }
    if (session.activeRecipe) {
      activeRecipe = session.activeRecipe;
      renderRecipe(session.activeRecipe);
      document.getElementById('recipeToggleTop').style.display = '';
    }
    if (session.currentStep >= 0 && activeRecipe?.steps) {
      currentStep = session.currentStep;
      updateStepTracker(currentStep, activeRecipe.steps.length);
      highlightRecipeStep(currentStep);
    }
  } catch (e) { console.log('No existing session'); }
})();
</script>

</body>
</html>`;
