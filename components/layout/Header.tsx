"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useDemo } from "@/context/DemoContext";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { cn } from "@/lib/utils";

export function Header() {
  const { isScenarioRunning } = useDemo();
  const [time, setTime] = useState("");
  const [dateLabel, setDateLabel] = useState("");

  useEffect(() => {
    setDateLabel(
      new Date().toLocaleDateString("he-IL", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "Asia/Jerusalem",
      })
    );

    const tick = () =>
      setTime(
        new Date().toLocaleTimeString("he-IL", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          timeZone: "Asia/Jerusalem",
        })
      );
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const isRunning = isScenarioRunning;

  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-6 px-6 h-28 border-b border-[#d0d0d0] bg-white shrink-0">
      <div className="flex min-w-0 items-center gap-3">
        <h1 className="text-base font-semibold text-[#1a1a1a]">מערכת שליטה ובקרה חכמה</h1>
        <span className="text-[#d0d0d0] text-xs">|</span>
        <span className="text-[#999999] text-xs">
          {dateLabel}
        </span>
      </div>

      <Link href="/overview" aria-label="תמונת מצב עירונית" className="shrink-0">
        <img
          src="/brand/wide-logo.png"
          alt="רמת גן"
          className="h-24 w-auto max-w-[420px] object-contain transition-transform hover:scale-[1.03]"
        />
      </Link>

      <div className="flex min-w-0 items-center justify-end gap-4">
        <span className="text-[#707070] text-sm font-mono">{time}</span>
        <ThemeToggle />

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#d0d0d0] bg-[#f4f4f4]">
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              isRunning ? "bg-[#1f5fa6] ai-pulse" : "bg-[#459524]"
            )}
          />
          <span className="text-xs font-medium text-[#1a1a1a]">
            {isRunning ? "מנוע בינה · תרחיש פעיל" : "מקוון"}
          </span>
        </div>
      </div>
    </header>
  );
}
