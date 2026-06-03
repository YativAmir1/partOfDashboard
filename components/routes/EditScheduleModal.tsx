"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type {
  RouteSchedule,
  RouteTemplate,
  DayKey,
  RecurrenceType,
  TimeWindow,
} from "@/lib/types";

const DAY_OPTIONS: { key: DayKey; label: string }[] = [
  { key: "sun", label: "ראשון" },
  { key: "mon", label: "שני" },
  { key: "tue", label: "שלישי" },
  { key: "wed", label: "רביעי" },
  { key: "thu", label: "חמישי" },
  { key: "fri", label: "שישי" },
];

const RECURRENCE_LABELS: Record<RecurrenceType, string> = {
  daily: "יומי",
  weekly: "שבועי",
  monthly: "חודשי",
};

const TIMES_OPTIONS = [1, 2, 3, 4, 5, 6];

// Sensible default time windows spread across the day
const DEFAULT_WINDOWS: TimeWindow[] = [
  { startTime: "06:00", endTime: "08:00" },
  { startTime: "10:00", endTime: "12:00" },
  { startTime: "14:00", endTime: "16:00" },
  { startTime: "18:00", endTime: "20:00" },
  { startTime: "07:00", endTime: "09:00" },
  { startTime: "20:00", endTime: "22:00" },
];

function syncWindows(count: number, current: TimeWindow[]): TimeWindow[] {
  const result = [...current];
  while (result.length < count) {
    result.push(DEFAULT_WINDOWS[result.length] ?? DEFAULT_WINDOWS[0]);
  }
  return result.slice(0, count);
}

interface FormState {
  templateId: string;
  dayOfWeek: DayKey[];
  scheduledStartTime: string;
  scheduledEndTime: string;
  dailyTimeWindows: TimeWindow[];
  assignedTeam: string;
  vehicle: string;
  requiredCompletionPct: number;
  complaintThreshold: number;
  active: boolean;
  recurrenceType: RecurrenceType;
  timesPerDay: number;
  timesPerMonth: number;
}

interface FormErrors {
  templateId?: string;
  dayOfWeek?: string;
  scheduledEndTime?: string;
  dailyWindowErrors?: Array<string | undefined>;
  requiredCompletionPct?: string;
  complaintThreshold?: string;
}

interface Props {
  schedule: RouteSchedule;
  templates: RouteTemplate[];
  onSave: (updated: RouteSchedule) => void;
  onClose: () => void;
}

export function EditScheduleModal({ schedule, templates, onSave, onClose }: Props) {
  const initialTimesPerDay = schedule.timesPerDay ?? 1;
  const initialWindows: TimeWindow[] = schedule.dailyTimeWindows?.length
    ? schedule.dailyTimeWindows
    : syncWindows(initialTimesPerDay, [
        { startTime: schedule.scheduledStartTime, endTime: schedule.scheduledEndTime },
      ]);

  const [form, setForm] = useState<FormState>({
    templateId: schedule.templateId,
    dayOfWeek: [...schedule.dayOfWeek],
    scheduledStartTime: schedule.scheduledStartTime,
    scheduledEndTime: schedule.scheduledEndTime,
    dailyTimeWindows: initialWindows,
    assignedTeam: schedule.assignedTeam,
    vehicle: schedule.vehicle ?? "",
    requiredCompletionPct: schedule.requiredCompletionPct,
    complaintThreshold: schedule.complaintThreshold ?? 3,
    active: schedule.active !== false,
    recurrenceType: schedule.recurrenceType ?? "weekly",
    timesPerDay: initialTimesPerDay,
    timesPerMonth: schedule.timesPerMonth ?? 1,
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const currentTemplate = templates.find((t) => t.id === form.templateId);

  function validate(): boolean {
    const e: FormErrors = {};
    if (!form.templateId) e.templateId = "יש לבחור מסלול";

    if (form.recurrenceType === "daily") {
      if (form.dayOfWeek.length === 0) e.dayOfWeek = "יש לבחור לפחות יום אחד";
      const winErrors = form.dailyTimeWindows.map((w) =>
        w.startTime >= w.endTime ? "שעת סיום חייבת להיות אחרי שעת התחלה" : undefined
      );
      if (winErrors.some(Boolean)) e.dailyWindowErrors = winErrors;
    } else if (form.recurrenceType === "weekly") {
      if (form.dayOfWeek.length === 0) e.dayOfWeek = "יש לבחור לפחות יום אחד";
      if (form.scheduledStartTime >= form.scheduledEndTime)
        e.scheduledEndTime = "שעת סיום חייבת להיות אחרי שעת התחלה";
    } else {
      if (form.scheduledStartTime >= form.scheduledEndTime)
        e.scheduledEndTime = "שעת סיום חייבת להיות אחרי שעת התחלה";
    }

    if (form.requiredCompletionPct < 1 || form.requiredCompletionPct > 100)
      e.requiredCompletionPct = "ערך בין 1 ל-100";
    if (form.complaintThreshold < 0) e.complaintThreshold = "ערך 0 לפחות";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    const isDaily = form.recurrenceType === "daily";
    onSave({
      ...schedule,
      templateId: form.templateId,
      dayOfWeek: form.recurrenceType === "monthly" ? [] : form.dayOfWeek,
      scheduledStartTime: isDaily
        ? (form.dailyTimeWindows[0]?.startTime ?? form.scheduledStartTime)
        : form.scheduledStartTime,
      scheduledEndTime: isDaily
        ? (form.dailyTimeWindows[0]?.endTime ?? form.scheduledEndTime)
        : form.scheduledEndTime,
      assignedTeam: form.assignedTeam,
      vehicle: form.vehicle.trim() || undefined,
      requiredCompletionPct: form.requiredCompletionPct,
      complaintThreshold: form.complaintThreshold,
      active: form.active,
      recurrenceType: form.recurrenceType,
      timesPerDay: isDaily ? form.timesPerDay : undefined,
      timesPerMonth: form.recurrenceType === "monthly" ? form.timesPerMonth : undefined,
      dailyTimeWindows: isDaily ? form.dailyTimeWindows : undefined,
    });
  }

  function toggleDay(day: DayKey) {
    setForm((f) => ({
      ...f,
      dayOfWeek: f.dayOfWeek.includes(day)
        ? f.dayOfWeek.filter((d) => d !== day)
        : [...f.dayOfWeek, day],
    }));
  }

  function updateWindow(idx: number, field: keyof TimeWindow, value: string) {
    setForm((f) => {
      const updated = [...f.dailyTimeWindows];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...f, dailyTimeWindows: updated };
    });
  }

  const inputCls =
    "w-full border border-[#d0d0d0] rounded-lg px-3 py-2 text-sm text-[#1a1a1a] bg-white focus:outline-none focus:ring-2 focus:ring-[#1f5fa6] focus:border-[#1f5fa6]";
  const labelCls = "block text-[11px] font-semibold text-[#585858] mb-1.5";
  const errorCls = "text-[10px] text-[#d96350] mt-1";

  const DayPicker = () => (
    <div className="flex flex-wrap gap-2">
      {DAY_OPTIONS.map(({ key, label }) => {
        const sel = form.dayOfWeek.includes(key);
        return (
          <button
            key={key}
            type="button"
            onClick={() => toggleDay(key)}
            className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
            style={
              sel
                ? { background: "#1f5fa6", color: "#fff", borderColor: "#1f5fa6" }
                : { background: "#f4f4f4", color: "#585858", borderColor: "#d0d0d0" }
            }
          >
            {label}
          </button>
        );
      })}
    </div>
  );

  const TimesPills = ({
    value,
    onChange,
    unitLabel,
  }: {
    value: number;
    onChange: (n: number) => void;
    unitLabel: string;
  }) => (
    <div>
      <label className={labelCls}>כמה פעמים {unitLabel}?</label>
      <div className="flex gap-2 flex-wrap">
        {TIMES_OPTIONS.map((n) => {
          const sel = value === n;
          return (
            <button
              key={n}
              type="button"
              onClick={() => onChange(n)}
              className="w-10 h-10 rounded-xl text-sm font-bold border transition-colors"
              style={
                sel
                  ? { background: "#1f5fa6", color: "#fff", borderColor: "#1f5fa6" }
                  : { background: "#f4f4f4", color: "#585858", borderColor: "#d0d0d0" }
              }
            >
              {n}×
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        dir="rtl"
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[540px] max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[#e8e8e8] shrink-0">
          <div>
            <h3 className="text-base font-bold text-[#1a1a1a]">עריכת מסלול</h3>
            {currentTemplate && (
              <p className="text-[11px] text-[#999999] mt-0.5">
                {currentTemplate.name}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-[#999999] hover:bg-[#f0f0f0] shrink-0 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">
          {/* Template */}
          <div>
            <label className={labelCls}>מסלול *</label>
            <select
              className={inputCls}
              value={form.templateId}
              onChange={(e) =>
                setForm((f) => ({ ...f, templateId: e.target.value }))
              }
            >
              <option value="">בחר מסלול...</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
            {errors.templateId && <p className={errorCls}>{errors.templateId}</p>}
          </div>

          {/* ── Recurrence section ─────────────────────────────────────────── */}
          <div className="border border-[#e8e8e8] rounded-xl p-4 space-y-4">
            <p className="text-[11px] font-semibold text-[#585858]">חזרתיות המסלול</p>

            {/* Segment control */}
            <div className="flex rounded-lg border border-[#d0d0d0] overflow-hidden">
              {(["daily", "weekly", "monthly"] as RecurrenceType[]).map((type) => {
                const active = form.recurrenceType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, recurrenceType: type }))}
                    className="flex-1 py-2 text-xs font-semibold transition-colors"
                    style={
                      active
                        ? { background: "#1f5fa6", color: "#fff" }
                        : { background: "#f9f9f9", color: "#585858" }
                    }
                  >
                    {RECURRENCE_LABELS[type]}
                  </button>
                );
              })}
            </div>

            {/* ── Daily ── */}
            {form.recurrenceType === "daily" && (
              <>
                <TimesPills
                  value={form.timesPerDay}
                  onChange={(n) =>
                    setForm((f) => ({
                      ...f,
                      timesPerDay: n,
                      dailyTimeWindows: syncWindows(n, f.dailyTimeWindows),
                    }))
                  }
                  unitLabel="ביום"
                />

                {/* Dynamic time windows */}
                <div className="space-y-2">
                  <label className={labelCls + " mb-0"}>שעות הפעלה</label>
                  {form.dailyTimeWindows.map((win, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span
                        className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{ background: "#eef4fb", color: "#1f5fa6" }}
                      >
                        {idx + 1}
                      </span>
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div>
                          {idx === 0 && (
                            <label className="block text-[10px] text-[#999999] mb-1">
                              התחלה
                            </label>
                          )}
                          <input
                            type="time"
                            className={inputCls + " text-xs py-1.5"}
                            value={win.startTime}
                            onChange={(e) =>
                              updateWindow(idx, "startTime", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          {idx === 0 && (
                            <label className="block text-[10px] text-[#999999] mb-1">
                              סיום
                            </label>
                          )}
                          <input
                            type="time"
                            className={inputCls + " text-xs py-1.5"}
                            value={win.endTime}
                            onChange={(e) =>
                              updateWindow(idx, "endTime", e.target.value)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {errors.dailyWindowErrors?.some(Boolean) && (
                    <div className="space-y-0.5">
                      {errors.dailyWindowErrors.map(
                        (err, idx) =>
                          err && (
                            <p key={idx} className={errorCls}>
                              הפעלה {idx + 1}: {err}
                            </p>
                          )
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <label className={labelCls}>ימים להפעלה *</label>
                  <DayPicker />
                  {errors.dayOfWeek && <p className={errorCls}>{errors.dayOfWeek}</p>}
                </div>
              </>
            )}

            {/* ── Weekly ── */}
            {form.recurrenceType === "weekly" && (
              <>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={labelCls + " mb-0"}>ימים בשבוע *</label>
                    {form.dayOfWeek.length > 0 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#eef4fb] text-[#1f5fa6]">
                        פועל {form.dayOfWeek.length}× בשבוע
                      </span>
                    )}
                  </div>
                  <DayPicker />
                  {errors.dayOfWeek && <p className={errorCls}>{errors.dayOfWeek}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>שעת התחלה *</label>
                    <input
                      type="time"
                      className={inputCls}
                      value={form.scheduledStartTime}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          scheduledStartTime: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>שעת סיום *</label>
                    <input
                      type="time"
                      className={inputCls}
                      value={form.scheduledEndTime}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          scheduledEndTime: e.target.value,
                        }))
                      }
                    />
                    {errors.scheduledEndTime && (
                      <p className={errorCls}>{errors.scheduledEndTime}</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ── Monthly ── */}
            {form.recurrenceType === "monthly" && (
              <>
                <TimesPills
                  value={form.timesPerMonth}
                  onChange={(n) => setForm((f) => ({ ...f, timesPerMonth: n }))}
                  unitLabel="בחודש"
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>שעת התחלה *</label>
                    <input
                      type="time"
                      className={inputCls}
                      value={form.scheduledStartTime}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          scheduledStartTime: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <label className={labelCls}>שעת סיום *</label>
                    <input
                      type="time"
                      className={inputCls}
                      value={form.scheduledEndTime}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          scheduledEndTime: e.target.value,
                        }))
                      }
                    />
                    {errors.scheduledEndTime && (
                      <p className={errorCls}>{errors.scheduledEndTime}</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Vehicle / Team */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>רכב (אופציונלי)</label>
              <input
                type="text"
                placeholder="לדוגמה: רכב 17"
                className={inputCls + " placeholder:text-[#cccccc]"}
                value={form.vehicle}
                onChange={(e) =>
                  setForm((f) => ({ ...f, vehicle: e.target.value }))
                }
              />
            </div>
            <div>
              <label className={labelCls}>צוות</label>
              <input
                type="text"
                className={inputCls + " placeholder:text-[#cccccc]"}
                value={form.assignedTeam}
                onChange={(e) =>
                  setForm((f) => ({ ...f, assignedTeam: e.target.value }))
                }
              />
            </div>
          </div>

          {/* Completion % + Complaint threshold */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>אחוז השלמה נדרש (%) *</label>
              <input
                type="number"
                min={1}
                max={100}
                className={inputCls}
                value={form.requiredCompletionPct}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    requiredCompletionPct: Number(e.target.value),
                  }))
                }
              />
              {errors.requiredCompletionPct && (
                <p className={errorCls}>{errors.requiredCompletionPct}</p>
              )}
            </div>
            <div>
              <label className={labelCls}>סף תלונות</label>
              <input
                type="number"
                min={0}
                className={inputCls}
                value={form.complaintThreshold}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    complaintThreshold: Number(e.target.value),
                  }))
                }
              />
              {errors.complaintThreshold && (
                <p className={errorCls}>{errors.complaintThreshold}</p>
              )}
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between py-1 border-t border-[#f0f0f0] pt-3">
            <div>
              <p className="text-sm font-medium text-[#1a1a1a]">שיבוץ פעיל</p>
              <p className="text-[10px] text-[#999999] mt-0.5">
                שיבוץ לא פעיל לא יופיע בלוחות התכנון
              </p>
            </div>
            <div dir="ltr">
              <button
                type="button"
                role="switch"
                aria-checked={form.active}
                onClick={() => setForm((f) => ({ ...f, active: !f.active }))}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200"
                style={{ background: form.active ? "#1f5fa6" : "#d0d0d0" }}
              >
                <span
                  className="inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200"
                  style={{
                    transform: form.active
                      ? "translateX(24px)"
                      : "translateX(4px)",
                  }}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#e8e8e8] flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#585858] hover:text-[#1a1a1a] transition-colors"
          >
            ביטול
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-[#1f5fa6] text-white text-sm font-semibold rounded-lg hover:bg-[#174f8f] transition-colors"
          >
            שמירה
          </button>
        </div>
      </div>
    </div>
  );
}
