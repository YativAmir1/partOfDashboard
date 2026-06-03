"use client";

import Link from "next/link";
import { Route, ArrowLeft } from "lucide-react";
import { useMemo } from "react";
import {
  routeSchedules,
  routeTemplates,
  routeExecutions,
  routeComplaints,
} from "@/lib/data";
import {
  calculateRouteStatus,
  ROUTE_STATUS_COLORS,
  ROUTE_STATUS_LABELS,
} from "@/lib/routeUtils";
import type { CalculatedRouteStatus } from "@/lib/types";

const MOCK_NOW = new Date("2026-05-28T10:30:00");
const TODAY_DAY_KEY = "thu";

const SUMMARY_ITEMS: { status: CalculatedRouteStatus; label: string }[] = [
  { status: "completed",          label: "הושלמו" },
  { status: "in_progress",        label: "בביצוע" },
  { status: "delayed",            label: "באיחור" },
  { status: "requires_attention", label: "דורשים התערבות" },
  { status: "scheduled",          label: "מתוכננים" },
];

export function RoutesStatusWidget() {
  const execBySchedule = useMemo(() => {
    const m = new Map<string, (typeof routeExecutions)[0]>();
    routeExecutions.forEach((e) => m.set(e.scheduleId, e));
    return m;
  }, []);

  const complaintsByExecution = useMemo(() => {
    const m = new Map<string, number>();
    routeComplaints.forEach((c) => {
      m.set(c.executionId, (m.get(c.executionId) ?? 0) + 1);
    });
    return m;
  }, []);

  const todayRows = useMemo(() => {
    return routeSchedules
      .filter((s) => s.dayOfWeek.includes(TODAY_DAY_KEY))
      .map((schedule) => {
        const template = routeTemplates.find((t) => t.id === schedule.templateId)!;
        const execution = execBySchedule.get(schedule.id);
        const complaintCount = execution
          ? (complaintsByExecution.get(execution.id) ?? 0)
          : 0;
        const status: CalculatedRouteStatus = execution
          ? calculateRouteStatus(schedule, execution, complaintCount, MOCK_NOW)
          : "scheduled";
        return { schedule, template, status };
      });
  }, [execBySchedule, complaintsByExecution]);

  const summary = useMemo(() => {
    const counts: Partial<Record<CalculatedRouteStatus, number>> = {};
    todayRows.forEach((r) => {
      counts[r.status] = (counts[r.status] ?? 0) + 1;
    });
    return counts;
  }, [todayRows]);

  return (
    <section className="bg-white border border-[#d0d0d0] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#1f5fa622] flex items-center justify-center">
            <Route size={15} className="text-[#1f5fa6]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#1a1a1a] leading-tight">מסלולים היום</p>
            <p className="text-[10px] text-[#999999]">{todayRows.length} מסלולים מתוכננים</p>
          </div>
        </div>
        <Link
          href="/routes"
          className="inline-flex items-center gap-1 text-xs font-medium text-[#1f5fa6] hover:underline shrink-0"
        >
          כל המסלולים
          <ArrowLeft size={12} />
        </Link>
      </div>

      {/* Status summary chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {SUMMARY_ITEMS.map(({ status, label }) => {
          const count = summary[status] ?? 0;
          if (count === 0) return null;
          const color = ROUTE_STATUS_COLORS[status];
          return (
            <span
              key={status}
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ background: color + "20", color }}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
              {count} {label}
            </span>
          );
        })}
      </div>

      {/* Route list */}
      <div className="space-y-1.5">
        {todayRows.map(({ schedule, template, status }) => {
          const color = ROUTE_STATUS_COLORS[status];
          return (
            <Link
              key={schedule.id}
              href={`/routes?scheduleId=${schedule.id}`}
              className="flex items-center justify-between gap-2 rounded-lg border border-[#e8e8e8] px-2.5 py-2 hover:border-[#1f5fa6] hover:bg-[#f5f9ff] transition-colors"
              style={{ borderRight: `3px solid ${color}` }}
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#1a1a1a] truncate">{template.name}</p>
                <p className="text-[10px] text-[#999999]">
                  {schedule.scheduledStartTime}–{schedule.scheduledEndTime} · {schedule.assignedTeam}
                </p>
              </div>
              <span
                className="shrink-0 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold"
                style={{ background: color + "20", color }}
              >
                <span className="w-1 h-1 rounded-full shrink-0" style={{ background: color }} />
                {ROUTE_STATUS_LABELS[status]}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
