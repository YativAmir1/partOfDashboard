"use client";

import { ChevronRight, Video, Bot } from "lucide-react";
import type { District, MapMarker, Complaint, CameraFeed } from "@/lib/types";
import type { RiskPredictionPoint } from "@/lib/riskPredictions";
import { districtLabel } from "@/lib/hebrew";

const CATEGORY_COLORS: Record<string, { bar: string; text: string; badge: string }> = {
  "פינוי אשפה":        { bar: "#f59e0b", text: "#b45309", badge: "#fef3c7" },
  "מפגע דרך":          { bar: "#f97316", text: "#c2410c", badge: "#ffedd5" },
  "תאורת רחוב":        { bar: "#eab308", text: "#854d0e", badge: "#fef9c3" },
  "רעש":               { bar: "#8b5cf6", text: "#6d28d9", badge: "#ede9fe" },
  "חניה":              { bar: "#3b82f6", text: "#1d4ed8", badge: "#dbeafe" },
  "גנים ונוף":         { bar: "#22c55e", text: "#15803d", badge: "#dcfce7" },
  "שירותים ציבוריים":  { bar: "#14b8a6", text: "#0f766e", badge: "#ccfbf1" },
  "זיהום אוויר":       { bar: "#6b7280", text: "#374151", badge: "#f3f4f6" },
  "כלבים משוטטים":     { bar: "#d97706", text: "#92400e", badge: "#fde68a" },
  "השלכת פסולת":       { bar: "#84cc16", text: "#3f6212", badge: "#f7fee7" },
  "גרפיטי":            { bar: "#ec4899", text: "#be185d", badge: "#fce7f3" },
  "הצפות":             { bar: "#06b6d4", text: "#0e7490", badge: "#cffafe" },
  "מפגע עצים":         { bar: "#16a34a", text: "#14532d", badge: "#bbf7d0" },
  "נזק במדרכה":        { bar: "#78716c", text: "#44403c", badge: "#f5f5f4" },
  "פיקוח בעלי חיים":   { bar: "#fb923c", text: "#9a3412", badge: "#fff7ed" },
};

const DEFAULT_COLOR = { bar: "#1f5fa6", text: "#1f5fa6", badge: "#eff4fc" };

interface DistrictPanelProps {
  district: District;
  markers: MapMarker[];
  complaints: Complaint[];
  cameras: CameraFeed[];
  riskPrediction?: RiskPredictionPoint;
  cityAvgOpenRate: number;
  onClose: () => void;
}

export function DistrictPanel({
  district,
  complaints,
  cameras,
  riskPrediction,
  cityAvgOpenRate,
  onClose,
}: DistrictPanelProps) {
  const dc = complaints.filter((c) => c.district === district && c.status !== "resolved");
  const total = dc.length;
  const open = dc.filter((c) => c.status === "open").length;
  const inProgress = dc.filter((c) => c.status === "in_progress").length;

  const openRate = total > 0 ? (open / total) * 100 : 0;
  const vsDiff = Math.round(openRate - cityAvgOpenRate);

  const categoryMap: Record<string, number> = {};
  dc.forEach((c) => {
    categoryMap[c.category] = (categoryMap[c.category] ?? 0) + 1;
  });
  const topCategories = Object.entries(categoryMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxCatCount = topCategories[0]?.[1] ?? 1;

  const negComplaints = dc.filter((c) => c.sentiment === "negative").length;
  const neuComplaints = dc.filter((c) => c.sentiment === "neutral").length;
  const posComplaints = dc.filter((c) => c.sentiment === "positive").length;

  const districtCameras = cameras.filter((c) => c.district === district);
  const alertCameras = districtCameras.filter((c) => c.status === "alert");

  return (
    <div className="w-52 shrink-0 overflow-y-auto">
      <div className="rounded-xl border border-[#d0d0d0] bg-white p-4 space-y-4">

        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-[#1f5fa6] hover:opacity-70 transition-opacity"
          >
            <ChevronRight size={14} />
            <span className="text-[10px] font-semibold">כל הרובעים</span>
          </button>
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: "#eff4fc", color: "#1f5fa6" }}
          >
            {total} פניות
          </span>
        </div>

        <p className="text-sm font-bold text-[#1a1a1a] leading-tight">{districtLabel(district)}</p>

        {/* Status bar */}
        {total > 0 ? (
          <div>
            <div className="flex rounded-full overflow-hidden h-2 mb-2 bg-[#e8e8e8]">
              {open > 0 && (
                <div style={{ width: `${(open / total) * 100}%`, background: "#d96350" }} />
              )}
              {inProgress > 0 && (
                <div style={{ width: `${(inProgress / total) * 100}%`, background: "#1f5fa6" }} />
              )}
            </div>
            <div className="flex justify-between text-[10px] gap-1">
              <span style={{ color: "#d96350" }} className="font-semibold">{open} פתוח</span>
              <span style={{ color: "#1f5fa6" }} className="font-semibold">{inProgress} בטיפול</span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#bbbbbb]">אין פניות ברובע זה</p>
        )}

        {/* Category breakdown */}
        {topCategories.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-[#585858] uppercase tracking-wider mb-2">
              פניות לפי נושא
            </p>
            <div className="space-y-2">
              {topCategories.map(([cat, count]) => {
                const clr = CATEGORY_COLORS[cat] ?? DEFAULT_COLOR;
                return (
                  <div key={cat}>
                    <div className="flex justify-between items-center mb-0.5 gap-1">
                      <span
                        className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full truncate"
                        style={{ background: clr.badge, color: clr.text }}
                      >
                        {cat}
                      </span>
                      <span className="text-[10px] font-bold shrink-0" style={{ color: clr.text }}>
                        {count}
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${(count / maxCatCount) * 100}%`,
                          background: clr.bar,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Complaints */}
        {(negComplaints > 0 || neuComplaints > 0 || posComplaints > 0) && (
          <div className="pt-3 border-t border-[#f0f0f0]">
            <p className="text-[10px] font-bold text-[#585858] uppercase tracking-wider mb-2">
              סנטימנט תלונות
            </p>
            <div className="flex gap-1.5 text-[10px] flex-wrap">
              {negComplaints > 0 && (
                <span
                  className="font-semibold px-1.5 py-0.5 rounded"
                  style={{ background: "#ffeff2", color: "#d96350" }}
                >
                  {negComplaints} שלילי
                </span>
              )}
              {neuComplaints > 0 && (
                <span
                  className="font-semibold px-1.5 py-0.5 rounded"
                  style={{ background: "#f5f5f5", color: "#707070" }}
                >
                  {neuComplaints} ניטרלי
                </span>
              )}
              {posComplaints > 0 && (
                <span
                  className="font-semibold px-1.5 py-0.5 rounded"
                  style={{ background: "#f0f8ed", color: "#459524" }}
                >
                  {posComplaints} חיובי
                </span>
              )}
            </div>
          </div>
        )}

        {/* Cameras */}
        {districtCameras.length > 0 && (
          <div className="pt-3 border-t border-[#f0f0f0]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Video size={11} color="#009dc3" />
              <p className="text-[10px] font-bold text-[#585858] uppercase tracking-wider">
                מצלמות
              </p>
            </div>
            <p className="text-xs text-[#585858]">
              {districtCameras.length} מצלמות פעילות
              {alertCameras.length > 0 && (
                <span style={{ color: "#d96350" }} className="font-semibold">
                  {" "}· {alertCameras.length} עם התראה
                </span>
              )}
            </p>
          </div>
        )}

        {/* AI Risk prediction */}
        {riskPrediction && (
          <div className="pt-3 border-t border-[#f0f0f0]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Bot size={11} color="#7c3aed" />
                <p className="text-[10px] font-bold text-[#7c3aed] uppercase tracking-wider">
                  חיזוי AI
                </p>
              </div>
              <span className="text-[10px] font-bold text-[#459524]">
                {riskPrediction.confidence}%
              </span>
            </div>
            <p className="text-[11px] text-[#1a1a1a] font-semibold leading-snug mb-1">
              {riskPrediction.title}
            </p>
            <p className="text-[10px] text-[#707070] leading-snug">
              {riskPrediction.recommendedAction}
            </p>
          </div>
        )}

        {/* City comparison */}
        {total > 0 && (
          <div className="pt-3 border-t border-[#f0f0f0]">
            <p
              className="text-[11px] font-semibold"
              style={{
                color:
                  vsDiff > 10  ? "#d96350" :
                  vsDiff > 0   ? "#f37d00" :
                  vsDiff < -5  ? "#459524" : "#707070",
              }}
            >
              {vsDiff > 0
                ? `+${vsDiff}% מעל ממוצע העיר`
                : vsDiff < -5
                ? `${Math.abs(vsDiff)}% מתחת לממוצע`
                : "בטווח הממוצע העירוני"}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
