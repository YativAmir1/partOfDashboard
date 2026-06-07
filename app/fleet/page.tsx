"use client";

import dynamic from "next/dynamic";
import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { TeamStatus, MunicipalTeam, MunicipalDept, Vehicle, RouteSchedule } from "@/lib/types";
import { EMPLOYEES_DATA } from "@/data/employeesData";
import { VEHICLES_DATA } from "@/data/vehiclesData";
import { routeSchedules } from "@/lib/data";
import { getVehicleForTeam, getRoutesForTeam } from "@/lib/fleetUtils";

import { FleetKpiStrip } from "@/components/fleet/FleetKpiStrip";
import { DeptFilterBar } from "@/components/fleet/DeptFilterBar";
import { FilterPanel } from "@/components/fleet/FilterPanel";
import { TeamVehicleCard } from "@/components/fleet/TeamVehicleCard";
import { TeamDetailDrawer } from "@/components/fleet/TeamDetailDrawer";
import { LayoutGrid, Map as MapIcon } from "lucide-react";

const FleetMapPanelInner = dynamic(
  () => import("@/components/fleet/FleetMapPanel").then((m) => m.FleetMapPanelInner),
  { ssr: false, loading: () => <div className="flex-1 bg-[#f4f4f4] rounded-xl animate-pulse" /> },
);

const ALL_STATUSES = new Set<TeamStatus>([
  "active", "break", "standby", "done", "available", "unavailable",
]);

function FleetContent() {
  const searchParams = useSearchParams();
  const initialTeamId = searchParams.get("teamId");

  const [activeDeptId, setActiveDeptId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<Set<TeamStatus>>(new Set(ALL_STATUSES));
  const [vehicleFilter, setVehicleFilter] = useState<"all" | "with_vehicle" | "without_vehicle">("all");
  const [viewMode, setViewMode] = useState<"cards" | "map">("cards");
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(initialTeamId);
  const [customSchedules, setCustomSchedules] = useState<RouteSchedule[]>([]);

  useEffect(() => {
    if (initialTeamId) setSelectedTeamId(initialTeamId);
  }, [initialTeamId]);

  useEffect(() => {
    fetch("/api/routes")
      .then((r) => r.json())
      .then((data: { schedules: RouteSchedule[] }) => {
        setCustomSchedules(data.schedules ?? []);
      })
      .catch(() => {/* non-critical */});
  }, []);

  function toggleStatus(s: TeamStatus) {
    setStatusFilter((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  // Flat list of {team, dept}
  const allTeamEntries = useMemo(
    () =>
      EMPLOYEES_DATA.flatMap((dept) =>
        dept.teams.map((team) => ({ team, dept })),
      ),
    [],
  );

  // Filtered
  const filteredEntries = useMemo(() => {
    return allTeamEntries.filter(({ team, dept }) => {
      if (activeDeptId && dept.id !== activeDeptId) return false;
      if (!statusFilter.has(team.todayStatus)) return false;
      if (vehicleFilter === "with_vehicle" && !team.vehicleId) return false;
      if (vehicleFilter === "without_vehicle" && team.vehicleId) return false;
      return true;
    });
  }, [allTeamEntries, activeDeptId, statusFilter, vehicleFilter]);

  // Routes per team (static + custom)
  const allSchedules = useMemo(
    () => [...routeSchedules, ...customSchedules],
    [customSchedules],
  );

  const routesByTeamId = useMemo(() => {
    const map = new Map<string, RouteSchedule[]>();
    for (const { team } of allTeamEntries) {
      map.set(team.id, getRoutesForTeam(team.id, allSchedules, VEHICLES_DATA));
    }
    return map;
  }, [allTeamEntries, allSchedules]);

  // Selected team details
  const selectedEntry = useMemo(() => {
    if (!selectedTeamId) return null;
    return allTeamEntries.find(({ team }) => team.id === selectedTeamId) ?? null;
  }, [selectedTeamId, allTeamEntries]);

  return (
    <div className="flex-1 flex flex-col gap-4 p-6 bg-[#f4f4f4] min-h-screen overflow-auto">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#1a1a1a]">ניהול כלים וצוותות</h1>
          <p className="text-xs text-[#707070] mt-0.5">מעקב בזמן אמת · כלל מחלקות העייריה</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-[#e5e5e5] rounded-lg p-1">
          <button
            onClick={() => setViewMode("cards")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              viewMode === "cards"
                ? "bg-[#1f5fa6] text-white"
                : "text-[#585858] hover:text-[#1f5fa6]"
            }`}
          >
            <LayoutGrid size={13} />
            כרטיסים
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              viewMode === "map"
                ? "bg-[#1f5fa6] text-white"
                : "text-[#585858] hover:text-[#1f5fa6]"
            }`}
          >
            <MapIcon size={13} />
            מפה
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <FleetKpiStrip vehicles={VEHICLES_DATA} depts={EMPLOYEES_DATA} />

      {/* Dept filter */}
      <DeptFilterBar
        depts={EMPLOYEES_DATA}
        activeDeptId={activeDeptId}
        onChange={setActiveDeptId}
      />

      {/* Content area */}
      <div className="flex gap-4 items-start flex-1">
        {viewMode === "cards" && (
          <FilterPanel
            statusFilter={statusFilter}
            onToggleStatus={toggleStatus}
            vehicleFilter={vehicleFilter}
            onChangeVehicleFilter={setVehicleFilter}
          />
        )}

        {viewMode === "cards" ? (
          <div className="flex-1 min-w-0">
            {filteredEntries.length === 0 ? (
              <div className="flex items-center justify-center h-48 bg-white border border-[#e5e5e5] rounded-xl">
                <p className="text-sm text-[#999]">לא נמצאו צוותות לפי הסינון הנוכחי</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {filteredEntries.map(({ team, dept }) => (
                  <TeamVehicleCard
                    key={team.id}
                    team={team}
                    dept={dept}
                    vehicle={getVehicleForTeam(team.id, VEHICLES_DATA)}
                    assignedRoutes={routesByTeamId.get(team.id) ?? []}
                    onClick={() => setSelectedTeamId(team.id)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <FleetMapPanelInner
              vehicles={VEHICLES_DATA}
              depts={EMPLOYEES_DATA}
              activeDeptId={activeDeptId}
            />
          </div>
        )}
      </div>

      {/* Detail drawer */}
      {selectedEntry && (
        <TeamDetailDrawer
          team={selectedEntry.team}
          dept={selectedEntry.dept}
          vehicle={getVehicleForTeam(selectedEntry.team.id, VEHICLES_DATA)}
          assignedRoutes={routesByTeamId.get(selectedEntry.team.id) ?? []}
          onClose={() => setSelectedTeamId(null)}
        />
      )}
    </div>
  );
}

export default function FleetPage() {
  return (
    <Suspense fallback={<div className="flex-1 bg-[#f4f4f4] animate-pulse min-h-screen" />}>
      <FleetContent />
    </Suspense>
  );
}
