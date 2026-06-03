"use client";

import { useEffect, useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface ChannelEntry {
  name: string;
  value: number;
}

interface Props {
  data: ChannelEntry[];
  selectedChannel: string | null;
  onChannelClick: (channel: string | null) => void;
}

const COLORS = ["#1f5fa6", "#f37d00", "#ffbb00", "#459524", "#009dc3", "#cf4761"];

function useDarkMode() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const el = document.documentElement;
    setDark(el.classList.contains("dark-mode"));
    const obs = new MutationObserver(() =>
      setDark(el.classList.contains("dark-mode")),
    );
    obs.observe(el, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  return dark;
}

export function ChannelDonutChart({ data, selectedChannel, onChannelClick }: Props) {
  const isDark = useDarkMode();

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const activeEntry = selectedChannel
    ? data.find((item) => item.name === selectedChannel)
    : null;

  const centerLabel = activeEntry
    ? { top: activeEntry.name, bottom: `${activeEntry.value} פניות` }
    : { top: 'סה"כ', bottom: `${total} פניות` };

  return (
    <div className="bg-white border border-[#d0d0d0] rounded-xl p-4">
      <div className="mb-3">
        <p className="text-xs font-semibold text-[#585858] uppercase tracking-wider mb-1">
          פניות לפי ערוץ
        </p>
        <p className="text-[10px] text-[#999999]">
          חלוקת הפניות הנכנסות לפי ערוצי הפנייה
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 min-h-[220px]" dir="ltr">
          <div className="relative h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={54}
                  outerRadius={78}
                  paddingAngle={2}
                  dataKey="value"
                  onClick={(entry) => {
                    const name = (entry as ChannelEntry).name;
                    onChannelClick(name === selectedChannel ? null : name);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  {data.map((entry, i) => (
                    <Cell
                      key={entry.name}
                      fill={COLORS[i % COLORS.length]}
                      opacity={
                        selectedChannel && selectedChannel !== entry.name
                          ? 0.3
                          : 1
                      }
                      stroke={selectedChannel === entry.name ? "#1a1a1a" : "none"}
                      strokeWidth={selectedChannel === entry.name ? 1.5 : 0}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: isDark ? "#1e293b" : "#ffffff",
                    border: `1px solid ${isDark ? "#334155" : "#d0d0d0"}`,
                    borderRadius: 8,
                    fontSize: 12,
                    color: isDark ? "#f8fafc" : "#1a1a1a",
                  }}
                  formatter={(value) => [value, "פניות"]}
                />
              </PieChart>
            </ResponsiveContainer>

            <div
              className="absolute pointer-events-none text-center"
              style={{ top: "50%", left: "50%", transform: "translate(-50%, -58%)" }}
            >
              <p className="text-[10px] text-[#999999] leading-none">{centerLabel.top}</p>
              <p className="text-base font-bold text-[#1a1a1a] leading-snug mt-0.5">
                {centerLabel.bottom}
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <p className="text-[10px] font-semibold text-[#999999] uppercase tracking-wider mb-2.5">
            פירוט לפי ערוץ
          </p>
          <div className="space-y-2">
            {data.map((channel) => {
              const pct = Math.round((channel.value / total) * 100);
              const active = !selectedChannel || selectedChannel === channel.name;

              return (
                <button
                  key={channel.name}
                  className="w-full text-right transition-opacity"
                  style={{ opacity: active ? 1 : 0.35 }}
                  onClick={() =>
                    onChannelClick(channel.name === selectedChannel ? null : channel.name)
                  }
                >
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <span className="text-[10px] text-[#585858] truncate">
                      {channel.name}
                    </span>
                    <span className="text-[10px] font-bold text-[#1a1a1a] shrink-0">
                      {channel.value}
                      <span className="font-normal text-[#999999] ml-1">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-1 bg-[#e8e8e8] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#1f5fa6] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {selectedChannel && (
            <button
              onClick={() => onChannelClick(null)}
              className="mt-3 text-[10px] text-[#1f5fa6] hover:underline w-full text-center"
            >
              נקה סינון
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
