import { getAllLocations } from "@/data/location";
import { LocationsManager } from "./locations-manager";
import { CreateMatchForm } from "./create-match-form";

export async function MatchesTab({ leagueId }: { leagueId: string }) {
  const locations = await getAllLocations(leagueId);
  return (
    <div className="space-y-8">
      <LocationsManager locations={locations} leagueId={leagueId} />
      <CreateMatchForm locations={locations} leagueId={leagueId} />
    </div>
  );
}
