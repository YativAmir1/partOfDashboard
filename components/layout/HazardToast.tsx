"use client";

import { useState, useEffect, useRef } from "react";
import { AlertTriangle, X, Camera, MapPin, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useHazard } from "@/context/HazardContext";

export function HazardToast() {
  const { hazardRevealed } = useHazard();
  const [shown, setShown] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const dismissed = useRef(false);

  function dismiss() {
    if (dismissed.current) return;
    dismissed.current = true;
    setLeaving(true);
    setTimeout(() => setShown(false), 360);
  }

  // Show when hazard is first revealed
  useEffect(() => {
    if (hazardRevealed && !dismissed.current) {
      setShown(true);
    }
  }, [hazardRevealed]);

  // Reset on unmount (Fast Refresh safety)
  useEffect(() => {
    return () => {
      dismissed.current = false;
      setShown(false);
      setLeaving(false);
    };
  }, []);

  // Auto-dismiss after 9s
  useEffect(() => {
    if (!shown) return;
    const t = setTimeout(dismiss, 9_000);
    return () => clearTimeout(t);
  }, [shown]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!shown) return null;

  return (
    <div
      className="fixed bottom-6 left-6 z-[9999] w-[340px] rounded-xl overflow-hidden shadow-2xl"
      style={{
        animation: leaving
          ? "hazard-slide-out 0.36s ease-in forwards"
          : "hazard-slide-in 0.4s ease-out",
        border: "1.5px solid #d96350",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2.5"
        style={{ background: "#d96350" }}
      >
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
          </span>
          <AlertTriangle size={13} className="text-white shrink-0" />
          <span className="text-white font-bold text-[11px] tracking-wide uppercase">
            התראת חירום · INC-ACC-001
          </span>
        </div>
        <button
          onClick={(e) => { e.preventDefault(); dismiss(); }}
          className="text-white/70 hover:text-white transition-colors ml-2 shrink-0"
          aria-label="סגור התראה"
        >
          <X size={15} />
        </button>
      </div>

      {/* Clickable body → /cameras */}
      <Link href="/cameras" onClick={dismiss} className="block">
        <div
          className="px-4 py-3 transition-colors cursor-pointer hover:bg-[#fff0ee]"
          style={{ background: "#fff8f7" }}
        >
          <p className="text-sm font-bold text-[#1a1a1a] leading-snug mb-1">
            תאונת דרכים חמורה — צומת ז׳בוטינסקי
          </p>
          <p className="text-xs text-[#585858] leading-relaxed mb-3">
            2 נפגעים · חסימת נתיב · צוות חירום בדרך
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-[11px] text-[#707070]">
              <span className="flex items-center gap-1">
                <MapPin size={10} />
                מרכז העיר
              </span>
              <span className="flex items-center gap-1">
                <Camera size={10} />
                CAM-002
              </span>
              <span className="text-[#d96350] font-bold">קריטי · פתוח</span>
            </div>
            <span className="flex items-center gap-1 text-[11px] text-[#d96350] font-semibold whitespace-nowrap">
              למצלמות
              <ArrowLeft size={11} />
            </span>
          </div>
        </div>
      </Link>

      {/* Auto-dismiss progress bar */}
      <div style={{ height: 3, background: "#f0bbb4" }}>
        <div
          style={{
            height: "100%",
            background: "#d96350",
            animation: "hazard-progress 9s linear forwards",
          }}
        />
      </div>
    </div>
  );
}
