import { Suspense } from "react";
import { getAllMatches } from "@/data/match";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { MatchViewContainer } from "./_components/match-view-container";

export default async function MatchListPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;

  const matches = await getAllMatches();

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
      <h1 className="text-2xl font-bold">Giornate</h1>
      <Suspense fallback={<div className="text-muted-foreground text-sm">Caricamento...</div>}>
        <MatchViewContainer
          matches={serializedMatches}
          joinedMatchIds={joinedMatchIds}
          defaultView={view}
        />
      </Suspense>
    </div>
  );
}
