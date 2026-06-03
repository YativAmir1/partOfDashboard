"use client";

import { AlertCircle } from "lucide-react";
import type { RouteComplaint } from "@/lib/types";

interface StreetStat {
  street: string;
  count: number;
  lastTime: string;
}

function groupByStreet(complaints: RouteComplaint[]): StreetStat[] {
  const map = new Map<string, { count: number; lastTs: string }>();
  for (const c of complaints) {
    const cur = map.get(c.street);
    if (!cur) {
      map.set(c.street, { count: 1, lastTs: c.timestamp });
    } else {
      cur.count += 1;
      if (c.timestamp > cur.lastTs) cur.lastTs = c.timestamp;
    }
  }
  return Array.from(map.entries())
    .map(([street, { count, lastTs }]) => ({
      street,
      count,
      lastTime: lastTs.slice(11, 16),
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

export function ComplaintStreets({ complaints }: { complaints: RouteComplaint[] }) {
  const rows = groupByStreet(complaints);

  return (
    <div className="bg-white border border-[#d0d0d0] rounded-xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle size={14} color="#d96350" />
        <div>
          <p className="text-xs font-semibold text-[#585858] uppercase tracking-wider">
            רחובות עם תלונות · היום
          </p>
          <p className="text-[10px] text-[#999999] mt-0.5">לפי ריכוז תלונות</p>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-[#bbbbbb] text-center py-4">אין תלונות היום</p>
      ) : (
        <table className="w-full text-right">
          <thead>
            <tr className="border-b border-[#f0f0f0]">
              <th className="pb-2 text-[10px] font-semibold text-[#999999] text-right">
                רחוב
              </th>
              <th className="pb-2 text-[10px] font-semibold text-[#999999] text-center w-16">
                תלונות
              </th>
              <th className="pb-2 text-[10px] font-semibold text-[#999999] text-center w-16">
                אחרונה
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.street}
                className="border-b border-[#f8f8f8] last:border-0 hover:bg-[#fafafa]"
              >
                <td className="py-2.5">
                  <div
                    className="flex items-center"
                    style={{
                      borderRight: `3px solid ${r.count > 1 ? "#d96350" : "#f37d00"}`,
                      paddingRight: 8,
                    }}
                  >
                    <span className="text-xs text-[#1a1a1a]">{r.street}</span>
                  </div>
                </td>
                <td className="py-2.5 text-center">
                  <span
                    className="text-sm font-bold tabular-nums"
                    style={{ color: r.count > 1 ? "#d96350" : "#f37d00" }}
                  >
                    {r.count}
                  </span>
                </td>
                <td className="py-2.5 text-center">
                  <span className="text-[11px] text-[#707070] tabular-nums">{r.lastTime}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
