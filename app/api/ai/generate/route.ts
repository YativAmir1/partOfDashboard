// ─── CityMind AI — secure server-side LLM endpoint ───────────────────────────
// The browser calls ONLY this route, never a provider directly; no API key ever
// reaches the client bundle. The request is sanitized (PII firewall) before any
// model call, and the response always succeeds — falling back to static Hebrew
// text if no key is configured or the provider fails.
import { NextRequest, NextResponse } from "next/server";
import type {
  ActionRecommendation,
  LLMGenerationRequest,
  LLMGenerationType,
} from "@/lib/citymind/types";
import { toLLMPayload } from "@/lib/ai/sanitize";
import { streamOperationalText } from "@/lib/ai/llmService";
import { selectProvider } from "@/lib/ai/aiProvider";

export const runtime = "nodejs";
export const maxDuration = 300;

// Lightweight status for the cockpit header — reports whether a live key is
// configured WITHOUT exposing it. Drives "LLM פעיל — …" vs "מצב דמו".
export async function GET() {
  const provider = selectProvider();
  const configured = provider.isConfigured();
  return NextResponse.json({
    provider: provider.id,
    configured,
    model: configured ? provider.model() : null,
  });
}

const VALID_TYPES: LLMGenerationType[] = [
  "explainAction",
  "teamInstruction",
  "residentUpdate",
  "executiveSummary",
];

export async function POST(req: NextRequest) {
  let body: { type?: string; action?: unknown; context?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "גוף בקשה לא תקין" }, { status: 400 });
  }

  const type = body?.type as LLMGenerationType;
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ success: false, error: "סוג הפקה לא נתמך" }, { status: 400 });
  }
  if (!body?.action || typeof body.action !== "object") {
    return NextResponse.json({ success: false, error: "חסרים נתוני פעולה" }, { status: 400 });
  }

  // PII firewall — strip to an area-level, non-identifying payload before the LLM.
  const action = toLLMPayload(body.action as ActionRecommendation);

  const request: LLMGenerationRequest = {
    type,
    action,
    context: { city: "רמת גן", domain: "שפ״ע ושירות לתושב", demoMode: true },
  };

  // Stream the operational text token-by-token as Server-Sent Events. The client
  // renders it live; the layer always degrades to a simulated fallback stream.
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of streamOperationalText(request, req.signal)) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        }
      } catch (err) {
        console.error("[CityMind LLM] stream route error:", err);
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
