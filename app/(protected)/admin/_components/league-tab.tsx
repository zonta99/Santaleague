import { db } from "@/lib/db";
import { LevelFormulaManager } from "./level-formula-manager";
import { UpdateLeagueForm } from "./update-league-form";

interface Props {
  leagueId: string;
  isOwner: boolean;
}

export async function LeagueTab({ leagueId, isOwner }: Props) {
  const [league, formula] = await Promise.all([
    db.league.findUnique({ where: { id: leagueId }, select: { name: true, description: true } }),
    db.levelFormula.findUnique({ where: { league_id: leagueId } }),
  ]);

  const formulaData = {
    field_weight: formula?.field_weight ?? 0.5,
    win_weight: formula?.win_weight ?? 0.3,
    goal_weight: formula?.goal_weight ?? 0.2,
    updated_at: formula?.updated_at ?? null,
  };

  return (
    <div className="space-y-6">
      {isOwner && league && (
        <UpdateLeagueForm key={leagueId} leagueId={leagueId} league={league} />
      )}
      <LevelFormulaManager key={leagueId} initial={formulaData} leagueId={leagueId} />
    </div>
  );
}
