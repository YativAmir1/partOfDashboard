"use client";

import { ListChecks } from "lucide-react";
import { useCityMind } from "@/context/CityMindContext";
import { ActionCard } from "./ActionCard";

export function ActionQueue() {
  const { activeActions } = useCityMind();
  const pending = activeActions.filter((a) => a.status === "recommended").length;

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1e293b] bg-[#0b1220]/40">
      <div className="flex shrink-0 items-center justify-between border-b border-[#1e293b] px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-white">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-[#0ea5b7]/15">
            <ListChecks size={14} className="text-[#0ea5b7]" />
          </span>
          פעולות מומלצות עכשיו
        </h2>
        <span className="rounded-full bg-[#0ea5b7]/15 px-2 py-0.5 text-[11px] font-bold text-[#0ea5b7]">
          {pending} ממתינות
        </span>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {activeActions.map((a) => (
          <ActionCard key={a.id} action={a} />
        ))}
        {activeActions.length === 0 && (
          <p className="py-12 text-center text-sm text-slate-500">אין פעולות פתוחות 🎉</p>
        )}
      </div>
    </section>
  );
}
