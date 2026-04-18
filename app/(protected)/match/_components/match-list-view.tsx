import { MatchCard, MatchItem } from "./match-card";

interface MatchListViewProps {
  matches: MatchItem[];
  joinedMatchIds: number[];
}

export function MatchListView({ matches, joinedMatchIds }: MatchListViewProps) {
  const joinedSet = new Set(joinedMatchIds);

  if (matches.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">Nessuna partita ancora registrata.</p>
    );
  }

  return (
    <div className="space-y-3">
      {matches.map((match) => (
        <MatchCard key={match.id} match={match} isJoined={joinedSet.has(match.id)} />
      ))}
    </div>
  );
}
