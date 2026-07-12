"use client";

import { useMemo, useState } from "react";
import { Radar, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { SentimentLevel, ZoneSentiment } from "@/lib/citymind/types";
import { SENTIMENT, SENTIMENT_SIGNALS } from "@/data/cityIntel";
import { SENTIMENT_SOURCE_LABEL, SENTIMENT_TYPE_LABEL } from "@/lib/citymind/labels";
import {
  aggregateSentiment,
  type SourceFilter,
  type TypeFilter,
} from "@/lib/citymind/sentiment";
import { Panel } from "./Panel";

const LEVEL_COLOR: Record<SentimentLevel, string> = {
  positive: "#22c55e",
  neutral: "#eab308",
  negative: "#ef4444",
};

// Sentiment score domain → normalized radius. Center ≈ deep frustration,
// outer edge ≈ satisfied, so problem areas visibly pull the web inward.
const SCORE_MIN = -50;
const SCORE_MAX = 30;
const norm = (score: number) =>
  Math.max(0, Math.min(1, (score - SCORE_MIN) / (SCORE_MAX - SCORE_MIN)));

const CX = 120;
const CY = 96;
const MAX_R = 64;
const RINGS = [0.34, 0.67, 1];

export function SentimentRadar() {
  const [source, setSource] = useState<SourceFilter>("all");
  const [type, setType] = useState<TypeFilter>("all");
  const view = useMemo(() => aggregateSentiment(SENTIMENT_SIGNALS, source, type), [source, type]);
  const filtered = source !== "all" || type !== "all";

  return (
    <Panel title="מדד תחושת שירות" accent="#22c55e" icon={<Radar size={12} className="text-[#22c55e]" />}>
      <div className="mb-3 rounded-lg border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-2.5 py-2 text-[11px] leading-snug text-[#fbbf24]">
        {SENTIMENT.headline}
      </div>

      {/* Filters — by source (מקור) and by type (סוג) */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <FilterSelect
          label="מקור"
          value={source}
          onChange={(v) => setSource(v as SourceFilter)}
          options={[["all", "כל המקורות"], ...Object.entries(SENTIMENT_SOURCE_LABEL)]}
        />
        <FilterSelect
          label="סוג"
          value={type}
          onChange={(v) => setType(v as TypeFilter)}
          options={[["all", "כל הסוגים"], ...Object.entries(SENTIMENT_TYPE_LABEL)]}
        />
      </div>

      <div className="mb-2 flex items-center justify-between text-[10px] text-slate-500">
        <span>{view.totalMentions} אזכורים{filtered ? " (מסונן)" : ""}</span>
        {filtered && (
          <button
            onClick={() => {
              setSource("all");
              setType("all");
            }}
            className="font-medium text-slate-400 transition-colors hover:text-slate-200"
          >
            נקה סינון
          </button>
        )}
      </div>

      {view.totalMentions === 0 ? (
        <div className="rounded-lg border border-[#1e293b] bg-[#0b1220] px-3 py-6 text-center text-[11px] text-slate-500">
          אין נתונים לשילוב הסינון שנבחר
        </div>
      ) : (
        <RadarChart zones={view.zones} />
      )}

      <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[#1e293b] pt-3">
        {view.topics.length === 0 ? (
          <span className="text-[10px] text-slate-500">אין נושאים תואמים</span>
        ) : (
          view.topics.map((t) => {
            const Icon = t.trend === "up" ? TrendingUp : t.trend === "down" ? TrendingDown : Minus;
            return (
              <span
                key={t.topic}
                className="flex items-center gap-1 rounded-md border border-[#1e293b] bg-[#0b1220] px-2 py-0.5 text-[10px] text-slate-300"
              >
                <Icon size={10} style={{ color: LEVEL_COLOR[t.level] }} />
                {t.topic}
                <span className="text-slate-500">{t.mentions}</span>
              </span>
            );
          })
        )}
      </div>
    </Panel>
  );
}

// ─── Filter dropdown ─────────────────────────────────────────────────────────

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <label className="flex items-center gap-1.5 rounded-lg border border-[#1e293b] bg-[#0b1220] px-2 py-1">
      <span className="shrink-0 text-[10px] font-semibold text-slate-500">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`סינון לפי ${label}`}
        className="w-full cursor-pointer bg-transparent text-[11px] font-medium text-slate-200 outline-none"
      >
        {options.map(([val, lbl]) => (
          <option key={val} value={val} className="bg-[#0f1729] text-slate-200">
            {lbl}
          </option>
        ))}
      </select>
    </label>
  );
}

// ─── Radar (spider) chart ────────────────────────────────────────────────────

function RadarChart({ zones }: { zones: ZoneSentiment[] }) {
  const n = zones.length;
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;
  const point = (i: number, r: number) => {
    const a = angle(i);
    return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
  };
  const zoneR = (score: number) => (0.14 + norm(score) * 0.86) * MAX_R;
  const polygon = zones
    .map((z, i) => {
      const p = point(i, zoneR(z.score));
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox="0 0 240 176"
      className="w-full"
      style={{ overflow: "visible" }}
      role="img"
      aria-label="מפת ראדאר של תחושת השירות לפי אזור — ככל שהמצולע קרוב למרכז, התסכול גבוה יותר"
    >
      {RINGS.map((f) => (
        <polygon
          key={f}
          points={zones
            .map((_, i) => {
              const p = point(i, f * MAX_R);
              return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
            })
            .join(" ")}
          fill="none"
          stroke="#1e293b"
          strokeWidth={1}
        />
      ))}
      {zones.map((z, i) => {
        const edge = point(i, MAX_R);
        const lbl = point(i, MAX_R + 13);
        return (
          <g key={z.district}>
            <line x1={CX} y1={CY} x2={edge.x} y2={edge.y} stroke="#1e293b" strokeWidth={1} />
            <text
              x={lbl.x}
              y={lbl.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={7.5}
              fill="#94a3b8"
              style={{ direction: "rtl" }}
            >
              {z.label}
            </text>
          </g>
        );
      })}
      <polygon points={polygon} fill="#22c55e" fillOpacity={0.14} stroke="#22c55e" strokeWidth={1.75} strokeLinejoin="round" />
      {zones.map((z, i) => {
        const p = point(i, zoneR(z.score));
        return <circle key={z.district} cx={p.x} cy={p.y} r={2.4} fill={LEVEL_COLOR[z.level]} stroke="#0f1729" strokeWidth={1} />;
      })}
    </svg>
  );
}
