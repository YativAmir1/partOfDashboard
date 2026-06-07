import type { Vehicle, MunicipalDept } from "@/lib/types";
import { Truck, Radio, ClipboardList, UserX } from "lucide-react";

interface Props {
  vehicles: Vehicle[];
  depts: MunicipalDept[];
}

export function FleetKpiStrip({ vehicles, depts }: Props) {
  const allTeams = depts.flatMap((d) => d.teams);

  const totalVehicles = vehicles.filter((v) => v.status !== "out_of_service").length;
  const activeVehicles = vehicles.filter((v) => v.status === "active").length;
  const openMissions = allTeams.reduce((sum, t) => sum + t.openMissions, 0);
  const unavailableTeams = allTeams.filter(
    (t) => t.todayStatus === "unavailable",
  ).length;

  const kpis = [
    {
      label: 'סה"כ כלים פעילים',
      value: totalVehicles,
      sub: "מתוך " + vehicles.length + " סה״כ",
      icon: Truck,
      color: "#1f5fa6",
      bg: "#eff4fc",
    },
    {
      label: "בשטח כרגע",
      value: activeVehicles,
      sub: "רכבים פעילים",
      icon: Radio,
      color: "#16a34a",
      bg: "#f0fdf4",
    },
    {
      label: "משימות פתוחות",
      value: openMissions,
      sub: "בכלל הצוותות",
      icon: ClipboardList,
      color: "#d97706",
      bg: "#fffbeb",
    },
    {
      label: "צוותות לא זמינים",
      value: unavailableTeams,
      sub: "מתוך " + allTeams.length + " צוותות",
      icon: UserX,
      color: "#d96350",
      bg: "#fef2f2",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {kpis.map(({ label, value, sub, icon: Icon, color, bg }) => (
        <div
          key={label}
          className="bg-white border border-[#e5e5e5] rounded-xl px-4 py-3 flex items-center gap-3"
        >
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: bg }}
          >
            <Icon size={18} style={{ color }} />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold text-[#1a1a1a] leading-none">{value}</p>
            <p className="text-[11px] text-[#585858] mt-0.5 truncate">{label}</p>
            <p className="text-[10px] text-[#999999]">{sub}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
