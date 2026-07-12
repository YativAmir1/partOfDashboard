import type { SentimentType } from "@/lib/citymind/types";

// ─── Seed layer — canonical taxonomy ─────────────────────────────────────────
// Departments, statuses and the department→sentiment-type bridge, all derived
// from the DISTINCT values actually present in the real CSV. This is what keeps
// the taxonomy honest: the generator validates every row against these tables.

/** The 8 handling departments present in the real data ("מחלקה"). */
export const DEPARTMENTS = [
  "שרותי ניקיון",
  "גנים ונוף",
  "דרכים",
  "יחידת אחזקה",
  'הנהלת אגף שפ"ע',
  "איכות הסביבה",
  "תנועה",
  "מחלקת מיחזור",
] as const;

export type Department = (typeof DEPARTMENTS)[number];

/** Normalized lifecycle status for a complaint. All three real statuses are "open". */
export type ComplaintStatus = "new" | "in_progress" | "dispatched";

/** Raw CSV status ("סטטוס") → normalized status + Hebrew label. */
export const STATUS_MAP: Record<string, { key: ComplaintStatus; label: string }> = {
  "חדש": { key: "new", label: "חדש" },
  "בטיפול": { key: "in_progress", label: "בטיפול" },
  "הועבר לאפליקציית שטח": { key: "dispatched", label: "הועבר לאפליקציית שטח" },
};

export const DEFAULT_STATUS: { key: ComplaintStatus; label: string } = {
  key: "new",
  label: "חדש",
};

/**
 * Department → "מדד תחושת שירות" subject type. Lets granular complaints feed the
 * sentiment radar (SentimentType has no "roads"/"traffic" bucket, so those map
 * to "hazards" — the closest citizen-facing category).
 */
export const SENTIMENT_TYPE_BY_DEPARTMENT: Record<Department, SentimentType> = {
  "שרותי ניקיון": "cleaning",
  "מחלקת מיחזור": "waste",
  "גנים ונוף": "pruning",
  "דרכים": "hazards",
  "תנועה": "hazards",
  "איכות הסביבה": "hazards",
  "יחידת אחזקה": "hazards",
  'הנהלת אגף שפ"ע': "cleaning",
};

/** Best-effort resolve a raw department string to a canonical one (identity if already canonical). */
export function normalizeDepartment(raw: string): Department {
  const d = raw.trim() as Department;
  return DEPARTMENTS.includes(d) ? d : 'הנהלת אגף שפ"ע';
}

export function sentimentTypeForDepartment(dept: Department): SentimentType {
  return SENTIMENT_TYPE_BY_DEPARTMENT[dept] ?? "cleaning";
}
