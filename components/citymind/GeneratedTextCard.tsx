"use client";

import { Fragment } from "react";
import { Loader2, Sparkles } from "lucide-react";
import type { LLMEntry } from "@/context/CityMindContext";

// Minimal, dependency-free markdown-lite: **bold**, normalized bullets, no stray
// heading hashes. Keeps live LLM output tidy without pulling in a markdown lib.
function renderRich(text: string) {
  const clean = text.replace(/^#{1,6}\s+/gm, "").replace(/^\s*[-*]\s+/gm, "• ");
  return clean.split(/(\*\*[^*]+\*\*)/g).map((seg, i) => {
    if (seg.startsWith("**") && seg.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-white">
          {seg.slice(2, -2)}
        </strong>
      );
    }
    return <Fragment key={i}>{seg}</Fragment>;
  });
}

const PROVIDER_LABEL: Record<string, string> = {
  groq: "Groq/Llama",
  anthropic: "Anthropic",
  gemini: "Gemini",
  xai: "Grok (xAI)",
  none: "דמו",
};

export function GeneratedTextCard({ entry }: { entry?: LLMEntry }) {
  if (!entry) return null;

  // Waiting for the first token (connection open, nothing streamed yet).
  if (entry.status === "loading" || (entry.status === "streaming" && !entry.content)) {
    return (
      <div className="mt-2 flex items-center gap-2 rounded-xl border border-[#1e293b] bg-[#0b1220] px-3 py-3 text-[13px] text-slate-300">
        <Loader2 size={15} className="animate-spin text-[#0ea5b7]" />
        מפיק תשובה מבוססת LLM…
      </div>
    );
  }

  const streaming = entry.status === "streaming";

  return (
    <div className="mt-2 rounded-xl border border-[#1e293b] bg-[#0b1220] p-3">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Sparkles size={12} className="text-[#0ea5b7]" />
        <span className="text-[10px] font-medium text-slate-400">
          {entry.fallback
            ? "מוצג נוסח דמו"
            : `${streaming ? "מפיק בזמן אמת" : "נוצר על ידי LLM"}${
                entry.provider && entry.provider !== "none"
                  ? ` — ${PROVIDER_LABEL[entry.provider] ?? entry.provider}`
                  : ""
              }`}
        </span>
        {streaming && (
          <span className="mr-auto flex items-center gap-1 text-[10px] text-[#0ea5b7]">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#0ea5b7]" />
            חי
          </span>
        )}
      </div>
      <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-slate-200">
        {renderRich(entry.content)}
        {streaming && <span className="llm-caret" aria-hidden />}
      </p>
    </div>
  );
}
