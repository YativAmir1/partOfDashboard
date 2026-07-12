// ─── CityMind AI — provider abstraction ──────────────────────────────────────
// One interface, swappable concrete providers. For the demo we ship Groq (Qwen),
// Anthropic and Gemini. In production this layer can be replaced by a private /
// local open-weight model running in the municipality's controlled environment
// (נימבוס / AWS Bedrock) so sensitive data never leaves it — the UI never changes.
import type { AIProviderId } from "@/lib/citymind/types";
import { groqProvider } from "./providers/groqProvider";
import { anthropicProvider } from "./providers/anthropicProvider";
import { geminiProvider } from "./providers/geminiProvider";
import { xaiProvider } from "./providers/xaiProvider";

export interface LLMMessages {
  system: string;
  user: string;
}

export interface LLMResult {
  content: string;
  model: string;
}

export interface LLMProvider {
  id: AIProviderId;
  /** True when an API key is configured for this provider. */
  isConfigured(): boolean;
  /** The model id in use (env override, else a sensible default). */
  model(): string;
  /** Call the model. Throws on any error — the service layer handles fallback. */
  generate(messages: LLMMessages, signal: AbortSignal): Promise<LLMResult>;
  /**
   * Stream the model's output as raw text chunks. Throws on any error before the
   * first chunk — the service layer degrades to the simulated fallback stream.
   */
  generateStream(messages: LLMMessages, signal: AbortSignal): AsyncGenerator<string>;
}

const PROVIDERS: Record<AIProviderId, LLMProvider> = {
  groq: groqProvider,
  anthropic: anthropicProvider,
  gemini: geminiProvider,
  xai: xaiProvider,
};

/** Pick the active provider from LLM_PROVIDER (defaults to Gemini — free tier). */
export function selectProvider(): LLMProvider {
  const id = (process.env.LLM_PROVIDER ?? "gemini").toLowerCase();
  return PROVIDERS[id as AIProviderId] ?? geminiProvider;
}
