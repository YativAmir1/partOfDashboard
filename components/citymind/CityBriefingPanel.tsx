"use client";

// ─── CityMind AI — executive briefing (whole-queue synthesis) ─────────────────
// The high-value LLM view: instead of rephrasing one card, it reasons across the
// entire live queue + red-lights + KPIs + sentiment into a prioritized manager
// briefing. Calls the secure /api/ai/briefing streaming route.
import { useRef, useState } from "react";
import { ClipboardList, RefreshCw, Sparkles } from "lucide-react";
import type { LLMEntry } from "@/context/CityMindContext";
import { useCityMind } from "@/context/CityMindContext";
import { streamLLM } from "@/lib/ai/sseClient";
import { Panel } from "./Panel";
import { GeneratedTextCard } from "./GeneratedTextCard";

export function CityBriefingPanel() {
  const { activeActions } = useCityMind();
  const [entry, setEntry] = useState<LLMEntry | undefined>();
  const abortRef = useRef<AbortController | null>(null);

  const run = () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    void streamLLM("/api/ai/briefing", { actions: activeActions }, setEntry, controller.signal);
  };

  const busy = entry?.status === "loading" || entry?.status === "streaming";

  return (
    <Panel
      title="תדריך מנהלים חכם"
      icon={<ClipboardList size={13} className="text-[#0ea5b7]" />}
      right={
        <button
          onClick={run}
          disabled={busy}
          className="flex items-center gap-1.5 rounded-lg border border-[#0ea5b7]/40 bg-[#0ea5b7]/10 px-2.5 py-1 text-[11px] font-semibold text-[#0ea5b7] transition-colors hover:bg-[#0ea5b7]/20 disabled:opacity-50"
        >
          {entry ? <RefreshCw size={12} className={busy ? "animate-spin" : ""} /> : <Sparkles size={12} />}
          {entry ? "רענון" : "הפקת תדריך"}
        </button>
      }
    >
      {entry ? (
        <GeneratedTextCard entry={entry} />
      ) : (
        <p className="px-0.5 text-[12px] leading-relaxed text-slate-400">
          סינתזה חיה על פני כל תור הפעולות, האורות האדומים ותחושת השירות — מה דחוף, מה לאשר קודם, ולמה.
        </p>
      )}
    </Panel>
  );
}
