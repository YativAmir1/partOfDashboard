import type { District } from "@/lib/types";

// ─── Seed layer — canonical districts ────────────────────────────────────────
// The single source of truth for the 8 operational areas (per the brief). Every
// other module — the map (data/cityMap.ts), sentiment + red-lights + KPIs
// (data/cityIntel.ts) and the derived aggregates (data/seed/derive.ts) — resolves
// its area against THIS list. Change a label here and it changes everywhere.

export interface OperationalDistrict {
  id: District;
  label: string; // Hebrew display label
}

export const OPERATIONAL_DISTRICTS: readonly OperationalDistrict[] = [
  { id: "Shikun Vatikim", label: "שיכון ותיקים" },
  { id: "Bursa District", label: "מתחם הבורסה" },
  { id: "Marom Nave", label: "מרום נווה" },
  { id: "City Center", label: "מרכז העיר" },
  { id: "Ramat Chen", label: "רמת חן" },
  { id: "National Park", label: "הפארק הלאומי" },
  { id: "Tel Hashomer", label: "תל השומר" },
  { id: "Industrial Zone", label: "אזור התעשייה" },
] as const;

/** The set of operational district ids, in canonical order. */
export const DISTRICT_IDS = OPERATIONAL_DISTRICTS.map((d) => d.id);

const LABEL_BY_ID = new Map<District, string>(
  OPERATIONAL_DISTRICTS.map((d) => [d.id, d.label]),
);

/** Hebrew label for a district id (falls back to the id if unknown). */
export function districtLabel(id: District): string {
  return LABEL_BY_ID.get(id) ?? id;
}
