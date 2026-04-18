import { getLeaderboard } from "@/data/stats";
import { PlayersGrid } from "./_components/players-grid";

export default async function PlayersPage() {
  const players = await getLeaderboard();

  return (
    <div className="w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Giocatori</h1>
        <p className="text-muted-foreground text-sm">{players.length} giocatori registrati</p>
      </div>
      <PlayersGrid players={players} />
    </div>
  );
}
