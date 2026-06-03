"use client";

import { LineChart, Line, ResponsiveContainer } from "recharts";

interface Props {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
}

export function SparklineChart({ data, color = "#3b82f6", width = 80, height = 32 }: Props) {
  const series = data.map((v) => ({ v }));
  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={series}>
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
