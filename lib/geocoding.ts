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

const RG = { minLat: 32.03, maxLat: 32.12, minLon: 34.78, maxLon: 34.86 } as const;

function isInRamatGan(coord: [number, number]): boolean {
  const [lat, lon] = coord;
  return lat >= RG.minLat && lat <= RG.maxLat && lon >= RG.minLon && lon <= RG.maxLon;
}

/**
 * Geocode an address using Photon (photon.komoot.io).
 * Returns the first result within Ramat Gan, or null if not found.
 * Works from both browser and server without IP blocking or rate limits.
 */
export async function geocodeAddress(
  query: string,
): Promise<[number, number] | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  const url =
    `https://photon.komoot.io/api/` +
    `?q=${encodeURIComponent(trimmed + ", רמת גן")}` +
    `&lat=32.08&lon=34.83&limit=5`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  let res: Response;
  try {
    res = await fetch(url, { signal: controller.signal });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) return null;

  const data = (await res.json()) as {
    features: Array<{ geometry: { coordinates: [number, number] } }>;
  };

  for (const f of data.features) {
    // Photon GeoJSON uses [lon, lat] order
    const [lon, lat] = f.geometry.coordinates;
    const coord: [number, number] = [lat, lon];
    if (isInRamatGan(coord)) return coord;
  }
  return null;
}

/**
 * Compute a road-following route between waypoints using the OSRM public server.
 * Returns [lat, lon][] coordinates suitable for Leaflet Polyline.
 */
export async function routeViaOsrm(
  waypoints: [number, number][],
): Promise<[number, number][]> {
  if (waypoints.length < 2) return [];

  // OSRM expects {lon},{lat} pairs separated by semicolons
  const coordStr = waypoints.map(([lat, lon]) => `${lon},${lat}`).join(";");
  const url =
    `https://router.project-osrm.org/route/v1/driving/${coordStr}` +
    `?overview=full&geometries=geojson`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  let res: Response;
  try {
    res = await fetch(url, { signal: controller.signal });
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
  if (!res.ok) return [];

  const data = (await res.json()) as {
    code: string;
    routes: Array<{ geometry: { coordinates: [number, number][] } }>;
  };

  if (data.code !== "Ok" || !data.routes?.[0]) return [];

  // Convert OSRM GeoJSON [lon, lat] → [lat, lon] for Leaflet
  return data.routes[0].geometry.coordinates.map(([lon, lat]) => [lat, lon]);
}
