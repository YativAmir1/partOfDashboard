import type { TeamStatus } from "@/lib/types";
import { TEAM_STATUS_LABEL } from "@/lib/fleetUtils";
import { SlidersHorizontal } from "lucide-react";

const ALL_STATUSES: TeamStatus[] = [
  "active",
  "break",
  "standby",
  "done",
  "available",
  "unavailable",
];

interface Props {
  statusFilter: Set<TeamStatus>;
  onToggleStatus: (s: TeamStatus) => void;
  vehicleFilter: "all" | "with_vehicle" | "without_vehicle";
  onChangeVehicleFilter: (v: "all" | "with_vehicle" | "without_vehicle") => void;
}

export function FilterPanel({
  statusFilter,
  onToggleStatus,
  vehicleFilter,
  onChangeVehicleFilter,
}: Props) {
  return (
    <div className="w-44 shrink-0 bg-white border border-[#e5e5e5] rounded-xl p-3 self-start sticky top-4 space-y-4">
      <div className="flex items-center gap-2">
        <SlidersHorizontal size={14} className="text-[#585858]" />
        <span className="text-xs font-semibold text-[#1a1a1a]">סינון</span>
      </div>

      <div className="space-y-1.5">
        <p className="text-[11px] font-medium text-[#585858] uppercase tracking-wide">סטטוס</p>
        {ALL_STATUSES.map((s) => (
          <label key={s} className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={statusFilter.has(s)}
              onChange={() => onToggleStatus(s)}
              className="w-3.5 h-3.5 rounded accent-[#1f5fa6]"
            />
            <span className="text-xs text-[#585858] group-hover:text-[#1a1a1a]">
              {TEAM_STATUS_LABEL[s]}
            </span>
          </label>
        ))}
      </div>

      <div className="space-y-1.5">
        <p className="text-[11px] font-medium text-[#585858] uppercase tracking-wide">כלי רכב</p>
        {(
          [
            ["all", "הכל"],
            ["with_vehicle", "עם רכב"],
            ["without_vehicle", "ללא רכב"],
          ] as const
        ).map(([val, label]) => (
          <label key={val} className="flex items-center gap-2 cursor-pointer group">
            <input
              type="radio"
              name="vehicleFilter"
              checked={vehicleFilter === val}
              onChange={() => onChangeVehicleFilter(val)}
              className="w-3.5 h-3.5 accent-[#1f5fa6]"
            />
            <span className="text-xs text-[#585858] group-hover:text-[#1a1a1a]">{label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
