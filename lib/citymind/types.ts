// ─── CityMind AI — domain types ─────────────────────────────────────────────
// The operational intelligence layer: the *system* detects & recommends
// (structured data below); the LLM only explains / phrases it (see lib/ai).
import type { District, Priority } from "@/lib/types";

/** Signals that fed a recommendation — the "integration of all sources" the RFP asks for. */
export type SourceSignal =
  | "crm" // CRM (Dynamics 365)
  | "gis" // GIS עירוני
  | "sensor" // חיישני LORA-WAN
  | "camera" // מצלמות Computer Vision
  | "vehicle" // GPS רכבים (איתורן)
  | "history" // פניות/היסטוריה
  | "sentiment"; // מדד תחושת שירות

/** The kind of proactive operational move the AI recommends. */
export type ActionKind =
  | "reinforce_cleaning" // תגבור ניקיון
  | "reroute_waste" // שינוי מסלול פינוי
  | "proactive_ticket" // פתיחת קריאה יזומה
  | "increase_frequency" // העלאת תדירות זמנית
  | "dispatch_inspector" // שיגור פקח
  | "preventive_maintenance"; // אחזקה מונעת

/** Where an action is along the closed loop (drives the card CTA + status pill). */
export type ActionStatus = "recommended" | "approved" | "dispatched" | "verified" | "dismissed";

/** SLA "traffic light" — aligned with lib/commandCenter/sla.ts SlaTier. */
export type SlaRiskTier = "ok" | "warning" | "action" | "critical";

/** The 7-step closed treatment loop — "שרשרת טיפול סגורה". */
export type LifecycleStep =
  | "detected" // זוהה
  | "analyzed" // נותח
  | "recommended" // הומלץ
  | "approved" // אושר
  | "dispatched" // נשלח לשטח
  | "verified" // אומת
  | "learned"; // נלמד

export interface SlaRisk {
  tier: SlaRiskTier;
  label: string; // e.g. "סיכון חריגה בעוד 47 דק׳"
  minutesToBreach?: number;
}

/** "הוכחת טיפול" — proof the task was actually handled. */
export interface ProofOfService {
  gps: string; // "32.083, 34.826"
  team: string; // handling team name
  arrivalTime?: string; // "18:42"
  closeTime?: string; // "19:07"
  beforeCaption: string;
  afterCaption: string;
}

/** The core object: an AI-generated operational recommendation. */
export interface ActionRecommendation {
  id: string;
  kind: ActionKind;
  title: string; // "תגבור ניקיון בפארק הלאומי"
  district: District;
  priority: Priority;
  aiConfidence: number; // 0–100
  reason: string; // one-line "why now"
  reasoningBullets: string[]; // 2–4 bullets — the AI's reasoning
  recommendedAction: string; // the concrete field move
  expectedImpact: string; // "מניעת 12–18 פניות מוקד ושמירה על SLA"
  slaRisk: SlaRisk;
  sources: SourceSignal[];
  suggestedTeamId?: string; // → MunicipalTeam.id (employeesData)
  suggestedVehicleId?: string; // → Vehicle.id (vehiclesData)
  etaMinutes?: number;
  status: ActionStatus;
  proof?: ProofOfService;
  /** Position on the stylized SVG city map (viewBox units 0–100). */
  map: { x: number; y: number };
  linkedRedLightId?: string;
}

// ─── Live city operations map ────────────────────────────────────────────────

export type ZoneStatus = "covered" | "in_progress" | "at_risk" | "uncovered";

/** A neighborhood drawn on the operations map. */
export interface Zone {
  id: District;
  label: string; // Hebrew
  /**
   * Real geographic footprint as an SVG path (in CITY_VIEWBOX units).
   * Derived from the true Ramat Gan municipal boundary (OSM) partitioned by a
   * Voronoi tessellation seeded at real neighborhood coordinates — see data/cityMap.ts.
   */
  path: string;
  /** Label anchor = cell centroid, in CITY_VIEWBOX units. */
  labelX: number;
  labelY: number;
  coveragePct: number; // 0–100 — how much was treated today
  openIncidents: number;
  riskLevel: "low" | "medium" | "high";
  status: ZoneStatus;
  /** מדד תחושת שירות for the area, -100..100 (mirrors cityIntel SENTIMENT.zones). */
  sentiment: number;
}

export interface CoverageSummary {
  cleaningCoveragePct: number; // "כיסוי ניקיון היום: 76%"
  zonesUnvisited: number; // "אזורים ללא ביקור: 3"
  slaRisksNext2h: number; // "סיכוני SLA בשעתיים הקרובות: 5"
}

// ─── Operational intelligence modules ────────────────────────────────────────

export interface RedLight {
  id: string;
  severity: "critical" | "warning";
  title: string; // "סיכון חריגת SLA בפארק הלאומי — 47 דק׳"
  district: District;
  minutesToBreach?: number;
  linkedActionId?: string;
}

export interface WhatIfImpact {
  complaintsReductionPct: number;
  slaImprovementPct: number;
  teamTimeSavedMin: number;
  aiConfidence: number;
}

export interface WhatIfScenario {
  id: string;
  label: string; // "הוספת צוות ניקיון"
  impact: WhatIfImpact;
}

export type SentimentLevel = "positive" | "neutral" | "negative";

/** The feedback channel a sentiment signal came from ("מקור"). */
export type SentimentSource = "center" | "social" | "app" | "survey";

/** The subject category a sentiment signal is about ("סוג"). */
export type SentimentType = "cleaning" | "waste" | "pruning" | "hazards" | "lighting";

/** A single granular sentiment reading — aggregated (and filterable) into the radar + topics. */
export interface SentimentSignal {
  district: District;
  source: SentimentSource;
  type: SentimentType;
  score: number; // -100..100
  mentions: number;
  trend: "up" | "down" | "flat";
}

export interface ZoneSentiment {
  district: District;
  label: string;
  score: number; // -100..100
  level: SentimentLevel;
}

export interface SentimentTopic {
  topic: string; // "ניקיון פארקים"
  level: SentimentLevel;
  mentions: number;
  trend: "up" | "down" | "flat";
}

export interface SentimentInsight {
  zones: ZoneSentiment[];
  topics: SentimentTopic[];
  headline: string; // "עלייה בתסכול תושבים סביב ניקיון פארקים בשעות הערב"
}

export type KpiTone = "neutral" | "good" | "warn" | "bad";

export interface Kpi {
  id: string;
  label: string;
  value: string; // pre-formatted
  delta?: string; // "+5%"
  tone: KpiTone;
}

export type SourceHealth = "online" | "degraded" | "offline";

export interface DataSourceStatus {
  id: string;
  label: string; // "CRM", "GIS", "מוקד 109", ...
  health: SourceHealth;
}

// ─── LLM operational-text layer (see lib/ai) ─────────────────────────────────

export type LLMGenerationType =
  | "explainAction" // הסבר החלטת AI
  | "teamInstruction" // נסח הנחיה לצוות
  | "residentUpdate" // נסח עדכון לתושב
  | "executiveSummary"; // הפק סיכום מנהלים

export type AIProviderId = "groq" | "anthropic" | "gemini" | "xai";

/**
 * The PII-free payload actually sent to the model. No caller name/phone,
 * no exact address, no staff personal names — see lib/ai/sanitize.ts.
 */
export interface ActionLLMPayload {
  title: string;
  kind: ActionKind;
  district: string; // Hebrew neighborhood label (area-level only)
  priority: Priority;
  aiConfidence: number;
  reason: string;
  reasoningBullets: string[];
  recommendedAction: string;
  expectedImpact: string;
  slaRisk: SlaRisk;
  sources: SourceSignal[];
  suggestedTeamType?: string; // team *type*, never a supervisor's name
  etaMinutes?: number;
}

export interface LLMGenerationRequest {
  type: LLMGenerationType;
  action: ActionLLMPayload;
  context: { city: string; domain: string; demoMode: boolean };
}

/** PII-free, area-level summary of one action — for city-wide prompts. */
export interface CityActionSummary {
  title: string;
  district: string; // Hebrew area label (no exact address)
  priority: Priority;
  status: ActionStatus;
  aiConfidence: number;
  reason: string;
  slaTier: SlaRiskTier;
  slaLabel: string;
}

/**
 * The whole operational picture, sanitized, fed to the executive briefing and the
 * natural-language Q&A bar. Actions come (live) from the client and are re-sanitized
 * server-side; red-lights / KPIs / sentiment are pulled from server-side data. No
 * caller names, phones, exact coordinates, staff names or internal ids ever appear.
 */
export interface CitySnapshot {
  actions: CityActionSummary[];
  redLights: { title: string; district: string; severity: "critical" | "warning"; minutesToBreach?: number }[];
  kpis: { label: string; value: string; delta?: string }[];
  sentiment: {
    headline: string;
    worstZones: { label: string; score: number }[];
    topTopics: { topic: string; mentions: number; trend: string }[];
  };
}

export interface LLMGenerationResponse {
  success: boolean;
  provider?: AIProviderId | "none";
  model?: string;
  type: LLMGenerationType;
  content: string;
  fallback?: boolean;
}
