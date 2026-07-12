"use client";

import { useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Brush,
  Camera,
  Check,
  Database,
  History,
  Map as MapIcon,
  MessageSquare,
  RadioTower,
  Repeat,
  Ticket,
  Truck,
  UserCheck,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { useCityMind } from "@/context/CityMindContext";
import { CITY_OUTLINE, CITY_VIEWBOX, CITY_ZONES } from "@/data/cityMap";
import { RED_LIGHTS } from "@/data/cityIntel";
import { DEMO_NOW } from "@/lib/commandCenter/sla";
import type {
  ActionKind,
  ActionRecommendation,
  SourceSignal,
  Zone,
} from "@/lib/citymind/types";

// ─── Map layers ──────────────────────────────────────────────────────────────
type LayerId = "risk" | "coverage" | "sentiment" | "incidents";

const LAYERS: { id: LayerId; label: string }[] = [
  { id: "risk", label: "סיכון SLA" },
  { id: "coverage", label: "כיסוי" },
  { id: "sentiment", label: "תחושת שירות" },
  { id: "incidents", label: "פניות פתוחות" },
];

const PRIORITY_COLOR: Record<string, string> = {
  critical: "#ef4444",
  high: "#f59e0b",
  medium: "#0ea5b7",
  low: "#64748b",
};

const KIND_ICON: Record<ActionKind, LucideIcon> = {
  reinforce_cleaning: Brush,
  reroute_waste: Truck,
  proactive_ticket: Ticket,
  increase_frequency: Repeat,
  dispatch_inspector: UserCheck,
  preventive_maintenance: Wrench,
};

const KIND_LABEL: Record<ActionKind, string> = {
  reinforce_cleaning: "תגבור ניקיון",
  reroute_waste: "שינוי מסלול פינוי",
  proactive_ticket: "קריאה יזומה",
  increase_frequency: "העלאת תדירות",
  dispatch_inspector: "שיגור פקח",
  preventive_maintenance: "אחזקה מונעת",
};

const SOURCE_ICON: Record<SourceSignal, LucideIcon> = {
  crm: Database,
  gis: MapIcon,
  sensor: RadioTower,
  camera: Camera,
  vehicle: Truck,
  history: History,
  sentiment: MessageSquare,
};

const STATUS_LABEL: Record<string, string> = {
  recommended: "הומלץ",
  approved: "אושר",
  dispatched: "נשלח לשטח",
  verified: "אומת",
};

// ─── Choropleth helpers ──────────────────────────────────────────────────────
function zoneColor(z: Zone, layer: LayerId): string {
  switch (layer) {
    case "risk":
      return z.riskLevel === "high" ? "#ef4444" : z.riskLevel === "medium" ? "#f59e0b" : "#22c55e";
    case "coverage":
      return z.coveragePct >= 85 ? "#10b981" : z.coveragePct >= 70 ? "#0ea5b7" : z.coveragePct >= 55 ? "#f59e0b" : "#ef4444";
    case "sentiment":
      return z.sentiment <= -30 ? "#ef4444" : z.sentiment < -10 ? "#f59e0b" : z.sentiment <= 10 ? "#64748b" : "#22c55e";
    case "incidents":
      return z.openIncidents >= 5 ? "#ef4444" : z.openIncidents >= 3 ? "#f59e0b" : z.openIncidents >= 2 ? "#0ea5b7" : "#22c55e";
  }
}

function zoneValue(z: Zone, layer: LayerId): string {
  switch (layer) {
    case "risk":
      return z.riskLevel === "high" ? "סיכון גבוה" : z.riskLevel === "medium" ? "סיכון בינוני" : "תקין";
    case "coverage":
      return `${z.coveragePct}%`;
    case "sentiment":
      return z.sentiment > 0 ? `+${z.sentiment}` : `${z.sentiment}`;
    case "incidents":
      return `${z.openIncidents}`;
  }
}

const LEGENDS: Record<LayerId, { color: string; label: string }[]> = {
  risk: [
    { color: "#ef4444", label: "גבוה" },
    { color: "#f59e0b", label: "בינוני" },
    { color: "#22c55e", label: "תקין" },
  ],
  coverage: [
    { color: "#10b981", label: "85%+" },
    { color: "#0ea5b7", label: "70–84%" },
    { color: "#f59e0b", label: "55–69%" },
    { color: "#ef4444", label: "<55%" },
  ],
  sentiment: [
    { color: "#22c55e", label: "חיובי" },
    { color: "#64748b", label: "ניטרלי" },
    { color: "#f59e0b", label: "שלילי" },
    { color: "#ef4444", label: "שלילי מאוד" },
  ],
  incidents: [
    { color: "#ef4444", label: "5+" },
    { color: "#f59e0b", label: "3–4" },
    { color: "#0ea5b7", label: "2" },
    { color: "#22c55e", label: "0–1" },
  ],
};

// ─── SLA countdown (live, driven by the ticking context clock) ───────────────
const DEMO_ANCHOR = DEMO_NOW.getTime();

function slaRemaining(a: ActionRecommendation, now: Date): number | null {
  if (a.slaRisk.minutesToBreach == null) return null;
  const elapsedMin = (now.getTime() - DEMO_ANCHOR) / 60000;
  return a.slaRisk.minutesToBreach - elapsedMin;
}

function ringColor(remaining: number | null): string {
  if (remaining == null) return "#475569";
  if (remaining <= 15) return "#ef4444";
  if (remaining <= 45) return "#f59e0b";
  return "#22c55e";
}

function fmtRemaining(remaining: number | null): string {
  if (remaining == null) return "—";
  if (remaining <= 0) return "חריגה";
  const m = Math.round(remaining);
  if (m < 60) return `${m} דק׳`;
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, "0")} שע׳`;
}

// ─── viewBox → screen-px projector (keeps HTML markers aligned to the SVG) ────
function useProjector(ref: React.RefObject<HTMLElement | null>) {
  const [t, setT] = useState({ scale: 1, ox: 0, oy: 0, w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      const scale = Math.min(w / CITY_VIEWBOX.w, h / CITY_VIEWBOX.h);
      setT({ scale, ox: (w - CITY_VIEWBOX.w * scale) / 2, oy: (h - CITY_VIEWBOX.h * scale) / 2, w, h });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  const project = (x: number, y: number) => ({ left: t.ox + x * t.scale, top: t.oy + y * t.scale });
  return { project, size: { w: t.w, h: t.h } };
}

// ─── Layout: cluster / fan-out actions and attach linked red-lights ──────────
interface PlacedPin {
  action: ActionRecommendation;
  x: number;
  y: number;
  redLight?: { x: number; y: number; title: string; severity: string };
}
interface PlacedCluster {
  district: string;
  x: number;
  y: number;
  actions: ActionRecommendation[];
  color: string;
  hasAlert: boolean;
}

export function CityOperationsMap() {
  const { activeActions, selectedId, select, now } = useCityMind();
  const [layer, setLayer] = useState<LayerId>("risk");
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [hoverPin, setHoverPin] = useState<string | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const { project } = useProjector(canvasRef);

  const redLightsByZone = useMemo(() => {
    const m: Record<string, number> = {};
    for (const rl of RED_LIGHTS) m[rl.district] = (m[rl.district] ?? 0) + 1;
    return m;
  }, []);

  const activeByZone = useMemo(() => {
    const m: Record<string, number> = {};
    for (const a of activeActions) m[a.district] = (m[a.district] ?? 0) + 1;
    return m;
  }, [activeActions]);

  // Group actions per district, then decide cluster vs. fanned-out pins.
  const { pins, clusters } = useMemo(() => {
    const byZone = new Map<string, ActionRecommendation[]>();
    for (const a of activeActions) {
      const arr = byZone.get(a.district) ?? [];
      arr.push(a);
      byZone.set(a.district, arr);
    }
    const zoneCentroid: Record<string, Zone> = {};
    for (const z of CITY_ZONES) zoneCentroid[z.id] = z;

    const pins: PlacedPin[] = [];
    const clusters: PlacedCluster[] = [];

    for (const [district, acts] of byZone) {
      const z = zoneCentroid[district];
      const cx = z?.labelX ?? 50;
      const cy = (z?.labelY ?? 72) + 7;
      const collapsed = acts.length >= 3 && expanded !== district;

      if (collapsed) {
        const top = [...acts].sort(
          (a, b) => ["critical", "high", "medium", "low"].indexOf(a.priority) - ["critical", "high", "medium", "low"].indexOf(b.priority),
        )[0];
        clusters.push({
          district,
          x: cx,
          y: cy,
          actions: acts,
          color: PRIORITY_COLOR[top.priority] ?? "#0ea5b7",
          hasAlert: acts.some((a) => a.linkedRedLightId),
        });
        continue;
      }

      acts.forEach((a, i) => {
        const spread = 9;
        const x = cx + (i - (acts.length - 1) / 2) * spread;
        const y = cy;
        let redLight: PlacedPin["redLight"];
        if (a.linkedRedLightId) {
          const rl = RED_LIGHTS.find((r) => r.id === a.linkedRedLightId);
          if (rl) redLight = { x: x - 6, y: y - 9, title: rl.title, severity: rl.severity };
        }
        pins.push({ action: a, x, y, redLight });
      });
    }
    return { pins, clusters };
  }, [activeActions, expanded]);

  const hoverZone = hoverId ? CITY_ZONES.find((z) => z.id === hoverId) ?? null : null;
  const calloutPin = hoverPin ? pins.find((p) => p.action.id === hoverPin) ?? null : null;

  function onMove(e: React.MouseEvent) {
    const rect = wrapRef.current?.getBoundingClientRect();
    if (rect) setTip({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }

  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#1e293b] bg-[#0b1220]">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-[#1e293b] px-4 py-3">
        <h2 className="flex items-center gap-2 text-sm font-bold text-white">
          <span className="grid h-6 w-6 place-items-center rounded-lg bg-[#0ea5b7]/15">
            <Activity size={14} className="text-[#0ea5b7]" />
          </span>
          תמונת מצב עירונית חיה
        </h2>
        <span className="flex items-center gap-1.5 rounded-full bg-[#16a34a]/15 px-2 py-0.5 text-[10px] font-semibold text-[#4ade80]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#4ade80]" /> LIVE
        </span>
      </div>

      {/* Layer switcher */}
      <div className="mx-4 mt-3 flex shrink-0 gap-1 rounded-xl border border-[#1e293b] bg-[#0f1729] p-1">
        {LAYERS.map((l) => (
          <button
            key={l.id}
            onClick={() => setLayer(l.id)}
            className={`flex-1 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition-colors ${
              layer === l.id ? "bg-[#0ea5b7] text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* Map canvas */}
      <div ref={wrapRef} className="relative min-h-0 flex-1 p-3" onMouseMove={onMove}>
        <div ref={canvasRef} className="relative h-full w-full">
          <svg
            viewBox={`0 0 ${CITY_VIEWBOX.w} ${CITY_VIEWBOX.h}`}
            preserveAspectRatio="xMidYMid meet"
            className="absolute inset-0 h-full w-full"
          >
            {/* Landmass silhouette */}
            <path d={CITY_OUTLINE} fill="#0f1729" stroke="#334155" strokeWidth="0.5" strokeLinejoin="round" />

            {/* District footprints */}
            {CITY_ZONES.map((z) => {
              const isHover = z.id === hoverId;
              return (
                <path
                  key={z.id}
                  d={z.path}
                  fill={zoneColor(z, layer)}
                  fillOpacity={isHover ? 1 : 0.82}
                  stroke="#0b1220"
                  strokeWidth="0.7"
                  strokeLinejoin="round"
                  style={{ cursor: "pointer", transition: "fill-opacity 120ms" }}
                  onMouseEnter={() => setHoverId(z.id)}
                  onMouseLeave={() => setHoverId((cur) => (cur === z.id ? null : cur))}
                />
              );
            })}

            {/* Zone labels */}
            {CITY_ZONES.map((z) => (
              <g key={`lbl-${z.id}`} style={{ pointerEvents: "none" }}>
                <text
                  x={z.labelX}
                  y={z.labelY}
                  textAnchor="middle"
                  fill="#f1f5f9"
                  fontSize="2.7"
                  fontWeight="700"
                  style={{ direction: "rtl", paintOrder: "stroke", stroke: "#0b1220", strokeWidth: 0.6 }}
                >
                  {z.label}
                </text>
                <text
                  x={z.labelX}
                  y={z.labelY + 3}
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize="2.3"
                  fontWeight="600"
                  style={{ direction: "rtl", paintOrder: "stroke", stroke: "#0b1220", strokeWidth: 0.5 }}
                >
                  {zoneValue(z, layer)}
                </text>
              </g>
            ))}

            {/* Connector lines: linked red-light → action pin (cause → response) */}
            {pins.map((p) =>
              p.redLight ? (
                <line
                  key={`conn-${p.action.id}`}
                  x1={p.redLight.x}
                  y1={p.redLight.y}
                  x2={p.x}
                  y2={p.y}
                  stroke={p.redLight.severity === "critical" ? "#ef4444" : "#f59e0b"}
                  strokeWidth="0.5"
                  strokeDasharray="1.4 1"
                  strokeOpacity="0.7"
                />
              ) : null,
            )}
          </svg>

          {/* HTML marker overlay (crisp icons + callout), aligned via projector */}
          <div className="absolute inset-0" style={{ pointerEvents: "none" }}>
            {/* Red-light nodes */}
            {pins.map((p) =>
              p.redLight ? (
                <div
                  key={`rl-${p.action.id}`}
                  className="absolute grid place-items-center rounded-md"
                  style={{
                    ...toStyle(project(p.redLight.x, p.redLight.y)),
                    width: 18,
                    height: 18,
                    transform: "translate(-50%,-50%)",
                    background: p.redLight.severity === "critical" ? "#ef4444" : "#f59e0b",
                    boxShadow: "0 2px 6px rgba(0,0,0,.5)",
                  }}
                  title={p.redLight.title}
                >
                  <AlertTriangle size={11} color="#0b1220" strokeWidth={2.5} />
                </div>
              ) : null,
            )}

            {/* Cluster chips */}
            {clusters.map((c) => (
              <ClusterChip key={`cl-${c.district}`} c={c} pos={project(c.x, c.y)} onClick={() => setExpanded(c.district)} />
            ))}

            {/* Action pins */}
            {pins.map((p) => (
              <Marker
                key={p.action.id}
                pin={p}
                pos={project(p.x, p.y)}
                selected={p.action.id === selectedId}
                remaining={slaRemaining(p.action, now)}
                onClick={() => select(p.action.id)}
                onHover={() => setHoverPin(p.action.id)}
                onLeave={() => setHoverPin((cur) => (cur === p.action.id ? null : cur))}
              />
            ))}

            {/* Peek callout for the hovered pin — pinned to the map's left corner
                so it never covers district labels (click opens the full drawer) */}
            {calloutPin && <Callout action={calloutPin.action} remaining={slaRemaining(calloutPin.action, now)} />}
          </div>

          {/* Legend */}
          <div className="absolute bottom-2 right-2 flex flex-col gap-1 rounded-lg border border-[#1e293b] bg-[#0f1729]/90 px-2.5 py-2 text-[10px] text-slate-300 backdrop-blur">
            {LEGENDS[layer].map((it) => (
              <span key={it.label} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: it.color }} />
                {it.label}
              </span>
            ))}
          </div>
        </div>

        {/* Zone hover tooltip (suppressed while peeking a pin) */}
        {hoverZone && tip && !hoverPin && (
          <div
            className="pointer-events-none absolute z-20 w-52 rounded-xl border border-[#1e293b] bg-[#0f1729]/95 p-3 text-right shadow-xl backdrop-blur"
            style={{
              left: Math.min(tip.x + 14, (wrapRef.current?.clientWidth ?? 300) - 220),
              top: Math.min(tip.y + 14, (wrapRef.current?.clientHeight ?? 300) - 150),
            }}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: zoneColor(hoverZone, layer) }} />
              <span className="text-sm font-bold text-white">{hoverZone.label}</span>
            </div>
            <dl className="space-y-1 text-[11px]">
              <Row label="כיסוי ניקיון היום" value={`${hoverZone.coveragePct}%`} />
              <Row label="פניות פתוחות" value={String(hoverZone.openIncidents)} />
              <Row label="תחושת שירות" value={hoverZone.sentiment > 0 ? `+${hoverZone.sentiment}` : String(hoverZone.sentiment)} />
              <Row label="אורות אדומים" value={String(redLightsByZone[hoverZone.id] ?? 0)} />
              <Row label="פעולות AI פעילות" value={String(activeByZone[hoverZone.id] ?? 0)} />
            </dl>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Marker (rich glyph pin) ─────────────────────────────────────────────────
function Marker({
  pin,
  pos,
  selected,
  remaining,
  onClick,
  onHover,
  onLeave,
}: {
  pin: PlacedPin;
  pos: { left: number; top: number };
  selected: boolean;
  remaining: number | null;
  onClick: () => void;
  onHover: () => void;
  onLeave: () => void;
}) {
  const a = pin.action;
  const color = PRIORITY_COLOR[a.priority] ?? "#0ea5b7";
  const Icon = KIND_ICON[a.kind];
  const done = a.status === "verified";
  const dispatched = a.status === "dispatched";
  const filled = a.status !== "recommended"; // recommended = hollow, else filled (lifecycle)
  const source = a.sources[0];
  const SourceGlyph = source ? SOURCE_ICON[source] : null;

  // Density glow scales with urgency.
  const glow = a.priority === "critical" ? 20 : a.priority === "high" ? 14 : 9;

  const D = selected ? 34 : 30; // chip diameter (px)
  const R = D / 2 + 5; // SLA ring radius
  const circ = 2 * Math.PI * R;
  const frac =
    remaining == null || a.slaRisk.minutesToBreach == null
      ? 0
      : Math.max(0, Math.min(1, remaining / a.slaRisk.minutesToBreach));
  const rc = ringColor(remaining);
  const bg = done ? "#22c55e" : filled ? color : "#0b1220";
  const iconColor = done || filled ? "#0b1220" : color;

  return (
    <button
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className="absolute"
      style={{
        left: pos.left,
        top: pos.top,
        transform: "translate(-50%,-50%)",
        pointerEvents: "auto",
        cursor: "pointer",
        border: "none",
        background: "transparent",
        padding: 0,
      }}
      title={a.title}
    >
      {/* SLA countdown ring */}
      {a.slaRisk.minutesToBreach != null && (
        <svg
          width={R * 2 + 4}
          height={R * 2 + 4}
          className="absolute"
          style={{ left: "50%", top: "50%", transform: "translate(-50%,-50%) rotate(-90deg)" }}
        >
          <circle cx={R + 2} cy={R + 2} r={R} fill="none" stroke="#1e293b" strokeWidth={3} />
          <circle
            cx={R + 2}
            cy={R + 2}
            r={R}
            fill="none"
            stroke={rc}
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - frac)}
            className={remaining != null && remaining <= 15 ? "animate-pulse" : undefined}
          />
        </svg>
      )}

      {/* Chip */}
      <span
        className="relative grid place-items-center rounded-full"
        style={{
          width: D,
          height: D,
          background: bg,
          border: `2px solid ${done ? "#22c55e" : color}`,
          boxShadow: `0 0 ${glow}px ${Math.round(glow / 6)}px ${color}66, 0 2px 6px rgba(0,0,0,.5)`,
        }}
      >
        {done ? <Check size={16} color="#0b1220" strokeWidth={3} /> : <Icon size={15} color={iconColor} strokeWidth={2.2} />}

        {/* Dispatched → en-route dashed spinner */}
        {dispatched && (
          <span
            className="absolute inset-0 rounded-full animate-spin"
            style={{ border: `2px dashed ${color}`, opacity: 0.9, animationDuration: "3s" }}
          />
        )}

        {/* Source-detection micro badge */}
        {SourceGlyph && (
          <span
            className="absolute grid place-items-center rounded-full"
            style={{
              width: 14,
              height: 14,
              right: -3,
              bottom: -3,
              background: "#0f1729",
              border: "1px solid #334155",
            }}
          >
            <SourceGlyph size={8} color="#cbd5e1" strokeWidth={2.4} />
          </span>
        )}

        {/* Selection ring */}
        {selected && (
          <span className="absolute rounded-full" style={{ inset: -6, border: "2px solid #fff", opacity: 0.9 }} />
        )}
      </span>
    </button>
  );
}

// ─── Cluster chip ────────────────────────────────────────────────────────────
function ClusterChip({ c, pos, onClick }: { c: PlacedCluster; pos: { left: number; top: number }; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute grid place-items-center rounded-full font-bold text-white"
      style={{
        left: pos.left,
        top: pos.top,
        width: 34,
        height: 34,
        transform: "translate(-50%,-50%)",
        pointerEvents: "auto",
        cursor: "pointer",
        background: c.color,
        border: "2px solid #0b1220",
        boxShadow: `0 0 14px 2px ${c.color}66, 0 2px 6px rgba(0,0,0,.5)`,
        fontSize: 14,
      }}
      title={`${c.actions.length} פעולות — לחצו לפריסה`}
    >
      {c.actions.length}
      {c.hasAlert && (
        <span
          className="absolute grid place-items-center rounded-full"
          style={{ width: 15, height: 15, right: -4, top: -4, background: "#ef4444", border: "1.5px solid #0b1220" }}
        >
          <AlertTriangle size={9} color="#0b1220" strokeWidth={2.6} />
        </span>
      )}
    </button>
  );
}

// ─── Callout (selected pin) ──────────────────────────────────────────────────
function Callout({ action, remaining }: { action: ActionRecommendation; remaining: number | null }) {
  const color = PRIORITY_COLOR[action.priority] ?? "#0ea5b7";
  const rc = ringColor(remaining);

  return (
    // Full-height, borderless panel down the left side. A left→right fade lets it
    // dissolve into the map instead of sitting in a framed box.
    <div
      className="pointer-events-none absolute inset-y-0 left-0 z-30 flex w-[52%] min-w-[260px] max-w-[400px] flex-col justify-center gap-5 py-8 pl-7 pr-12 text-right"
      style={{ background: "linear-gradient(to right, #0b1220 48%, rgba(11,18,32,0.82) 74%, transparent)" }}
    >
      <div>
        <span className="mb-2.5 inline-block rounded-full px-3 py-1 text-[12px] font-semibold text-white" style={{ background: color }}>
          {KIND_LABEL[action.kind]}
        </span>
        <h3 className="text-2xl font-bold leading-tight text-white">{action.title}</h3>
      </div>

      <p className="text-[14px] leading-relaxed text-slate-400">{action.reason}</p>

      <dl className="space-y-3 text-[16px]">
        <Row label="שלב בטיפול" value={STATUS_LABEL[action.status] ?? action.status} />
        <Row label="זמן ל-SLA" value={fmtRemaining(remaining)} valueColor={rc} />
        {action.etaMinutes != null && <Row label="ETA צוות" value={`${action.etaMinutes} דק׳`} />}
        <Row label="ביטחון AI" value={`${action.aiConfidence}%`} valueColor="#4ade80" />
      </dl>

      <div>
        <p className="mb-1.5 text-[12px] text-slate-500">השפעה צפויה</p>
        <p className="text-[14px] leading-relaxed text-slate-300">{action.expectedImpact}</p>
      </div>

      <div className="flex items-center justify-end gap-2">
        <span className="ml-1 text-[11px] text-slate-500">מקורות</span>
        {action.sources.map((s) => {
          const G = SOURCE_ICON[s];
          return (
            <span key={s} className="grid h-8 w-8 place-items-center rounded-lg border border-[#1e293b] bg-[#0f1729]">
              <G size={15} color="#94a3b8" strokeWidth={2.2} />
            </span>
          );
        })}
      </div>
    </div>
  );
}

function toStyle(pos: { left: number; top: number }) {
  return { left: pos.left, top: pos.top } as const;
}

function Row({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-semibold" style={{ color: valueColor ?? "#fff" }}>{value}</span>
      <span className="text-slate-400">{label}</span>
    </div>
  );
}
