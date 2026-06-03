"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, Tooltip, Pane } from "react-leaflet";
import {
  markers, CATEGORY_COLORS, CATEGORY_LABELS,
  routeComplaints, routeExecutions, routeSchedules, routeTemplates,
} from "@/lib/data";
import type { District, IncidentStatus, IncidentType, MapMarker } from "@/lib/types";
import { useHazard } from "@/context/HazardContext";
import { districtLabel, priorityLabel, statusLabel } from "@/lib/hebrew";
import { riskPredictions } from "@/lib/riskPredictions";
import "leaflet/dist/leaflet.css";
import { HeatmapLayer } from "@/components/map/HeatmapLayer";
import { RouteLayer } from "@/components/map/RouteLayer";
import { AnimatedTeamLayer } from "@/components/map/AnimatedTeamLayer";
import { AnimatedVehicleLayer } from "@/components/map/AnimatedVehicleLayer";
import type { MapViewMode } from "@/components/map/MapViewToggle";
import type { RouteMapFilter } from "@/lib/types";

interface Props {
  activeCategories: Set<IncidentType>;
  activeLayers: Set<string>;
  statusFilters?: Set<string>;
  selectedDistrict?: District | null;
  onSelectDistrict?: (district: District | null) => void;
  viewMode?: MapViewMode;
  showRoutes?: boolean;
  routeFilter?: RouteMapFilter;
  focusedRouteScheduleId?: string | null;
}

// ─── Icon factory ─────────────────────────────────────────────────────────────

const CATEGORY_EMOJI: Record<string, string> = {
  waste:     "🗑",
  traffic:   "🚦",
  safety:    "🚨",
  utilities: "⚡",
  parks:     "🌳",
};

function makeIcon(
  emoji: string,
  bg: string,
  size: number,
  opacity: number,
  highlighted: boolean,
  anim = "",
  status?: string,
): L.DivIcon {
  const border = highlighted
    ? "2.5px solid #fff"
    : "1.5px solid rgba(255,255,255,0.35)";
  const shadow = highlighted
    ? "0 0 8px rgba(255,255,255,0.45), 0 2px 6px rgba(0,0,0,0.55)"
    : "0 1px 5px rgba(0,0,0,0.5)";
  const fs = Math.round(size * 0.5);

  const innerSpan = `<span style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:50%;background:${bg};border:${border};box-shadow:${shadow};font-size:${fs}px;line-height:1;opacity:${opacity};${anim}">${emoji}</span>`;

  const ringColor = status === "open" ? "#d96350" : status === "in_progress" ? "#1f5fa6" : null;
  if (ringColor) {
    const bw = 2, pad = 3;
    const outer = size + 2 * (bw + pad);
    const pingLayer = status === "open"
      ? `<span style="position:absolute;inset:0;border-radius:50%;background:rgba(217,99,80,0.45);animation:complaint-ping 1.8s ease-out infinite;pointer-events:none;"></span>`
      : "";
    return L.divIcon({
      html: `<div style="position:relative;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;border:${bw}px solid ${ringColor};padding:${pad}px;box-sizing:content-box;">${pingLayer}${innerSpan}</div>`,
      className:   "",
      iconSize:    [outer, outer],
      iconAnchor:  [outer >> 1, outer >> 1],
      popupAnchor: [0, -(outer >> 1) - 3],
    });
  }

  return L.divIcon({
    html: innerSpan,
    className:   "",
    iconSize:    [size, size],
    iconAnchor:  [size >> 1, size >> 1],
    popupAnchor: [0, -(size >> 1) - 3],
  });
}

// ─── Static overlay data ──────────────────────────────────────────────────────

const STATUS_OPACITY: Record<string, number> = {
  open: 1, in_progress: 0.75, resolved: 0.45,
};

const OVERLAY_STATUS_LABELS: Record<string, string> = {
  active: "פעיל",
  alert: "התראה",
  critical: "קריטי",
  ok: "תקין",
  standby: "בהמתנה",
};

const SMART_BINS = [
  { id: "BIN-01", lat: 32.0810, lng: 34.8090, label: "פח חכם #14 — מרכז העיר",       fill: 38, status: "ok"       },
  { id: "BIN-02", lat: 32.0870, lng: 34.8160, label: "פח חכם #27 — מתחם הבורסה",     fill: 72, status: "ok"       },
  { id: "BIN-03", lat: 32.0920, lng: 34.8190, label: "פח חכם #31 — מרום נווה",       fill: 87, status: "alert"    },
  { id: "BIN-04", lat: 32.0950, lng: 34.8230, label: "פח חכם #38 — מרום נווה",       fill: 91, status: "alert"    },
  { id: "BIN-05", lat: 32.0960, lng: 34.8260, label: "פח חכם #42 — מרום נווה",       fill: 94, status: "critical" },
  { id: "BIN-06", lat: 32.0975, lng: 34.8255, label: "פח חכם #43 — מרום נווה",       fill: 89, status: "alert"    },
  { id: "BIN-07", lat: 32.0830, lng: 34.8150, label: "פח חכם #08 — רמת חן",          fill: 55, status: "ok"       },
  { id: "BIN-08", lat: 32.0780, lng: 34.8100, label: "פח חכם #19 — תל השומר",        fill: 44, status: "ok"       },
  { id: "BIN-09", lat: 32.0750, lng: 34.8120, label: "פח חכם #22 — הפארק הלאומי",    fill: 31, status: "ok"       },
  { id: "BIN-10", lat: 32.0720, lng: 34.8060, label: "פח חכם #05 — שיכון ותיקים",    fill: 67, status: "ok"       },
  { id: "BIN-11", lat: 32.0690, lng: 34.8080, label: "פח חכם #11 — אזור התעשייה",    fill: 48, status: "ok"       },
  { id: "BIN-12", lat: 32.0800, lng: 34.8180, label: "פח חכם #29 — מרכז העיר",       fill: 61, status: "ok"       },
];

const CAMERAS = [
  { id: "CAM-01", lat: 32.0845, lng: 34.8125, label: "מצלמה #04 — צומת מרכז העיר",        event: null       },
  { id: "CAM-02", lat: 32.0865, lng: 34.8145, label: "מצלמה #09 — רחוב מתחם הבורסה",       event: null       },
  { id: "CAM-03", lat: 32.0905, lng: 34.8200, label: "מצלמה #17 — צפון מרום נווה",         event: "overflow" },
  { id: "CAM-04", lat: 32.0940, lng: 34.8245, label: "מצלמה #18 — פארק מרום נווה",         event: "overflow" },
  { id: "CAM-05", lat: 32.0775, lng: 34.8095, label: "מצלמה #02 — דרך תל השומר",           event: null       },
  { id: "CAM-06", lat: 32.0755, lng: 34.8135, label: "מצלמה #06 — כניסה לפארק הלאומי",     event: null       },
  { id: "CAM-07", lat: 32.0820, lng: 34.8075, label: "מצלמה #12 — שער אזור התעשייה",       event: null       },
  { id: "CAM-08", lat: 32.0715, lng: 34.8150, label: "מצלמה #21 — שיכון ותיקים",           event: null       },
  { id: "CAM-09", lat: 32.0685, lng: 34.8105, label: "מצלמה #14 — דרום רמת חן",            event: null       },
  { id: "CAM-10", lat: 32.0835, lng: 34.8175, label: "מצלמה #16 — קניון מרכז העיר",        event: null       },
];

const FIELD_CREWS = [
  { id: "CREW-W3", lat: 32.0925, lng: 34.8215, label: "צוות שפ״ע W-3 — בדרך למרום נווה",       role: "waste"     },
  { id: "CREW-W7", lat: 32.0958, lng: 34.8248, label: "צוות שפ״ע W-7 — בשטח מרום נווה",        role: "waste"     },
  { id: "CREW-M1", lat: 32.0805, lng: 34.8105, label: "צוות תחזוקה M-1 — מרכז העיר",           role: "utilities" },
  { id: "CREW-S2", lat: 32.0765, lng: 34.8130, label: "צוות בטיחות S-2 — תל השומר",            role: "safety"    },
  { id: "CREW-P1", lat: 32.0748, lng: 34.8115, label: "צוות גנים P-1 — הפארק הלאומי",          role: "parks"     },
];

const VEHICLES = [
  { id: "VEH-W3", lat: 32.0930, lng: 34.8220, label: "רכב ניקיון W-3 — פעיל במרום נווה",            status: "active"  },
  { id: "VEH-W7", lat: 32.0955, lng: 34.8250, label: "רכב ניקיון W-7 — פעיל במרום נווה",            status: "active"  },
  { id: "VEH-T1", lat: 32.0815, lng: 34.8108, label: "משאית T-1 — מחסן מרכז העיר",                  status: "standby" },
  { id: "VEH-T2", lat: 32.0783, lng: 34.8092, label: "משאית T-2 — מסלול תל השומר",                  status: "active"  },
  { id: "VEH-V5", lat: 32.0705, lng: 34.8083, label: "ניידת תשתיות V-5 — אזור התעשייה",             status: "standby" },
];


const DISTRICT_AREAS: Record<District, [number, number][]> = {
  "Bursa District": [
    [32.0858, 34.7994],
    [32.0962, 34.7997],
    [32.0974, 34.8072],
    [32.0915, 34.8120],
    [32.0848, 34.8074],
  ],
  "Marom Nave": [
    [32.0884, 34.8171],
    [32.0942, 34.8149],
    [32.1030, 34.8214],
    [32.1024, 34.8344],
    [32.0941, 34.8354],
    [32.0869, 34.8252],
  ],
  "City Center": [
    [32.0768, 34.8038],
    [32.0848, 34.8074],
    [32.0915, 34.8120],
    [32.0884, 34.8171],
    [32.0794, 34.8166],
    [32.0740, 34.8101],
  ],
  "Ramat Chen": [
    [32.0794, 34.8166],
    [32.0869, 34.8252],
    [32.0849, 34.8340],
    [32.0748, 34.8317],
    [32.0711, 34.8231],
  ],
  "Ramat Amidar": [
    [32.0635, 34.8268],
    [32.0667, 34.8330],
    [32.0658, 34.8460],
    [32.0585, 34.8352],
    [32.0586, 34.8280],
  ],
  "Kiryat Borochov": [
    [32.0716, 34.7996],
    [32.0792, 34.8022],
    [32.0782, 34.8086],
    [32.0728, 34.8094],
    [32.0684, 34.8054],
  ],
  "Neve Efraim": [
    [32.0528, 34.8165],
    [32.0586, 34.8126],
    [32.0646, 34.8122],
    [32.0604, 34.8238],
    [32.0548, 34.8234],
  ],
  "Old City": [
    [32.0752, 34.8104],
    [32.0792, 34.8070],
    [32.0848, 34.8074],
    [32.0884, 34.8171],
    [32.0838, 34.8195],
    [32.0782, 34.8152],
  ],
  "North District": [
    [32.0962, 34.7997],
    [32.1075, 34.8018],
    [32.1090, 34.8138],
    [32.1030, 34.8214],
    [32.0974, 34.8072],
  ],
  "National Park": [
    [32.0646, 34.8122],
    [32.0740, 34.8101],
    [32.0711, 34.8231],
    [32.0748, 34.8317],
    [32.0667, 34.8330],
    [32.0604, 34.8238],
  ],
  "Tel Hashomer": [
    [32.0604, 34.8238],
    [32.0667, 34.8330],
    [32.0748, 34.8317],
    [32.0774, 34.8441],
    [32.0658, 34.8460],
    [32.0585, 34.8352],
  ],
  "Shikun Vatikim": [
    [32.0680, 34.7978],
    [32.0768, 34.8038],
    [32.0740, 34.8101],
    [32.0646, 34.8122],
    [32.0624, 34.8020],
  ],
  "Industrial Zone": [
    [32.0624, 34.8020],
    [32.0680, 34.7978],
    [32.0768, 34.8038],
    [32.0740, 34.8101],
    [32.0646, 34.8122],
    [32.0590, 34.8070],
  ],
};

const CAR_ACCIDENT = { lat: 32.0830, lng: 34.8130, cam: "CAM-002" };

function makeHazardIcon(): L.DivIcon {
  return L.divIcon({
    html: `<span style="
      display:flex;align-items:center;justify-content:center;
      width:34px;height:34px;border-radius:50%;
      background:#d96350;border:2.5px solid #fff;
      box-shadow:0 2px 8px rgba(0,0,0,0.5);
      font-size:17px;line-height:1;
      animation:hazard-pulse-ring 1.5s ease-in-out infinite;
    ">🚨</span>`,
    className: "",
    iconSize:    [34, 34],
    iconAnchor:  [17, 17],
    popupAnchor: [0, -22],
  });
}

// ─── Popup metadata helper ────────────────────────────────────────────────────

function getMarkerMeta(m: MapMarker) {
  const sourceMap: Record<string, string> = {
    waste:     "109 CRM",
    traffic:   "מצלמות",
    safety:    "מצלמות",
    utilities: "חיישן IoT",
    parks:     "דוח פיקוח שטח",
  };
  const actionMap: Record<string, string> = {
    waste:     "שיגור צוות איסוף שפ״ע",
    traffic:   "כיוון רמזור / ניתוב תנועה",
    safety:    "בקשת סיור ביטחון",
    utilities: "בדיקה טכנית",
    parks:     "שיגור צוות תחזוקה",
  };
  const ageHours = (Date.now() - new Date(m.lastUpdated).getTime()) / 3_600_000;
  const slaStatus =
    m.status === "resolved" ? "טופל"      :
    ageHours > 48           ? "חריגה" :
    ageHours > 24           ? "בסיכון"  : "במסלול";
  const slaColor =
    slaStatus === "טופל"      ? "#459524" :
    slaStatus === "חריגה" ? "#d96350" : "#f37d00";
  const idNum = parseInt(m.id.replace(/\D/g, ""), 10) || 55;
  return {
    source:     sourceMap[m.category]  ?? "מערכת עירונית",
    action:     actionMap[m.category] ?? "בדיקה ושיוך",
    slaStatus, slaColor,
    confidence: 70 + (idNum % 25),
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function CityMap({
  activeCategories,
  activeLayers,
  statusFilters = new Set(["open", "in_progress"]),
  selectedDistrict,
  onSelectDistrict,
  viewMode = "map",
  showRoutes = false,
  routeFilter = "today",
  focusedRouteScheduleId = null,
}: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const { hazardRevealed } = useHazard();

  const routeComplaintMarkers = useMemo((): MapMarker[] => {
    const execTemplateMap = new Map<string, (typeof routeTemplates)[0]>();
    routeExecutions.forEach((e) => {
      const schedule = routeSchedules.find((s) => s.id === e.scheduleId);
      const template = schedule ? routeTemplates.find((t) => t.id === schedule.templateId) : undefined;
      if (template) execTemplateMap.set(e.id, template);
    });
    return routeComplaints
      .filter((c) => c.lat != null && c.lng != null)
      .map((c) => ({
        id: c.id,
        lat: c.lat!,
        lng: c.lng!,
        category: (c.category ?? execTemplateMap.get(c.executionId)?.category ?? "waste") as IncidentType,
        title: c.description,
        status: "open" as IncidentStatus,
        district: "City Center" as District,
        lastUpdated: c.timestamp,
        aiNote: "",
      }));
  }, []);

  const allMarkers = useMemo(() => [...markers, ...routeComplaintMarkers], [routeComplaintMarkers]);

  const visible = useMemo(
    () => allMarkers.filter((m) =>
      activeCategories.has(m.category) &&
      m.status !== "resolved" &&
      statusFilters.has(m.status)
    ),
    [allMarkers, activeCategories, statusFilters],
  );

  const heatPoints = useMemo(
    () =>
      allMarkers
        .filter((m) =>
          activeCategories.has(m.category) &&
          m.status !== "resolved" &&
          statusFilters.has(m.status)
        )
        .map((m) => ({
          lat: m.lat,
          lng: m.lng,
          intensity: m.status === "open" ? 1.0 : 0.7,
        })),
    [activeCategories, statusFilters],
  );

  const heatOptions = useMemo(
    () => ({
      radius: 52,
      blur: 32,
      gradient: {
        0.1:  "#1f5fa6",
        0.25: "#00b4d8",
        0.45: "#80cc60",
        0.6:  "#e8d840",
        0.75: "#f37d00",
        0.9:  "#d96350",
        1.0:  "#8b1214",
      },
    }),
    [],
  );

  return (
    <MapContainer
      center={[32.0853, 34.8136]}
      zoom={14}
      style={{ width: "100%", height: "100%" }}
      zoomControl
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
        maxZoom={19}
      />

      {activeLayers.has("risk_zone") && riskPredictions.map((prediction) => (
        <Circle
          key={`${prediction.id}-area`}
          center={[prediction.lat, prediction.lng]}
          radius={150 + prediction.expectedRequests * 45}
          pathOptions={{
            color: "#7c3aed",
            fillColor: "#7c3aed",
            fillOpacity: 0.07,
            weight: 1.25,
            opacity: 0.6,
            dashArray: "5 4",
          }}
        />
      ))}

      {Object.entries(DISTRICT_AREAS).map(([district, positions]) => {
        const typedDistrict = district as District;
        const isSelectedArea = selectedDistrict === typedDistrict;

        return (
          <Polygon
            key={district}
            positions={positions}
            eventHandlers={{
              click: () => onSelectDistrict?.(isSelectedArea ? null : typedDistrict),
            }}
            pathOptions={{
              color: isSelectedArea ? "#1f5fa6" : "#7aa3ce",
              fillColor: isSelectedArea ? "#1f5fa6" : "#7aa3ce",
              fillOpacity: isSelectedArea ? 0.18 : 0.035,
              weight: isSelectedArea ? 2.5 : 1,
              opacity: isSelectedArea ? 0.9 : 0.45,
              dashArray: isSelectedArea ? "0" : "5 5",
            }}
          >
            {isSelectedArea && (
              <Tooltip permanent direction="center" opacity={0.95}>
                {districtLabel(district)}
              </Tooltip>
            )}
          </Polygon>
        );
      })}

      {activeLayers.has("risk_zone") && riskPredictions.map((prediction) => (
        <Marker
          key={prediction.id}
          position={[prediction.lat, prediction.lng]}
          icon={makeIcon("!", "#7c3aed", selected === prediction.id ? 30 : 25, 0.96, true)}
          eventHandlers={{
            click:      () => setSelected(prediction.id),
            popupclose: () => setSelected(null),
          }}
        >
          <Popup>
            <div className="min-w-[240px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#7c3aed22] text-[#7c3aed] font-bold">!</span>
                <span className="font-semibold text-sm text-[#1a1a1a] leading-tight">{prediction.title}</span>
              </div>
              <div className="mb-2 px-2 py-1 rounded bg-[#f4f0ff] border border-[#d8c8ff]">
                <span className="text-[10px] text-[#6d28d9] font-semibold">
                  חיזוי סיכונים · {districtLabel(prediction.district)}
                </span>
              </div>
              <div className="space-y-1 text-xs text-[#707070]">
                <div className="flex justify-between"><span>תחום</span><span className="text-[#1a1a1a]">{CATEGORY_LABELS[prediction.type]}</span></div>
                <div className="flex justify-between"><span>עדיפות</span><span className="text-[#1a1a1a]">{priorityLabel(prediction.priority)}</span></div>
                <div className="flex justify-between"><span>סטטוס</span><span className="text-[#1a1a1a]">{statusLabel(prediction.status)}</span></div>
                <div className="flex justify-between"><span>מקור</span><span className="text-[#1a1a1a]">{prediction.dataSource}</span></div>
                <div className="flex justify-between"><span>צפי פניות</span><span className="text-[#7c3aed] font-bold">{prediction.expectedRequests}</span></div>
                <div className="flex justify-between"><span>ודאות</span><span className="text-[#459524] font-semibold">{prediction.confidence}%</span></div>
              </div>
              <div className="mt-2.5 pt-2 border-t border-[#d8c8ff]">
                <p className="text-[10px] text-[#585858] uppercase tracking-wider mb-1">פעולה מומלצת</p>
                <p className="text-xs text-[#1a1a1a] leading-snug">{prediction.recommendedAction}</p>
                <p className="text-[10px] text-[#707070] mt-1.5 leading-snug">{prediction.description}</p>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}

      {/* ── Heatmap layer ── */}
      {viewMode === "heatmap" && (
        <HeatmapLayer points={heatPoints} options={heatOptions} />
      )}

      {/* ── Incident markers ── */}
      {viewMode === "map" && visible.map((m) => {
        const opacity = STATUS_OPACITY[m.status] ?? 0.8;
        const size = selected === m.id ? 30 : 24;
        const icon = makeIcon(
          CATEGORY_EMOJI[m.category] ?? "●",
          CATEGORY_COLORS[m.category],
          size, opacity, false, "",
          m.status,
        );
        const meta = getMarkerMeta(m);

        return (
          <Marker
            key={m.id}
            position={[m.lat, m.lng]}
            icon={icon}
            eventHandlers={{
              click:      () => setSelected(m.id),
              popupclose: () => setSelected(null),
            }}
          >
            <Popup>
              <div className="min-w-[240px]" dir="rtl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{CATEGORY_EMOJI[m.category]}</span>
                  <span className="font-semibold text-sm text-[#1a1a1a] leading-tight">{m.title}</span>
                </div>
                <div className="mb-2.5 pb-2 border-b border-[#d0d0d0]" style={{ direction: "rtl", textAlign: "right" }}>
                  <p className="text-[10px] text-[#585858] uppercase tracking-wider mb-1">פעולה מומלצת</p>
                  <p className="text-xs text-[#1a1a1a] leading-snug">{meta.action}</p>
                </div>
                <div className="space-y-1 text-xs text-[#707070]">
                  <div className="flex justify-between"><span>אזור</span><span className="text-[#1a1a1a]">{districtLabel(m.district)}</span></div>
                  <div className="flex justify-between"><span>תחום</span><span className="text-[#1a1a1a] capitalize">{CATEGORY_LABELS[m.category]}</span></div>
                  <div className="flex justify-between">
                    <span>סטטוס</span>
                    <span style={{ color: m.status === "resolved" ? "#459524" : m.status === "in_progress" ? "#1f5fa6" : "#d96350" }} className="font-medium capitalize">
                      {statusLabel(m.status)}
                    </span>
                  </div>
                  <div className="flex justify-between"><span>מקור</span><span className="text-[#1a1a1a]">{meta.source}</span></div>
                  <div className="flex justify-between">
                    <span>זמן פתיחה</span>
                    <span className="text-[#1a1a1a]">{new Date(m.lastUpdated).toLocaleString("he-IL", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jerusalem" })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>סטטוס SLA</span>
                    <span className="font-semibold text-[#1a1a1a]">{meta.slaStatus}</span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* ── Smart bins ── */}
      {activeLayers.has("bins") && SMART_BINS.map((b) => {
        const color =
          b.status === "critical" ? "#d96350" :
          b.status === "alert"    ? "#f37d00" : "#459524";
        return (
          <Marker key={b.id} position={[b.lat, b.lng]} icon={makeIcon("🗑", color, 18, 0.85, false)}>
            <Popup>
              <div className="min-w-[210px]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">🗑️</span>
                  <span className="font-semibold text-sm text-[#1a1a1a]">{b.label}</span>
                </div>
                <div className="space-y-1 text-xs text-[#707070]">
                  <div className="flex justify-between"><span>רמת מילוי</span><span style={{ color }} className="font-bold">{b.fill}%</span></div>
                  <div className="flex justify-between"><span>סטטוס</span><span style={{ color }} className="font-semibold">{OVERLAY_STATUS_LABELS[b.status]}</span></div>
                  <div className="flex justify-between"><span>מקור</span><span className="text-white">חיישן IoT</span></div>
                </div>
                {b.fill > 80 && (
                  <div className="mt-2 pt-2 border-t border-[#d0d0d0]">
                    <p className="text-[10px] text-[#f37d00] font-semibold">נדרש פינוי — התרעת בינה הופעלה</p>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* ── CCTV cameras ── */}
      {activeLayers.has("cameras") && CAMERAS.map((cam) => {
        const color = cam.event ? "#d96350" : "#009dc3";
        return (
          <Marker key={cam.id} position={[cam.lat, cam.lng]} icon={makeIcon("📷", color, 18, 0.85, !!cam.event)}>
            <Popup>
              <div className="min-w-[210px]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm">📷</span>
                  <span className="font-semibold text-sm text-[#1a1a1a]">{cam.label}</span>
                </div>
                <div className="space-y-1 text-xs text-[#707070]">
                  <div className="flex justify-between">
                    <span>סטטוס</span>
                    <span style={{ color }} className="font-semibold">{cam.event ? "התראה" : "פעילה"}</span>
                  </div>
                  <div className="flex justify-between"><span>שידור</span><span className="text-white">חי · 1080p</span></div>
                  {cam.event && (
                    <div className="flex justify-between">
                      <span>זיהוי</span>
                      <span className="text-[#d96350] font-semibold">פניית גלישה</span>
                    </div>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* ── Municipal employee teams (isolated to prevent full re-render on animation tick) ── */}
      <AnimatedTeamLayer show={activeLayers.has("crews")} />

      {/* ── Sanitation vehicles (animated — isolated to prevent full re-render on tick) ── */}
      <AnimatedVehicleLayer show={activeLayers.has("vehicles")} />

      {/* ── Route lines (in dedicated pane above districts) ── */}
      <Pane name="routesPane" style={{ zIndex: 450 }} />
      {viewMode === "map" && showRoutes && (
        <RouteLayer
          filter={routeFilter}
          focusedScheduleId={focusedRouteScheduleId}
        />
      )}


      {/* ── Car accident hazard marker (revealed after 30s) ── */}
      {hazardRevealed && activeLayers.has("hazard_alert") && <Marker
        position={[CAR_ACCIDENT.lat, CAR_ACCIDENT.lng]}
        icon={makeHazardIcon()}
      >
        <Popup>
          <div className="min-w-[240px]">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">🚨</span>
              <span className="font-semibold text-sm text-[#1a1a1a]">
                תאונת דרכים — צומת ז׳בוטינסקי
              </span>
            </div>
            <div className="mb-2 px-2 py-1 rounded bg-[#ffeff2] border border-[#f7b8ae]">
              <span className="text-[10px] text-[#d96350] font-semibold">
                INC-ACC-001 · קריטי · פתוח
              </span>
            </div>
            <div className="space-y-1 text-xs text-[#707070]">
              <div className="flex justify-between">
                <span>אזור</span>
                <span className="text-[#1a1a1a]">מרכז העיר</span>
              </div>
              <div className="flex justify-between">
                <span>זוהה על ידי</span>
                <Link href="/cameras" className="text-[#1f5fa6] font-semibold hover:underline">
                  {CAR_ACCIDENT.cam}
                </Link>
              </div>
              <div className="flex justify-between">
                <span>נפגעים</span>
                <span className="text-[#d96350] font-semibold">2 נפגעים</span>
              </div>
              <div className="flex justify-between">
                <span>סטטוס כביש</span>
                <span className="text-[#d96350] font-bold">חסימת נתיב</span>
              </div>
              <div className="flex justify-between">
                <span>צוות חירום</span>
                <span className="text-[#f37d00] font-semibold">בדרך</span>
              </div>
            </div>
            <Link
              href="/cameras"
              className="mt-3 flex items-center justify-center rounded-lg border border-[#d96350] bg-[#ffeff2] px-3 py-2 text-xs font-semibold text-[#d96350] transition-colors hover:bg-[#ffe3df]"
            >
              מעבר למסך מצלמות חכמות
            </Link>
          </div>
        </Popup>
      </Marker>}

    </MapContainer>
  );
}
