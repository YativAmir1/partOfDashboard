"use client";

import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Vehicle, MunicipalDept } from "@/lib/types";
import { FleetVehicleLayer } from "./FleetVehicleLayer";

interface Props {
  vehicles: Vehicle[];
  depts: MunicipalDept[];
  activeDeptId: string | null;
}

export function FleetMapPanelInner({ vehicles, activeDeptId }: Props) {
  const filtered = activeDeptId
    ? vehicles.filter((v) => v.deptId === activeDeptId)
    : vehicles;

  return (
    <MapContainer
      center={[32.082, 34.815]}
      zoom={14}
      className="w-full rounded-xl overflow-hidden"
      style={{ height: "calc(100vh - 260px)", minHeight: "480px" }}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FleetVehicleLayer vehicles={filtered} />
    </MapContainer>
  );
}
