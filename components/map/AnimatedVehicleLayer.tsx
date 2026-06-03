"use client";

import { useState, useEffect, type ReactElement } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

// ─── Constants ────────────────────────────────────────────────────────────────

const VEHICLE_WAYPOINTS: Record<string, [number, number][]> = {
  "VEH-W3": [
    [32.0915, 34.8208],
    [32.0925, 34.8218],
    [32.0935, 34.8228],
    [32.0945, 34.8238],
    [32.0950, 34.8248],
    [32.0943, 34.8252],
    [32.0935, 34.8245],
    [32.0925, 34.8235],
  ],
  "VEH-W7": [
    [32.0960, 34.8255],
    [32.0968, 34.8262],
    [32.0975, 34.8258],
    [32.0972, 34.8248],
    [32.0964, 34.8242],
    [32.0956, 34.8248],
  ],
  "VEH-T2": [
    [32.0787, 34.8095],
    [32.0779, 34.8103],
    [32.0772, 34.8111],
    [32.0765, 34.8118],
    [32.0772, 34.8111],
    [32.0779, 34.8103],
  ],
};

interface VehicleData {
  id: string;
  label: string;
  status: "active" | "standby";
  staticPos?: [number, number];
}

const VEHICLES: VehicleData[] = [
  { id: "VEH-W3", label: "רכב ניקיון W-3 — פעיל במרום נווה",          status: "active"  },
  { id: "VEH-W7", label: "רכב ניקיון W-7 — פעיל במרום נווה",          status: "active"  },
  { id: "VEH-T1", label: "משאית T-1 — מחסן מרכז העיר",                status: "standby", staticPos: [32.0815, 34.8108] },
  { id: "VEH-T2", label: "משאית T-2 — מסלול תל השומר",                status: "active"  },
  { id: "VEH-V5", label: "ניידת תשתיות V-5 — אזור התעשייה",           status: "standby", staticPos: [32.0705, 34.8083] },
];

const STATUS_LABELS: Record<string, string> = {
  active:  "פעיל",
  standby: "בהמתנה",
};

// ─── Icon factory ─────────────────────────────────────────────────────────────

function makeVehicleIcon(
  size: number,
  color: string,
  opacity: number,
  moving: boolean,
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
    ">🚛</span>`,
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

  const vehicleMarkers = VEHICLES.flatMap((v): ReactElement | null => {
    let pos: [number, number] | undefined;
    if (v.id in VEHICLE_WAYPOINTS) {
      pos = VEHICLE_WAYPOINTS[v.id][wpIndices[v.id] ?? 0];
    } else {
      pos = v.staticPos;
    }
    if (!pos) return null;

    const isMoving = v.status === "active" && v.id in VEHICLE_WAYPOINTS;
    const color    = isMoving ? "#009dc3" : "#999999";
    const opacity  = isMoving ? 0.95 : 0.75;
    const size     = isMoving ? 26 : 22;
    const icon     = makeVehicleIcon(size, color, opacity, isMoving);

    return (
      <Marker key={v.id} position={pos} icon={icon}>
        <Popup>
          <div className="min-w-[210px]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm">🚛</span>
              <span className="font-semibold text-sm text-[#1a1a1a]">{v.label}</span>
            </div>
            <div className="space-y-1 text-xs text-[#707070]">
              <div className="flex justify-between">
                <span>סטטוס</span>
                <span style={{ color }} className="font-semibold">{STATUS_LABELS[v.status]}</span>
              </div>
              <div className="flex justify-between">
                <span>GPS</span>
                <span className="text-[#009dc3]">{isMoving ? "מעקב חי 📡" : "מחובר"}</span>
              </div>
              {isMoving && (
                <div className="flex justify-between">
                  <span>שיוך</span>
                  <span className="text-white">שוגר על ידי בינה</span>
                </div>
              )}
            </div>
          </div>
        </Popup>
      </Marker>
    );
  }).filter(Boolean) as ReactElement[];

  return <>{vehicleMarkers}</>;
}
