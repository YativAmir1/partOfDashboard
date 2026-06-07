"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { District, HeatmapSource, IncidentType, RouteMapFilter } from "@/lib/types";
import type { MapViewMode } from "@/components/map/MapViewToggle";

interface MapState {
  activeCategories: Set<IncidentType>;
  activeLayers: Set<string>;
  selectedDistrict: District | null;
  viewMode: MapViewMode;
  statusFilters: Set<string>;
  showRoutes: boolean;
  routeFilter: RouteMapFilter;
  routeStatusFilters: Set<string>;
  focusedRouteScheduleId: string | null;
  heatmapSource: HeatmapSource;
  setActiveCategories: (v: Set<IncidentType>) => void;
  setActiveLayers: (v: Set<string>) => void;
  setSelectedDistrict: (v: District | null) => void;
  setViewMode: (v: MapViewMode) => void;
  setStatusFilters: (v: Set<string>) => void;
  setShowRoutes: (v: boolean | ((prev: boolean) => boolean)) => void;
  setRouteFilter: (v: RouteMapFilter) => void;
  setRouteStatusFilters: (v: Set<string>) => void;
  setFocusedRouteScheduleId: (v: string | null) => void;
  setHeatmapSource: (v: HeatmapSource) => void;
}

const MapStateContext = createContext<MapState | null>(null);

export function MapStateProvider({ children }: { children: ReactNode }) {
  const [activeCategories, setActiveCategories] = useState<Set<IncidentType>>(new Set(["waste"]));
  const [activeLayers,     setActiveLayers]     = useState<Set<string>>(new Set());
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [viewMode,         setViewMode]         = useState<MapViewMode>("map");
  const [statusFilters,    setStatusFilters]    = useState<Set<string>>(new Set(["open", "in_progress"]));
  const [showRoutes,          setShowRoutes]          = useState(false);
  const [routeFilter,         setRouteFilter]         = useState<RouteMapFilter>("week");
  const [routeStatusFilters,  setRouteStatusFilters]  = useState<Set<string>>(new Set());
  const [focusedRouteScheduleId, setFocusedRouteScheduleId] = useState<string | null>(null);
  const [heatmapSource, setHeatmapSource] = useState<HeatmapSource>("incidents");

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("routeScheduleId");
    if (id) {
      setShowRoutes(true);
      setRouteFilter("focused");
      setFocusedRouteScheduleId(id);
    }
  }, []);

  return (
    <MapStateContext.Provider value={{
      activeCategories, setActiveCategories,
      activeLayers,     setActiveLayers,
      selectedDistrict, setSelectedDistrict,
      viewMode,         setViewMode,
      statusFilters,    setStatusFilters,
      showRoutes,          setShowRoutes,
      routeFilter,         setRouteFilter,
      routeStatusFilters,  setRouteStatusFilters,
      focusedRouteScheduleId, setFocusedRouteScheduleId,
      heatmapSource,           setHeatmapSource,
    }}>
      {children}
    </MapStateContext.Provider>
  );
}

export function useMapState() {
  const ctx = useContext(MapStateContext);
  if (!ctx) throw new Error("useMapState must be used inside MapStateProvider");
  return ctx;
}
