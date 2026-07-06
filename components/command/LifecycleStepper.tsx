"use client";

import { Check } from "lucide-react";
import type { CaseStage } from "@/lib/commandCenter/types";

const STEPS: { key: CaseStage; label: string }[] = [
  { key: "detected", label: "נקלט" },
  { key: "triaged", label: "טריאז' AI" },
  { key: "dispatched", label: "שוגר צוות" },
  { key: "in_field", label: "בשטח" },
  { key: "resolved", label: "נסגר ואומת" },
];

const ORDER: CaseStage[] = ["detected", "triaged", "dispatched", "in_field", "resolved"];

/** Horizontal stepper showing the closed treatment loop of a single case. */
export function LifecycleStepper({ stage, dark = false }: { stage: CaseStage; dark?: boolean }) {
  const currentIdx = ORDER.indexOf(stage);
  const idleBg = dark ? "bg-[#1e293b] text-[#64748b]" : "bg-[#e5e7eb] text-[#9ca3af]";
  const idleText = dark ? "text-[#64748b]" : "text-[#9ca3af]";
  const activeBg = dark ? "bg-[#0ea5b7] text-white ring-4 ring-[#0ea5b7]/25" : "bg-[#1f5fa6] text-white ring-4 ring-[#1f5fa6]/15";
  const activeText = dark ? "text-[#0ea5b7]" : "text-[#1f5fa6]";
  const line = dark ? "bg-[#1e293b]" : "bg-[#e5e7eb]";
  return (
    <div className="flex items-center">
      {STEPS.map((s, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <div key={s.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                  done ? "bg-[#16a34a] text-white" : active ? activeBg : idleBg
                }`}
              >
                {done ? <Check size={15} /> : i + 1}
              </span>
              <span
                className={`whitespace-nowrap text-[11px] ${
                  active ? `font-bold ${activeText}` : done ? "text-[#16a34a]" : idleText
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mx-2 h-0.5 flex-1 ${done ? "bg-[#16a34a]" : line}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
