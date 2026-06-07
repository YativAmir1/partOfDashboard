"use client";

import { useState } from "react";
import { X, Plus, Trash2, MapPin, Navigation, Flag, Loader2, AlertCircle } from "lucide-react";
import { EMPLOYEES_DATA } from "@/data/employeesData";
import { resolveAddressToRawCoords, buildSmartPolyline, samplePolyline } from "@/lib/geocoding";
import type { DayKey, IncidentType } from "@/lib/types";

const DAY_OPTIONS: { key: DayKey; label: string }[] = [
  { key: "sun", label: "א׳" },
  { key: "mon", label: "ב׳" },
  { key: "tue", label: "ג׳" },
  { key: "wed", label: "ד׳" },
  { key: "thu", label: "ה׳" },
  { key: "fri", label: "ו׳" },
];

const CATEGORY_OPTIONS: { key: IncidentType; label: string }[] = [
  { key: "waste",     label: 'שפ"ע וניקיון' },
  { key: "parks",     label: "גנים ונוף" },
  { key: "safety",    label: "בטיחות וביטחון" },
  { key: "traffic",   label: "תנועה וניידות" },
  { key: "utilities", label: "תשתיות" },
];

// Flat list of all teams across departments
const ALL_TEAMS = EMPLOYEES_DATA.flatMap((dept) =>
  dept.teams.map((team) => ({
    id: team.id,
    name: team.name,
    deptName: dept.shortName,
  })),
);

interface FormState {
  name: string;
  category: IncidentType;
  estimatedDurationMin: number;
  startAddress: string;
  stops: string[];
  endAddress: string;
  teamId: string;
  dayOfWeek: DayKey[];
  scheduledStartTime: string;
  scheduledEndTime: string;
  requiredCompletionPct: number;
}

interface Props {
  onClose: () => void;
  onCreated: () => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-[#585858]">{label}</label>
      {children}
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-[#d0d0d0] bg-white px-3 py-2 text-sm text-[#1a1a1a] placeholder:text-[#aaa] focus:outline-none focus:ring-2 focus:ring-[#1f5fa6]/30 focus:border-[#1f5fa6] transition-colors";

export function AddRouteModal({ onClose, onCreated }: Props) {
  const [form, setForm] = useState<FormState>({
    name: "",
    category: "waste",
    estimatedDurationMin: 60,
    startAddress: "",
    stops: [""],
    endAddress: "",
    teamId: ALL_TEAMS[0]?.id ?? "",
    dayOfWeek: ["sun", "tue", "thu"],
    scheduledStartTime: "06:00",
    scheduledEndTime: "09:00",
    requiredCompletionPct: 85,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleDay(day: DayKey) {
    setForm((prev) => ({
      ...prev,
      dayOfWeek: prev.dayOfWeek.includes(day)
        ? prev.dayOfWeek.filter((d) => d !== day)
        : [...prev.dayOfWeek, day],
    }));
  }

  function addStop() {
    setForm((prev) => ({ ...prev, stops: [...prev.stops, ""] }));
  }

  function removeStop(i: number) {
    setForm((prev) => ({
      ...prev,
      stops: prev.stops.filter((_, idx) => idx !== i),
    }));
  }

  function updateStop(i: number, val: string) {
    setForm((prev) => {
      const next = [...prev.stops];
      next[i] = val;
      return { ...prev, stops: next };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("יש להזין שם מסלול."); return; }
    if (!form.startAddress.trim()) { setError("יש להזין כתובת התחלה."); return; }
    if (!form.endAddress.trim()) { setError("יש להזין כתובת סיום."); return; }
    if (form.dayOfWeek.length === 0) { setError("יש לבחור לפחות יום אחד בשבוע."); return; }

    const selectedTeam = ALL_TEAMS.find((t) => t.id === form.teamId);
    if (!selectedTeam) { setError("יש לבחור צוות."); return; }

    setError(null);
    setLoading(true);

    // Phase 1: geocode in the browser (uses the user's IP — no server timeout risk)
    const streets = [
      form.startAddress.trim(),
      ...form.stops.map((s) => s.trim()).filter(Boolean),
      form.endAddress.trim(),
    ];
    let coords: [number, number][];
    try {
      const groups = await Promise.all(streets.map(resolveAddressToRawCoords));
      const polyline = samplePolyline(buildSmartPolyline(groups), 15);
      if (polyline.length < 2) {
        setError("לא ניתן לאתר את הכתובות שהוזנו. אנא בדוק את הכתובות ונסה שנית.");
        setLoading(false);
        return;
      }
      coords = polyline;
    } catch {
      setError("שגיאה בזיהוי הכתובות. בדוק את החיבור ונסה שנית.");
      setLoading(false);
      return;
    }

    // Phase 2: save to server — fast, no external calls
    try {
      const res = await fetch("/api/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          category: form.category,
          estimatedDurationMin: form.estimatedDurationMin,
          streets,
          coords,
          assignedTeam: selectedTeam.name,
          teamRef: selectedTeam.id,
          dayOfWeek: form.dayOfWeek,
          scheduledStartTime: form.scheduledStartTime,
          scheduledEndTime: form.scheduledEndTime,
          requiredCompletionPct: form.requiredCompletionPct,
        }),
      });

      if (!res.ok) {
        const body = (await res.json()) as { error?: string };
        setError(body.error ?? "שגיאה ביצירת המסלול. אנא נסה שנית.");
        return;
      }

      onCreated();
      onClose();
    } catch {
      setError("שגיאת רשת. בדוק את החיבור ונסה שנית.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
        dir="rtl"
      >
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/90 rounded-2xl">
            <Loader2 size={36} className="animate-spin text-[#1f5fa6]" />
            <p className="text-sm font-semibold text-[#1f5fa6]">ממפה כתובות…</p>
            <p className="text-xs text-[#707070] text-center max-w-xs">
              מאחזר נתוני רחובות ממפת OpenStreetMap. פעולה זו עשויה לקחת עד כ-30 שניות.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-[#e8e8e8] sticky top-0 bg-white z-[1] rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1f5fa6]/10 flex items-center justify-center">
              <Navigation size={16} className="text-[#1f5fa6]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1a1a1a]">מסלול חדש</h2>
              <p className="text-xs text-[#707070]">הזן כתובות ונתוני מסלול</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-[#f4f4f4] text-[#707070] transition-colors disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">

          {/* Section: פרטי מסלול */}
          <div className="space-y-3">
            <p className="text-[11px] font-bold text-[#585858] uppercase tracking-wider">פרטי מסלול</p>

            <div className="grid grid-cols-2 gap-3">
              <Field label="שם מסלול *">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                  placeholder="לדוגמה: מסלול ניקיון צפוני"
                  className={inputCls}
                />
              </Field>

              <Field label="קטגוריה *">
                <select
                  value={form.category}
                  onChange={(e) => setField("category", e.target.value as IncidentType)}
                  className={inputCls}
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="משך מוערך (דקות)">
                <input
                  type="number"
                  min={15}
                  max={480}
                  value={form.estimatedDurationMin}
                  onChange={(e) => setField("estimatedDurationMin", Number(e.target.value))}
                  className={inputCls}
                />
              </Field>

              <Field label="% ביצוע נדרש">
                <input
                  type="number"
                  min={50}
                  max={100}
                  value={form.requiredCompletionPct}
                  onChange={(e) => setField("requiredCompletionPct", Number(e.target.value))}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          {/* Section: מסלול גיאוגרפי */}
          <div className="space-y-3">
            <p className="text-[11px] font-bold text-[#585858] uppercase tracking-wider">מסלול גיאוגרפי</p>

            <div className="bg-[#f8fbff] border border-[#bfdbfe] rounded-xl p-3 space-y-3">
              {/* Start */}
              <Field label="כתובת התחלה *">
                <div className="relative">
                  <MapPin size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#459524]" />
                  <input
                    type="text"
                    value={form.startAddress}
                    onChange={(e) => setField("startAddress", e.target.value)}
                    placeholder="לדוגמה: קרניצקי 33"
                    className={`${inputCls} pr-8`}
                  />
                </div>
                <p className="text-[10px] text-[#707070]">רחוב עם מספר בית = נקודה מדויקת · רק רחוב = כל אורך הרחוב (נקודה כל 15מ׳)</p>
              </Field>

              {/* Stops */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#585858]">עצירות / רחובות לכיסוי</label>
                  <button
                    type="button"
                    onClick={addStop}
                    className="flex items-center gap-1 text-xs font-medium text-[#1f5fa6] hover:text-[#174f8f] transition-colors"
                  >
                    <Plus size={13} /> הוסף
                  </button>
                </div>
                {form.stops.map((stop, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-[#1f5fa6] flex items-center justify-center">
                        <span className="text-[8px] font-bold text-[#1f5fa6]">{i + 1}</span>
                      </div>
                      <input
                        type="text"
                        value={stop}
                        onChange={(e) => updateStop(i, e.target.value)}
                        placeholder="לדוגמה: הרצל או הרצל 50"
                        className={`${inputCls} pr-8`}
                      />
                    </div>
                    {form.stops.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStop(i)}
                        className="p-1.5 rounded-lg text-[#d96350] hover:bg-red-50 transition-colors shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* End */}
              <Field label="כתובת סיום *">
                <div className="relative">
                  <Flag size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#d96350]" />
                  <input
                    type="text"
                    value={form.endAddress}
                    onChange={(e) => setField("endAddress", e.target.value)}
                    placeholder="לדוגמה: הרצל 107"
                    className={`${inputCls} pr-8`}
                  />
                </div>
              </Field>
            </div>
          </div>

          {/* Section: לוח זמנים */}
          <div className="space-y-3">
            <p className="text-[11px] font-bold text-[#585858] uppercase tracking-wider">לוח זמנים</p>

            <Field label="ימי ביצוע *">
              <div className="flex gap-2 flex-wrap">
                {DAY_OPTIONS.map(({ key, label }) => {
                  const active = form.dayOfWeek.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleDay(key)}
                      className={`w-10 h-10 rounded-lg text-xs font-bold border transition-colors ${
                        active
                          ? "bg-[#1f5fa6] text-white border-[#1f5fa6]"
                          : "bg-white text-[#585858] border-[#d0d0d0] hover:border-[#1f5fa6]/40"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="שעת התחלה">
                <input
                  type="time"
                  value={form.scheduledStartTime}
                  onChange={(e) => setField("scheduledStartTime", e.target.value)}
                  className={inputCls}
                />
              </Field>
              <Field label="שעת סיום">
                <input
                  type="time"
                  value={form.scheduledEndTime}
                  onChange={(e) => setField("scheduledEndTime", e.target.value)}
                  className={inputCls}
                />
              </Field>
            </div>
          </div>

          {/* Section: שיבוץ */}
          <div className="space-y-3">
            <p className="text-[11px] font-bold text-[#585858] uppercase tracking-wider">שיבוץ צוות</p>

            <Field label="צוות מבצע *">
              <select
                value={form.teamId}
                onChange={(e) => setField("teamId", e.target.value)}
                className={inputCls}
              >
                {EMPLOYEES_DATA.map((dept) => (
                  <optgroup key={dept.id} label={dept.name}>
                    {dept.teams.map((team) => (
                      <option key={team.id} value={team.id}>
                        {team.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1 border-t border-[#e8e8e8]">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1f5fa6] text-white text-sm font-semibold rounded-xl hover:bg-[#174f8f] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <><Loader2 size={15} className="animate-spin" /> ממפה כתובות…</>
              ) : (
                <><Navigation size={15} /> צור מסלול</>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 border border-[#d0d0d0] text-[#585858] text-sm font-medium rounded-xl hover:bg-[#f4f4f4] transition-colors disabled:opacity-40"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
