import type {
  DataSourceStatus,
  Kpi,
  RedLight,
  WhatIfScenario,
} from "@/lib/citymind/types";
import { SENTIMENT_DERIVED, SENTIMENT_SIGNALS_DERIVED, TOTAL_OPEN } from "@/data/seed/derive";

// ─── CityMind AI — operational intelligence modules ──────────────────────────
// SENTIMENT, SENTIMENT_SIGNALS and the open-calls KPI are DERIVED from the one
// real complaint table (data/seed/*) — they cannot drift from the map or each
// other. RED_LIGHTS / WHAT-IF / the remaining KPIs are still curated narrative;
// see the "sync status" notes below for what is real vs. illustrative.

/** "אורות אדומים" — where required field activity did not happen vs SLA (the RFP's core gap). */
export const RED_LIGHTS: RedLight[] = [
  { id: "rl-park-sla", severity: "critical", title: "סיכון חריגת SLA בהפארק הלאומי — 47 דק׳", district: "National Park", minutesToBreach: 47, linkedActionId: "act-park-cleaning" },
  { id: "rl-bursa-route", severity: "warning", title: "מסלול אשפה מתעכב באזור הבורסה", district: "Bursa District", minutesToBreach: 70, linkedActionId: "act-bursa-reroute" },
  { id: "rl-marom-spike", severity: "warning", title: "עלייה חריגה בפניות לכלוך במרום נווה", district: "Marom Nave", linkedActionId: "act-marom-frequency" },
  { id: "rl-telhashomer-gap", severity: "warning", title: "פער בין תכנון לביצוע בתל השומר", district: "Tel Hashomer" },
  { id: "rl-park-lighting", severity: "critical", title: "3 פנסי רחוב כבויים בשדרות ירושלים", district: "National Park", linkedActionId: "act-park-lighting" },
];

/** "סימולציית השפעה" — mock but plausible impact per scenario. */
export const WHATIF_SCENARIOS: WhatIfScenario[] = [
  { id: "add-cleaning-team", label: "הוספת צוות ניקיון", impact: { complaintsReductionPct: 14, slaImprovementPct: 9, teamTimeSavedMin: 42, aiConfidence: 81 } },
  { id: "reroute-waste", label: "שינוי מסלול פינוי", impact: { complaintsReductionPct: 11, slaImprovementPct: 18, teamTimeSavedMin: 25, aiConfidence: 79 } },
  { id: "proactive-ticket", label: "פתיחת קריאה יזומה", impact: { complaintsReductionPct: 21, slaImprovementPct: 6, teamTimeSavedMin: 15, aiConfidence: 74 } },
  { id: "increase-frequency", label: "הגדלת תדירות זמנית", impact: { complaintsReductionPct: 19, slaImprovementPct: 7, teamTimeSavedMin: 30, aiConfidence: 77 } },
];

/**
 * "מדד תחושת שירות" — DERIVED. Area scores, trending topics and the headline are
 * computed from the real complaint volume per district/department (data/seed/derive.ts),
 * so they always agree with the map (data/cityMap.ts) and the KPI open-call count.
 */
export const SENTIMENT = SENTIMENT_DERIVED;

/**
 * Granular sentiment readings behind the radar — DERIVED. Each real complaint is
 * bucketed by area, subject-type (from its department) and a modeled feedback
 * channel; aggregated unfiltered they reproduce SENTIMENT.zones exactly.
 */
export const SENTIMENT_SIGNALS = SENTIMENT_SIGNALS_DERIVED;

/**
 * Mini KPIs. "קריאות פתוחות" is DERIVED (real open-complaint count). The rest have
 * no basis in the source CSV and remain illustrative placeholders — see sync notes.
 */
export const KPIS: Kpi[] = [
  { id: "open", label: "קריאות פתוחות", value: String(TOTAL_OPEN), tone: "neutral" },
  { id: "sla", label: "SLA תקין", value: "88%", delta: "+3%", tone: "good" }, // ⚠ illustrative — not in source data
  { id: "teams", label: "צוותים פעילים", value: "14", tone: "neutral" }, // ⚠ illustrative
  { id: "handle-time", label: "זמן טיפול ממוצע", value: "18 דק׳", delta: "-20%", tone: "good" }, // ⚠ illustrative
  { id: "prevented", label: "פניות שנמנעו", value: "23", delta: "+8", tone: "good" }, // ⚠ illustrative
  { id: "proactive", label: "פעולות יזומות", value: "6", tone: "good" }, // ⚠ illustrative
];

/** Live data-source integration status (the RFP's "integration of all sources"). */
export const DATA_SOURCES: DataSourceStatus[] = [
  { id: "crm", label: "CRM", health: "online" },
  { id: "gis", label: "GIS", health: "online" },
  { id: "center", label: "מוקד 109", health: "online" },
  { id: "vehicles", label: "רכבים", health: "online" },
  { id: "sensors", label: "חיישנים", health: "degraded" },
  { id: "cameras", label: "מצלמות", health: "online" },
];
