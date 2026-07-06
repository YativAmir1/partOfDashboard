"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  ArrowRight,
  MapPin,
  Phone,
  Bot,
  Truck,
  Users,
  Clock,
  Navigation,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  Camera,
  Radio,
  AlertTriangle,
} from "lucide-react";
import { useCommandCenter } from "@/context/CommandCenterContext";
import { VEHICLES_DATA } from "@/data/vehiclesData";
import { VEHICLE_TYPE_EMOJI } from "@/lib/fleetUtils";
import { fmtDistance } from "@/lib/commandCenter/dispatch";
import { aiConfidence, suggestedAction, RED_LIGHT_META } from "@/lib/commandCenter/triage";
import { TIER_META } from "@/lib/commandCenter/sla";
import { LifecycleStepper } from "./LifecycleStepper";

const CockpitMap = dynamic(() => import("./CockpitMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-[#0b1220]" />,
});

function fmtClock(remainingHours: number) {
  const total = Math.round(Math.abs(remainingHours) * 3600);
  const hh = Math.floor(total / 3600);
  const mm = Math.floor((total % 3600) / 60);
  const ss = total % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return { hh: p(hh), mm: p(mm), ss: p(ss), overdue: remainingHours < 0 };
}

export function IncidentCockpit() {
  const { cases, selectedId, select, dispatch, advance, resolve } = useCommandCenter();
  const c = cases.find((x) => x.id === selectedId);
  const [progress, setProgress] = useState(0);
  const [reassign, setReassign] = useState(false);
  const [showReasoning, setShowReasoning] = useState(false);

  // Animate the vehicle toward the incident while dispatched.
  useEffect(() => {
    if (!c) return;
    if (c.stage === "in_field" || c.stage === "resolved") {
      setProgress(1);
      return;
    }
    if (c.stage !== "dispatched") {
      setProgress(0);
      return;
    }
    const start = performance.now();
    const dur = 16000;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(0.94, (t - start) / dur);
      setProgress(p);
      if (p < 0.94) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [c?.stage, c?.id]);

  if (!c) return null;

  const meta = TIER_META[c.sla.tier];
  const clock = fmtClock(c.sla.remainingHours);
  const countColor = clock.overdue ? "#ef4444" : c.sla.tier === "action" ? "#f59e0b" : c.sla.tier === "warning" ? "#eab308" : "#0ea5b7";
  const confidence = aiConfidence(c);

  // Recommended / dispatched team + its vehicle (Itoran GPS).
  const recommended = c.candidates.find((t) => t.available) ?? c.candidates[0];
  const chosen = c.dispatchedTeamId ? c.candidates.find((t) => t.teamId === c.dispatchedTeamId) ?? recommended : recommended;
  const vehicle = chosen?.vehicleId ? VEHICLES_DATA.find((v) => v.id === chosen.vehicleId) : undefined;
  const vehicleStart: [number, number] = vehicle?.gps ? [vehicle.gps.lat, vehicle.gps.lng] : [c.coords[0] + 0.012, c.coords[1] - 0.014];
  const vehicleEmoji = vehicle ? VEHICLE_TYPE_EMOJI[vehicle.type] : "🚛";
  const isDispatched = c.stage === "dispatched" || c.stage === "in_field" || c.stage === "resolved";

  const dispatchedTime = c.dispatchedAt ? new Date(c.dispatchedAt) : null;
  const etaTime = dispatchedTime ? new Date(dispatchedTime.getTime() + (chosen?.etaMinutes ?? 15) * 60000) : null;
  const fmtTime = (d: Date | null) => (d ? d.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }) : "—");

  return (
    <div dir="rtl" className="-m-6 min-h-[calc(100vh-56px)] bg-[#0b1220] p-5 text-slate-200">
      {/* Top bar */}
      <div className="mb-4 flex items-center gap-4">
        <button
          onClick={() => select(null)}
          className="flex items-center gap-1.5 rounded-lg border border-[#1e293b] bg-[#0f1729] px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-[#16223c]"
        >
          <ArrowRight size={16} /> חזרה לתור
        </button>
        <div className="flex items-center gap-2">
          <Radio size={20} className="text-[#0ea5b7]" />
          <div>
            <h1 className="text-lg font-bold text-white">מרכז שליטה · טיפול באירוע</h1>
            <p className="text-[11px] text-slate-400">פנייה {c.requestNumber} · {c.deptLabel}</p>
          </div>
        </div>
      </div>

      {/* Lifecycle stepper */}
      <div className="mb-4 rounded-2xl border border-[#1e293b] bg-[#0f1729] px-8 py-4">
        <LifecycleStepper stage={c.stage} dark />
      </div>

      {/* 3-column cockpit */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)_minmax(0,1fr)]">
        {/* ─── Column 1: Source ─── */}
        <section className="rounded-2xl border border-[#1e293b] bg-[#0f1729] p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-white">
              {c.source === "camera" ? <Camera size={15} className="text-[#a78bfa]" /> : <Users size={15} className="text-[#0ea5b7]" />}
              {c.source === "camera" ? "זיהוי מצלמה (מקור)" : "פניית תושב (מקור)"}
            </h2>
            <span className="rounded bg-[#1e293b] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-300">
              {c.crmStatus}
            </span>
          </div>

          <p className="text-[11px] text-slate-400">מספר פנייה</p>
          <p className="mb-3 font-mono text-sm font-semibold text-[#0ea5b7]">#{c.requestNumber}</p>

          {/* Media placeholder */}
          <div className="relative mb-3 flex h-40 items-center justify-center overflow-hidden rounded-xl border border-[#1e293b] bg-gradient-to-br from-[#16223c] to-[#0b1220]">
            <div className="text-center">
              {c.hazard ? <AlertTriangle size={30} className="mx-auto text-[#ef4444]" /> : <Camera size={30} className="mx-auto text-slate-500" />}
              <p className="mt-1 text-[11px] text-slate-500">תיעוד מצורף לפנייה</p>
            </div>
            <span className="absolute bottom-2 left-2 rounded bg-black/50 px-1.5 py-0.5 text-[10px] text-slate-300">1 / 2</span>
          </div>

          <dl className="space-y-2.5 text-xs">
            <Row icon={MapPin} label="מיקום" value={`${c.street} ${c.houseNumber !== "0" ? c.houseNumber : ""} · ${c.district}`} />
            <Row icon={Phone} label="ערוץ" value={c.source === "camera" ? "מצלמת עיר" : "מוקד 106 / אפליקציה"} />
            <Row icon={Sparkles} label="סוג פנייה" value={c.subject} />
            <Row icon={Users} label="דווח על ידי" value={`${c.caller}${c.callerPhone ? " · " + c.callerPhone : ""}`} />
            <Row icon={Clock} label="נפתח" value={new Date(c.createdAt).toLocaleString("he-IL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })} />
          </dl>

          <blockquote className="mt-3 rounded-xl border border-[#1e293b] bg-[#0b1220] p-3 text-xs leading-relaxed text-slate-300">
            “{c.description}”
          </blockquote>

          {c.redLights.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {c.redLights.map((r) => (
                <div key={r} className="flex items-start gap-2 rounded-lg border border-[#7f1d1d]/40 bg-[#7f1d1d]/15 px-2.5 py-1.5">
                  <AlertTriangle size={13} className="mt-0.5 shrink-0 text-[#f87171]" />
                  <div>
                    <p className="text-[11px] font-semibold text-[#f87171]">{RED_LIGHT_META[r].label}</p>
                    <p className="text-[10px] text-[#fca5a5]">{RED_LIGHT_META[r].explain}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ─── Column 2: SLA + AI Recommendation ─── */}
        <section className="space-y-4">
          {/* SLA countdown */}
          <div className="flex items-center justify-between rounded-2xl border p-4" style={{ borderColor: `${countColor}44`, background: `${countColor}12` }}>
            <div className="flex items-center gap-2">
              <Clock size={22} style={{ color: countColor }} />
              <div>
                <p className="text-sm font-bold" style={{ color: countColor }}>
                  {clock.overdue ? "חריגת SLA" : "ספירה לטיפול"}
                </p>
                <p className="text-[11px] text-slate-400">{meta.label}</p>
              </div>
            </div>
            <div className="flex items-center gap-1 font-mono text-3xl font-bold tabular-nums" style={{ color: countColor }}>
              <TimeBox v={clock.hh} l="שע׳" /> :
              <TimeBox v={clock.mm} l="דק׳" /> :
              <TimeBox v={clock.ss} l="שנ׳" />
            </div>
            <div className="text-left">
              <p className="text-[10px] text-slate-500">יעד</p>
              <p className="font-mono text-sm text-slate-300">{String(c.slaTargetHours).padStart(2, "0")}:00 שע׳</p>
            </div>
          </div>

          {/* AI Recommendation */}
          <div className="rounded-2xl border border-[#1e293b] bg-[#0f1729] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-sm font-bold text-white">
                <Bot size={16} className="text-[#0ea5b7]" /> המלצת בינה מלאכותית
              </h2>
              <span className="rounded-full bg-[#0ea5b7]/15 px-2 py-0.5 text-[10px] font-semibold text-[#0ea5b7]">ביטחון גבוה</span>
            </div>
            <p className="mb-3 text-xs text-slate-400">ה-AI ממליץ לשגר את הצוות והרכב הבאים לטיפול באירוע.</p>

            <div className="space-y-3">
              <RecoRow icon={Users} label="צוות מוקצה">
                <span className="font-semibold text-white">{chosen?.teamName ?? "—"}</span>
                <span className="mr-2 rounded bg-[#16223c] px-1.5 py-0.5 text-[10px] text-slate-300">ראש צוות: {chosen?.supervisor ?? "—"}</span>
              </RecoRow>
              <RecoRow icon={Truck} label="רכב">
                <span className="font-semibold text-white">{vehicle?.plateNumber ?? "—"}</span>
                <span className="mr-1 text-slate-400">· {chosen?.vehicleLabel ?? "ללא רכב"}</span>
                {chosen?.available && <span className="mr-2 rounded bg-[#16a34a]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[#4ade80]">זמין</span>}
              </RecoRow>
              <RecoRow icon={Navigation} label="הגעה משוערת">
                <span className="font-semibold text-[#0ea5b7]">~{chosen?.etaMinutes ?? "?"} דק׳ {etaTime ? `(${fmtTime(etaTime)})` : ""}</span>
                <span className="mr-2 text-[11px] text-slate-400">מרחק {fmtDistance(chosen?.distanceMeters ?? 99999)} · לפי איתורן</span>
              </RecoRow>
              <RecoRow icon={Sparkles} label="פעולה מוצעת">
                <span className="text-slate-200">{suggestedAction(c)}</span>
              </RecoRow>
              <RecoRow icon={CheckCircle2} label="רמת ביטחון">
                <span className="font-bold text-[#4ade80]">{confidence}%</span>
                <span className="mr-2 inline-flex h-1.5 w-28 overflow-hidden rounded-full bg-[#16223c] align-middle">
                  <span className="h-full rounded-full bg-[#4ade80]" style={{ width: `${confidence}%` }} />
                </span>
              </RecoRow>
              <RecoRow icon={AlertTriangle} label="עדיפות">
                <span className={`rounded px-2 py-0.5 text-[11px] font-bold ${c.priority === "critical" ? "bg-[#ef4444]/20 text-[#f87171]" : c.priority === "high" ? "bg-[#f59e0b]/20 text-[#fbbf24]" : "bg-[#334155] text-slate-300"}`}>
                  {c.priority === "critical" ? "קריטי" : c.priority === "high" ? "גבוה" : c.priority === "medium" ? "בינוני" : "נמוך"}
                </span>
                {c.hazard && <span className="mr-2 text-[11px] text-slate-400">השפעת בריאות/בטיחות הציבור</span>}
              </RecoRow>
            </div>

            {/* Stage-based action */}
            <div className="mt-4">
              {(c.stage === "detected" || c.stage === "triaged") && !reassign && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => recommended && dispatch(c.id, recommended.teamId)}
                    disabled={!recommended?.available}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#0ea5b7] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#0c8f9e] disabled:bg-[#334155] disabled:text-slate-500"
                  >
                    <CheckCircle2 size={18} /> אשר ושגר
                  </button>
                  <button
                    onClick={() => setReassign(true)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-[#334155] bg-[#0b1220] px-4 py-3 text-sm font-semibold text-slate-200 transition-colors hover:bg-[#16223c]"
                  >
                    <Users size={16} /> בחר צוות אחר
                  </button>
                </div>
              )}

              {(c.stage === "detected" || c.stage === "triaged") && reassign && (
                <div className="space-y-2">
                  {c.candidates.slice(0, 4).map((t, i) => (
                    <div key={t.teamId} className="flex items-center justify-between rounded-lg border border-[#1e293b] bg-[#0b1220] p-2.5">
                      <div>
                        <p className="text-sm font-semibold text-white">{t.teamName} {i === 0 && t.available && <span className="mr-1 rounded bg-[#0ea5b7] px-1.5 text-[10px] text-white">הקרוב</span>}</p>
                        <p className="text-[11px] text-slate-400">{fmtDistance(t.distanceMeters)} · ~{t.etaMinutes} דק׳ · {t.statusNote}</p>
                      </div>
                      <button
                        disabled={!t.available}
                        onClick={() => { dispatch(c.id, t.teamId); setReassign(false); }}
                        className="rounded-lg bg-[#0ea5b7] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0c8f9e] disabled:bg-[#334155] disabled:text-slate-500"
                      >
                        שגר
                      </button>
                    </div>
                  ))}
                  <button onClick={() => setReassign(false)} className="text-xs text-slate-400 hover:text-slate-200">ביטול</button>
                </div>
              )}

              {c.stage === "dispatched" && (
                <button onClick={() => advance(c.id)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1f5fa6] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#1a4f8a]">
                  <Navigation size={18} /> אשר הגעת צוות לשטח
                </button>
              )}

              {c.stage === "in_field" && (
                <button onClick={() => resolve(c.id)} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#16a34a] px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-[#15803d]">
                  <CheckCircle2 size={18} /> סמן כטופל ואמת סגירה
                </button>
              )}
            </div>

            {/* AI reasoning */}
            <button onClick={() => setShowReasoning((v) => !v)} className="mt-3 flex w-full items-center justify-between rounded-lg border border-[#1e293b] px-3 py-2 text-xs text-slate-300 hover:bg-[#16223c]">
              <span>נימוק ה-AI (למה ההמלצה הזו?)</span>
              <ChevronDown size={15} className={showReasoning ? "rotate-180 transition-transform" : "transition-transform"} />
            </button>
            {showReasoning && (
              <p className="mt-2 rounded-lg bg-[#0b1220] p-3 text-xs leading-relaxed text-slate-300">
                {c.summary} הצוות נבחר כי הוא הזמין הקרוב ביותר ({fmtDistance(chosen?.distanceMeters ?? 0)}) לפי מיקום הרכב באיתורן, ומורשה לטפל בסוג פנייה זה. יעד ה-SLA ({c.slaTargetHours} שע׳) נגזר ממחלקת הטיפול ומרמת המפגע.
              </p>
            )}
          </div>
        </section>

        {/* ─── Column 3: Live tracking + verification ─── */}
        <section className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-[#1e293b] bg-[#0f1729]">
            <div className="flex items-center justify-between px-4 py-3">
              <h2 className="flex items-center gap-1.5 text-sm font-bold text-white">
                <Navigation size={15} className="text-[#0ea5b7]" /> מעקב חי
              </h2>
              <span className="flex items-center gap-1.5 rounded-full bg-[#16a34a]/15 px-2 py-0.5 text-[10px] font-semibold text-[#4ade80]">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#4ade80]" /> LIVE
              </span>
            </div>
            <div className="h-64 w-full">
              <CockpitMap incident={c.coords} vehicleStart={vehicleStart} dispatched={isDispatched} progress={progress} vehicleEmoji={vehicleEmoji} />
            </div>
            <div className="flex items-center justify-between border-t border-[#1e293b] px-4 py-2.5 text-xs">
              <span className="flex items-center gap-1 text-slate-300"><MapPin size={13} className="text-[#ef4444]" /> {c.street} {c.houseNumber !== "0" ? c.houseNumber : ""}</span>
              <span className="text-slate-400">ETA <span className="font-semibold text-[#0ea5b7]">{isDispatched && etaTime ? fmtTime(etaTime) : `~${chosen?.etaMinutes ?? "?"} דק׳`}</span></span>
            </div>
          </div>

          {/* Verification & Closure */}
          <div className="rounded-2xl border border-[#1e293b] bg-[#0f1729] p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-sm font-bold text-white">
                <ShieldCheck size={15} className="text-[#4ade80]" /> אימות וסגירה
              </h2>
              {c.stage === "resolved" ? (
                <span className="flex items-center gap-1 rounded-full bg-[#16a34a]/15 px-2 py-0.5 text-[10px] font-semibold text-[#4ade80]"><CheckCircle2 size={12} /> אומת</span>
              ) : (
                <span className="rounded-full bg-[#334155] px-2 py-0.5 text-[10px] font-semibold text-slate-300">ממתין</span>
              )}
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
              <BeforeAfter label={`לפני ${dispatchedTime ? fmtTime(dispatchedTime) : ""}`} tone="bad" resolved={c.stage === "resolved"} />
              <ArrowRight size={18} className="rotate-180 text-[#4ade80]" />
              <BeforeAfter label={`אחרי ${c.resolvedAt ? fmtTime(new Date(c.resolvedAt)) : ""}`} tone="good" resolved={c.stage === "resolved"} />
            </div>

            {c.stage === "resolved" && c.verification ? (
              <div className="mt-3 rounded-lg bg-[#0b1220] p-3">
                <p className="text-xs text-[#4ade80]">{c.verification.note}</p>
                <p className="mt-1 text-[11px] text-slate-400">שיטת אימות: {c.verification.method}{chosen ? ` · ${chosen.supervisor}` : ""}</p>
              </div>
            ) : (
              <button
                disabled={c.stage !== "in_field"}
                onClick={() => resolve(c.id)}
                className="mt-3 w-full rounded-xl border border-[#0ea5b7] px-4 py-2.5 text-sm font-bold text-[#0ea5b7] transition-colors hover:bg-[#0ea5b7]/10 disabled:border-[#334155] disabled:text-slate-600"
              >
                סגור אירוע
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={14} className="mt-0.5 shrink-0 text-slate-500" />
      <div className="flex-1">
        <span className="text-slate-500">{label}: </span>
        <span className="text-slate-200">{value}</span>
      </div>
    </div>
  );
}

function RecoRow({ icon: Icon, label, children }: { icon: typeof Users; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-b border-[#16223c] pb-3 last:border-0 last:pb-0">
      <Icon size={16} className="mt-0.5 shrink-0 text-slate-500" />
      <div className="w-24 shrink-0 text-xs text-slate-400">{label}</div>
      <div className="flex-1 text-xs">{children}</div>
    </div>
  );
}

function TimeBox({ v, l }: { v: string; l: string }) {
  return (
    <span className="inline-flex flex-col items-center">
      <span>{v}</span>
      <span className="text-[9px] font-normal text-slate-500">{l}</span>
    </span>
  );
}

function BeforeAfter({ label, tone, resolved }: { label: string; tone: "bad" | "good"; resolved: boolean }) {
  const show = tone === "bad" || resolved;
  return (
    <div>
      <p className="mb-1 text-[10px] text-slate-500">{label}</p>
      <div className={`flex h-24 items-center justify-center rounded-lg border ${tone === "good" && resolved ? "border-[#16a34a]/40 bg-[#052e1a]" : "border-[#1e293b] bg-[#0b1220]"}`}>
        {show ? (
          tone === "bad" ? <AlertTriangle size={22} className="text-[#f87171]" /> : <CheckCircle2 size={22} className="text-[#4ade80]" />
        ) : (
          <Camera size={18} className="text-slate-600" />
        )}
      </div>
    </div>
  );
}
