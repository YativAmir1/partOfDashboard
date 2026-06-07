export function haversineDistance(
  a: [number, number],
  b: [number, number],
): number {
  const R = 6371000;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const dlat = ((b[0] - a[0]) * Math.PI) / 180;
  const dlng = ((b[1] - a[1]) * Math.PI) / 180;
  const x =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlng / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

export function samplePolyline(
  coords: [number, number][],
  metersPerPoint: number,
): [number, number][] {
  if (coords.length === 0) return [];
  const result: [number, number][] = [coords[0]];
  let accumulated = 0;

  for (let i = 1; i < coords.length; i++) {
    const segDist = haversineDistance(coords[i - 1], coords[i]);
    accumulated += segDist;
    if (accumulated >= metersPerPoint) {
      result.push(coords[i]);
      accumulated = 0;
    }
  }

  const last = coords[coords.length - 1];
  if (result[result.length - 1] !== last) {
    result.push(last);
  }
  return result;
}

function isFullAddress(input: string): boolean {
  return /\d+\s*$/.test(input.trim());
}

// Ramat Gan bounding box — kept intentionally generous so that street nodes
// near the municipal boundary are never clipped. The admin-boundary Overpass
// query is the real guard against neighbouring-city results.
const RG = { minLat: 32.03, maxLat: 32.12, minLon: 34.78, maxLon: 34.86 } as const;
// Nominatim viewbox format: left,top,right,bottom (west,north,east,south)
const RG_VIEWBOX = `${RG.minLon},${RG.maxLat},${RG.maxLon},${RG.minLat}`;

function isInRamatGan(coord: [number, number]): boolean {
  const [lat, lon] = coord;
  return lat >= RG.minLat && lat <= RG.maxLat && lon >= RG.minLon && lon <= RG.maxLon;
}

async function nominatimGeocode(
  query: string,
): Promise<[number, number] | null> {
  // bounded=1 forces Nominatim to return only results within the viewbox
  const url =
    `https://nominatim.openstreetmap.org/search` +
    `?q=${encodeURIComponent(query)}` +
    `&format=json&limit=5&accept-language=he` +
    `&countrycodes=il&viewbox=${RG_VIEWBOX}&bounded=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "RamatGanDashboard/1.0" },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as Array<{ lat: string; lon: string }>;
  for (const item of data) {
    const coord: [number, number] = [parseFloat(item.lat), parseFloat(item.lon)];
    if (isInRamatGan(coord)) return coord;
  }
  return null;
}

/** Chain OSM ways end-to-end by matching shared node IDs.
 *  When no exact topological match exists, falls back to the geographically
 *  nearest endpoint so the resulting path stays continuous.
 */
function chainWayNodes(
  ways: number[][],
  nodeMap: Map<number, [number, number]>,
): number[] {
  if (ways.length === 0) return [];
  if (ways.length === 1) return ways[0];

  const result = [...ways[0]];
  const remaining = ways.slice(1).map((w) => [...w]);

  while (remaining.length > 0) {
    const tail = result[result.length - 1];
    let connected = false;

    // First pass: exact topological match on shared endpoint node ID
    for (let i = 0; i < remaining.length; i++) {
      const w = remaining[i];
      if (w[0] === tail) {
        result.push(...w.slice(1));
        remaining.splice(i, 1);
        connected = true;
        break;
      }
      if (w[w.length - 1] === tail) {
        result.push(...[...w].reverse().slice(1));
        remaining.splice(i, 1);
        connected = true;
        break;
      }
    }

    if (!connected) {
      // Second pass: pick the remaining way whose nearest endpoint is
      // geographically closest to the current tail, then connect to it.
      const tailCoord = nodeMap.get(tail);
      if (!tailCoord) {
        for (const w of remaining) result.push(...w);
        break;
      }
      let bestDist = Infinity;
      let bestIdx = 0;
      let bestReverse = false;
      for (let i = 0; i < remaining.length; i++) {
        const w = remaining[i];
        const startCoord = nodeMap.get(w[0]);
        const endCoord = nodeMap.get(w[w.length - 1]);
        if (startCoord) {
          const d = haversineDistance(tailCoord, startCoord);
          if (d < bestDist) { bestDist = d; bestIdx = i; bestReverse = false; }
        }
        if (endCoord) {
          const d = haversineDistance(tailCoord, endCoord);
          if (d < bestDist) { bestDist = d; bestIdx = i; bestReverse = true; }
        }
      }
      // If the nearest way is more than 150 m away the remaining ways are a
      // disconnected segment — stop chaining to prevent the path from jumping
      // to another area and doubling back.
      if (bestDist > 150) break;
      const best = remaining[bestIdx];
      result.push(...(bestReverse ? [...best].reverse() : best));
      remaining.splice(bestIdx, 1);
    }
  }

  return result;
}

// Highway types used by field teams. Excludes service roads and parking aisles,
// which share street names with main carriageways and cause U-turn backtracking
// when chained together.
const DRIVABLE_HIGHWAY =
  "primary|primary_link|secondary|secondary_link|tertiary|tertiary_link" +
  "|residential|unclassified|living_street|pedestrian";

/** Run an Overpass query and return chained + filtered coordinates. */
async function fetchOverpass(query: string): Promise<[number, number][]> {
  const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "RamatGanDashboard/1.0" },
  });
  if (!res.ok) return [];

  type OsmElement =
    | { type: "node"; id: number; lat: number; lon: number }
    | { type: "way"; id: number; nodes: number[] };
  const raw = (await res.json()) as { elements?: OsmElement[] };
  const elements: OsmElement[] = Array.isArray(raw.elements) ? raw.elements : [];
  if (elements.length === 0) return [];

  const nodeMap = new Map<number, [number, number]>();
  for (const el of elements) {
    if (el.type === "node") nodeMap.set(el.id, [el.lat, el.lon]);
  }

  const ways = elements.filter(
    (el): el is Extract<OsmElement, { type: "way" }> =>
      el.type === "way" && Array.isArray(el.nodes) && el.nodes.length > 0,
  );
  if (ways.length === 0) return [];

  const chainedNodeIds = chainWayNodes(ways.map((w) => w.nodes), nodeMap);

  const coords: [number, number][] = [];
  for (const nodeId of chainedNodeIds) {
    const coord = nodeMap.get(nodeId);
    if (coord && isInRamatGan(coord)) coords.push(coord);
  }
  return coords;
}

async function overpassStreetGeometry(
  streetName: string,
): Promise<[number, number][]> {
  // Strategy 1 — admin boundary (most precise: excludes streets with the same
  // name in Bnei Brak / Givat Shmuel). Requires the Ramat Gan boundary relation
  // to be present in OSM.
  const adminQuery = [
    `[out:json][bbox:${RG.minLat},${RG.minLon},${RG.maxLat},${RG.maxLon}];`,
    `area["name"="רמת גן"]["admin_level"="8"]->.rg;`,
    `way["name"="${streetName}"]["highway"~"^(${DRIVABLE_HIGHWAY})$"](area.rg);`,
    `(._;>;);out body;`,
  ].join("");

  const fromAdmin = await fetchOverpass(adminQuery);
  if (fromAdmin.length > 0) return fromAdmin;

  // Strategy 2 — bounding-box fallback (used when the admin relation isn't
  // available in OSM). Still excludes service roads via the highway filter.
  const bboxQuery = [
    `[out:json];`,
    `way["name"="${streetName}"]["highway"~"^(${DRIVABLE_HIGHWAY})$"]`,
    `(${RG.minLat},${RG.minLon},${RG.maxLat},${RG.maxLon});`,
    `(._;>;);out body;`,
  ].join("");

  return fetchOverpass(bboxQuery);
}

// ─── Smart polyline helpers ───────────────────────────────────────────────────

/** Index in coords whose distance to point is smallest */
function closestIndex(
  point: [number, number],
  coords: [number, number][],
): number {
  let minDist = Infinity;
  let minIdx = 0;
  for (let i = 0; i < coords.length; i++) {
    const d = haversineDistance(point, coords[i]);
    if (d < minDist) {
      minDist = d;
      minIdx = i;
    }
  }
  return minIdx;
}

/** Indices (idxA, idxB) of the closest pair between two polylines */
function findClosestPair(
  a: [number, number][],
  b: [number, number][],
): [number, number] {
  let minDist = Infinity;
  let idxA = 0;
  let idxB = 0;
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b.length; j++) {
      const d = haversineDistance(a[i], b[j]);
      if (d < minDist) {
        minDist = d;
        idxA = i;
        idxB = j;
      }
    }
  }
  return [idxA, idxB];
}

/** Extract coords[from..to] inclusive, reversing if from > to */
function slicePath(
  coords: [number, number][],
  from: number,
  to: number,
): [number, number][] {
  if (from <= to) return coords.slice(from, to + 1);
  const out: [number, number][] = [];
  for (let i = from; i >= to; i--) out.push(coords[i]);
  return out;
}

/**
 * Stitch multiple address segments into a single natural-looking polyline.
 *
 * For each pair of consecutive segments the algorithm finds the closest pair
 * of nodes (the "intersection"), trims each segment at that point, and joins
 * them there instead of jumping between arbitrary endpoints.
 */
export function buildSmartPolyline(
  segments: [number, number][][],
): [number, number][] {
  const segs = segments.filter((s) => s.length > 0);
  if (segs.length === 0) return [];
  if (segs.length === 1) return segs[0];

  // Pre-compute connection points between every consecutive pair
  const connections: Array<{ exitIdx: number; entryIdx: number }> = [];
  for (let i = 0; i < segs.length - 1; i++) {
    const a = segs[i];
    const b = segs[i + 1];
    if (a.length === 1 && b.length === 1) {
      connections.push({ exitIdx: 0, entryIdx: 0 });
    } else if (a.length === 1) {
      connections.push({ exitIdx: 0, entryIdx: closestIndex(a[0], b) });
    } else if (b.length === 1) {
      connections.push({ exitIdx: closestIndex(b[0], a), entryIdx: 0 });
    } else {
      const [ea, eb] = findClosestPair(a, b);
      connections.push({ exitIdx: ea, entryIdx: eb });
    }
  }

  const result: [number, number][] = [];

  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i];

    if (seg.length === 1) {
      result.push(seg[0]);
      continue;
    }

    // Entry: for the first segment enter from the end that is geographically
    // farthest from the exit point, so we traverse toward the intersection.
    let entryIdx: number;
    if (i === 0) {
      const exitPt = seg[connections[0].exitIdx];
      const dFromStart = haversineDistance(seg[0], exitPt);
      const dFromEnd = haversineDistance(seg[seg.length - 1], exitPt);
      entryIdx = dFromStart >= dFromEnd ? 0 : seg.length - 1;
    } else {
      entryIdx = connections[i - 1].entryIdx;
    }

    // Exit: for the last segment go to the end geographically farthest from entry.
    let exitIdx: number;
    if (i === segs.length - 1) {
      const entryPt = seg[entryIdx];
      const dToStart = haversineDistance(seg[0], entryPt);
      const dToEnd = haversineDistance(seg[seg.length - 1], entryPt);
      exitIdx = dToStart >= dToEnd ? 0 : seg.length - 1;
    } else {
      exitIdx = connections[i].exitIdx;
    }

    for (const pt of slicePath(seg, entryIdx, exitIdx)) {
      result.push(pt);
    }
  }

  return result;
}

// ─── Public resolvers ─────────────────────────────────────────────────────────

/**
 * Returns raw (non-sampled) coordinates for an address, strictly within Ramat Gan.
 * Used together with buildSmartPolyline so intersection logic works on the
 * full geometry rather than on already-decimated sample points.
 */
export async function resolveAddressToRawCoords(
  input: string,
): Promise<[number, number][]> {
  const trimmed = input.trim();
  if (!trimmed) return [];

  if (isFullAddress(trimmed)) {
    // Search with city name; bounded viewbox ensures Ramat Gan only
    const coord = await nominatimGeocode(`${trimmed}, רמת גן`);
    return coord ? [coord] : [];
  } else {
    // Overpass is the preferred source — returns full street geometry
    const coords = await overpassStreetGeometry(trimmed);
    if (coords.length > 0) return coords;
    // Nominatim fallback for street names (still bounded)
    const coord = await nominatimGeocode(`רחוב ${trimmed}, רמת גן`);
    return coord ? [coord] : [];
  }
}

/** Legacy: resolve and immediately sample at 15 m intervals */
export async function resolveAddressToCoords(
  input: string,
): Promise<[number, number][]> {
  const trimmed = input.trim();
  if (!trimmed) return [];

  if (isFullAddress(trimmed)) {
    const coord = await nominatimGeocode(`${trimmed}, רמת גן`);
    return coord ? [coord] : [];
  } else {
    const coords = await overpassStreetGeometry(trimmed);
    if (coords.length > 0) return samplePolyline(coords, 15);
    const coord = await nominatimGeocode(`רחוב ${trimmed}, רמת גן`);
    return coord ? [coord] : [];
  }
}
