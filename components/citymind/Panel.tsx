"use client";

import type { ReactNode } from "react";

export function Panel({
  title,
  icon,
  accent = "#0ea5b7",
  right,
  children,
}: {
  title: string;
  icon: ReactNode;
  accent?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#1e293b] bg-[#0f1729]">
      <div className="flex items-center justify-between border-b border-[#1e293b] px-3.5 py-2.5">
        <h3 className="flex items-center gap-1.5 text-[13px] font-bold text-white">
          <span className="grid h-5 w-5 place-items-center rounded-md" style={{ background: `${accent}22` }}>
            {icon}
          </span>
          {title}
        </h3>
        {right}
      </div>
      <div className="p-3">{children}</div>
    </section>
  );
}
