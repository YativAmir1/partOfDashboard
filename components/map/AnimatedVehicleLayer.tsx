"use client";

import { useState, useEffect, type ReactElement } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { VEHICLES_DATA } from "@/data/vehiclesData";
import { VEHICLE_TYPE_EMOJI, VEHICLE_STATUS_LABEL, VEHICLE_STATUS_COLOR } from "@/lib/fleetUtils";

// ─── Waypoints for animated vehicles ─────────────────────────────────────────

const VEHICLE_WAYPOINTS: Record<string, [number, number][]> = {
  "RG-301": [
    [32.0732, 34.8191],
    [32.0742, 34.8181],
    [32.0752, 34.8171],
    [32.0762, 34.8161],
    [32.0752, 34.8171],
    [32.0742, 34.8181],
  ],
  "RG-302": [
    [32.0841, 34.8123],
    [32.0851, 34.8133],
    [32.0861, 34.8143],
    [32.0851, 34.8133],
    [32.0841, 34.8123],
  ],
  "RG-501": [
    [32.0756, 34.8175],
    [32.0766, 34.8185],
    [32.0776, 34.8195],
    [32.0786, 34.8185],
    [32.0776, 34.8175],
    [32.0766, 34.8165],
  ],
  "RG-502": [
    [32.0694, 34.8101],
    [32.0704, 34.8111],
    [32.0714, 34.8121],
    [32.0704, 34.8111],
    [32.0694, 34.8101],
  ],
};

// ─── Icon factory ─────────────────────────────────────────────────────────────

function makeVehicleIcon(
  size: number,
  color: string,
  opacity: number,
  moving: boolean,
  emoji = "🚛",
): L.DivIcon {
  const border = moving ? "2px solid rgba(255,255,255,0.8)" : "1.5px solid rgba(255,255,255,0.4)";
  const anim   = moving ? "animation:crew-moving-pulse 1.8s ease-in-out infinite;" : "";
  const fs     = Math.round(size * 0.52);
  return L.divIcon({
    html: `<span style="
      display:flex;align-items:center;justify-content:center;
      width:${size}px;height:${size}px;border-radius:50%;
      background:${color};border:${border};
      box-shadow:0 2px 6px rgba(0,0,0,0.45);
      font-size:${fs}px;line-height:1;opacity:${opacity};${anim}
    ">${emoji}</span>`,
    className:   "",
    iconSize:    [size, size],
    iconAnchor:  [size >> 1, size >> 1],
    popupAnchor: [0, -(size >> 1) - 3],
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  show: boolean;
}

export function AnimatedVehicleLayer({ show }: Props) {
  const [wpIndices, setWpIndices] = useState<Record<string, number>>(() =>
    Object.fromEntries(Object.keys(VEHICLE_WAYPOINTS).map((id) => [id, 0]))
  );

  useEffect(() => {
    if (!show) return;
    const id = setInterval(() => {
      setWpIndices((prev) => {
        const next: Record<string, number> = {};
        for (const vId of Object.keys(VEHICLE_WAYPOINTS)) {
          next[vId] = ((prev[vId] ?? 0) + 1) % VEHICLE_WAYPOINTS[vId].length;
        }
        return next;
      });
    }, 2200);
    return () => clearInterval(id);
  }, [show]);

  if (!show) return null;

  const vehicleMarkers: ReactElement[] = [];

  for (const v of VEHICLES_DATA) {
    if (!v.gps) continue;

    let pos: [number, number];
    if (v.id in VEHICLE_WAYPOINTS) {
      pos = VEHICLE_WAYPOINTS[v.id][wpIndices[v.id] ?? 0];
    } else {
      pos = [v.gps.lat, v.gps.lng];
    }

    const isMoving = v.status === "active" && v.id in VEHICLE_WAYPOINTS;
    const color = isMoving ? "#009dc3" : VEHICLE_STATUS_COLOR[v.status];
    const opacity = v.status === "out_of_service" ? 0.4 : isMoving ? 0.95 : 0.75;
    const size = isMoving ? 26 : 22;
    const emoji = VEHICLE_TYPE_EMOJI[v.type];
    const icon = makeVehicleIcon(size, color, opacity, isMoving, emoji);

    vehicleMarkers.push(
      <Marker key={v.id} position={pos} icon={icon}>
        <Popup>
          <div className="min-w-[210px]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">{emoji}</span>
              <div>
                <span className="font-semibold text-sm text-[#1a1a1a] block">{v.label}</span>
                <span className="text-[11px] text-[#707070]">{v.id}</span>
              </div>
            </div>
            <div className="space-y-1 text-xs text-[#707070]">
              <div className="flex justify-between">
                <span>סטטוס</span>
                <span style={{ color }} className="font-semibold">
                  {VEHICLE_STATUS_LABEL[v.status]}
                </span>
              </div>
              <div className="flex justify-between">
                <span>GPS</span>
                <span style={{ color: v.gps.isLive ? "#16a34a" : "#999" }}>
                  {v.gps.isLive ? "מעקב חי 📡" : "לא מחובר"}
                </span>
              </div>
            </div>
          </div>
        </Popup>
      </Marker>,
    );
  }

  return <>{vehicleMarkers}</>;
}
