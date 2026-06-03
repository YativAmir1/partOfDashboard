export type IncidentType = "waste" | "traffic" | "safety" | "utilities" | "parks";
export type Priority = "critical" | "high" | "medium" | "low";
export type IncidentStatus = "open" | "in_progress" | "resolved";
export type District =
  | "Marom Nave"
  | "Tel Hashomer"
  | "Shikun Vatikim"
  | "Industrial Zone"
  | "National Park"
  | "City Center"
  | "Bursa District"
  | "Ramat Chen"
  | "Ramat Amidar"
  | "Kiryat Borochov"
  | "Neve Efraim"
  | "Old City"
  | "North District";

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  category: IncidentType;
  title: string;
  status: IncidentStatus;
  district: District;
  lastUpdated: string;
  aiNote: string;
}

export interface DailyTrend {
  day: number;
  date: string;
  complaints: number;
  slaCompliance: number;
  satisfaction: number;
  responseTime: number;
}

export interface KpiValues {
  healthScore: number;
  activeIncidents: number;
  avgResponseMin: number;
  satisfactionPct: number;
  openTickets: number;
  slaCompliancePct: number;
}

export interface AIRecommendation {
  id: string;
  priority: "critical" | "high" | "medium";
  title: string;
  description: string;
  confidence: number;
  estimatedImpact: string;
  category: IncidentType;
  district: District;
}

export interface Anomaly {
  id: string;
  timestamp: string;
  type: string;
  district: District;
  description: string;
  severity: "high" | "medium" | "low";
  resolved: boolean;
}

export interface Complaint {
  id: string;
  category: string;
  district: District;
  date: string;
  status: "open" | "resolved" | "in_progress";
  sentiment: "positive" | "neutral" | "negative";
  description: string;
}

export interface Department {
  name: string;
  avgResponseMin: number;
  incidentCount: number;
}

export type SourceType =
  | "citizen_complaint"
  | "camera"
  | "ai_analysis"
  | "field_inspector"
  | "smart_sensor"
  | "preventive_maintenance";

export type RequestSourceGroup = "resident" | "iot" | "prediction";
export type RequestSlaStatus = "open" | "closed" | "breached";

export interface Task {
  id: string;
  title: string;
  assignee: string;
  priority: Priority;
  status: "pending" | "in_progress" | "done";
  district: District;
  aiGenerated: boolean;
  createdAt: string;
  sourceType: SourceType;
  dataSource: string;
  sourceCameraId?: string;
}

export interface Incident {
  id: string;
  type: IncidentType;
  district: District;
  priority: Priority;
  status: IncidentStatus;
  assignee: string;
  createdAt: string;
  updatedAt: string;
  description: string;
  sourceType: SourceType;
  dataSource: string;
  sourceCameraId?: string;
}

export interface CallDeflection {
  total: number;
  deflected: number;
  human: number;
  crmOpened: number;
}

export interface ReasoningStep {
  step: number;
  title: string;
  detail: string;
}

// ─── Scenario state types ─────────────────────────────────────────────────────

export type ScenarioPhase =
  | "idle"
  | "anomaly_detected"
  | "ai_correlation"
  | "recommendation_created"
  | "task_dispatched"
  | "citizen_updated"
  | "kpi_improving"
  | "resolved";

export interface DetectionSource {
  source: string;
  count: number;
  change: string;
}

export interface ScenarioTimelineStep {
  phase: ScenarioPhase;
  label: string;
  done: boolean;
}

export interface CameraFeed {
  id: string;
  name: string;
  district: District;
  location: string;
  status: "online" | "alert" | "offline";
  lastEvent: string;
  lastEventTime: string;
  eventType: "waste" | "traffic" | "safety" | "none";
  videoSrc?: string;
  streamUrl?: string;
}

export interface ContactMetrics {
  totalIncomingRequests: number;
  requestsByChannel: Record<string, number>;
  informationalRequests: number;
}

export type RequestFunnelStatus =
  | "new"
  | "inProgress"
  | "assignedToField"
  | "resolved"
  | "newComplaints"
  | "misrouted";

export interface RequestFunnel {
  status: RequestFunnelStatus;
  count: number;
}

export interface TopCategory {
  name: string;
  count: number;
  percentage: number;
}

export interface DistrictLoad {
  district: string;
  totalRequests: number;
  percentage: number;
}

export interface SlaMetrics {
  avgResponseTime: number;
  avgResolutionTime: number;
  slaBreachRate: number;
}

export interface ChannelEfficiency {
  channel: string;
  resolutionRate: number;
  escalationRate: number;
}

export interface FieldStats {
  assignedToFieldRate: number;
  handledInFieldRate: number;
}

export interface DashboardFilters {
  district?: District;
  category?: string;
  channel?: string;
  status?: string;
}

// ─── Municipal Employees ─────────────────────────────────────────────────────

export type DayKey = "sun" | "mon" | "tue" | "wed" | "thu" | "fri";
export type TeamStatus = "active" | "break" | "done" | "standby" | "unavailable" | "available";
export type DeptCategory = "waste" | "inspection" | "parks" | "infrastructure" | "external";

export interface DaySchedule {
  day: DayKey;
  districts: string[];
  shift: string;
}

export interface MunicipalTeam {
  id: string;
  name: string;
  subType: string;
  workerCount: number;
  supervisor: string;
  schedule: DaySchedule[];
  todayStatus: TeamStatus;
  todayDistricts: string[];
  openMissions: number;
  vehicleId?: string;
  note?: string;
}

export interface MunicipalDept {
  id: string;
  name: string;
  shortName: string;
  category: DeptCategory;
  color: string;
  colorLight: string;
  borderColor: string;
  teams: MunicipalTeam[];
  hasSchedule: boolean;
  isExternal?: boolean;
  externalSystemName?: string;
  relatedMissionLabel: string;
}

// ─── Route Management ─────────────────────────────────────────────────────────

export type RouteStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "delayed"
  | "requires_attention";

export type CalculatedRouteStatus = RouteStatus;

export interface RouteTemplate {
  id: string;
  name: string;
  streets: string[];
  category: IncidentType;
  estimatedDurationMin: number;
}

export type RecurrenceType = "daily" | "weekly" | "monthly";

export interface TimeWindow {
  startTime: string;
  endTime: string;
}

export interface RouteSchedule {
  id: string;
  templateId: string;
  dayOfWeek: DayKey[];
  scheduledStartTime: string;
  scheduledEndTime: string;
  assignedTeam: string;
  vehicle?: string;
  requiredCompletionPct: number;
  complaintThreshold?: number;
  active?: boolean;
  recurrenceType?: RecurrenceType;
  timesPerDay?: number;
  timesPerMonth?: number;
  dailyTimeWindows?: TimeWindow[];
}

export interface RouteExecution {
  id: string;
  scheduleId: string;
  date: string;
  actualStartTime?: string;
  actualEndTime?: string;
  completionPct: number;
  notes?: string;
}

export interface RouteComplaint {
  id: string;
  executionId: string;
  description: string;
  street: string;
  timestamp: string;
  lat?: number;
  lng?: number;
  category?: string;
}

export interface RouteRow {
  template: RouteTemplate;
  schedule: RouteSchedule;
  execution?: RouteExecution;
  complaintCount: number;
  status: CalculatedRouteStatus;
}

export type RouteMapFilter = "today" | "week" | "delayed" | "attention" | "focused";

export interface DemoScenarioData {
  phase: ScenarioPhase;
  activeArea: string | null;
  riskScore: number | null;
  detectionSources: DetectionSource[];
  activeAlert: { visible: boolean; text: string } | null;
  aiRecommendation: AIRecommendation | null;
  generatedTask: Task | null;
  liveAnomaly: Anomaly | null;
  kpiImpact: KpiValues | null;
  scenarioTimeline: ScenarioTimelineStep[];
  scenarioStatusLabel: string;
  liveCallDeflection: CallDeflection | null;
  taskCurrentStatus: "pending" | "in_progress" | "done" | null;
  reasoningChain: ReasoningStep[] | null;
}
