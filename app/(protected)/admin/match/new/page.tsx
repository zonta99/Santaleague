import { redirect } from "next/navigation";
import { UserRole, LeagueRole } from "@prisma/client";
import { currentRole, currentUser } from "@/lib/auth";
import { getActiveLeagueId } from "@/lib/active-league";
import { getLeagueMember } from "@/data/league";
import { getAllLocations } from "@/data/location";
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

  const locations = await getAllLocations(leagueId);

  return (
    <div className="min-h-screen flex flex-col">
      <CreateMatchWizard locations={locations} leagueId={leagueId} prefilledDate={prefilledDate} />
    </div>
  );
};

export default NewMatchPage;
