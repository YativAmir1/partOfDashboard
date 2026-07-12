// ─── CityMind AI — static Hebrew fallback text ───────────────────────────────
// Shown (labelled "מוצג נוסח דמו") when no API key is configured or the provider
// fails. Grounded in the same structured action data so it stays specific, not generic.
import type { CitySnapshot, LLMGenerationRequest } from "@/lib/citymind/types";
import { PRIORITY_META } from "@/lib/citymind/labels";

export function fallbackText(req: LLMGenerationRequest): string {
  const a = req.action;
  switch (req.type) {
    case "teamInstruction":
      return `הנחיה לצוות (עדיפות ${a.priority}): ${a.recommendedAction} באזור ${a.district}. עם סיום המשימה יש לתעד תמונת לפני/אחרי, מיקום וזמן סגירה לצורך הוכחת טיפול.`;
    case "residentUpdate":
      return `עיריית רמת גן מודעת למצב באזור ${a.district} ופועלת בימים אלה לטיפול יזום ולשיפור פני האזור. צוות ייעודי הוקצה לטיפול. תודה על שיתוף הפעולה — אנו כאן לשירותכם.`;
    case "executiveSummary":
      return `תמונת מצב תפעולית: זוהתה נקודת תשומת לב באזור ${a.district} בעדיפות ${a.priority}. המלצה מיידית — ${a.title}. השפעה צפויה: ${a.expectedImpact}. מומלץ אישור מהיר לשמירה על עמידה ב-SLA וצמצום פניות חוזרות.`;
    case "explainAction":
    default:
      return [
        `• זוהה דפוס חריג באזור ${a.district} על סמך ${a.sources.join(", ")}.`,
        `• ${a.reason}`,
        `• הפעולה המומלצת (${a.title}) צפויה להביא ל: ${a.expectedImpact}.`,
        `• רמת ביטחון המערכת: ${a.aiConfidence}%. מדובר בטיפול יזום — לפני יצירת תלונות.`,
      ].join("\n");
  }
}

const PRIORITY_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

/** Static, data-grounded briefing — shown when no key is configured or the provider fails. */
export function briefingFallback(snap: CitySnapshot): string {
  const critical = snap.redLights.filter((r) => r.severity === "critical");
  const top = [...snap.actions]
    .sort((x, y) => (PRIORITY_RANK[x.priority] ?? 9) - (PRIORITY_RANK[y.priority] ?? 9))
    .slice(0, 3);
  const sla = snap.kpis.find((k) => k.label.includes("SLA"));

  return [
    `תמונת מצב: ${snap.actions.length} פעולות פעילות בתור, ${snap.redLights.length} אורות אדומים (${critical.length} קריטיים).`,
    critical.length ? `סיכון מוביל: ${critical[0].title}.` : `אין חריגות קריטיות פתוחות כרגע.`,
    `סדר טיפול מומלץ:`,
    ...top.map(
      (a, i) =>
        `${i + 1}. ${a.title} (${a.district}, עדיפות ${PRIORITY_META[a.priority]?.label ?? a.priority}) — ${a.slaLabel}.`,
    ),
    `תחושת שירות: ${snap.sentiment.headline}.`,
    `שורה תחתונה: טיפול יזום לפי הסדר שלמעלה שומר על ${sla ? sla.value : "יעד"} עמידה ב-SLA ומצמצם פניות חוזרות.`,
  ].join("\n");
}

/** Static Q&A fallback — steers the manager to the live data rather than guessing. */
export function qaFallback(snap: CitySnapshot): string {
  const critical = snap.redLights.find((r) => r.severity === "critical");
  return [
    `מצב ה-LLM אינו זמין כעת, אז הנה תקציר מהנתונים:`,
    `• ${snap.actions.length} פעולות פעילות, ${snap.redLights.length} אורות אדומים.`,
    critical ? `• הסיכון הדחוף ביותר: ${critical.title}.` : `• אין חריגה קריטית פתוחה.`,
    `• תחושת שירות: ${snap.sentiment.headline}.`,
    `נסו שוב בעוד רגע לקבלת תשובה מלאה מבוססת-LLM.`,
  ].join("\n");
}
