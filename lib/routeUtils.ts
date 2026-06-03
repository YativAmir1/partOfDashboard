import type {
  RouteSchedule,
  RouteExecution,
  CalculatedRouteStatus,
} from "./types";

const COMPLAINT_THRESHOLD = 3;

export function calculateRouteStatus(
  schedule: RouteSchedule,
  execution: RouteExecution,
  complaintCount: number,
  nowOverride?: Date
): CalculatedRouteStatus {
  const now = nowOverride ?? new Date();

  const [startH, startM] = schedule.scheduledStartTime.split(":").map(Number);
  const [endH, endM] = schedule.scheduledEndTime.split(":").map(Number);

  const windowStart = new Date(now);
  windowStart.setHours(startH, startM, 0, 0);

  const windowEnd = new Date(now);
  windowEnd.setHours(endH, endM, 0, 0);

  if (execution.completionPct === 0 && now < windowStart) {
    return "scheduled";
  }

  const threshold = schedule.complaintThreshold ?? COMPLAINT_THRESHOLD;
  if (execution.completionPct >= schedule.requiredCompletionPct) {
    return complaintCount > threshold ? "requires_attention" : "completed";
  }

  if (now >= windowStart && now <= windowEnd) {
    return "in_progress";
  }

  return "delayed";
}

export const ROUTE_STATUS_LABELS: Record<CalculatedRouteStatus, string> = {
  scheduled:           "מתוכנן",
  in_progress:         "בביצוע",
  completed:           "הושלם",
  delayed:             "באיחור",
  requires_attention:  "דורש התערבות",
};

export const ROUTE_STATUS_COLORS: Record<CalculatedRouteStatus, string> = {
  scheduled:           "#1f5fa6",
  in_progress:         "#f37d00",
  completed:           "#459524",
  delayed:             "#d96350",
  requires_attention:  "#4b5563",
};
