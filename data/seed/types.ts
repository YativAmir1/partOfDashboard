import type { District } from "@/lib/types";
import type { ComplaintStatus, Department } from "./taxonomy";

// ─── Seed layer — the fact records ───────────────────────────────────────────
// RawSeedComplaint is what the generator (scripts/build-seed.mjs) emits from the
// real CSV: PII-safe (names pseudonymized, national-ID/phones dropped or scrubbed)
// but with the RAW domain strings kept as-is. SeedComplaint is the fully resolved
// record the app consumes — district, department and status are resolved in TS
// at import time (data/seed/complaints.ts) so the editable maps in streets.ts /
// taxonomy.ts take effect WITHOUT re-running the generator.

/** PII-safe row straight out of the CSV — domain strings still raw. */
export interface RawSeedComplaint {
  /** Stable id derived from the real "מספר פניה" (complaint number). */
  id: string;
  /** ISO timestamp parsed from "נוצר ב". */
  createdAt: string;
  /** Raw status string ("סטטוס"). */
  rawStatus: string;
  /** Raw department string ("מחלקה"). */
  rawDepartment: string;
  subject: string;
  /** Scrubbed description ("תיאור") — phone / id numbers removed. */
  description: string;
  street: string;
  houseNumber: string;
  /** Consistent pseudonym replacing the real caller name. */
  reporter: string;
  /** Handling station ("תחנה מטפלת"), or null when unassigned. */
  station: string | null;
}

/** Fully resolved, app-facing complaint (see data/seed/complaints.ts). */

export interface SeedComplaint {
  /** Stable id derived from the real "מספר פניה" (complaint number). */
  id: string;
  /** ISO timestamp parsed from "נוצר ב". */
  createdAt: string;
  status: ComplaintStatus;
  statusLabel: string;
  department: Department;
  /** Free-text subject ("נושא"). */
  subject: string;
  /** Scrubbed description ("תיאור") — phone numbers removed. */
  description: string;
  street: string;
  houseNumber: string;
  /** Resolved operational area (see data/seed/streets.ts). */
  district: District;
  /** false when the street wasn't in STREET_TO_DISTRICT and fell back. */
  districtMapped: boolean;
  /** Consistent pseudonym replacing the real caller name. */
  reporter: string;
  /** Handling station ("תחנה מטפלת"), or null when unassigned. */
  station: string | null;
}
