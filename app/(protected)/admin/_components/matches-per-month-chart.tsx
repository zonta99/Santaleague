"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface MonthBucket {
  month: string;
  completate: number;
  programmate: number;
}

export function MatchesPerMonthChart({ data }: { data: MonthBucket[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Partite per mese</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              cursor={{ fill: "hsl(var(--muted))" }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="completate" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
            <Bar dataKey="programmate" fill="hsl(var(--muted-foreground))" radius={[3, 3, 0, 0]} opacity={0.5} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
