"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Shuffle, RotateCcw, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { executeDraft, resetDraft, lockDraft } from "@/actions/draft";

interface DraftActionsProps {
  matchId: number;
  hasDraft: boolean;
  isLocked: boolean;
  canExecuteDraft: boolean;
  draftBlockReason?: string;
}

export function DraftActions({ matchId, hasDraft, isLocked, canExecuteDraft, draftBlockReason }: DraftActionsProps) {
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
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={isPending}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Sblocca e Azzera
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Sbloccare e azzerare il draft?</AlertDialogTitle>
              <AlertDialogDescription>
                Tutte le squadre e le assegnazioni verranno eliminate. Dovrai rieseguire il draft da zero.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Sblocca e Azzera
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  const draftButton = (
    <Button onClick={handleDraft} disabled={isPending || !canExecuteDraft}>
      <Shuffle className="h-4 w-4 mr-2" />
      {hasDraft ? "Riesegui Draft" : "Esegui Draft"}
    </Button>
  );

  const draftTrigger = hasDraft ? (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button disabled={isPending || !canExecuteDraft}>
          <Shuffle className="h-4 w-4 mr-2" />
          Riesegui Draft
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Rieseguire il draft?</AlertDialogTitle>
          <AlertDialogDescription>
            Il draft attuale verrà eliminato e le squadre rigenerate da zero. Le modifiche manuali andranno perse.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annulla</AlertDialogCancel>
          <AlertDialogAction onClick={handleDraft}>Riesegui</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ) : (
    canExecuteDraft ? draftButton : (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0}>{draftButton}</span>
          </TooltipTrigger>
          <TooltipContent>{draftBlockReason}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  );

  return (
    <div className="flex gap-2">
      {!canExecuteDraft && !hasDraft ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0}>{draftButton}</span>
            </TooltipTrigger>
            <TooltipContent>{draftBlockReason}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        draftTrigger
      )}
      {hasDraft && (
        <>
          <Button variant="default" className="bg-green-600 hover:bg-green-700" onClick={handleLock} disabled={isPending}>
            <Lock className="h-4 w-4 mr-2" />
            Blocca Draft
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" disabled={isPending}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Azzera
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Azzerare il draft?</AlertDialogTitle>
                <AlertDialogDescription>
                  Tutte le squadre e le assegnazioni verranno eliminate. L&apos;operazione non è reversibile.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annulla</AlertDialogCancel>
                <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Azzera
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
