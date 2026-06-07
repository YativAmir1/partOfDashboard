"use client";

import { Map, Flame, Route, AlertTriangle, Clock } from "lucide-react";
import type { HeatmapSource } from "@/lib/types";

export type MapViewMode = "map" | "heatmap";

const HEATMAP_SOURCES: { id: HeatmapSource; label: string; icon: React.ReactNode; hotLabel: string; coldLabel: string }[] = [
  { id: "incidents",       label: "תקריות",         icon: <Flame size={11} />,         hotLabel: "ריכוז אירועים",  coldLabel: "אזור נקי" },
  { id: "route_coverage",  label: "כיסוי מסלולים",  icon: <Route size={11} />,         hotLabel: "כיסוי מרובה",   coldLabel: "פער שירות" },
  { id: "route_problems",  label: "ריכוז בעיות",    icon: <AlertTriangle size={11} />, hotLabel: "ריבוי פניות",   coldLabel: "אזור תקין" },
  { id: "route_frequency", label: "תדירות שירות",   icon: <Clock size={11} />,         hotLabel: "שירות תכוף",    coldLabel: "שירות נדיר" },
];

interface Props {
  mode: MapViewMode;
  onToggle: () => void;
  heatmapSource: HeatmapSource;
  onHeatmapSourceChange: (source: HeatmapSource) => void;
}

export function MapViewToggle({ mode, onToggle, heatmapSource, onHeatmapSourceChange }: Props) {
  const active = HEATMAP_SOURCES.find((s) => s.id === heatmapSource);

  return (
    <div className="flex flex-col gap-1.5" style={{ direction: "rtl" }}>
      {/* Primary toggle */}
      <div
        className="flex items-center rounded-xl overflow-hidden backdrop-blur-sm"
        style={{ border: "1px solid #d0d0d0", background: "rgba(255,255,255,0.95)" }}
      >
        <button
          onClick={() => mode !== "map" && onToggle()}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all"
          style={{
            background: mode === "map" ? "#1f5fa6" : "transparent",
            color:      mode === "map" ? "#ffffff" : "#585858",
          }}
        >
          <Map size={13} />
          מפה
        </button>
        <div className="w-px self-stretch bg-[#d0d0d0]" />
        <button
          onClick={() => mode !== "heatmap" && onToggle()}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold transition-all"
          style={{
            background: mode === "heatmap" ? "#d96350" : "transparent",
            color:      mode === "heatmap" ? "#ffffff" : "#585858",
          }}
        >
          <Flame size={13} />
          מפת חום
        </button>
      </div>

      {/* Sub-selector — only when in heatmap mode */}
      {mode === "heatmap" && (
        <div
          className="flex flex-col rounded-xl overflow-hidden backdrop-blur-sm"
          style={{ border: "1px solid #d0d0d0", background: "rgba(255,255,255,0.95)" }}
        >
          <div className="flex">
            {HEATMAP_SOURCES.map((src, i) => (
              <button
                key={src.id}
                onClick={() => onHeatmapSourceChange(src.id)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold transition-all flex-1 justify-center"
                style={{
                  background: heatmapSource === src.id ? "#1f5fa6" : "transparent",
                  color:      heatmapSource === src.id ? "#ffffff" : "#585858",
                  borderRight: i < HEATMAP_SOURCES.length - 1 ? "1px solid #d0d0d0" : "none",
                }}
              >
                {src.icon}
                <span className="whitespace-nowrap">{src.label}</span>
              </button>
            ))}
          </div>
          {/* Legend line */}
          {active && (
            <div
              className="px-3 py-1 text-[10px] text-center border-t"
              style={{ borderColor: "#e8e8e8", color: "#888", background: "rgba(248,248,248,0.9)" }}
            >
              <span style={{ color: "#8b1214", fontWeight: 600 }}>חם</span>
              {" = "}{active.hotLabel}
              {"  ·  "}
              <span style={{ color: "#1f5fa6", fontWeight: 600 }}>קר</span>
              {" = "}{active.coldLabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
