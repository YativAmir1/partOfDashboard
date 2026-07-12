"use client";

import { Bot, CheckCircle2, ChevronLeft, Clock, Sparkles, Users, XCircle } from "lucide-react";
import type { ActionRecommendation, ActionStatus } from "@/lib/citymind/types";
import { ACTION_KIND_LABEL, PRIORITY_META, SLA_TIER_META } from "@/lib/citymind/labels";
import { findTeam } from "@/lib/citymind/lookup";
import { districtLabel } from "@/lib/hebrew";
import { useCityMind } from "@/context/CityMindContext";

const STATUS_META: Record<ActionStatus, { label: string; color: string } | null> = {
  recommended: null,
  approved: { label: "אושר · בשיגור לצוות", color: "#0ea5b7" },
  dispatched: { label: "נשלח לצוות השטח", color: "#3b82f6" },
  verified: { label: "אומת · הטיפול בוצע", color: "#22c55e" },
  dismissed: null,
};

export function ActionCard({ action }: { action: ActionRecommendation }) {
  const { selectedId, select, approve, dismiss, generate } = useCityMind();
  const selected = selectedId === action.id;
  const prio = PRIORITY_META[action.priority];
  const sla = SLA_TIER_META[action.slaRisk.tier];
  const team = findTeam(action.suggestedTeamId);
  const statusMeta = STATUS_META[action.status];
  const isActedOn = action.status !== "recommended";

  return (
    <div
      onClick={() => select(action.id)}
      className={`cursor-pointer rounded-2xl border bg-[#0f1729] p-4 transition-all ${
        selected ? "border-[#0ea5b7] ring-1 ring-[#0ea5b7]/40" : "border-[#1e293b] hover:border-[#334155]"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded-md px-2 py-0.5 text-[11px] font-bold" style={{ color: prio.color, background: prio.bg }}>
          {prio.label}
        </span>
        <span className="flex items-center gap-1 text-[11px] text-slate-400">
          <Bot size={12} className="text-[#0ea5b7]" /> ביטחון <span className="font-bold text-[#4ade80]">{action.aiConfidence}%</span>
        </span>
      </div>

      <h3 className="text-[15px] font-bold leading-snug text-white">{action.title}</h3>
      <p className="mt-0.5 text-[11px] text-slate-500">
        {ACTION_KIND_LABEL[action.kind]} · {districtLabel(action.district)}
      </p>

      <p className="mt-2 text-xs leading-relaxed text-slate-300">{action.reason}</p>

      <div className="mt-3 space-y-1.5 text-[11px]">
        <div className="flex items-start gap-1.5 text-slate-300">
          <Sparkles size={12} className="mt-0.5 shrink-0 text-[#0ea5b7]" />
          <span>
            <span className="text-slate-500">השפעה צפויה: </span>
            {action.expectedImpact}
          </span>
        </div>
        {team && (
          <div className="flex items-center gap-1.5 text-slate-300">
            <Users size={12} className="shrink-0 text-slate-500" />
            <span className="text-slate-500">צוות מוצע: </span>
            {team.name}
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Clock size={12} style={{ color: sla.color }} className="shrink-0" />
          <span className="rounded px-1.5 py-0.5 font-semibold" style={{ color: sla.color, background: sla.bg }}>
            {action.slaRisk.label}
          </span>
        </div>
      </div>

      {isActedOn && statusMeta ? (
        <div
          className="mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold"
          style={{ borderColor: `${statusMeta.color}55`, color: statusMeta.color, background: `${statusMeta.color}12` }}
        >
          <CheckCircle2 size={14} /> {statusMeta.label}
          <button
            onClick={(e) => {
              e.stopPropagation();
              select(action.id);
            }}
            className="mr-auto flex items-center gap-0.5 text-slate-400 transition-colors hover:text-white"
          >
            פרטים <ChevronLeft size={13} />
          </button>
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              approve(action.id);
            }}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-[#0ea5b7] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#0c8f9e]"
          >
            <CheckCircle2 size={14} /> אשר פעולה
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              select(action.id);
              void generate(action, "explainAction");
            }}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-[#334155] bg-[#0b1220] px-3 py-2 text-xs font-semibold text-slate-200 transition-colors hover:bg-[#16223c]"
          >
            <Bot size={14} /> הסבר החלטת AI
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              select(action.id);
            }}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-[#334155] bg-[#0b1220] px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:bg-[#16223c]"
          >
            <Users size={13} /> שנה צוות
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              dismiss(action.id);
            }}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-[#334155] bg-[#0b1220] px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:bg-[#3f1d1d] hover:text-[#f87171]"
          >
            <XCircle size={13} /> דחה
          </button>
        </div>
      )}
    </div>
  );
}
