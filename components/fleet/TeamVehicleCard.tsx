import type { MunicipalTeam, MunicipalDept, Vehicle, RouteSchedule } from "@/lib/types";
import {
  VEHICLE_TYPE_EMOJI,
  VEHICLE_TYPE_LABEL,
  VEHICLE_STATUS_COLOR,
  VEHICLE_STATUS_LABEL,
} from "@/lib/fleetUtils";
import { TeamStatusBadge } from "./TeamStatusBadge";
import { MapPin, Users, Route, Wifi, WifiOff } from "lucide-react";

interface Props {
  team: MunicipalTeam;
  dept: MunicipalDept;
  vehicle: Vehicle | undefined;
  assignedRoutes: RouteSchedule[];
  onClick: () => void;
}

export function TeamVehicleCard({ team, dept, vehicle, assignedRoutes, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className="w-full text-right bg-white border border-[#e5e5e5] rounded-xl p-4 hover:shadow-md hover:border-[#c0d8f8] transition-all group text-start"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: dept.colorLight, color: dept.color }}
            >
              {dept.shortName}
            </span>
            <TeamStatusBadge status={team.todayStatus} size="sm" />
          </div>
          <p className="text-sm font-semibold text-[#1a1a1a] truncate group-hover:text-[#1f5fa6]">
            {team.name}
          </p>
          <p className="text-[11px] text-[#707070] truncate">{team.subType}</p>
        </div>
      </div>

      {/* Vehicle row */}
      {vehicle ? (
        <div
          className="flex items-center gap-2 rounded-lg px-2.5 py-2 mb-3"
          style={{ backgroundColor: dept.colorLight }}
        >
          <span className="text-base leading-none">{VEHICLE_TYPE_EMOJI[vehicle.type]}</span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-[#1a1a1a] truncate">{vehicle.label}</p>
            <p className="text-[10px] text-[#707070]">{vehicle.id} · {VEHICLE_TYPE_LABEL[vehicle.type]}</p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {vehicle.gps?.isLive ? (
              <Wifi size={12} className="text-[#16a34a]" />
            ) : (
              <WifiOff size={12} className="text-[#999]" />
            )}
            <span
              className="text-[10px] font-medium"
              style={{ color: VEHICLE_STATUS_COLOR[vehicle.status] }}
            >
              {VEHICLE_STATUS_LABEL[vehicle.status]}
            </span>
          </div>
        </div>
      ) : (
        <div className="text-[11px] text-[#999] mb-3 px-1">ללא רכב משויך</div>
      )}

      {/* Footer stats */}
      <div className="flex items-center gap-4 text-[11px] text-[#707070]">
        <span className="flex items-center gap-1">
          <Users size={11} />
          {team.workerCount} עובדים
        </span>
        {team.todayDistricts.length > 0 && (
          <span className="flex items-center gap-1 truncate">
            <MapPin size={11} />
            {team.todayDistricts[0]}
            {team.todayDistricts.length > 1 && ` +${team.todayDistricts.length - 1}`}
          </span>
        )}
        {assignedRoutes.length > 0 && (
          <span
            className="flex items-center gap-1 mr-auto font-medium"
            style={{ color: "#1f5fa6" }}
          >
            <Route size={11} />
            {assignedRoutes.length} מסלולים
          </span>
        )}
        {team.openMissions > 0 && (
          <span className="mr-auto font-semibold text-[#d96350]">
            {team.openMissions} משימות
          </span>
        )}
      </div>

      {team.note && (
        <p className="mt-2 text-[10px] text-[#a16207] bg-[#fef9c3] rounded px-2 py-1 truncate">
          {team.note}
        </p>
      )}
    </button>
  );
}
