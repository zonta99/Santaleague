import Link from "next/link";
import Image from "next/image";
import { getLeaderboard } from "@/data/stats";
import { getAllSeasons, getActiveSeason } from "@/data/season";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target, Star, TrendingUp, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeasonSelector } from "./_components/season-selector";
import { TierBadge } from "@/components/tier-badge";

const MEDAL = ["🥇", "🥈", "🥉"];

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const { season } = await searchParams;
  const [seasons, activeSeason] = await Promise.all([getAllSeasons(), getActiveSeason()]);

  const seasonId = season ? parseInt(season) : activeSeason?.id;
  const rows = await getLeaderboard(seasonId);

  const currentSeason = seasons.find((s) => s.id === seasonId);
  const label = currentSeason ? currentSeason.name : "Tutte le stagioni";

  return (
    <div className="w-full max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Classifica</h1>
          <p className="text-muted-foreground text-sm">Punti accumulati dalle partite completate</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button asChild variant="ghost" size="sm">
            <Link href="/season">
              <Archive className="h-4 w-4 mr-1" />
              Archivio
            </Link>
          </Button>
          <SeasonSelector seasons={seasons} activeSeason={activeSeason} currentSeasonId={seasonId} />
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">
            {label} · Gol ×3 · Vittoria +1
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm p-6">
              Nessuna statistica disponibile. Completa una partita per vedere la classifica.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="text-left py-3 pl-4 w-8">#</th>
                  <th className="text-left py-3 pl-2">Giocatore</th>
                  <th className="text-center py-3 px-2">
                    <Target className="h-3.5 w-3.5 inline text-green-500" />
                  </th>
                  <th className="text-center py-3 px-2">
                    <TrendingUp className="h-3.5 w-3.5 inline text-blue-500" />
                  </th>
                  <th className="text-center py-3 px-2 hidden sm:table-cell">
                    <Star className="h-3.5 w-3.5 inline text-amber-400" />
                  </th>
                  <th className="text-center py-3 px-2 hidden sm:table-cell">Livello</th>
                  <th className="text-right py-3 pr-4">
                    <Trophy className="h-3.5 w-3.5 inline text-primary" />
                    <span className="ml-1">Pt</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr
                    key={row.user.id}
                    className={`border-b last:border-0 hover:bg-accent transition-colors ${i < 3 ? "font-semibold" : ""}`}
                  >
                    <td className="py-3 pl-4 text-muted-foreground">
                      {MEDAL[i] ?? i + 1}
                    </td>
                    <td className="py-3 pl-2">
                      <Link href={`/player/${row.user.id}`} className="flex items-center gap-2 hover:underline">
                        {row.user.image ? (
                          <Image src={row.user.image} alt="" width={24} height={24} className="rounded-full flex-shrink-0" />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs flex-shrink-0">
                            {row.user.name?.[0] ?? "?"}
                          </div>
                        )}
                        <span className="truncate max-w-[100px] sm:max-w-none">{row.user.name ?? "—"}</span>
                      </Link>
                    </td>
                    <td className="text-center py-3 px-2">{row.goals}</td>
                    <td className="text-center py-3 px-2">{row.wins}</td>
                    <td className="text-center py-3 px-2 hidden sm:table-cell">{row.mvpCount}</td>
                    <td className="text-center py-3 px-2 hidden sm:table-cell">
                      <TierBadge tier={row.tier} level={row.level} />
                    </td>
                    <td className="text-right py-3 pr-4">
                      <Badge variant={i === 0 ? "default" : "secondary"}>{row.points}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
