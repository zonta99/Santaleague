import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlayerProfile, getPlayerLevel, getLeaderboard } from "@/data/stats";
import { getAllSeasons, getActiveSeason, getPlayerChampionships } from "@/data/season";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Target, Activity, ArrowLeft, TrendingUp, Crown, BarChart2, LineChart } from "lucide-react";
import { MatchStatus } from "@prisma/client";
import { SeasonSelector } from "@/app/(protected)/leaderboard/_components/season-selector";
import { TierBadge } from "@/components/tier-badge";
import { LevelHistoryChart } from "./_components/level-history-chart";
import { RatingSparkline } from "./_components/rating-sparkline";
import { SeasonBreakdown } from "./_components/season-breakdown";
import { HeadToHead } from "./_components/head-to-head";
import { BadgeDisplay } from "@/components/badge-display";
import { Medal } from "lucide-react";

const statusLabel: Record<MatchStatus, string> = {
  SCHEDULED: "Programmata",
  ONGOING: "In corso",
  COMPLETED: "Conclusa",
  CANCELED: "Annullata",
};

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: number | string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 py-4 px-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {icon}
          {label}
        </div>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

export default async function PlayerProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ season?: string }>;
}) {
  const { id } = await params;
  const { season } = await searchParams;

  const [seasons, activeSeason, championships, leaderboardRows] = await Promise.all([
    getAllSeasons(),
    getActiveSeason(),
    getPlayerChampionships(id),
    getLeaderboard(),
  ]);
  const seasonId = season ? parseInt(season) : undefined;

  const profile = await getPlayerProfile(id, seasonId);

  const completedSeasons = seasons.filter((s) => s.status === "COMPLETED");
  const levelHistory = await Promise.all(
    completedSeasons.map(async (s) => {
      const { level, tier } = await getPlayerLevel(id, s.id);
      return { season: s.name, level, tier };
    })
  );
  if (!profile.user) notFound();

  const { user, totals, matchRows, ratingTrend } = profile;
  const seasonLabel = seasonId
    ? (seasons.find((s) => s.id === seasonId)?.name ?? "Stagione")
    : "Tutte le stagioni";

  const otherPlayers = leaderboardRows
    .map((r) => r.user)
    .filter((u) => u.id !== id);

  return (
    <div className="w-full max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/leaderboard">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Classifica
          </Link>
        </Button>
        <SeasonSelector seasons={seasons} activeSeason={activeSeason} currentSeasonId={seasonId} />
      </div>

      <div className="flex items-center gap-4">
        {user.image ? (
          <Image src={user.image} alt="" width={56} height={56} className="rounded-full" />
        ) : (
          <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-xl font-bold">
            {user.name?.[0] ?? "?"}
          </div>
        )}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <TierBadge tier={totals.tier} level={totals.level} />
          </div>
          <p className="text-muted-foreground text-sm">{seasonLabel}</p>
          {championships.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {championships.map((c) => (
                <Link key={c.id} href={`/season/${c.id}`}>
                  <Badge variant="secondary" className="text-amber-400 gap-1 cursor-pointer hover:bg-accent">
                    <Crown className="h-3 w-3" />
                    {c.name}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Statistiche</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard icon={<Activity className="h-4 w-4 text-muted-foreground" />} label="Partite" value={matchRows.length} />
          <StatCard icon={<Target className="h-4 w-4 text-green-500" />} label="Gol" value={totals.goals} />
          <StatCard icon={<TrendingUp className="h-4 w-4 text-blue-500" />} label="Vittorie" value={totals.wins} />
          <StatCard icon={<Trophy className="h-4 w-4 text-primary" />} label="Punti" value={totals.points} />
        </div>
        {(totals.avgFieldRating !== null || totals.avgGkRating !== null) && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {totals.avgFieldRating !== null && (
              <StatCard icon={<BarChart2 className="h-4 w-4 text-purple-400" />} label="Rating campo" value={totals.avgFieldRating.toFixed(1)} />
            )}
            {totals.avgGkRating !== null && (
              <StatCard icon={<BarChart2 className="h-4 w-4 text-teal-400" />} label="Rating portiere" value={totals.avgGkRating.toFixed(1)} />
            )}
          </div>
        )}
      </section>

      {ratingTrend.length >= 2 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
            <LineChart className="h-4 w-4" />
            Andamento rating (ultime {ratingTrend.length} partite)
          </h2>
          <Card>
            <CardContent className="pt-4 pb-2">
              <RatingSparkline data={ratingTrend} />
            </CardContent>
          </Card>
        </section>
      )}

      {levelHistory.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Livello per stagione</h2>
          <LevelHistoryChart data={levelHistory} />
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
          <Medal className="h-4 w-4" />
          Badge
        </h2>
        <BadgeDisplay userId={id} />
      </section>

      <SeasonBreakdown userId={id} />

      <HeadToHead userId={id} allPlayers={otherPlayers} />

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Storico partite</h2>
        {matchRows.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nessuna partita ancora giocata.</p>
        ) : (
          <Card>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-3 pl-4">Data</th>
                    <th className="text-left py-3 px-2 hidden sm:table-cell">Team</th>
                    <th className="text-center py-3 px-2">
                      <Target className="h-3.5 w-3.5 inline text-green-500" />
                    </th>
                    <th className="text-center py-3 px-2">
                      <TrendingUp className="h-3.5 w-3.5 inline text-blue-500" />
                    </th>
                    <th className="text-center py-3 px-2 hidden sm:table-cell">
                      <BarChart2 className="h-3.5 w-3.5 inline text-purple-400" />
                    </th>
                    <th className="text-right py-3 pr-4">Pt</th>
                  </tr>
                </thead>
                <tbody>
                  {matchRows.map((row) => (
                    <tr key={row.matchId} className="border-b last:border-0 hover:bg-accent transition-colors">
                      <td className="py-3 pl-4">
                        <Link href={`/match/${row.matchId}`} className="hover:underline">
                          {formatDate(row.date)}
                        </Link>
                        {row.location && (
                          <p className="text-xs text-muted-foreground">{row.location}</p>
                        )}
                      </td>
                      <td className="py-3 px-2 hidden sm:table-cell text-muted-foreground text-xs">{row.team}</td>
                      <td className="text-center py-3 px-2">{row.goals}</td>
                      <td className="text-center py-3 px-2">{row.wins}</td>
                      <td className="text-center py-3 px-2 hidden sm:table-cell text-xs text-muted-foreground">
                        {row.avgFieldRating !== null ? row.avgFieldRating.toFixed(1) : "—"}
                      </td>
                      <td className="text-right py-3 pr-4">
                        <Badge variant={row.points > 0 ? "default" : "secondary"}>{row.points}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}
