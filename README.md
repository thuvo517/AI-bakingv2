# 🧁 AI Baking Assistant

A full-stack, cloud-native AI application that generates personalized baking recipes and provides step-by-step guidance via an interactive chat interface.

**Stack:** Cloudflare Workers · JavaScript · Llama 3.3 (70B) · Durable Objects

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Cloudflare Edge                      │
│                                                         │
│  ┌──────────────┐    ┌──────────────────────────────┐   │
│  │    Worker     │───▶│    BakingSession (DO)         │   │
│  │  (Router +   │    │                              │   │
│  │   Frontend)  │    │  • conversationHistory[]     │   │
│  │              │    │  • activeRecipe {}           │   │
│  └──────┬───────┘    │  • currentStep              │   │
│         │            │  • userPreferences {}        │   │
│         │            └──────────┬───────────────────┘   │
│         │                       │                       │
│         │            ┌──────────▼───────────────────┐   │
│         │            │   Workers AI (Llama 3.3)     │   │
│         │            │   @cf/meta/llama-3.3-70b-    │   │
│         │            │   instruct-fp8-fast          │   │
│         │            └──────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Features

- **Personalized Recipes** — Generates recipes adapted to skill level, dietary restrictions, and available ingredients
- **Step-by-Step Guidance** — Interactive step tracker with visual progress bar and contextual tips
- **Persistent Sessions** — Durable Objects maintain conversation history, recipe state, and preferences across sessions
- **Edge-Optimized** — Entire stack runs on Cloudflare's edge network for low-latency responses
- **Responsive UI** — Clean chat interface with collapsible recipe panel, mobile-friendly sidebar

## Project Structure

```
ai-baking-assistant/
├── wrangler.toml           # Cloudflare Workers configuration
├── package.json
├── src/
│   ├── index.js            # Worker entry point (router, CORS, frontend serving)
│   ├── durable-object.js   # BakingSession Durable Object (state, LLM orchestration)
│   └── frontend.js         # Inline HTML/CSS/JS chat interface
└── README.md
```

## Setup & Deployment

### Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npm install -g wrangler`)
- Cloudflare account with Workers AI access

### Local Development

```bash
npm install
wrangler dev
```

This starts a local dev server at `http://localhost:8787`.

### Deploy to Production

```bash
wrangler deploy
```

## API Endpoints

All API routes are prefixed with `/api` and require a session identifier via `X-Session-Id` header, `?session=` query parameter, or `baking_session` cookie.

| Method | Path               | Description                            |
|--------|--------------------|----------------------------------------|
| GET    | `/api/session`     | Retrieve full session state            |
| POST   | `/api/chat`        | Send a message, receive AI response    |
| POST   | `/api/preferences` | Update dietary/skill preferences       |
| POST   | `/api/reset`       | Clear conversation and recipe state    |

### POST `/api/chat` — Request

```json
{ "message": "I want to make chocolate chip cookies" }
```

### POST `/api/chat` — Response

```json
{
  "reply": "Great choice! Here's a classic recipe...",
  "recipe": {
    "title": "Classic Chocolate Chip Cookies",
    "servings": "24 cookies",
    "prepTime": "15 min",
    "bakeTime": "12 min",
    "difficulty": "Beginner",
    "ingredients": ["2¼ cups all-purpose flour", "..."],
    "steps": ["Preheat oven to 375°F", "..."],
    "tips": ["Chill dough for 30 min for thicker cookies"]
  },
  "stepUpdate": null,
  "currentStep": -1
}
```

## Durable Object State Schema

The `BakingSession` Durable Object persists the following per session:

| Field                 | Type     | Description                                       |
|-----------------------|----------|---------------------------------------------------|
| `conversationHistory` | Array    | `{role, content, timestamp}` message pairs        |
| `activeRecipe`        | Object   | Currently loaded recipe (title, ingredients, steps, etc.) |
| `currentStep`         | Number   | Active step index (-1 = not started)              |
| `userPreferences`     | Object   | `{dietaryRestrictions[], skillLevel, favoriteStyles[]}` |
| `createdAt`           | Number   | Session creation timestamp                        |

## Key Design Decisions

1. **Structured LLM Output** — The system prompt instructs Llama 3.3 to embed recipe JSON and step updates within delimited markers (`%%%RECIPE_JSON%%%`), which the DO parses server-side. This keeps the chat response clean while enabling structured data extraction.

2. **Context Window Management** — Conversation history is trimmed to the last 20 messages before being sent to the model, with active recipe state injected as system context so the model always knows where the user is.

3. **Session-per-User via Durable Objects** — Each session ID maps to a unique DO instance, providing strong consistency guarantees and zero-config persistence without an external database.

4. **Edge-First Frontend** — The UI is served inline from the Worker (no static asset hosting needed), keeping the entire application in a single deployable unit.
