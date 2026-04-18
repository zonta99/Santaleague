import { getAllSeasons } from "@/data/season";
import { SeasonsManager } from "./seasons-manager";

export async function SeasonsTab() {
  const seasons = await getAllSeasons();
  return <SeasonsManager seasons={seasons} />;
}
