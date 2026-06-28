"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import type { RouteRow, CalculatedRouteStatus, TimeWindow } from "@/lib/types";
import { ROUTE_STATUS_COLORS, ROUTE_STATUS_LABELS } from "@/lib/routeUtils";

const ORIGIN = 360; // 06:00 in minutes from midnight
const CHART_END = 660; // 17:00 from ORIGIN = 23:00 absolute → 11 hours × 60

function toMin(timeStr: string): number {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

function minToLabel(offset: number): string {
  const total = ORIGIN + offset;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return m === 0 ? `${h}:00` : `${h}:${String(m).padStart(2, "0")}`;
}

interface TimelineEntry {
  name: string;
  fullName: string;
  gap: number;
  bar: number;
  status: CalculatedRouteStatus;
  schedStart: string;
  schedEnd: string;
  actualStart: string | null;
  actualEnd: string | null;
  pct: number;
}

function windowStatus(win: TimeWindow, now: Date): CalculatedRouteStatus {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const endMin = toMin(win.endTime);
  const startMin = toMin(win.startTime);
  if (nowMin >= endMin) return "completed";
  if (nowMin >= startMin) return "in_progress";
  return "scheduled";
}

function buildData(rows: RouteRow[], now: Date): TimelineEntry[] {
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const entries: TimelineEntry[] = [];

  for (const row of rows) {
    const exec = row.execution;
    const baseName = row.template.name.replace(/^מסלול /, "");
    const isDaily = row.schedule.recurrenceType === "daily";
    const windows =
      isDaily && (row.schedule.dailyTimeWindows?.length ?? 0) > 1
        ? row.schedule.dailyTimeWindows!
        : null;

    if (windows) {
      windows.forEach((win, idx) => {
        const schedStart = Math.max(toMin(win.startTime) - ORIGIN, 0);
        const schedEnd = toMin(win.endTime) - ORIGIN;
        const status = windowStatus(win, now);
        entries.push({
          name: `${baseName} (${idx + 1})`,
          fullName: `${row.template.name} — הפעלה ${idx + 1}`,
          gap: schedStart,
          bar: Math.max(schedEnd - schedStart, 10),
          status,
          schedStart: win.startTime,
          schedEnd: win.endTime,
          actualStart: null,
          actualEnd: null,
          pct: status === "completed" && exec ? exec.completionPct : 0,
        });
      });
      continue;
    }

    if (!exec?.actualStartTime) {
      const schedStart = toMin(row.schedule.scheduledStartTime) - ORIGIN;
      const schedEnd = toMin(row.schedule.scheduledEndTime) - ORIGIN;
      entries.push({
        name: baseName,
        fullName: row.template.name,
        gap: schedStart,
        bar: Math.max(schedEnd - schedStart, 10),
        status: row.status,
        schedStart: row.schedule.scheduledStartTime,
        schedEnd: row.schedule.scheduledEndTime,
        actualStart: null,
        actualEnd: null,
        pct: 0,
      });
    } else {
      const actualStart = toMin(exec.actualStartTime) - ORIGIN;
      const actualEnd = exec.actualEndTime
        ? toMin(exec.actualEndTime) - ORIGIN
        : nowMin - ORIGIN;
      entries.push({
        name: baseName,
        fullName: row.template.name,
        gap: actualStart,
        bar: Math.max(actualEnd - actualStart, 10),
        status: row.status,
        schedStart: row.schedule.scheduledStartTime,
        schedEnd: row.schedule.scheduledEndTime,
        actualStart: exec.actualStartTime,
        actualEnd: exec.actualEndTime ?? null,
        pct: exec.completionPct,
      });
    }
  }

  return entries;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: any[] }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload as TimelineEntry;
  if (!d) return null;
  const color = ROUTE_STATUS_COLORS[d.status];

  return (
    <div
      dir="rtl"
      className="bg-white border border-[#d0d0d0] rounded-xl p-3 shadow-lg"
      style={{ minWidth: 200 }}
    >
      <p className="text-xs font-semibold text-[#1a1a1a] mb-2">{d.fullName}</p>
      <div
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold mb-2"
        style={{ background: color + "20", color }}
      >
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
        {ROUTE_STATUS_LABELS[d.status]}
      </div>
      <div className="space-y-1 text-[11px]">
        <div className="flex justify-between gap-6">
          <span className="text-[#707070]">מתוכנן</span>
          <span className="text-[#1a1a1a] font-medium">
            {d.schedStart}–{d.schedEnd}
          </span>
        </div>
        {d.actualStart && (
          <div className="flex justify-between gap-6">
            <span className="text-[#707070]">בפועל</span>
            <span className="text-[#1a1a1a] font-medium">
              {d.actualStart}
              {d.actualEnd ? `–${d.actualEnd}` : " (פעיל)"}
            </span>
          </div>
        )}
        <div className="flex justify-between gap-6">
          <span className="text-[#707070]">השלמה</span>
          <span className="font-semibold" style={{ color }}>
            {d.pct}%
          </span>
        </div>
      </div>
    </div>
  );
}

const TICKS = [0, 60, 120, 180, 240, 300, 360, 420, 480, 540, 600, 660];

// Colors exactly as the timeline bars render them (the <Cell> below paints
// "scheduled" as a muted gray rather than ROUTE_STATUS_COLORS.scheduled).
// Deriving the legend from this map keeps it in sync with the bars.
const TIMELINE_BAR_COLORS: Record<CalculatedRouteStatus, string> = {
  ...ROUTE_STATUS_COLORS,
  scheduled: "#c8c8c8",
};

const LEGEND_ORDER: CalculatedRouteStatus[] = [
  "completed",
  "in_progress",
  "delayed",
  "requires_attention",
  "scheduled",
];

const LEGEND = LEGEND_ORDER.map((status) => ({
  color: TIMELINE_BAR_COLORS[status],
  label: ROUTE_STATUS_LABELS[status],
  opacity: status === "scheduled" ? 0.6 : 1,
}));

export function TimelineChart({ rows, now }: { rows: RouteRow[]; now: Date }) {
  const data = buildData(rows, now);
  const nowOffset = now.getHours() * 60 + now.getMinutes() - ORIGIN;
  const chartHeight = Math.max(160, data.length * 34 + 20);

  return (
    <div className="bg-white border border-[#d0d0d0] rounded-xl p-4">
      <div className="mb-4">
        <p className="text-xs font-semibold text-[#585858] uppercase tracking-wider">
          ציר זמן · ביצוע יומי
        </p>
        <p className="text-[10px] text-[#999999] mt-0.5">מסלולים פעילים היום · 06:00–17:00</p>
      </div>
      <div dir="ltr">
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart
            layout="vertical"
            data={data}
            margin={{ left: 8, right: 24, top: 4, bottom: 4 }}
            barCategoryGap="35%"
          >
            <XAxis
              type="number"
              domain={[0, CHART_END]}
              ticks={TICKS}
              tickFormatter={minToLabel}
              tick={{ fill: "#707070", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              dataKey="name"
              type="category"
              width={115}
              tick={{ fill: "#585858", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "#eef4fb", opacity: 0.4 }}
            />
            <ReferenceLine
              x={nowOffset}
              stroke="#1f5fa6"
              strokeWidth={1.5}
              strokeDasharray="4 3"
              label={{ value: "עכשיו", fill: "#1f5fa6", fontSize: 10, position: "top" }}
            />
            <Bar
              dataKey="gap"
              stackId="tl"
              fill="none"
              isAnimationActive={false}
              legendType="none"
            />
            <Bar
              dataKey="bar"
              stackId="tl"
              radius={[0, 4, 4, 0]}
              isAnimationActive={false}
              barSize={14}
            >
              {data.map((entry, i) => (
                <Cell
                  key={i}
                  fill={
                    entry.status === "scheduled"
                      ? "#c8c8c8"
                      : ROUTE_STATUS_COLORS[entry.status]
                  }
                  opacity={entry.status === "scheduled" ? 0.6 : 1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div dir="rtl" className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 justify-end">
        {LEGEND.map(({ color, label, opacity }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span
              className="w-3 h-2 rounded-sm inline-block"
              style={{ background: color, opacity }}
            />
            <span className="text-[10px] text-[#707070]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
