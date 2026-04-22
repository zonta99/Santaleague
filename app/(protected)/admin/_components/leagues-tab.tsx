"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface League {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  leagues: League[];
  selectedLeagueId: string | null;
  children?: React.ReactNode;
}

export function LeaguesTabShell({ leagues, selectedLeagueId, children }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onLeagueChange(id: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("leagueId", id);
    router.push(`?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      <Select value={selectedLeagueId ?? ""} onValueChange={onLeagueChange}>
        <SelectTrigger className="w-72">
          <SelectValue placeholder="Seleziona una lega..." />
        </SelectTrigger>
        <SelectContent>
          {leagues.map((l) => (
            <SelectItem key={l.id} value={l.id}>
              {l.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!selectedLeagueId && (
        <p className="text-muted-foreground text-sm">Seleziona una lega per gestirla.</p>
      )}

      {selectedLeagueId && children}
    </div>
  );
}
