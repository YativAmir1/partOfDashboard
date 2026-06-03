"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";

export interface HeatPoint {
  lat: number;
  lng: number;
  intensity: number;
}

interface Props {
  points: HeatPoint[];
  options?: L.HeatMapOptions;
}

export function HeatmapLayer({ points, options }: Props) {
  const map = useMap();
  const layerRef = useRef<L.HeatLayer | null>(null);

  useEffect(() => {
    const latlngs: L.HeatLatLngTuple[] = points.map((p) => [p.lat, p.lng, p.intensity]);

    const layer = L.heatLayer(latlngs, {
      minOpacity: 0.35,
      radius: 38,
      blur: 22,
      max: 1.0,
      gradient: { 0.3: "#1f5fa6", 0.6: "#f37d00", 1.0: "#d96350" },
      ...options,
    });

    layer.addTo(map);
    layerRef.current = layer;

    return () => {
      map.removeLayer(layer);
      layerRef.current = null;
    };
  }, [map, points, options]);

  return null;
}
