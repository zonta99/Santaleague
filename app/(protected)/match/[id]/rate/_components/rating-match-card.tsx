"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { RatingRole } from "@prisma/client";
import { submitRatings, closeRatingWindow } from "@/actions/rating";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Lock, Shield } from "lucide-react";
import { toast } from "sonner";

type DraftPick = {
  user_id: string;
  team_id: number;
  User: { id: string; name: string | null; image: string | null };
  Team: { name: string } | null;
};

type ExistingRating = {
  rated_player_id: string;
  score: number;
  role: string;
};

type MatchData = {
  id: number;
  rating_open: boolean;
  rating_opened_at: Date | null;
  DraftPick: DraftPick[];
  MatchRating: ExistingRating[];
};

interface Props {
  match: MatchData;
  currentUserId: string;
  isAdmin: boolean;
}

function PlayerAvatar({ name, image, size = 36 }: { name: string | null; image: string | null; size?: number }) {
  const initials = (name ?? "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  if (image) return <Image src={image} alt={name ?? ""} width={size} height={size} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  return (
    <div style={{ width: size, height: size }} className="rounded-full bg-white/[0.08] text-white/60 flex items-center justify-center text-xs font-semibold shrink-0">
      {initials}
    </div>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(0)}
          className="text-lg leading-none transition-transform hover:scale-110"
        >
          <span className={(hover || value) >= n ? "text-amber-400" : "text-white/20"}>★</span>
        </button>
      ))}
      {value > 0 && (
        <span className="ml-1.5 text-sm font-bold text-amber-400 tabular-nums">{value}</span>
      )}
    </div>
  );
}

export function RatingMatchCard({ match, currentUserId, isAdmin }: Props) {
  const isExpired = match.rating_opened_at
    ? Date.now() - new Date(match.rating_opened_at).getTime() > 48 * 60 * 60 * 1000
    : false;

  const isOpen = match.rating_open && !isExpired;

  const otherPlayers = match.DraftPick.filter((dp) => dp.user_id !== currentUserId);

  const initField: Record<string, number> = {};
  const initGk: Record<string, number> = {};
  for (const r of match.MatchRating) {
    if (r.role === RatingRole.FIELD) initField[r.rated_player_id] = r.score;
    if (r.role === RatingRole.GOALKEEPER) initGk[r.rated_player_id] = r.score;
  }

  const [fieldScores, setFieldScores] = useState<Record<string, number>>(initField);
  const [gkScores, setGkScores] = useState<Record<string, number>>(initGk);
  const [isPending, startTransition] = useTransition();
  const [isClosing, startClosing] = useTransition();

  const anyRated = otherPlayers.some(
    (p) => (fieldScores[p.user_id] ?? 0) > 0 || (gkScores[p.user_id] ?? 0) > 0
  );

  const handleSubmit = () => {
    const ratings: { rated_player_id: string; score: number; role: RatingRole }[] = [];
    for (const p of otherPlayers) {
      if ((fieldScores[p.user_id] ?? 0) > 0)
        ratings.push({ rated_player_id: p.user_id, score: fieldScores[p.user_id], role: RatingRole.FIELD });
      if ((gkScores[p.user_id] ?? 0) > 0)
        ratings.push({ rated_player_id: p.user_id, score: gkScores[p.user_id], role: RatingRole.GOALKEEPER });
    }

    startTransition(async () => {
      const res = await submitRatings(match.id, ratings);
      if (res.error) toast.error(res.error);
      else toast.success(res.success);
    });
  };

  const handleClose = () => {
    startClosing(async () => {
      const res = await closeRatingWindow(match.id);
      if (res.error) toast.error(res.error);
      else toast.success(res.success);
    });
  };

  return (
    <section className="rounded-2xl border border-white/[0.08] overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">Giocatori dell&apos;evento</p>
          {isOpen ? (
            <Badge className="text-[10px] border-amber-400/30 text-amber-400 bg-amber-400/10 border">
              <Star className="w-2.5 h-2.5 mr-1" />
              Voto aperto
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] text-muted-foreground">
              <Lock className="w-2.5 h-2.5 mr-1" />
              Chiuso
            </Badge>
          )}
        </div>
        {isAdmin && isOpen && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-muted-foreground hover:text-destructive"
            onClick={handleClose}
            disabled={isClosing}
          >
            <Lock className="w-3 h-3 mr-1" />
            Chiudi finestra
          </Button>
        )}
      </div>

      <div className="px-5 py-4 space-y-4">
        {!isOpen && (
          <p className="text-sm text-muted-foreground">
            {isExpired ? "Finestra di valutazione scaduta (48h)." : "La finestra di valutazione è chiusa."}
          </p>
        )}

        {isOpen && otherPlayers.length === 0 && (
          <p className="text-sm text-muted-foreground">Nessun altro giocatore da valutare.</p>
        )}

        {isOpen && otherPlayers.map((p) => (
          <div key={p.user_id} className="py-3 border-b border-white/[0.04] last:border-0 space-y-3">
            <div className="flex items-center gap-2.5">
              <PlayerAvatar name={p.User.name} image={p.User.image} size={30} />
              <div>
                <p className="text-sm font-semibold leading-tight">{p.User.name}</p>
                <p className="text-[11px] text-muted-foreground">{p.Team?.name}</p>
              </div>
            </div>

            <div className="space-y-2 pl-1">
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-medium text-blue-300 w-16 shrink-0">⚽ Campo</span>
                <StarRating
                  value={fieldScores[p.user_id] ?? 0}
                  onChange={(v) => setFieldScores((s) => ({ ...s, [p.user_id]: v }))}
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-medium text-emerald-300 w-16 shrink-0 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Portiere
                </span>
                <StarRating
                  value={gkScores[p.user_id] ?? 0}
                  onChange={(v) => setGkScores((s) => ({ ...s, [p.user_id]: v }))}
                />
              </div>
            </div>
          </div>
        ))}

        {isOpen && otherPlayers.length > 0 && (
          <Button
            onClick={handleSubmit}
            disabled={!anyRated || isPending}
            className="w-full"
            size="sm"
          >
            {isPending ? "Salvataggio..." : "Salva valutazioni"}
          </Button>
        )}
      </div>
    </section>
  );
}
