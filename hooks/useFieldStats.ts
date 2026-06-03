import { useMemo } from "react";
import contactMetricsRaw from "@/data/contactMetrics.json";
import type { FieldStats } from "@/lib/types";

export function useFieldStats(): FieldStats {
  return useMemo(() => {
    const funnel = contactMetricsRaw.funnel;
    const total    = funnel.find((f) => f.status === "new")?.count ?? 1;
    const assigned = funnel.find((f) => f.status === "assignedToField")?.count ?? 0;
    const resolved = funnel.find((f) => f.status === "resolved")?.count ?? 0;
    return {
      assignedToFieldRate: Math.round((assigned / total) * 100),
      handledInFieldRate:  Math.round((resolved / total) * 100),
    };
  }, []);
}
