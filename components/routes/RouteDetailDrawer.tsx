"use client";

import {
  X,
  MapPin,
  Edit2,
  ClipboardPlus,
  CheckCircle2,
  Circle,
} from "lucide-react";
import Link from "next/link";
import type { RouteRow, DayKey, CalculatedRouteStatus, RecurrenceType } from "@/lib/types";
import { ROUTE_STATUS_COLORS, ROUTE_STATUS_LABELS } from "@/lib/routeUtils";

const RECURRENCE_BADGE: Record<RecurrenceType, { label: string; bg: string; color: string }> = {
  daily: { label: "יומי", bg: "#fff7ed", color: "#c2410c" },
  weekly: { label: "שבועי", bg: "#eef4fb", color: "#1f5fa6" },
  monthly: { label: "חודשי", bg: "#f0fdf4", color: "#15803d" },
};

const DAY_LABELS: Record<DayKey, string> = {
  sun: "ראשון",
  mon: "שני",
  tue: "שלישי",
  wed: "רביעי",
  thu: "חמישי",
  fri: "שישי",
};

const DEPT_BY_CATEGORY: Record<string, string> = {
  waste: "ניקיון סביבה",
  parks: "גנים ונוף",
  safety: "בטיחות ותנועה",
  traffic: "תחבורה",
  utilities: "תשתיות",
};

const TYPE_BY_CATEGORY: Record<string, string> = {
  waste: "פינוי אשפה",
  parks: "גינון ועיצוב",
  safety: "ביקורת שטח",
  traffic: "ניהול תנועה",
  utilities: "תחזוקת תשתיות",
};

function getInsight(
  status: CalculatedRouteStatus,
  complaints: number,
  pct: number,
  req: number
): string {
  switch (status) {
    case "completed":
      return complaints === 0
        ? "המסלול הושלם בהתאם ליעד וללא חריגות משמעותיות."
        : `המסלול הושלם אך נרשמו ${complaints} תלונות המצריכות בדיקה.`;
    case "in_progress":
      return `המסלול בביצוע. הושלם ${pct}% מתוך יעד ${req}%.`;
    case "delayed":
      return "המסלול לא הושלם בזמן הנדרש. מומלץ לבדוק את מצב הצוות ולזמן חיזוק.";
    case "requires_attention":
      return `נרשמו ${complaints} תלונות חוזרות. מומלץ לבצע ביקורת שטח דחופה.`;
    case "scheduled":
      return "המסלול מתוכנן ועדיין לא החל.";
  }
}

interface Props {
  row: RouteRow;
  onClose: () => void;
  onEdit: () => void;
}

export function RouteDetailDrawer({ row, onClose, onEdit }: Props) {
  const { template, schedule, execution, complaintCount, status } = row;
  const color = ROUTE_STATUS_COLORS[status];
  const pct = execution?.completionPct ?? 0;
  const totalStreets = template.streets.length;
  const completedStreets = Math.min(
    totalStreets,
    Math.round((pct / 100) * totalStreets)
  );
  const dayLabels = schedule.dayOfWeek.map((d) => DAY_LABELS[d]).join(", ");
  const barColor = pct >= 80 ? "#459524" : pct >= 50 ? "#f37d00" : "#d96350";

  const recType: RecurrenceType = schedule.recurrenceType ?? "weekly";
  const badge = RECURRENCE_BADGE[recType];
  const recurrenceSummary =
    recType === "daily"
      ? `${dayLabels || "—"} · ${schedule.timesPerDay ?? 1}× ביום`
      : recType === "monthly"
      ? `${schedule.timesPerMonth ?? 1}× בחודש`
      : dayLabels || "—";

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      <div
        dir="rtl"
        className="fixed top-0 right-0 h-full w-[420px] max-w-[95vw] bg-white z-50 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[#e8e8e8] shrink-0">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-[#1a1a1a] leading-tight">
              {template.name}
            </h3>
            <p className="text-[11px] text-[#999999] mt-0.5">
              {DEPT_BY_CATEGORY[template.category]} ·{" "}
              {TYPE_BY_CATEGORY[template.category]}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-[#999999] hover:bg-[#f0f0f0] shrink-0 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Metadata grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#fafafa] rounded-lg p-3">
              <p className="text-[10px] text-[#999999] font-medium mb-1.5">סטטוס</p>
              <span
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold"
                style={{ background: color + "20", color }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: color }}
                />
                {ROUTE_STATUS_LABELS[status]}
              </span>
            </div>

            <div className="bg-[#fafafa] rounded-lg p-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[10px] text-[#999999] font-medium">חזרתיות</p>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: badge.bg, color: badge.color }}
                >
                  {badge.label}
                </span>
              </div>
              <p className="text-xs font-semibold text-[#1a1a1a] leading-snug">
                {recurrenceSummary}
              </p>
            </div>

            <div className="bg-[#fafafa] rounded-lg p-3">
              <p className="text-[10px] text-[#999999] font-medium mb-1.5">
                שעות מתוכננות
              </p>
              {schedule.recurrenceType === "daily" && schedule.dailyTimeWindows?.length ? (
                <div className="space-y-1">
                  {schedule.dailyTimeWindows.map((win, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center text-[8px] font-bold"
                        style={{ background: "#eef4fb", color: "#1f5fa6" }}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-[#1a1a1a] tabular-nums">
                        {win.startTime}–{win.endTime}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm font-semibold text-[#1a1a1a] tabular-nums">
                  {schedule.scheduledStartTime}–{schedule.scheduledEndTime}
                </p>
              )}
            </div>

            <div className="bg-[#fafafa] rounded-lg p-3">
              <p className="text-[10px] text-[#999999] font-medium mb-1.5">
                {schedule.vehicle ? "רכב" : "צוות"}
              </p>
              <p className="text-sm font-semibold text-[#1a1a1a]">
                {schedule.vehicle ?? schedule.assignedTeam}
              </p>
              {schedule.vehicle && (
                <p className="text-[10px] text-[#999999] mt-0.5">
                  {schedule.assignedTeam}
                </p>
              )}
            </div>
          </div>

          {/* Completion progress */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-[#585858]">ביצוע</p>
              <p className="text-[11px] text-[#999999]">
                {completedStreets} מתוך {totalStreets} מקטעים
              </p>
            </div>
            <div className="h-2 bg-[#f0f0f0] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, background: barColor }}
              />
            </div>
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-[10px] text-[#999999]">
                יעד: {schedule.requiredCompletionPct}%
              </span>
              <span
                className="text-[11px] font-bold"
                style={{
                  color:
                    pct >= schedule.requiredCompletionPct ? "#459524" : "#d96350",
                }}
              >
                {pct}%
              </span>
            </div>
          </div>

          {/* Complaints */}
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-semibold text-[#585858]">תלונות:</p>
            {complaintCount > 0 ? (
              <span className="text-[11px] font-bold text-[#d96350]">
                {complaintCount}
              </span>
            ) : (
              <span className="text-[11px] text-[#999999]">ללא</span>
            )}
          </div>

          {/* Streets list */}
          <div>
            <p className="text-[11px] font-semibold text-[#585858] mb-2">
              רחובות במסלול
            </p>
            <div className="space-y-1.5">
              {template.streets.map((street, idx) => {
                const done = idx < completedStreets;
                return (
                  <div
                    key={street}
                    className="flex items-center gap-2.5 py-1.5 px-3 rounded-lg"
                    style={{ background: done ? "#f0fff4" : "#fafafa" }}
                  >
                    {done ? (
                      <CheckCircle2
                        size={13}
                        className="shrink-0"
                        style={{ color: "#459524" }}
                      />
                    ) : (
                      <Circle size={13} className="shrink-0 text-[#cccccc]" />
                    )}
                    <span
                      className="text-xs"
                      style={{ color: done ? "#1a1a1a" : "#888888" }}
                    >
                      {street}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Operational insight */}
          <div className="bg-[#f0f6ff] border border-[#bfdbfe] rounded-lg p-3">
            <p className="text-[10px] font-semibold text-[#1f5fa6] mb-1">
              תובנה תפעולית
            </p>
            <p className="text-[11px] text-[#1a1a1a] leading-relaxed">
              {getInsight(status, complaintCount, pct, schedule.requiredCompletionPct)}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="px-5 py-4 border-t border-[#e8e8e8] flex flex-col gap-2 shrink-0">
          <button
            onClick={onEdit}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1f5fa6] text-white text-sm font-semibold rounded-lg hover:bg-[#174f8f] transition-colors"
          >
            <Edit2 size={13} />
            עריכת מסלול
          </button>
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/map?routeScheduleId=${schedule.id}`}
              onClick={onClose}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-[#1f5fa6] text-[#1f5fa6] text-sm rounded-lg hover:bg-[#eef4fb] transition-colors"
            >
              <MapPin size={13} />
              הצג במפה
            </Link>
            <button
              disabled
              className="flex items-center justify-center gap-2 px-4 py-2 border border-[#e0e0e0] text-[#bbbbbb] text-sm rounded-lg cursor-not-allowed"
            >
              <ClipboardPlus size={13} />
              פתיחת משימה
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
