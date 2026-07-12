// ─── CityMind AI — Hebrew label maps + lifecycle helpers ─────────────────────
import type {
  ActionKind,
  ActionStatus,
  LLMGenerationType,
  LifecycleStep,
  SentimentSource,
  SentimentType,
  SlaRiskTier,
  SourceSignal,
} from "./types";

/** The 7-step closed loop, in order — "שרשרת טיפול סגורה". */
export const LIFECYCLE_STEPS: { key: LifecycleStep; label: string }[] = [
  { key: "detected", label: "זוהה" },
  { key: "analyzed", label: "נותח" },
  { key: "recommended", label: "הומלץ" },
  { key: "approved", label: "אושר" },
  { key: "dispatched", label: "נשלח לשטח" },
  { key: "verified", label: "אומת" },
  { key: "learned", label: "נלמד" },
];

const STEP_ORDER: LifecycleStep[] = LIFECYCLE_STEPS.map((s) => s.key);

/** The furthest lifecycle step reached for a given action status. */
export const STATUS_TO_STEP: Record<ActionStatus, LifecycleStep> = {
  recommended: "recommended",
  approved: "approved",
  dispatched: "dispatched",
  verified: "verified",
  dismissed: "recommended",
};

/** Index of a step in the loop (for "is this step done?" logic). */
export function stepIndex(step: LifecycleStep): number {
  return STEP_ORDER.indexOf(step);
}

export const ACTION_KIND_LABEL: Record<ActionKind, string> = {
  reinforce_cleaning: "תגבור ניקיון",
  reroute_waste: "שינוי מסלול פינוי",
  proactive_ticket: "פתיחת קריאה יזומה",
  increase_frequency: "העלאת תדירות זמנית",
  dispatch_inspector: "שיגור פקח",
  preventive_maintenance: "אחזקה מונעת",
};

export const SOURCE_LABEL: Record<SourceSignal, string> = {
  crm: "CRM",
  gis: "GIS",
  sensor: "חיישנים",
  camera: "מצלמות",
  vehicle: "נתוני רכבים",
  history: "פניות עבר",
  sentiment: "תחושת שירות",
};

/** SLA "traffic light" palette — aligned with the dark cockpit theme. */
export const SLA_TIER_META: Record<
  SlaRiskTier,
  { label: string; color: string; bg: string }
> = {
  ok: { label: "תקין", color: "#4ade80", bg: "rgba(22,163,74,0.12)" },
  warning: { label: "התראה מקדימה", color: "#eab308", bg: "rgba(234,179,8,0.12)" },
  action: { label: "לפעול עכשיו", color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  critical: { label: "חריגה חמורה", color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
};

export const PRIORITY_META: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  critical: { label: "קריטי", color: "#f87171", bg: "rgba(239,68,68,0.16)" },
  high: { label: "גבוה", color: "#fbbf24", bg: "rgba(245,158,11,0.16)" },
  medium: { label: "בינוני", color: "#cbd5e1", bg: "rgba(148,163,184,0.16)" },
  low: { label: "נמוך", color: "#94a3b8", bg: "rgba(100,116,139,0.16)" },
};

/** Sentiment feedback channels ("מקור") — ordered for the filter dropdown. */
export const SENTIMENT_SOURCE_LABEL: Record<SentimentSource, string> = {
  center: "מוקד 109",
  social: "רשתות חברתיות",
  app: "אפליקציית פניות",
  survey: "סקרי שביעות רצון",
};

/** Sentiment subject categories ("סוג") — ordered for the filter dropdown. */
export const SENTIMENT_TYPE_LABEL: Record<SentimentType, string> = {
  cleaning: "ניקיון פארקים",
  waste: "פינוי אשפה",
  pruning: "גזם",
  hazards: "מפגעים חוזרים",
  lighting: "תאורת רחוב",
};

export const LLM_ACTION_LABEL: Record<LLMGenerationType, string> = {
  explainAction: "הסבר החלטת AI",
  teamInstruction: "נסח הנחיה לצוות",
  residentUpdate: "נסח עדכון לתושב",
  executiveSummary: "הפק סיכום מנהלים",
};
