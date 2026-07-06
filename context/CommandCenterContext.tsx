"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { buildInitialCases } from "@/data/commandCases";
import { computeSla, derivePriority, DEMO_NOW, urgencyScore } from "@/lib/commandCenter/sla";
import { rankDispatchCandidates } from "@/lib/commandCenter/dispatch";
import {
  buildTreatmentPlan,
  detectRedLights,
  isHazard,
  triageSummary,
} from "@/lib/commandCenter/triage";
import type {
  CommandCase,
  DispatchCandidate,
  SlaState,
  TreatmentAction,
} from "@/lib/commandCenter/types";

export interface EnrichedCase extends CommandCase {
  sla: SlaState;
  hazard: boolean;
  candidates: DispatchCandidate[];
  actions: TreatmentAction[];
  summary: string;
  score: number;
}

export interface ActivityEntry {
  id: number;
  time: string;
  caseId: string;
  text: string;
  autonomous: boolean;
}

interface CommandCenterValue {
  now: Date;
  cases: EnrichedCase[];
  activeCases: EnrichedCase[];
  recycleBin: EnrichedCase[];
  activity: ActivityEntry[];
  stats: {
    total: number;
    redLights: number;
    breached: number;
    dispatched: number;
    resolved: number;
    autonomousActions: number;
  };
  selectedId: string | null;
  select: (id: string | null) => void;
  dispatch: (caseId: string, teamId: string) => void;
  advance: (caseId: string) => void;
  resolve: (caseId: string) => void;
  runAction: (caseId: string, action: TreatmentAction) => void;
}

const Ctx = createContext<CommandCenterValue | null>(null);

const RECYCLE_DAYS = 7;

export function CommandCenterProvider({ children }: { children: ReactNode }) {
  const [baseCases, setBaseCases] = useState<CommandCase[]>(() => buildInitialCases());
  const [now, setNow] = useState<Date>(DEMO_NOW);
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activityId = useRef(0);

  // Live demo clock — ticks forward from DEMO_NOW so SLA clocks move.
  useEffect(() => {
    const t = setInterval(() => {
      setNow((prev) => new Date(prev.getTime() + 1000));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  function log(caseId: string, text: string, autonomous: boolean, when: Date) {
    activityId.current += 1;
    const time = when.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
    setActivity((prev) => [
      { id: activityId.current, time, caseId, text, autonomous },
      ...prev,
    ].slice(0, 40));
  }

  const dispatch = (caseId: string, teamId: string) => {
    const candidate = rankDispatchCandidates(baseCases.find((c) => c.id === caseId)!).find(
      (t) => t.teamId === teamId,
    );
    setBaseCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? {
              ...c,
              stage: "dispatched",
              dispatchedTeamId: teamId,
              dispatchedAt: now.toISOString(),
              crmStatus: "הועבר לאפליקציית שטח",
              fieldStatus: "הועבר לטיפול עובד שטח",
            }
          : c,
      ),
    );
    log(caseId, `שוגר ${candidate?.teamName ?? "צוות"} (${candidate?.etaMinutes ?? "?"} ד׳)`, true, now);
  };

  const advance = (caseId: string) => {
    setBaseCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;
        if (c.stage === "dispatched") {
          log(caseId, "הצוות הגיע לשטח — בטיפול", true, now);
          return { ...c, stage: "in_field", fieldStatus: "בטיפול עובד שטח" };
        }
        return c;
      }),
    );
  };

  const resolve = (caseId: string) => {
    setBaseCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? {
              ...c,
              stage: "resolved",
              crmStatus: "טופל",
              fieldStatus: "טופל בשטח",
              resolvedAt: now.toISOString(),
              verification: c.verification ?? {
                method: "אימות מצלמה + דיווח צוות",
                note: "המפגע אינו מופיע עוד בצילום",
                confirmed: true,
              },
            }
          : c,
      ),
    );
    log(caseId, "טופל ואומת — הלולאה נסגרה", true, now);
  };

  const runAction = (caseId: string, action: TreatmentAction) => {
    if (action.kind === "dispatch") {
      const best = rankDispatchCandidates(baseCases.find((c) => c.id === caseId)!).find((t) => t.available);
      if (best) dispatch(caseId, best.teamId);
      return;
    }
    log(caseId, action.label, action.autonomous, now);
  };

  // ─── Live enrichment ───────────────────────────────────────────────────────
  const enriched = useMemo<EnrichedCase[]>(() => {
    return baseCases.map((c) => {
      const sla = computeSla(c, now);
      const redLights = detectRedLights(c, sla);
      const hazard = isHazard(c);
      const priority = derivePriority(sla.tier, hazard);
      const withFlags: CommandCase = { ...c, redLights, priority };
      return {
        ...withFlags,
        sla,
        hazard,
        candidates: rankDispatchCandidates(withFlags),
        actions: buildTreatmentPlan(withFlags, sla),
        summary: triageSummary(withFlags, sla),
        score: urgencyScore(withFlags, sla),
      };
    });
  }, [baseCases, now]);

  const activeCases = useMemo(
    () => enriched.filter((c) => c.stage !== "resolved").sort((a, b) => b.score - a.score),
    [enriched],
  );

  const recycleBin = useMemo(
    () =>
      enriched
        .filter((c) => c.stage === "resolved" && c.resolvedAt)
        .filter((c) => {
          const days = (now.getTime() - new Date(c.resolvedAt!).getTime()) / 86_400_000;
          return days <= RECYCLE_DAYS;
        })
        .sort((a, b) => +new Date(b.resolvedAt!) - +new Date(a.resolvedAt!)),
    [enriched, now],
  );

  const stats = useMemo(() => {
    return {
      total: activeCases.length,
      redLights: activeCases.filter((c) => c.redLights.length > 0).length,
      breached: activeCases.filter((c) => c.sla.tier === "action" || c.sla.tier === "critical").length,
      dispatched: enriched.filter((c) => c.stage === "dispatched" || c.stage === "in_field").length,
      resolved: recycleBin.length,
      autonomousActions: activity.filter((a) => a.autonomous).length,
    };
  }, [activeCases, enriched, recycleBin, activity]);

  const value: CommandCenterValue = {
    now,
    cases: enriched,
    activeCases,
    recycleBin,
    activity,
    stats,
    selectedId,
    select: setSelectedId,
    dispatch,
    advance,
    resolve,
    runAction,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCommandCenter(): CommandCenterValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCommandCenter must be used within CommandCenterProvider");
  return v;
}
