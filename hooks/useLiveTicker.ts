"use client";

import { useEffect, useRef, useState } from "react";

interface TickerEvent {
  id: number;
  text: string;
  type: "waste" | "traffic" | "safety" | "utilities" | "parks";
  time: string;
}

const EVENTS = [
  { text: "נפתחה פניית CRM · גלישת אשפה במרום נווה", type: "waste" as const },
  { text: "תקלה ברמזור · מרכז העיר, צומת 4", type: "traffic" as const },
  { text: "פח חכם בתפוסה 92% · אזור התעשייה", type: "waste" as const },
  { text: "עודכן ציון שביעות רצון · סקר מוקד 109", type: "parks" as const },
  { text: "פניית מצלמה סומנה לבדיקה · מתחם הבורסה", type: "safety" as const },
  { text: "עבודות דרך נסגרו לפני הזמן · רמת חן", type: "traffic" as const },
  { text: "לחץ מים חזר לתקין · אזור הפארק הלאומי", type: "utilities" as const },
  { text: "פניית CRM: מפגע דרך דווח · רמת חן", type: "traffic" as const },
  { text: "אופטימיזציית מסלול · 18 דקות נחסכו בצי שפ״ע", type: "waste" as const },
  { text: "צוות שפ״ע שוגר · תל השומר, עדיפות בינונית", type: "safety" as const },
  { text: "פניית CRM הוסלמה · שיכון ותיקים", type: "waste" as const },
  { text: "מד תשתית חזר לפעילות · 14 יחידות דיור", type: "utilities" as const },
  { text: "תחזוקת גן נסגרה · מרום נווה", type: "parks" as const },
  { text: "תלונת רעש נרשמה · מרכז העיר", type: "safety" as const },
  { text: "רכב איסוף שפ״ע חזר לדיפו · מתחם הבורסה", type: "waste" as const },
];

const INITIAL_TICKER_TIMES = ["08:42", "08:44", "08:45", "08:47"];

function formatTickerTime(date: Date) {
  return date.toLocaleTimeString("he-IL", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Jerusalem",
  });
}

export function useLiveTicker(maxEvents = 8): TickerEvent[] {
  const counterRef = useRef(1000);
  const nextEventIndexRef = useRef(4);
  const [events, setEvents] = useState<TickerEvent[]>(() =>
    EVENTS.slice(0, 4).map((e, i) => ({
      ...e,
      id: i,
      time: INITIAL_TICKER_TIMES[i],
    }))
  );

  useEffect(() => {
    const now = Date.now();
    setEvents(
      EVENTS.slice(0, 4).map((e, i) => ({
        ...e,
        id: i,
        time: formatTickerTime(new Date(now - (4 - i) * 90000)),
      }))
    );

    const interval = setInterval(() => {
      const template = EVENTS[nextEventIndexRef.current % EVENTS.length];
      nextEventIndexRef.current += 1;
      const evt: TickerEvent = {
        ...template,
        id: counterRef.current++,
        time: formatTickerTime(new Date()),
      };
      setEvents((prev) => [evt, ...prev].slice(0, maxEvents));
    }, 9000);

    return () => clearInterval(interval);
  }, [maxEvents]);

  return events;
}
