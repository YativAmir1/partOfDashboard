// ─── CityMind AI — streaming helpers ─────────────────────────────────────────
// Small, dependency-free utilities shared by the streaming providers and the
// LLM service. Server-side only (imported by the API route path).

/**
 * Read an SSE (`text/event-stream`) response body line by line and yield the
 * raw payload of each `data:` line (the JSON string, or "[DONE]"). Blank lines
 * and non-data fields (`event:`, `id:` …) are ignored.
 */
export async function* sseData(res: Response, signal?: AbortSignal): AsyncGenerator<string> {
  const body = res.body;
  if (!body) throw new Error("streaming response has no body");
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      if (signal?.aborted) break;
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let nl: number;
      // SSE frames are newline-delimited; process every complete line.
      while ((nl = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (line.startsWith("data:")) {
          const payload = line.slice(5).trim();
          if (payload) yield payload;
        }
      }
    }
    const tail = buffer.trim();
    if (tail.startsWith("data:")) {
      const payload = tail.slice(5).trim();
      if (payload) yield payload;
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Simulate a typing stream from a finished string — used for the static Hebrew
 * fallback so the demo looks "live" even with no API key configured. Emits a
 * few words at a time with a small delay.
 */
export async function* simulateStream(text: string): AsyncGenerator<string> {
  const tokens = text.match(/\S+\s*/g) ?? [text];
  const GROUP = 2;
  for (let i = 0; i < tokens.length; i += GROUP) {
    yield tokens.slice(i, i + GROUP).join("");
    await new Promise((r) => setTimeout(r, 38));
  }
}

/**
 * Incrementally hide chain-of-thought while a stream is in flight. Removes any
 * closed `<think>…</think>` blocks and, if a `<think>` is still open (no closing
 * tag yet), drops everything from it onward so reasoning never leaks mid-stream.
 */
export function stripReasoningPartial(raw: string): string {
  let out = raw.replace(/<think>[\s\S]*?<\/think>/gi, "");
  const open = out.search(/<think>/i);
  if (open !== -1) out = out.slice(0, open);
  return out.replace(/<\/?think>/gi, "");
}

/**
 * Remove letters from scripts other than Hebrew/Latin — models (notably Qwen)
 * occasionally emit a stray CJK/Hangul/Cyrillic token despite the Hebrew-only
 * instruction. Digits, punctuation, symbols and whitespace are untouched so
 * "SLA", "AI", "%", numbers and Hebrew punctuation all survive.
 *
 * Per-character and thus stream-stable: `strip(a + b) === strip(a) + strip(b)`,
 * so applying it to the growing buffer never rewrites already-emitted text.
 */
export function stripForeignScripts(text: string): string {
  return text.replace(/(?![\p{Script=Hebrew}\p{Script=Latin}])\p{L}/gu, "");
}

/**
 * Final tidy-up applied ONCE to completed text (never mid-stream, since it is not
 * per-character stable): drops empty brackets and collapses whitespace left behind
 * after {@link stripForeignScripts} removed a stray foreign token.
 */
export function tidyFinal(text: string): string {
  return text
    .replace(/[（(]\s*[)）]/g, "") // empty () left by a removed token
    .replace(/[ \t]+([,.;:!?])/g, "$1") // stray space before punctuation
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}
