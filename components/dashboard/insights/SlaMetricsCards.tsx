"use client";

import { useSlaMetrics } from "@/hooks/useSlaMetrics";
import { Clock, CheckCircle2, AlertCircle, TrendingDown, TrendingUp } from "lucide-react";

export function SlaMetricsCards() {
  const { avgResponseTime, avgResolutionTime, slaBreachRate } = useSlaMetrics();

  const cards = [
    {
      label: "זמן תגובה ממוצע",
      value: `${avgResponseTime} דק׳`,
      trendLabel: "ירידה",
      trendDown: true,
      icon: Clock,
      color: "#1f5fa6",
      bg: "#1f5fa615",
    },
    {
      label: "זמן פתרון ממוצע",
      value: `${avgResolutionTime} דק׳`,
      trendLabel: "יציב",
      trendDown: true,
      icon: CheckCircle2,
      color: "#459524",
      bg: "#45952415",
    },
    {
      label: "חריגת SLA",
      value: `${slaBreachRate}%`,
      trendLabel: "עלייה קלה",
      trendDown: false,
      icon: AlertCircle,
      color: "#d96350",
      bg: "#d9635015",
    },
  ] as const;

  return (
    <div className="grid grid-cols-3 gap-4">
      {cards.map(({ label, value, trendLabel, trendDown, icon: Icon, color, bg }) => (
        <div key={label} className="bg-white border border-[#d0d0d0] rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: bg }}
            >
              <Icon size={15} style={{ color }} />
            </div>
            <div
              className="flex items-center gap-1"
              style={{ color: trendDown ? "#459524" : "#d96350" }}
            >
              {trendDown ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
              <span className="text-[10px]">{trendLabel}</span>
            </div>
          </div>
          <p className="text-2xl font-bold text-[#1a1a1a]">{value}</p>
          <p className="text-[10px] text-[#585858] mt-0.5">{label}</p>
          <p className="text-[10px] text-[#bbbbbb] mt-0.5">30 הימים האחרונים</p>
        </div>
      ))}
    </div>
  );
}
