// ─── CityMind AI — resolve team / vehicle by id (client-safe) ────────────────
// Reads the plain data arrays; used by cards/drawer to show team + vehicle info.
import { EMPLOYEES_DATA } from "@/data/employeesData";
import { VEHICLES_DATA } from "@/data/vehiclesData";
import type { MunicipalTeam, Vehicle } from "@/lib/types";

export function findTeam(teamId?: string): MunicipalTeam | undefined {
  if (!teamId) return undefined;
  for (const dept of EMPLOYEES_DATA) {
    const team = dept.teams.find((t) => t.id === teamId);
    if (team) return team;
  }
  return undefined;
}

export function findVehicle(vehicleId?: string): Vehicle | undefined {
  if (!vehicleId) return undefined;
  return VEHICLES_DATA.find((v) => v.id === vehicleId);
}

/** All teams flattened — for the "change team" picker. */
export function allTeams(): MunicipalTeam[] {
  return EMPLOYEES_DATA.flatMap((d) => d.teams);
}
