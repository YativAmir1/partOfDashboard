"use client";

import { Gauge } from "lucide-react";
import type { KpiTone } from "@/lib/citymind/types";
import { KPIS } from "@/data/cityIntel";
import { Panel } from "./Panel";

const TONE: Record<KpiTone, string> = {
  good: "#4ade80",
  warn: "#fbbf24",
  bad: "#f87171",
  neutral: "#e2e8f0",
};

export function KpiGrid() {
  return (
    <Panel title="מדדים תפעוליים" accent="#0ea5b7" icon={<Gauge size={12} className="text-[#0ea5b7]" />}>
      <div className="grid grid-cols-3 gap-2">
        {KPIS.map((k) => (
          <div key={k.id} className="rounded-lg border border-[#1e293b] bg-[#0b1220] p-2 text-center">
            <p className="text-base font-bold tabular-nums" style={{ color: TONE[k.tone] }}>
              {k.value}
            </p>
            {k.delta && (
              <p className="text-[9px] font-semibold" style={{ color: TONE[k.tone] }}>
                {k.delta}
              </p>
            )}
            <p className="mt-0.5 text-[10px] leading-tight text-slate-400">{k.label}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}
