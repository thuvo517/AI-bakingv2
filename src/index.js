// ─────────────────────────────────────────────────────────────
// AI Baking Assistant — Cloudflare Worker Entry Point
// Routes requests to Durable Objects and serves the frontend.
// ─────────────────────────────────────────────────────────────

import { BakingSession } from "./durable-object.js";
import { HTML_CONTENT } from "./frontend.js";

export { BakingSession };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // ── Serve Frontend ──
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(HTML_CONTENT, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // ── API Routes → Durable Object ──
    if (url.pathname.startsWith("/api/")) {
      // Session ID from cookie, header, or query param
      const sessionId =
        url.searchParams.get("session") ||
        request.headers.get("X-Session-Id") ||
        getSessionFromCookie(request) ||
        "default-session";

      // Get or create the Durable Object stub
      const id = env.BAKING_SESSION.idFromName(sessionId);
      const stub = env.BAKING_SESSION.get(id);

      // Map /api/chat → /chat, /api/session → /session, etc.
      const doPath = url.pathname.replace("/api", "");
      const doUrl = new URL(doPath, request.url);

      const doRequest = new Request(doUrl.toString(), {
        method: request.method,
        headers: request.headers,
        body: request.method !== "GET" ? request.body : undefined,
      });

      try {
        const response = await stub.fetch(doRequest);
        const body = await response.text();
        return new Response(body, {
          status: response.status,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });
      } catch (err) {
        console.error("Durable Object error:", err);
        return Response.json(
          { error: "Internal server error", details: err.message },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    return new Response("Not Found", { status: 404 });
  },
};

function getSessionFromCookie(request) {
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/baking_session=([^;]+)/);
  return match ? match[1] : null;
}
