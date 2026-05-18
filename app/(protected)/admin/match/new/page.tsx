import { redirect } from "next/navigation";
import { UserRole, LeagueRole } from "@prisma/client";
import { AlertTriangle } from "lucide-react";
import { currentRole, currentUser } from "@/lib/auth";
import { getActiveLeagueId } from "@/lib/active-league";
import { getLeagueMember } from "@/data/league";
import { getAllLocations } from "@/data/location";
import { getActiveSeason } from "@/data/season";
import { getLeaderboard } from "@/data/stats";
import { CreateMatchWizard } from "./_components/create-match-wizard";

const NewMatchPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) => {
  const [role, user, leagueId, { date: prefilledDate }] = await Promise.all([
    currentRole(),
    currentUser(),
    getActiveLeagueId(),
    searchParams,
  ]);

  const isGlobalAdmin = role === UserRole.ADMIN;
  const leagueMember = leagueId && user?.id ? await getLeagueMember(leagueId, user.id) : null;
  const isLeagueAdmin =
    leagueMember?.role === LeagueRole.OWNER || leagueMember?.role === LeagueRole.MANAGER;

  if (!isGlobalAdmin && !isLeagueAdmin) redirect("/dashboard");
  if (!leagueId) redirect("/admin");

  const [locations, activeSeason, leaderboard] = await Promise.all([
    getAllLocations(leagueId),
    getActiveSeason(leagueId),
    getLeaderboard(leagueId).catch(() => []),
  ]);
  const leagueRanking = leaderboard.map((e: { user: { id: string; name: string | null } }) => ({
    userId: e.user.id,
    name: e.user.name ?? "",
  }));

  const blockingError = !activeSeason
    ? "Nessuna stagione attiva. Crea o attiva una stagione prima di creare una partita."
    : locations.length === 0
    ? "Nessun campo disponibile. Aggiungi almeno un campo prima di creare una partita."
    : null;

  if (blockingError) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-destructive" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Impossibile creare la partita</h2>
          <p className="text-sm text-muted-foreground">{blockingError}</p>
          <a
            href="/admin"
            className="inline-block mt-2 text-sm font-medium text-primary hover:underline"
          >
            Torna al pannello admin
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <CreateMatchWizard locations={locations} leagueId={leagueId} prefilledDate={prefilledDate} leagueRanking={leagueRanking} />
    </div>
  );
};

export default NewMatchPage;
