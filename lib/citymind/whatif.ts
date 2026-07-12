// ─── CityMind AI — What-If simulation model ──────────────────────────────────
// A small, deterministic operational model (not a static lookup). Three field
// levers → projected impact + an hourly complaints curve for the next 6 hours.
// Uses diminishing returns so the numbers stay plausible under any slider combo.

export interface WhatIfInputs {
  extraTeams: number; // צוותי תגבור (0–4)
  extraShiftHours: number; // שעות משמרת נוספות (0–6)
  proactiveTickets: number; // קריאות יזומות (0–20)
}

export interface WhatIfResult {
  complaintsReductionPct: number;
  slaImprovementPct: number;
  teamTimeSavedMin: number;
  aiConfidence: number;
  complaintsPrevented: number;
  baselineHourly: number[]; // complaints/hour, next 6h (evening spike)
  projectedHourly: number[]; // after the intervention ramps in
}

export interface WhatIfPreset {
  id: string;
  label: string;
  inputs: WhatIfInputs;
}

export const WHATIF_INPUT_META: {
  key: keyof WhatIfInputs;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  color: string;
}[] = [
  { key: "extraTeams", label: "צוותי תגבור", unit: "צוותים", min: 0, max: 4, step: 1, color: "#0ea5b7" },
  { key: "extraShiftHours", label: "שעות משמרת נוספות", unit: "שעות", min: 0, max: 6, step: 1, color: "#a78bfa" },
  { key: "proactiveTickets", label: "קריאות יזומות", unit: "קריאות", min: 0, max: 20, step: 1, color: "#fbbf24" },
];

export const WHATIF_PRESETS: WhatIfPreset[] = [
  { id: "add-cleaning-team", label: "צוות ניקיון נוסף", inputs: { extraTeams: 1, extraShiftHours: 0, proactiveTickets: 0 } },
  { id: "extend-shift", label: "הארכת משמרת", inputs: { extraTeams: 0, extraShiftHours: 3, proactiveTickets: 0 } },
  { id: "proactive", label: "קריאות יזומות", inputs: { extraTeams: 0, extraShiftHours: 0, proactiveTickets: 12 } },
  { id: "combined", label: "מהלך משולב", inputs: { extraTeams: 1, extraShiftHours: 2, proactiveTickets: 6 } },
];

/** Complaints/hour over the coming evening if nothing changes (18:00→23:00 spike). */
const BASELINE_HOURLY = [22, 26, 31, 34, 28, 19];

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export function computeWhatIf(inp: WhatIfInputs): WhatIfResult {
  // Diminishing returns on teams (each added team helps a bit less than the last).
  const teamTerm = 8 * Math.sqrt(inp.extraTeams); // 0, 8, 11.3, 13.9, 16
  const shiftTerm = inp.extraShiftHours;
  const proactiveTerm = inp.proactiveTickets;

  const complaintsReductionPct = clamp(
    Math.round(teamTerm + 1.4 * shiftTerm + 0.65 * proactiveTerm),
    0,
    46,
  );
  const slaImprovementPct = clamp(
    Math.round(0.75 * teamTerm + 2.3 * shiftTerm + 0.18 * proactiveTerm),
    0,
    40,
  );
  const teamTimeSavedMin = Math.round(inp.extraTeams * 14 + inp.extraShiftHours * 7 + inp.proactiveTickets * 1.4);

  // Confidence: high near the status quo, softer as we extrapolate far from it.
  const stretch = inp.extraTeams * 3 + inp.extraShiftHours * 1.6 + inp.proactiveTickets * 0.35;
  const aiConfidence = clamp(Math.round(89 - stretch), 62, 89);

  // Project the hourly curve — the intervention ramps in over the first ~3h.
  const projectedHourly = BASELINE_HOURLY.map((v, h) => {
    const ramp = Math.min(1, (h + 1) / 3);
    return Math.round(v * (1 - (complaintsReductionPct / 100) * ramp));
  });
  const complaintsPrevented = BASELINE_HOURLY.reduce((s, v, h) => s + (v - projectedHourly[h]), 0);

  return {
    complaintsReductionPct,
    slaImprovementPct,
    teamTimeSavedMin,
    aiConfidence,
    complaintsPrevented,
    baselineHourly: BASELINE_HOURLY,
    projectedHourly,
  };
}
