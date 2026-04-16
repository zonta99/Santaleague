import Link from "next/link";
import { getRecentMatches } from "@/data/match";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MatchStatus } from "@prisma/client";

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

export default async function DashboardPage() {
  const matches = await getRecentMatches(3);

  return (
    <div className="w-full max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Ultime giornate</p>
      </div>

      <section className="space-y-3">
        {matches.length === 0 ? (
          <p className="text-muted-foreground text-sm">Nessuna partita ancora registrata.</p>
        ) : (
          matches.map((match) => (
            <Link key={match.id} href={`/match`}>
              <Card className="hover:bg-accent transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      {match.date
                        ? new Date(match.date).toLocaleDateString("it-IT", {
                            weekday: "long",
                            day: "numeric",
                            month: "long",
                          })
                        : "Data da definire"}
                    </CardTitle>
                    <Badge variant={statusVariant[match.status]}>
                      {statusLabel[match.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {match.Location?.name && <span>{match.Location.name} · </span>}
                  <span>{match._count.Game} {match._count.Game === 1 ? "game" : "game"}</span>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
        <Button asChild variant="outline" className="w-full">
          <Link href="/match">Tutte le giornate</Link>
        </Button>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Classifica</h2>
        <Card>
          <CardContent className="py-6 text-center text-muted-foreground text-sm">
            Classifica disponibile a breve
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
