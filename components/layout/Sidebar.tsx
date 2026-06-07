"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Map,
  Route,
  Truck,
} from "lucide-react";

const NAV = [
  { href: "/overview", label: "תמונת מצב עירונית", icon: LayoutDashboard },
  { href: "/map",      label: "מפת העיר",           icon: Map },
  { href: "/routes",   label: "ניהול מסלולים",       icon: Route },
  { href: "/fleet",    label: "כלים וצוותות",        icon: Truck },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-56 min-h-screen shrink-0 border-r border-[#d0d0d0] bg-white">
      {/* Logo */}
      <div className="flex flex-col items-center gap-3 px-5 py-6 border-b border-[#d0d0d0]">
        <Link href="/overview" aria-label="תמונת מצב עירונית" className="block">
          <img
            src="/brand/ramat-gan-logo-final-ver-944x1024.png"
            alt="עיריית רמת גן"
            className="h-32 w-auto shrink-0 object-contain transition-transform hover:scale-[1.03]"
          />
        </Link>
        <div className="text-center">
          <p className="text-sm font-bold text-[#1a1a1a] leading-tight">מערכת שליטה ובקרה חכמה</p>
          <p className="text-[11px] text-[#1f5fa6] leading-tight font-medium mt-1">עיריית רמת גן</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-[#1f5fa6] text-white"
                  : "text-[#585858] hover:bg-[#eef4fb] hover:text-[#1f5fa6]"
              )}
            >
              <Icon size={16} className="shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 pb-5 pt-3 border-t border-[#d0d0d0]">
        <p className="text-[10px] text-[#999999]">גרסת פיילוט · בינה מלאכותית</p>
        <p className="text-[10px] text-[#999999]">ניהול, בקרה ושירות לתושב</p>
      </div>
    </aside>
  );
}
