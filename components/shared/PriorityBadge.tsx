import { cn } from "@/lib/utils";

const CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: "bg-[#ffeff2]", text: "text-[#d96350]", label: "קריטי" },
  high:     { bg: "bg-[#fff1e2]", text: "text-[#f37d00]", label: "גבוה" },
  medium:   { bg: "bg-[#f7f9e6]", text: "text-[#b0c000]", label: "בינוני" },
  low:      { bg: "bg-[#f1faed]", text: "text-[#459524]", label: "נמוך" },
};

export function PriorityBadge({ priority }: { priority: string }) {
  const cfg = CONFIG[priority] ?? CONFIG.low;
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide", cfg.bg, cfg.text)}>
      {cfg.label}
    </span>
  );
}
