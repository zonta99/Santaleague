import { getLevelFormula } from "@/actions/level-formula";
import { LevelFormulaManager } from "./level-formula-manager";

export async function SettingsTab({ leagueId }: { leagueId: string }) {
  const formulaData = await getLevelFormula(leagueId);
  return <LevelFormulaManager initial={formulaData} leagueId={leagueId} />;
}
