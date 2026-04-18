"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TierBadge } from "@/components/tier-badge";
import { Target, TrendingUp, BarChart2, Search } from "lucide-react";
import type { Tier } from "@/data/stats";

type Player = {
  user: { id: string; name: string | null; image: string | null };
  goals: number;
  wins: number;
  gamesPlayed: number;
  level: number;
  tier: Tier;
  avgFieldRating: number | null;
  avgGkRating: number | null;
  points: number;
};

type SortKey = "level" | "goals" | "wins" | "avgFieldRating";
const TIERS: (Tier | "Tutti")[] = ["Tutti", "Bronze", "Silver", "Gold", "Platinum", "Legend"];

interface Props {
  players: Player[];
}

export function PlayersGrid({ players }: Props) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("level");
  const [tierFilter, setTierFilter] = useState<Tier | "Tutti">("Tutti");

  const filtered = useMemo(() => {
    let list = players;
    if (tierFilter !== "Tutti") list = list.filter((p) => p.tier === tierFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.user.name?.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (sort === "avgFieldRating") {
        return (b.avgFieldRating ?? -1) - (a.avgFieldRating ?? -1);
      }
      return b[sort] - a[sort];
    });
  }, [players, search, sort, tierFilter]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cerca giocatore…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {(["level", "goals", "wins", "avgFieldRating"] as SortKey[]).map((key) => (
            <Button
              key={key}
              size="sm"
              variant={sort === key ? "default" : "outline"}
              onClick={() => setSort(key)}
            >
              {key === "level" ? "Livello" : key === "goals" ? "Gol" : key === "wins" ? "Vittorie" : "Rating"}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex gap-1 flex-wrap">
        {TIERS.map((t) => (
          <Button
            key={t}
            size="sm"
            variant={tierFilter === t ? "secondary" : "ghost"}
            onClick={() => setTierFilter(t)}
            className="text-xs"
          >
            {t}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nessun giocatore trovato.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map(({ user, goals, wins, level, tier, avgFieldRating, gamesPlayed }) => (
            <Link key={user.id} href={`/player/${user.id}`}>
              <Card className="hover:bg-accent transition-colors cursor-pointer h-full">
                <CardContent className="py-4 px-4 flex gap-3 items-start">
                  {user.image ? (
                    <Image src={user.image} alt="" width={40} height={40} className="rounded-full flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {user.name?.[0] ?? "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold truncate">{user.name ?? "—"}</span>
                      <TierBadge tier={tier} level={level} />
                    </div>
                    <div className="flex gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <Target className="h-3 w-3 text-green-500" />{goals}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <TrendingUp className="h-3 w-3 text-blue-500" />{wins}
                      </span>
                      {avgFieldRating !== null && (
                        <span className="flex items-center gap-0.5">
                          <BarChart2 className="h-3 w-3 text-purple-400" />{avgFieldRating.toFixed(1)}
                        </span>
                      )}
                      <span className="text-muted-foreground">{gamesPlayed}G</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
