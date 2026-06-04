"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { LayerFilter } from "@/components/map/CategoryFilter";
import { markers, complaints, cameras } from "@/lib/data";
import { riskPredictions } from "@/lib/riskPredictions";
import { useHazard } from "@/context/HazardContext";
import { useMapState } from "@/context/MapStateContext";
import { useDistrictLoad } from "@/hooks/useDistrictLoad";
import type { District, IncidentType } from "@/lib/types";
import { MapPin } from "lucide-react";
import { MapViewToggle, type MapViewMode } from "@/components/map/MapViewToggle";
import { districtLabel } from "@/lib/hebrew";
import { DistrictPanel } from "@/components/map/DistrictPanel";

const CityMap = dynamic(() => import("@/components/map/CityMap"), { ssr: false });

export default function MapPage() {
  const {
    activeCategories, setActiveCategories,
    activeLayers,     setActiveLayers,
    selectedDistrict, setSelectedDistrict,
    viewMode,         setViewMode,
    statusFilters,    setStatusFilters,
    showRoutes,          setShowRoutes,
    routeFilter,         setRouteFilter,
    routeStatusFilters,  setRouteStatusFilters,
    focusedRouteScheduleId, setFocusedRouteScheduleId,
  } = useMapState();

  const toggleViewMode = () => setViewMode(viewMode === "map" ? "heatmap" : "map");

  const toggleStatus = (status: string) =>
    setStatusFilters((() => {
      const next = new Set(statusFilters);
      if (next.has(status)) next.delete(status); else next.add(status);
      return next;
    })());

  const { hazardRevealed } = useHazard();
  const { districts, highestLoadDistrict } = useDistrictLoad();

  const cityAvgOpenRate = useMemo(() => {
    const active = complaints.filter((c) => c.status !== "resolved");
    return active.length > 0
      ? (active.filter((c) => c.status === "open").length / active.length) * 100
      : 0;
  }, []);

  const hasOpenComplaints = useMemo(
    () => markers.some((m) => activeCategories.has(m.category) && (m.status === "open" || m.status === "in_progress")),
    [activeCategories],
  );

  const toggleCategory = (cat: IncidentType) => {
    const next = new Set(activeCategories);
    if (next.has(cat)) next.delete(cat); else next.add(cat);
    setActiveCategories(next);
  };

  const toggleLayer = (layer: string) => {
    const next = new Set(activeLayers);
    if (next.has(layer)) next.delete(layer); else next.add(layer);
    setActiveLayers(next);
  };

  const toggleRouteStatus = (s: string) => {
    const next = new Set(routeStatusFilters);
    if (next.has(s)) next.delete(s); else next.add(s);
    setRouteStatusFilters(next);
  };

  const visibleCount =
    markers.filter((m) => activeCategories.has(m.category)).length +
    (activeLayers.has("risk_zone") ? riskPredictions.length : 0) +
    (hazardRevealed && activeLayers.has("hazard_alert") ? 1 : 0);

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-7rem)]">

      <div className="flex items-center justify-between shrink-0 flex-wrap gap-2">
        <div>
          <h2 className="text-xl font-bold text-[#1a1a1a]">מפת העיר</h2>
        </div>
        <div className="flex items-center gap-2">
          {highestLoadDistrict && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#1f5fa655] bg-[#eff4fc]">
              <MapPin size={13} className="text-[#1f5fa6]" />
              <span className="text-xs text-[#707070]">עומס גבוה</span>
              <span className="text-sm font-bold text-[#1f5fa6]">{districtLabel(highestLoadDistrict)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex gap-4 min-h-0">

        <div className="relative flex-1 rounded-xl overflow-hidden border border-[#d0d0d0]">
          <CityMap
            activeCategories={activeCategories}
            activeLayers={activeLayers}
            statusFilters={statusFilters}
            selectedDistrict={selectedDistrict}
            onSelectDistrict={setSelectedDistrict}
            viewMode={viewMode}
            showRoutes={showRoutes}
            routeFilter={routeFilter}
            routeStatusFilters={routeStatusFilters}
            focusedRouteScheduleId={focusedRouteScheduleId}
          />
          <div className="absolute top-[80px] left-[10px] z-[1000]">
            <MapViewToggle mode={viewMode} onToggle={toggleViewMode} />
          </div>
          {showRoutes && (
            <div className="absolute bottom-3 left-3 z-[1000] rounded-xl border-2 border-[#1f5fa6] bg-white/95 backdrop-blur-sm px-3 py-2.5 shadow-lg" dir="rtl">
              <p className="text-[10px] font-bold text-[#585858] uppercase tracking-wider mb-2">מקרא מסלולים</p>
              <div className="space-y-1.5">
                {([
                  { color: "#1E88E5", label: "בביצוע",            dashed: false },
                  { color: "#d96350", label: "באיחור",            dashed: false },
                  { color: "#FB8C00", label: "דורש התערבות",      dashed: false },
                  { color: "#1f5fa6", label: "מתוכנן",            dashed: true  },
                  { color: "#459524", label: "הושלם",             dashed: false },
                ] as { color: string; label: string; dashed: boolean }[]).map(({ color, label, dashed }) => (
                  <div key={label} className="flex items-center gap-2">
                    <svg width="28" height="8" viewBox="0 0 28 8" className="shrink-0">
                      <line
                        x1="2" y1="4" x2="26" y2="4"
                        stroke={color}
                        strokeWidth="3"
                        strokeDasharray={dashed ? "5 4" : undefined}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="text-[11px] text-[#1a1a1a] leading-none">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="absolute top-3 right-3 z-[1000]">
            <LayerFilter
              activeCategories={activeCategories}
              activeLayers={activeLayers}
              statusFilters={statusFilters}
              onToggleCategory={toggleCategory}
              onToggleLayer={toggleLayer}
              onToggleStatus={toggleStatus}
              hasOpenComplaints={hasOpenComplaints}
              viewMode={viewMode}
              showRoutes={showRoutes}
              onToggleRoutes={() => setShowRoutes(!showRoutes)}
              routeFilter={routeFilter}
              onSetRouteFilter={(f) => setRouteFilter(f)}
              routeStatusFilters={routeStatusFilters}
              onToggleRouteStatus={toggleRouteStatus}
              hasFocusedRoute={focusedRouteScheduleId !== null}
            />
          </div>
        </div>

        {selectedDistrict ? (
          <DistrictPanel
            district={selectedDistrict}
            markers={markers}
            complaints={complaints}
            cameras={cameras}
            riskPrediction={riskPredictions.find((r) => r.district === selectedDistrict)}
            cityAvgOpenRate={cityAvgOpenRate}
            onClose={() => setSelectedDistrict(null)}
          />
        ) : (
          <div className="w-52 shrink-0 overflow-y-auto">
            <div className="rounded-xl border border-[#d0d0d0] bg-white p-4 h-full">
              <p className="text-[10px] font-bold text-[#585858] uppercase tracking-wider mb-3">
                עומס פניות לפי רובע
              </p>
              <div className="space-y-2">
                {districts.map((d, i) => (
                  <button
                    key={d.district}
                    onClick={() => setSelectedDistrict(d.district as District)}
                    className="w-full text-right rounded-lg px-2 py-1.5 border border-transparent hover:border-[#1f5fa633] hover:bg-[#f8fbff] transition-colors"
                  >
                    <div className="flex items-center justify-between mb-0.5 gap-2">
                      <span
                        className="text-[10px] truncate flex-1"
                        style={{
                          color:      i === 0 ? "#1f5fa6" : "#707070",
                          fontWeight: i === 0 ? 600 : 400,
                        }}
                      >
                        {districtLabel(d.district)}
                      </span>
                      <span className="text-[10px] font-bold text-[#1a1a1a] shrink-0">
                        {d.totalRequests}
                      </span>
                      <span className="text-[10px] font-semibold text-[#1f5fa6] shrink-0">
                        {d.percentage}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-[#e8e8e8] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width:      `${d.percentage}%`,
                          background: i === 0 ? "#1f5fa6" : "#8ab0d8",
                        }}
                      />
                    </div>
                  </button>
                ))}
              </div>
              {activeLayers.has("risk_zone") && (
                <div className="mt-4 pt-3 border-t border-[#e8e8e8]">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-[10px] font-bold text-[#7c3aed] uppercase tracking-wider">
                      חיזויי סיכונים
                    </p>
                    <span className="text-[10px] font-bold text-[#7c3aed]">
                      {riskPredictions.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {riskPredictions.map((prediction) => (
                      <button
                        key={prediction.id}
                        onClick={() => setSelectedDistrict(prediction.district)}
                        className="w-full text-right rounded-lg border border-[#d8c8ff] bg-[#f8f5ff] px-2 py-2 transition-colors hover:bg-[#f1ebff]"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-semibold text-[#1a1a1a] leading-snug">
                            {prediction.title}
                          </span>
                          <span className="text-[10px] font-bold text-[#7c3aed] shrink-0">
                            {prediction.expectedRequests}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-[#707070] truncate">
                            {districtLabel(prediction.district)}
                          </span>
                          <span className="text-[10px] text-[#459524] font-semibold shrink-0">
                            {prediction.confidence}%
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-[10px] text-[#d0d0d0] mt-4">לחץ על רובע לפרטים · גבולות מקורבים</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
