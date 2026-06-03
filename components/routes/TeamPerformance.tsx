"use client";

import { Users } from "lucide-react";
import type { RouteRow } from "@/lib/types";

interface TeamStat {
  team: string;
  total: number;
  completed: number;
  avgPct: number;
}

function computeTeamStats(rows: RouteRow[]): TeamStat[] {
  const map = new Map<string, RouteRow[]>();
  for (const row of rows) {
    const t = row.schedule.assignedTeam;
    if (!map.has(t)) map.set(t, []);
    map.get(t)!.push(row);
  }

  return Array.from(map.entries())
    .map(([team, teamRows]) => {
      const completed = teamRows.filter(
        (r) => r.status === "completed" || r.status === "requires_attention"
      ).length;
      const withExec = teamRows.filter((r) => r.execution);
      const avgPct =
        withExec.length > 0
          ? Math.round(
              withExec.reduce((s, r) => s + r.execution!.completionPct, 0) / withExec.length
            )
          : 0;
      return { team, total: teamRows.length, completed, avgPct };
    })
    .sort((a, b) => b.avgPct - a.avgPct);
}

export function TeamPerformance({ rows }: { rows: RouteRow[] }) {
  const stats = computeTeamStats(rows);

  return (
    <div className="bg-white border border-[#d0d0d0] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <Users size={14} color="#1f5fa6" />
        <div>
          <p className="text-xs font-semibold text-[#585858] uppercase tracking-wider">
            ביצועי צוותים · היום
          </p>
          <p className="text-[10px] text-[#999999] mt-0.5">לפי % השלמה</p>
        </div>
      </div>
      <table className="w-full text-right">
        <thead>
          <tr className="border-b border-[#f0f0f0]">
            <th className="pb-2 text-[10px] font-semibold text-[#999999] text-right">צוות</th>
            <th className="pb-2 text-[10px] font-semibold text-[#999999] text-center w-16">
              מסלולים
            </th>
            <th className="pb-2 text-[10px] font-semibold text-[#999999] text-right w-28">
              השלמה
            </th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s) => {
            const color =
              s.avgPct >= 80 ? "#459524" : s.avgPct >= 50 ? "#f37d00" : "#d96350";
            return (
              <tr
                key={s.team}
                className="border-b border-[#f8f8f8] last:border-0 hover:bg-[#fafafa]"
              >
                <td className="py-2.5">
                  <span className="text-xs text-[#1a1a1a]">{s.team}</span>
                </td>
                <td className="py-2.5 text-center">
                  <span className="text-xs text-[#585858] tabular-nums">
                    {s.completed}/{s.total}
                  </span>
                </td>
                <td className="py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${s.avgPct}%`, background: color }}
                      />
                    </div>
                    <span
                      className="text-xs font-semibold tabular-nums w-8 text-left shrink-0"
                      style={{ color }}
                    >
                      {s.avgPct}%
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
