// ─── Groq provider (DEMO) — OpenAI-compatible chat completions ────────────────
// Demo provider only. Replaceable via the LLMProvider interface (see aiProvider.ts).
// Server-side only: reads GROQ_API_KEY / GROQ_MODEL from env; the key never
// reaches the browser (this module is imported solely by the API route).
// Default is an open-weight, non-reasoning model (Llama 3.3 70B) — stable Hebrew,
// no <think> spirals. The same weights can later run on-prem; the UI never changes.
import type { LLMMessages, LLMProvider, LLMResult } from "../aiProvider";
import { sseData } from "../stream";

const ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_MODEL = "llama-3.3-70b-versatile";

export const groqProvider: LLMProvider = {
  id: "groq",
  isConfigured: () => Boolean(process.env.GROQ_API_KEY),
  model: () => process.env.GROQ_MODEL || DEFAULT_MODEL,
  async generate(messages: LLMMessages, signal: AbortSignal): Promise<LLMResult> {
    const model = process.env.GROQ_MODEL || DEFAULT_MODEL;
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        // Hebrew is token-expensive on these tokenizers (~1 token/char), so a
        // multi-section city briefing needs generous headroom to avoid mid-word cutoff.
        max_tokens: 2048,
        messages: [
          { role: "system", content: messages.system },
          { role: "user", content: messages.user },
        ],
      }),
      signal,
    });
    if (!res.ok) {
      throw new Error(`Groq ${res.status}: ${await res.text().catch(() => "")}`);
    }
    const data = await res.json();
    const content = (data?.choices?.[0]?.message?.content ?? "").trim();
    if (!content) throw new Error("Groq: empty response");
    return { content, model };
  },
  async *generateStream(messages: LLMMessages, signal: AbortSignal): AsyncGenerator<string> {
    const model = process.env.GROQ_MODEL || DEFAULT_MODEL;
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        // Hebrew is token-expensive on these tokenizers (~1 token/char), so a
        // multi-section city briefing needs generous headroom to avoid mid-word cutoff.
        max_tokens: 2048,
        stream: true,
        messages: [
          { role: "system", content: messages.system },
          { role: "user", content: messages.user },
        ],
      }),
      signal,
    });
    if (!res.ok) {
      throw new Error(`Groq ${res.status}: ${await res.text().catch(() => "")}`);
    }
    for await (const payload of sseData(res, signal)) {
      if (payload === "[DONE]") break;
      let json: { choices?: { delta?: { content?: string } }[] };
      try {
        json = JSON.parse(payload);
      } catch {
        continue;
      }
      const text = json?.choices?.[0]?.delta?.content ?? "";
      if (text) yield text;
    }
  },
};
