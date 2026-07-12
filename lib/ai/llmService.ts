// ─── CityMind AI — LLM orchestration ─────────────────────────────────────────
// Selects the active provider, builds the prompt, enforces a timeout, and
// ALWAYS degrades gracefully to static Hebrew fallback text so the demo never breaks.
// NOTE: imported only by the server-side API route — no key ever reaches the client.
import type { AIProviderId, LLMGenerationRequest, LLMGenerationResponse } from "@/lib/citymind/types";
import { selectProvider, type LLMMessages } from "./aiProvider";
import { SYSTEM_PROMPT, buildUserPrompt } from "./prompts";
import { fallbackText } from "./fallbacks";
import { simulateStream, stripForeignScripts, stripReasoningPartial, tidyFinal } from "./stream";

const TIMEOUT_MS = 20_000;

/** Strip chain-of-thought that reasoning models (e.g. Qwen3) emit in <think>…</think>. */
function stripReasoning(text: string): string {
  let out = text.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  if (/<\/think>/i.test(out)) out = out.replace(/^[\s\S]*<\/think>/i, "").trim(); // truncated/unbalanced
  out = out.replace(/<\/?think>/gi, "").trim();
  out = tidyFinal(stripForeignScripts(out));
  return out || text.trim();
}

export async function generateOperationalText(
  req: LLMGenerationRequest,
): Promise<LLMGenerationResponse> {
  const provider = selectProvider();

  // No key for the selected provider → clean, high-quality fallback.
  if (!provider.isConfigured()) {
    return {
      success: false,
      fallback: true,
      provider: "none",
      type: req.type,
      content: fallbackText(req),
    };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const { content, model } = await provider.generate(
      { system: SYSTEM_PROMPT, user: buildUserPrompt(req) },
      controller.signal,
    );
    return { success: true, provider: provider.id, model, type: req.type, content: stripReasoning(content) };
  } catch (err) {
    console.error("[CityMind LLM] generation failed, using fallback:", err);
    return {
      success: false,
      fallback: true,
      provider: provider.id,
      type: req.type,
      content: fallbackText(req),
    };
  } finally {
    clearTimeout(timer);
  }
}

// ─── Streaming path ──────────────────────────────────────────────────────────

/** Events emitted to the API route (serialized as SSE) and consumed by the client. */
export type StreamEvent =
  | { type: "meta"; provider: AIProviderId | "none"; model?: string; fallback: boolean }
  | { type: "delta"; text: string }
  | { type: "done"; content: string };

/** Typewriter-style stream over a finished string — keeps the demo "live". */
async function* fallbackStream(
  content: string,
  provider: AIProviderId | "none",
): AsyncGenerator<StreamEvent> {
  yield { type: "meta", provider, fallback: true };
  for await (const chunk of simulateStream(content)) yield { type: "delta", text: chunk };
  yield { type: "done", content };
}

/**
 * Core streaming engine shared by every LLM feature (per-action text, the city
 * briefing, and the Q&A bar). Streams the model token-by-token through the same
 * chain-of-thought + foreign-script filters, enforces a timeout, and ALWAYS
 * degrades to the simulated fallback stream when no key is configured or the
 * provider fails before producing any output.
 */
export async function* streamWithFallback(
  messages: LLMMessages,
  fallbackContent: string,
  externalSignal?: AbortSignal,
): AsyncGenerator<StreamEvent> {
  const provider = selectProvider();

  if (!provider.isConfigured()) {
    yield* fallbackStream(fallbackContent, "none");
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const onAbort = () => controller.abort();
  externalSignal?.addEventListener("abort", onAbort);

  let started = false;
  try {
    let raw = "";
    let emitted = 0;
    for await (const chunk of provider.generateStream(messages, controller.signal)) {
      if (!started) {
        yield { type: "meta", provider: provider.id, model: provider.model(), fallback: false };
        started = true;
      }
      raw += chunk;
      // Hide chain-of-thought + drop stray foreign-script letters as it streams;
      // both filters are stream-stable, so only newly-revealed clean text is emitted.
      const clean = stripForeignScripts(stripReasoningPartial(raw));
      if (clean.length > emitted) {
        yield { type: "delta", text: clean.slice(emitted) };
        emitted = clean.length;
      }
    }
    if (!started) throw new Error("empty stream");
    const finalContent = tidyFinal(stripForeignScripts(stripReasoningPartial(raw))) || raw.trim();
    yield { type: "done", content: finalContent };
  } catch (err) {
    console.error("[CityMind LLM] stream failed, using fallback:", err);
    // Only safe to swap in the fallback if nothing was shown yet.
    if (!started) {
      yield* fallbackStream(fallbackContent, provider.id);
    } else {
      yield { type: "done", content: "" };
    }
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener("abort", onAbort);
  }
}

/**
 * Stream operational text as SSE-ready events. Mirrors {@link generateOperationalText}
 * but token-by-token. Thin wrapper over {@link streamWithFallback}.
 */
export function streamOperationalText(
  req: LLMGenerationRequest,
  externalSignal?: AbortSignal,
): AsyncGenerator<StreamEvent> {
  return streamWithFallback(
    { system: SYSTEM_PROMPT, user: buildUserPrompt(req) },
    fallbackText(req),
    externalSignal,
  );
}
