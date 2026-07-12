"use client";

import { AlertTriangle, CheckCircle2, Clock, MapPin, Camera, Users } from "lucide-react";
import type { ActionRecommendation } from "@/lib/citymind/types";

// "הוכחת טיפול" — proves a task was actually handled (before/after + metadata).
export function ProofOfService({ action }: { action: ActionRecommendation }) {
  const p = action.proof;
  if (!p) return null;
  const verified = action.status === "verified";

  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <ProofImage caption={p.beforeCaption} tone="before" show />
        <ProofImage caption={p.afterCaption} tone="after" show={verified} />
      </div>
      <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
        <Field icon={MapPin} label="מיקום GPS" value={p.gps} />
        <Field icon={Users} label="צוות מטפל" value={p.team} />
        <Field icon={Clock} label="זמן הגעה" value={verified ? p.arrivalTime ?? "—" : "—"} />
        <Field icon={CheckCircle2} label="זמן סגירה" value={verified ? p.closeTime ?? "—" : "—"} />
      </dl>
      {!verified && (
        <p className="mt-2 text-[10px] text-slate-500">תיעוד ה"אחרי" וזמני הטיפול יתמלאו לאחר אימות סגירת הטיפול.</p>
      )}
    </div>
  );
}

function ProofImage({ caption, tone, show }: { caption: string; tone: "before" | "after"; show: boolean }) {
  const good = tone === "after";
  return (
    <div>
      <p className="mb-1 text-[10px] text-slate-500">{tone === "before" ? "לפני" : "אחרי"}</p>
      <div
        className={`flex h-24 items-center justify-center rounded-lg border ${
          good && show ? "border-[#16a34a]/40 bg-[#052e1a]" : "border-[#1e293b] bg-[#0b1220]"
        }`}
      >
        {show ? (
          tone === "before" ? (
            <AlertTriangle size={22} className="text-[#f87171]" />
          ) : (
            <CheckCircle2 size={22} className="text-[#4ade80]" />
          )
        ) : (
          <Camera size={18} className="text-slate-600" />
        )}
      </div>
      <p className="mt-1 text-center text-[10px] leading-tight text-slate-400">{show ? caption : "ממתין לתיעוד"}</p>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon size={12} className="shrink-0 text-slate-500" />
      <span className="text-slate-500">{label}:</span>
      <span className="font-medium text-slate-200">{value}</span>
    </div>
  );
}
