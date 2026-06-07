import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { put, list } from "@vercel/blob";
import type { RouteTemplate, RouteSchedule, IncidentType, DayKey } from "@/lib/types";

export const maxDuration = 300;

const DATA_PATH = join(process.cwd(), "data", "custom-routes.json");
const BLOB_KEY = "custom-routes.json";

interface CustomRoutesFile {
  templates: RouteTemplate[];
  schedules: RouteSchedule[];
  coordsMap: Record<string, [number, number][]>;
}

async function readData(): Promise<CustomRoutesFile> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      return JSON.parse(readFileSync(DATA_PATH, "utf-8")) as CustomRoutesFile;
    } catch {
      return { templates: [], schedules: [], coordsMap: {} };
    }
  }
  let blobs: { url: string }[];
  try {
    ({ blobs } = await list({ prefix: BLOB_KEY }));
  } catch {
    return { templates: [], schedules: [], coordsMap: {} };
  }
  if (blobs.length === 0) {
    let seed: CustomRoutesFile;
    try {
      seed = JSON.parse(readFileSync(DATA_PATH, "utf-8")) as CustomRoutesFile;
    } catch {
      seed = { templates: [], schedules: [], coordsMap: {} };
    }
    await put(BLOB_KEY, JSON.stringify(seed, null, 2), {
      access: "public",
      addRandomSuffix: false,
      contentType: "application/json",
    });
    return seed;
  }
  const res = await fetch(blobs[0].url, { cache: "no-store" });
  return (await res.json()) as CustomRoutesFile;
}

async function writeData(data: CustomRoutesFile): Promise<void> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
    return;
  }
  await put(BLOB_KEY, JSON.stringify(data, null, 2), {
    access: "public",
    addRandomSuffix: false,
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
  if (idx === -1) {
    return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
  }

  // Never let a caller overwrite the schedule's own ID
  data.schedules[idx] = { ...data.schedules[idx], ...updates, id: scheduleId };
  await writeData(data);

  return NextResponse.json({ schedule: data.schedules[idx] });
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
  await writeData(data);

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
  await writeData(data);

  return NextResponse.json({ template, schedule, coords }, { status: 201 });
}
