import { useMemo } from "react";
import { getRequestAnalytics } from "@/lib/requestAnalytics";
import type { Incident } from "@/lib/types";

export function useRequestAnalytics(sourceIncidents?: Incident[]) {
  return useMemo(() => getRequestAnalytics(sourceIncidents), [sourceIncidents]);
}
