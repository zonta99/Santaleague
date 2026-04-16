"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Shuffle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { executeDraft, resetDraft } from "@/actions/draft";

export function DraftActions({ matchId, hasDraft }: { matchId: number; hasDraft: boolean }) {
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

  return (
    <div className="flex gap-2">
      {!hasDraft && (
        <Button onClick={handleDraft} disabled={isPending}>
          <Shuffle className="h-4 w-4 mr-2" />
          Esegui Draft
        </Button>
      )}
      {hasDraft && (
        <Button variant="outline" onClick={handleReset} disabled={isPending}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Azzera Draft
        </Button>
      )}
    </div>
  );
}
