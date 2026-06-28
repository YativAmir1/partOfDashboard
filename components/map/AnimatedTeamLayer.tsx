"use client";

import { useState, useEffect, type ReactElement } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { EMPLOYEES_DATA } from "@/data/employeesData";
import type { MunicipalTeam } from "@/lib/types";

// ─── Constants ────────────────────────────────────────────────────────────────

const DISTRICT_CENTERS: Record<string, [number, number]> = {
  "מרום נווה":     [32.0965, 34.8255],
  "מתחם הבורסה":  [32.0875, 34.8165],
  "מרכז העיר":    [32.0825, 34.8110],
  "רמת חן":       [32.0835, 34.8190],
  "תל השומר":     [32.0775, 34.8100],
  "הפארק הלאומי": [32.0752, 34.8125],
  "שיכון ותיקים": [32.0718, 34.8065],
  "אזור התעשייה": [32.0693, 34.8078],
  "רמת עמידר":    [32.0669, 34.8338],
  "קריית בורוכוב": [32.0789, 34.8048],
  "נווה אפרים":   [32.0568, 34.8182],
  "העיר הוותיקה": [32.0818, 34.8122],
  "צפון העיר":    [32.1014, 34.8129],
};

const TEAM_WAYPOINTS: Record<string, [number, number][]> = {
  "waste-a": [
    [32.0772, 34.8098],
    [32.0772, 34.8120],
    [32.0772, 34.8143],
    [32.0782, 34.8143],
    [32.0792, 34.8143],
    [32.0792, 34.8120],
    [32.0792, 34.8098],
    [32.0782, 34.8098],
  ],
  "waste-b": [
    [32.0864, 34.8150],
    [32.0851, 34.8152],
    [32.0838, 34.8155],
    [32.0838, 34.8170],
    [32.0838, 34.8185],
    [32.0851, 34.8190],
    [32.0864, 34.8186],
    [32.0864, 34.8165],
  ],
  "waste-c": [
    [32.0818, 34.8098],
    [32.0818, 34.8112],
    [32.0818, 34.8126],
    [32.0828, 34.8126],
    [32.0838, 34.8126],
    [32.0838, 34.8112],
    [32.0838, 34.8098],
    [32.0828, 34.8098],
  ],
  "waste-gzem": [
    [32.0712, 34.8062],
    [32.0712, 34.8075],
    [32.0712, 34.8085],
    [32.0724, 34.8085],
    [32.0736, 34.8085],
    [32.0736, 34.8075],
    [32.0736, 34.8062],
    [32.0724, 34.8062],
  ],
  "infra-roads": [
    [32.0810, 34.8185],
    [32.0820, 34.8188],
    [32.0830, 34.8191],
    [32.0840, 34.8194],
    [32.0830, 34.8191],
    [32.0820, 34.8188],
  ],
  "infra-sidewalk": [
    [32.0797, 34.8091],
    [32.0806, 34.8093],
    [32.0814, 34.8095],
    [32.0806, 34.8093],
  ],
};

const STATIC_TEAM_POSITIONS: Record<string, [number, number]> = {
  "waste-street":     [32.0820, 34.8132],
  "insp-parking":     [32.0874, 34.8148],
  "insp-building":    [32.0840, 34.8194],
  "insp-general":     [32.0904, 34.8215],
  "parks-garden":     [32.0750, 34.8122],
  "parks-pruning":    [32.0720, 34.8117],
  "parks-irrigation": [32.0814, 34.8095],
  "ext-a":            [32.0834, 34.8128],
  "ext-b":            [32.0716, 34.8085],
};

const TEAM_STATUS_OPACITY: Record<string, number> = {
  active: 1.0, available: 0.85, standby: 0.7, break: 0.6, done: 0.45, unavailable: 0,
};

const TEAM_STATUS_LABELS: Record<string, string> = {
  active: "פעיל בשטח", available: "זמין לשיגור", standby: "בהמתנה",
  break: "הפסקה", done: "סיים משמרת", unavailable: "לא זמין",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeTeamIcon(
  emoji: string,
  color: string,
  size: number,
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
    ">${emoji}</span>`,
    className:   "",
    iconSize:    [size, size],
    iconAnchor:  [size >> 1, size >> 1],
    popupAnchor: [0, -(size >> 1) - 3],
  });
}

function getTeamPosition(
  team: MunicipalTeam,
  wpIndices: Record<string, number>,
): [number, number] | null {
  if (team.todayStatus === "unavailable") return null;
  if (team.id in TEAM_WAYPOINTS) return TEAM_WAYPOINTS[team.id][wpIndices[team.id] ?? 0];
  if (team.id in STATIC_TEAM_POSITIONS) return STATIC_TEAM_POSITIONS[team.id];
  const district = team.todayDistricts[0];
  return district ? (DISTRICT_CENTERS[district] ?? null) : null;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  show: boolean;
}

export function AnimatedTeamLayer({ show }: Props) {
  const [wpIndices, setWpIndices] = useState<Record<string, number>>(() =>
    Object.fromEntries(Object.keys(TEAM_WAYPOINTS).map((id) => [id, 0]))
  );

  useEffect(() => {
    if (!show) return;
    const animId = setInterval(() => {
      setWpIndices((prev) => {
        const next: Record<string, number> = {};
        for (const teamId of Object.keys(TEAM_WAYPOINTS)) {
          next[teamId] = ((prev[teamId] ?? 0) + 1) % TEAM_WAYPOINTS[teamId].length;
        }
        return next;
      });
    }, 2000);
    return () => clearInterval(animId);
  }, [show]);

  if (!show) return null;

  const teamMarkers = EMPLOYEES_DATA.flatMap((dept) =>
    dept.teams.map((team) => {
      const pos = getTeamPosition(team, wpIndices);
      if (!pos) return null;
      const opacity  = TEAM_STATUS_OPACITY[team.todayStatus] ?? 0.8;
      const isMoving = team.id in TEAM_WAYPOINTS && team.todayStatus === "active";
      const emoji    = team.vehicleId ? "🚛" : "👷";
      const icon     = makeTeamIcon(emoji, dept.color, isMoving ? 26 : 22, opacity, isMoving);
      return (
        <Marker key={team.id} position={pos} icon={icon}>
          <Popup>
            <div className="min-w-[230px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">{emoji}</span>
                <span className="font-semibold text-sm text-[#1a1a1a]">{team.name}</span>
              </div>
              <div
                className="px-2 py-1 rounded mb-2"
                style={{ background: dept.colorLight, border: `1px solid ${dept.borderColor}` }}
              >
                <span className="text-[10px] font-semibold" style={{ color: dept.color }}>
                  {dept.name} · {team.subType}
                </span>
              </div>
              <div className="space-y-1 text-xs text-[#707070]">
                <div className="flex justify-between"><span>מפקד</span><span className="text-[#1a1a1a]">{team.supervisor}</span></div>
                <div className="flex justify-between"><span>עובדים</span><span className="text-[#1a1a1a]">{team.workerCount}</span></div>
                <div className="flex justify-between"><span>אזור</span><span className="text-[#1a1a1a]">{team.todayDistricts.join(", ") || "—"}</span></div>
                {team.vehicleId && (
                  <div className="flex justify-between"><span>רכב</span><span className="text-[#1a1a1a]">{team.vehicleId}</span></div>
                )}
                <div className="flex justify-between">
                  <span>מצב</span>
                  <span className="font-semibold" style={{ color: dept.color }}>
                    {TEAM_STATUS_LABELS[team.todayStatus] ?? team.todayStatus}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>משימות פתוחות</span>
                  <span
                    style={{ color: team.openMissions > 0 ? "#d96350" : "#459524" }}
                    className="font-bold"
                  >
                    {team.openMissions}
                  </span>
                </div>
                {isMoving && (
                  <div className="flex justify-between"><span>GPS</span><span className="text-[#009dc3]">מעקב חי 📡</span></div>
                )}
              </div>
              {team.note && (
                <div className="mt-2 pt-2 border-t border-[#d0d0d0]">
                  <p className="text-[10px] text-[#585858] leading-snug">{team.note}</p>
                </div>
              )}
            </div>
          </Popup>
        </Marker>
      );
    })
  ).filter(Boolean) as ReactElement[];

  return (
    <>
      {teamMarkers}
    </>
  );
}
