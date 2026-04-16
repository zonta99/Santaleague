import Link from "next/link";
import { getAllMatches } from "@/data/match";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MatchStatus } from "@prisma/client";
import { JoinMatchButton } from "./_components/join-match-button";

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

export default async function MatchListPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const matches = await getAllMatches();

  const joinedMatchIds = userId
    ? new Set(
        (
          await db.matchParticipant.findMany({
            where: { user_id: userId },
            select: { match_id: true },
          })
        ).map((p) => p.match_id)
      )
    : new Set<number>();

  return (
    <div className="w-full max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold">Giornate</h1>

      {matches.length === 0 ? (
        <p className="text-muted-foreground text-sm">Nessuna partita ancora registrata.</p>
      ) : (
        <div className="space-y-3">
          {matches.map((match) => {
            const isJoined = joinedMatchIds.has(match.id);
            const canJoin = match.status === "SCHEDULED";

            return (
              <Card key={match.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Link href={`/match/${match.id}`} className="hover:underline">
                      <CardTitle className="text-base">
                        {new Date(match.date).toLocaleDateString("it-IT", {
                          weekday: "long",
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </CardTitle>
                    </Link>
                    <Badge variant={statusVariant[match.status]}>
                      {statusLabel[match.status]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {match.Location?.name && <span>{match.Location.name} · </span>}
                    {match._count.Game} game · {match._count.MatchParticipant} partecipanti
                  </p>
                  {canJoin && (
                    <JoinMatchButton matchId={match.id} isJoined={isJoined} />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
