import { getAllLocations } from "@/data/location";
import { LocationsManager } from "./locations-manager";
import { CreateMatchForm } from "./create-match-form";

export async function MatchesTab() {
  const locations = await getAllLocations();
  return (
    <div className="space-y-8">
      <LocationsManager locations={locations} />
      <CreateMatchForm locations={locations} />
    </div>
  );
}
