// ─── CityMind AI — LLM prompt construction ───────────────────────────────────
// The model EXPLAINS / PHRASES; it never invents facts or decides the action.
import type { CitySnapshot, LLMGenerationRequest } from "@/lib/citymind/types";
import { PRIORITY_META } from "@/lib/citymind/labels";

export const SYSTEM_PROMPT = `אתה עוזר תפעולי מבוסס AI של עיריית רמת גן (אגף שפ"ע ושירות לתושב).
כתוב אך ורק בעברית תקנית ומקצועית.
תפקידך להסביר ולנסח המלצות תפעוליות אך ורק על סמך הנתונים המובנים שסופקו לך.
אל תמציא עובדות, מספרים או פרטים שלא הופיעו בנתונים.
היה תמציתי, מעשי ומכוון-פעולה. אל תשתמש בשפה שיווקית.
כתוב אך ורק במילים עבריות תקינות — אל תשלב מילים, אותיות או סימנים משפות זרות, ואל תציג את תהליך החשיבה שלך.
אל תחשוף פרטים אישיים מזהים. התאם את הסגנון לנמען לפי סוג הפלט המבוקש (מנהל / צוות שטח / תושב).`;

/** Builds the user prompt: the structured facts + a per-type instruction. */
export function buildUserPrompt(req: LLMGenerationRequest): string {
  const a = req.action;
  const facts = [
    `פעולה מומלצת: ${a.title}`,
    `אזור: ${a.district}`,
    `עדיפות: ${a.priority}`,
    `רמת ביטחון המערכת: ${a.aiConfidence}%`,
    `סיבה: ${a.reason}`,
    a.reasoningBullets.length ? `נימוקים: ${a.reasoningBullets.join("; ")}` : "",
    `פעולה בשטח: ${a.recommendedAction}`,
    `השפעה צפויה: ${a.expectedImpact}`,
    `סיכון SLA: ${a.slaRisk.label}`,
    a.suggestedTeamType ? `סוג צוות מוצע: ${a.suggestedTeamType}` : "",
    a.etaMinutes ? `זמן הגעה משוער: ${a.etaMinutes} דק׳` : "",
    `מקורות מידע: ${a.sources.join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n");

  const instruction = INSTRUCTIONS[req.type] ?? INSTRUCTIONS.explainAction;
  return `${instruction}\n\nנתונים מובנים:\n${facts}`;
}

const INSTRUCTIONS: Record<LLMGenerationRequest["type"], string> = {
  explainAction:
    "על סמך הנתונים הבאים בלבד, כתוב הסבר קצר למנהל האגף (2–4 נקודות): מדוע הפעולה מומלצת, אילו אותות תומכים בה, איזה סיכון היא מפחיתה, ומה ההשפעה הצפויה. התמקד בהיגיון התפעולי.",
  teamInstruction:
    "נסח הודעת הנחיה קצרה וברורה לצוות השטח. כלול: עדיפות, מיקום ברמת אזור, המשימה, ומה נדרש כהוכחת טיפול (תיעוד לפני/אחרי, זמן סגירה). ללא פרטים אישיים.",
  residentUpdate:
    "נסח עדכון קצר, אדיב ושירותי לתושב בשם עיריית רמת גן. אל תחשוף פרטים פנימיים (SLA, רמות ביטחון, שמות צוותים). אל תאשים תושבים או עובדים. שמור על טון מרגיע ושירותי.",
  executiveSummary:
    "כתוב סיכום מנהלים קצר: התמונה התפעולית הנוכחית, הסיכונים המובילים, הפעולות המיידיות המומלצות, וההשפעה הצפויה ברמת העיר.",
};

// ─── City-wide prompts (briefing + natural-language Q&A) ─────────────────────
// Both operate over a sanitized CitySnapshot — many signals at once — so the
// model actually reasons across the picture instead of rephrasing one card.

const STATUS_LABEL: Record<string, string> = {
  recommended: "ממתין לאישור",
  approved: "אושר",
  dispatched: "נשלח לשטח",
  verified: "אומת",
};

const TREND_LABEL: Record<string, string> = { up: "במגמת עלייה", down: "במגמת ירידה", flat: "יציב" };

/** Render the whole operational snapshot as compact Hebrew facts for the prompt. */
export function renderSnapshot(snap: CitySnapshot): string {
  const actions = snap.actions.length
    ? snap.actions
        .map(
          (a, i) =>
            `${i + 1}. ${a.title} | אזור: ${a.district} | עדיפות: ${
              PRIORITY_META[a.priority]?.label ?? a.priority
            } | סטטוס: ${STATUS_LABEL[a.status] ?? a.status} | ביטחון: ${a.aiConfidence}% | סיכון SLA: ${
              a.slaLabel
            } | סיבה: ${a.reason}`,
        )
        .join("\n")
    : "אין פעולות פעילות בתור.";

  const redLights = snap.redLights.length
    ? snap.redLights
        .map(
          (r) =>
            `- [${r.severity === "critical" ? "קריטי" : "אזהרה"}] ${r.title} (אזור: ${r.district}${
              r.minutesToBreach ? `, חריגה בעוד ${r.minutesToBreach} דק׳` : ""
            })`,
        )
        .join("\n")
    : "אין אורות אדומים פעילים.";

  const kpis = snap.kpis.map((k) => `${k.label}: ${k.value}${k.delta ? ` (${k.delta})` : ""}`).join(" · ");

  const worstZones = snap.sentiment.worstZones.map((z) => `${z.label} (${z.score})`).join(", ");
  const topics = snap.sentiment.topTopics
    .map((t) => `${t.topic} (${t.mentions} אזכורים, ${TREND_LABEL[t.trend] ?? t.trend})`)
    .join(", ");

  return [
    `פעולות בתור (${snap.actions.length}):`,
    actions,
    ``,
    `אורות אדומים:`,
    redLights,
    ``,
    `מדדי מפתח: ${kpis}`,
    ``,
    `תחושת שירות — כותרת: ${snap.sentiment.headline}`,
    `אזורים בסיכון תחושתי: ${worstZones}`,
    `נושאים בולטים: ${topics}`,
  ].join("\n");
}

/** Executive briefing across the whole queue — the high-value synthesis view. */
export function buildBriefingPrompt(snap: CitySnapshot): string {
  const instruction =
    "אתה מתדרך את מנהל אגף שפ\"ע בתחילת משמרת. על סמך הנתונים המובנים בלבד, כתוב תדריך מנהלים תמציתי במבנה הבא:\n" +
    "1) תמונת מצב — משפט־שניים על המצב התפעולי הכללי.\n" +
    "2) 2–3 הסיכונים המובילים כעת, לפי דחיפות, עם האזור והסיבה.\n" +
    "3) סדר פעולות מומלץ — מה לאשר/לטפל קודם ולמה (התבסס על עדיפות, סיכון SLA ותחושת שירות).\n" +
    "4) שורה תחתונה — ההשפעה הצפויה אם ננקטות הפעולות.\n" +
    "אל תמציא נתונים שלא הופיעו. אל תחזור על הרשימה הגולמית — תעדף וסנתז.";
  return `${instruction}\n\nנתונים מובנים:\n${renderSnapshot(snap)}`;
}

/** Grounded natural-language Q&A over the same snapshot ("שאל את CityMind"). */
export const QA_SYSTEM_PROMPT = `אתה CityMind — עוזר תפעולי מבוסס AI של עיריית רמת גן (אגף שפ"ע ושירות לתושב).
ענה על שאלת המנהל אך ורק על סמך "נתוני העיר" שסופקו לך למטה.
אם התשובה אינה קיימת בנתונים, אמור זאת במפורש והצע איזה נתון היה נדרש — אל תנחש ואל תמציא.
כתוב אך ורק בעברית תקנית ומקצועית, תמציתי ומכוון-פעולה, ללא שפה שיווקית וללא חשיפת פרטים אישיים מזהים.
כתוב במילים עבריות בלבד ואל תציג את תהליך החשיבה שלך.`;

export function buildQAPrompt(question: string, snap: CitySnapshot): string {
  return `נתוני העיר (המקור היחיד לתשובה):\n${renderSnapshot(snap)}\n\nשאלת המנהל:\n${question.trim()}`;
}
