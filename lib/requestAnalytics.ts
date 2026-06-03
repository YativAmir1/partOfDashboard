import { incidents } from "@/lib/data";
import type {
  Incident,
  IncidentStatus,
  Priority,
  RequestFunnel,
  RequestSlaStatus,
  RequestSourceGroup,
  SourceType,
} from "@/lib/types";

export const REQUEST_SOURCE_LABELS: Record<RequestSourceGroup, string> = {
  resident: "פניות תושבים",
  iot: "IoT וחיישנים",
  prediction: "חיזויים",
};

export const REQUEST_SOURCE_DESCRIPTIONS: Record<RequestSourceGroup, string> = {
  resident: "מוקד 109, פניות תושב ודיווחי שטח",
  iot: "מצלמות, פחים חכמים וחיישנים עירוניים",
  prediction: "חיזויי עומס, תחזוקה מונעת וניתוח בינה",
};

export const REQUEST_SOURCE_COLORS: Record<RequestSourceGroup, string> = {
  resident: "#1f5fa6",
  iot: "#009dc3",
  prediction: "#7c3aed",
};

export const REQUEST_SLA_LABELS: Record<RequestSlaStatus, string> = {
  open: "חדשות",
  closed: "טופלו",
  breached: "חרגו מ-SLA",
};

export const REQUEST_SOURCE_ORDER: RequestSourceGroup[] = ["resident", "iot", "prediction"];

const SOURCE_GROUP_BY_TYPE: Record<SourceType, RequestSourceGroup> = {
  citizen_complaint: "resident",
  field_inspector: "resident",
  camera: "iot",
  smart_sensor: "iot",
  ai_analysis: "prediction",
  preventive_maintenance: "prediction",
};

const SLA_HOURS_BY_PRIORITY: Record<Priority, number> = {
  critical: 2,
  high: 3,
  medium: 20,
  low: 22,
};

const DEMO_REFERENCE_TIME = new Date("2026-04-26T12:00:00Z").getTime();

export interface RequestAnalyticsIncident extends Incident {
  requestSourceGroup: RequestSourceGroup;
  requestSlaStatus: RequestSlaStatus;
}

export interface RequestSourceStats {
  source: RequestSourceGroup;
  label: string;
  description: string;
  color: string;
  total: number;
  open: number;
  closed: number;
  breached: number;
  percentage: number;
}

export interface RequestAnalytics {
  items: RequestAnalyticsIncident[];
  sourceStats: RequestSourceStats[];
  totalRequests: number;
  totals: Record<RequestSlaStatus, number>;
}

export interface IncidentStatusCounts {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
}

export function getRequestSourceGroup(sourceType: SourceType): RequestSourceGroup {
  return SOURCE_GROUP_BY_TYPE[sourceType];
}

export function getRequestSlaStatus(incident: Pick<Incident, "createdAt" | "priority" | "status">): RequestSlaStatus {
  if (incident.status === "resolved") return "closed";

  const createdAt = new Date(incident.createdAt).getTime();
  const ageHours = Math.max(0, (DEMO_REFERENCE_TIME - createdAt) / 3_600_000);
  const threshold = SLA_HOURS_BY_PRIORITY[incident.priority];

  return ageHours > threshold ? "breached" : "open";
}

export function incidentMatchesRequestStatus(
  incident: RequestAnalyticsIncident,
  status?: IncidentStatus | "closed" | "all" | null,
) {
  if (!status || status === "all") return true;
  if (status === "closed") return incident.requestSlaStatus === "closed";
  return incident.status === status;
}

export function getRequestAnalytics(sourceIncidents: Incident[] = incidents): RequestAnalytics {
  const items = sourceIncidents.map((incident) => ({
    ...incident,
    requestSourceGroup: getRequestSourceGroup(incident.sourceType),
    requestSlaStatus: getRequestSlaStatus(incident),
  }));

  const totalRequests = items.length;
  const totals: Record<RequestSlaStatus, number> = { open: 0, closed: 0, breached: 0 };
  items.forEach((item) => {
    totals[item.requestSlaStatus] += 1;
  });

  const sourceStats = REQUEST_SOURCE_ORDER.map((source) => {
    const sourceItems = items.filter((item) => item.requestSourceGroup === source);
    const open = sourceItems.filter((item) => item.requestSlaStatus === "open").length;
    const closed = sourceItems.filter((item) => item.requestSlaStatus === "closed").length;
    const breached = sourceItems.filter((item) => item.requestSlaStatus === "breached").length;

    return {
      source,
      label: REQUEST_SOURCE_LABELS[source],
      description: REQUEST_SOURCE_DESCRIPTIONS[source],
      color: REQUEST_SOURCE_COLORS[source],
      total: sourceItems.length,
      open,
      closed,
      breached,
      percentage: totalRequests > 0 ? Math.round((sourceItems.length / totalRequests) * 100) : 0,
    };
  });

  return { items, sourceStats, totalRequests, totals };
}

export function getIncidentStatusCounts(sourceIncidents: Incident[] = incidents): IncidentStatusCounts {
  return sourceIncidents.reduce<IncidentStatusCounts>(
    (counts, incident) => {
      counts.total += 1;
      if (incident.status === "open") counts.open += 1;
      if (incident.status === "in_progress") counts.inProgress += 1;
      if (incident.status === "resolved") counts.resolved += 1;
      return counts;
    },
    { total: 0, open: 0, inProgress: 0, resolved: 0 },
  );
}

export function buildIncidentRequestFunnel(sourceIncidents: Incident[] = incidents): RequestFunnel[] {
  const counts = getIncidentStatusCounts(sourceIncidents);
  const treatmentStarted = counts.inProgress + counts.resolved;
  const assignedToField = Math.round(treatmentStarted * 0.74);
  const misrouted = Math.round(counts.total * 0.04);

  return [
    { status: "new", count: counts.total },
    { status: "inProgress", count: treatmentStarted },
    { status: "assignedToField", count: assignedToField },
    { status: "resolved", count: counts.resolved },
    { status: "misrouted", count: misrouted },
  ];
}

export function buildOperationsHref(params: {
  source?: RequestSourceGroup;
  status?: "open" | "closed";
  sla?: "breached";
}) {
  const search = new URLSearchParams();
  if (params.source) search.set("source", params.source);
  if (params.status) search.set("status", params.status);
  if (params.sla) search.set("sla", params.sla);
  const query = search.toString();
  return query ? `/operations?${query}` : "/operations";
}
