"use client";

// ─── CityMind AI — the operations cockpit (main screen) ──────────────────────
// 4 areas: Command Bar (top) · AI Action Queue (right/main) · Live City Map
// (center) · Operational Intelligence (left). Plus the closed-loop details
// drawer and confirmation toasts. Actions first, charts second.
import { CommandBar } from "./CommandBar";
import { ActionQueue } from "./ActionQueue";
import { CityOperationsMap } from "./CityOperationsMap";
import { IntelligenceColumn } from "./IntelligenceColumn";
import { ActionDetailsDrawer } from "./ActionDetailsDrawer";
import { Toast } from "./Toast";

export function OperationsCockpit() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#0b1220] text-slate-200">
      <CommandBar />
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden p-3 xl:grid-cols-[minmax(340px,380px)_minmax(0,1fr)_minmax(320px,360px)]">
        <ActionQueue />
        <CityOperationsMap />
        <IntelligenceColumn />
      </div>
      <ActionDetailsDrawer />
      <Toast />
    </div>
  );
}
