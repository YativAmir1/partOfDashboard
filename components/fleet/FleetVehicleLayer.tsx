"use client";

import { type ReactElement } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { Vehicle } from "@/lib/types";
import {
  VEHICLE_TYPE_EMOJI,
  VEHICLE_TYPE_LABEL,
  VEHICLE_STATUS_COLOR,
  VEHICLE_STATUS_LABEL,
  formatGpsTime,
} from "@/lib/fleetUtils";

function makeIcon(emoji: string, color: string, isActive: boolean): L.DivIcon {
  const size = isActive ? 28 : 22;
  const anim = isActive ? "animation:crew-moving-pulse 1.8s ease-in-out infinite;" : "";
  return L.divIcon({
    html: `<span style="
      display:flex;align-items:center;justify-content:center;
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:2px solid rgba(255,255,255,0.8);
      box-shadow:0 2px 6px rgba(0,0,0,0.35);
      font-size:${Math.round(size * 0.5)}px;line-height:1;${anim}
    ">${emoji}</span>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size >> 1, size >> 1],
    popupAnchor: [0, -(size >> 1) - 3],
  });
}

interface Props {
  vehicles: Vehicle[];
  show?: boolean;
}

export function FleetVehicleLayer({ vehicles, show = true }: Props) {
  if (!show) return null;

  const markers: ReactElement[] = [];

  for (const v of vehicles) {
    if (!v.gps) continue;
    const isActive = v.status === "active";
    const emoji = VEHICLE_TYPE_EMOJI[v.type];
    const color = isActive ? VEHICLE_STATUS_COLOR.active : VEHICLE_STATUS_COLOR[v.status];
    const icon = makeIcon(emoji, color, isActive);

    markers.push(
      <Marker key={v.id} position={[v.gps.lat, v.gps.lng]} icon={icon}>
        <Popup>
          <div className="min-w-[220px]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{emoji}</span>
              <div>
                <p className="font-semibold text-sm text-[#1a1a1a]">{v.label}</p>
                <p className="text-xs text-[#707070]">{v.id} · {v.plateNumber}</p>
              </div>
            </div>
            <div className="space-y-1 text-xs text-[#707070]">
              <div className="flex justify-between">
                <span>סוג</span>
                <span>{VEHICLE_TYPE_LABEL[v.type]}</span>
              </div>
              <div className="flex justify-between">
                <span>סטטוס</span>
                <span style={{ color: VEHICLE_STATUS_COLOR[v.status] }} className="font-semibold">
                  {VEHICLE_STATUS_LABEL[v.status]}
                </span>
              </div>
              {v.gps.speedKmh !== undefined && v.gps.speedKmh > 0 && (
                <div className="flex justify-between">
                  <span>מהירות</span>
                  <span>{v.gps.speedKmh} קמ"ש</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>GPS</span>
                <span style={{ color: v.gps.isLive ? "#16a34a" : "#999" }}>
                  {v.gps.isLive ? "מעקב חי 📡" : "לא מחובר"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>עודכן</span>
                <span>{formatGpsTime(v.gps.lastUpdated)}</span>
              </div>
            </div>
            {v.notes && (
              <p className="mt-2 text-[11px] text-[#a16207] bg-[#fef9c3] rounded px-1.5 py-0.5">
                {v.notes}
              </p>
            )}
          </div>
        </Popup>
      </Marker>,
    );
  }

  return <>{markers}</>;
}
