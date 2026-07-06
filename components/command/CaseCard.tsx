"use client";

import { MapPin, AlertTriangle, Repeat, Camera, Zap } from "lucide-react";
import { RED_LIGHT_META } from "@/lib/commandCenter/triage";
import { SlaClock, SlaBar } from "./SlaClock";
import type { EnrichedCase } from "@/context/CommandCenterContext";

const STAGE_LABEL: Record<string, string> = {
  detected: "נקלט",
  triaged: "סווג",
  dispatched: "שוגר צוות",
  in_field: "בטיפול בשטח",
  resolved: "טופל",
};

export function CaseCard({
  c,
  selected,
  onClick,
}: {
  c: EnrichedCase;
  selected: boolean;
  onClick: () => void;
}) {
  const hasRed = c.redLights.length > 0;
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border bg-white p-3 text-right transition-all hover:shadow-md ${
        selected ? "border-[#1f5fa6] ring-2 ring-[#1f5fa6]/20" : "border-[#e2e2e2]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <SlaClock sla={c.sla} size="sm" />
        <div className="flex items-center gap-1.5 text-[11px] text-[#888]">
          {c.source === "camera" && <Camera size={13} className="text-[#7c3aed]" />}
          <span>{c.requestNumber}</span>
        </div>
      </div>

      <div className="mt-2 flex items-start gap-1.5">
        {c.hazard && <AlertTriangle size={15} className="mt-0.5 shrink-0 text-[#dc2626]" />}
        <p className="text-sm font-semibold leading-snug text-[#1a1a1a] line-clamp-2">{c.description}</p>
      </div>

      <div className="mt-2 flex items-center gap-3 text-[11px] text-[#666]">
        <span className="flex items-center gap-1">
          <MapPin size={12} /> {c.street} {c.houseNumber !== "0" ? c.houseNumber : ""}
        </span>
        <span className="rounded bg-[#f1f5f9] px-1.5 py-0.5 text-[#475569]">{c.deptLabel}</span>
        <span className="text-[#999]">{STAGE_LABEL[c.stage]}</span>
      </div>

      <div className="mt-2">
        <SlaBar sla={c.sla} />
      </div>

      {(hasRed || (c.recurringCount ?? 0) > 1) && (
        <div className="mt-2 flex flex-wrap gap-1">
          {c.redLights.map((r) => (
            <span
              key={r}
              className="inline-flex items-center gap-1 rounded bg-[#fef2f2] px-1.5 py-0.5 text-[10px] font-medium text-[#b91c1c]"
            >
              {r === "recurring" ? <Repeat size={10} /> : <Zap size={10} />}
              {RED_LIGHT_META[r].label}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
