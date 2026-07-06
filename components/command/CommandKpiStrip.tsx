"use client";

import { AlertOctagon, Clock, Truck, CheckCircle2, Bot } from "lucide-react";
import { useCommandCenter } from "@/context/CommandCenterContext";

export function CommandKpiStrip() {
  const { stats } = useCommandCenter();

  const tiles = [
    { label: "אורות אדומים", value: stats.redLights, icon: AlertOctagon, color: "#dc2626", bg: "#fef2f2" },
    { label: "בחריגת SLA", value: stats.breached, icon: Clock, color: "#c2410c", bg: "#fff7ed" },
    { label: "צוותים בשטח", value: stats.dispatched, icon: Truck, color: "#1f5fa6", bg: "#eff6ff" },
    { label: "נסגרו (7 ימים)", value: stats.resolved, icon: CheckCircle2, color: "#15803d", bg: "#f0fdf4" },
    { label: "פעולות אוטומטיות", value: stats.autonomousActions, icon: Bot, color: "#7c3aed", bg: "#faf5ff" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {tiles.map((t) => (
        <div
          key={t.label}
          className="flex items-center gap-3 rounded-xl border border-[#e2e2e2] bg-white px-4 py-3"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: t.bg }}>
            <t.icon size={18} style={{ color: t.color }} />
          </span>
          <div>
            <p className="text-xl font-bold leading-none text-[#1a1a1a]">{t.value}</p>
            <p className="mt-1 text-[11px] text-[#777]">{t.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
