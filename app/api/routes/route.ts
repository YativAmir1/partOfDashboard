import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { put, get } from "@vercel/blob";
import type { RouteTemplate, RouteSchedule, IncidentType, DayKey } from "@/lib/types";

export const maxDuration = 300;

const DATA_PATH = join(process.cwd(), "data", "custom-routes.json");
const BLOB_KEY = "custom-routes.json";

interface CustomRoutesFile {
  templates: RouteTemplate[];
  schedules: RouteSchedule[];
  coordsMap: Record<string, [number, number][]>;
  // Edits to base schedules (defined in data/routes.json, not writable at runtime)
  // are persisted here as per-schedule overrides, keyed by schedule id.
  overrides: Record<string, Partial<RouteSchedule>>;
}

const EMPTY: CustomRoutesFile = { templates: [], schedules: [], coordsMap: {}, overrides: {} };

async function seedBlob(): Promise<CustomRoutesFile> {
  let seed: CustomRoutesFile;
  try {
    seed = JSON.parse(readFileSync(DATA_PATH, "utf-8")) as CustomRoutesFile;
  } catch {
    seed = { ...EMPTY };
  }
  try {
    await put(BLOB_KEY, JSON.stringify(seed, null, 2), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "application/json",
    });
  } catch {
    // Seeding failed — will retry on next request
  }
  return seed;
}

// Guarantee every optional collection exists so callers never hit `undefined`,
// even for files written before `overrides` was introduced.
function normalize(data: Partial<CustomRoutesFile>): CustomRoutesFile {
  return {
    templates: data.templates ?? [],
    schedules: data.schedules ?? [],
    coordsMap: data.coordsMap ?? {},
    overrides: data.overrides ?? {},
  };
}

async function readData(): Promise<CustomRoutesFile> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      return normalize(JSON.parse(readFileSync(DATA_PATH, "utf-8")));
    } catch {
      return { ...EMPTY };
    }
  }
  try {
    const result = await get(BLOB_KEY, { access: "private" });
    if (!result || result.statusCode !== 200 || !result.stream) {
      return normalize(await seedBlob());
    }
    return normalize(await new Response(result.stream).json());
  } catch {
    return { ...EMPTY };
  }
}

async function writeData(data: CustomRoutesFile): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
    return;
  }
  await put(BLOB_KEY, JSON.stringify(data, null, 2), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
  });
}

export async function GET() {
  const data = await readData();
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scheduleId = searchParams.get("scheduleId");
  if (!scheduleId) {
    return NextResponse.json({ error: "Missing scheduleId" }, { status: 400 });
  }

  let updates: Partial<RouteSchedule>;
  try {
    updates = (await req.json()) as Partial<RouteSchedule>;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const data = await readData();
  const idx = data.schedules.findIndex((s) => s.id === scheduleId);

  let saved: RouteSchedule | Partial<RouteSchedule>;
  if (idx === -1) {
    // Not a custom schedule — it's a base schedule from data/routes.json, which we
    // can't write back to at runtime. Persist the change as an override instead.
    data.overrides[scheduleId] = {
      ...data.overrides[scheduleId],
      ...updates,
      id: scheduleId,
    };
    saved = data.overrides[scheduleId];
  } else {
    // Never let a caller overwrite the schedule's own ID
    data.schedules[idx] = { ...data.schedules[idx], ...updates, id: scheduleId };
    saved = data.schedules[idx];
  }

  try {
    await writeData(data);
  } catch {
    return NextResponse.json({ error: "שגיאה בשמירת הנתונים. אנא נסה שנית." }, { status: 500 });
  }

  return NextResponse.json({ schedule: saved });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scheduleId = searchParams.get("scheduleId");
  if (!scheduleId) {
    return NextResponse.json({ error: "Missing scheduleId" }, { status: 400 });
  }

  const data = await readData();
  const schedule = data.schedules.find((s) => s.id === scheduleId);
  if (!schedule) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { templateId } = schedule;
  data.schedules = data.schedules.filter((s) => s.id !== scheduleId);
  data.templates = data.templates.filter((t) => t.id !== templateId);
  delete data.coordsMap[templateId];

  try {
    await writeData(data);
  } catch {
    return NextResponse.json({ error: "שגיאה בשמירת הנתונים. אנא נסה שנית." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

interface CreateRouteBody {
  name: string;
  category: IncidentType;
  estimatedDurationMin: number;
  streets: string[];
  coords: [number, number][];
  assignedTeam: string;
  teamRef?: string;
  vehicleRef?: string;
  dayOfWeek: DayKey[];
  scheduledStartTime: string;
  scheduledEndTime: string;
  requiredCompletionPct: number;
}


export async function POST(req: NextRequest) {
  let body: CreateRouteBody;
  try {
    body = await req.json() as CreateRouteBody;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const {
    name,
    category,
    estimatedDurationMin,
    streets,
    coords,
    assignedTeam,
    teamRef,
    vehicleRef,
    dayOfWeek,
    scheduledStartTime,
    scheduledEndTime,
    requiredCompletionPct,
  } = body;

  if (!Array.isArray(coords) || coords.length < 2) {
    return NextResponse.json(
      { error: "לא ניתן לאתר את הכתובות שהוזנו. אנא בדוק את הכתובות ונסה שנית." },
      { status: 422 },
    );
  }

  const now = Date.now();
  const templateId = `tmpl-custom-${now}`;
  const scheduleId = `sch-custom-${now}`;

  const template: RouteTemplate = {
    id: templateId,
    name,
    streets,
    category,
    estimatedDurationMin,
  };

  const schedule: RouteSchedule = {
    id: scheduleId,
    templateId,
    dayOfWeek,
    scheduledStartTime,
    scheduledEndTime,
    assignedTeam,
    teamRef,
    vehicleRef,
    requiredCompletionPct,
    complaintThreshold: 3,
    active: true,
  };

  const data = await readData();
  data.templates.push(template);
  data.schedules.push(schedule);
  data.coordsMap[templateId] = coords;

  try {
    await writeData(data);
  } catch {
    return NextResponse.json(
      { error: "שגיאה בשמירת המסלול. אנא נסה שנית." },
      { status: 500 },
    );
  }

  return NextResponse.json({ template, schedule, coords }, { status: 201 });
}
