"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, FileText, MessageSquare, Users } from "lucide-react";
import type { ActionRecommendation, LLMGenerationType } from "@/lib/citymind/types";
import { LLM_ACTION_LABEL } from "@/lib/citymind/labels";
import { llmKey, useCityMind } from "@/context/CityMindContext";
import { GeneratedTextCard } from "./GeneratedTextCard";

const BUTTONS: { type: LLMGenerationType; icon: typeof Bot }[] = [
  { type: "explainAction", icon: Bot },
  { type: "teamInstruction", icon: Users },
  { type: "residentUpdate", icon: MessageSquare },
  { type: "executiveSummary", icon: FileText },
];

export function LLMActionPanel({ action }: { action: ActionRecommendation }) {
  const { llm, generate } = useCityMind();
  const [active, setActive] = useState<LLMGenerationType | null>(null);
  const entry = active ? llm[llmKey(action.id, active)] : undefined;
  const resultRef = useRef<HTMLDivElement>(null);

  // Bring the generated result into view as it starts streaming / completes.
  useEffect(() => {
    if (entry?.status === "streaming" || entry?.status === "done") {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [entry?.status, active]);

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {BUTTONS.map(({ type, icon: Icon }) => {
          const isActive = active === type;
          return (
            <button
              key={type}
              onClick={() => {
                setActive(type);
                void generate(action, type);
              }}
              className={`flex items-center justify-center gap-1.5 rounded-lg border px-2.5 py-2 text-[11px] font-semibold transition-colors ${
                isActive
                  ? "border-[#0ea5b7] bg-[#0ea5b7]/15 text-[#0ea5b7]"
                  : "border-[#1e293b] bg-[#0b1220] text-slate-200 hover:bg-[#16223c]"
              }`}
            >
              <Icon size={13} /> {LLM_ACTION_LABEL[type]}
            </button>
          );
        })}
      </div>
      <div ref={resultRef}>
        <GeneratedTextCard entry={entry} />
      </div>
    </div>
  );
}
