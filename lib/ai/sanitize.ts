// ─── CityMind AI — PII firewall ──────────────────────────────────────────────
// Build the minimal, area-level payload sent to the LLM. Drops caller name/phone,
// exact coords, internal ids and proof-of-service; resolves team id → team TYPE
// (never a supervisor's name) and district → Hebrew area label. Nothing personally
// identifying leaves the server.
import type {
  ActionLLMPayload,
  ActionRecommendation,
  CityActionSummary,
  CitySnapshot,
} from "@/lib/citymind/types";
import { DISTRICT_LABELS } from "@/lib/hebrew";
import { EMPLOYEES_DATA } from "@/data/employeesData";
import { KPIS, RED_LIGHTS, SENTIMENT } from "@/data/cityIntel";

function teamType(teamId?: string): string | undefined {
  if (!teamId) return undefined;
  for (const dept of EMPLOYEES_DATA) {
    const team = dept.teams.find((t) => t.id === teamId);
    if (team) return team.subType || team.name;
  }
  return undefined;
}

export function toLLMPayload(a: ActionRecommendation): ActionLLMPayload {
  return {
    title: a.title,
    kind: a.kind,
    district: DISTRICT_LABELS[a.district] ?? a.district,
    priority: a.priority,
    aiConfidence: a.aiConfidence,
    reason: a.reason,
    reasoningBullets: a.reasoningBullets ?? [],
    recommendedAction: a.recommendedAction,
    expectedImpact: a.expectedImpact,
    slaRisk: a.slaRisk,
    sources: a.sources ?? [],
    suggestedTeamType: teamType(a.suggestedTeamId),
    etaMinutes: a.etaMinutes,
  };
}

/** Area-level summary of one action for city-wide prompts (drops proof/coords/ids). */
function toCityActionSummary(a: ActionRecommendation): CityActionSummary {
  return {
    title: a.title,
    district: DISTRICT_LABELS[a.district] ?? a.district,
    priority: a.priority,
    status: a.status,
    aiConfidence: a.aiConfidence,
    reason: a.reason,
    slaTier: a.slaRisk.tier,
    slaLabel: a.slaRisk.label,
  };
}

/**
 * Assemble the PII-free operational snapshot for briefing / Q&A. `liveActions`
 * come from the client (so approvals/dismissals are reflected) but are re-mapped
 * here to the minimal area-level shape; red-lights, KPIs and sentiment are read
 * from server-side data and never trusted from the client.
 */
export function buildCitySnapshot(liveActions: ActionRecommendation[]): CitySnapshot {
  return {
    actions: liveActions.filter((a) => a.status !== "dismissed").map(toCityActionSummary),
    redLights: RED_LIGHTS.map((r) => ({
      title: r.title,
      district: DISTRICT_LABELS[r.district] ?? r.district,
      severity: r.severity,
      minutesToBreach: r.minutesToBreach,
    })),
    kpis: KPIS.map((k) => ({ label: k.label, value: k.value, delta: k.delta })),
    sentiment: {
      headline: SENTIMENT.headline,
      worstZones: [...SENTIMENT.zones]
        .sort((a, b) => a.score - b.score)
        .slice(0, 4)
        .map((z) => ({ label: z.label, score: z.score })),
      topTopics: [...SENTIMENT.topics]
        .sort((a, b) => b.mentions - a.mentions)
        .slice(0, 4)
        .map((t) => ({ topic: t.topic, mentions: t.mentions, trend: t.trend })),
    },
  };
}
