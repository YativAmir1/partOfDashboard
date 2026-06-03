import { useMemo } from "react";
import { complaints } from "@/lib/data";
import type { DistrictLoad, DashboardFilters } from "@/lib/types";

interface DistrictLoadResult {
  districts: DistrictLoad[];
  highestLoadDistrict: string;
}

export function useDistrictLoad(
  filters?: Pick<DashboardFilters, "category" | "status">
): DistrictLoadResult {
  const category = filters?.category;
  const status = filters?.status;

  return useMemo(() => {
    let data = complaints.filter((c) => c.status !== "resolved");
    if (category) data = data.filter((c) => c.category === category);
    if (status) data = data.filter((c) => c.status === status);

    const counts: Record<string, number> = {};
    data.forEach((c) => {
      counts[c.district] = (counts[c.district] ?? 0) + 1;
    });

    const total = data.length;
    const districts: DistrictLoad[] = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([district, totalRequests]) => ({
        district,
        totalRequests,
        percentage: total > 0 ? Math.round((totalRequests / total) * 100) : 0,
      }));

    return {
      districts,
      highestLoadDistrict: districts[0]?.district ?? "",
    };
  }, [category, status]);
}
