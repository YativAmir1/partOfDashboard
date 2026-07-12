// ─── Anthropic provider — Messages API ───────────────────────────────────────
// Excellent Hebrew. This is also the natural PRODUCTION target: the RFP states
// Ramat Gan already uses Anthropic for Hebrew + AWS Bedrock/Nova inside נימבוס,
// so swapping the demo provider for a private Bedrock-hosted model is a one-env change.
// Server-side only: reads ANTHROPIC_API_KEY / ANTHROPIC_MODEL from env.
import type { LLMMessages, LLMProvider, LLMResult } from "../aiProvider";
import { sseData } from "../stream";

const ENDPOINT = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = "claude-sonnet-5";

export const anthropicProvider: LLMProvider = {
  id: "anthropic",
  isConfigured: () => Boolean(process.env.ANTHROPIC_API_KEY),
  model: () => process.env.ANTHROPIC_MODEL || DEFAULT_MODEL,
  async generate(messages: LLMMessages, signal: AbortSignal): Promise<LLMResult> {
    const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 700,
        temperature: 0.4,
        system: messages.system,
        messages: [{ role: "user", content: messages.user }],
      }),
      signal,
    });
    if (!res.ok) {
      throw new Error(`Anthropic ${res.status}: ${await res.text().catch(() => "")}`);
    }
    const data = await res.json();
    const content = (data?.content?.[0]?.text ?? "").trim();
    if (!content) throw new Error("Anthropic: empty response");
    return { content, model };
  },
  async *generateStream(messages: LLMMessages, signal: AbortSignal): AsyncGenerator<string> {
    const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 700,
        temperature: 0.4,
        stream: true,
        system: messages.system,
        messages: [{ role: "user", content: messages.user }],
      }),
      signal,
    });
    if (!res.ok) {
      throw new Error(`Anthropic ${res.status}: ${await res.text().catch(() => "")}`);
    }
    for await (const payload of sseData(res, signal)) {
      let json: { type?: string; delta?: { type?: string; text?: string } };
      try {
        json = JSON.parse(payload);
      } catch {
        continue;
      }
      if (json?.type === "content_block_delta" && json.delta?.type === "text_delta") {
        const text = json.delta.text ?? "";
        if (text) yield text;
      }
    }
  },
};
