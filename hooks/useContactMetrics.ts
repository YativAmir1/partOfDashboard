import contactMetricsRaw from "@/data/contactMetrics.json";
import type { ContactMetrics } from "@/lib/types";

interface ContactMetricsResult {
  totalIncomingRequests: number;
  requestsByChannel: { name: string; value: number }[];
  informationalRate: number;
  representativeReferralRate: number;
}

export function useContactMetrics(timeWindow: "7d" | "30d" = "30d"): ContactMetricsResult {
  const data = (timeWindow === "7d" ? contactMetricsRaw.metrics7d : contactMetricsRaw.metrics) as ContactMetrics;

  const requestsByChannel = Object.entries(data.requestsByChannel)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const informationalRate = Math.round(
    (data.informationalRequests / data.totalIncomingRequests) * 100,
  );
  const representativeReferralRate = 100 - informationalRate;

  return {
    totalIncomingRequests: data.totalIncomingRequests,
    requestsByChannel,
    informationalRate,
    representativeReferralRate,
  };
}
