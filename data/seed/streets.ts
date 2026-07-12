import type { District } from "@/lib/types";

// ─── Seed layer — street → district map (REVIEW ME) ──────────────────────────
// The real CSV (_ככה זה סבבה.csv) records a street but NO district. This table
// is the bridge: it assigns each of the 88 real streets to one of the 8
// operational areas so real complaints roll up into the district-centric UI.
//
// The assignments below are a best-effort by Ramat Gan geography. They are the
// intended review surface — correct any street that sits in the wrong area and
// the whole system (map counts, sentiment, red-lights, KPIs) updates on the next
// `node scripts/build-seed.mjs`. Streets not found here fall back deterministically
// (see FALLBACK_DISTRICT + districtForStreet) and are logged by the generator.

export const STREET_TO_DISTRICT: Record<string, District> = {
  // ── מתחם הבורסה (Bursa District) — west / diamond-exchange & business ──
  "ז'בוטינסקי": "Bursa District",
  "דרך אבא הלל": "Bursa District",
  "תלפיות": "Bursa District",
  "רמז": "Bursa District",
  "מל\"ל": "Bursa District",
  "ההגנה כ\"א": "Bursa District",
  "אלוף דוד": "Bursa District",

  // ── מרכז העיר (City Center) ──
  "ביאליק": "City Center",
  "ארלוזורוב": "City Center",
  "הרצל": "City Center",
  "רוקח": "City Center",
  "קריניצי": "City Center",
  "חיבת ציון": "City Center",
  "נורדאו": "City Center",
  "הרב לוין": "City Center",
  "שלום עליכם": "City Center",
  "ירמיהו": "City Center",
  "אחד העם": "City Center",
  "שד' ירושלים": "City Center",
  "בן אליעזר אריה": "City Center",
  "רימלט": "City Center",
  "שד' הקונגרס": "City Center",
  "קלוזנר": "City Center",
  "אינשטיין": "City Center",
  "ברודצקי": "City Center",
  "גרנדוס": "City Center",
  "האם": "City Center",
  "מרים": "City Center",
  "שמחה": "City Center",

  // ── שיכון ותיקים (Shikun Vatikim) — central-north veteran housing ──
  "עלומים": "Shikun Vatikim",
  "המתמיד": "Shikun Vatikim",
  "בית אל": "Shikun Vatikim",
  "אלימלך": "Shikun Vatikim",
  "בועז": "Shikun Vatikim",
  "גדעון": "Shikun Vatikim",
  "זוהר": "Shikun Vatikim",
  "אלונים": "Shikun Vatikim",
  "החייל": "Shikun Vatikim",

  // ── מרום נווה (Marom Nave) — north ──
  "מעלה הבנים": "Marom Nave",
  "בני הנביאים": "Marom Nave",
  "הראובני": "Marom Nave",
  "אביגיל": "Marom Nave",
  "הרימון": "Marom Nave",
  "הזיתים": "Marom Nave",
  "רועי קליין": "Marom Nave",
  "הרי הגלעד": "Marom Nave",

  // ── הפארק הלאומי (National Park) — south, around the park ──
  "שד' הילד": "National Park",
  "עזריאל": "National Park",
  "מלכי צדק": "National Park",
  "רש\"י": "National Park",
  "הרא\"ה": "National Park",
  "שד' אהרון קציר": "National Park",
  "שד' הנרקיסים": "National Park",
  "התפוצות": "National Park",
  "מוצא": "National Park",
  "מטולה": "National Park",
  "סטרומה": "National Park",
  "רחובות הנהר": "National Park",
  "עוזיאל": "National Park",
  "הנח\"ל כ\"א": "National Park",
  "בן גוריון": "National Park",
  "דרך בן גוריון": "National Park",

  // ── תל השומר (Tel Hashomer) — eastern panhandle ──
  "עמק החולה": "Tel Hashomer",
  "נוה יהושע": "Tel Hashomer",
  "מצדה": "Tel Hashomer",
  "תל חי": "Tel Hashomer",
  "גורי יהודה": "Tel Hashomer",
  "ארנון": "Tel Hashomer",
  "רפאל איתן": "Tel Hashomer",
  "רא\"ל דן שומרון": "Tel Hashomer",
  "אלכסנדרוני": "Tel Hashomer",
  "סיירת דוכיפת": "Tel Hashomer",
  "רפאל": "Tel Hashomer",
  "אלברט מנדלר": "Tel Hashomer",
  "פבריגט": "Tel Hashomer",

  // ── רמת חן (Ramat Chen) — west / south-west toward the Yarkon ──
  "הירדן": "Ramat Chen",
  "ד\"ר אליהו": "Ramat Chen",
  "חרות": "Ramat Chen",
  "ברנשטיין פרץ": "Ramat Chen",
  "עזריה": "Ramat Chen",
  "ספיר יוסף": "Ramat Chen",
  "איליאן (חזון אי\"ש)": "Ramat Chen",
  "צומת לבבי": "Ramat Chen",
  "תש\"י": "Ramat Chen",
  "שלם": "Ramat Chen",
  "דרך יצחק רבין": "Ramat Chen",
  "דרך נגבה": "Ramat Chen",

  // ── אזור התעשייה (Industrial Zone) — south-east ──
  "המלאכה": "Industrial Zone",
  "המעגל": "Industrial Zone",
  "סמ' הבאר": "Industrial Zone",
  "המעל": "Industrial Zone",
  "העמל": "Industrial Zone",
  "קולטן": "Industrial Zone",
  "מעלה": "Industrial Zone",
};

/** Where streets not present in the map above are counted (also used by the generator's log). */
export const FALLBACK_DISTRICT: District = "City Center";

/**
 * Resolve a raw street name to a district. Trims/normalizes, then falls back
 * deterministically so an unmapped street is always counted somewhere (and the
 * generator logs it so it can be promoted into STREET_TO_DISTRICT above).
 */
export function districtForStreet(rawStreet: string): { district: District; mapped: boolean } {
  const street = rawStreet.trim();
  const hit = STREET_TO_DISTRICT[street];
  if (hit) return { district: hit, mapped: true };
  return { district: FALLBACK_DISTRICT, mapped: false };
}
