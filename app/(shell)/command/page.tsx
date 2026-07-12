"use client";

import { useState } from "react";
import { Radio, Trash2 } from "lucide-react";
import { CommandCenterProvider, useCommandCenter } from "@/context/CommandCenterContext";
import { CommandKpiStrip } from "@/components/command/CommandKpiStrip";
import { CaseCard } from "@/components/command/CaseCard";
import { IncidentCockpit } from "@/components/command/IncidentCockpit";
import { ActivityFeed } from "@/components/command/ActivityFeed";

type Filter = "all" | "red" | "breached";

function CommandCenterInner() {
  const { activeCases, recycleBin, selectedId, select, now } = useCommandCenter();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = activeCases.filter((c) => {
    if (filter === "red") return c.redLights.length > 0;
    if (filter === "breached") return c.sla.tier === "action" || c.sla.tier === "critical";
    return true;
  });

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: "all", label: "כל הפניות", count: activeCases.length },
    { key: "red", label: "אורות אדומים", count: activeCases.filter((c) => c.redLights.length > 0).length },
    { key: "breached", label: "חריגות SLA", count: activeCases.filter((c) => c.sla.tier === "action" || c.sla.tier === "critical").length },
  ];

  // A case is selected → open the full-screen incident cockpit.
  if (selectedId) return <IncidentCockpit />;

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-[#1a1a1a]">
            <Radio size={22} className="text-[#1f5fa6]" /> מרכז שליטה — טיפול בפניות
          </h1>
          <p className="mt-1 text-sm text-[#666]">
            זיהוי → טריאז' → שיגור → מעקב SLA → אימות סגירה. המערכת מטפלת, לא רק מציגה.
          </p>
        </div>
        <div className="text-left">
          <p className="text-[11px] text-[#999]">שעת מערכת</p>
          <p className="font-mono text-sm font-semibold text-[#1a1a1a]">
            {now.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
        </div>
      </div>

      <CommandKpiStrip />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_320px]">
        {/* Action queue */}
        <div>
          <div className="mb-3 flex gap-2">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setFilter(t.key)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  filter === t.key
                    ? "bg-[#1f5fa6] text-white"
                    : "border border-[#e2e2e2] bg-white text-[#585858] hover:bg-[#f5f5f5]"
                }`}
              >
                {t.label}
                <span
                  className={`rounded-full px-1.5 text-[11px] ${
                    filter === t.key ? "bg-white/20" : "bg-[#f1f1f1] text-[#666]"
                  }`}
                >
                  {t.count}
                </span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {filtered.map((c) => (
              <CaseCard key={c.id} c={c} selected={c.id === selectedId} onClick={() => select(c.id)} />
            ))}
            {filtered.length === 0 && (
              <p className="col-span-full py-8 text-center text-sm text-[#999]">אין פניות בקטגוריה זו 🎉</p>
            )}
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-4">
          <ActivityFeed />

          {/* Recycle bin */}
          <div className="rounded-xl border border-[#e2e2e2] bg-white p-4">
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-[#1a1a1a]">
              <Trash2 size={15} className="text-[#94a3b8]" /> סל מיחזור · נסגרו
            </h3>
            <p className="mb-3 text-[11px] text-[#999]">פניות שטופלו נשמרות 7 ימים ואז נמחקות אוטומטית.</p>
            {recycleBin.length === 0 ? (
              <p className="text-xs text-[#999]">אין פניות סגורות.</p>
            ) : (
              <ul className="space-y-2">
                {recycleBin.map((c) => (
                  <li key={c.id} className="rounded-lg bg-[#f8fafc] px-3 py-2">
                    <p className="text-xs font-medium text-[#1a1a1a] line-clamp-1">{c.description}</p>
                    <p className="text-[10px] text-[#94a3b8]">
                      {c.street} · נסגר {new Date(c.resolvedAt!).toLocaleDateString("he-IL")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CommandCenterPage() {
  return (
    <CommandCenterProvider>
      <CommandCenterInner />
    </CommandCenterProvider>
  );
}
