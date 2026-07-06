// ─── Command Center — closed-loop treatment types ───────────────────────────
// The Command Center turns raw CRM requests into *cases* that the system
// actively treats: detect → triage → dispatch → track SLA → verify closure.

/** Department key, aligned with EMPLOYEES_DATA ids and the CRM "מחלקה" field. */
export type DeptKey =
  | "waste"          // שרותי ניקיון / הנהלת שפ"ע
  | "parks"          // גנים ונוף
  | "infrastructure" // דרכים / יחידת אחזקה
  | "inspection"     // פיקוח (חצרות, חניה)
  | "environment"    // איכות הסביבה
  | "traffic"        // תנועה
  | "recycling";     // מחלקת מיחזור

/** The lifecycle stage of a case — this is the closed loop. */
export type CaseStage =
  | "detected"    // נקלט מ-CRM / חיישן / מצלמה
  | "triaged"     // ה-AI סיווג ותיעדף
  | "dispatched"  // צוות שוגר לשטח
  | "in_field"    // הצוות בשטח / בטיפול
  | "resolved";   // טופל ואומת — הלולאה נסגרה

/** SLA tier — the "traffic light" the whole system pivots on. */
export type SlaTier =
  | "ok"        // 🟢  < 50% מזמן היעד
  | "warning"   // 🟡  50%–100% — התראה מקדימה
  | "action"    // 🟠  100%–150% — חריגה, לפעול עכשיו
  | "critical"; // 🔴  > 150% — חריגה חמורה / אור אדום

export type Priority = "critical" | "high" | "medium" | "low";

/** Where the case originated. */
export type CaseSource = "crm" | "camera" | "sensor" | "field_inspector" | "ai";

/** A red-light reason — something that *should* have happened but did not. */
export type RedLightReason =
  | "dispatch_failed"   // שליחה בוטלה / כישלון בשליחה לעובד שטח
  | "misrouted"         // לא שייך למחלקה
  | "stuck_new"         // נשאר "חדש" מעבר לזמן התראה
  | "sla_critical"      // חריגת SLA חמורה
  | "recurring";        // פנייה חוזרת על אותו מוקד

/** A treatment action the AI can take or recommend. */
export interface TreatmentAction {
  id: string;
  kind:
    | "dispatch"          // שיגור צוות — מבוצע אוטומטית
    | "notify_team"       // שליחת מידע לצוות — מבוצע
    | "raise_alert"       // הקפצת התראה — מבוצע
    | "contact_resident"  // יצירת קשר עם תושב — המלצה
    | "boost_frequency"   // הגברת תדירות מסלול — המלצה
    | "escalate";         // הסלמה למנהל — המלצה
  label: string;
  /** true = the system performs it; false = requires human approval. */
  autonomous: boolean;
  detail: string;
}

/** A field team candidate for dispatch, ranked by proximity (Itoran feed). */
export interface DispatchCandidate {
  teamId: string;
  teamName: string;
  deptId: string;
  supervisor: string;
  vehicleId?: string;
  vehicleLabel?: string;
  distanceMeters: number;
  etaMinutes: number;
  available: boolean;
  statusNote: string;
}

/** A single treatable case. */
export interface CommandCase {
  id: string;
  requestNumber: string;      // מספר פניה, e.g. "202605-594787"
  source: CaseSource;
  dept: DeptKey;
  deptLabel: string;          // CRM "מחלקה"
  subject: string;            // CRM "נושא"
  description: string;        // CRM "תיאור"
  street: string;
  houseNumber: string;
  district: string;
  coords: [number, number];   // [lat, lon]
  caller: string;
  callerPhone?: string;

  createdAt: string;          // ISO — authored relative to DEMO_NOW
  stage: CaseStage;
  priority: Priority;

  /** SLA target for the *action* deadline, in hours. */
  slaTargetHours: number;

  /** Raw CRM statuses, kept for authenticity + red-light detection. */
  crmStatus: string;          // סטטוס
  fieldStatus: string;        // סטטוס אפליקציית שטח
  assignedWorker?: string;    // עובד אפליקציית שטח
  handlingStation?: string;   // תחנה מטפלת

  /** Set when the loop reaches its later stages (authored or live). */
  dispatchedTeamId?: string;
  dispatchedAt?: string;
  resolvedAt?: string;

  /** Populated by the triage engine. */
  redLights: RedLightReason[];
  recurringCount?: number;    // כמה פניות על אותו מוקד/נושא

  /** Verification of closure (camera / second signal / field report). */
  verification?: { method: string; note: string; confirmed: boolean };
}

/** Computed live SLA state for a case. */
export interface SlaState {
  tier: SlaTier;
  elapsedHours: number;
  targetHours: number;
  ratio: number;             // elapsed / target
  remainingHours: number;    // can be negative (overdue)
  label: string;             // human string, e.g. "נותרו 3ש׳" / "חריגה 5ש׳"
}
