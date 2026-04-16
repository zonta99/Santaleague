"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { joinMatch, leaveMatch } from "@/actions/match";

interface Props {
  matchId: number;
  isJoined: boolean;
}

export function JoinMatchButton({ matchId, isJoined }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = isJoined ? await leaveMatch(matchId) : await joinMatch(matchId);
      if (result.success) toast.success(result.success);
      if (result.error) toast.error(result.error);
    });
  };

  return (
    <Button
      size="sm"
      variant={isJoined ? "outline" : "default"}
      onClick={handleClick}
      disabled={isPending}
    >
      {isJoined ? "Annulla iscrizione" : "Partecipa"}
    </Button>
  );
}
