"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, LogOut, Cpu } from "lucide-react";
import { useCityMind } from "@/context/CityMindContext";
import { DATA_SOURCES } from "@/data/cityIntel";
import { CityMindThemeToggle } from "./CityMindThemeToggle";
import { AskBar } from "./AskBar";

interface LlmStatus {
  configured: boolean;
  provider: string;
  model: string | null;
}

const PROVIDER_LABEL: Record<string, string> = {
  groq: "Groq/Llama",
  anthropic: "Anthropic",
  gemini: "Gemini",
  xai: "Grok (xAI)",
  none: "דמו",
};

export function CommandBar() {
  const { now } = useCityMind();
  const [llm, setLlm] = useState<LlmStatus | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/ai/generate")
      .then((r) => r.json())
      .then((d) => alive && setLlm(d))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const time = now.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-[#1e293b] bg-[#0f1729] px-5">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#0ea5b7]/15 ring-1 ring-[#0ea5b7]/30">
          <Sparkles size={20} className="text-[#0ea5b7]" />
        </div>
        <div>
          <h1 className="flex items-center gap-2 text-base font-bold leading-none text-white">
            CityMind AI
            <span className="rounded bg-[#0ea5b7]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[#0ea5b7]">
              מערכת הפעלה עירונית
            </span>
          </h1>
          <p className="mt-1 text-[11px] text-slate-400">
            רמת גן | שפ״ע ושירות לתושב · מתובנות לפעולות בזמן אמת
          </p>
        </div>
      </div>

      {/* Natural-language Q&A over the live city data */}
      <AskBar />

      {/* Data-source status */}
      <div className="hidden items-center gap-1.5 2xl:flex">
        {DATA_SOURCES.map((s) => (
          <span
            key={s.id}
            className="flex items-center gap-1 rounded-md border border-[#1e293b] bg-[#0b1220] px-2 py-1 text-[10px] text-slate-300"
            title={s.health === "online" ? "מחובר" : s.health === "degraded" ? "חלקי" : "מנותק"}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                s.health === "online" ? "bg-[#22c55e]" : s.health === "degraded" ? "bg-[#f59e0b]" : "bg-[#ef4444]"
              }`}
            />
            {s.label}
          </span>
        ))}
      </div>

      {/* Status cluster */}
      <div className="flex items-center gap-3">
        <span className="hidden items-center gap-1.5 rounded-full bg-[#16a34a]/15 px-2.5 py-1 text-[11px] font-semibold text-[#4ade80] lg:flex">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#4ade80]" /> מערכת פעילה
        </span>

        <span
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            llm?.configured ? "bg-[#0ea5b7]/15 text-[#0ea5b7]" : "bg-[#334155]/60 text-slate-300"
          }`}
        >
          <Cpu size={13} />
          {llm?.configured
            ? `LLM פעיל — ${PROVIDER_LABEL[llm.provider] ?? llm.provider}`
            : "מצב דמו — תשובות AI מדומות"}
        </span>

        <span className="font-mono text-sm font-semibold tabular-nums text-white">{time}</span>

        <CityMindThemeToggle />

        <Link
          href="/overview"
          className="flex items-center gap-1.5 rounded-lg border border-[#1e293b] bg-[#0b1220] px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-[#16223c]"
        >
          <LogOut size={14} /> יציאה למערכת
        </Link>
      </div>
    </header>
  );
}
