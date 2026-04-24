export type PlayerWithLevel = { userId: string; level: number };

export function snakeDraft(players: PlayerWithLevel[], numTeams: number): PlayerWithLevel[][] {
  if (numTeams <= 1) return [players];
  const sorted = [...players].sort((a, b) => b.level - a.level);
  const buckets: PlayerWithLevel[][] = Array.from({ length: numTeams }, () => []);
  let direction = 1;
  let teamIndex = 0;

  for (const player of sorted) {
    buckets[teamIndex].push(player);
    teamIndex += direction;
    if (teamIndex === numTeams) {
      teamIndex = numTeams - 1;
      direction = -1;
    } else if (teamIndex < 0) {
      teamIndex = 0;
      direction = 1;
    }
  }
  return buckets;
}

export function teamStrength(players: PlayerWithLevel[]): number {
  return players.reduce((s, p) => s + p.level, 0);
}

export function balanceDelta(buckets: PlayerWithLevel[][]): number {
  const strengths = buckets.map(teamStrength);
  return Math.max(...strengths) - Math.min(...strengths);
}
