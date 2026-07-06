"use client";

import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Polyline, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { routeViaOsrm } from "@/lib/geocoding";

interface Props {
  incident: [number, number];
  vehicleStart: [number, number];
  /** When true, the vehicle animates along the route toward the incident. */
  dispatched: boolean;
  /** 0..1 progress along the route (driven by the parent for a live feel). */
  progress: number;
  vehicleEmoji?: string;
}

function incidentIcon(): L.DivIcon {
  return L.divIcon({
    html: `<div style="position:relative;">
      <span style="position:absolute;left:-14px;top:-14px;width:28px;height:28px;border-radius:50%;background:rgba(239,68,68,0.35);animation:cc-ping 1.8s ease-out infinite;"></span>
      <span style="display:flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:#ef4444;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,0.6);"></span>
    </div>`,
    className: "",
    iconSize: [26, 26],
    iconAnchor: [13, 26],
  });
}

function vehicleIcon(emoji: string, heading: number): L.DivIcon {
  return L.divIcon({
    html: `<span style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:50%;background:#0ea5b7;border:2px solid #fff;box-shadow:0 0 12px rgba(14,165,183,0.8);font-size:16px;line-height:1;">${emoji}</span>`,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function interpolateAlong(coords: [number, number][], t: number): [number, number] {
  if (coords.length === 0) return [0, 0];
  if (coords.length === 1) return coords[0];
  const clamped = Math.max(0, Math.min(1, t));
  const seg = clamped * (coords.length - 1);
  const i = Math.floor(seg);
  const frac = seg - i;
  if (i >= coords.length - 1) return coords[coords.length - 1];
  const a = coords[i];
  const b = coords[i + 1];
  return [a[0] + (b[0] - a[0]) * frac, a[1] + (b[1] - a[1]) * frac];
}

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length < 2) return;
    map.fitBounds(L.latLngBounds(points.map((p) => L.latLng(p[0], p[1]))), {
      padding: [50, 50],
      maxZoom: 16,
    });
  }, [map, points]);
  return null;
}

export default function CockpitMap({ incident, vehicleStart, dispatched, progress, vehicleEmoji = "🚛" }: Props) {
  const [route, setRoute] = useState<[number, number][]>([vehicleStart, incident]);

  // Road-following route from the vehicle to the incident (OSRM), straight-line fallback.
  useEffect(() => {
    let alive = true;
    routeViaOsrm([vehicleStart, incident]).then((r) => {
      if (alive && r.length >= 2) setRoute(r);
    });
    return () => {
      alive = false;
    };
  }, [vehicleStart, incident]);

  const vehiclePos = useMemo<[number, number]>(
    () => (dispatched ? interpolateAlong(route, progress) : vehicleStart),
    [dispatched, route, progress, vehicleStart],
  );

  // Remaining (not-yet-driven) portion of the route, shown dashed ahead of the truck.
  const remaining = useMemo<[number, number][]>(() => {
    if (!dispatched) return route;
    const seg = progress * (route.length - 1);
    const i = Math.floor(seg);
    return [vehiclePos, ...route.slice(i + 1)];
  }, [dispatched, route, progress, vehiclePos]);

  return (
    <MapContainer
      center={incident}
      zoom={15}
      style={{ width: "100%", height: "100%", background: "#0b1220" }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        maxZoom={19}
      />
      <FitBounds points={[vehicleStart, incident]} />

      {/* Route: travelled (solid, faded) + remaining (dashed, glowing) */}
      <Polyline positions={route} pathOptions={{ color: "#1e3a5f", weight: 5, opacity: 0.5 }} />
      <Polyline
        positions={remaining}
        pathOptions={{ color: "#0ea5b7", weight: 3, opacity: 0.95, dashArray: "1 9", lineCap: "round" }}
      />

      <Circle center={incident} radius={60} pathOptions={{ color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.12, weight: 1 }} />
      <Marker position={incident} icon={incidentIcon()} />
      <Marker position={vehiclePos} icon={vehicleIcon(vehicleEmoji, 0)} />
    </MapContainer>
  );
}
