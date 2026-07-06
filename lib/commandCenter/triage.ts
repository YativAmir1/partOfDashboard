import type {
  CommandCase,
  RedLightReason,
  SlaState,
  TreatmentAction,
} from "./types";

// CRM field-status strings that mean "a required dispatch did NOT happen".
const FAILED_DISPATCH = ["שליחה בוטלה", "כישלון בשליחה לעובד שטח"];
const MISROUTED = ["לא שייך למחלקה"];

const HAZARD_RE = /מפגע בטיחות|סכנ|קריס|מסוכן|שבור|נזיל|ביוב|פרוצ|חולד|מקק/;

/** Does the case text signal a safety hazard? Bumps priority + shortens SLA. */
export function isHazard(c: CommandCase): boolean {
  return HAZARD_RE.test(`${c.subject} ${c.description}`);
}

/**
 * Detect "red lights" — gaps between what should have happened and what did.
 * This is the heart of the problem-solving pivot: not "here's data", but
 * "here's where the process silently failed".
 */
export function detectRedLights(c: CommandCase, sla: SlaState): RedLightReason[] {
  const flags = new Set<RedLightReason>();

  if (FAILED_DISPATCH.some((s) => c.fieldStatus.includes(s))) flags.add("dispatch_failed");
  if (MISROUTED.some((s) => c.fieldStatus.includes(s))) flags.add("misrouted");
  if (c.crmStatus.includes("חדש") && sla.tier !== "ok" && c.stage === "detected") flags.add("stuck_new");
  if (sla.tier === "critical") flags.add("sla_critical");
  if ((c.recurringCount ?? 0) > 1) flags.add("recurring");

  return [...flags];
}

export const RED_LIGHT_META: Record<RedLightReason, { label: string; explain: string }> = {
  dispatch_failed: { label: "שיגור נכשל", explain: "השליחה לעובד השטח בוטלה/נכשלה — הפנייה נתקעה בלי טיפול" },
  misrouted:       { label: "ניתוב שגוי", explain: "סווג ל\"לא שייך למחלקה\" — נדרש ניתוב מחדש" },
  stuck_new:       { label: "תקוע כ\"חדש\"", explain: "לא נלקח לטיפול והתחיל לחרוג מזמן היעד" },
  sla_critical:    { label: "חריגת SLA חמורה", explain: "עבר מעל 150% מזמן היעד" },
  recurring:       { label: "מוקד חוזר", explain: "כמה פניות על אותו מקום — נדרש טיפול שורש" },
};

/**
 * Build the treatment plan the AI proposes for a case.
 * `dispatch` / `notify_team` / `raise_alert` are autonomous (the system does them);
 * the rest require human approval.
 */
export function buildTreatmentPlan(c: CommandCase, sla: SlaState): TreatmentAction[] {
  const actions: TreatmentAction[] = [];
  const hazard = isHazard(c);

  if (c.stage === "detected" || c.stage === "triaged") {
    actions.push({
      id: `${c.id}-dispatch`,
      kind: "dispatch",
      label: "שגר צוות לשטח",
      autonomous: true,
      detail: "שיגור הצוות הזמין הקרוב ביותר לפי מיקום איתורן",
    });
  }

  if (hazard || sla.tier === "critical" || sla.tier === "action") {
    actions.push({
      id: `${c.id}-alert`,
      kind: "raise_alert",
      label: "הקפץ התראה למנהל התורן",
      autonomous: true,
      detail: "מפגע בטיחותי / חריגת SLA — דורש עדכון ניהולי מיידי",
    });
  }

  actions.push({
    id: `${c.id}-notify`,
    kind: "notify_team",
    label: "שלח תדריך לצוות",
    autonomous: true,
    detail: "כתובת, תיאור הפנייה ותמונות נשלחים לאפליקציית השטח",
  });

  if ((c.recurringCount ?? 0) > 1) {
    actions.push({
      id: `${c.id}-boost`,
      kind: "boost_frequency",
      label: `המלצה: הגברת תדירות מסלול · ${c.street}`,
      autonomous: false,
      detail: `${c.recurringCount} פניות על אותו מוקד — טיפול נקודתי לא פותר את השורש`,
    });
  }

  if (c.callerPhone) {
    actions.push({
      id: `${c.id}-contact`,
      kind: "contact_resident",
      label: "המלצה: יצירת קשר עם התושב",
      autonomous: false,
      detail: `עדכון סטטוס יזום ל${c.caller}`,
    });
  }

  if (c.redLights.includes("dispatch_failed") || c.redLights.includes("misrouted")) {
    actions.push({
      id: `${c.id}-escalate`,
      kind: "escalate",
      label: "המלצה: הסלמה למנהל התחנה",
      autonomous: false,
      detail: "הפנייה נתקעה בתהליך — נדרשת התערבות ניהולית",
    });
  }

  return actions;
}

/** Suggested field action, phrased for the operator. */
export function suggestedAction(c: CommandCase): string {
  const hay = `${c.subject} ${c.description}`;
  if (/זבל|אשפה|מזבל|גרוט/.test(hay)) return "פינוי הפסולת, איסוף וטעינה, וניקיון וחיטוי הסביבה.";
  if (/חולד|מקק|עכבר|הדבר/.test(hay)) return "שיגור פקח חצרות, סגירת פתחים ותיאום הדברה.";
  if (/גיזום|גזם|צמחי|עצי/.test(hay)) return "גיזום הצמחייה החוסמת ופינוי הגזם מהשטח.";
  if (/בור|מהמור|כביש|אספלט|שקיע/.test(hay)) return "סגירת הבור, יישור ואיטום משטח הכביש.";
  if (/ביוב|ניקוז|קולטן|נזיל/.test(hay)) return "בדיקת התשתית, סגירת מפגע וניקוז המים.";
  if (/מסוכן|סכנ|בטיחות|קריס|שבור/.test(hay)) return "בידוד המפגע הבטיחותי ותיקון מיידי.";
  return "בדיקת המפגע בשטח וטיפול בהתאם לנוהל.";
}

/** Deterministic confidence score (82–97) for the AI recommendation. */
export function aiConfidence(c: CommandCase): number {
  const n = c.requestNumber.replace(/\D/g, "");
  const base = 82 + (parseInt(n.slice(-2), 10) % 14);
  return isHazard(c) ? Math.min(97, base + 2) : base;
}

/** Short natural-language reasoning shown in the triage card. */
export function triageSummary(c: CommandCase, sla: SlaState): string {
  const parts: string[] = [];
  parts.push(`סווג ל"${c.deptLabel}" (${c.subject}).`);
  if (isHazard(c)) parts.push("זוהה מפגע בטיחותי — תיעדוף גבוה.");
  if ((c.recurringCount ?? 0) > 1) parts.push(`מוקד חוזר: ${c.recurringCount} פניות.`);
  if (sla.tier === "critical") parts.push("חריגת SLA חמורה — אור אדום.");
  else if (sla.tier === "action") parts.push("חרג מזמן היעד — לפעול עכשיו.");
  else if (sla.tier === "warning") parts.push("מתקרב לזמן היעד.");
  return parts.join(" ");
}
