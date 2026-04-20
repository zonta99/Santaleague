import { Suspense } from "react";
import { redirect } from "next/navigation";
import { UserRole, LeagueRole } from "@prisma/client";
import { currentRole, currentUser } from "@/lib/auth";
import { getActiveLeagueId } from "@/lib/active-league";
import { getActiveSeason } from "@/data/season";
import { getLeagueMember } from "@/data/league";
import { AdminTabs } from "./_components/admin-tabs";
import { OverviewTab } from "./_components/overview-tab";
import { MatchesTab } from "./_components/matches-tab";
import { SeasonsTab } from "./_components/seasons-tab";
import { UsersTab } from "./_components/users-tab";
import { SettingsTab } from "./_components/settings-tab";

interface AdminPageProps {
  searchParams: Promise<{ tab?: string }>;
}

const AdminPage = async ({ searchParams }: AdminPageProps) => {
  const [role, user, leagueId] = await Promise.all([currentRole(), currentUser(), getActiveLeagueId()]);
  const { tab } = await searchParams;

  const isGlobalAdmin = role === UserRole.ADMIN;
  const leagueMember = leagueId && user?.id ? await getLeagueMember(leagueId!, user.id) : null;
  const isLeagueAdmin =
    leagueMember?.role === LeagueRole.OWNER || leagueMember?.role === LeagueRole.MANAGER;

  if (!isGlobalAdmin && !isLeagueAdmin) redirect("/dashboard");

  const activeTab = tab ?? "overview";

  // admin-only tabs
  if ((activeTab === "users" || activeTab === "settings") && !isGlobalAdmin) {
    redirect("/admin?tab=overview");
  }

  const activeSeason = leagueId ? await getActiveSeason(leagueId!) : undefined;

  return (
    <div className="w-full max-w-4xl space-y-4">
      <h1 className="text-2xl font-bold">{isGlobalAdmin ? "Admin" : "Gestione"}</h1>

      <Suspense fallback={null}>
        <AdminTabs isGlobalAdmin={isGlobalAdmin}>
          {activeTab === "overview" && <OverviewTab seasonId={activeSeason?.id} leagueId={leagueId!} />}
          {activeTab === "matches" && <MatchesTab leagueId={leagueId!} />}
          {activeTab === "seasons" && <SeasonsTab leagueId={leagueId!} />}
          {activeTab === "users" && role === UserRole.ADMIN && <UsersTab />}
          {activeTab === "settings" && role === UserRole.ADMIN && <SettingsTab />}
        </AdminTabs>
      </Suspense>
    </div>
  );
};

export default AdminPage;
