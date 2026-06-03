import operationalMetricsRaw from "@/data/operationalMetrics.json";
import type { SlaMetrics } from "@/lib/types";

export function useSlaMetrics(): SlaMetrics {
  return operationalMetricsRaw.sla as SlaMetrics;
}
