"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from "recharts";
import type { Tier } from "@/data/stats";

const TIER_COLORS: Record<Tier, string> = {
  Bronze: "#78716c",
  Silver: "#94a3b8",
  Gold: "#eab308",
  Platinum: "#22d3ee",
  Legend: "#f97316",
};

interface Props {
  data: { season: string; level: number; tier: Tier }[];
}

export function LevelHistoryChart({ data }: Props) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
          <XAxis dataKey="season" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
          <Tooltip
            contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
            formatter={(value) => [typeof value === "number" ? value.toFixed(1) : value, "Livello"]}
          />
          <Bar dataKey="level" radius={[4, 4, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={TIER_COLORS[entry.tier]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
