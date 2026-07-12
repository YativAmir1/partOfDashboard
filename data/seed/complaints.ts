import type { SeedComplaint } from "./types";
import { RAW_COMPLAINTS } from "./complaints.generated";
import { districtForStreet } from "./streets";
import { DEFAULT_STATUS, STATUS_MAP, normalizeDepartment } from "./taxonomy";

// ─── Seed layer — resolved complaints ────────────────────────────────────────
// Applies the editable maps (streets.ts, taxonomy.ts) to the generated raw rows.
// Because this runs in TS at import time, correcting a street→district assignment
// or a department mapping is reflected everywhere on the next build — no need to
// re-run scripts/build-seed.mjs (that's only for when the CSV itself changes).

export const SEED_COMPLAINTS: SeedComplaint[] = RAW_COMPLAINTS.map((r) => {
  const { district, mapped } = districtForStreet(r.street);
  const status = STATUS_MAP[r.rawStatus] ?? DEFAULT_STATUS;
  return {
    id: r.id,
    createdAt: r.createdAt,
    status: status.key,
    statusLabel: status.label,
    department: normalizeDepartment(r.rawDepartment),
    subject: r.subject,
    description: r.description,
    street: r.street,
    houseNumber: r.houseNumber,
    district,
    districtMapped: mapped,
    reporter: r.reporter,
    station: r.station,
  };
});

/** Streets that fell back (not in STREET_TO_DISTRICT). Empty = full coverage. */
export const UNMAPPED_STREETS: string[] = [
  ...new Set(SEED_COMPLAINTS.filter((c) => !c.districtMapped).map((c) => c.street)),
];
