import { Suspense } from "react";
import Link from "next/link";
import { getAllMatches } from "@/data/match";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getActiveLeagueId } from "@/lib/active-league";
import { canPerformLeagueAction } from "@/lib/league-auth";
import { MatchViewContainer } from "./_components/match-view-container";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function MatchListPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  const leagueId = await getActiveLeagueId();
  const [matches, canCreate] = await Promise.all([
    getAllMatches(leagueId ?? undefined),
    leagueId ? canPerformLeagueAction(leagueId, "createMatch") : Promise.resolve(false),
  ]);

  const joinedMatchIds = userId
    ? (
        await db.matchParticipant.findMany({
          where: { user_id: userId },
          select: { match_id: true },
        })
      ).map((p) => p.match_id)
    : [];

  const serializedMatches = matches.map((m) => ({
    ...m,
    date: m.date instanceof Date ? m.date.toISOString() : String(m.date),
  }));

  const { view: viewParam } = await searchParams;
  const view = viewParam === "calendario" ? "calendario" : "lista";

  return (
    <div className="w-full max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Giornate</h1>
        {canCreate && (
          <Button asChild size="sm">
            <Link href="/admin/match/new">
              <Plus className="h-4 w-4 mr-1" />
              Crea partita
            </Link>
          </Button>
        )}
      </div>
      <Suspense fallback={<div className="text-muted-foreground text-sm">Caricamento...</div>}>
        <MatchViewContainer
          matches={serializedMatches}
          joinedMatchIds={joinedMatchIds}
          defaultView={view}
          canCreate={canCreate}
        />
      </Suspense>
    </div>
  );
}
