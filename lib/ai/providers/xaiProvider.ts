// ─── xAI (Grok) provider — OpenAI-compatible chat completions ────────────────
// api.x.ai. Grok is xAI's model (keys start with `xai-`) — NOT the Groq inference
// service (api.groq.com, keys `gsk_`). Server-side only: reads XAI_API_KEY / XAI_MODEL.
import type { LLMMessages, LLMProvider, LLMResult } from "../aiProvider";
import { sseData } from "../stream";

const ENDPOINT = "https://api.x.ai/v1/chat/completions";
const DEFAULT_MODEL = "grok-3";

export const xaiProvider: LLMProvider = {
  id: "xai",
  isConfigured: () => Boolean(process.env.XAI_API_KEY),
  model: () => process.env.XAI_MODEL || DEFAULT_MODEL,
  async generate(messages: LLMMessages, signal: AbortSignal): Promise<LLMResult> {
    const model = process.env.XAI_MODEL || DEFAULT_MODEL;
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 700,
        messages: [
          { role: "system", content: messages.system },
          { role: "user", content: messages.user },
        ],
      }),
      signal,
    });
    if (!res.ok) {
      throw new Error(`xAI ${res.status}: ${await res.text().catch(() => "")}`);
    }
    const data = await res.json();
    const content = (data?.choices?.[0]?.message?.content ?? "").trim();
    if (!content) throw new Error("xAI: empty response");
    return { content, model };
  },
  async *generateStream(messages: LLMMessages, signal: AbortSignal): AsyncGenerator<string> {
    const model = process.env.XAI_MODEL || DEFAULT_MODEL;
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        max_tokens: 700,
        stream: true,
        messages: [
          { role: "system", content: messages.system },
          { role: "user", content: messages.user },
        ],
      }),
      signal,
    });
    if (!res.ok) {
      throw new Error(`xAI ${res.status}: ${await res.text().catch(() => "")}`);
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
