import type {
  Incident,
  MapMarker,
  DailyTrend,
  AIRecommendation,
  Anomaly,
  Complaint,
  Department,
  Task,
  KpiValues,
  CameraFeed,
  RouteTemplate,
  RouteSchedule,
  RouteExecution,
  RouteComplaint,
} from "./types";

import complaintClustersRaw from "@/data/complaintClusters.json";
import incidentsRaw from "@/data/incidents.json";
import markersRaw from "@/data/markers.json";
import trendsRaw from "@/data/trends.json";
import recommendationsRaw from "@/data/recommendations.json";
import anomaliesRaw from "@/data/anomalies.json";
import complaintsRaw from "@/data/complaints.json";
import departmentsRaw from "@/data/departments.json";
import tasksRaw from "@/data/tasks.json";
import camerasRaw from "@/data/cameras.json";
import routesRaw from "@/data/routes.json";

export const complaintClusters = complaintClustersRaw;
export const incidents = incidentsRaw as Incident[];
export const markers = markersRaw as MapMarker[];
export const trends = trendsRaw as DailyTrend[];
export const recommendations = recommendationsRaw as AIRecommendation[];
export const anomalies = anomaliesRaw as Anomaly[];
export const complaints = complaintsRaw as Complaint[];
export const departments = departmentsRaw as Department[];
export const tasks = tasksRaw as Task[];
export const cameras = camerasRaw as CameraFeed[];

export const routeTemplates = (routesRaw as { templates: RouteTemplate[] }).templates;
export const routeSchedules = (routesRaw as { schedules: RouteSchedule[] }).schedules;
export const routeExecutions = (routesRaw as { executions: RouteExecution[] }).executions;
export const routeComplaints = (routesRaw as { complaints: RouteComplaint[] }).complaints;

export const kpiBefore: KpiValues = {
  healthScore: 74,
  activeIncidents: 23,
  avgResponseMin: 38,
  satisfactionPct: 74,
  openTickets: 136,
  slaCompliancePct: 85,
};

export const kpiAfter: KpiValues = {
  healthScore: 88,
  activeIncidents: 14,
  avgResponseMin: 24,
  satisfactionPct: 83,
  openTickets: 89,
  slaCompliancePct: 93,
};

export const CATEGORY_COLORS: Record<string, string> = {
  waste:     "#f37d00",
  traffic:   "#ffbb00",
  safety:    "#d96350",
  utilities: "#1f5fa6",
  parks:     "#459524",
};

export const CATEGORY_LABELS: Record<string, string> = {
  waste: "שפ״ע וניקיון",
  traffic: "תנועה וניידות",
  safety: "בטיחות וביטחון",
  utilities: "תשתיות",
  parks: "גנים ונוף",
};

export const PRIORITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f97316",
  medium: "#eab308",
  low: "#22c55e",
};

export const STATUS_COLORS: Record<string, string> = {
  open: "#ef4444",
  in_progress: "#f97316",
  resolved: "#22c55e",
};
