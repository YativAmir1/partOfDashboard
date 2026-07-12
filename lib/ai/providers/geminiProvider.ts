// ─── Google Gemini provider — Generative Language API ────────────────────────
// Suggested live default for the demo (free tier, reasonable Hebrew).
// Server-side only: reads GEMINI_API_KEY / GEMINI_MODEL from env.
import type { LLMMessages, LLMProvider, LLMResult } from "../aiProvider";
import { sseData } from "../stream";

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-2.0-flash";

export const geminiProvider: LLMProvider = {
  id: "gemini",
  isConfigured: () => Boolean(process.env.GEMINI_API_KEY),
  model: () => process.env.GEMINI_MODEL || DEFAULT_MODEL,
  async generate(messages: LLMMessages, signal: AbortSignal): Promise<LLMResult> {
    const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
    const url = `${BASE}/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: messages.system }] },
        contents: [{ role: "user", parts: [{ text: messages.user }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 700 },
      }),
      signal,
    });
    if (!res.ok) {
      throw new Error(`Gemini ${res.status}: ${await res.text().catch(() => "")}`);
    }
    const data = await res.json();
    const parts = data?.candidates?.[0]?.content?.parts ?? [];
    const content = parts.map((p: { text?: string }) => p.text ?? "").join("").trim();
    if (!content) throw new Error("Gemini: empty response");
    return { content, model };
  },
  async *generateStream(messages: LLMMessages, signal: AbortSignal): AsyncGenerator<string> {
    const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
    const url = `${BASE}/${model}:streamGenerateContent?alt=sse&key=${process.env.GEMINI_API_KEY}`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: messages.system }] },
        contents: [{ role: "user", parts: [{ text: messages.user }] }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 700 },
      }),
      signal,
    });
    if (!res.ok) {
      throw new Error(`Gemini ${res.status}: ${await res.text().catch(() => "")}`);
    }
    for await (const payload of sseData(res, signal)) {
      let json: { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      try {
        json = JSON.parse(payload);
      } catch {
        continue;
      }
      const parts = json?.candidates?.[0]?.content?.parts ?? [];
      const text = parts.map((p) => p.text ?? "").join("");
      if (text) yield text;
    }
  },
};
