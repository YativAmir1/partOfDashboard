"use client";

import { useCountUp } from "@/hooks/useCountUp";

interface Props {
  score: number;
}

function getColor(score: number) {
  if (score >= 80) return "#459524";
  if (score >= 65) return "#ffbb00";
  return "#d96350";
}

function getLabel(score: number) {
  if (score >= 80) return "חזק";
  if (score >= 65) return "במעקב";
  return "בסיכון";
}

export function CityHealthGauge({ score }: Props) {
  const animated = useCountUp(score);
  const color = getColor(score);
  const label = getLabel(score);

  const radius = 56;
  const circumference = Math.PI * radius;
  const pct = Math.min(animated / 100, 1);
  const dashOffset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={160} height={100} viewBox="0 0 160 100">
        <path
          d={`M 12 88 A ${radius} ${radius} 0 0 1 148 88`}
          fill="none"
          stroke="#d0d0d0"
          strokeWidth={14}
          strokeLinecap="round"
        />
        <path
          d={`M 12 88 A ${radius} ${radius} 0 0 1 148 88`}
          fill="none"
          stroke={color}
          strokeWidth={14}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 0.6s ease, stroke 0.6s ease" }}
        />
        <text x="80" y="78" textAnchor="middle" fill="#1a1a1a" fontSize="28" fontWeight="bold">
          {animated}
        </text>
        <text x="80" y="95" textAnchor="middle" fill={color} fontSize="11" fontWeight="600">
          {label}
        </text>
      </svg>
      <p className="text-xs text-[#585858] uppercase tracking-wider">ציון מצב עירוני</p>
    </div>
  );
}
