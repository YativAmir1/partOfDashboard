// ─── CityMind AI — grounded natural-language Q&A endpoint ─────────────────────
// "שאל את CityMind": answers a manager's free-text question STRICTLY from the
// current, PII-free city snapshot (RAG over structured data). Same guarantees as
// the other AI routes: server-only provider call, no key in the client, always
// degrades to a grounded fallback answer.
import { NextRequest, NextResponse } from "next/server";
import type { ActionRecommendation } from "@/lib/citymind/types";
import { buildCitySnapshot } from "@/lib/ai/sanitize";
import { buildQAPrompt, QA_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import { qaFallback } from "@/lib/ai/fallbacks";
import { streamWithFallback } from "@/lib/ai/llmService";

export const runtime = "nodejs";
export const maxDuration = 300;

const MAX_QUESTION_LEN = 500;

export async function POST(req: NextRequest) {
  let body: { question?: unknown; actions?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "גוף בקשה לא תקין" }, { status: 400 });
  }

  const question = typeof body?.question === "string" ? body.question.trim().slice(0, MAX_QUESTION_LEN) : "";
  if (!question) {
    return NextResponse.json({ success: false, error: "חסרה שאלה" }, { status: 400 });
  }

  const actions = Array.isArray(body?.actions) ? (body.actions as ActionRecommendation[]) : [];
  const snapshot = buildCitySnapshot(actions);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const events = streamWithFallback(
          { system: QA_SYSTEM_PROMPT, user: buildQAPrompt(question, snapshot) },
          qaFallback(snapshot),
          req.signal,
        );
        for await (const event of events) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        }
      } catch (err) {
        console.error("[CityMind LLM] ask route error:", err);
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
