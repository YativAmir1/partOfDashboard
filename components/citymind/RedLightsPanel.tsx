"use client";

import { AlertTriangle, ChevronLeft } from "lucide-react";
import { useCityMind } from "@/context/CityMindContext";
import { RED_LIGHTS } from "@/data/cityIntel";
import { districtLabel } from "@/lib/hebrew";
import { Panel } from "./Panel";

export function RedLightsPanel() {
  const { select } = useCityMind();

  return (
    <Panel
      title="אורות אדומים"
      accent="#ef4444"
      icon={<AlertTriangle size={12} className="text-[#ef4444]" />}
      right={<span className="rounded-full bg-[#ef4444]/15 px-2 py-0.5 text-[10px] font-bold text-[#f87171]">{RED_LIGHTS.length}</span>}
    >
      <ul className="space-y-2">
        {RED_LIGHTS.map((rl) => {
          const color = rl.severity === "critical" ? "#ef4444" : "#f59e0b";
          const linked = Boolean(rl.linkedActionId);
          return (
            <li key={rl.id}>
              <button
                onClick={() => rl.linkedActionId && select(rl.linkedActionId)}
                disabled={!linked}
                className={`flex w-full items-start gap-2 rounded-lg border px-2.5 py-2 text-right transition-colors ${
                  linked ? "cursor-pointer hover:bg-[#16223c]" : "cursor-default"
                }`}
                style={{ borderColor: `${color}33`, background: `${color}0f` }}
              >
                <span className="mt-1 h-2 w-2 shrink-0 animate-pulse rounded-full" style={{ background: color }} />
                <span className="flex-1">
                  <span className="block text-[12px] font-medium leading-snug text-slate-200">{rl.title}</span>
                  <span className="text-[10px] text-slate-500">{districtLabel(rl.district)}</span>
                </span>
                {linked && <ChevronLeft size={14} className="mt-0.5 shrink-0 text-slate-500" />}
              </button>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
