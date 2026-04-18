"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldHalf, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TierBadge } from "@/components/tier-badge";
import { movePlayer } from "@/actions/draft";
import { CaptainButton } from "./captain-button";
import type { Tier } from "@/data/stats";

type PlayerRow = { id: string; name: string | null; isCaptain: boolean };
type TeamData = { id: number; name: string; players: PlayerRow[] };
type LevelInfo = { level: number; tier: Tier };

interface DraftBoardProps {
  teams: TeamData[];
  levelMap: Map<string, LevelInfo>;
  matchId: number;
  isLocked: boolean;
}

const TEAM_COLORS = [
  { border: "border-blue-500/40", icon: "text-blue-500", strength: "text-blue-400", bg: "bg-blue-500/10" },
  { border: "border-red-500/40", icon: "text-red-500", strength: "text-red-400", bg: "bg-red-500/10" },
  { border: "border-green-500/40", icon: "text-green-500", strength: "text-green-400", bg: "bg-green-500/10" },
  { border: "border-orange-500/40", icon: "text-orange-500", strength: "text-orange-400", bg: "bg-orange-500/10" },
  { border: "border-purple-500/40", icon: "text-purple-500", strength: "text-purple-400", bg: "bg-purple-500/10" },
  { border: "border-yellow-500/40", icon: "text-yellow-500", strength: "text-yellow-400", bg: "bg-yellow-500/10" },
];

function computeStrengths(teams: TeamData[], levelMap: Map<string, LevelInfo>): number[] {
  return teams.map((team) => team.players.reduce((sum, p) => sum + (levelMap.get(p.id)?.level ?? 0), 0));
}

function BalanceIndicator({ delta }: { delta: number }) {
  if (delta < 1.5) return <span className="text-green-400 text-xs font-medium">Bilanciato</span>;
  if (delta < 3) return <span className="text-yellow-400 text-xs font-medium">Accettabile</span>;
  return <span className="text-red-400 text-xs font-medium">Sbilanciato</span>;
}

export function DraftBoard({ teams: initialTeams, levelMap, matchId, isLocked }: DraftBoardProps) {
  const [teams, setTeams] = useState(initialTeams);
  const [draggedPlayer, setDraggedPlayer] = useState<{ userId: string; fromTeamId: number } | null>(null);
  const [dragOverTeamId, setDragOverTeamId] = useState<number | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();
  const previousTeams = useRef(initialTeams);

  const strengths = computeStrengths(teams, levelMap);
  const delta = strengths.length >= 2 ? Math.max(...strengths) - Math.min(...strengths) : 0;

  const handleDrop = (toTeamId: number) => {
    if (!draggedPlayer || draggedPlayer.fromTeamId === toTeamId) return;

    const { userId, fromTeamId } = draggedPlayer;
    previousTeams.current = teams;

    // Optimistic update
    setTeams((prev) => {
      const next = prev.map((t) => ({ ...t, players: [...t.players] }));
      const fromTeam = next.find((t) => t.id === fromTeamId)!;
      const toTeam = next.find((t) => t.id === toTeamId)!;
      const playerIdx = fromTeam.players.findIndex((p) => p.id === userId);
      if (playerIdx === -1) return prev;
      const [player] = fromTeam.players.splice(playerIdx, 1);
      toTeam.players.push(player);
      return next;
    });

    startTransition(async () => {
      const result = await movePlayer(matchId, userId, toTeamId);
      if (result.error) {
        toast.error(result.error);
        setTeams(previousTeams.current);
      } else {
        router.refresh();
      }
    });

    setDraggedPlayer(null);
    setDragOverTeamId(null);
  };

  return (
    <div className="space-y-3">
      {/* Balance row */}
      <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
        {teams.map((team, i) => (
          <span key={team.id} className={`font-medium ${TEAM_COLORS[i]?.strength ?? ""}`}>
            {strengths[i]?.toFixed(1)}
          </span>
        ))}
        {teams.length >= 2 && (
          <>
            <span className="text-xs">(delta: {delta.toFixed(1)})</span>
            <BalanceIndicator delta={delta} />
          </>
        )}
        {isLocked && (
          <Badge variant="outline" className="text-green-400 border-green-400/40 ml-2 gap-1">
            <Lock className="h-3 w-3" />
            Bloccato
          </Badge>
        )}
      </div>

      {/* Team columns */}
      <div className={`grid gap-4 grid-cols-1 ${teams.length === 2 ? "sm:grid-cols-2" : teams.length === 3 ? "sm:grid-cols-3" : teams.length === 4 ? "sm:grid-cols-4" : teams.length === 5 ? "sm:grid-cols-5" : "sm:grid-cols-6"}`}>
        {teams.map((team, i) => {
          const colors = TEAM_COLORS[i] ?? TEAM_COLORS[0];
          const isOver = dragOverTeamId === team.id;
          return (
            <Card
              key={team.id}
              className={`${colors.border} transition-colors ${isOver && !isLocked ? colors.bg : ""}`}
              onDragOver={(e) => { if (!isLocked) { e.preventDefault(); setDragOverTeamId(team.id); } }}
              onDragLeave={() => setDragOverTeamId(null)}
              onDrop={() => handleDrop(team.id)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldHalf className={`h-4 w-4 ${colors.icon}`} />
                  {team.name}
                  <Badge variant="secondary" className="ml-auto">{team.players.length}</Badge>
                  <span className={`text-xs font-normal ${colors.strength}`}>∑{strengths[i]?.toFixed(1)}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="space-y-1.5">
                  {team.players.map((p, idx) => {
                    const pl = levelMap.get(p.id);
                    return (
                      <li
                        key={p.id}
                        draggable={!isLocked}
                        onDragStart={() => setDraggedPlayer({ userId: p.id, fromTeamId: team.id })}
                        onDragEnd={() => { setDraggedPlayer(null); setDragOverTeamId(null); }}
                        className={`flex items-center gap-2 text-sm rounded px-1 ${!isLocked ? "cursor-grab active:cursor-grabbing hover:bg-muted/40" : ""} ${draggedPlayer?.userId === p.id ? "opacity-40" : ""}`}
                      >
                        <span className="text-muted-foreground w-5 text-right">{idx + 1}.</span>
                        <span className="flex-1">{p.name ?? "—"}</span>
                        {pl && <TierBadge tier={pl.tier} level={pl.level} />}
                        {p.isCaptain && (
                          <Badge variant="outline" className="text-yellow-500 border-yellow-500/40 text-xs px-1.5 py-0">
                            C
                          </Badge>
                        )}
                        <CaptainButton matchId={matchId} teamId={team.id} userId={p.id} isCaptain={p.isCaptain} />
                      </li>
                    );
                  })}
                </ol>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
