"use client";

import type { LucideIcon } from "lucide-react";
import { Trash2, Car, Shield, Zap, Leaf, Package, Camera, Users, Truck, Target, Route, AlertCircle, Clock } from "lucide-react";
import type { RouteMapFilter } from "@/lib/types";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/data";
import { riskPredictions } from "@/lib/riskPredictions";
import type { IncidentType } from "@/lib/types";
import type { MapViewMode } from "@/components/map/MapViewToggle";

const INCIDENT_ICONS: Record<string, LucideIcon> = {
  waste:     Trash2,
  traffic:   Car,
  safety:    Shield,
  utilities: Zap,
  parks:     Leaf,
};

const OVERLAY_ITEMS: { key: string; label: string; icon: LucideIcon; color: string }[] = [
  { key: "bins",      label: "פחים חכמים",        icon: Package, color: "#f37d00" },
  { key: "cameras",   label: "מצלמות עירוניות",    icon: Camera,  color: "#009dc3" },
  { key: "crews",     label: "צוותי שטח",          icon: Users,   color: "#1f5fa6" },
  { key: "vehicles",  label: "רכבי שפ״ע",          icon: Truck,   color: "#009dc3" },
  { key: "risk_zone", label: `חיזויי סיכונים (${riskPredictions.length})`, icon: Target, color: "#7c3aed" },
];

function FilterRow({
  isActive,
  color,
  icon: Icon,
  label,
  onChange,
}: {
  isActive: boolean;
  color: string;
  icon: LucideIcon;
  label: string;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <div
        className="w-4 h-4 rounded border-2 flex items-center justify-center transition-colors shrink-0"
        style={{
          borderColor:     color,
          backgroundColor: isActive ? color + "33" : "transparent",
        }}
      >
        {isActive && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />}
      </div>
      <input type="checkbox" className="sr-only" checked={isActive} onChange={onChange} />
      <Icon size={11} style={{ color: isActive ? color : "#999999" }} />
      <span className="text-xs text-[#707070] group-hover:text-[#1a1a1a] transition-colors">{label}</span>
    </label>
  );
}

const STATUS_ITEMS: { key: string; label: string; icon: LucideIcon; color: string }[] = [
  { key: "open",        label: "פתוחות", icon: AlertCircle, color: "#d96350" },
  { key: "in_progress", label: "בטיפול", icon: Clock,       color: "#1f5fa6" },
];

const ROUTE_FILTER_OPTIONS: { key: RouteMapFilter; label: string }[] = [
  { key: "today",     label: "מסלולי היום"        },
  { key: "week",      label: "מסלולי השבוע"        },
  { key: "delayed",   label: "באיחור"              },
  { key: "attention", label: "דורשים התערבות"      },
];

interface Props {
  activeCategories: Set<IncidentType>;
  activeLayers: Set<string>;
  statusFilters: Set<string>;
  onToggleCategory: (cat: IncidentType) => void;
  onToggleLayer: (layer: string) => void;
  onToggleStatus: (status: string) => void;
  hasOpenComplaints?: boolean;
  viewMode?: MapViewMode;
  showRoutes?: boolean;
  onToggleRoutes?: () => void;
  routeFilter?: RouteMapFilter;
  onSetRouteFilter?: (f: RouteMapFilter) => void;
  hasFocusedRoute?: boolean;
}

export function LayerFilter({
  activeCategories,
  activeLayers,
  statusFilters,
  onToggleCategory,
  onToggleLayer,
  onToggleStatus,
  hasOpenComplaints = true,
  viewMode,
  showRoutes = false,
  onToggleRoutes,
  routeFilter = "today",
  onSetRouteFilter,
  hasFocusedRoute = false,
}: Props) {
  return (
    <div className="bg-white/95 border border-[#d0d0d0] rounded-xl p-3 backdrop-blur-sm w-44">

      <p className="text-[10px] font-semibold text-[#585858] uppercase tracking-wider mb-2">פניות</p>
      <div className="space-y-1.5">
        {(Object.entries(CATEGORY_LABELS) as [IncidentType, string][]).map(([cat, label]) => (
          <FilterRow
            key={cat}
            isActive={activeCategories.has(cat)}
            color={CATEGORY_COLORS[cat]}
            icon={INCIDENT_ICONS[cat]}
            label={label}
            onChange={() => onToggleCategory(cat)}
          />
        ))}
      </div>

      {hasOpenComplaints && (
        <div className="border-t border-[#e8e8e8] mt-3 pt-2.5">
          <p className="text-[10px] font-semibold text-[#585858] uppercase tracking-wider mb-2">סטטוס</p>
          <div className="space-y-1.5">
            {STATUS_ITEMS.map(({ key, label, icon, color }) => (
              <FilterRow
                key={key}
                isActive={statusFilters.has(key)}
                color={color}
                icon={icon}
                label={label}
                onChange={() => onToggleStatus(key)}
              />
            ))}
          </div>
        </div>
      )}

      <div
        className="transition-opacity"
        style={{
          opacity:      viewMode === "heatmap" ? 0.4 : 1,
          pointerEvents: viewMode === "heatmap" ? "none" : "auto",
        }}
      >
        <p className="text-[10px] font-semibold text-[#585858] uppercase tracking-wider mt-3 mb-2 pt-2.5 border-t border-[#e8e8e8]">
          שכבות מידע
        </p>
        <div className="space-y-1.5">
          {OVERLAY_ITEMS.map(({ key, label, icon, color }) => (
            <FilterRow
              key={key}
              isActive={activeLayers.has(key)}
              color={color}
              icon={icon}
              label={label}
              onChange={() => onToggleLayer(key)}
            />
          ))}
        </div>
      </div>

      {/* Routes section */}
      <div className="border-t border-[#e8e8e8] mt-3 pt-2.5">
        <FilterRow
          isActive={showRoutes}
          color="#1f5fa6"
          icon={Route}
          label="הצג מסלולים"
          onChange={() => onToggleRoutes?.()}
        />
        {showRoutes && (
          <div className="mt-1.5 space-y-0.5">
            {[
              ...ROUTE_FILTER_OPTIONS,
              ...(hasFocusedRoute
                ? [{ key: "focused" as RouteMapFilter, label: "מסלול נבחר בלבד" }]
                : []),
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => onSetRouteFilter?.(key)}
                className="w-full text-right text-[10px] px-2 py-0.5 rounded-md transition-colors"
                style={{
                  background:  routeFilter === key ? "#1f5fa620" : "transparent",
                  color:       routeFilter === key ? "#1f5fa6"   : "#707070",
                  fontWeight:  routeFilter === key ? 600         : 400,
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
