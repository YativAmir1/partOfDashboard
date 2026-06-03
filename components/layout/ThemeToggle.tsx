"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const shouldUseDark = savedTheme === "dark";

    document.documentElement.classList.toggle("dark-mode", shouldUseDark);
    setIsDark(shouldUseDark);
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark-mode", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <button
      onClick={toggle}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex items-center justify-center w-8 h-8 rounded-lg border border-[#d0d0d0] bg-white hover:bg-[#f4f4f4] text-[#707070] hover:text-[#1f5fa6] transition-colors"
    >
      {isDark ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
}
