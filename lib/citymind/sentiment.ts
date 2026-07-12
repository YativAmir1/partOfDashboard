// ─── CityMind AI — sentiment aggregation ─────────────────────────────────────
// Turns granular SENTIMENT_SIGNALS into the radar (by district) + topic chips
// (by subject), honoring the active מקור (source) / סוג (type) filters. Pure and
// deterministic — the panel just renders whatever this returns.
import type { District } from "@/lib/types";
import { districtLabel } from "@/lib/hebrew";
import type {
  SentimentLevel,
  SentimentSignal,
  SentimentSource,
  SentimentTopic,
  SentimentType,
  ZoneSentiment,
} from "./types";
import { SENTIMENT_TYPE_LABEL } from "./labels";

/** Fixed radar axes — always the same 8 districts so the web keeps a stable shape. */
const DISTRICT_ORDER: District[] = [
  "Marom Nave",
  "National Park",
  "Tel Hashomer",
  "Industrial Zone",
  "Bursa District",
  "Ramat Chen",
  "City Center",
  "Shikun Vatikim",
];

const TYPE_ORDER = Object.keys(SENTIMENT_TYPE_LABEL) as SentimentType[];

export type SourceFilter = SentimentSource | "all";
export type TypeFilter = SentimentType | "all";

export interface SentimentView {
  zones: ZoneSentiment[];
  topics: SentimentTopic[];
  totalMentions: number;
}

function levelFromScore(score: number): SentimentLevel {
  if (score <= -22) return "negative";
  if (score >= 15) return "positive";
  return "neutral";
}

/** Mentions-weighted average score, rounded (0 when there are no mentions). */
function weightedScore(rows: SentimentSignal[]): number {
  const m = rows.reduce((a, s) => a + s.mentions, 0);
  if (!m) return 0;
  return Math.round(rows.reduce((a, s) => a + s.score * s.mentions, 0) / m);
}

/** Dominant trend across rows, weighted by mentions. */
function weightedTrend(rows: SentimentSignal[]): "up" | "down" | "flat" {
  const m = rows.reduce((a, s) => a + s.mentions, 0);
  if (!m) return "flat";
  const dir = { up: 1, down: -1, flat: 0 } as const;
  const v = rows.reduce((a, s) => a + dir[s.trend] * s.mentions, 0) / m;
  if (v > 0.15) return "up";
  if (v < -0.15) return "down";
  return "flat";
}

export function aggregateSentiment(
  signals: SentimentSignal[],
  source: SourceFilter,
  type: TypeFilter,
): SentimentView {
  const filtered = signals.filter(
    (s) => (source === "all" || s.source === source) && (type === "all" || s.type === type),
  );

  const zones: ZoneSentiment[] = DISTRICT_ORDER.map((d) => {
    const rows = filtered.filter((s) => s.district === d);
    const score = weightedScore(rows);
    return { district: d, label: districtLabel(d), score, level: levelFromScore(score) };
  });

  const activeTypes = type === "all" ? TYPE_ORDER : [type];
  const topics: SentimentTopic[] = activeTypes
    .map((t) => {
      const rows = filtered.filter((s) => s.type === t);
      const mentions = rows.reduce((a, s) => a + s.mentions, 0);
      return {
        topic: SENTIMENT_TYPE_LABEL[t],
        level: levelFromScore(weightedScore(rows)),
        mentions,
        trend: weightedTrend(rows),
      };
    })
    .filter((x) => x.mentions > 0)
    .sort((a, b) => b.mentions - a.mentions);

  const totalMentions = filtered.reduce((a, s) => a + s.mentions, 0);
  return { zones, topics, totalMentions };
}
