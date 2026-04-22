import { getAllLocations } from "@/data/location";
import { LocationsManager } from "./locations-manager";

export async function MatchesTab({ leagueId }: { leagueId: string }) {
  const locations = await getAllLocations(leagueId);
  return <LocationsManager locations={locations} leagueId={leagueId} />;
}
