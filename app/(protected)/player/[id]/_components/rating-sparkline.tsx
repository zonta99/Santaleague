"use client";

import { LineChart, Line, ResponsiveContainer, Tooltip, YAxis, XAxis } from "recharts";

interface Props {
  data: { date: Date; avgRating: number }[];
}

export function RatingSparkline({ data }: Props) {
  if (data.length < 2) return null;

  const chartData = data.map((d, i) => ({
    i: i + 1,
    rating: d.avgRating,
  }));

  return (
    <ResponsiveContainer width="100%" height={80}>
      <LineChart data={chartData} margin={{ top: 4, right: 4, left: -32, bottom: 4 }}>
        <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} tickCount={3} />
        <XAxis dataKey="i" hide />
        <Tooltip
          formatter={(v) => [typeof v === "number" ? v.toFixed(1) : v, "Rating"]}
          labelFormatter={(l) => `Partita ${l}`}
          contentStyle={{ fontSize: 12 }}
        />
        <Line
          type="monotone"
          dataKey="rating"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
