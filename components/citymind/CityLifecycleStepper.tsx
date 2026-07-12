"use client";

import { Check } from "lucide-react";
import type { ActionStatus } from "@/lib/citymind/types";
import { LIFECYCLE_STEPS, STATUS_TO_STEP, stepIndex } from "@/lib/citymind/labels";

// "שרשרת טיפול סגורה" — the 7-step closed loop.
export function CityLifecycleStepper({ status }: { status: ActionStatus }) {
  const currentIdx = stepIndex(STATUS_TO_STEP[status]);
  const doneThrough = status === "verified" ? 5 : currentIdx - 1; // last completed step index
  const activeIdx = status === "verified" ? 6 : currentIdx; // "learned" active once verified

  return (
    <div className="flex" dir="rtl">
      {LIFECYCLE_STEPS.map((s, idx) => {
        const done = idx <= doneThrough;
        const active = idx === activeIdx;
        return (
          <div key={s.key} className="relative flex flex-1 flex-col items-center">
            {idx > 0 && (
              <span
                className="absolute top-3 right-1/2 h-0.5 w-full"
                style={{ background: idx <= doneThrough ? "#0ea5b7" : "#1e293b" }}
              />
            )}
            <span
              className={`relative z-10 grid h-6 w-6 place-items-center rounded-full text-[10px] font-bold ${
                active ? "animate-pulse" : ""
              }`}
              style={
                done
                  ? { background: "#0ea5b7", color: "#031316" }
                  : active
                    ? { background: "#0f1729", color: "#0ea5b7", boxShadow: "0 0 0 2px #0ea5b7" }
                    : { background: "#0f1729", color: "#64748b", boxShadow: "0 0 0 1px #1e293b" }
              }
            >
              {done ? <Check size={12} /> : idx + 1}
            </span>
            <span
              className="mt-1.5 text-center text-[9px] leading-tight"
              style={{ color: done || active ? "#cbd5e1" : "#64748b" }}
            >
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
