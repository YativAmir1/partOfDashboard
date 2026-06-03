import { useMemo } from "react";
import operationalMetricsRaw from "@/data/operationalMetrics.json";
import type { ChannelEfficiency, DashboardFilters } from "@/lib/types";

interface ChannelEfficiencyResult {
  channels: ChannelEfficiency[];
}

export function useChannelEfficiency(
  filters?: Pick<DashboardFilters, "channel">
): ChannelEfficiencyResult {
  const channel = filters?.channel;

  return useMemo(() => {
    const all = operationalMetricsRaw.channelEfficiency as ChannelEfficiency[];
    return {
      channels: channel ? all.filter((c) => c.channel === channel) : all,
    };
  }, [channel]);
}
