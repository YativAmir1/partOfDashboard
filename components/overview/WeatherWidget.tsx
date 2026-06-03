"use client";

import { Sun, Cloud, CloudRain, CloudSun } from "lucide-react";

type Condition = "sunny" | "partly" | "cloudy" | "rainy";

interface DayForecast {
  short: string;
  date: string;
  high: number;
  low: number;
  condition: Condition;
  isToday?: boolean;
  occasionMark?: string;
}

const FORECAST: DayForecast[] = [
  { short: "א׳", date: "10.5", high: 29, low: 19, condition: "sunny",  isToday: true },
  { short: "ב׳", date: "11.5", high: 31, low: 20, condition: "sunny" },
  { short: "ג׳", date: "12.5", high: 30, low: 19, condition: "partly" },
  { short: "ד׳", date: "13.5", high: 27, low: 18, condition: "cloudy" },
  { short: "ה׳", date: "14.5", high: 26, low: 17, condition: "partly" },
  { short: "ו׳", date: "15.5", high: 30, low: 19, condition: "sunny",  occasionMark: "יום ירושלים" },
  { short: "ש׳", date: "16.5", high: 32, low: 21, condition: "sunny" },
];

const CONDITION_LABEL: Record<Condition, string> = {
  sunny:  "שמשי",
  partly: "מעונן חלקית",
  cloudy: "מעונן",
  rainy:  "גשום",
};

function WeatherIcon({ condition, size = 18 }: { condition: Condition; size?: number }) {
  if (condition === "sunny")  return <Sun        size={size} style={{ color: "#f5c000" }} />;
  if (condition === "partly") return <CloudSun   size={size} style={{ color: "#f5c000" }} />;
  if (condition === "cloudy") return <Cloud      size={size} style={{ color: "#909090" }} />;
  return                             <CloudRain  size={size} style={{ color: "#1f5fa6" }} />;
}

export function WeatherWidget() {
  const today = FORECAST[0];

  return (
    <div className="bg-white border border-[#d0d0d0] rounded-xl p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[#585858] uppercase tracking-wider">
          תחזית מזג אוויר · רמת גן
        </p>
        <span className="text-[10px] text-[#b0b0b0]">השבוע · 7 ימים</span>
      </div>

      {/* Today highlight */}
      <div className="flex items-center gap-4 px-3 py-2.5 rounded-lg bg-[#f5f9ff] border border-[#d0e4f8]">
        <WeatherIcon condition={today.condition} size={40} />
        <div>
          <p className="text-3xl font-bold text-[#1a1a1a] leading-none">{today.high}°</p>
          <p className="text-[11px] text-[#707070] mt-0.5">לילה {today.low}° · {CONDITION_LABEL[today.condition]}</p>
        </div>
        <div className="mr-auto text-right">
          <p className="text-sm font-semibold text-[#1a1a1a]">היום, ראשון</p>
          <p className="text-[11px] text-[#999999]">10 במאי 2026</p>
        </div>
      </div>

      {/* 7-day strip */}
      <div className="grid grid-cols-7 gap-1">
        {FORECAST.map((day) => (
          <div
            key={day.date}
            className="flex flex-col items-center gap-1 py-2 rounded-lg"
            style={day.isToday ? { background: "#f0f6ff" } : undefined}
          >
            <span
              className="text-[10px] font-semibold"
              style={{ color: day.isToday ? "#1f5fa6" : "#585858" }}
            >
              {day.short}
            </span>
            <WeatherIcon condition={day.condition} size={15} />
            <span className="text-xs font-bold text-[#1a1a1a]">{day.high}°</span>
            <span className="text-[10px] text-[#b0b0b0]">{day.low}°</span>
            {day.occasionMark && (
              <span className="text-[8px] font-medium text-[#f37d00] leading-tight text-center">
                {day.occasionMark}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
