// ─── CityMind seed generator ─────────────────────────────────────────────────
// Reads the ONE real dataset (_ככה זה סבבה.csv — Ramat Gan 109 complaints) and
// emits data/seed/complaints.generated.ts: a PII-safe RawSeedComplaint[].
//
//   • Caller names   → consistent pseudonyms (same person → same fake name)
//   • National IDs    → dropped entirely (column not emitted)
//   • Phone numbers   → scrubbed from free-text descriptions
//   • Dates           → ISO
//
// It deliberately does NOT resolve district/department/status — those stay in the
// editable TS maps (data/seed/streets.ts, taxonomy.ts) and are applied at import
// time. Re-run only when the CSV changes:  node scripts/build-seed.mjs
//
// © OpenStreetMap-independent; the CSV is municipal operational data.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CSV_PATH = path.join(ROOT, "_ככה זה סבבה.csv");
const OUT_PATH = path.join(ROOT, "data", "seed", "complaints.generated.ts");

// ── minimal RFC-4180-ish CSV parser (quotes + embedded newlines) ──
function parseCsv(text) {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\r") { /* skip */ }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else field += c;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// ── deterministic pseudonymization ──
const FIRST_NAMES = [
  "דנה", "יוסי", "מיכל", "אבי", "נועה", "רון", "תמר", "גיל", "שירה", "עמית",
  "מור", "איתי", "ליאור", "הדר", "עומר", "יעל", "אורי", "שני", "דור", "נטע",
  "טל", "רועי", "מאיה", "אלון", "ריקי", "בני", "סיגל", "גדי", "ענת", "ניר",
];
const LAST_NAMES = [
  "כהן", "לוי", "מזרחי", "פרץ", "ביטון", "אברהם", "פרידמן", "דהן", "אזולאי",
  "גולן", "שפירא", "ברק", "נחום", "סגל", "הרוש", "קפלן", "רוזן", "אלבז",
  "מלכה", "בן דוד", "אשכנזי", "עמר", "טל", "נסים",
];

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pseudonym(rawName) {
  const name = (rawName || "").trim();
  if (!name || name.includes("אנונימי")) return "תושב/ת";
  const h = hash(name);
  const first = FIRST_NAMES[h % FIRST_NAMES.length];
  const last = LAST_NAMES[(h >>> 8) % LAST_NAMES.length];
  return `${first} ${last}`;
}

// ── scrub PII from free text: phones + long id-like digit runs ──
function scrub(text) {
  if (!text) return "";
  return text
    // Israeli phone numbers (0xx-xxxxxxx, 05x xxxxxxx, +972...)
    .replace(/(?:\+?972[-\s]?|0)\d(?:[-\s]?\d){7,9}/g, "[טלפון]")
    // any remaining standalone 7+ digit run (national-id / long numbers)
    .replace(/\b\d{7,}\b/g, "[מספר]")
    .replace(/[ \t]+\n/g, "\n")
    .trim();
}

// ── date "DD/MM/YYYY HH:MM" → ISO (local, no TZ shift) ──
function toIso(raw) {
  const m = (raw || "").trim().match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{1,2}):(\d{2})/);
  if (!m) return null;
  const [, dd, mm, yyyy, hh, min] = m;
  return `${yyyy}-${mm}-${dd}T${hh.padStart(2, "0")}:${min}:00`;
}

// ── run ──
const raw = fs.readFileSync(CSV_PATH, "utf8").replace(/^﻿/, "");
const rows = parseCsv(raw);
const header = rows[0];
const col = (needle) => header.findIndex((h) => h.includes(needle));

const idx = {
  num: col("מספר פניה"),
  created: col("נוצר ב"),
  status: col("סטטוס"),
  dept: col("מחלקה"),
  subject: col("נושא"),
  desc: col("תיאור"),
  street: col("רחוב"),
  house: col("מספר בית"),
  reporter: col("פונה"),
  station: col("תחנה"),
};

const seenIds = new Set();
const records = [];
let skipped = 0;

for (const r of rows.slice(1)) {
  const num = (r[idx.num] || "").trim();
  const iso = toIso(r[idx.created]);
  if (!num || !iso) { skipped++; continue; }
  const id = seenIds.has(num) ? `${num}-${records.length}` : num;
  seenIds.add(id);
  const stationRaw = (r[idx.station] || "").trim();
  records.push({
    id,
    createdAt: iso,
    rawStatus: (r[idx.status] || "").trim(),
    rawDepartment: (r[idx.dept] || "").trim(),
    subject: (r[idx.subject] || "").trim(),
    description: scrub(r[idx.desc] || ""),
    street: (r[idx.street] || "").trim(),
    houseNumber: (r[idx.house] || "").trim(),
    reporter: pseudonym(r[idx.reporter]),
    station: stationRaw || null,
  });
}

// newest first (matches the CSV's natural ordering)
records.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

const banner = `// ⚠️  GENERATED FILE — do not edit by hand.
// Produced by scripts/build-seed.mjs from the real CSV. PII-safe:
// caller names pseudonymized, national-IDs dropped, phone numbers scrubbed.
// Regenerate:  node scripts/build-seed.mjs`;

const body = `import type { RawSeedComplaint } from "./types";

${banner}
export const RAW_COMPLAINTS: RawSeedComplaint[] = ${JSON.stringify(records, null, 2)};
`;

fs.writeFileSync(OUT_PATH, body, "utf8");
console.log(`✔ wrote ${records.length} complaints → data/seed/complaints.generated.ts`);
if (skipped) console.log(`  (skipped ${skipped} rows without a complaint number / date)`);
