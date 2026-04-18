import { getMatchById, getMatchParticipants } from "@/data/match";
import { getPendingRatingGames } from "@/data/ratings";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JoinMatchButton } from "../_components/join-match-button";
import { MatchControls } from "./_components/match-controls";
import { MatchHubTabs } from "./_components/match-hub-tabs";
import { MapPin, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  SCHEDULED: { label: "Programmata", dot: "bg-amber-400",   badge: "border-amber-400/30 text-amber-400 bg-amber-400/10" },
  ONGOING:   { label: "In corso",    dot: "bg-emerald-400", badge: "border-emerald-400/30 text-emerald-400 bg-emerald-400/10" },
  COMPLETED: { label: "Conclusa",    dot: "bg-zinc-500",    badge: "border-zinc-600 text-zinc-400 bg-zinc-800/40" },
  CANCELED:  { label: "Annullata",   dot: "bg-red-500",     badge: "border-red-500/30 text-red-400 bg-red-500/10" },
};

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MatchDetailPage({ params }: Props) {
  const { id } = await params;
  const matchId = parseInt(id, 10);
  if (isNaN(matchId)) notFound();

  const session = await auth();
  const userId = session?.user?.id;
  const isAdmin = session?.user?.role === UserRole.ADMIN || session?.user?.role === UserRole.MODERATOR;

  const [match, participants, pendingRatings] = await Promise.all([
    getMatchById(matchId),
    getMatchParticipants(matchId),
    userId ? getPendingRatingGames(userId) : Promise.resolve([]),
  ]);

  if (!match) notFound();

  const isParticipant = userId
    ? !!(await db.matchParticipant.findUnique({
        where: { match_id_user_id: { match_id: matchId, user_id: userId } },
      }))
    : false;

  const status: string = match.status;
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.SCHEDULED;
  const isScheduled = status === "SCHEDULED";
  const isOngoing = status === "ONGOING";
  const isCompleted = status === "COMPLETED";
  const hasDraft = match.DraftPick.length > 0;

  const showPartite = match.Game.length > 0;
  const showBozza = isAdmin && isScheduled;
  const showVota = (isParticipant || isAdmin) && pendingRatings.some((g: any) => g.match_id === matchId);
  const showRiepilogo = isCompleted;

  type TabKey = "info" | "partite" | "riepilogo";
  const defaultTab: TabKey = isOngoing ? "partite" : isCompleted ? "riepilogo" : "info";

  return (
    <div className="w-full max-w-2xl space-y-5">
      {/* ── Header ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOngoing && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
            )}
            <span className={`text-[11px] font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${statusCfg.badge}`}>
              {statusCfg.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && isOngoing && (
              <Button asChild variant="outline" size="sm" className="h-7 text-xs border-white/10 hover:border-white/20" title="Visualizzazione tabellone">
                <Link href={`/match/${matchId}/scoreboard`}>
                  <Monitor className="h-3 w-3 mr-1.5" />
                  Tabellone
                </Link>
              </Button>
            )}
            {isAdmin && <MatchControls matchId={matchId} status={status} hasDraft={hasDraft} />}
            {isScheduled && <JoinMatchButton matchId={matchId} isJoined={isParticipant} />}
          </div>
        </div>

        <div>
          <h1 className="text-xl font-bold leading-tight capitalize">
            {new Date(match.date).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-muted-foreground capitalize">{match.match_type}</span>
            {match.Location?.name && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                {match.Location.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabbed hub ── */}
      <MatchHubTabs
        matchId={matchId}
        games={match.Game}
        participants={participants}
        draftPicks={match.DraftPick}
        defaultTab={defaultTab}
        showPartite={showPartite}
        showBozza={showBozza}
        showVota={showVota}
        showRiepilogo={showRiepilogo}
        isScheduled={isScheduled}
        isOngoing={isOngoing}
        isAdmin={isAdmin}
        hasDraft={hasDraft}
      />
    </div>
  );
}
