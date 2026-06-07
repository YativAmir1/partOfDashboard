"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Props {
  lat: number;
  lng: number;
  label: string;
  emoji?: string;
}

export function MiniMapViewInner({ lat, lng, label, emoji = "📍" }: Props) {
  const icon = L.divIcon({
    className: "",
    html: `<div style="font-size:22px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,.4))">${emoji}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

  return (
    <MapContainer
      key={`${lat}-${lng}`}
      center={[lat, lng]}
      zoom={15}
      zoomControl={false}
      dragging={false}
      scrollWheelZoom={false}
      doubleClickZoom={false}
      attributionControl={false}
      style={{ height: "160px", width: "100%", borderRadius: "8px" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[lat, lng]} icon={icon}>
        <Popup>{label}</Popup>
      </Marker>
    </MapContainer>
  );
}
