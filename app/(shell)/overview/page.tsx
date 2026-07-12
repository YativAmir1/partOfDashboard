"use client";

import { useMemo, useState } from "react";
import { useDemo } from "@/context/DemoContext";
import { KpiCard } from "@/components/overview/KpiCard";
import { CriticalAlertsSection } from "@/components/overview/CriticalAlertsSection";
import { TopCategoriesWidget } from "@/components/dashboard/TopCategoriesWidget";
import { complaints, trends } from "@/lib/data";
import { DISTRICT_LABELS } from "@/lib/hebrew";
import type { District } from "@/lib/types";
import {
  Clock, Smile, Ticket, Shield,
  Loader2, CheckCircle2, AlertTriangle, ArrowLeft,
  ChevronDown, ChevronUp,
} from "lucide-react";
import Link from "next/link";
import { RoutesStatusWidget } from "@/components/overview/RoutesStatusWidget";

const COMPLAINT_STATUS_LABELS: Record<"open" | "closed" | "breached", string> = {
  open: "חדשות",
  closed: "טופלו",
  breached: "בטיפול",
};

const DISTRICTS = Object.keys(DISTRICT_LABELS) as District[];

const satisfactionSpark = trends.map((t) => t.satisfaction);
const slaSpark          = trends.map((t) => t.slaCompliance);
const responseSpark     = trends.map((t) => t.responseTime);
const complaintsSpark   = trends.map((t) => t.complaints);

const PHASE_COLORS: Record<string, string> = {
  anomaly_detected:       "#d96350",
  ai_correlation:         "#f37d00",
  recommendation_created: "#ffbb00",
  task_dispatched:        "#1f5fa6",
  citizen_updated:        "#009dc3",
  kpi_improving:          "#459524",
  resolved:               "#459524",
};

const PHASE_LABELS: Record<string, string> = {
  anomaly_detected:       "חריגה זוהתה",
  ai_correlation:         "קורלציה פעילה",
  recommendation_created: "פעולה מומלצת",
  task_dispatched:        "צוותי שפ״ע שוגרו",
  citizen_updated:        "מוקד 109 הופעל",
  kpi_improving:          "השירות מתאושש",
  resolved:               "הפנייה טופלה",
};

const TREND_COMPARISON = (() => {
  const previous = trends[0];
  const current = trends[trends.length - 1];
  return [
    {
      label: "היקף פניות",
      current: 312,
      previous: 344,
      unit: "",
      betterWhenLower: true,
      color: "#1f5fa6",
    },
    {
      label: "עמידה ב-SLA",
      current: current.slaCompliance,
      previous: previous.slaCompliance,
      unit: "%",
      betterWhenLower: false,
      color: "#459524",
    },
    {
      label: "זמן תגובה",
      current: current.responseTime,
      previous: previous.responseTime,
      unit: " דק׳",
      betterWhenLower: true,
      color: "#f37d00",
    },
    {
      label: "שביעות רצון",
      current: current.satisfaction,
      previous: previous.satisfaction,
      unit: "%",
      betterWhenLower: false,
      color: "#009dc3",
    },
  ];
})();

function TrendDelta({
  current,
  previous,
  betterWhenLower,
}: {
  current: number;
  previous: number;
  betterWhenLower: boolean;
}) {
  const delta = current - previous;
  const improved = betterWhenLower ? delta < 0 : delta > 0;
  const label = delta > 0 ? `+${delta}` : `${delta}`;

  return (
    <span
      className="text-[10px] font-bold"
      style={{ color: delta === 0 ? "#707070" : improved ? "#459524" : "#d96350" }}
    >
      {label}
    </span>
  );
}

export default function OverviewPage() {
  const { currentKpi, scenario, isScenarioRunning, isScenarioComplete } = useDemo();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | undefined>(undefined);
  const [requestsExpanded, setRequestsExpanded] = useState(false);
  const { sourceStats, totalRequests, totals } = useMemo(() => {
    const stats = [
      {
        source: "resident",
        label: "פניות תושבים",
        description: "מוקד 109, פניות תושב ודיווחי שטח",
        color: "#1f5fa6",
        total: 187,
        open: 81,
        closed: 59,
        breached: 47,
        percentage: 60,
      },
      {
        source: "iot",
        label: "IoT וחיישנים",
        description: "מצלמות, פחים חכמים וחיישנים עירוניים",
        color: "#009dc3",
        total: 94,
        open: 41,
        closed: 29,
        breached: 24,
        percentage: 30,
      },
      {
        source: "prediction",
        label: "חיזויים",
        description: "חיזויי עומס, תחזוקה מונעת וניתוח בינה",
        color: "#7c3aed",
        total: 31,
        open: 14,
        closed: 10,
        breached: 7,
        percentage: 10,
      },
    ];
    return {
      totalRequests: 312,
      sourceStats: stats,
      totals: { open: 136, closed: 98, breached: 78 },
    };
  }, []);
  const categories = useMemo(() => {
    const source = selectedDistrict
      ? complaints.filter((c) => c.district === selectedDistrict)
      : complaints;
    const open = source.filter((c) => c.status === "open");
    const counts: Record<string, number> = {};
    open.forEach((c) => { counts[c.category] = (counts[c.category] ?? 0) + 1; });
    const total = open.length;
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([category, count]) => ({
        name: category,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }));
  }, [selectedDistrict]);

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Title row */}
      <div>
        <h2 className="text-xl font-bold text-[#1a1a1a]">תמונת מצב עירונית</h2>
        <p className="text-sm text-[#585858] mt-0.5">מערכת שליטה ובקרה בזמן אמת · עיריית רמת גן</p>
      </div>

      {/* AI Correlation panel */}
      {scenario.phase !== "idle" && (() => {
        const phaseColor = PHASE_COLORS[scenario.phase] ?? "#585858";
        return (
          <div
            className="rounded-xl border p-4 space-y-3"
            style={{ borderColor: phaseColor + "55", background: "#f5f9ff" }}
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2.5">
                {isScenarioRunning && (
                  <Loader2 size={13} className="animate-spin shrink-0" style={{ color: phaseColor }} />
                )}
                {isScenarioComplete && (
                  <CheckCircle2 size={13} className="text-[#459524] shrink-0" />
                )}
                <div>
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest"
                    style={{ color: phaseColor }}
                  >
                    {PHASE_LABELS[scenario.phase] ?? scenario.phase}
                  </span>
                  <p className="text-xs text-[#585858] mt-0.5">{scenario.scenarioStatusLabel}</p>
                </div>
              </div>
              {scenario.riskScore !== null && (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-[#585858]">ציון סיכון בינה</span>
                  <span className="text-xl font-bold" style={{ color: phaseColor }}>
                    {scenario.riskScore}
                  </span>
                  <span className="text-[10px] text-[#999999]">/100</span>
                </div>
              )}
            </div>

            {scenario.detectionSources.length > 0 && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {scenario.detectionSources.map((src, i) => (
                    <div key={i} className="bg-white rounded-lg px-3 py-2 border border-[#d0d0d0]">
                      <p className="text-xs text-[#707070] leading-snug">{src.source}</p>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-sm font-bold text-[#1a1a1a]">{src.count}</span>
                        <span className="text-[10px] font-medium" style={{ color: phaseColor }}>
                          {src.change}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-[#707070]">
                  <span className="text-[#1a1a1a] font-medium">
                    מנוע הקורלציה עיבד פניות CRM, חיישני פחים חכמים, מצלמות ו-GPS של צוותי שטח ויצר ציון סיכון עירוני משוקלל.
                  </span>{" "}
                  <span className="text-[#1f5fa6]">
                    לצפייה בנימוק המלא
                  </span>
                </p>
              </>
            )}
          </div>
        );
      })()}

      {/* Health + KPIs */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            label="זמן תגובה ממוצע"
            value={currentKpi.avgResponseMin}
            unit=" דק׳"
            delta={currentKpi.avgResponseMin - 44}
            base={44}
            sparkData={responseSpark}
            sparkColor="#f37d00"
            icon={Clock}
            iconColor="#f37d00"
            invertDelta
            period="30 הימים האחרונים"
          />
          <KpiCard
            label="שביעות רצון תושבים"
            value={currentKpi.satisfactionPct}
            unit="%"
            delta={currentKpi.satisfactionPct - 69}
            base={69}
            sparkData={satisfactionSpark}
            sparkColor="#459524"
            icon={Smile}
            iconColor="#459524"
            period="30 הימים האחרונים"
          />
          <KpiCard
            label="פניות שירות פתוחות"
            value={currentKpi.openTickets}
            delta={currentKpi.openTickets - 158}
            base={158}
            sparkData={complaintsSpark}
            sparkColor="#ffbb00"
            icon={Ticket}
            iconColor="#ffbb00"
            invertDelta
            period="כרגע"
          />
          <KpiCard
            label="עמידה ב-SLA"
            value={currentKpi.slaCompliancePct}
            unit="%"
            delta={currentKpi.slaCompliancePct - 79}
            base={79}
            sparkData={slaSpark}
            sparkColor="#1f5fa6"
            icon={Shield}
            iconColor="#1f5fa6"
            period="30 הימים האחרונים"
          />
        </div>
      </div>

      {/* Requests by source */}
      <section className="bg-white border border-[#d0d0d0] rounded-xl p-4">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-xs font-semibold text-[#585858] uppercase tracking-wider">
              פניות לפי מקור
            </p>
            <p className="text-sm text-[#707070] mt-1">
              סך כל הפניות מציג את התפלגות המקורות. לחיצה פותחת חלוקה פנימית לפי חדשות, טופלו וחרגו מ-SLA
            </p>
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-[#1f5fa6] shrink-0">
            לכל הפניות
            <ArrowLeft size={12} />
          </span>
        </div>

        <button
          onClick={() => setRequestsExpanded((value) => !value)}
          className="w-full rounded-lg border border-[#d0d0d0] bg-[#fafafa] p-4 text-right hover:border-[#1f5fa6] transition-colors"
          aria-expanded={requestsExpanded}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-lg bg-[#1f5fa622] text-[#1f5fa6] flex items-center justify-center">
                <Ticket size={20} />
              </div>
              <div>
                <p className="text-[10px] font-semibold text-[#585858] uppercase tracking-wider">סך כל הפניות</p>
                <p className="text-4xl font-bold text-[#1a1a1a] leading-none mt-1">{totalRequests}</p>
              </div>
            </div>

            <div className="flex-1 min-w-[260px]">
              <div className="flex h-3 rounded-full overflow-hidden bg-[#e8e8e8]">
                {sourceStats.map((stat) => (
                  <div
                    key={stat.source}
                    style={{ width: `${stat.percentage}%`, background: stat.color }}
                    title={`${stat.label}: ${stat.total}`}
                  />
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2 mt-3">
                {sourceStats.map((stat) => (
                  <div key={stat.source} className="flex items-center justify-between gap-2 rounded-md bg-white border border-[#e8e8e8] px-2 py-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: stat.color }} />
                      <span className="text-[10px] text-[#585858] truncate">{stat.label}</span>
                    </div>
                    <span className="text-[10px] font-bold" style={{ color: stat.color }}>
                      {stat.total} · {stat.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="grid grid-cols-3 gap-1.5">
                <span className="rounded bg-white px-2 py-1 text-[10px] font-medium text-[#1f5fa6] border border-[#1f5fa633]">
                  {totals.open} חדשות
                </span>
                <span className="rounded bg-white px-2 py-1 text-[10px] font-medium text-[#459524] border border-[#45952433]">
                  {totals.closed} טופלו
                </span>
                <span className="rounded bg-white px-2 py-1 text-[10px] font-medium text-[#f37d00] border border-[#f37d0033]">
                  {totals.breached} בטיפול
                </span>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#1f5fa6]">
                {requestsExpanded ? "סגור פירוט" : "פתח פירוט"}
                {requestsExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </span>
            </div>
          </div>
        </button>

        {requestsExpanded && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-3">
            {sourceStats.map((stat) => (
              <div key={stat.source} className="rounded-lg border border-[#e8e8e8] bg-[#fafafa] p-3">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-start gap-2">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${stat.color}22`, color: stat.color }}
                    >
                      <Ticket size={15} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1a1a1a]">{stat.label}</p>
                      <p className="text-[10px] text-[#707070] leading-snug">{stat.description}</p>
                    </div>
                  </div>
                  <span
                    className="text-2xl font-bold leading-none"
                    style={{ color: stat.color }}
                  >
                    {stat.total}
                  </span>
                </div>

                <div className="h-1.5 bg-[#e8e8e8] rounded-full overflow-hidden mb-3">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${stat.percentage}%`, background: stat.color }}
                />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: "open" as const,    count: stat.open,    color: "#1f5fa6", icon: Ticket },
                    { key: "closed" as const,  count: stat.closed,  color: "#459524", icon: CheckCircle2 },
                    { key: "breached" as const, count: stat.breached, color: "#f37d00", icon: AlertTriangle },
                  ].map(({ key, count, color, icon: Icon }) => (
                    <div
                      key={key}
                      className="rounded-lg border border-[#d0d0d0] bg-white px-2 py-2"
                    >
                      <div className="flex items-center gap-1.5">
                        <Icon size={11} style={{ color }} />
                        <span className="text-[10px] text-[#707070] truncate">{COMPLAINT_STATUS_LABELS[key]}</span>
                      </div>
                      <p className="text-lg font-bold mt-1" style={{ color }}>{count}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Critical alerts */}
      <CriticalAlertsSection />


      {/* ── Top categories ───────────────────────────────────────────── */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#585858] uppercase tracking-wider">
                קטגוריות של פניות פתוחות · סינון לפי רובע
              </p>
              {selectedDistrict && (
                <button
                  onClick={() => { setSelectedDistrict(undefined); setSelectedCategory(null); }}
                  className="text-[10px] text-[#1f5fa6] hover:underline"
                >
                  נקה סינון
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {DISTRICTS.map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setSelectedDistrict(d === selectedDistrict ? undefined : d);
                    setSelectedCategory(null);
                  }}
                  className="px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors"
                  style={
                    selectedDistrict === d
                      ? { background: "#1f5fa6", color: "#fff", borderColor: "#1f5fa6" }
                      : { background: "#f4f4f4", color: "#585858", borderColor: "#d0d0d0" }
                  }
                >
                  {DISTRICT_LABELS[d]}
                </button>
              ))}
            </div>
            <TopCategoriesWidget
              categories={categories}
              selectedCategory={selectedCategory}
              onCategoryClick={setSelectedCategory}
              title="קטגוריות של פניות פתוחות"
            />
          </div>
        </div>

        <div className="col-span-12 xl:col-span-7 space-y-4">
          <RoutesStatusWidget />
        </div>
      </div>
    </div>
  );
}
