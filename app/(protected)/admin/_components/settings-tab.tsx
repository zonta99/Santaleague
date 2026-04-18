import { getLevelFormula } from "@/actions/level-formula";
import { LevelFormulaManager } from "./level-formula-manager";

export async function SettingsTab() {
  const formulaData = await getLevelFormula();
  return <LevelFormulaManager initial={formulaData} />;
}
