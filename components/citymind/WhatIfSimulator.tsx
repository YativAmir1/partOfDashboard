"use client";

import { useMemo, useState } from "react";
import { Zap, RotateCcw } from "lucide-react";
import {
  WHATIF_INPUT_META,
  WHATIF_PRESETS,
  computeWhatIf,
  type WhatIfInputs,
} from "@/lib/citymind/whatif";
import { Panel } from "./Panel";

const DEFAULT_INPUTS = WHATIF_PRESETS[0].inputs;

/** Does the current input set exactly match a named preset? */
function matchingPreset(inp: WhatIfInputs): string | null {
  const hit = WHATIF_PRESETS.find(
    (p) =>
      p.inputs.extraTeams === inp.extraTeams &&
      p.inputs.extraShiftHours === inp.extraShiftHours &&
      p.inputs.proactiveTickets === inp.proactiveTickets,
  );
  return hit?.id ?? null;
}

export function WhatIfSimulator() {
  const [inputs, setInputs] = useState<WhatIfInputs>(DEFAULT_INPUTS);
  const result = useMemo(() => computeWhatIf(inputs), [inputs]);
  const activePreset = matchingPreset(inputs);
  const dirty = inputs.extraTeams + inputs.extraShiftHours + inputs.proactiveTickets > 0;

  const setKey = (key: keyof WhatIfInputs, value: number) =>
    setInputs((prev) => ({ ...prev, [key]: value }));

  const metrics = [
    { label: "ירידה צפויה בפניות", value: `${result.complaintsReductionPct}%`, color: "#4ade80" },
    { label: "שיפור SLA", value: `${result.slaImprovementPct}%`, color: "#0ea5b7" },
    { label: "חיסכון זמן צוותים", value: `${result.teamTimeSavedMin} דק׳`, color: "#a78bfa" },
    { label: "רמת ביטחון AI", value: `${result.aiConfidence}%`, color: "#fbbf24" },
  ];

  const inputSig = `${inputs.extraTeams}-${inputs.extraShiftHours}-${inputs.proactiveTickets}`;

  return (
    <Panel
      title="סימולציית השפעה"
      accent="#a78bfa"
      icon={<Zap size={12} className="text-[#a78bfa]" />}
      right={
        dirty ? (
          <button
            onClick={() => setInputs({ extraTeams: 0, extraShiftHours: 0, proactiveTickets: 0 })}
            className="flex items-center gap-1 text-[10px] font-medium text-slate-400 transition-colors hover:text-slate-200"
          >
            <RotateCcw size={11} /> איפוס
          </button>
        ) : undefined
      }
    >
      {/* Preset quick-set chips */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {WHATIF_PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => setInputs(p.inputs)}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-medium transition-colors ${
              p.id === activePreset
                ? "bg-[#a78bfa] text-[#1a1030]"
                : "border border-[#1e293b] bg-[#0b1220] text-slate-300 hover:bg-[#16223c]"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Levers */}
      <div className="mb-3 space-y-2.5">
        {WHATIF_INPUT_META.map((m) => (
          <div key={m.key}>
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <label htmlFor={`wi-${m.key}`} className="text-slate-300">
                {m.label}
              </label>
              <span className="font-bold tabular-nums" style={{ color: m.color }}>
                {inputs[m.key]} <span className="text-[9px] font-normal text-slate-500">{m.unit}</span>
              </span>
            </div>
            <input
              id={`wi-${m.key}`}
              type="range"
              dir="ltr"
              min={m.min}
              max={m.max}
              step={m.step}
              value={inputs[m.key]}
              onChange={(e) => setKey(m.key, Number(e.target.value))}
              aria-label={m.label}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-[#1e293b]"
              style={{ accentColor: m.color }}
            />
          </div>
        ))}
      </div>

      {/* Projection chart — baseline vs projected complaints over the next 6h */}
      <ProjectionChart
        baseline={result.baselineHourly}
        projected={result.projectedHourly}
        prevented={result.complaintsPrevented}
      />

      {/* Impact metrics */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-lg border border-[#1e293b] bg-[#0b1220] p-2.5">
            <p
              key={`${inputSig}-${m.label}`}
              className="count-up text-lg font-bold tabular-nums"
              style={{ color: m.color }}
            >
              {m.value}
            </p>
            <p className="text-[10px] leading-tight text-slate-400">{m.label}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

// ─── Inline SVG projection chart (no chart lib) ──────────────────────────────

const HOURS = ["18", "19", "20", "21", "22", "23"];

function ProjectionChart({
  baseline,
  projected,
  prevented,
}: {
  baseline: number[];
  projected: number[];
  prevented: number;
}) {
  const W = 236;
  const H = 92;
  const padX = 6;
  const padTop = 8;
  const padBottom = 16;
  const maxY = Math.max(...baseline) * 1.12;
  const n = baseline.length;

  const x = (i: number) => padX + (i * (W - 2 * padX)) / (n - 1);
  const y = (v: number) => padTop + (1 - v / maxY) * (H - padTop - padBottom);

  const line = (arr: number[]) => arr.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const area = (arr: number[]) =>
    `${x(0)},${H - padBottom} ${line(arr)} ${x(n - 1)},${H - padBottom}`;

  return (
    <div className="rounded-lg border border-[#1e293b] bg-[#0b1220] p-2.5">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[10px] font-medium text-slate-400">פניות צפויות · 6 שעות קרובות</span>
        {prevented > 0 && (
          <span className="text-[10px] font-bold text-[#4ade80]">−{prevented} פניות נמנעות</span>
        )}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`תחזית פניות: ${prevented} פניות נמנעות בזכות המהלך`}>
        {/* projected area fill */}
        <polygon points={area(projected)} fill="#0ea5b7" opacity={0.16} />
        {/* baseline (do-nothing) — dashed */}
        <polyline
          points={line(baseline)}
          fill="none"
          stroke="#64748b"
          strokeWidth={1.5}
          strokeDasharray="3 3"
          strokeLinejoin="round"
        />
        {/* projected — solid */}
        <polyline
          points={line(projected)}
          fill="none"
          stroke="#0ea5b7"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {projected.map((v, i) => (
          <circle key={i} cx={x(i)} cy={y(v)} r={1.8} fill="#0ea5b7" />
        ))}
        {/* hour labels */}
        {HOURS.map((h, i) => (
          <text key={h} x={x(i)} y={H - 4} textAnchor="middle" fontSize={7} fill="#475569">
            {h}
          </text>
        ))}
      </svg>
      <div className="mt-1 flex items-center gap-3 text-[9px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-3 rounded bg-[#0ea5b7]" /> עם המהלך
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-0.5 w-3 rounded bg-[#64748b]" style={{ borderStyle: "dashed" }} /> ללא שינוי
        </span>
      </div>
    </div>
  );
}
