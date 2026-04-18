import Image from "next/image";
import { Trophy, Star, Target } from "lucide-react";

type GameDetailItem = {
  event_type: string;
  player_id: string | null;
  team_id: number | null;
  User: { name: string | null; image: string | null } | null;
};

type GameRatingItem = {
  rated_player_id: string;
  score: number;
  role: string;
  RatedPlayer: { name: string | null; image: string | null } | null;
};

type GameItem = {
  id: number;
  game_number: number;
  team1_id: number | null;
  team2_id: number | null;
  winner_team_id: number | null;
  Team1: { id: number; name: string } | null;
  Team2: { id: number; name: string } | null;
  WinnerTeam?: { id: number; name: string } | null;
  GameDetail: GameDetailItem[];
  GameRating: GameRatingItem[];
};

interface Props {
  games: GameItem[];
}

function PlayerAvatar({ name, image, size = 28 }: { name: string | null; image: string | null; size?: number }) {
  const initials = (name ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  if (image) return <Image src={image} alt={name ?? ""} width={size} height={size} className="rounded-full object-cover shrink-0" style={{ width: size, height: size }} />;
  return (
    <div style={{ width: size, height: size }} className="rounded-full bg-white/[0.08] text-white/60 flex items-center justify-center text-xs font-semibold shrink-0">
      {initials}
    </div>
  );
}

export function TabRiepilogo({ games }: Props) {
  // Per-game results
  const gameResults = games.map((game) => {
    const t1Goals = game.GameDetail.filter((d) => d.event_type === "Goal" && d.team_id === game.team1_id).length;
    const t2Goals = game.GameDetail.filter((d) => d.event_type === "Goal" && d.team_id === game.team2_id).length;
    const winner = game.WinnerTeam ?? (
      game.winner_team_id === game.team1_id ? game.Team1 :
      game.winner_team_id === game.team2_id ? game.Team2 : null
    );
    return { game, t1Goals, t2Goals, winner };
  });

  // Top scorer across all games
  const goalMap = new Map<string, { name: string | null; image: string | null; count: number }>();
  for (const g of games) {
    for (const d of g.GameDetail) {
      if (d.event_type === "Goal" && d.player_id) {
        const prev = goalMap.get(d.player_id);
        if (prev) prev.count++;
        else goalMap.set(d.player_id, { name: d.User?.name ?? null, image: d.User?.image ?? null, count: 1 });
      }
    }
  }
  const topScorer = goalMap.size > 0
    ? Array.from(goalMap.entries()).sort((a, b) => b[1].count - a[1].count)[0]
    : null;

  // Best rated (FIELD role, avg score, at least 1 rating)
  const ratingMap = new Map<string, { name: string | null; image: string | null; total: number; count: number }>();
  for (const g of games) {
    for (const r of g.GameRating) {
      if (r.role === "FIELD") {
        const prev = ratingMap.get(r.rated_player_id);
        if (prev) { prev.total += r.score; prev.count++; }
        else ratingMap.set(r.rated_player_id, { name: r.RatedPlayer?.name ?? null, image: r.RatedPlayer?.image ?? null, total: r.score, count: 1 });
      }
    }
  }
  const bestRated = ratingMap.size > 0
    ? Array.from(ratingMap.entries())
        .map(([id, v]) => ({ id, ...v, avg: v.total / v.count }))
        .sort((a, b) => b.avg - a.avg)[0]
    : null;

  return (
    <div className="space-y-5 pt-2">
      {/* Per-game results */}
      <section className="space-y-3">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Risultati</p>
        {gameResults.map(({ game, t1Goals, t2Goals, winner }) => (
          <div key={game.id} className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3">
            {games.length > 1 && (
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Partita {game.game_number}</p>
            )}
            {game.Team1 && game.Team2 ? (
              <div className="flex items-center justify-between gap-3">
                <span className={`text-sm font-semibold flex-1 ${winner?.id === game.team1_id ? "text-white" : "text-muted-foreground"}`}>
                  {game.Team1.name}
                </span>
                <div className="flex items-baseline gap-1.5 shrink-0">
                  <span className="text-2xl font-black tabular-nums">{t1Goals}</span>
                  <span className="text-sm text-white/20">–</span>
                  <span className="text-2xl font-black tabular-nums">{t2Goals}</span>
                </div>
                <span className={`text-sm font-semibold flex-1 text-right ${winner?.id === game.team2_id ? "text-white" : "text-muted-foreground"}`}>
                  {game.Team2.name}
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Squadre non assegnate</p>
            )}
            {winner ? (
              <div className="flex items-center gap-1.5 mt-2">
                <Trophy className="w-3 h-3 text-amber-400" />
                <span className="text-xs text-amber-400 font-medium">{winner.name}</span>
              </div>
            ) : game.Team1 && game.Team2 && t1Goals === t2Goals ? (
              <p className="text-xs text-muted-foreground mt-2">Pareggio</p>
            ) : null}
          </div>
        ))}
      </section>

      {/* Awards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {topScorer && (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-400/20 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Capocannoniere</p>
              <div className="flex items-center gap-2 mt-0.5">
                <PlayerAvatar name={topScorer[1].name} image={topScorer[1].image} size={20} />
                <span className="text-sm font-semibold truncate">{topScorer[1].name}</span>
                <span className="text-xs text-emerald-400 font-medium shrink-0">{topScorer[1].count} gol</span>
              </div>
            </div>
          </div>
        )}

        {bestRated && (
          <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-400/20 flex items-center justify-center shrink-0">
              <Star className="w-4 h-4 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Miglior voto</p>
              <div className="flex items-center gap-2 mt-0.5">
                <PlayerAvatar name={bestRated.name} image={bestRated.image} size={20} />
                <span className="text-sm font-semibold truncate">{bestRated.name}</span>
                <span className="text-xs text-amber-400 font-medium shrink-0">{bestRated.avg.toFixed(1)} ⭐</span>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
