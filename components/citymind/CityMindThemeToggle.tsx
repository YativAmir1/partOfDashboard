"use client";

// ─── CityMind AI — light/dark switcher ───────────────────────────────────────
// The cockpit is dark-first (its own root layout + hardcoded navy palette).
// This toggles a `citymind-light` class on the cockpit's <html>; the light
// palette lives as a scoped override block in app/globals.css. Persisted under
// its own localStorage key so it's independent of the app-shell theme.
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

const STORAGE_KEY = "citymind-theme";

export function CityMindThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    const light = localStorage.getItem(STORAGE_KEY) === "light";
    document.documentElement.classList.toggle("citymind-light", light);
    setIsLight(light);
  }, []);

  const toggle = () => {
    const next = !isLight;
    setIsLight(next);
    document.documentElement.classList.toggle("citymind-light", next);
    localStorage.setItem(STORAGE_KEY, next ? "light" : "dark");
  };

  return (
    <button
      onClick={toggle}
      title={isLight ? "מעבר למצב כהה" : "מעבר למצב בהיר"}
      aria-label={isLight ? "מעבר למצב כהה" : "מעבר למצב בהיר"}
      aria-pressed={isLight}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#1e293b] bg-[#0b1220] text-slate-300 transition-colors hover:bg-[#16223c] hover:text-white"
    >
      {isLight ? <Moon size={15} /> : <Sun size={15} />}
    </button>
  );
}
