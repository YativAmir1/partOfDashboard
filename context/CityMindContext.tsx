"use client";

// ─── CityMind AI — cockpit state ─────────────────────────────────────────────
// Local React state only (no backend DB). Holds the action queue + lifecycle
// transitions, the selected action, what-if selection, a transient toast, and a
// per-action LLM generation cache that calls our secure /api/ai/generate route.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  ActionRecommendation,
  ActionStatus,
  LLMGenerationType,
} from "@/lib/citymind/types";
import { CITY_ACTIONS } from "@/data/cityActions";
import { DEMO_NOW } from "@/lib/commandCenter/sla";

export interface LLMEntry {
  status: "loading" | "streaming" | "done";
  content: string;
  fallback: boolean;
  provider?: string;
}

type LLMMap = Record<string, LLMEntry>;

interface CityMindValue {
  now: Date;
  actions: ActionRecommendation[];
  activeActions: ActionRecommendation[];
  selectedId: string | null;
  selected: ActionRecommendation | null;
  select: (id: string | null) => void;
  approve: (id: string) => void;
  verify: (id: string) => void;
  dismiss: (id: string) => void;
  changeTeam: (id: string, teamId: string, vehicleId?: string) => void;
  toast: string | null;
  whatIfId: string;
  setWhatIfId: (id: string) => void;
  llm: LLMMap;
  generate: (action: ActionRecommendation, type: LLMGenerationType) => Promise<void>;
}

const PRIORITY_RANK: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
const STATUS_RANK: Record<ActionStatus, number> = {
  recommended: 0,
  approved: 1,
  dispatched: 2,
  verified: 4,
  dismissed: 5,
};

export function llmKey(id: string, type: LLMGenerationType): string {
  return `${id}:${type}`;
}

const CityMindContext = createContext<CityMindValue | null>(null);

export function CityMindProvider({ children }: { children: React.ReactNode }) {
  const [actions, setActions] = useState<ActionRecommendation[]>(() =>
    CITY_ACTIONS.map((a) => ({ ...a })),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [whatIfId, setWhatIfId] = useState<string>("add-cleaning-team");
  const [llm, setLlm] = useState<LLMMap>({});
  const [now, setNow] = useState<Date>(() => new Date(DEMO_NOW));
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Live-ticking simulated clock (1s per second from the demo anchor).
  useEffect(() => {
    const t = setInterval(() => setNow((prev) => new Date(prev.getTime() + 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const setStatus = useCallback((id: string, status: ActionStatus) => {
    setActions((prev) => prev.map((a) => (a.id === id ? { ...a, status } : a)));
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3000);
  }, []);

  const approve = useCallback(
    (id: string) => {
      setStatus(id, "approved");
      showToast("הפעולה אושרה ונשלחה לצוות");
      // Simulate dispatch confirmation shortly after approval.
      setTimeout(() => {
        setActions((prev) =>
          prev.map((a) => (a.id === id && a.status === "approved" ? { ...a, status: "dispatched" } : a)),
        );
      }, 1500);
    },
    [setStatus, showToast],
  );

  const verify = useCallback(
    (id: string) => {
      setStatus(id, "verified");
      showToast("הטיפול אומת — הלולאה נסגרה");
    },
    [setStatus, showToast],
  );

  const dismiss = useCallback(
    (id: string) => {
      setStatus(id, "dismissed");
      setSelectedId((cur) => (cur === id ? null : cur));
      showToast("ההמלצה נדחתה");
    },
    [setStatus, showToast],
  );

  const changeTeam = useCallback((id: string, teamId: string, vehicleId?: string) => {
    setActions((prev) =>
      prev.map((a) =>
        a.id === id ? { ...a, suggestedTeamId: teamId, suggestedVehicleId: vehicleId } : a,
      ),
    );
  }, []);

  const generate = useCallback(
    async (action: ActionRecommendation, type: LLMGenerationType) => {
      const key = llmKey(action.id, type);
      setLlm((prev) => ({ ...prev, [key]: { status: "loading", content: "", fallback: false } }));
      try {
        const res = await fetch("/api/ai/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            action,
            context: { city: "רמת גן", domain: "שפ״ע ושירות לתושב", demoMode: true },
          }),
        });
        if (!res.body) throw new Error("no stream body");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let content = "";
        let fallback = false;
        let provider: string | undefined;

        // Parse the SSE frames (\n\n-delimited "data: {json}") and update live.
        const handle = (raw: string) => {
          const line = raw.trim();
          if (!line.startsWith("data:")) return;
          let ev: { type?: string; text?: string; content?: string; provider?: string; fallback?: boolean };
          try {
            ev = JSON.parse(line.slice(5).trim());
          } catch {
            return;
          }
          if (ev.type === "meta") {
            fallback = Boolean(ev.fallback);
            provider = ev.provider;
            setLlm((prev) => ({ ...prev, [key]: { status: "streaming", content, fallback, provider } }));
          } else if (ev.type === "delta") {
            content += ev.text ?? "";
            setLlm((prev) => ({ ...prev, [key]: { status: "streaming", content, fallback, provider } }));
          } else if (ev.type === "done") {
            if (ev.content) content = ev.content;
            setLlm((prev) => ({ ...prev, [key]: { status: "done", content, fallback, provider } }));
          }
        };

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buffer.indexOf("\n\n")) !== -1) {
            handle(buffer.slice(0, nl));
            buffer = buffer.slice(nl + 2);
          }
        }
        if (buffer.trim()) handle(buffer);

        // Ensure a terminal state even if no explicit "done" arrived.
        setLlm((prev) =>
          prev[key]?.status === "done"
            ? prev
            : { ...prev, [key]: { status: "done", content, fallback, provider } },
        );
      } catch {
        setLlm((prev) => ({
          ...prev,
          [key]: { status: "done", content: "לא ניתן להפיק נוסח כעת. נסו שוב.", fallback: true },
        }));
      }
    },
    [],
  );

  const activeActions = useMemo(
    () =>
      actions
        .filter((a) => a.status !== "dismissed")
        .sort(
          (a, b) =>
            STATUS_RANK[a.status] - STATUS_RANK[b.status] ||
            PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority],
        ),
    [actions],
  );

  const selected = useMemo(
    () => actions.find((a) => a.id === selectedId) ?? null,
    [actions, selectedId],
  );

  const value = useMemo<CityMindValue>(
    () => ({
      now,
      actions,
      activeActions,
      selectedId,
      selected,
      select: setSelectedId,
      approve,
      verify,
      dismiss,
      changeTeam,
      toast,
      whatIfId,
      setWhatIfId,
      llm,
      generate,
    }),
    [now, actions, activeActions, selectedId, selected, approve, verify, dismiss, changeTeam, toast, whatIfId, llm, generate],
  );

  return <CityMindContext.Provider value={value}>{children}</CityMindContext.Provider>;
}

export function useCityMind(): CityMindValue {
  const ctx = useContext(CityMindContext);
  if (!ctx) throw new Error("useCityMind must be used within CityMindProvider");
  return ctx;
}
