"use client";

import { Calendar, Flame, Leaf, AlertCircle } from "lucide-react";

interface Occasion {
  date: string;
  dayLabel: string;
  title: string;
  subtitle: string;
  category: "holiday" | "municipal" | "alert";
  impact: string[];
  highlight?: boolean;
}

const OCCASIONS: Occasion[] = [
  {
    date: "15.5",
    dayLabel: "שישי",
    title: "יום ירושלים",
    subtitle: "טקס עירוני ומצעד דגלים",
    category: "holiday",
    impact: [
      "טקס רשמי בכיכר העיר · 10:00",
      "נתיב ז'בוטינסקי סגור 09:00–12:00 · מצעד דגלים",
      "הסעות מיוחדות מהשכונות לטקס",
    ],
    highlight: true,
  },
  {
    date: "11.5",
    dayLabel: "שני",
    title: "פתיחת עונת הבריכות",
    subtitle: "10 בריכות ציבוריות נפתחות לעונת הקיץ",
    category: "municipal",
    impact: [
      "~6,000 מנויים צפויים ביום הפתיחה",
      "תיאום חניה בסביבות בריכת גוש דן",
      "מנויים שנתיים בתוקף מה-11.5",
    ],
    highlight: true,
  },
  {
    date: "13.5",
    dayLabel: "רביעי",
    title: "ריסוס נגד יתושים",
    subtitle: "מבצע ריסוס עירוני עונתי",
    category: "alert",
    impact: [
      "ריסוס בין 22:00–03:00 · כל הפארקים והשטחים הירוקים",
      "מומלץ לסגור חלונות בשעות הריסוס",
    ],
  },
];

const CATEGORY_STYLE: Record<
  Occasion["category"],
  { bg: string; border: string; dot: string; Icon: typeof Calendar }
> = {
  holiday:   { bg: "#fff8ed", border: "#f5c000", dot: "#f37d00", Icon: Flame    },
  municipal: { bg: "#f5faf0", border: "#459524", dot: "#459524", Icon: Leaf     },
  alert:     { bg: "#fff4f4", border: "#e0a0a0", dot: "#d96350", Icon: AlertCircle },
};

export function SpecialOccasionsWidget() {
  return (
    <div className="bg-white border border-[#d0d0d0] rounded-xl p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-[#585858] uppercase tracking-wider">
          אירועים מיוחדים · השבוע
        </p>
        <span className="text-[10px] text-[#b0b0b0]">10–16 במאי 2026</span>
      </div>

      <div className="space-y-3">
        {OCCASIONS.map((occ, i) => {
          const style = CATEGORY_STYLE[occ.category];
          const Icon  = style.Icon;
          return (
            <div
              key={i}
              className="rounded-lg border p-3"
              style={{ background: style.bg, borderColor: style.border + (occ.highlight ? "cc" : "66") }}
            >
              <div className="flex items-start gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                  style={{ background: style.dot + "22" }}
                >
                  <Icon size={13} style={{ color: style.dot }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <span className="text-sm font-bold text-[#1a1a1a]">{occ.title}</span>
                    <span className="text-[10px] font-medium text-[#707070] shrink-0">
                      {occ.dayLabel} {occ.date}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#707070] mt-0.5">{occ.subtitle}</p>
                  <ul className="mt-2 space-y-1">
                    {occ.impact.map((line, j) => (
                      <li key={j} className="flex items-start gap-1.5">
                        <span
                          className="w-1 h-1 rounded-full shrink-0 mt-1.5"
                          style={{ background: style.dot }}
                        />
                        <span className="text-[11px] text-[#585858] leading-snug">{line}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
