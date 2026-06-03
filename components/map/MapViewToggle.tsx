"use client";

import { Map, Flame } from "lucide-react";

export type MapViewMode = "map" | "heatmap";

interface Props {
  mode: MapViewMode;
  onToggle: () => void;
}

export function MapViewToggle({ mode, onToggle }: Props) {
  return (
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
  );
}
