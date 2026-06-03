import { useMemo } from "react";
import { incidents } from "@/lib/data";
import { buildIncidentRequestFunnel } from "@/lib/requestAnalytics";
import type { District, Incident, RequestFunnel } from "@/lib/types";

interface RequestFunnelResult {
  funnel: RequestFunnel[];
}

export function useRequestFunnel(
  selectedDistrict?: District,
  sourceIncidents: Incident[] = incidents,
): RequestFunnelResult {
  const funnel = useMemo(() => {
    const filtered = selectedDistrict
      ? sourceIncidents.filter((incident) => incident.district === selectedDistrict)
      : sourceIncidents;

    return buildIncidentRequestFunnel(filtered);
  }, [selectedDistrict, sourceIncidents]);

  return { funnel };
}
