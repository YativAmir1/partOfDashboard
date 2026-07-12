"use client";

import { CheckCircle2 } from "lucide-react";
import { useCityMind } from "@/context/CityMindContext";

export function Toast() {
  const { toast } = useCityMind();
  if (!toast) return null;
  return (
    <div className="pointer-events-none fixed bottom-6 left-1/2 z-[80] -translate-x-1/2">
      <div className="alert-slide-in flex items-center gap-2 rounded-xl border border-[#0ea5b7]/40 bg-[#0f1729] px-4 py-3 text-sm font-semibold text-white shadow-2xl shadow-black/40">
        <CheckCircle2 size={18} className="text-[#0ea5b7]" />
        {toast}
      </div>
    </div>
  );
}
