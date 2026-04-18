"use client";

import { useState } from "react";
import Link from "next/link";
import { TabInfo } from "./tab-info";
import { TabPartite } from "./tab-partite";
import { TabRiepilogo } from "./tab-riepilogo";
import { ExternalLink } from "lucide-react";

type Participant = {
  user_id: string;
  User: { name: string | null; image: string | null };
};

type DraftPick = {
  user_id: string;
  team_id: number;
  User: { id: string; name: string | null; image: string | null };
  Team: { TeamMember: { user_id: string; is_captain: boolean }[] } | null;
};

type GameDetailItem = {
  id: number;
  event_type: string;
  player_id: string | null;
  team_id: number | null;
  minute: number | null;
  User: { name: string | null; image: string | null } | null;
  Team: { name: string | null; logo: string | null } | null;
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
  Team1: { id: number; name: string; logo?: string | null } | null;
  Team2: { id: number; name: string; logo?: string | null } | null;
  WinnerTeam?: { id: number; name: string } | null;
  GameDetail: GameDetailItem[];
  GameRating: GameRatingItem[];
};

type TabKey = "info" | "partite" | "riepilogo";

interface Props {
  matchId: number;
  games: GameItem[];
  participants: Participant[];
  draftPicks: DraftPick[];
  defaultTab: TabKey;
  showPartite: boolean;
  showBozza: boolean;
  showVota: boolean;
  showRiepilogo: boolean;
  isScheduled: boolean;
  isOngoing: boolean;
  isAdmin: boolean;
  hasDraft: boolean;
}

function tabClass(active: boolean) {
  const base = "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all focus-visible:outline-none";
  if (active) return `${base} bg-background text-foreground shadow`;
  return `${base} text-muted-foreground hover:text-foreground`;
}

function linkTabClass() {
  return "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium text-muted-foreground hover:text-foreground transition-all focus-visible:outline-none";
}

export function MatchHubTabs({
  matchId,
  games,
  participants,
  draftPicks,
  defaultTab,
  showPartite,
  showBozza,
  showVota,
  showRiepilogo,
  isScheduled,
  isOngoing,
  isAdmin,
  hasDraft,
}: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab);

  const firstGame = games[0] ?? null;

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 bg-muted rounded-lg p-1">
        <button className={tabClass(activeTab === "info")} onClick={() => setActiveTab("info")}>
          Info
        </button>
        {showPartite && (
          <button className={tabClass(activeTab === "partite")} onClick={() => setActiveTab("partite")}>
            Partite
          </button>
        )}
        {showBozza && (
          <Link href={`/match/${matchId}/draft`} className={linkTabClass()}>
            Bozza
            <ExternalLink className="w-3 h-3 opacity-60" />
          </Link>
        )}
        {showVota && (
          <Link href={`/match/${matchId}/rate`} className={linkTabClass()}>
            Vota
            <ExternalLink className="w-3 h-3 opacity-60" />
          </Link>
        )}
        {showRiepilogo && (
          <button className={tabClass(activeTab === "riepilogo")} onClick={() => setActiveTab("riepilogo")}>
            Riepilogo
          </button>
        )}
      </div>

      {/* Tab content */}
      {activeTab === "info" && (
        <TabInfo
          participants={participants}
          draftPicks={draftPicks}
          firstGame={firstGame}
          isScheduled={isScheduled}
          isAdmin={isAdmin}
          hasDraft={hasDraft}
          matchId={matchId}
        />
      )}
      {activeTab === "partite" && (
        <TabPartite
          games={games}
          draftPicks={draftPicks}
          matchId={matchId}
          isOngoing={isOngoing}
          isAdmin={isAdmin}
        />
      )}
      {activeTab === "riepilogo" && (
        <TabRiepilogo games={games} />
      )}
    </div>
  );
}
