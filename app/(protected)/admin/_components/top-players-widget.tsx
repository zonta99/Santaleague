"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TierBadge } from "@/components/tier-badge";
import Image from "next/image";
import Link from "next/link";
import type { Tier } from "@/data/stats";

interface Player {
  user: { id: string; name: string | null; image: string | null };
  goals: number;
  avgFieldRating: number | null;
  level: number;
  tier: Tier;
  points: number;
}

export function TopPlayersWidget({ players }: { players: Player[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium">Top Giocatori</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {players.length === 0 && <p className="text-sm text-muted-foreground">Nessun dato disponibile.</p>}
        {players.map((p, i) => (
          <Link key={p.user.id} href={`/player/${p.user.id}`} className="flex items-center gap-3 rounded-md hover:bg-muted/50 transition-colors p-1 -mx-1">
            <span className="w-5 text-center text-xs text-muted-foreground font-mono">{i + 1}</span>
            {p.user.image ? (
              <Image src={p.user.image} alt={p.user.name ?? ""} width={28} height={28} className="rounded-full" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs">{p.user.name?.[0]}</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{p.user.name}</p>
              <p className="text-xs text-muted-foreground">{p.goals} gol · {p.avgFieldRating != null ? p.avgFieldRating.toFixed(1) : "—"} voto</p>
            </div>
            <TierBadge tier={p.tier} level={p.level} />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
