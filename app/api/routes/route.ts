import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { resolveAddressToRawCoords, buildSmartPolyline, samplePolyline } from "@/lib/geocoding";
import type { RouteTemplate, RouteSchedule, IncidentType, DayKey } from "@/lib/types";

const DATA_PATH = join(process.cwd(), "data", "custom-routes.json");

interface CustomRoutesFile {
  templates: RouteTemplate[];
  schedules: RouteSchedule[];
  coordsMap: Record<string, [number, number][]>;
}

function readData(): CustomRoutesFile {
  try {
    return JSON.parse(readFileSync(DATA_PATH, "utf-8")) as CustomRoutesFile;
  } catch {
    return { templates: [], schedules: [], coordsMap: {} };
  }
}

function writeData(data: CustomRoutesFile): void {
  writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET() {
  const data = readData();
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

  const data = readData();
  const idx = data.schedules.findIndex((s) => s.id === scheduleId);
  if (idx === -1) {
    return NextResponse.json({ error: "Schedule not found" }, { status: 404 });
  }

  // Never let a caller overwrite the schedule's own ID
  data.schedules[idx] = { ...data.schedules[idx], ...updates, id: scheduleId };
  writeData(data);

  return NextResponse.json({ schedule: data.schedules[idx] });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scheduleId = searchParams.get("scheduleId");
  if (!scheduleId) {
    return NextResponse.json({ error: "Missing scheduleId" }, { status: 400 });
  }

  const data = readData();
  const schedule = data.schedules.find((s) => s.id === scheduleId);
  if (!schedule) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { templateId } = schedule;
  data.schedules = data.schedules.filter((s) => s.id !== scheduleId);
  data.templates = data.templates.filter((t) => t.id !== templateId);
  delete data.coordsMap[templateId];
  writeData(data);

  return NextResponse.json({ ok: true });
}

interface CreateRouteBody {
  name: string;
  category: IncidentType;
  estimatedDurationMin: number;
  startAddress: string;
  stops: string[];
  endAddress: string;
  assignedTeam: string;
  teamRef?: string;
  vehicleRef?: string;
  dayOfWeek: DayKey[];
  scheduledStartTime: string;
  scheduledEndTime: string;
  requiredCompletionPct: number;
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

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
    startAddress,
    stops,
    endAddress,
    assignedTeam,
    teamRef,
    vehicleRef,
    dayOfWeek,
    scheduledStartTime,
    scheduledEndTime,
    requiredCompletionPct,
  } = body;

  const allInputs = [startAddress, ...stops.filter(Boolean), endAddress];
  const allCoordGroups: [number, number][][] = [];

  for (let i = 0; i < allInputs.length; i++) {
    if (i > 0) await delay(1100); // Nominatim rate limit: 1 req/sec
    const coords = await resolveAddressToRawCoords(allInputs[i]);
    allCoordGroups.push(coords);
  }

  // Stitch segments at their natural intersection points, then sample
  const polyline: [number, number][] = samplePolyline(
    buildSmartPolyline(allCoordGroups),
    15,
  );

  if (polyline.length < 2) {
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
    streets: allInputs,
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

  const data = readData();
  data.templates.push(template);
  data.schedules.push(schedule);
  data.coordsMap[templateId] = polyline;
  writeData(data);

  return NextResponse.json({ template, schedule, coords: polyline }, { status: 201 });
}
