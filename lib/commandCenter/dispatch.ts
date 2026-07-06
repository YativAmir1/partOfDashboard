import { haversineDistance } from "@/lib/geocoding";
import { EMPLOYEES_DATA } from "@/data/employeesData";
import { VEHICLES_DATA } from "@/data/vehiclesData";
import type { CommandCase, DeptKey, DispatchCandidate } from "./types";

// Which municipal departments can treat each case department.
// Yard / rats / dumping cases (inspection) are handled by inspection + waste.
const DEPT_ROUTING: Record<DeptKey, string[]> = {
  waste: ["waste", "inspection"],
  inspection: ["inspection", "waste"],
  parks: ["parks"],
  infrastructure: ["infrastructure"],
  environment: ["inspection"],
  traffic: ["infrastructure", "inspection"],
  recycling: ["waste"],
};

const AVAILABLE_STATUSES = new Set(["active", "standby", "available"]);
const AVG_SPEED_KMH = 24; // city driving average for ETA

/**
 * Rank field teams for a case by real proximity, using each team's vehicle GPS
 * as the Itoran live feed. Closest available team first.
 */
export function rankDispatchCandidates(c: CommandCase): DispatchCandidate[] {
  const allowedDepts = DEPT_ROUTING[c.dept] ?? [c.dept];
  const candidates: DispatchCandidate[] = [];

  for (const dept of EMPLOYEES_DATA) {
    if (!allowedDepts.includes(dept.id)) continue;

    for (const team of dept.teams) {
      const vehicle = team.vehicleId
        ? VEHICLES_DATA.find((v) => v.id === team.vehicleId)
        : undefined;

      // Distance from the team's vehicle (Itoran) to the case location.
      // No live GPS → fall back to a large nominal distance so it ranks last.
      const distanceMeters = vehicle?.gps
        ? haversineDistance([vehicle.gps.lat, vehicle.gps.lng], c.coords)
        : 99_999;

      const available =
        AVAILABLE_STATUSES.has(team.todayStatus) &&
        (!vehicle || vehicle.status !== "out_of_service");

      const etaMinutes = Math.max(2, Math.round((distanceMeters / 1000 / AVG_SPEED_KMH) * 60));

      candidates.push({
        teamId: team.id,
        teamName: team.name,
        deptId: dept.id,
        supervisor: team.supervisor,
        vehicleId: vehicle?.id,
        vehicleLabel: vehicle?.label,
        distanceMeters: Math.round(distanceMeters),
        etaMinutes,
        available,
        statusNote: statusNote(team.todayStatus, team.openMissions, team.note),
      });
    }
  }

  // Available first, then by distance.
  return candidates.sort((a, b) => {
    if (a.available !== b.available) return a.available ? -1 : 1;
    return a.distanceMeters - b.distanceMeters;
  });
}

function statusNote(status: string, openMissions: number, note?: string): string {
  if (note) return note;
  const map: Record<string, string> = {
    active: `בשטח · ${openMissions} משימות פתוחות`,
    standby: "בהמתנה — זמין",
    available: "זמין לשיגור מיידי",
    break: "בהפסקה",
    done: "סיים משמרת",
    unavailable: "לא זמין",
  };
  return map[status] ?? status;
}

export function fmtDistance(m: number): string {
  if (m >= 99_000) return "—";
  if (m < 1000) return `${m} מ׳`;
  return `${(m / 1000).toFixed(1)} ק״מ`;
}
