"use client";

import { cn } from "@/lib/utils";
import { SparklineChart } from "@/components/shared/SparklineChart";
import { useCountUp } from "@/hooks/useCountUp";
import type { LucideIcon } from "lucide-react";

interface Props {
  label: string;
  value: number;
  unit?: string;
  decimals?: number;
  delta?: number;
  base?: number;
  sparkData?: number[];
  sparkColor?: string;
  icon: LucideIcon;
  iconColor?: string;
  invertDelta?: boolean;
  period?: string;
}

export function KpiCard({
  label,
  value,
  unit = "",
  decimals = 0,
  delta,
  base,
  sparkData,
  sparkColor,
  icon: Icon,
  iconColor = "#1f5fa6",
  invertDelta = false,
  period,
}: Props) {
  const animated = useCountUp(value);

  const isPositive = delta !== undefined && (invertDelta ? delta < 0 : delta > 0);
  const isNegative = delta !== undefined && (invertDelta ? delta > 0 : delta < 0);

  const display =
    decimals > 0 ? animated.toFixed(decimals) : animated.toString();

  return (
    <div className="bg-white border border-[#d0d0d0] rounded-xl p-4 flex flex-col gap-3 hover:border-[#1f5fa6] transition-colors">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#585858] uppercase tracking-wider">{label}</span>
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: iconColor + "22" }}
        >
          <Icon size={14} style={{ color: iconColor }} />
        </div>
      </div>

      <div className="flex items-end justify-between gap-2">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-[#1a1a1a] count-up">{display}</span>
            {unit && <span className="text-sm text-[#585858]">{unit}</span>}
          </div>
          {delta !== undefined && (
            <span
              className={cn(
                "text-xs font-medium",
                isPositive && "text-[#459524]",
                isNegative && "text-[#d96350]",
                !isPositive && !isNegative && "text-[#585858]"
              )}
            >
              {delta > 0 ? "+" : ""}
              {delta}
              {unit}
              {base !== undefined
                ? <span className="text-[#999999] font-normal"> מול {base}{unit}</span>
                : <span className="text-[#999999] font-normal"> מול בסיס</span>
              }
            </span>
          )}
          {period && (
            <span className="text-[10px] text-[#bbbbbb]">{period}</span>
          )}
        </div>
        {sparkData && (
          <SparklineChart
            data={sparkData}
            color={sparkColor ?? iconColor}
            width={72}
            height={36}
          />
        )}
      </div>
    </div>
  );
}
