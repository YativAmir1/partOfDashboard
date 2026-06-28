"use client";

import { useMemo } from "react";
import {
  routeExecutions,
  routeComplaints,
} from "@/lib/data";
import {
  calculateRouteStatus,
  ROUTE_STATUS_COLORS,
  ROUTE_STATUS_LABELS,
} from "@/lib/routeUtils";
import type {
  DayKey,
  RouteExecution,
  RouteSchedule,
  RouteTemplate,
  CalculatedRouteStatus,
} from "@/lib/types";

// ─── Constants ───────────────────────────────────────────────────────────────

const TIME_WINDOWS = [
  { label: "06:00–08:00", from: 6,  to: 8  },
  { label: "08:00–12:00", from: 8,  to: 12 },
  { label: "12:00–14:00", from: 12, to: 14 },
  { label: "14:00–16:00", from: 14, to: 16 },
  { label: "16:00–18:00", from: 16, to: 18 },
] as const;

const WEEK_DAYS: { key: DayKey; label: string }[] = [
  { key: "sun", label: "ראשון" },
  { key: "mon", label: "שני"   },
  { key: "tue", label: "שלישי" },
  { key: "wed", label: "רביעי" },
  { key: "thu", label: "חמישי" },
  { key: "fri", label: "שישי"  },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function CompletionBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? "#459524" : pct >= 50 ? "#f37d00" : "#d96350";
  return (
    <div className="flex items-center gap-1.5 mt-1">
      <div className="flex-1 h-1 bg-[#f0f0f0] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-[9px] font-bold tabular-nums" style={{ color }}>
        {pct}%
      </span>
    </div>
  );
}

interface CellCardProps {
  template: RouteTemplate;
  schedule: RouteSchedule;
  execution?: RouteExecution;
  complaintCount: number;
  status: CalculatedRouteStatus;
  onClickRoute?: (scheduleId: string) => void;
}

function CellCard({
  template,
  schedule,
  execution,
  complaintCount,
  status,
  onClickRoute,
}: CellCardProps) {
  const color = ROUTE_STATUS_COLORS[status];
  const label = ROUTE_STATUS_LABELS[status];
  const resource = schedule.vehicle
    ? `${schedule.vehicle} · ${schedule.assignedTeam}`
    : schedule.assignedTeam;

  return (
    <div
      dir="rtl"
      className={`bg-white rounded-lg p-2 border border-[#e8e8e8] text-xs space-y-0.5 hover:border-[#1f5fa6] transition-colors ${onClickRoute ? "cursor-pointer" : "cursor-default"}`}
      style={{ borderRight: `3px solid ${color}` }}
      onClick={() => onClickRoute?.(schedule.id)}
    >
      <div className="font-semibold text-[#1a1a1a] leading-tight line-clamp-1">
        {template.name}
      </div>
      <div className="text-[10px] text-[#585858] line-clamp-1">
        {template.streets.slice(0, 2).join(" · ")}
        {template.streets.length > 2 && (
          <span className="text-[#bbbbbb]"> +{template.streets.length - 2}</span>
        )}
      </div>
      <div className="text-[10px] text-[#999999] line-clamp-1">{resource}</div>
      <div className="flex items-center justify-between gap-1 pt-0.5">
        <span
          className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-semibold shrink-0"
          style={{ background: color + "20", color, fontSize: "9px" }}
        >
          <span
            className="w-1 h-1 rounded-full shrink-0"
            style={{ background: color }}
          />
          {label}
        </span>
        {complaintCount > 0 && (
          <span
            className="text-[9px] font-semibold"
            style={{ color: "#d96350" }}
          >
            {complaintCount} תלונות
          </span>
        )}
      </div>
      {execution && execution.completionPct > 0 && (
        <CompletionBar pct={execution.completionPct} />
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

interface WeeklyGridProps {
  now: Date;
  todayDayKey: DayKey;
  schedules: RouteSchedule[];
  templates: RouteTemplate[];
  onClickRoute?: (scheduleId: string) => void;
}

export function WeeklyGrid({ now, todayDayKey, schedules, templates, onClickRoute }: WeeklyGridProps) {
  const execBySchedule = useMemo(() => {
    const map = new Map<string, RouteExecution>();
    routeExecutions.forEach((e) => map.set(e.scheduleId, e));
    return map;
  }, []);

  const complaintsByExecution = useMemo(() => {
    const map = new Map<string, number>();
    routeComplaints.forEach((c) => {
      map.set(c.executionId, (map.get(c.executionId) ?? 0) + 1);
    });
    return map;
  }, []);

  function getCellSchedules(
    day: DayKey,
    window: (typeof TIME_WINDOWS)[number]
  ): RouteSchedule[] {
    return schedules.filter((s) => {
      if (!s.dayOfWeek.includes(day)) return false;
      const h = parseInt(s.scheduledStartTime.split(":")[0], 10);
      return h >= window.from && h < window.to;
    });
  }

  // Date labels anchored to the real current week (Sunday-based), so the grid
  // stays in sync with the real-clock "היום" highlight on whatever day it's shown.
  const getWeekDate = (dayIndex: number): string => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay() + dayIndex);
    return d.toLocaleDateString("he-IL", { day: "numeric", month: "numeric" });
  };

  const weekRange = `${getWeekDate(0)} – ${getWeekDate(5)}`;

  return (
    <div className="bg-white border border-[#d0d0d0] rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#d0d0d0]">
        <p className="text-sm font-semibold text-[#1a1a1a]">לוח שבועי</p>
        <p className="text-[11px] text-[#999999] mt-0.5">שבוע {weekRange}</p>
      </div>

      {/* dir="ltr" so time flows left→right even inside RTL page */}
      <div dir="ltr" className="overflow-x-auto">
        <table
          className="w-full border-collapse"
          style={{ minWidth: "880px" }}
        >
          <thead>
            <tr className="bg-[#fafafa] border-b border-[#f0f0f0]">
              {/* day column */}
              <th className="w-[100px] border-l border-[#f0f0f0]" />
              {TIME_WINDOWS.map((w) => (
                <th
                  key={w.label}
                  dir="rtl"
                  className="px-3 py-2.5 text-[11px] font-semibold text-[#585858] text-center border-l border-[#f0f0f0] whitespace-nowrap"
                >
                  {w.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {WEEK_DAYS.map(({ key: dayKey, label: dayLabel }, dayIndex) => {
              const isToday = dayKey === todayDayKey;
              return (
                <tr
                  key={dayKey}
                  className={isToday ? "bg-[#f0f6ff]" : ""}
                >
                  {/* Day header cell */}
                  <td
                    dir="rtl"
                    className="px-3 py-2 border-b border-l border-[#f0f0f0] align-top"
                    style={
                      isToday
                        ? { borderRight: "3px solid #1f5fa6" }
                        : undefined
                    }
                  >
                    <div className="font-semibold text-sm text-[#1a1a1a] whitespace-nowrap">
                      {dayLabel}
                    </div>
                    <div className="text-[10px] text-[#999999]">
                      {getWeekDate(dayIndex)}
                    </div>
                    {isToday && (
                      <span className="inline-block mt-1 text-[9px] font-bold bg-[#1f5fa6] text-white rounded px-1.5 py-0.5">
                        היום
                      </span>
                    )}
                  </td>

                  {/* Time-window cells */}
                  {TIME_WINDOWS.map((window) => {
                    const cellSchedules = getCellSchedules(dayKey, window);
                    return (
                      <td
                        key={window.label}
                        className="p-1.5 border-b border-l border-[#f0f0f0] align-top"
                        style={{ minWidth: "160px" }}
                      >
                        {cellSchedules.length === 0 ? (
                          <div className="min-h-[24px]" />
                        ) : (
                          <div className="space-y-1.5">
                            {cellSchedules.map((schedule) => {
                              const template = templates.find(
                                (t) => t.id === schedule.templateId
                              );
                              if (!template) return null;
                              const execution = isToday
                                ? execBySchedule.get(schedule.id)
                                : undefined;
                              const complaintCount = execution
                                ? (complaintsByExecution.get(execution.id) ?? 0)
                                : 0;
                              const status = execution
                                ? calculateRouteStatus(
                                    schedule,
                                    execution,
                                    complaintCount,
                                    now
                                  )
                                : "scheduled";
                              return (
                                <CellCard
                                  key={schedule.id}
                                  template={template}
                                  schedule={schedule}
                                  execution={execution}
                                  complaintCount={complaintCount}
                                  status={status}
                                  onClickRoute={onClickRoute}
                                />
                              );
                            })}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
