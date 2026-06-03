import { CalendarDays, MapPin, Users } from "lucide-react";

type EventCategory = "standup" | "theater" | "concert" | "kids";

interface CityEvent {
  id: number;
  date: number;
  dayLabel: string;
  time: string;
  title: string;
  location: string;
  category: EventCategory;
  operationalNote: string;
}

const EVENTS: CityEvent[] = [
  {
    id: 1, date: 4, dayLabel: "ראשון", time: "21:00",
    title: "ערב סטנד אפ עם כוכבי הקומדי בר",
    location: "בליקר בייקרי",
    category: "standup",
    operationalNote: "כ-150 מבקרים · עומס חניה קל סביב רח׳ ביאליק",
  },
  {
    id: 2, date: 7, dayLabel: "רביעי", time: "21:00",
    title: "ערב סטנד אפ עם כוכבי הקומדי בר",
    location: "בליקר בייקרי",
    category: "standup",
    operationalNote: "כ-150 מבקרים · עומס חניה קל סביב רח׳ ביאליק",
  },
  {
    id: 3, date: 8, dayLabel: "חמישי", time: "22:00",
    title: "דניאל כהן במופע סטנדאפ",
    location: "תיאטרון היהלום",
    category: "standup",
    operationalNote: "כ-400 מבקרים · מעקב תנועה עם סיום ב-23:30",
  },
  {
    id: 4, date: 9, dayLabel: "שישי", time: "11:00",
    title: "בת הים - הצגת ילדים",
    location: "תיאטרון היהלום",
    category: "kids",
    operationalNote: "הצגת ילדים · פקק עם הורים וילדים 10:30–11:15",
  },
  {
    id: 5, date: 11, dayLabel: "ראשון", time: "17:15",
    title: 'המפוזר מכפר אז"ר',
    location: "תיאטרון ראסל",
    category: "theater",
    operationalNote: "כ-250 מבקרים · אחה״צ — עומס בינוני",
  },
  {
    id: 6, date: 14, dayLabel: "רביעי", time: "20:30",
    title: "אלי לוזון בהופעה חיה",
    location: "תיאטרון ראסל",
    category: "concert",
    operationalNote: "כ-350 מבקרים · עומס חניה ותנועה עד חצות",
  },
  {
    id: 7, date: 16, dayLabel: "שישי", time: "11:00",
    title: "היפה והחיה",
    location: "תיאטרון היהלום",
    category: "kids",
    operationalNote: "2 אירועים ביום — עומס מוגבר מ-10:30 עד 22:30",
  },
  {
    id: 8, date: 16, dayLabel: "שישי", time: "21:00",
    title: "נמרוד הראל אחד למיליון",
    location: "תיאטרון היהלום",
    category: "standup",
    operationalNote: "כ-400 מבקרים · שני אירועים ביום — נדרש תגבור",
  },
  {
    id: 9, date: 26, dayLabel: "שלישי", time: "21:00",
    title: "אסף מור יוסף במופע סטנדאפ",
    location: "תיאטרון היהלום",
    category: "standup",
    operationalNote: "כ-400 מבקרים · עומס חניה ותנועה ב-21:00",
  },
  {
    id: 10, date: 27, dayLabel: "רביעי", time: "21:00",
    title: "מיקי כאן - מיקי קם",
    location: "תיאטרון היהלום",
    category: "concert",
    operationalNote: "כ-450 מבקרים · עומס גבוה — מומלץ כוח תנועה",
  },
  {
    id: 11, date: 28, dayLabel: "חמישי", time: "20:30",
    title: "געגועים: מופע להיטים",
    location: "תיאטרון ראסל",
    category: "concert",
    operationalNote: "כ-300 מבקרים · עומס ערב סביב תיאטרון ראסל",
  },
];

const CATEGORY_COLOR: Record<EventCategory, string> = {
  standup: "#f37d00",
  theater: "#9b5de5",
  concert: "#1f5fa6",
  kids:    "#459524",
};

const CATEGORY_LABEL: Record<EventCategory, string> = {
  standup: "סטנד אפ",
  theater: "תיאטרון",
  concert: "הופעה",
  kids:    "ילדים",
};

const DAY_HEADERS = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
const DAYS_IN_MONTH = 31;
const FIRST_DAY_DOW = 5; // May 1, 2026 = Friday (0=Sun)
const TODAY = 3;

function buildCells(): (number | null)[] {
  const cells: (number | null)[] = Array(FIRST_DAY_DOW).fill(null);
  for (let d = 1; d <= DAYS_IN_MONTH; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const CELLS = buildCells();

export function CityEventsCalendar() {
  const byDay = EVENTS.reduce<Record<number, CityEvent[]>>((acc, ev) => {
    (acc[ev.date] ??= []).push(ev);
    return acc;
  }, {});

  return (
    <div className="bg-white border border-[#d0d0d0] rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays size={14} className="text-[#1f5fa6]" />
          <p className="text-xs font-semibold text-[#585858] uppercase tracking-wider">
            אירועי עיר · מאי 2026
          </p>
        </div>
        <a
          href="https://www.mevalim.co.il/ramat-gan/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-[#1f5fa6] hover:underline"
        >
          מקור: מבלים ↗
        </a>
      </div>

      <div className="flex flex-col lg:flex-row gap-5">
        {/* ── Mini calendar ── */}
        <div className="shrink-0 lg:w-[172px]">
          <div className="grid grid-cols-7">
            {DAY_HEADERS.map((d) => (
              <div key={d} className="text-center text-[9px] font-medium text-[#b0b0b0] pb-1.5">
                {d}
              </div>
            ))}
            {CELLS.map((day, i) => {
              if (!day) return <div key={i} />;
              const events = byDay[day] ?? [];
              const isToday = day === TODAY;
              const dotColors = [...new Set(events.map((e) => CATEGORY_COLOR[e.category]))].slice(0, 2);

              return (
                <div
                  key={i}
                  className="flex flex-col items-center justify-center py-[3px] rounded"
                  style={isToday ? { background: "#e8f0fb" } : {}}
                >
                  <span
                    className="text-[10px] leading-none font-medium"
                    style={{ color: isToday ? "#1f5fa6" : "#1a1a1a" }}
                  >
                    {day}
                  </span>
                  {dotColors.length > 0 ? (
                    <div className="flex gap-[2px] mt-[2px]">
                      {dotColors.map((c, ci) => (
                        <span key={ci} className="w-[5px] h-[5px] rounded-full" style={{ background: c }} />
                      ))}
                    </div>
                  ) : (
                    <div className="h-[7px]" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-3 pt-3 border-t border-[#e8e8e8] grid grid-cols-2 gap-x-2 gap-y-1">
            {(Object.keys(CATEGORY_LABEL) as EventCategory[]).map((cat) => (
              <div key={cat} className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: CATEGORY_COLOR[cat] }} />
                <span className="text-[9px] text-[#707070]">{CATEGORY_LABEL[cat]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Events list ── */}
        <div className="flex-1 min-w-0 space-y-2 max-h-[300px] overflow-y-auto">
          {EVENTS.map((ev) => (
            <div key={ev.id} className="flex items-start gap-2.5 p-2.5 rounded-lg border border-[#e8e8e8] bg-[#fafafa]">
              {/* Date badge */}
              <div
                className="flex flex-col items-center justify-center w-8 h-8 rounded-lg shrink-0 text-white"
                style={{ background: CATEGORY_COLOR[ev.category] }}
              >
                <span className="text-[12px] font-bold leading-none">{ev.date}</span>
                <span className="text-[7px] leading-none mt-[2px] opacity-85">מאי</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-1.5">
                  <p className="text-[11px] font-semibold text-[#1a1a1a] leading-snug truncate">{ev.title}</p>
                  <span className="text-[9px] text-[#999999] shrink-0 font-medium">{ev.dayLabel} {ev.time}</span>
                </div>
                <div className="flex items-center gap-1 mt-[2px]">
                  <MapPin size={8} className="text-[#b0b0b0] shrink-0" />
                  <span className="text-[10px] text-[#707070]">{ev.location}</span>
                </div>
                <div className="flex items-center gap-1 mt-[3px]">
                  <Users size={8} className="shrink-0" style={{ color: CATEGORY_COLOR[ev.category] }} />
                  <span className="text-[9px] text-[#585858]">{ev.operationalNote}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
