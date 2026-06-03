"use client";

import { incidents } from "@/lib/data";
import { CATEGORY_LABELS } from "@/lib/data";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { AlertTriangle, Trash2, Car, Shield, Zap, Trees, ArrowLeft, MapPin } from "lucide-react";
import Link from "next/link";
import type { IncidentType } from "@/lib/types";
import { useHazard } from "@/context/HazardContext";
import { districtLabel } from "@/lib/hebrew";

const CATEGORY_ICONS: Record<IncidentType, React.ElementType> = {
  waste:     Trash2,
  traffic:   Car,
  safety:    Shield,
  utilities: Zap,
  parks:     Trees,
};

const CATEGORY_BG: Record<IncidentType, string> = {
  waste:     "#fff1e2",
  traffic:   "#fffbe0",
  safety:    "#ffeff2",
  utilities: "#e8f0fb",
  parks:     "#f1faed",
};

const CATEGORY_COLOR: Record<IncidentType, string> = {
  waste:     "#f37d00",
  traffic:   "#b0a000",
  safety:    "#d96350",
  utilities: "#1f5fa6",
  parks:     "#459524",
};

export function CriticalAlertsSection() {
  const { hazardRevealed } = useHazard();

  const criticalIncidents = incidents.filter((inc) => {
    if (inc.id === "INC-ACC-001" && !hazardRevealed) return false;
    return inc.priority === "critical";
  });

  if (criticalIncidents.length === 0) return null;

  return (
    <section
      className="rounded-xl border-2 border-[#d96350] overflow-hidden"
      style={{ background: "#fff8f7" }}
      aria-label="התראות קריטיות"
    >
      {/* Section header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: "#d96350" }}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle size={15} className="text-white shrink-0" />
          <span className="text-sm font-bold text-white tracking-wide">התראות קריטיות</span>
          <span className="bg-white text-[#d96350] text-[11px] font-bold px-2 py-0.5 rounded-full leading-none">
            {criticalIncidents.length}
          </span>
        </div>
        <Link
          href="/operations"
          className="flex items-center gap-1 text-white/80 hover:text-white text-xs font-medium transition-colors"
        >
          לכל הפניות
          <ArrowLeft size={12} />
        </Link>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 p-3">
        {criticalIncidents.map((inc) => {
          const Icon = CATEGORY_ICONS[inc.type];
          const iconBg = CATEGORY_BG[inc.type];
          const iconColor = CATEGORY_COLOR[inc.type];

          return (
            <Link
              key={inc.id}
              href={`/operations?incident=${inc.id}`}
              className="group relative flex flex-col gap-3 bg-white rounded-lg border border-[#f0bbb4] hover:border-[#d96350] hover:shadow-md transition-all duration-150 p-4 cursor-pointer"
            >
              {/* Pulsing urgency dot */}
              <span className="absolute top-3 left-3 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d96350] opacity-60" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#d96350]" />
              </span>

              {/* Top row: icon + id */}
              <div className="flex items-start gap-3 pr-1 pl-5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: iconBg }}
                >
                  <Icon size={15} style={{ color: iconColor }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold text-[#d96350] uppercase tracking-widest">
                      {inc.id}
                    </span>
                    <span
                      className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                      style={{ background: iconBg, color: iconColor }}
                    >
                      {CATEGORY_LABELS[inc.type]}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-[#1a1a1a] mt-1 leading-snug line-clamp-2">
                    {inc.description}
                  </p>
                </div>
              </div>

              {/* Bottom row: district + status + CTA */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 text-[#707070]">
                  <MapPin size={10} />
                  <span className="text-[11px]">{districtLabel(inc.district)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={inc.status} />
                  <span
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#d96350] group-hover:gap-2 transition-all"
                  >
                    לטיפול
                    <ArrowLeft size={10} />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
