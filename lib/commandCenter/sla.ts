import type { CommandCase, DeptKey, Priority, SlaState, SlaTier } from "./types";

// ─── The demo clock ──────────────────────────────────────────────────────────
// All SLA math is relative to this anchor. Cases carry timestamps authored
// relative to it, so the queue shows a realistic spread of 🟢🟡🟠🔴.
// A live clock (see useDemoClock) ticks forward from here so SLA counts down.
export const DEMO_NOW = new Date("2026-05-27T11:00:00");

// ─── SLA action targets (hours) ──────────────────────────────────────────────
// Not derived from the (unreliable) SLA export — deliberately simple, defensible
// targets per department, with a few subject-level overrides for hazards.
const DEPT_TARGET_HOURS: Record<DeptKey, number> = {
  waste: 24,
  inspection: 24,
  parks: 72,
  infrastructure: 48,
  environment: 24,
  traffic: 96,
  recycling: 48,
};

/** Keyword → target override. Safety/hazard wording shortens the deadline. */
const SUBJECT_OVERRIDES: Array<{ match: RegExp; hours: number }> = [
  { match: /מפגע בטיחות|סכנ|קריס|מסוכן|שבור|נזיל|ביוב|פרוצ/, hours: 8 },
  { match: /חולד|מקק|עכבר|הדבר|זבל|אשפה|צחנה|מזבל/, hours: 12 },
  { match: /בור בכביש|מהמור|שקיע|קולטן|ניקוז/, hours: 24 },
  { match: /גיזום|גזם|צמחי|עצי|שתיל/, hours: 72 },
  { match: /סימון|צביע|תמרור|מעבר חצי/, hours: 96 },
];

/** Resolve the action-SLA target (hours) for a CRM row. */
export function slaTargetFor(dept: DeptKey, subject: string, description: string): number {
  const hay = `${subject} ${description}`;
  for (const o of SUBJECT_OVERRIDES) {
    if (o.match.test(hay)) return o.hours;
  }
  return DEPT_TARGET_HOURS[dept] ?? 48;
}

// ─── Tiered SLA engine ───────────────────────────────────────────────────────
// 🟢 <50%  ·  🟡 50–100% (early alert)  ·  🟠 100–150% (act now)  ·  🔴 >150%
export function tierFromRatio(ratio: number): SlaTier {
  if (ratio < 0.5) return "ok";
  if (ratio < 1.0) return "warning";
  if (ratio < 1.5) return "action";
  return "critical";
}

function hoursLabel(h: number): string {
  const abs = Math.abs(h);
  if (abs < 1) return `${Math.round(abs * 60)} ד׳`;
  if (abs < 48) return `${abs.toFixed(abs < 10 ? 1 : 0)} ש׳`;
  return `${Math.round(abs / 24)} ימים`;
}

/** Compute live SLA state for a case given the current (demo) time. */
export function computeSla(c: CommandCase, now: Date): SlaState {
  // Resolved cases freeze their clock at resolution time.
  const end = c.resolvedAt ? new Date(c.resolvedAt) : now;
  const elapsedMs = end.getTime() - new Date(c.createdAt).getTime();
  const elapsedHours = Math.max(0, elapsedMs / 3_600_000);
  const targetHours = c.slaTargetHours;
  const ratio = targetHours > 0 ? elapsedHours / targetHours : 0;
  const remainingHours = targetHours - elapsedHours;
  const tier = tierFromRatio(ratio);

  const label =
    remainingHours >= 0
      ? `נותרו ${hoursLabel(remainingHours)}`
      : `חריגה ${hoursLabel(remainingHours)}`;

  return { tier, elapsedHours, targetHours, ratio, remainingHours, label };
}

// ─── Tier presentation ───────────────────────────────────────────────────────
export const TIER_META: Record<
  SlaTier,
  { label: string; dot: string; text: string; bg: string; border: string }
> = {
  ok:       { label: "בזמן",        dot: "#16a34a", text: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" },
  warning:  { label: "התראה מקדימה", dot: "#eab308", text: "#a16207", bg: "#fefce8", border: "#fde68a" },
  action:   { label: "חריגה — לפעול", dot: "#f97316", text: "#c2410c", bg: "#fff7ed", border: "#fed7aa" },
  critical: { label: "אור אדום",     dot: "#dc2626", text: "#b91c1c", bg: "#fef2f2", border: "#fecaca" },
};

/** Priority derived from tier + hazard signal — drives queue ordering. */
export function derivePriority(tier: SlaTier, hazardHint: boolean): Priority {
  if (tier === "critical" || (tier === "action" && hazardHint)) return "critical";
  if (tier === "action" || (tier === "warning" && hazardHint)) return "high";
  if (tier === "warning") return "medium";
  return "low";
}

/** Numeric weight so the action queue sorts most-urgent-first. */
export function urgencyScore(c: CommandCase, sla: SlaState): number {
  const tierWeight: Record<SlaTier, number> = { critical: 400, action: 300, warning: 200, ok: 100 };
  const prioWeight: Record<Priority, number> = { critical: 40, high: 30, medium: 20, low: 10 };
  return tierWeight[sla.tier] + prioWeight[c.priority] + c.redLights.length * 15 + Math.min(sla.ratio, 3) * 5;
}
