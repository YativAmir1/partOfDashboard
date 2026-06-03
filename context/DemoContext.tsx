"use client";

import {
  createContext, useContext, useState, useCallback, useRef, useMemo, type ReactNode,
} from "react";
import type {
  ScenarioPhase, DetectionSource, ScenarioTimelineStep,
  DemoScenarioData, AIRecommendation, Task, KpiValues, Anomaly,
  CallDeflection, ReasoningStep,
} from "@/lib/types";
import { kpiBefore, kpiAfter } from "@/lib/data";

// ─── Scenario constants ───────────────────────────────────────────────────────

const ACTIVE_AREA = "Marom Nave";

const DETECTION_SOURCES: DetectionSource[] = [
  { source: "פניות  109 במערכת CRM", count: 18, change: "+42%" },
  { source: "חיישני פחים חכמים",    count: 7,  change: "מעל 85% תפוסה" },
  { source: "מצלמות וראייה ממוחשבת", count: 5,  change: "גלישה זוהתה" },
  { source: "GPS צוותי שטח",         count: 2,  change: "צוותים זמינים בקרבת מקום" },
];

const DEMO_RECOMMENDATION: AIRecommendation = {
  id: "REC-DEMO",
  priority: "critical",
  title: "הסטת צוותי שפ״ע למרום נווה",
  description:
    "מנוע הקורלציה זיהה 18 פניות תושבים ב-CRM, שבעה חיישני פחים מעל 85% תפוסה וחמש התרעות מצלמה על גלישת אשפה פעילה במרום נווה. הסטת צוותי שפ״ע מיידית תמנע חריגת SLA ותחזיר את רמת השירות בתוך ארבע שעות.",
  confidence: 91,
  estimatedImpact:
    "מניעת קנס משוער של ₪38,000. ירידה צפויה של 40% בפניות CRM תוך 24 שעות. שלוש פניות ייסגרו אוטומטית.",
  category: "waste",
  district: "Marom Nave",
};

const DEMO_TASK_BASE = {
  id: "TASK-DEMO",
  title: "שיגור צוותי שפ״ע W-3 ו-W-7 למרום נווה",
  assignee: "חמ״ל שפ״ע",
  priority: "critical" as const,
  status: "pending" as const,
  district: "Marom Nave" as const,
  aiGenerated: true,
  sourceType: "camera" as const,
  dataSource: "מצלמות CAM-001/002/003 + תלונות CRM (×3.4)",
  sourceCameraId: "CAM-001",
};

const REASONING_STEPS: ReasoningStep[] = [
  {
    step: 1,
    title: "איסוף אותות",
    detail: "נאספו 30 נקודות מידע מארבע מערכות עירוניות: 18 פניות CRM (+42%), שבעה חיישני פחים מעל 85%, חמש התרעות מצלמה על גלישה ושני רכבי שפ״ע במרחק עד 1.2 ק״מ.",
  },
  {
    step: 2,
    title: "קורלציה מרחבית",
    detail: "זוהה מקבץ גלישת אשפה במרום נווה ברדיוס 0.8 ק״מ. קצב פניות ה-CRM גבוה פי 3.1 מהבסיס השכונתי. חיישני הפחים מציגים 87-94% תפוסה וניתוח GIS מאשר פנייה פעילה.",
  },
  {
    step: 3,
    title: "המלצה נוצרה",
    detail: "רמת ודאות 91%: שיגור צוותי שפ״ע W-3 ו-W-7 למרום נווה. מניעת קנס רגולטורי של ₪38,000, ירידה צפויה של 40% בפניות CRM בתוך 24 שעות וחלון טיפול של כארבע שעות.",
  },
  {
    step: 4,
    title: "תחזית השפעה",
    detail: "תוצאות צפויות: זמן תגובה 38→24 דקות · עמידה ב-SLA מ-85% ל-93% · ציון מצב עירוני 74→88 · פניות פתוחות 47→29.",
  },
];

const CALL_DEFLECTION_BY_PHASE: Partial<Record<ScenarioPhase, CallDeflection>> = {
  citizen_updated: { total: 43, deflected: 29, human: 14, crmOpened: 3 },
  kpi_improving:   { total: 67, deflected: 48, human: 19, crmOpened: 5 },
  resolved:        { total: 89, deflected: 68, human: 21, crmOpened: 7 },
};

// Risk score per phase (0-100)
const RISK_BY_PHASE: Partial<Record<ScenarioPhase, number>> = {
  anomaly_detected:       67,
  ai_correlation:         89,
  recommendation_created: 89,
  task_dispatched:        89,
  citizen_updated:        78,
  kpi_improving:          54,
  resolved:               12,
};

const STATUS_LABELS: Record<ScenarioPhase, string> = {
  idle:                    "",
  anomaly_detected:        "זוהתה חריגה במרום נווה",
  ai_correlation:          "מנוע הקורלציה מנתח ארבעה מקורות מידע",
  recommendation_created:  "נוצרה המלצת בינה להסטת צוותי שפ״ע",
  task_dispatched:         "משימת שפ״ע שוגרה והרכבים בדרך",
  citizen_updated:         "מוקד 109 מפעיל מענה אוטומטי ומפחית עומס",
  kpi_improving:           "מדדי השירות משתפרים בעקבות ההתערבות",
  resolved:                "התרחיש הסתיים ומרום נווה התייצבה",
};

const PHASE_ORDER: ScenarioPhase[] = [
  "anomaly_detected",
  "ai_correlation",
  "recommendation_created",
  "task_dispatched",
  "citizen_updated",
  "kpi_improving",
  "resolved",
];

const TIMELINE_LABELS: Record<string, string> = {
  anomaly_detected:       "זיהוי חריגת אשפה במרום נווה",
  ai_correlation:         "קורלציה בין ארבעה מקורות מידע · סיכון 89",
  recommendation_created: "המלצת בינה: הסטת צוותי שפ״ע",
  task_dispatched:        "משימת שפ״ע שוגרה · רכבים בדרך",
  citizen_updated:        "מוקד 109 הפעיל מענה אוטומטי",
  kpi_improving:          "שיפור בששת מדדי השירות",
  resolved:               "התרחיש הסתיים · מרום נווה התייצבה",
};

// ─── Internal state (minimal — derived fields computed in useMemo) ────────────

interface InternalState {
  phase: ScenarioPhase;
  alertDismissed: boolean;
  aiRecommendation: AIRecommendation | null;
  generatedTask: Task | null;
  scenarioStartTime: string | null;
}

const INITIAL_STATE: InternalState = {
  phase: "idle",
  alertDismissed: false,
  aiRecommendation: null,
  generatedTask: null,
  scenarioStartTime: null,
};

// ─── Context interface ────────────────────────────────────────────────────────

interface DemoContextValue {
  scenario: DemoScenarioData;
  currentKpi: KpiValues;
  runScenario: () => void;
  resetScenario: () => void;
  dismissAlert: () => void;
  isScenarioRunning: boolean;
  isScenarioComplete: boolean;
}

const DemoContext = createContext<DemoContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InternalState>(INITIAL_STATE);
  const [currentKpi, setCurrentKpi] = useState<KpiValues>(kpiBefore);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const runScenario = useCallback(() => {
    clearTimers();
    setState({
      phase: "anomaly_detected",
      alertDismissed: false,
      aiRecommendation: null,
      generatedTask: null,
      scenarioStartTime: new Date().toISOString(),
    });
    setCurrentKpi(kpiBefore);

    const t = (ms: number, fn: () => void) => {
      const id = setTimeout(fn, ms);
      timersRef.current.push(id);
    };

    t(6000,  () => setState((s) => ({ ...s, phase: "ai_correlation" })));
    t(11000, () => setState((s) => ({
      ...s,
      phase: "recommendation_created",
      aiRecommendation: DEMO_RECOMMENDATION,
      generatedTask: { ...DEMO_TASK_BASE, createdAt: new Date().toISOString() },
    })));
    t(16000, () => setState((s) => ({ ...s, phase: "task_dispatched" })));
    t(22000, () => setState((s) => ({ ...s, phase: "citizen_updated" })));
    t(28000, () => setState((s) => ({ ...s, phase: "kpi_improving" })));

    // KPI animation: 20 steps × 1.5 s from t=28 s → t=58 s
    for (let i = 1; i <= 20; i++) {
      const frac = i / 20;
      t(28000 + i * 1500, () => {
        setCurrentKpi({
          healthScore:      Math.round(kpiBefore.healthScore      + (kpiAfter.healthScore      - kpiBefore.healthScore)      * frac),
          activeIncidents:  Math.round(kpiBefore.activeIncidents  + (kpiAfter.activeIncidents  - kpiBefore.activeIncidents)  * frac),
          avgResponseMin:   Math.round(kpiBefore.avgResponseMin   + (kpiAfter.avgResponseMin   - kpiBefore.avgResponseMin)   * frac),
          satisfactionPct:  Math.round(kpiBefore.satisfactionPct  + (kpiAfter.satisfactionPct  - kpiBefore.satisfactionPct)  * frac),
          openTickets:      Math.round(kpiBefore.openTickets      + (kpiAfter.openTickets      - kpiBefore.openTickets)      * frac),
          slaCompliancePct: Math.round(kpiBefore.slaCompliancePct + (kpiAfter.slaCompliancePct - kpiBefore.slaCompliancePct) * frac),
        });
      });
    }

    t(60000, () => setState((s) => ({ ...s, phase: "resolved" })));
  }, []);

  const resetScenario = useCallback(() => {
    clearTimers();
    setState(INITIAL_STATE);
    setCurrentKpi(kpiBefore);
  }, []);

  const dismissAlert = useCallback(() => {
    setState((s) => ({ ...s, alertDismissed: true }));
  }, []);

  // ─── Derive full DemoScenarioData from minimal state ───────────────────────

  const scenario = useMemo((): DemoScenarioData => {
    const { phase, alertDismissed, aiRecommendation, generatedTask, scenarioStartTime } = state;
    const phaseIndex = PHASE_ORDER.indexOf(phase); // -1 when idle

    const riskScore = RISK_BY_PHASE[phase] ?? null;
    const alertVisible = phase !== "idle" && phase !== "resolved" && !alertDismissed;

    const scenarioTimeline: ScenarioTimelineStep[] = PHASE_ORDER.map((p, i) => ({
      phase: p,
      label: TIMELINE_LABELS[p],
      done: phaseIndex >= i,
    }));

    const kpiImpact =
      phaseIndex >= PHASE_ORDER.indexOf("recommendation_created") ? kpiAfter : null;

    const liveAnomaly: Anomaly | null =
      phase !== "idle"
        ? {
            id: "ANOM-LIVE",
            timestamp: scenarioStartTime ?? new Date().toISOString(),
            type: "waste_overflow",
            district: "Marom Nave",
            description: `מקבץ גלישת אשפה במרום נווה: 18 פניות CRM בתוך ארבע שעות, שבעה חיישני פחים מעל 85% תפוסה וחמש התרעות מצלמה. ציון סיכון בינה: ${riskScore ?? 67}/100.`,
            severity: "high",
            resolved: phase === "resolved",
          }
        : null;

    const liveCallDeflection = CALL_DEFLECTION_BY_PHASE[phase] ?? null;

    const taskCurrentStatus: "pending" | "in_progress" | "done" | null =
      phase === "recommendation_created" ? "pending" :
      phase === "task_dispatched" ? "pending" :
      phase === "citizen_updated" || phase === "kpi_improving" ? "in_progress" :
      phase === "resolved" ? "done" : null;

    const stepsCount = phase === "idle" ? 0 : Math.min(phaseIndex + 1, 4);
    const reasoningChain: ReasoningStep[] | null = stepsCount > 0 ? REASONING_STEPS.slice(0, stepsCount) : null;

    return {
      phase,
      activeArea: phase !== "idle" ? ACTIVE_AREA : null,
      riskScore,
      detectionSources: phase !== "idle" ? DETECTION_SOURCES : [],
      activeAlert: {
        visible: alertVisible,
        text: alertVisible
          ? `התראת מערכת: מקבץ גלישת אשפה במרום נווה · 18 פניות CRM בארבע שעות · שבעה פחים חכמים מעל תפוסה · ציון סיכון בינה: ${riskScore ?? 67}`
          : "",
      },
      aiRecommendation,
      generatedTask,
      liveAnomaly,
      kpiImpact,
      scenarioTimeline,
      scenarioStatusLabel: STATUS_LABELS[phase],
      liveCallDeflection,
      taskCurrentStatus,
      reasoningChain,
    };
  }, [state]);

  const isScenarioRunning  = state.phase !== "idle" && state.phase !== "resolved";
  const isScenarioComplete = state.phase === "resolved";

  return (
    <DemoContext.Provider
      value={{ scenario, currentKpi, runScenario, resetScenario, dismissAlert, isScenarioRunning, isScenarioComplete }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemo() {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error("useDemo must be used within DemoProvider");
  return ctx;
}
