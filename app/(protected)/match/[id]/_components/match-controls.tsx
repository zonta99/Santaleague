"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { updateMatchStatus } from "@/actions/match";
import { Play, Square, Lock } from "lucide-react";

interface Props {
  matchId: number;
  status: string;
  hasDraft: boolean;
}

export function MatchControls({ matchId, status, hasDraft }: Props) {
  const [isPending, startTransition] = useTransition();

  const transition = (newStatus: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELED") => {
    startTransition(async () => {
      const res = await updateMatchStatus(matchId, newStatus);
      if (res?.error) toast.error(res.error);
      else toast.success(res?.success ?? "Aggiornato");
    });
  };

  return (
    <div className="flex items-center gap-2">
      {status === "SCHEDULED" && (
        <button
          onClick={() => transition("ONGOING")}
          disabled={isPending || !hasDraft}
          title={!hasDraft ? "Esegui il draft prima di avviare" : undefined}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Play className="w-3 h-3 fill-current" />
          Avvia Partita
        </button>
      )}

      {status === "ONGOING" && (
        <button
          onClick={() => transition("COMPLETED")}
          disabled={isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 disabled:opacity-40 transition-all"
        >
          <Square className="w-3 h-3 fill-current" />
          Termina Partita
        </button>
      )}

      {status === "COMPLETED" && (
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-muted-foreground border border-border">
          <Lock className="w-3 h-3" />
          Conclusa
        </span>
      )}
    </div>
  );
}
