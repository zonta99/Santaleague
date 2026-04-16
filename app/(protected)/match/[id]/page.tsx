import { getMatchById, getMatchParticipants } from "@/data/match";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { User, GameDetail, Game, Team, Match, UserRole } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";
import { JoinMatchButton } from "../_components/join-match-button";
import { GameDetailForm } from "./_components/game-detail-form";
import { MatchControls } from "./_components/match-controls";
import { Users, Shuffle, MapPin, Radio, Crown } from "lucide-react";

type GameDetailType = GameDetail & {
  id: number;
  event_type: string;
  player_id: string | null;
  team_id: number | null;
  minute: number | null;
  User: { name: string | null; image: string | null } | null;
  Team: { name: string | null; logo: string | null } | null;
};

type GameType = Game & {
  Team1: (Team & { id: number }) | null;
  Team2: (Team & { id: number }) | null;
  GameDetail: GameDetailType[];
};

type DraftPickType = {
  user_id: string;
  team_id: number;
  User: { id: string; name: string | null; image: string | null };
  Team: { TeamMember: { user_id: string; is_captain: boolean }[] } | null;
};

type MatchType = Match & {
  status: string;
  match_type: string;
  Game: GameType[];
  DraftPick: DraftPickType[];
  Location?: { name: string } | null;
};

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  SCHEDULED:  { label: "Programmata", dot: "bg-amber-400",   badge: "border-amber-400/30 text-amber-400 bg-amber-400/10" },
  ONGOING:    { label: "In corso",    dot: "bg-emerald-400", badge: "border-emerald-400/30 text-emerald-400 bg-emerald-400/10" },
  COMPLETED:  { label: "Conclusa",    dot: "bg-zinc-500",    badge: "border-zinc-600 text-zinc-400 bg-zinc-800/40" },
  CANCELED:   { label: "Annullata",   dot: "bg-red-500",     badge: "border-red-500/30 text-red-400 bg-red-500/10" },
};

function PlayerAvatar({ name, image, size = 36 }: { name: string | null; image: string | null; size?: number }) {
  const initials = (name ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  if (image) return <Image src={image} alt={name ?? ""} width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  return (
    <div style={{ width: size, height: size }} className="rounded-full bg-white/[0.08] text-white/60 flex items-center justify-center text-xs font-semibold shrink-0">
      {initials}
    </div>
  );
}

function ScoreBoard({ game }: { game: GameType }) {
  if (!game.Team1 || !game.Team2) return null;
  const t1 = game.GameDetail.filter((d) => d.event_type === "Goal" && d.team_id === game.team1_id).length;
  const t2 = game.GameDetail.filter((d) => d.event_type === "Goal" && d.team_id === game.team2_id).length;

  return (
    <div className="flex items-center justify-between gap-4 py-4 px-2">
      {/* Team 1 */}
      <div className="flex flex-col items-center gap-1 flex-1">
        <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-400/20 flex items-center justify-center text-blue-300 text-xs font-bold">
          {game.Team1.name.charAt(0)}
        </div>
        <span className="text-xs text-muted-foreground text-center leading-tight max-w-[80px]">{game.Team1.name}</span>
      </div>

      {/* Score */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-4xl font-black tabular-nums text-white">{t1}</span>
        <span className="text-xl text-white/20 font-light">–</span>
        <span className="text-4xl font-black tabular-nums text-white">{t2}</span>
      </div>

      {/* Team 2 */}
      <div className="flex flex-col items-center gap-1 flex-1">
        <div className="w-10 h-10 rounded-full bg-red-500/20 border border-red-400/20 flex items-center justify-center text-red-300 text-xs font-bold">
          {game.Team2.name.charAt(0)}
        </div>
        <span className="text-xs text-muted-foreground text-center leading-tight max-w-[80px]">{game.Team2.name}</span>
      </div>
    </div>
  );
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MatchDetailPage({ params }: Props) {
  const { id } = await params;
  const matchId = parseInt(id, 10);
  if (isNaN(matchId)) notFound();

  const session = await auth();
  const userId = session?.user?.id;
  const isAdmin = session?.user?.role === UserRole.ADMIN;

  const [match, participants] = await Promise.all([
    getMatchById(matchId) as Promise<MatchType | null>,
    getMatchParticipants(matchId),
  ]);

  if (!match) notFound();

  const isJoined = userId
    ? !!(await db.matchParticipant.findUnique({
        where: { match_id_user_id: { match_id: matchId, user_id: userId } },
      }))
    : false;

  const status = match.status as string;
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.SCHEDULED;
  const isScheduled = status === "SCHEDULED";
  const isOngoing = status === "ONGOING";
  const isCompleted = status === "COMPLETED";
  const hasDraft = match.DraftPick.length > 0;
  const canJoin = isScheduled;

  return (
    <div className="w-full max-w-2xl space-y-5">

      {/* ── Header ── */}
      <div className="space-y-3">
        {/* Status row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isOngoing && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" /></span>}
            <span className={`text-[11px] font-semibold uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${statusCfg.badge}`}>
              {statusCfg.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && <MatchControls matchId={matchId} status={status} hasDraft={hasDraft} />}
            {isAdmin && isScheduled && (
              <Button asChild variant="outline" size="sm" className="h-7 text-xs border-white/10 hover:border-white/20">
                <Link href={`/match/${matchId}/draft`}>
                  <Shuffle className="h-3 w-3 mr-1.5" />
                  Draft
                </Link>
              </Button>
            )}
            {canJoin && <JoinMatchButton matchId={matchId} isJoined={isJoined} />}
          </div>
        </div>

        {/* Date & location */}
        <div>
          <h1 className="text-xl font-bold leading-tight capitalize">
            {new Date(match.date).toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-muted-foreground capitalize">{match.match_type}</span>
            {(match as any).Location?.name && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="w-3 h-3" />
                {(match as any).Location.name}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Participants — only when SCHEDULED ── */}
      {isScheduled && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="w-4 h-4 text-muted-foreground" />
              Partecipanti
            </div>
            <span className="text-xs text-muted-foreground">{participants.length} iscritti</span>
          </div>

          {participants.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nessuno iscritto ancora.</p>
          ) : (
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {participants.map((p) => (
                <div key={p.user_id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                  <PlayerAvatar name={p.User.name} image={p.User.image} size={28} />
                  <span className="text-sm truncate">{p.User.name}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Draft needed hint ── */}
      {isScheduled && participants.length >= 2 && !hasDraft && isAdmin && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-300">
          <Shuffle className="w-4 h-4 shrink-0" />
          <span>Esegui il <Link href={`/match/${matchId}/draft`} className="underline underline-offset-2">draft</Link> per formare le squadre.</span>
        </div>
      )}

      {/* ── Games ── */}
      {match.Game.map((game) => (
        <section
          key={game.id}
          className="rounded-2xl border border-white/[0.08] overflow-hidden"
        >
          {/* Game header */}
          {match.Game.length > 1 && (
            <div className="px-5 pt-4 pb-0">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                Partita {game.game_number}
              </p>
            </div>
          )}

          {/* Scoreboard */}
          {game.Team1 && game.Team2 ? (
            <div className="px-5">
              <ScoreBoard game={game} />
            </div>
          ) : (
            !isCompleted && (
              <div className="px-5 py-4 text-sm text-muted-foreground">
                Squadre non ancora assegnate.
              </div>
            )
          )}

          {/* Divider */}
          {(game.GameDetail.length > 0 || (isOngoing && isAdmin)) && (
            <div className="border-t border-white/[0.06] mx-5" />
          )}

          {/* Events + form */}
          <div className="px-5 pb-4">
            {game.GameDetail.length === 0 && !isOngoing && (
              <p className="text-xs text-muted-foreground pt-3">Nessun evento registrato.</p>
            )}

            {isAdmin ? (
              <GameDetailForm
                game={game}
                matchId={matchId}
                draftPicks={match.DraftPick ?? []}
                isOngoing={isOngoing}
              />
            ) : game.GameDetail.length > 0 ? (
              <div className="space-y-0.5 pt-2">
                {game.GameDetail.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 px-1 py-1.5 text-sm">
                    <span className="font-mono text-[11px] text-muted-foreground w-6">{d.minute != null ? `${d.minute}'` : "—"}</span>
                    <span>{d.event_type === "Goal" ? "⚽" : d.event_type === "Assist" ? "🅰️" : d.event_type === "YellowCard" ? "🟡" : d.event_type === "RedCard" ? "🔴" : d.event_type === "Penalty" ? "🎯" : "🔄"}</span>
                    <span className="font-medium">{d.User?.name ?? "—"}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{d.Team?.name}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ))}

      {/* ── Participant sidebar during ONGOING / COMPLETED ── */}
      {(isOngoing || isCompleted) && (
        <section>
          <div className="flex items-center gap-2 mb-3 text-sm font-medium">
            <Users className="w-4 h-4 text-muted-foreground" />
            Partecipanti
            <span className="text-xs text-muted-foreground font-normal">({participants.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {participants.map((p) => {
              const pick = match.DraftPick.find((dp) => dp.user_id === p.user_id);
              const isTeam1 = pick?.team_id === match.Game[0]?.team1_id;
              const isCaptain = pick?.Team?.TeamMember.some((m) => m.user_id === p.user_id && m.is_captain) ?? false;
              return (
                <div
                  key={p.user_id}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs ${
                    isTeam1
                      ? "border-blue-400/20 bg-blue-500/10 text-blue-200"
                      : pick
                      ? "border-red-400/20 bg-red-500/10 text-red-200"
                      : "border-white/[0.06] bg-white/[0.03] text-muted-foreground"
                  }`}
                >
                  <PlayerAvatar name={p.User.name} image={p.User.image} size={20} />
                  <span>{p.User.name}</span>
                  {isCaptain && <Crown className="h-3 w-3 text-yellow-500 shrink-0" />}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
