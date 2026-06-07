import type {
  Vehicle,
  VehicleType,
  VehicleStatus,
  RouteSchedule,
  MunicipalTeam,
  TeamStatus,
} from "@/lib/types";

export const VEHICLE_TYPE_EMOJI: Record<VehicleType, string> = {
  garbage_truck: "🚛",
  street_sweeper: "🧹",
  pruning_truck: "🌳",
  gardening_truck: "🌱",
  irrigation_vehicle: "💧",
  pickup_truck: "🔧",
  heavy_equipment: "🏗️",
  patrol_vehicle: "🚔",
  van: "🚐",
};

export const VEHICLE_TYPE_LABEL: Record<VehicleType, string> = {
  garbage_truck: "משאית אשפה",
  street_sweeper: "מכבדת רחובות",
  pruning_truck: "רכב גיזום עצים",
  gardening_truck: "רכב גינון",
  irrigation_vehicle: "רכב השקיה",
  pickup_truck: "טנדר תשתיות",
  heavy_equipment: "ציוד כבד",
  patrol_vehicle: "ניידת ביטחון",
  van: "ואן רב-תכליתי",
};

export const VEHICLE_STATUS_LABEL: Record<VehicleStatus, string> = {
  active: "פעיל בשטח",
  standby: "בהמתנה",
  maintenance: "בתחזוקה",
  out_of_service: "מושבת",
};

export const VEHICLE_STATUS_COLOR: Record<VehicleStatus, string> = {
  active: "#16a34a",
  standby: "#d97706",
  maintenance: "#1f5fa6",
  out_of_service: "#d96350",
};

export const TEAM_STATUS_LABEL: Record<TeamStatus, string> = {
  active: "פעיל",
  break: "הפסקה",
  done: "סיים",
  standby: "המתנה",
  unavailable: "לא זמין",
  available: "זמין",
};

export const TEAM_STATUS_COLOR: Record<TeamStatus, { bg: string; text: string }> = {
  active: { bg: "#dcfce7", text: "#15803d" },
  break: { bg: "#fef9c3", text: "#a16207" },
  done: { bg: "#e0e7ff", text: "#4338ca" },
  standby: { bg: "#fef3c7", text: "#b45309" },
  unavailable: { bg: "#fee2e2", text: "#b91c1c" },
  available: { bg: "#dbeafe", text: "#1d4ed8" },
};

export function getVehicleForTeam(
  teamId: string,
  vehicles: Vehicle[],
): Vehicle | undefined {
  return vehicles.find((v) => v.assignedTeamId === teamId);
}

export function getRoutesForTeam(
  teamId: string,
  schedules: RouteSchedule[],
  vehicles: Vehicle[],
): RouteSchedule[] {
  const vehicle = getVehicleForTeam(teamId, vehicles);
  return schedules.filter((s) => {
    if (s.teamRef === teamId) return true;
    if (vehicle && s.vehicleRef === vehicle.id) return true;
    return false;
  });
}

export function formatGpsTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return isoString;
  }
}
