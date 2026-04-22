import { GameDetailForm } from "./game-detail-form";

type GameDetailItem = {
  id: number;
  event_type: string;
  player_id: string | null;
  team_id: number | null;
  minute: number | null;
  User: { name: string | null; image: string | null } | null;
  Team: { name: string | null; logo: string | null } | null;
};

type Team = { id: number; name: string; logo?: string | null };

type GameItem = {
  id: number;
  game_number: number;
  team1_id: number | null;
  team2_id: number | null;
  winner_team_id: number | null;
  Team1: Team | null;
  Team2: Team | null;
  GameDetail: GameDetailItem[];
};

type DraftPick = {
  user_id: string;
  team_id: number;
  User: { id: string; name: string | null; image: string | null };
  Team: { TeamMember: { user_id: string; is_captain: boolean }[] } | null;
};

interface Props {
  games: GameItem[];
  draftPicks: DraftPick[];
  matchId: number;
  isOngoing: boolean;
  isCompleted: boolean;
  isAdmin: boolean;
}

function ScoreBoard({ game, isCompleted }: { game: GameItem; isCompleted: boolean }) {
  if (!game.Team1 || !game.Team2) return null;
  const t1 = game.GameDetail.filter((d) => d.event_type === "Goal" && d.team_id === game.team1_id).length;
  const t2 = game.GameDetail.filter((d) => d.event_type === "Goal" && d.team_id === game.team2_id).length;

  const winner = isCompleted ? game.winner_team_id : null;
  const isDraw = isCompleted && winner === null;

  return (
    <div className="flex items-center justify-between gap-4 py-4 px-2">
      <div className="flex flex-col items-center gap-1 flex-1">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border ${winner === game.team1_id ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300 ring-1 ring-emerald-400/30" : "bg-blue-500/20 border-blue-400/20 text-blue-300"}`}>
          {game.Team1.name.charAt(0)}
        </div>
        <span className="text-xs text-muted-foreground text-center leading-tight max-w-[80px]">{game.Team1.name}</span>
        {winner === game.team1_id && <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wide">Vincitore</span>}
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-baseline gap-1.5">
          <span className="text-4xl font-black tabular-nums text-white">{t1}</span>
          <span className="text-xl text-white/20 font-light">–</span>
          <span className="text-4xl font-black tabular-nums text-white">{t2}</span>
        </div>
        {isDraw && <span className="text-[10px] text-zinc-400 font-semibold uppercase tracking-wide">Pareggio</span>}
      </div>
      <div className="flex flex-col items-center gap-1 flex-1">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border ${winner === game.team2_id ? "bg-emerald-500/20 border-emerald-400/40 text-emerald-300 ring-1 ring-emerald-400/30" : "bg-red-500/20 border-red-400/20 text-red-300"}`}>
          {game.Team2.name.charAt(0)}
        </div>
        <span className="text-xs text-muted-foreground text-center leading-tight max-w-[80px]">{game.Team2.name}</span>
        {winner === game.team2_id && <span className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wide">Vincitore</span>}
      </div>
    </div>
  );
}

export function TabPartite({ games, draftPicks, matchId, isOngoing, isCompleted, isAdmin }: Props) {
  if (games.length === 0) {
    return <p className="text-sm text-muted-foreground pt-2">Nessuna partita ancora assegnata.</p>;
  }

  return (
    <div className="space-y-4 pt-2">
      {games.map((game) => (
        <section key={game.id} className="rounded-2xl border border-white/[0.08] overflow-hidden">
          {games.length > 1 && (
            <div className="px-5 pt-4 pb-0">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                Partita {game.game_number}
              </p>
            </div>
          )}

          {game.Team1 && game.Team2 ? (
            <div className="px-5">
              <ScoreBoard game={game} isCompleted={isCompleted} />
            </div>
          ) : (
            !isOngoing && (
              <div className="px-5 py-4 text-sm text-muted-foreground">
                Squadre non ancora assegnate.
              </div>
            )
          )}

          {(game.GameDetail.length > 0 || (isOngoing && isAdmin)) && (
            <div className="border-t border-white/[0.06] mx-5" />
          )}

          <div className="px-5 pb-4">
            {game.GameDetail.length === 0 && !isOngoing && (
              <p className="text-xs text-muted-foreground pt-3">Nessun evento registrato.</p>
            )}

            {isAdmin ? (
              <GameDetailForm
                game={game}
                matchId={matchId}
                draftPicks={draftPicks}
                isOngoing={isOngoing}
              />
            ) : game.GameDetail.length > 0 ? (
              <div className="space-y-0.5 pt-2">
                {game.GameDetail.map((d) => (
                  <div key={d.id} className="flex items-center gap-3 px-1 py-1.5 text-sm">
                    <span className="font-mono text-[11px] text-muted-foreground w-6">{d.minute != null ? `${d.minute}'` : "—"}</span>
                    <span>{d.event_type === "Goal" ? "⚽" : "🎯"}</span>
                    <span className="font-medium">{d.User?.name ?? "—"}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{d.Team?.name}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ))}
    </div>
  );
}
