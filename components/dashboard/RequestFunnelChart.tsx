"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import type { RequestFunnel, RequestFunnelStatus } from "@/lib/types";

interface Props {
  funnel: RequestFunnel[];
}

const STATUS_LABELS: Record<RequestFunnelStatus, string> = {
  new:             "פניות",
  inProgress:      "החל טיפול",
  assignedToField: "שוגר לשטח",
  resolved:        "טופלו",
  newComplaints:   "פניות חדשות",
  misrouted:       "הופנה שגוי",
};

const STATUS_COLORS: Record<RequestFunnelStatus, string> = {
  new:             "#1f5fa6",
  inProgress:      "#f37d00",
  assignedToField: "#ffbb00",
  resolved:        "#459524",
  newComplaints:   "#7c3aed",
  misrouted:       "#d96350",
};

function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    setDark(el.classList.contains("dark-mode"));
    const obs = new MutationObserver(() =>
      setDark(el.classList.contains("dark-mode")),
    );
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

export function RequestFunnelChart({ funnel }: Props) {
  const isDark = useDarkMode();

  const data = funnel.map((item) => ({
    ...item,
    label: STATUS_LABELS[item.status],
    fill:  STATUS_COLORS[item.status],
  }));

  const tickColor = isDark ? "#cbd5e1" : "#3a3a3a";

  return (
    <div className="bg-white border border-[#d0d0d0] rounded-xl p-4">
      <p className="text-xs font-semibold text-[#585858] uppercase tracking-wider mb-4">
        משפך טיפול בפניות
      </p>
      <div dir="ltr">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={data}
            margin={{ top: 16, right: 24, left: 0, bottom: 4 }}
            barCategoryGap="20%"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={isDark ? "#334155" : "#e8e8e8"}
              vertical={false}
            />
            <XAxis
              dataKey="label"
              tick={{ fill: tickColor, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: tickColor, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={32}
            />
            <Tooltip
              contentStyle={{
                background: isDark ? "#1e293b" : "#ffffff",
                border: `1px solid ${isDark ? "#334155" : "#d0d0d0"}`,
                borderRadius: 8,
                fontSize: 12,
                color: isDark ? "#f8fafc" : "#1a1a1a",
              }}
              cursor={{ fill: isDark ? "#172033" : "#eef4fb", opacity: 0.5 }}
              formatter={(v) => [v, "פניות"]}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              <LabelList
                dataKey="count"
                position="top"
                style={{ fill: tickColor, fontSize: 11, fontWeight: 600 }}
              />
              {data.map((entry) => (
                <Cell key={entry.status} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
