import Link from "next/link";
import Image from "next/image";
import { Users, Shuffle, Crown } from "lucide-react";

type Participant = {
  user_id: string;
  User: { name: string | null; image: string | null };
};

type DraftPick = {
  user_id: string;
  team_id: number;
  Team: { TeamMember: { user_id: string; is_captain: boolean }[] } | null;
};

interface Props {
  participants: Participant[];
  draftPicks: DraftPick[];
  firstGame?: { team1_id: number | null; team2_id: number | null } | null;
  isScheduled: boolean;
  isAdmin: boolean;
  hasDraft: boolean;
  matchId: number;
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

const TEAM_COLORS = [
  { border: "border-blue-400/20", bg: "bg-blue-500/10", text: "text-blue-200" },
  { border: "border-red-400/20",  bg: "bg-red-500/10",  text: "text-red-200"  },
  { border: "border-green-400/20",bg: "bg-green-500/10",text: "text-green-200"},
];

export function TabInfo({ participants, draftPicks, firstGame, isScheduled, isAdmin, hasDraft, matchId }: Props) {
  // Build team order from first game
  const teamOrder: number[] = [];
  if (firstGame?.team1_id) teamOrder.push(firstGame.team1_id);
  if (firstGame?.team2_id) teamOrder.push(firstGame.team2_id);

  const getTeamColor = (pick?: DraftPick) => {
    if (!pick) return { border: "border-white/[0.06]", bg: "bg-white/[0.03]", text: "text-muted-foreground" };
    const idx = teamOrder.indexOf(pick.team_id);
    return TEAM_COLORS[idx >= 0 ? idx : 0] ?? TEAM_COLORS[0];
  };

  return (
    <div className="space-y-5 pt-2">
      {/* Draft needed hint */}
      {isScheduled && participants.length >= 2 && !hasDraft && isAdmin && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-sm text-amber-300">
          <Shuffle className="w-4 h-4 shrink-0" />
          <span>Esegui il <Link href={`/match/${matchId}/draft`} className="underline underline-offset-2">draft</Link> per formare le squadre.</span>
        </div>
      )}

      {/* Participants */}
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
        ) : isScheduled && !hasDraft ? (
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {participants.map((p) => (
              <div key={p.user_id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                <PlayerAvatar name={p.User.name} image={p.User.image} size={28} />
                <span className="text-sm truncate">{p.User.name}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {participants.map((p) => {
              const pick = draftPicks.find((dp) => dp.user_id === p.user_id);
              const isCaptain = pick?.Team?.TeamMember.some((m) => m.user_id === p.user_id && m.is_captain) ?? false;
              const color = getTeamColor(pick);
              return (
                <div
                  key={p.user_id}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs ${color.border} ${color.bg} ${color.text}`}
                >
                  <PlayerAvatar name={p.User.name} image={p.User.image} size={20} />
                  <span>{p.User.name}</span>
                  {isCaptain && <Crown className="h-3 w-3 text-yellow-500 shrink-0" />}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
