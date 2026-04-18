import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSeasonById } from "@/data/season";
import { getLeaderboard } from "@/data/stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Target, TrendingUp, Star, ArrowLeft, Crown } from "lucide-react";

const MEDAL = ["🥇", "🥈", "🥉"];

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
}

export default async function SeasonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const seasonId = parseInt(id);
  if (isNaN(seasonId)) notFound();

  const [season, rows] = await Promise.all([getSeasonById(seasonId), getLeaderboard(seasonId)]);
  if (!season) notFound();

  const podium = rows.slice(0, 3);

  return (
    <div className="w-full max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/leaderboard">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Classifica
        </Link>
      </Button>

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">{season.name}</h1>
          <Badge variant={season.status === "ACTIVE" ? "default" : "secondary"}>
            {season.status === "ACTIVE" ? "In corso" : "Conclusa"}
          </Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          {formatDate(season.start_date)} → {formatDate(season.end_date)}
        </p>
      </div>

      {season.Champion && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex items-center gap-3 py-4 px-4">
            <Crown className="h-5 w-5 text-amber-400" />
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Campione</p>
              <p className="font-semibold">{season.Champion.name}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {podium.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Podio</h2>
          <div className="grid grid-cols-3 gap-2">
            {podium.map((row, i) => (
              <Card key={row.user.id} className={i === 0 ? "border-amber-400/50" : ""}>
                <CardContent className="flex flex-col items-center gap-1.5 py-3 px-2">
                  <span className="text-xl">{MEDAL[i]}</span>
                  {row.user.image ? (
                    <Image src={row.user.image} alt="" width={32} height={32} className="rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-sm">
                      {row.user.name?.[0] ?? "?"}
                    </div>
                  )}
                  <Link href={`/player/${row.user.id}`} className="text-xs font-medium hover:underline text-center line-clamp-2 leading-tight">
                    {row.user.name}
                  </Link>
                  <Badge variant="secondary" className="text-xs px-1.5">{row.points} pt</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground uppercase tracking-wide">
            Classifica finale · Gol ×3 · Vittoria +1
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <p className="text-muted-foreground text-sm p-6">Nessuna statistica disponibile.</p>
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
                    <td className="py-3 pl-4 text-muted-foreground">{MEDAL[i] ?? i + 1}</td>
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
