"use client";

import { useState, useMemo } from "react";
import { History, ChevronDown, CheckCircle2, XCircle, MessageSquare } from "lucide-react";
import { routeExecutions, routeComplaints } from "@/lib/data";
import {
  buildRouteHistorySummary,
  hebrewRelativeDate,
  type TrendDirection,
} from "@/lib/routeHistory";
import { cn } from "@/lib/utils";

const TREND_CONFIG: Record<TrendDirection, { label: string; symbol: string; color: string }> = {
  improving: { label: "משתפר", symbol: "↑", color: "#459524" },
  stable:    { label: "יציב",  symbol: "→", color: "#585858" },
  worsening: { label: "מדרדר", symbol: "↓", color: "#d96350" },
};

interface Props {
  scheduleId: string;
  requiredPct: number;
  complaintThreshold?: number;
}

export function RouteHistorySection({ scheduleId, requiredPct, complaintThreshold = 3 }: Props) {
  const [open, setOpen] = useState(false);

  const summary = useMemo(
    () => buildRouteHistorySummary(scheduleId, requiredPct, routeExecutions, routeComplaints),
    [scheduleId, requiredPct]
  );

  if (!summary) return null;

  const trend = TREND_CONFIG[summary.trend];
  const avgColor =
    summary.avgCompletion4w >= requiredPct ? "#459524" :
    summary.avgCompletion4w >= requiredPct - 15 ? "#f37d00" : "#d96350";

  return (
    <div className="border-t border-[#f0f0f0] pt-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full py-2 text-right"
      >
        <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#585858]">
          <History size={12} style={{ color: "#1f5fa6" }} />
          היסטוריית ביצוע
        </span>
        <ChevronDown
          size={13}
          className={cn("text-[#999999] transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="pb-3 space-y-3">
          {/* Summary banner */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#fafafa] rounded-lg p-2.5 text-center">
              <p className="text-[10px] text-[#999999] mb-0.5">השלמה ממוצעת</p>
              <p className="text-sm font-bold tabular-nums" style={{ color: avgColor }}>
                {summary.avgCompletion4w}%
              </p>
              <p className="text-[9px] text-[#bbbbbb]">4 שבועות</p>
            </div>
            <div className="bg-[#fafafa] rounded-lg p-2.5 text-center">
              <p className="text-[10px] text-[#999999] mb-0.5">תלונות</p>
              <p
                className="text-sm font-bold tabular-nums"
                style={{ color: summary.totalComplaints4w > complaintThreshold ? "#d96350" : "#585858" }}
              >
                {summary.totalComplaints4w}
              </p>
              <p className="text-[9px] text-[#bbbbbb]">4 שבועות</p>
            </div>
            <div className="bg-[#fafafa] rounded-lg p-2.5 text-center">
              <p className="text-[10px] text-[#999999] mb-0.5">מגמה</p>
              <p className="text-sm font-bold" style={{ color: trend.color }}>
                {trend.symbol}
              </p>
              <p className="text-[9px]" style={{ color: trend.color }}>{trend.label}</p>
            </div>
          </div>

          {/* Execution list */}
          <div className="space-y-0.5">
            {summary.history.map((exec) => {
              const barColor =
                exec.completionPct >= 80 ? "#459524" :
                exec.completionPct >= 50 ? "#f37d00" : "#d96350";
              const aboveThreshold = exec.complaintCount > complaintThreshold;

              return (
                <div
                  key={exec.id}
                  className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-[#fafafa] transition-colors"
                >
                  <span className="text-[10px] text-[#707070] w-20 shrink-0 text-right leading-tight">
                    {hebrewRelativeDate(exec.date)}
                  </span>
                  <div className="flex-1 h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${exec.completionPct}%`, background: barColor }}
                    />
                  </div>
                  <span
                    className="text-[10px] font-semibold tabular-nums w-7 text-left shrink-0"
                    style={{ color: barColor }}
                  >
                    {exec.completionPct}%
                  </span>
                  {exec.metRequirement ? (
                    <CheckCircle2 size={11} style={{ color: "#459524" }} className="shrink-0" />
                  ) : (
                    <XCircle size={11} style={{ color: "#d96350" }} className="shrink-0" />
                  )}
                  {exec.complaintCount > 0 ? (
                    <span
                      className="text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: aboveThreshold ? "#d9635020" : "#f3f4f6",
                        color: aboveThreshold ? "#d96350" : "#707070",
                      }}
                    >
                      {exec.complaintCount}
                    </span>
                  ) : (
                    <span className="w-5 shrink-0" />
                  )}
                  {exec.notes ? (
                    <MessageSquare size={10} className="text-[#cccccc] shrink-0" />
                  ) : (
                    <span className="w-2.5 shrink-0" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Complaint pattern insight — only when meaningful */}
          {summary.topComplaintStreet && summary.topComplaintStreetTotal >= 3 && (
            <div className="bg-[#fff8f0] border border-[#fed7aa] rounded-lg px-3 py-2">
              <p className="text-[10px] text-[#c2410c] leading-relaxed">
                רוב התלונות מגיעות מ
                <span className="font-semibold">{summary.topComplaintStreet}</span>
                {" "}({summary.topComplaintStreetCount} מתוך {summary.topComplaintStreetTotal})
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
