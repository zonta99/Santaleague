import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import { RatingMatchCard } from "./_components/rating-match-card";
import { Star, CheckCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function RatePage({ params }: Props) {
  const { id } = await params;
  const matchId = parseInt(id, 10);
  if (isNaN(matchId)) notFound();

  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) notFound();

  const isAdmin = session?.user?.role === UserRole.ADMIN || session?.user?.role === UserRole.MODERATOR;

  const match = await db.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      date: true,
      status: true,
      rating_open: true,
      rating_opened_at: true,
      DraftPick: {
        select: {
          user_id: true,
          team_id: true,
          User: { select: { id: true, name: true, image: true } },
          Team: { select: { name: true } },
        },
      },
      MatchRating: {
        where: { rater_id: userId },
        select: { rated_player_id: true, score: true, role: true },
      },
    },
  });

  if (!match) notFound();

  const isParticipant = await db.matchParticipant.findUnique({
    where: { match_id_user_id: { match_id: matchId, user_id: userId } },
  });

  if (!isParticipant && !isAdmin) notFound();

  const isExpired = match.rating_opened_at
    ? Date.now() - new Date(match.rating_opened_at).getTime() > 48 * 60 * 60 * 1000
    : false;

  const isOpen = match.rating_open && !isExpired;

  return (
    <div className="w-full max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Star className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Valuta i giocatori</h1>
          <p className="text-sm text-muted-foreground">
            {new Date(match.date).toLocaleDateString("it-IT", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}
          </p>
        </div>
      </div>

      {!isOpen && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
          <p className="font-medium">Nessuna valutazione in sospeso</p>
          <p className="text-sm text-muted-foreground">Hai già valutato tutti i giocatori o la finestra è chiusa.</p>
          <Button asChild variant="outline" size="sm">
            <Link href={`/match/${matchId}`}>Torna alla partita</Link>
          </Button>
        </div>
      )}

      {isOpen && (
        <RatingMatchCard
          match={match}
          currentUserId={userId}
          isAdmin={isAdmin}
        />
      )}
    </div>
  );
}
