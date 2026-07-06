"use client";

import { TIER_META } from "@/lib/commandCenter/sla";
import type { SlaState } from "@/lib/commandCenter/types";

/** A traffic-light SLA pill with the live remaining/overdue time. */
export function SlaClock({ sla, size = "md" }: { sla: SlaState; size?: "sm" | "md" }) {
  const meta = TIER_META[sla.tier];
  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs";
  const pulse = sla.tier === "critical";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${pad}`}
      style={{ background: meta.bg, color: meta.text, border: `1px solid ${meta.border}` }}
    >
      <span
        className={`inline-block rounded-full ${pulse ? "animate-pulse" : ""}`}
        style={{ width: 7, height: 7, background: meta.dot }}
      />
      {meta.label} · {sla.label}
    </span>
  );
}

/** Thin progress bar showing how far the case is through its SLA budget. */
export function SlaBar({ sla }: { sla: SlaState }) {
  const meta = TIER_META[sla.tier];
  const pct = Math.min(100, sla.ratio * 100);
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#eee]">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: meta.dot }} />
    </div>
  );
}
