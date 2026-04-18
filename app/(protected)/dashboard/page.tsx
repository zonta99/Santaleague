import Link from "next/link";
import { getRecentMatches } from "@/data/match";
import { getUserStats } from "@/data/stats";
import { getPendingRatingMatches } from "@/data/ratings";
import { currentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MatchStatus } from "@prisma/client";
import {
  Trophy,
  Target,
  Activity,
  CalendarCheck,
  Star,
} from "lucide-react";

const statusLabel: Record<MatchStatus, string> = {
  SCHEDULED: "Programmata",
  ONGOING: "In corso",
  COMPLETED: "Conclusa",
  CANCELED: "Annullata",
};

const statusVariant: Record<MatchStatus, "default" | "secondary" | "destructive" | "outline"> = {
  SCHEDULED: "secondary",
  ONGOING: "default",
  COMPLETED: "outline",
  CANCELED: "destructive",
};

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
}) {
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

export default async function DashboardPage() {
  const user = await currentUser();
  const [matches, stats, pendingRatings] = await Promise.all([
    getRecentMatches(3),
    user?.id ? getUserStats(user.id) : null,
    user?.id ? getPendingRatingMatches(user.id) : [],
  ]);

  const firstName = user?.name?.split(" ")[0] ?? "Giocatore";

  return (
    <div className="w-full max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Ciao, {firstName} 👋</h1>
        <p className="text-muted-foreground text-sm">Benvenuto nella tua area personale</p>
      </div>

      {pendingRatings.length > 0 && (
        <section>
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="flex items-center justify-between gap-3 py-4">
              <div className="flex items-center gap-3 min-w-0">
                <Star className="h-5 w-5 text-amber-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold text-amber-200">Valutazioni in sospeso</p>
                  <p className="text-sm text-muted-foreground">
                    Hai {pendingRatings.length} {pendingRatings.length === 1 ? "partita" : "partite"} da valutare
                  </p>
                </div>
              </div>
              <Button asChild size="sm" className="bg-amber-500 hover:bg-amber-400 text-black font-semibold flex-shrink-0">
                <Link href={`/match/${pendingRatings[0].match_id}/rate`}>Vota ora</Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

      {stats?.nextMatch && (
        <section className="space-y-2">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Prossima partita
          </h2>
          <Card className="border-primary/40 bg-primary/5">
            <CardContent className="flex items-center justify-between gap-3 py-4">
              <div className="flex items-center gap-3 min-w-0">
                <CalendarCheck className="h-5 w-5 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="font-semibold truncate">{formatDate(stats.nextMatch.date)}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {stats.nextMatch.Location?.name ?? "Campo da definire"} ·{" "}
                    {stats.nextMatch._count.MatchParticipant} iscritti
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="flex-shrink-0">Iscritto</Badge>
            </CardContent>
          </Card>
        </section>
      )}

      {stats && (
        <section className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Le tue statistiche
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <StatCard
              icon={<Activity className="h-4 w-4 text-muted-foreground" />}
              label="Partite"
              value={stats.matchesPlayed}
            />
            <StatCard
              icon={<Target className="h-4 w-4 text-green-500" />}
              label="Goal"
              value={stats.goals}
            />
            {stats.matchesPlayed > 0 && (
              <StatCard
                icon={<Trophy className="h-4 w-4 text-amber-400" />}
                label="Reti/partita"
                value={(stats.goals / stats.matchesPlayed).toFixed(1)}
              />
            )}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Ultime giornate
        </h2>
        {matches.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nessuna partita ancora registrata.</p>
        ) : (
          matches.map((match) => (
            <Link key={match.id} href="/match">
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {match.date ? formatDate(match.date) : "Data da definire"}
                    </CardTitle>
                    <Badge variant={statusVariant[match.status]}>
                      {statusLabel[match.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {match.Location?.name && <span>{match.Location.name} · </span>}
                  <span>{match._count.Game} game</span>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
        <Button asChild variant="outline" className="w-full">
          <Link href="/match">Tutte le giornate</Link>
        </Button>
      </section>
    </div>
  );
}
