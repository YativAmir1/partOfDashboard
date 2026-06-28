import type { RouteExecution, RouteComplaint } from "./types";

export interface ExecutionWithComplaints extends RouteExecution {
  complaints: RouteComplaint[];
  complaintCount: number;
  metRequirement: boolean;
}

export type TrendDirection = "improving" | "stable" | "worsening";

export interface RouteHistorySummary {
  avgCompletion4w: number;
  totalComplaints4w: number;
  trend: TrendDirection;
  topComplaintStreet: string | null;
  topComplaintStreetCount: number;
  topComplaintStreetTotal: number;
  history: ExecutionWithComplaints[];
}

export function getRouteHistory(
  scheduleId: string,
  requiredPct: number,
  allExecutions: RouteExecution[],
  allComplaints: RouteComplaint[],
  limit = 8
): ExecutionWithComplaints[] {
  const executions = allExecutions
    .filter((e) => e.scheduleId === scheduleId)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, limit);

  return executions.map((exec) => {
    const complaints = allComplaints.filter((c) => c.executionId === exec.id);
    return {
      ...exec,
      complaints,
      complaintCount: complaints.length,
      metRequirement: exec.completionPct >= requiredPct,
    };
  });
}

export function getRouteTrend(history: ExecutionWithComplaints[]): TrendDirection {
  const recent = history.slice(0, 4);
  const prior = history.slice(4, 8);
  if (prior.length < 2) return "stable";
  const avg = (arr: ExecutionWithComplaints[]) =>
    arr.reduce((s, e) => s + e.completionPct, 0) / arr.length;
  const diff = avg(recent) - avg(prior);
  if (diff >= 7) return "improving";
  if (diff <= -7) return "worsening";
  return "stable";
}

export function getTopComplaintStreets(
  history: ExecutionWithComplaints[]
): Array<{ street: string; count: number }> {
  const counts: Record<string, number> = {};
  for (const exec of history) {
    for (const c of exec.complaints) {
      counts[c.street] = (counts[c.street] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([street, count]) => ({ street, count }))
    .sort((a, b) => b.count - a.count);
}

export function getAverageCompletion(
  history: ExecutionWithComplaints[],
  lastN = 4
): number {
  const slice = history.slice(0, lastN);
  if (!slice.length) return 0;
  return Math.round(
    slice.reduce((s, e) => s + e.completionPct, 0) / slice.length
  );
}

export function buildRouteHistorySummary(
  scheduleId: string,
  requiredPct: number,
  allExecutions: RouteExecution[],
  allComplaints: RouteComplaint[]
): RouteHistorySummary | null {
  const history = getRouteHistory(scheduleId, requiredPct, allExecutions, allComplaints, 8);
  if (history.length < 2) return null;

  const avgCompletion4w = getAverageCompletion(history, 4);
  const totalComplaints4w = history
    .slice(0, 4)
    .reduce((s, e) => s + e.complaintCount, 0);
  const trend = getRouteTrend(history);
  const streetStats = getTopComplaintStreets(history);
  const topComplaintStreetTotal = streetStats.reduce((s, st) => s + st.count, 0);
  const top = streetStats[0] ?? null;

  return {
    avgCompletion4w,
    totalComplaints4w,
    trend,
    topComplaintStreet: top?.street ?? null,
    topComplaintStreetCount: top?.count ?? 0,
    topComplaintStreetTotal,
    history,
  };
}

export function hebrewDate(isoDate: string): string {
  const date = new Date(isoDate + "T00:00:00");
  return new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short" }).format(date);
}
