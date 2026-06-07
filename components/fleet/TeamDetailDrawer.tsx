"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import type { MunicipalTeam, MunicipalDept, Vehicle, RouteSchedule, DayKey } from "@/lib/types";
import {
  VEHICLE_TYPE_EMOJI,
  VEHICLE_TYPE_LABEL,
  VEHICLE_STATUS_COLOR,
  VEHICLE_STATUS_LABEL,
  formatGpsTime,
} from "@/lib/fleetUtils";
import { ROUTE_STATUS_LABELS, ROUTE_STATUS_COLORS } from "@/lib/routeUtils";
import { TeamStatusBadge } from "./TeamStatusBadge";
import {
  X,
  Users,
  MapPin,
  Wifi,
  WifiOff,
  Route,
  Navigation,
  Clock,
  ExternalLink,
} from "lucide-react";

const MiniMapViewInner = dynamic(
  () => import("./MiniMapView").then((m) => m.MiniMapViewInner),
  { ssr: false, loading: () => <div className="h-40 bg-[#f4f4f4] rounded-lg animate-pulse" /> },
);

const DAY_LABELS: Record<DayKey, string> = {
  sun: "א׳",
  mon: "ב׳",
  tue: "ג׳",
  wed: "ד׳",
  thu: "ה׳",
  fri: "ו׳",
};

interface Props {
  team: MunicipalTeam;
  dept: MunicipalDept;
  vehicle: Vehicle | undefined;
  assignedRoutes: RouteSchedule[];
  onClose: () => void;
}

export function TeamDetailDrawer({ team, dept, vehicle, assignedRoutes, onClose }: Props) {
  const todayKey = (["sun", "mon", "tue", "wed", "thu", "fri"] as DayKey[])[new Date().getDay() === 0 ? 0 : new Date().getDay() - 1];
  const todaySchedule = team.schedule.find((s) => s.day === todayKey);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed inset-y-0 left-0 z-50 w-[380px] max-w-full bg-white shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div
          className="flex items-start gap-3 px-5 py-4 border-b border-[#e5e5e5]"
          style={{ backgroundColor: dept.colorLight }}
        >
          <button
            onClick={onClose}
            className="mt-0.5 p-1.5 rounded-lg hover:bg-black/10 transition-colors shrink-0"
          >
            <X size={16} />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: dept.color, color: "#fff" }}
              >
                {dept.shortName}
              </span>
              <TeamStatusBadge status={team.todayStatus} size="sm" />
            </div>
            <h2 className="text-base font-bold text-[#1a1a1a]">{team.name}</h2>
            <p className="text-xs text-[#585858]">{team.subType}</p>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Personnel block */}
          <div className="bg-[#f9f9f9] rounded-xl p-3 space-y-2">
            <p className="text-[11px] font-semibold text-[#585858] uppercase tracking-wide">צוות</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-[#999]">מנהל</p>
                <p className="font-medium text-[#1a1a1a]">{team.supervisor}</p>
              </div>
              <div>
                <p className="text-[#999]">עובדים</p>
                <p className="font-medium text-[#1a1a1a] flex items-center gap-1">
                  <Users size={11} className="text-[#585858]" />
                  {team.workerCount}
                </p>
              </div>
            </div>
            {team.note && (
              <p className="text-[11px] text-[#a16207] bg-[#fef9c3] rounded px-2 py-1">
                {team.note}
              </p>
            )}
          </div>

          {/* Vehicle + GPS block */}
          {vehicle ? (
            <div className="bg-[#f9f9f9] rounded-xl p-3 space-y-3">
              <p className="text-[11px] font-semibold text-[#585858] uppercase tracking-wide">רכב ואיתורן</p>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{VEHICLE_TYPE_EMOJI[vehicle.type]}</span>
                <div>
                  <p className="text-sm font-semibold text-[#1a1a1a]">{vehicle.label}</p>
                  <p className="text-xs text-[#707070]">{vehicle.id} · {vehicle.plateNumber}</p>
                  <p className="text-xs text-[#707070]">{VEHICLE_TYPE_LABEL[vehicle.type]}</p>
                </div>
                <div className="mr-auto text-left">
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: VEHICLE_STATUS_COLOR[vehicle.status] + "22",
                      color: VEHICLE_STATUS_COLOR[vehicle.status],
                    }}
                  >
                    {VEHICLE_STATUS_LABEL[vehicle.status]}
                  </span>
                </div>
              </div>

              {vehicle.gps && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-[#585858]">
                      {vehicle.gps.isLive ? (
                        <>
                          <Wifi size={12} className="text-[#16a34a]" />
                          <span className="text-[#16a34a] font-medium">מעקב חי 📡</span>
                        </>
                      ) : (
                        <>
                          <WifiOff size={12} className="text-[#999]" />
                          <span className="text-[#999]">לא מחובר</span>
                        </>
                      )}
                    </span>
                    <span className="text-[#999]">
                      עודכן {formatGpsTime(vehicle.gps.lastUpdated)}
                    </span>
                  </div>
                  {vehicle.gps.speedKmh !== undefined && vehicle.gps.speedKmh > 0 && (
                    <p className="text-[11px] text-[#707070] flex items-center gap-1">
                      <Navigation size={11} />
                      {vehicle.gps.speedKmh} קמ"ש · כיוון {vehicle.gps.heading}°
                    </p>
                  )}
                  <MiniMapViewInner
                    lat={vehicle.gps.lat}
                    lng={vehicle.gps.lng}
                    label={vehicle.label}
                    emoji={VEHICLE_TYPE_EMOJI[vehicle.type]}
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="bg-[#f9f9f9] rounded-xl p-3">
              <p className="text-[11px] font-semibold text-[#585858] uppercase tracking-wide mb-2">
                רכב ואיתורן
              </p>
              <p className="text-xs text-[#999]">לא שויך רכב לצוות זה</p>
            </div>
          )}

          {/* Schedule block */}
          <div className="bg-[#f9f9f9] rounded-xl p-3 space-y-2">
            <p className="text-[11px] font-semibold text-[#585858] uppercase tracking-wide">לוח זמנים</p>
            {todaySchedule ? (
              <div className="flex items-center gap-3 text-xs">
                <Clock size={13} className="text-[#585858] shrink-0" />
                <span className="font-medium text-[#1a1a1a]">{todaySchedule.shift}</span>
                {todaySchedule.districts.length > 0 && (
                  <span className="flex items-center gap-1 text-[#585858]">
                    <MapPin size={11} />
                    {todaySchedule.districts.join(", ")}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-[#999]">ללא לוח זמנים קבוע</p>
            )}
            {team.todayDistricts.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {team.todayDistricts.map((d) => (
                  <span
                    key={d}
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: dept.borderColor, color: dept.color }}
                  >
                    {d}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Assigned routes block */}
          <div className="bg-[#f9f9f9] rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold text-[#585858] uppercase tracking-wide">
                מסלולים משובצים
              </p>
              {assignedRoutes.length > 0 && (
                <span className="text-[10px] bg-[#eff4fc] text-[#1f5fa6] font-medium px-2 py-0.5 rounded-full">
                  {assignedRoutes.length}
                </span>
              )}
            </div>

            {assignedRoutes.length === 0 ? (
              <p className="text-xs text-[#999]">אין מסלולים משובצים</p>
            ) : (
              <div className="space-y-2">
                {assignedRoutes.map((route) => (
                  <div
                    key={route.id}
                    className="bg-white border border-[#e5e5e5] rounded-lg p-2.5 flex items-center gap-2"
                  >
                    <Route size={13} className="text-[#585858] shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[#1a1a1a] truncate">
                        {route.assignedTeam}
                      </p>
                      <p className="text-[10px] text-[#999]">
                        {route.scheduledStartTime}–{route.scheduledEndTime} ·{" "}
                        {route.dayOfWeek.map((d) => DAY_LABELS[d]).join(" ")}
                      </p>
                    </div>
                    <Link
                      href={`/routes?scheduleId=${route.id}`}
                      className="shrink-0 text-[#1f5fa6] hover:text-[#1a4f8c] p-1 rounded"
                      onClick={(e) => e.stopPropagation()}
                      title="צפה במסלול"
                    >
                      <ExternalLink size={13} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-[#e5e5e5] px-4 py-3 flex gap-2">
          <Link
            href={`/map?teamId=${team.id}`}
            className="flex-1 flex items-center justify-center gap-2 bg-[#1f5fa6] text-white text-xs font-medium px-3 py-2 rounded-lg hover:bg-[#1a4f8c] transition-colors"
          >
            <MapPin size={13} />
            הצג במפה
          </Link>
          <button
            disabled
            className="flex-1 flex items-center justify-center gap-2 bg-[#f4f4f4] text-[#999] text-xs font-medium px-3 py-2 rounded-lg cursor-not-allowed"
            title="בקרוב"
          >
            שגר משימה
          </button>
        </div>
      </div>
    </>
  );
}
