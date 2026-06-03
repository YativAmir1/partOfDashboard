"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { useChannelEfficiency } from "@/hooks/useChannelEfficiency";
import type { DashboardFilters } from "@/lib/types";

interface Props {
  filters?: Pick<DashboardFilters, "channel">;
}

export function ChannelEfficiencyChart({ filters }: Props) {
  const { channels } = useChannelEfficiency(filters);

  return (
    <div className="bg-white border border-[#d0d0d0] rounded-xl p-4">
      <div className="mb-3">
        <p className="text-sm font-bold text-[#1a1a1a]">יעילות ערוצי תקשורת</p>
        <p className="text-[11px] text-[#585858] mt-0.5">שיעור פתרון מול הסלמה לפי ערוץ · 30 הימים האחרונים</p>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={channels}
          margin={{ top: 4, right: 8, left: -8, bottom: 100 }}
        >
          <XAxis
            dataKey="channel"
            tick={{ fontSize: 13, fill: "#1a1a1a", fontWeight: 600 }}
            angle={-45}
            textAnchor="end"
            interval={0}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#585858" }}
            domain={[0, 100]}
            unit="%"
            tickLine={false}
          />
          <Tooltip formatter={(v) => [String(v) + "%", ""]} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Bar dataKey="resolutionRate" name="שיעור פתרון" fill="#459524" radius={[3, 3, 0, 0]} />
          <Bar dataKey="escalationRate" name="שיעור הסלמה" fill="#d96350" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
