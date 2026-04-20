"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Shield } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useLeague } from "@/components/league/league-provider";
import { getUserLeaguesAction, setActiveLeagueAction } from "@/actions/league";
import { LeagueRole } from "@prisma/client";

interface Membership {
  league_id: string;
  role: LeagueRole;
  League: { id: string; name: string; slug: string };
}

export function LeagueSwitcher() {
  const router = useRouter();
  const { leagueId } = useLeague();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getUserLeaguesAction().then((data) => setMemberships(data as Membership[]));
  }, []);

  const active = memberships.find((m) => m.league_id === leagueId);
  const label = active?.League.name ?? "Seleziona lega";

  if (memberships.length <= 1) return null;

  const handleSwitch = (id: string) => {
    startTransition(async () => {
      await setActiveLeagueAction(id);
      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 max-w-[180px]" disabled={isPending}>
          <Shield className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate text-xs">{label}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Le tue leghe</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {memberships.map((m) => (
          <DropdownMenuItem
            key={m.league_id}
            onClick={() => handleSwitch(m.league_id)}
            className={m.league_id === leagueId ? "bg-accent" : ""}
          >
            {m.League.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
