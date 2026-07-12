"use client";

import { RedLightsPanel } from "./RedLightsPanel";
import { WhatIfSimulator } from "./WhatIfSimulator";
import { SentimentRadar } from "./SentimentRadar";
import { KpiGrid } from "./KpiGrid";
import { CityBriefingPanel } from "./CityBriefingPanel";

export function IntelligenceColumn() {
  return (
    <div className="flex min-h-0 flex-col gap-3 overflow-y-auto pl-0.5">
      <KpiGrid />
      <CityBriefingPanel />
      <RedLightsPanel />
      <SentimentRadar />
      <WhatIfSimulator />
    </div>
  );
}
