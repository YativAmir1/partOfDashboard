"use client";

import { X, AlertTriangle } from "lucide-react";
import { useDemo } from "@/context/DemoContext";

export function AlertBanner() {
  const { scenario, dismissAlert } = useDemo();

  if (!scenario.activeAlert?.visible) return null;

  return (
    <div className="alert-slide-in flex items-center gap-3 px-5 py-2.5 bg-[#7c2d12] border-b border-[#ef4444] text-white text-sm">
      <AlertTriangle size={15} className="shrink-0 text-[#fca5a5]" />
      <span className="flex-1 font-medium">{scenario.activeAlert.text}</span>
      <button
        onClick={dismissAlert}
        className="ml-auto shrink-0 text-[#fca5a5] hover:text-white transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
