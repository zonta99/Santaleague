"use client";

import Link from "next/link";
import { MatchStatus } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JoinMatchButton } from "./join-match-button";
import { MatchCountdown } from "./match-countdown";
import { statusLabel, statusVariant } from "./match-constants";

export interface MatchItem {
  id: number;
  date: string;
  status: MatchStatus;
  match_type: string;
  Location?: { name: string } | null;
  _count: { Game: number; MatchParticipant: number };
}

interface MatchCardProps {
  match: MatchItem;
  isJoined: boolean;
}

export function MatchCard({ match, isJoined }: MatchCardProps) {
  const canJoin = match.status === "SCHEDULED";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/match/${match.id}`} className="hover:underline min-w-0">
            <CardTitle className="text-base leading-snug">
              {match.status === "SCHEDULED" ? (
                <MatchCountdown date={match.date} />
              ) : (
                <span className="capitalize">
                  {new Date(match.date).toLocaleDateString("it-IT", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              )}
            </CardTitle>
          </Link>
          <Badge variant={statusVariant[match.status]} className="flex-shrink-0">
            {statusLabel[match.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground min-w-0 truncate">
          {match.Location?.name && <span>{match.Location.name} · </span>}
          {match._count.Game} game · {match._count.MatchParticipant} partecipanti
        </p>
        {canJoin && <JoinMatchButton matchId={match.id} isJoined={isJoined} />}
      </CardContent>
    </Card>
  );
}
