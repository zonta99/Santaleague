import { getAllSeasons } from "@/data/season";
import { SeasonsManager } from "./seasons-manager";

export async function SeasonsTab({ leagueId }: { leagueId: string }) {
  const seasons = await getAllSeasons(leagueId);
  return <SeasonsManager seasons={seasons} leagueId={leagueId} />;
}
