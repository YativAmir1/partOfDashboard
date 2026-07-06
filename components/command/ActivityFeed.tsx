"use client";

import { Bot, User } from "lucide-react";
import { useCommandCenter } from "@/context/CommandCenterContext";

/** Live log of what the system did — makes "saves human work" visible. */
export function ActivityFeed() {
  const { activity } = useCommandCenter();

  return (
    <div className="rounded-xl border border-[#e2e2e2] bg-white p-4">
      <h3 className="mb-3 text-sm font-bold text-[#1a1a1a]">יומן פעולות המערכת</h3>
      {activity.length === 0 ? (
        <p className="text-xs text-[#999]">אין עדיין פעולות. בחר פנייה ובצע טיפול — הפעולות יופיעו כאן.</p>
      ) : (
        <ul className="space-y-2">
          {activity.map((a) => (
            <li key={a.id} className="flex items-start gap-2 text-xs">
              <span
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  a.autonomous ? "bg-[#f3e8ff] text-[#7c3aed]" : "bg-[#fef9c3] text-[#a16207]"
                }`}
              >
                {a.autonomous ? <Bot size={12} /> : <User size={12} />}
              </span>
              <div className="min-w-0">
                <p className="text-[#1a1a1a]">{a.text}</p>
                <p className="text-[10px] text-[#999]">
                  {a.time} · פנייה {a.caseId}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
