"use client";

// ─── CityMind AI — client SSE consumer ───────────────────────────────────────
// Shared browser helper for the streamed AI endpoints (briefing + Q&A). Parses the
// "\n\n"-delimited SSE frames from our routes and reports the growing text back
// through onUpdate, using the same LLMEntry shape the per-action cache uses so the
// existing GeneratedTextCard renders it unchanged.
import type { LLMEntry } from "@/context/CityMindContext";

export async function streamLLM(
  url: string,
  body: unknown,
  onUpdate: (entry: LLMEntry) => void,
  signal?: AbortSignal,
): Promise<void> {
  onUpdate({ status: "loading", content: "", fallback: false });

  let content = "";
  let fallback = false;
  let provider: string | undefined;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
    if (!res.body) throw new Error("no stream body");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    const handle = (raw: string) => {
      const line = raw.trim();
      if (!line.startsWith("data:")) return;
      let ev: { type?: string; text?: string; content?: string; provider?: string; fallback?: boolean };
      try {
        ev = JSON.parse(line.slice(5).trim());
      } catch {
        return;
      }
      if (ev.type === "meta") {
        fallback = Boolean(ev.fallback);
        provider = ev.provider;
        onUpdate({ status: "streaming", content, fallback, provider });
      } else if (ev.type === "delta") {
        content += ev.text ?? "";
        onUpdate({ status: "streaming", content, fallback, provider });
      } else if (ev.type === "done") {
        if (ev.content) content = ev.content;
        onUpdate({ status: "done", content, fallback, provider });
      }
    };

    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buffer.indexOf("\n\n")) !== -1) {
        handle(buffer.slice(0, nl));
        buffer = buffer.slice(nl + 2);
      }
    }
    if (buffer.trim()) handle(buffer);

    // Guarantee a terminal state even if no explicit "done" arrived.
    onUpdate({ status: "done", content, fallback, provider });
  } catch (err) {
    if (signal?.aborted) return; // caller replaced/cancelled this request
    console.error("[CityMind LLM] client stream error:", err);
    onUpdate({
      status: "done",
      content: content || "לא ניתן להפיק תשובה כעת. נסו שוב.",
      fallback: true,
      provider,
    });
  }
}
