import type {
  RouteSchedule,
  RouteExecution,
  CalculatedRouteStatus,
} from "./types";

const COMPLAINT_THRESHOLD = 3;

/**
 * Selects the *current* execution for a schedule — the most recent one by date.
 *
 * A schedule accumulates many historical executions plus the current-day one;
 * picking the wrong one yields a different calculated status. This is the single
 * source of truth so the city map and the route-management screen stay in sync.
 * (`date` is "YYYY-MM-DD", so lexical comparison is chronological.)
 */
export function getCurrentExecution(
  scheduleId: string,
  executions: readonly RouteExecution[]
): RouteExecution | undefined {
  let current: RouteExecution | undefined;
  for (const e of executions) {
    if (e.scheduleId !== scheduleId) continue;
    if (!current || e.date > current.date) current = e;
  }
  return current;
}

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
  in_progress:         "#1E88E5",
  completed:           "#459524",
  delayed:             "#d96350",
  requires_attention:  "#FB8C00",
};
