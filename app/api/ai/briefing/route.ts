// ─── CityMind AI — executive briefing endpoint ───────────────────────────────
// City-wide synthesis: takes the LIVE action queue from the client, rebuilds a
// PII-free snapshot (adding server-side red-lights / KPIs / sentiment), and streams
// a prioritized manager briefing. Mirrors /api/ai/generate: browser never touches a
// provider, no key reaches the client, and it always degrades to grounded fallback.
import { NextRequest } from "next/server";
import type { ActionRecommendation } from "@/lib/citymind/types";
import { buildCitySnapshot } from "@/lib/ai/sanitize";
import { buildBriefingPrompt, SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { briefingFallback } from "@/lib/ai/fallbacks";
import { streamWithFallback } from "@/lib/ai/llmService";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  let body: { actions?: unknown };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const actions = Array.isArray(body?.actions) ? (body.actions as ActionRecommendation[]) : [];
  const snapshot = buildCitySnapshot(actions);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const events = streamWithFallback(
          { system: SYSTEM_PROMPT, user: buildBriefingPrompt(snapshot) },
          briefingFallback(snapshot),
          req.signal,
        );
        for await (const event of events) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        }
      } catch (err) {
        console.error("[CityMind LLM] briefing route error:", err);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done", content: "" })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
