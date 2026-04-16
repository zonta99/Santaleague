import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, ShieldHalf } from "lucide-react";
import { DraftActions } from "./_components/draft-actions";
import { CaptainButton } from "./_components/captain-button";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function DraftPage({ params }: Props) {
  const role = await currentRole();
  if (role !== UserRole.ADMIN) redirect("/dashboard");

  const { id } = await params;
  const matchId = parseInt(id, 10);
  if (isNaN(matchId)) notFound();

  const match = await db.match.findUnique({
    where: { id: matchId },
    include: {
      Location: true,
      MatchParticipant: {
        include: { User: { select: { id: true, name: true, image: true } } },
        orderBy: { joined_at: "asc" },
      },
      DraftPick: {
        include: {
          User: { select: { id: true, name: true } },
          Team: {
            select: {
              id: true,
              name: true,
              TeamMember: { select: { user_id: true, is_captain: true } },
            },
          },
        },
        orderBy: { pick_order: "asc" },
      },
      Game: { orderBy: { game_number: "asc" } },
    },
  });

  if (!match) notFound();

  const hasDraft = match.DraftPick.length > 0;

  // Group draft picks by team
  const teamMap = new Map<number, { id: number; name: string; players: { id: string; name: string | null; isCaptain: boolean }[] }>();
  for (const pick of match.DraftPick) {
    if (!teamMap.has(pick.team_id)) {
      teamMap.set(pick.team_id, { id: pick.team_id, name: pick.Team.name, players: [] });
    }
    const isCaptain = pick.Team.TeamMember.some((m) => m.user_id === pick.user_id && m.is_captain);
    teamMap.get(pick.team_id)!.players.push({ id: pick.user_id, name: pick.User.name, isCaptain });
  }
  const teams = Array.from(teamMap.values());

  const matchLabel = new Date(match.date).toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="w-full max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href={`/match/${matchId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Draft giocatori</h1>
          <p className="text-muted-foreground text-sm capitalize">{matchLabel}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>{match.MatchParticipant.length} partecipanti · {match.Game.length} game</span>
        </div>
        <DraftActions matchId={matchId} hasDraft={hasDraft} />
      </div>

      {/* Draft result */}
      {hasDraft && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {teams.map((team, i) => (
            <Card key={i} className={i === 0 ? "border-blue-500/40" : "border-red-500/40"}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldHalf className={`h-4 w-4 ${i === 0 ? "text-blue-500" : "text-red-500"}`} />
                  {team.name}
                  <Badge variant="secondary" className="ml-auto">{team.players.length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-1.5">
                  {team.players.map((p, idx) => (
                    <li key={p.id} className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground w-5 text-right">{idx + 1}.</span>
                      <span className="flex-1">{p.name ?? "—"}</span>
                      {p.isCaptain && (
                        <Badge variant="outline" className="text-yellow-500 border-yellow-500/40 text-xs px-1.5 py-0">
                          C
                        </Badge>
                      )}
                      <CaptainButton
                        matchId={matchId}
                        teamId={team.id}
                        userId={p.id}
                        isCaptain={p.isCaptain}
                      />
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Participants list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Iscritti
          </CardTitle>
        </CardHeader>
        <CardContent>
          {match.MatchParticipant.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessun partecipante iscritto.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {match.MatchParticipant.map((p) => {
                const pick = match.DraftPick.find((d) => d.user_id === p.user_id);
                const teamIdx = pick ? teams.findIndex((t) => t.name === pick.Team.name) : -1;
                return (
                  <div
                    key={p.user_id}
                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm border ${
                      teamIdx === 0
                        ? "border-blue-500/30 bg-blue-500/5"
                        : teamIdx === 1
                        ? "border-red-500/30 bg-red-500/5"
                        : "border-border"
                    }`}
                  >
                    <span className="truncate">{p.User.name ?? "—"}</span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
