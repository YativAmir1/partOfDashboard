import { cn } from "@/lib/utils";

interface Props {
  status: string;
  label?: string;
}

const CONFIG: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  open:             { bg: "bg-[#ffeff2]",  text: "text-[#d96350]", dot: "bg-[#d96350]", label: "פתוח"   },
  in_progress:      { bg: "bg-[#fff1e2]",  text: "text-[#f37d00]", dot: "bg-[#f37d00]", label: "בטיפול" },
  resolved:         { bg: "bg-[#f1faed]",  text: "text-[#459524]", dot: "bg-[#459524]", label: "טופל"   },
  pending:          { bg: "bg-[#f4f4f4]",  text: "text-[#707070]", dot: "bg-[#707070]", label: "ממתין"  },
  in_progress_task: { bg: "bg-[#e0f9ff]",  text: "text-[#009dc3]", dot: "bg-[#009dc3]", label: "בטיפול" },
  done:             { bg: "bg-[#f1faed]",  text: "text-[#459524]", dot: "bg-[#459524]", label: "הושלם"  },
  escalated:        { bg: "bg-[#ffeff2]",  text: "text-[#d96350]", dot: "bg-[#d96350]", label: "הוסלם"  },
};

export function StatusBadge({ status, label }: Props) {
  const cfg = CONFIG[status] ?? CONFIG.pending;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium", cfg.bg, cfg.text)}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", cfg.dot)} />
      {label ?? cfg.label}
    </span>
  );
}
