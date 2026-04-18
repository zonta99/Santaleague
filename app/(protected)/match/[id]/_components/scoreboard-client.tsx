"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Maximize2, Minimize2, RefreshCw } from "lucide-react";

type GameDetailItem = {
  event_type: string;
  player_id: string | null;
  team_id: number | null;
  minute: number | null;
  User: { name: string | null } | null;
};

type GameItem = {
  id: number;
  game_number: number;
  team1_id: number | null;
  team2_id: number | null;
  Team1: { name: string } | null;
  Team2: { name: string } | null;
  GameDetail: GameDetailItem[];
};

interface Props {
  match: {
    id: number;
    date: string | Date;
    status: string;
    Location?: { name: string } | null;
    Game: GameItem[];
  };
}

export function ScoreboardClient({ match }: Props) {
  const router = useRouter();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      setLastUpdated(new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateTime();
    const id = setInterval(() => {
      router.refresh();
      updateTime();
    }, 30_000);
    return () => clearInterval(id);
  }, [router]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const matchDate = new Date(match.date).toLocaleDateString("it-IT", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    SCHEDULED: { label: "Programmata", color: "text-amber-400" },
    ONGOING:   { label: "In corso",    color: "text-emerald-400" },
    COMPLETED: { label: "Conclusa",    color: "text-zinc-400" },
    CANCELED:  { label: "Annullata",   color: "text-red-400" },
  };
  const statusCfg = STATUS_CONFIG[match.status] ?? STATUS_CONFIG.SCHEDULED;

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-white/10">
        <div>
          <p className="capitalize text-sm text-white/50">{matchDate}</p>
          {match.Location?.name && (
            <p className="text-xs text-white/30 mt-0.5">{match.Location.name}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {match.status === "ONGOING" && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              {statusCfg.label}
            </span>
          )}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-lg border border-white/10 hover:border-white/20 text-white/50 hover:text-white transition-colors"
            title={isFullscreen ? "Esci da schermo intero" : "Schermo intero"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Games */}
      <main className="flex-1 flex flex-col gap-6 p-6 md:p-10">
        {match.Game.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-white/30 text-xl">Nessuna partita ancora assegnata</p>
          </div>
        ) : (
          match.Game.map((game) => {
            const t1Goals = game.GameDetail.filter((d) => d.event_type === "Goal" && d.team_id === game.team1_id);
            const t2Goals = game.GameDetail.filter((d) => d.event_type === "Goal" && d.team_id === game.team2_id);

            return (
              <div key={game.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 md:p-8">
                {match.Game.length > 1 && (
                  <p className="text-xs uppercase tracking-widest text-white/30 mb-5">Partita {game.game_number}</p>
                )}

                {game.Team1 && game.Team2 ? (
                  <>
                    {/* Score row */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 text-center">
                        <p className="text-3xl md:text-5xl font-black text-white leading-tight">{game.Team1.name}</p>
                      </div>
                      <div className="text-center shrink-0 px-4">
                        <p className="text-6xl md:text-9xl font-black tabular-nums tracking-tighter text-white">
                          {t1Goals.length} <span className="text-white/20 font-light">–</span> {t2Goals.length}
                        </p>
                      </div>
                      <div className="flex-1 text-center">
                        <p className="text-3xl md:text-5xl font-black text-white leading-tight">{game.Team2.name}</p>
                      </div>
                    </div>

                    {/* Goal scorers */}
                    {(t1Goals.length > 0 || t2Goals.length > 0) && (
                      <div className="mt-6 grid grid-cols-2 gap-x-8">
                        <div className="space-y-1.5 text-right">
                          {t1Goals.map((d, i) => (
                            <p key={i} className="text-sm text-white/60">
                              <span className="text-white/40 font-mono text-xs mr-2">{d.minute != null ? `${d.minute}'` : ""}</span>
                              ⚽ {d.User?.name ?? "—"}
                            </p>
                          ))}
                        </div>
                        <div className="space-y-1.5 text-left">
                          {t2Goals.map((d, i) => (
                            <p key={i} className="text-sm text-white/60">
                              ⚽ {d.User?.name ?? "—"}
                              <span className="text-white/40 font-mono text-xs ml-2">{d.minute != null ? `${d.minute}'` : ""}</span>
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-white/30 text-center text-xl py-8">Squadre non ancora assegnate</p>
                )}
              </div>
            );
          })
        )}
      </main>

      {/* Footer */}
      <footer className="px-6 py-3 flex items-center justify-center gap-2 text-xs text-white/20 border-t border-white/[0.05]">
        <RefreshCw className="w-3 h-3" />
        Aggiornamento automatico · ultimo: {lastUpdated || "—"}
      </footer>
    </div>
  );
}
