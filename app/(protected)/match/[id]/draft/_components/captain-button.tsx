"use client";

import { useTransition } from "react";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setCaptain } from "@/actions/draft";
import { toast } from "sonner";

interface CaptainButtonProps {
  matchId: number;
  teamId: number;
  userId: string;
  isCaptain: boolean;
}

export function CaptainButton({ matchId, teamId, userId, isCaptain }: CaptainButtonProps) {
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    if (isCaptain) return;
    startTransition(async () => {
      const res = await setCaptain(matchId, teamId, userId);
      if (res.error) toast.error(res.error);
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className={`h-6 w-6 ${isCaptain ? "text-yellow-500 cursor-default" : "text-muted-foreground hover:text-yellow-500"}`}
      onClick={handleClick}
      disabled={pending || isCaptain}
      title={isCaptain ? "Capitano" : "Imposta capitano"}
    >
      <Crown className="h-3.5 w-3.5" />
    </Button>
  );
}
