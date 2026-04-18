"use client";

import { useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Season = { id: number; name: string };

interface Props {
  seasons: Season[];
  activeSeason: Season | null;
  currentSeasonId: number | undefined;
}

export function SeasonSelector({ seasons, activeSeason, currentSeasonId }: Props) {
  const router = useRouter();

  const value = currentSeasonId?.toString() ?? "all";

  const handleChange = (val: string) => {
    if (val === "all") {
      router.push("/leaderboard");
    } else {
      router.push(`/leaderboard?season=${val}`);
    }
  };

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className="w-44">
        <SelectValue placeholder="Stagione" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Tutte le stagioni</SelectItem>
        {seasons.map((s) => (
          <SelectItem key={s.id} value={s.id.toString()}>
            {s.name}
            {s.id === activeSeason?.id ? " ●" : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
