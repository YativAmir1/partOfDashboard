"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import {
  Bot,
  CheckCircle2,
  Clock,
  Navigation,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
  X,
} from "lucide-react";
import { useCityMind } from "@/context/CityMindContext";
import { DEMO_NOW } from "@/lib/commandCenter/sla";
import { ACTION_KIND_LABEL, PRIORITY_META, SLA_TIER_META, SOURCE_LABEL } from "@/lib/citymind/labels";
import { allTeams, findTeam, findVehicle } from "@/lib/citymind/lookup";
import { districtLabel } from "@/lib/hebrew";
import { CityLifecycleStepper } from "./CityLifecycleStepper";
import { ProofOfService } from "./ProofOfService";
import { LLMActionPanel } from "./LLMActionPanel";

function pad(n: number) {
  return String(n).padStart(2, "0");
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function ActionDetailsDrawer() {
  const { selected, select, approve, verify, changeTeam, now } = useCityMind();
  const [reassign, setReassign] = useState(false);
  const asideRef = useRef<HTMLElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const selectedId = selected?.id ?? null;

  const close = useCallback(() => {
    setReassign(false);
    select(null);
  }, [select]);

  // Modal a11y: focus the panel on open, trap Tab inside, Escape closes,
  // and focus is restored to the trigger on close.
  useEffect(() => {
    if (!selectedId) return;
    const node = asideRef.current;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;

    const focusables = () =>
      Array.from(node?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? []).filter(
        (el) => el.offsetParent !== null,
      );
    (focusables()[0] ?? node)?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key === "Tab" && node) {
        const items = focusables();
        if (items.length === 0) {
          e.preventDefault();
          node.focus();
          return;
        }
        const first = items[0];
        const last = items[items.length - 1];
        const activeEl = document.activeElement;
        if (e.shiftKey && (activeEl === first || activeEl === node)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && activeEl === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      restoreFocusRef.current?.focus?.();
    };
  }, [selectedId, close]);

  if (!selected) return null;
  const a = selected;
  const prio = PRIORITY_META[a.priority];
  const sla = SLA_TIER_META[a.slaRisk.tier];
  const team = findTeam(a.suggestedTeamId);
  const vehicle = findVehicle(a.suggestedVehicleId);

  const deadline =
    a.slaRisk.minutesToBreach != null
      ? new Date(DEMO_NOW.getTime() + a.slaRisk.minutesToBreach * 60000)
      : null;
  const remMs = deadline ? deadline.getTime() - now.getTime() : null;
  const overdue = remMs != null && remMs < 0;
  let clock = "";
  if (remMs != null) {
    const t = Math.floor(Math.abs(remMs) / 1000);
    clock = `${pad(Math.floor(t / 3600))}:${pad(Math.floor((t % 3600) / 60))}:${pad(t % 60)}`;
  }

  return (
    <>
      <div
        className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
        onClick={close}
        aria-hidden="true"
      />
      <aside
        ref={asideRef}
        dir="rtl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="citymind-drawer-title"
        tabIndex={-1}
        className="fixed inset-y-0 left-0 z-[75] flex w-full max-w-[560px] flex-col border-l border-[#1e293b] bg-[#0b1220] shadow-2xl shadow-black/50 outline-none"
        style={{ animation: "hazard-slide-in 0.28s ease-out" }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#1e293b] bg-[#0f1729] px-4 py-3.5">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className="rounded-md px-2 py-0.5 text-[11px] font-bold" style={{ color: prio.color, background: prio.bg }}>
                {prio.label}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-400">
                <Bot size={12} className="text-[#0ea5b7]" /> ביטחון{" "}
                <span className="font-bold text-[#4ade80]">{a.aiConfidence}%</span>
              </span>
            </div>
            <h2 id="citymind-drawer-title" className="text-lg font-bold leading-tight text-white">
              {a.title}
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-500">
              {ACTION_KIND_LABEL[a.kind]} · {districtLabel(a.district)}
            </p>
          </div>
          <button
            onClick={close}
            aria-label="סגור פרטי פעולה"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#1e293b] text-slate-400 transition-colors hover:bg-[#16223c] hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
          {/* Lifecycle */}
          <Section title="שרשרת טיפול סגורה">
            <CityLifecycleStepper status={a.status} />
          </Section>

          {/* SLA countdown */}
          {deadline && (
            <div
              className="flex items-center justify-between rounded-xl border p-3"
              style={{ borderColor: `${sla.color}44`, background: sla.bg }}
            >
              <div className="flex items-center gap-2">
                <Clock size={20} style={{ color: sla.color }} />
                <div>
                  <p className="text-sm font-bold" style={{ color: sla.color }}>
                    {overdue ? "חריגת SLA" : "ספירה לפעולה"}
                  </p>
                  <p className="text-[11px] text-slate-400">{a.slaRisk.label}</p>
                </div>
              </div>
              <span className="font-mono text-2xl font-bold tabular-nums" style={{ color: sla.color }}>
                {clock}
              </span>
            </div>
          )}

          {/* Recommendation */}
          <Section title="המלצת המערכת">
            <div className="space-y-2 text-[13px]">
              <Row icon={Sparkles} label="פעולה מוצעת" value={a.recommendedAction} />
              <Row icon={CheckCircle2} label="השפעה צפויה" value={a.expectedImpact} highlight />
            </div>
          </Section>

          {/* Source signals */}
          <Section title="אותות מקור (אינטגרציית מערכות)">
            <div className="flex flex-wrap gap-1.5">
              {a.sources.map((s) => (
                <span key={s} className="rounded-md border border-[#1e293b] bg-[#0f1729] px-2 py-1 text-[11px] text-slate-300">
                  {SOURCE_LABEL[s]}
                </span>
              ))}
            </div>
          </Section>

          {/* AI reasoning */}
          <Section title="נימוק ה-AI">
            <ul className="space-y-1.5">
              {a.reasoningBullets.map((b, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] leading-relaxed text-slate-300">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0ea5b7]" />
                  {b}
                </li>
              ))}
            </ul>
          </Section>

          {/* Team / vehicle */}
          <Section
            title="שיגור צוות"
            right={
              a.status === "recommended" ? (
                <button
                  onClick={() => setReassign((v) => !v)}
                  className="text-[11px] font-medium text-[#0ea5b7] hover:underline"
                >
                  שנה צוות
                </button>
              ) : undefined
            }
          >
            <div className="space-y-2 text-[13px]">
              <Row icon={Users} label="צוות מוצע" value={team ? `${team.name} · ${team.subType}` : "—"} />
              {vehicle && <Row icon={Truck} label="רכב" value={`${vehicle.label} · ${vehicle.plateNumber}`} />}
              {a.etaMinutes != null && <Row icon={Navigation} label="הגעה משוערת" value={`~${a.etaMinutes} דק׳`} />}
            </div>

            {reassign && (
              <div className="mt-3 max-h-52 space-y-1.5 overflow-y-auto rounded-lg border border-[#1e293b] bg-[#0f1729] p-2">
                {allTeams().map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      changeTeam(a.id, t.id, t.vehicleId);
                      setReassign(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-right text-[12px] transition-colors hover:bg-[#16223c] ${
                      t.id === a.suggestedTeamId ? "text-[#0ea5b7]" : "text-slate-200"
                    }`}
                  >
                    <span>{t.name}</span>
                    <span className="text-[10px] text-slate-500">{t.subType}</span>
                  </button>
                ))}
              </div>
            )}
          </Section>

          {/* Proof of service */}
          <Section title="הוכחת טיפול">
            <ProofOfService action={a} />
          </Section>

          {/* LLM layer */}
          <Section title="שכבת LLM תפעולית">
            <p className="mb-2 text-[11px] leading-relaxed text-slate-500">
              ה-AI התפעולי זיהה וממליץ; ה-LLM מסביר, מנסח ומנגיש את ההחלטה.
            </p>
            <LLMActionPanel action={a} />
          </Section>
        </div>

        {/* Footer action */}
        <div className="shrink-0 border-t border-[#1e293b] bg-[#0f1729] p-3">
          {a.status === "recommended" && (
            <button
              onClick={() => approve(a.id)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0ea5b7] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0c8f9e]"
            >
              <CheckCircle2 size={18} /> אשר פעולה ושגר צוות
            </button>
          )}
          {(a.status === "approved" || a.status === "dispatched") && (
            <button
              onClick={() => verify(a.id)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#16a34a] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#15803d]"
            >
              <ShieldCheck size={18} /> אמת סגירה וסגור לולאה
            </button>
          )}
          {a.status === "verified" && (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-[#16a34a]/40 bg-[#16a34a]/12 px-4 py-3 text-sm font-bold text-[#4ade80]">
              <CheckCircle2 size={18} /> הטיפול אומת — הלולאה נסגרה
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function Section({ title, right, children }: { title: string; right?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
        {right}
      </div>
      {children}
    </section>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={14} className="mt-0.5 shrink-0 text-slate-500" />
      <div>
        <span className="text-slate-500">{label}: </span>
        <span className={highlight ? "font-medium text-[#4ade80]" : "text-slate-200"}>{value}</span>
      </div>
    </div>
  );
}
