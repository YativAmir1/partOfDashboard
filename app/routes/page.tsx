"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  Route,
  CheckCircle2,
  PlayCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  MessageSquareWarning,
  Calendar,
  CalendarDays,
  Plus,
  Trash2,
} from "lucide-react";
import {
  routeTemplates,
  routeSchedules,
  routeExecutions,
  routeComplaints,
} from "@/lib/data";
import {
  calculateRouteStatus,
  getCurrentExecution,
  ROUTE_STATUS_LABELS,
  ROUTE_STATUS_COLORS,
} from "@/lib/routeUtils";
import { getRouteHistory, getRouteTrend, type TrendDirection } from "@/lib/routeHistory";
import { WeeklyGrid } from "@/components/routes/WeeklyGrid";
import { RouteDetailDrawer } from "@/components/routes/RouteDetailDrawer";
import { EditScheduleModal } from "@/components/routes/EditScheduleModal";
import { AddRouteModal } from "@/components/routes/AddRouteModal";
import { CategoryBreakdown } from "@/components/routes/CategoryBreakdown";
import { TimelineChart } from "@/components/routes/TimelineChart";
import { ComplaintStreets } from "@/components/routes/ComplaintStreets";
import { TeamPerformance } from "@/components/routes/TeamPerformance";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type {
  RouteRow,
  RouteSchedule,
  RouteTemplate,
  CalculatedRouteStatus,
  DayKey,
  TimeWindow,
} from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = "daily" | "weekly";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_ORDER: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri"];

const DAY_LABELS: Record<DayKey, string> = {
  sun: "ראשון",
  mon: "שני",
  tue: "שלישי",
  wed: "רביעי",
  thu: "חמישי",
  fri: "שישי",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getMockNow(): Date {
  return new Date();
}

function getTodayDayKey(d: Date): DayKey {
  const keys: DayKey[] = ["sun", "mon", "tue", "wed", "thu", "fri"];
  const idx = d.getDay();
  return idx < 6 ? keys[idx] : "fri";
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: CalculatedRouteStatus }) {
  const color = ROUTE_STATUS_COLORS[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
      style={{ background: color + "20", color }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ background: color }}
      />
      {ROUTE_STATUS_LABELS[status]}
    </span>
  );
}

function CompletionBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? "#459524" : pct >= 50 ? "#f37d00" : "#d96350";
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums" style={{ color }}>
        {pct}%
      </span>
    </div>
  );
}

type WindowPhase = "past" | "current" | "future";

function getWindowPhase(win: TimeWindow, now: Date, isToday: boolean): WindowPhase {
  if (!isToday) return "future";
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = win.startTime.split(":").map(Number);
  const [eh, em] = win.endTime.split(":").map(Number);
  if (nowMin >= eh * 60 + em) return "past";
  if (nowMin >= sh * 60 + sm) return "current";
  return "future";
}

function WindowPhaseBadge({ phase }: { phase: WindowPhase }) {
  const cfg: Record<WindowPhase, { label: string; color: string }> = {
    past:    { label: "בוצע",    color: "#459524" },
    current: { label: "בביצוע", color: "#f37d00" },
    future:  { label: "מתוכנן", color: "#1f5fa6" },
  };
  const { label, color } = cfg[phase];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: color + "20", color }}
    >
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
      {label}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RoutesPage() {
  const now = getMockNow();
  const todayDayKey = getTodayDayKey(now);

  // ── Mutable schedule state (supports local edits) ──────────────────────────
  const [schedules, setSchedules] = useState<RouteSchedule[]>(routeSchedules);

  // ── Custom routes state (fetched from API) ─────────────────────────────────
  const [customTemplates, setCustomTemplates] = useState<RouteTemplate[]>([]);
  const [customSchedules, setCustomSchedules] = useState<RouteSchedule[]>([]);

  // ── View state ─────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [selectedDay, setSelectedDay] = useState<DayKey>(todayDayKey);

  // ── Drawer / modal state ───────────────────────────────────────────────────
  const [detailScheduleId, setDetailScheduleId] = useState<string | null>(null);
  const [editingSchedule, setEditingSchedule] = useState<RouteSchedule | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Auto-open drawer when navigated from map with ?scheduleId=
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("scheduleId");
    if (id) setDetailScheduleId(id);
  }, []);

  // Apply the API payload: custom routes + persisted edits (overrides) to base schedules
  function applyRoutesData(data: {
    templates?: RouteTemplate[];
    schedules?: RouteSchedule[];
    overrides?: Record<string, Partial<RouteSchedule>>;
  }) {
    setCustomTemplates(data.templates ?? []);
    setCustomSchedules(data.schedules ?? []);
    const overrides = data.overrides ?? {};
    // Re-apply saved edits on top of the canonical base schedules so they
    // survive reloads (base schedules can't be written back to routes.json).
    setSchedules(
      routeSchedules.map((s) => (overrides[s.id] ? { ...s, ...overrides[s.id] } : s)),
    );
  }

  // Fetch custom routes + base-schedule overrides from API
  useEffect(() => {
    fetch("/api/routes")
      .then((r) => r.json())
      .then(applyRoutesData)
      .catch(() => {/* non-critical */});
  }, []);

  function refreshCustomRoutes() {
    fetch("/api/routes")
      .then((r) => r.json())
      .then(applyRoutesData)
      .catch(() => {/* non-critical */});
  }

  // ── All templates (static + custom) ───────────────────────────────────────
  const allTemplates = useMemo(
    () => [...routeTemplates, ...customTemplates],
    [customTemplates],
  );

  // ── Derived: active schedules for planning views ───────────────────────────
  const activeSchedules = useMemo(
    () => [...schedules, ...customSchedules].filter((s) => s.active !== false),
    [schedules, customSchedules],
  );

  // ── Derived: detail drawer row (auto-updates after edits) ──────────────────
  const detailRow = useMemo<RouteRow | null>(() => {
    if (!detailScheduleId) return null;
    const schedule = [...schedules, ...customSchedules].find((s) => s.id === detailScheduleId);
    if (!schedule) return null;
    const template = allTemplates.find((t) => t.id === schedule.templateId);
    if (!template) return null;
    const execution = getCurrentExecution(schedule.id, routeExecutions);
    const complaintCount = execution
      ? routeComplaints.filter((c) => c.executionId === execution.id).length
      : 0;
    const status = execution
      ? calculateRouteStatus(schedule, execution, complaintCount, now)
      : "scheduled";
    return { template, schedule, execution, complaintCount, status };
  }, [detailScheduleId, schedules, customSchedules, allTemplates]);

  // ── Today's rows (KPI source) — all schedules active today, not just executed ─
  // Building from activeSchedules (instead of routeExecutions) means custom routes
  // with no execution yet appear as "scheduled" and are counted in every widget.
  const todayRows = useMemo<RouteRow[]>(() => {
    const todaySchedules = activeSchedules.filter((s) =>
      s.dayOfWeek.includes(todayDayKey)
    );
    return todaySchedules.map((schedule) => {
      const template = allTemplates.find((t) => t.id === schedule.templateId)!;
      const execution = getCurrentExecution(schedule.id, routeExecutions);
      const complaintCount = execution
        ? routeComplaints.filter((c) => c.executionId === execution.id).length
        : 0;
      const status = execution
        ? calculateRouteStatus(schedule, execution, complaintCount, now)
        : "scheduled";
      return { template, schedule, execution, complaintCount, status };
    });
  }, [activeSchedules, allTemplates, todayDayKey]);

  // ── Daily view rows ─────────────────────────────────────────────────────────
  const dailyRows = useMemo<RouteRow[]>(() => {
    const daySchedules = activeSchedules
      .filter((s) => s.dayOfWeek.includes(selectedDay))
      .sort((a, b) => a.scheduledStartTime.localeCompare(b.scheduledStartTime));

    return daySchedules.map((schedule) => {
      const template = allTemplates.find((t) => t.id === schedule.templateId)!;
      const execution =
        selectedDay === todayDayKey
          ? getCurrentExecution(schedule.id, routeExecutions)
          : undefined;
      const complaintCount = execution
        ? routeComplaints.filter((c) => c.executionId === execution.id).length
        : 0;
      const status = execution
        ? calculateRouteStatus(schedule, execution, complaintCount, now)
        : "scheduled";
      return { template, schedule, execution, complaintCount, status };
    });
  }, [selectedDay, todayDayKey, activeSchedules, allTemplates]);

  // ── Trend map (4-week performance direction per schedule) ───────────────────
  const trendMap = useMemo(() => {
    const map = new Map<string, TrendDirection | null>();
    for (const row of dailyRows) {
      const history = getRouteHistory(
        row.schedule.id,
        row.schedule.requiredCompletionPct,
        routeExecutions,
        routeComplaints,
        8
      );
      map.set(row.schedule.id, history.length >= 4 ? getRouteTrend(history) : null);
    }
    return map;
  }, [dailyRows]);

  // ── KPI aggregation ─────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const total = todayRows.length;
    const completed = todayRows.filter((r) => r.status === "completed").length;
    const inProgress = todayRows.filter((r) => r.status === "in_progress").length;
    const delayed = todayRows.filter((r) => r.status === "delayed").length;
    const attention = todayRows.filter(
      (r) => r.status === "requires_attention"
    ).length;
    const startedRows = todayRows.filter(
      (r) => r.execution && r.execution.completionPct > 0
    );
    const avgCompletion =
      startedRows.length > 0
        ? Math.round(
            startedRows.reduce((s, r) => s + r.execution!.completionPct, 0) /
              startedRows.length
          )
        : 0;
    const totalComplaints = todayRows.reduce(
      (s, r) => s + r.complaintCount,
      0
    );
    return { total, completed, inProgress, delayed, attention, avgCompletion, totalComplaints };
  }, [todayRows]);

  const kpiCards: Array<{
    label: string;
    value: number;
    unit?: string;
    icon: LucideIcon;
    color: string;
  }> = [
    { label: "מסלולים היום",   value: kpis.total,           icon: Route,                color: "#1f5fa6" },
    { label: "הושלמו",          value: kpis.completed,       icon: CheckCircle2,         color: "#459524" },
    { label: "בביצוע",          value: kpis.inProgress,      icon: PlayCircle,           color: "#f37d00" },
    { label: "באיחור",          value: kpis.delayed,         icon: Clock,                color: "#d96350" },
    { label: "דורשים התערבות",  value: kpis.attention,       icon: AlertTriangle,        color: "#4b5563" },
    { label: "השלמה ממוצעת",   value: kpis.avgCompletion,   icon: BarChart3,            color: "#009dc3", unit: "%" },
    { label: "תלונות היום",     value: kpis.totalComplaints, icon: MessageSquareWarning, color: "#d96350" },
  ];

  const isToday = selectedDay === todayDayKey;

  // ── Save handler ────────────────────────────────────────────────────────────
  function handleSaveSchedule(updated: RouteSchedule) {
    // Optimistic local update
    if (updated.id.startsWith("sch-custom-")) {
      setCustomSchedules((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );
    } else {
      setSchedules((prev) =>
        prev.map((s) => (s.id === updated.id ? updated : s))
      );
    }
    // Fire-and-forget persist: custom schedules update in place, base schedules
    // (from routes.json) are saved as overrides so the edit survives reloads.
    fetch(`/api/routes?scheduleId=${encodeURIComponent(updated.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    }).catch(() => {/* non-critical */});
    setEditingSchedule(null);
    // drawer stays open and auto-updates via detailRow memo
  }

  // ── Delete custom route handler ──────────────────────────────────────────────
  function handleDeleteRoute(scheduleId: string) {
    if (!window.confirm("האם למחוק את המסלול?")) return;
    fetch(`/api/routes?scheduleId=${encodeURIComponent(scheduleId)}`, { method: "DELETE" })
      .then((r) => r.json())
      .then((res) => {
        if (res.ok) {
          if (detailScheduleId === scheduleId) setDetailScheduleId(null);
          refreshCustomRoutes();
        }
      })
      .catch(() => {/* non-critical */});
  }

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1a1a1a]">ניהול מסלולים</h2>
          <p className="text-sm text-[#585858] mt-0.5">
            מסלולים תפעוליים מתוכננים · ביצוע ומעקב יומי · {kpis.total} מסלולים היום
          </p>
        </div>

        {/* Actions: add route + view toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-[#1f5fa6] text-white text-sm font-semibold rounded-lg hover:bg-[#174f8f] transition-colors shadow-sm"
          >
            <Plus size={15} />
            מסלול חדש
          </button>

          {/* View toggle */}
          <div className="flex gap-1 bg-[#f4f4f4] rounded-lg p-1">
          {(
            [
              { mode: "daily" as ViewMode,  label: "תצוגה יומית",  Icon: Calendar     },
              { mode: "weekly" as ViewMode, label: "תצוגה שבועית", Icon: CalendarDays },
            ] as const
          ).map(({ mode, label, Icon }) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                viewMode === mode
                  ? "bg-white text-[#1f5fa6] shadow-sm"
                  : "text-[#585858] hover:text-[#1a1a1a]"
              )}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
          </div>
        </div>
      </div>

      {/* ── KPI cards (always today's operational data) ──────────────────── */}
      <div>
        <p className="text-[10px] font-semibold text-[#999999] uppercase tracking-wider mb-2">
          סטטוס תפעולי · היום
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
          {kpiCards.map(({ label, value, unit, icon: Icon, color }) => (
            <div
              key={label}
              className="bg-white border border-[#d0d0d0] rounded-xl p-3 flex flex-col gap-2 hover:border-[#1f5fa6] transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-[#585858] leading-tight">
                  {label}
                </span>
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                  style={{ background: color + "22" }}
                >
                  <Icon size={12} style={{ color }} />
                </div>
              </div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-2xl font-bold text-[#1a1a1a] tabular-nums">
                  {value}
                </span>
                {unit && <span className="text-sm text-[#585858]">{unit}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <CategoryBreakdown rows={todayRows} />

      {/* ── Daily view ───────────────────────────────────────────────────── */}
      {viewMode === "daily" && (
        <div className="space-y-4">
          {/* Day selector */}
          <div className="flex items-center gap-2 flex-wrap">
            {DAY_ORDER.map((day) => {
              const active = day === selectedDay;
              const isCurrentDay = day === todayDayKey;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(day)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                  style={
                    active
                      ? { background: "#1f5fa6", color: "#fff", borderColor: "#1f5fa6" }
                      : { background: "#f4f4f4", color: "#585858", borderColor: "#d0d0d0" }
                  }
                >
                  {DAY_LABELS[day]}
                  {isCurrentDay && (
                    <span
                      className="mr-1 text-[9px] font-bold"
                      style={{ color: active ? "#bbddff" : "#1f5fa6" }}
                    >
                      ★
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Routes table */}
          <div className="bg-white border border-[#d0d0d0] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#d0d0d0] flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[#1a1a1a]">
                  מסלולים ליום {DAY_LABELS[selectedDay]}
                </p>
                <p className="text-[11px] text-[#999999] mt-0.5">
                  {dailyRows.length} מסלולים מתוכננים
                  {!isToday && (
                    <span className="mr-2 text-[#1f5fa6]">· נתוני תכנון בלבד</span>
                  )}
                </p>
              </div>
            </div>

            {dailyRows.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-[#999999]">
                אין מסלולים מתוכננים ליום זה
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#f0f0f0] bg-[#fafafa]">
                      {[
                        "שם מסלול",
                        "צירי המסלול",
                        "שעות מתוכננות",
                        "צוות / רכב",
                        "סטטוס",
                        "מגמה",
                        ...(isToday ? ["השלמה", "תלונות"] : []),
                        "",
                      ].map((h, i) => (
                        <th
                          key={i}
                          className="text-right px-4 py-3 text-[11px] font-semibold text-[#585858] uppercase tracking-wider whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dailyRows.map((row, i) => {
                      const isDaily = row.schedule.recurrenceType === "daily";
                      const windows = isDaily && (row.schedule.dailyTimeWindows?.length ?? 0) > 1
                        ? row.schedule.dailyTimeWindows!
                        : null;
                      const isLast = i === dailyRows.length - 1 && !windows;

                      return (
                        <React.Fragment key={`${row.schedule.id}-${selectedDay}`}>
                          {/* Main row */}
                          <tr
                            className={cn(
                              "border-b border-[#f0f0f0] hover:bg-[#fafbff] transition-colors",
                              isLast && "border-b-0"
                            )}
                          >
                            <td className="px-4 py-3 font-medium text-[#1a1a1a] whitespace-nowrap">
                              <span className="flex items-center gap-2">
                                {row.template.name}
                                {windows && (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#fff7ed] text-[#c2410c]">
                                    {windows.length}× ביום
                                  </span>
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[#585858]">
                              <span className="flex flex-wrap gap-1">
                                {row.template.streets.map((street, idx) => (
                                  <span key={street} className="inline-flex items-center gap-1">
                                    <span className="text-xs">{street}</span>
                                    {idx < row.template.streets.length - 1 && (
                                      <span className="text-[#cccccc] text-[10px]">←</span>
                                    )}
                                  </span>
                                ))}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[#585858] whitespace-nowrap tabular-nums">
                              {windows ? (
                                <span className="text-[11px] text-[#999999]">
                                  {windows.length} הפעלות
                                </span>
                              ) : (
                                <span dir="ltr">
                                  {row.schedule.scheduledStartTime}–
                                  {row.schedule.scheduledEndTime}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-[#585858] whitespace-nowrap">
                              {row.schedule.vehicle ? (
                                <span>
                                  <span className="font-medium text-[#1a1a1a]">
                                    {row.schedule.vehicle}
                                  </span>
                                  <span className="text-[#999999] text-[11px] mr-1">
                                    · {row.schedule.assignedTeam}
                                  </span>
                                </span>
                              ) : (
                                row.schedule.assignedTeam
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={row.status} />
                            </td>
                            <td className="px-4 py-3">
                              {(() => {
                                const trend = trendMap.get(row.schedule.id);
                                if (!trend) return <span className="text-[#cccccc] text-xs">—</span>;
                                const cfg = {
                                  improving: { s: "↑", c: "#459524" },
                                  stable:    { s: "→", c: "#999999" },
                                  worsening: { s: "↓", c: "#d96350" },
                                };
                                const { s, c } = cfg[trend];
                                return <span className="text-sm font-bold" style={{ color: c }}>{s}</span>;
                              })()}
                            </td>
                            {isToday && (
                              <>
                                <td className="px-4 py-3">
                                  {row.execution ? (
                                    <CompletionBar pct={row.execution.completionPct} />
                                  ) : (
                                    <span className="text-[#cccccc] text-xs">—</span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  {row.complaintCount > 0 ? (
                                    <span
                                      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] font-bold"
                                      style={{
                                        background: row.complaintCount > 3 ? "#d9635020" : "#f3f4f6",
                                        color: row.complaintCount > 3 ? "#d96350" : "#585858",
                                      }}
                                    >
                                      {row.complaintCount}
                                    </span>
                                  ) : (
                                    <span className="text-[#cccccc] text-xs">—</span>
                                  )}
                                </td>
                              </>
                            )}
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <button
                                  onClick={() => setDetailScheduleId(row.schedule.id)}
                                  className="px-3 py-1 text-xs font-medium text-[#1f5fa6] border border-[#1f5fa6] rounded-lg hover:bg-[#eef4fb] transition-colors whitespace-nowrap cursor-pointer"
                                >
                                  פרטים
                                </button>
                                {row.schedule.id.startsWith("sch-custom-") && (
                                  <button
                                    onClick={() => handleDeleteRoute(row.schedule.id)}
                                    title="מחק מסלול"
                                    className="p-1.5 text-[#d96350] border border-[#d96350] rounded-lg hover:bg-[#fdf2f0] transition-colors cursor-pointer"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Sub-rows: one per time window (only for daily multi-window) */}
                          {windows?.map((win, winIdx) => {
                            const phase = getWindowPhase(win, now, isToday);
                            const isLastSub =
                              i === dailyRows.length - 1 && winIdx === windows.length - 1;
                            return (
                              <tr
                                key={`${row.schedule.id}-win-${winIdx}`}
                                className={cn(
                                  "border-b border-[#f5f5f5] bg-[#fafafa]",
                                  isLastSub && "border-b-0"
                                )}
                              >
                                <td className="px-4 py-2">
                                  <span className="flex items-center gap-2 pr-4">
                                    <span
                                      className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold"
                                      style={{ background: "#eef4fb", color: "#1f5fa6" }}
                                    >
                                      {winIdx + 1}
                                    </span>
                                    <span className="text-[11px] text-[#999999]">
                                      הפעלה {winIdx + 1}
                                    </span>
                                  </span>
                                </td>
                                <td />
                                <td className="px-4 py-2 text-xs tabular-nums text-[#585858] whitespace-nowrap">
                                  {win.startTime}–{win.endTime}
                                </td>
                                <td />
                                <td className="px-4 py-2">
                                  <WindowPhaseBadge phase={phase} />
                                </td>
                                <td />
                                {isToday && <><td /><td /></>}
                                <td className="px-4 py-2 text-center">
                                  <button
                                    onClick={() => setDetailScheduleId(row.schedule.id)}
                                    className="px-3 py-1 text-xs font-medium text-[#1f5fa6] border border-[#1f5fa6] rounded-lg hover:bg-[#eef4fb] transition-colors whitespace-nowrap cursor-pointer"
                                  >
                                    פרטים
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {isToday && (
            <>
              <TimelineChart rows={dailyRows} now={now} />
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <ComplaintStreets complaints={routeComplaints} />
                <TeamPerformance rows={todayRows} />
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Weekly view ──────────────────────────────────────────────────── */}
      {viewMode === "weekly" && (
        <WeeklyGrid
          now={now}
          todayDayKey={todayDayKey}
          schedules={activeSchedules}
          templates={allTemplates}
          onClickRoute={(id) => setDetailScheduleId(id)}
        />
      )}

      {/* ── Detail drawer ────────────────────────────────────────────────── */}
      {detailRow && (
        <RouteDetailDrawer
          row={detailRow}
          onClose={() => setDetailScheduleId(null)}
          onEdit={() => setEditingSchedule(detailRow.schedule)}
        />
      )}

      {/* ── Edit schedule modal ──────────────────────────────────────────── */}
      {editingSchedule && (
        <EditScheduleModal
          schedule={editingSchedule}
          templates={allTemplates}
          onSave={handleSaveSchedule}
          onClose={() => setEditingSchedule(null)}
        />
      )}

      {/* ── Add route modal ──────────────────────────────────────────────── */}
      {showAddModal && (
        <AddRouteModal
          onClose={() => setShowAddModal(false)}
          onCreated={refreshCustomRoutes}
        />
      )}
    </div>
  );
}
