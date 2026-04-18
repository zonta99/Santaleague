"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Trophy, Target, Star } from "lucide-react";

interface KpiCardsProps {
  totalPlayers: number;
  matchesThisSeason: number;
  avgGoalsPerMatch: number;
  avgPlayerRating: number | null;
}

export function KpiCards({ totalPlayers, matchesThisSeason, avgGoalsPerMatch, avgPlayerRating }: KpiCardsProps) {
  const cards = [
    { title: "Giocatori", value: totalPlayers, icon: Users, desc: "utenti registrati" },
    { title: "Partite stagione", value: matchesThisSeason, icon: Trophy, desc: "completate" },
    { title: "Media gol/partita", value: avgGoalsPerMatch, icon: Target, desc: "nella stagione" },
    { title: "Media voto", value: avgPlayerRating ?? "—", icon: Star, desc: "su 10" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {cards.map(({ title, value, icon: Icon, desc }) => (
        <Card key={title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{desc}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
