"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Shuffle, RotateCcw, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { executeDraft, resetDraft, lockDraft } from "@/actions/draft";

interface DraftActionsProps {
  matchId: number;
  hasDraft: boolean;
  isLocked: boolean;
}

export function DraftActions({ matchId, hasDraft, isLocked }: DraftActionsProps) {
  const [isPending, startTransition] = useTransition();

  const handleDraft = () => {
    startTransition(async () => {
      const result = await executeDraft(matchId);
      if (result.success) toast.success(result.success);
      if (result.error) toast.error(result.error);
    });
  };

  const handleReset = () => {
    startTransition(async () => {
      const result = await resetDraft(matchId);
      if (result.success) toast.success(result.success);
      if (result.error) toast.error(result.error);
    });
  };

  const handleLock = () => {
    startTransition(async () => {
      const result = await lockDraft(matchId);
      if (result.success) toast.success(result.success);
      if (result.error) toast.error(result.error);
    });
  };

  if (isLocked) {
    return (
      <div className="flex gap-2">
        <Button variant="destructive" size="sm" onClick={handleReset} disabled={isPending}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Sblocca e Azzera
        </Button>
      </div>
    );
  }

  return (
    <div className="flex gap-2">
      <Button onClick={handleDraft} disabled={isPending}>
        <Shuffle className="h-4 w-4 mr-2" />
        {hasDraft ? "Riesegui Draft" : "Esegui Draft"}
      </Button>
      {hasDraft && (
        <>
          <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={handleLock} disabled={isPending}>
            <Lock className="h-4 w-4 mr-2" />
            Blocca Draft
          </Button>
          <Button variant="outline" onClick={handleReset} disabled={isPending}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Azzera
          </Button>
        </>
      )}
    </div>
  );
}
