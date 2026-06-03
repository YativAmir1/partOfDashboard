"use client";

import { Trash2, Leaf, ShieldCheck } from "lucide-react";
import type { RouteRow } from "@/lib/types";

const CATS = [
  { key: "waste",  label: "פינוי אשפה",     color: "#1f5fa6", Icon: Trash2     },
  { key: "parks",  label: "גינון ופארקים",   color: "#459524", Icon: Leaf       },
  { key: "safety", label: "ביקורת ושילוט",  color: "#ffbb00", Icon: ShieldCheck },
] as const;

type CatKey = (typeof CATS)[number]["key"];

interface CatStat {
  total: number;
  done: number;
  avgPct: number;
  complaints: number;
}

function computeStats(rows: RouteRow[]): Record<CatKey, CatStat> {
  const blank = (): CatStat => ({ total: 0, done: 0, avgPct: 0, complaints: 0 });
  const acc: Record<string, CatStat> = { waste: blank(), parks: blank(), safety: blank() };

  for (const row of rows) {
    const cat = row.template.category as CatKey;
    if (!(cat in acc)) continue;
    acc[cat].total += 1;
    if (row.status === "completed" || row.status === "requires_attention") acc[cat].done += 1;
    if (row.execution) acc[cat].avgPct += row.execution.completionPct;
    acc[cat].complaints += row.complaintCount;
  }

  for (const cat of Object.keys(acc)) {
    const s = acc[cat];
    s.avgPct = s.total > 0 ? Math.round(s.avgPct / s.total) : 0;
  }

  return acc as Record<CatKey, CatStat>;
}

export function CategoryBreakdown({ rows }: { rows: RouteRow[] }) {
  const stats = computeStats(rows);

  return (
    <div>
      <p className="text-[10px] font-semibold text-[#999999] uppercase tracking-wider mb-2">
        ביצועים לפי קטגוריה · היום
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {CATS.map(({ key, label, color, Icon }) => {
          const s = stats[key];
          const donePct = s.total > 0 ? Math.round((s.done / s.total) * 100) : 0;
          const barColor =
            donePct >= 80 ? "#459524" : donePct >= 50 ? "#f37d00" : "#d96350";

          return (
            <div
              key={key}
              className="bg-white border border-[#d0d0d0] rounded-xl p-4 hover:border-[#1f5fa6] transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: color + "18" }}
                  >
                    <Icon size={14} style={{ color }} />
                  </div>
                  <span className="text-xs font-semibold text-[#1a1a1a]">{label}</span>
                </div>
                <span className="text-[10px] text-[#999999]">
                  {s.total === 0 ? "אין היום" : `${s.total} מסלולים`}
                </span>
              </div>

              {s.total === 0 ? (
                <p className="text-[11px] text-[#cccccc] mt-1">לא מתוכנן להיום</p>
              ) : (
                <div className="space-y-2.5">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-[#707070]">הושלם</span>
                      <span
                        className="text-xs font-bold tabular-nums"
                        style={{ color: barColor }}
                      >
                        {s.done}/{s.total}
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${donePct}%`, background: barColor }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#707070]">% השלמה ממוצע</span>
                    <span
                      className="text-xs font-semibold tabular-nums"
                      style={{ color: barColor }}
                    >
                      {s.avgPct}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-[#707070]">תלונות</span>
                    <span
                      className="text-xs font-semibold tabular-nums"
                      style={{ color: s.complaints > 0 ? "#d96350" : "#459524" }}
                    >
                      {s.complaints}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
