import type { District } from "@/lib/types";
import type {
  SentimentInsight,
  SentimentSignal,
  SentimentSource,
  SentimentType,
  ZoneSentiment,
} from "@/lib/citymind/types";
import { DISTRICT_IDS, districtLabel } from "./districts";
import { SEED_COMPLAINTS } from "./complaints";
import {
  DEPARTMENTS,
  type Department,
  sentimentTypeForDepartment,
} from "./taxonomy";

// ─── Seed layer — derived aggregates ─────────────────────────────────────────
// Pure, deterministic rollups of the ONE real complaint table (SEED_COMPLAINTS).
// Every CityMind "measured" number — open-call KPI, per-district incident counts,
// the sentiment radar, trending topics — comes from here, so they can never drift
// apart. Formulas are simple and documented; tune them in this one place.

// ── counts ──
function tally<T extends string>(keys: readonly T[], pick: (c: (typeof SEED_COMPLAINTS)[number]) => T) {
  const out = Object.fromEntries(keys.map((k) => [k, 0])) as Record<T, number>;
  for (const c of SEED_COMPLAINTS) out[pick(c)]++;
  return out;
}

export const COUNT_BY_DISTRICT: Record<District, number> = tally(DISTRICT_IDS, (c) => c.district);
export const COUNT_BY_DEPARTMENT: Record<Department, number> = tally(DEPARTMENTS, (c) => c.department);
export const TOTAL_OPEN = SEED_COMPLAINTS.length;

const MAX_DISTRICT_COUNT = Math.max(1, ...DISTRICT_IDS.map((d) => COUNT_BY_DISTRICT[d]));

// ── sentiment score: more complaints in an area → more negative ──
// ratio 0 (quietest) → +30 ; ratio 1 (busiest) → -55. Deterministic, -100..100.
export function districtScore(district: District): number {
  const ratio = COUNT_BY_DISTRICT[district] / MAX_DISTRICT_COUNT;
  return Math.round(30 - ratio * 85);
}

function levelFor(score: number): "positive" | "neutral" | "negative" {
  if (score <= -20) return "negative";
  if (score >= 15) return "positive";
  return "neutral";
}

function trendFor(score: number): "up" | "down" | "flat" {
  if (score <= -20) return "up"; // frustration rising where volume is high
  if (score >= 15) return "down";
  return "flat";
}

/** Per-area sentiment, worst first — mirrored by data/cityMap.ts CITY_ZONES.sentiment. */
export const SENTIMENT_ZONES: ZoneSentiment[] = DISTRICT_IDS
  .map((id) => {
    const score = districtScore(id);
    return { district: id, label: districtLabel(id), score, level: levelFor(score) };
  })
  .sort((a, b) => a.score - b.score);

// ── granular signals: split each complaint into a feedback channel ──
// The CSV is 109-call-center origin, but the radar filters by channel, so we model
// a fixed channel mix (documented assumption) and bucket each complaint by a
// deterministic hash of its id. Mentions stay integers and sum to real totals.
const SOURCE_WEIGHTS: ReadonlyArray<[SentimentSource, number]> = [
  ["center", 0.5],
  ["app", 0.25],
  ["social", 0.15],
  ["survey", 0.1],
];

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function sourceForId(id: string): SentimentSource {
  const r = (hash(id) % 1000) / 1000;
  let acc = 0;
  for (const [src, w] of SOURCE_WEIGHTS) {
    acc += w;
    if (r < acc) return src;
  }
  return "center";
}

// per-type score nudge so the dominant nuisance reads slightly worse
const TYPE_OFFSET: Record<SentimentType, number> = {
  cleaning: -8,
  waste: -8,
  hazards: -4,
  pruning: 0,
  lighting: 2,
};

function clampScore(n: number): number {
  return Math.max(-100, Math.min(100, n));
}

/** SentimentSignal[] grouped by (district, type, source) — aggregates back to SENTIMENT_ZONES. */
export const SENTIMENT_SIGNALS_DERIVED: SentimentSignal[] = (() => {
  const buckets = new Map<string, { district: District; type: SentimentType; source: SentimentSource; mentions: number }>();
  for (const c of SEED_COMPLAINTS) {
    const type = sentimentTypeForDepartment(c.department);
    const source = sourceForId(c.id);
    const key = `${c.district}|${type}|${source}`;
    const b = buckets.get(key) ?? { district: c.district, type, source, mentions: 0 };
    b.mentions++;
    buckets.set(key, b);
  }
  return [...buckets.values()].map((b) => {
    const score = clampScore(districtScore(b.district) + TYPE_OFFSET[b.type]);
    return { district: b.district, source: b.source, type: b.type, score, mentions: b.mentions, trend: trendFor(score) };
  });
})();

// ── trending topics: real departments, real mention counts ──
const TOPIC_LABEL: Partial<Record<Department, string>> = {
  "שרותי ניקיון": "ניקיון וחצרות",
  "גנים ונוף": "גנים ונוף",
  "דרכים": "כבישים ומדרכות",
  "יחידת אחזקה": "רהוט רחוב ואחזקה",
  "מחלקת מיחזור": "מיחזור ופסולת",
  "איכות הסביבה": "רעש ואיכות סביבה",
  "תנועה": "הסדרי תנועה",
  'הנהלת אגף שפ"ע': "שפ״ע — כללי",
};

const SENTIMENT_TOPICS = DEPARTMENTS
  .map((dept, i) => {
    const mentions = COUNT_BY_DEPARTMENT[dept];
    const level = i < 3 ? "negative" : ("neutral" as const);
    return {
      topic: TOPIC_LABEL[dept] ?? dept,
      level: level as "negative" | "neutral" | "positive",
      mentions,
      trend: (i < 3 ? "up" : "flat") as "up" | "down" | "flat",
    };
  })
  .filter((t) => t.mentions > 0)
  .sort((a, b) => b.mentions - a.mentions);

// headline: worst area + its dominant department
function dominantDepartmentIn(district: District): Department {
  const counts = tally(DEPARTMENTS, (c) => c.department);
  for (const dept of DEPARTMENTS) counts[dept] = 0;
  for (const c of SEED_COMPLAINTS) if (c.district === district) counts[c.department]++;
  return DEPARTMENTS.reduce((a, b) => (counts[b] > counts[a] ? b : a), DEPARTMENTS[0]);
}

const WORST_ZONE = SENTIMENT_ZONES[0];
const WORST_TOPIC = TOPIC_LABEL[dominantDepartmentIn(WORST_ZONE.district)] ?? "ניקיון";

/** The full SENTIMENT insight, ready to export from data/cityIntel.ts. */
export const SENTIMENT_DERIVED: SentimentInsight = {
  zones: SENTIMENT_ZONES,
  topics: SENTIMENT_TOPICS,
  headline: `ריכוז פניות גבוה ב${WORST_ZONE.label} סביב ${WORST_TOPIC}`,
};

// ── convenience for the map + KPIs ──
export function openIncidentsIn(district: District): number {
  return COUNT_BY_DISTRICT[district];
}

export function riskLevelIn(district: District): "low" | "medium" | "high" {
  const s = districtScore(district);
  if (s <= -25) return "high";
  if (s <= -5) return "medium";
  return "low";
}
