"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { addGameDetail, deleteGameDetail } from "@/actions/game";

const EVENTS = [
  { key: "Goal",         label: "Gol",      icon: "⚽" },
  { key: "Assist",       label: "Assist",   icon: "🅰️" },
  { key: "YellowCard",   label: "Giallo",   icon: "🟡" },
  { key: "RedCard",      label: "Rosso",    icon: "🔴" },
  { key: "Penalty",      label: "Rigore",   icon: "🎯" },
  { key: "Substitution", label: "Sost.",    icon: "🔄" },
] as const;

const EVENT_LABEL: Record<string, string> = Object.fromEntries(
  EVENTS.map((e) => [e.key, e.label])
);

type Player = {
  user_id: string;
  team_id: number;
  User: { id: string; name: string | null; image: string | null };
};

type Team = { id: number; name: string; logo?: string | null };

type GameDetailItem = {
  id: number;
  event_type: string;
  player_id: string | null;
  team_id: number | null;
  minute: number | null;
  User: { name: string | null } | null;
  Team: { name: string | null } | null;
};

type Game = {
  id: number;
  game_number: number;
  team1_id: number | null;
  team2_id: number | null;
  Team1: Team | null;
  Team2: Team | null;
  GameDetail: GameDetailItem[];
};

interface Props {
  game: Game;
  matchId: number;
  draftPicks: Player[];
  isOngoing: boolean;
}

export function GameDetailForm({ game, matchId, draftPicks, isOngoing }: Props) {
  const [isPending, startTransition] = useTransition();
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>("");
  const [minute, setMinute] = useState<string>("");

  const team1Players = draftPicks.filter((p) => p.team_id === game.team1_id);
  const team2Players = draftPicks.filter((p) => p.team_id === game.team2_id);
  const hasDraft = team1Players.length > 0 || team2Players.length > 0;

  const selectedPlayer = draftPicks.find((p) => p.user_id === selectedPlayerId);
  const autoTeamId = selectedPlayer?.team_id ?? null;

  const reset = () => {
    setSelectedEvent("");
    setSelectedPlayerId("");
    setMinute("");
  };

  const handleSubmit = () => {
    if (!selectedEvent || !selectedPlayerId || !autoTeamId) {
      toast.error("Seleziona tipo evento e giocatore");
      return;
    }
    startTransition(async () => {
      const res = await addGameDetail({
        game_id: game.id,
        match_id: matchId,
        event_type: selectedEvent as any,
        player_id: selectedPlayerId,
        team_id: autoTeamId,
        minute: minute ? parseInt(minute) : undefined,
      });
      if (res?.error) toast.error(res.error);
      else { toast.success("Evento registrato"); reset(); }
    });
  };

  const handleDelete = (detailId: number) => {
    startTransition(async () => {
      const res = await deleteGameDetail(detailId, matchId);
      if (res?.error) toast.error(res.error);
      else toast.success("Evento rimosso");
    });
  };

  return (
    <div className="mt-1">
      {/* Event log */}
      {game.GameDetail.length > 0 && (
        <div className="space-y-0.5 mb-4">
          {game.GameDetail.map((d) => (
            <div
              key={d.id}
              className="group flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/[0.03] transition-colors"
            >
              <span className="text-[11px] font-mono text-muted-foreground w-6 shrink-0">
                {d.minute != null ? `${d.minute}'` : "—"}
              </span>
              <span className="text-sm">
                {EVENTS.find((e) => e.key === d.event_type)?.icon ?? "·"}
              </span>
              <span className="text-sm font-medium flex-1">{d.User?.name ?? "—"}</span>
              <span className="text-xs text-muted-foreground">
                {EVENT_LABEL[d.event_type] ?? d.event_type}
              </span>
              <span className="text-xs text-muted-foreground/60">{d.Team?.name}</span>
              {isOngoing && (
                <button
                  onClick={() => handleDelete(d.id)}
                  disabled={isPending}
                  className="opacity-0 group-hover:opacity-100 text-destructive/60 hover:text-destructive transition-all ml-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Recorder — only when ongoing and draft exists */}
      {isOngoing && !hasDraft && (
        <p className="text-xs text-muted-foreground px-1 py-2">
          Esegui il draft prima di registrare eventi.
        </p>
      )}

      {isOngoing && hasDraft && (
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-4">
          {/* Step 1 — Event type */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">
              Tipo evento
            </p>
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
              {EVENTS.map((ev) => (
                <button
                  key={ev.key}
                  type="button"
                  onClick={() => setSelectedEvent(ev.key === selectedEvent ? "" : ev.key)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                    selectedEvent === ev.key
                      ? "border-white/30 bg-white/10 text-white"
                      : "border-white/[0.06] bg-white/[0.03] text-muted-foreground hover:border-white/15 hover:text-foreground"
                  }`}
                >
                  <span className="text-base leading-none">{ev.icon}</span>
                  <span>{ev.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2 — Player grid */}
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">
              Giocatore{autoTeamId ? ` · ${autoTeamId === game.team1_id ? game.Team1?.name : game.Team2?.name}` : ""}
            </p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {/* Team 1 column */}
              <div className="space-y-1">
                <p className="text-[10px] text-blue-400/70 font-medium px-1 mb-1">{game.Team1?.name}</p>
                {team1Players.map((p) => (
                  <PlayerChip
                    key={p.user_id}
                    player={p}
                    selected={selectedPlayerId === p.user_id}
                    color="blue"
                    onSelect={() => setSelectedPlayerId(p.user_id === selectedPlayerId ? "" : p.user_id)}
                  />
                ))}
              </div>
              {/* Team 2 column */}
              <div className="space-y-1">
                <p className="text-[10px] text-red-400/70 font-medium px-1 mb-1">{game.Team2?.name}</p>
                {team2Players.map((p) => (
                  <PlayerChip
                    key={p.user_id}
                    player={p}
                    selected={selectedPlayerId === p.user_id}
                    color="red"
                    onSelect={() => setSelectedPlayerId(p.user_id === selectedPlayerId ? "" : p.user_id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Step 3 — Minute + Submit */}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 h-9 w-24">
              <span className="text-xs text-muted-foreground">min</span>
              <input
                type="number"
                min={1}
                max={120}
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
                placeholder="—"
                className="bg-transparent text-sm text-center w-full outline-none placeholder:text-muted-foreground/40"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={isPending || !selectedEvent || !selectedPlayerId}
              className="flex-1 h-9 rounded-lg text-sm font-semibold bg-white text-black hover:bg-white/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              {isPending ? "..." : "Registra evento"}
            </button>

            {(selectedEvent || selectedPlayerId || minute) && (
              <button
                type="button"
                onClick={reset}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PlayerChip({
  player,
  selected,
  color,
  onSelect,
}: {
  player: Player;
  selected: boolean;
  color: "blue" | "red";
  onSelect: () => void;
}) {
  const initials = (player.User.name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const activeClass =
    color === "blue"
      ? "border-blue-400/40 bg-blue-500/15 text-white"
      : "border-red-400/40 bg-red-500/15 text-white";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg border text-xs font-medium transition-all text-left ${
        selected
          ? activeClass
          : "border-white/[0.06] bg-white/[0.02] text-muted-foreground hover:border-white/15 hover:text-foreground"
      }`}
    >
      {player.User.image ? (
        <img
          src={player.User.image}
          alt={player.User.name ?? ""}
          className="w-5 h-5 rounded-full object-cover shrink-0"
        />
      ) : (
        <div
          className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
            color === "blue" ? "bg-blue-500/30 text-blue-300" : "bg-red-500/30 text-red-300"
          }`}
        >
          {initials}
        </div>
      )}
      <span className="truncate">{player.User.name}</span>
    </button>
  );
}
