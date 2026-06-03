"use client";

import { useFieldStats } from "@/hooks/useFieldStats";
import { Truck } from "lucide-react";

export function FieldPerformanceCard() {
  const { assignedToFieldRate, handledInFieldRate } = useFieldStats();
  const gap = assignedToFieldRate - handledInFieldRate;

  return (
    <div className="bg-white border border-[#d0d0d0] rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Truck size={14} className="text-[#f37d00]" />
          <p className="text-xs font-semibold text-[#585858] uppercase tracking-wider">
            ביצועי שטח
          </p>
        </div>
        <span className="text-[10px] text-[#999999]">30 הימים האחרונים</span>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-xs text-[#585858]">שוגרו לשטח</span>
            <span className="text-xs font-bold text-[#f37d00]">{assignedToFieldRate}%</span>
          </div>
          <div className="h-2 bg-[#e8e8e8] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${assignedToFieldRate}%`, background: "#f37d00" }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-1">
            <span className="text-xs text-[#585858]">טופלו בשטח</span>
            <span className="text-xs font-bold text-[#459524]">{handledInFieldRate}%</span>
          </div>
          <div className="h-2 bg-[#e8e8e8] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${handledInFieldRate}%`, background: "#459524" }}
            />
          </div>
        </div>

        <div className="pt-2 border-t border-[#e8e8e8]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#999999]">פער שיוך–טיפול</span>
            <span className="text-xs font-bold text-[#d96350]">−{gap}%</span>
          </div>
          <p className="text-[10px] text-[#999999] mt-0.5">
            {gap > 10
              ? "פוטנציאל שיפור: סגירת פניות שטח"
              : "יעילות שטח תקינה"}
          </p>
        </div>
      </div>
    </div>
  );
}
