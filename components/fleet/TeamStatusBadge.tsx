import type { TeamStatus } from "@/lib/types";
import { TEAM_STATUS_LABEL, TEAM_STATUS_COLOR } from "@/lib/fleetUtils";

interface Props {
  status: TeamStatus;
  size?: "sm" | "md";
}

export function TeamStatusBadge({ status, size = "md" }: Props) {
  const { bg, text } = TEAM_STATUS_COLOR[status];
  const label = TEAM_STATUS_LABEL[status];
  return (
    <span
      style={{ backgroundColor: bg, color: text }}
      className={`inline-flex items-center gap-1 rounded-full font-medium ${
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      }`}
    >
      <span
        style={{ backgroundColor: text }}
        className="w-1.5 h-1.5 rounded-full shrink-0"
      />
      {label}
    </span>
  );
}
