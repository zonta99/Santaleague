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
import { MembersTab } from "./_components/members-tab";
import { LeagueTab } from "./_components/league-tab";
import { LeaguesTabShell } from "./_components/leagues-tab";
import { UsersTab } from "./_components/users-tab";
import { SettingsTab } from "./_components/settings-tab";
import { db } from "@/lib/db";

interface AdminPageProps {
  searchParams: Promise<{ tab?: string; leagueId?: string }>;
}

const AdminPage = async ({ searchParams }: AdminPageProps) => {
  const [role, user, leagueId] = await Promise.all([currentRole(), currentUser(), getActiveLeagueId()]);
  const { tab, leagueId: leagueIdParam } = await searchParams;

  const isGlobalAdmin = role === UserRole.ADMIN;
  const leagueMember = leagueId && user?.id ? await getLeagueMember(leagueId!, user.id) : null;
  const isLeagueAdmin =
    leagueMember?.role === LeagueRole.OWNER || leagueMember?.role === LeagueRole.MANAGER;

  if (!isGlobalAdmin && !isLeagueAdmin) redirect("/dashboard");

  const activeTab = tab ?? "overview";

  // guard tabs
  if ((activeTab === "users" || activeTab === "settings" || activeTab === "leagues") && !isGlobalAdmin) {
    redirect("/admin?tab=overview");
  }
  if ((activeTab === "members" || activeTab === "league") && (!isLeagueAdmin || isGlobalAdmin)) {
    redirect("/admin?tab=overview");
  }

  const activeSeason = leagueId ? await getActiveSeason(leagueId!) : undefined;

  // For the "leagues" tab: fetch all leagues and resolve the selected one
  const allLeagues = isGlobalAdmin && activeTab === "leagues"
    ? await db.league.findMany({ select: { id: true, name: true, slug: true }, orderBy: { name: "asc" } })
    : [];
  const selectedLeagueId = leagueIdParam ?? null;

  return (
    <div className="w-full space-y-4">
      <Suspense fallback={null}>
        <AdminTabs isGlobalAdmin={isGlobalAdmin} isLeagueAdmin={isLeagueAdmin} title={isGlobalAdmin ? "Admin" : "Gestione"}>
          {activeTab === "overview" && <OverviewTab seasonId={activeSeason?.id} leagueId={leagueId!} />}
          {activeTab === "matches" && <MatchesTab leagueId={leagueId!} />}
          {activeTab === "seasons" && <SeasonsTab leagueId={leagueId!} />}
          {activeTab === "members" && isLeagueAdmin && !isGlobalAdmin && (
            <MembersTab
              leagueId={leagueId!}
              currentUserId={user!.id!}
              currentUserRole={leagueMember!.role}
            />
          )}
          {activeTab === "league" && isLeagueAdmin && !isGlobalAdmin && (
            <LeagueTab
              leagueId={leagueId!}
              isOwner={leagueMember?.role === LeagueRole.OWNER}
            />
          )}
          {activeTab === "leagues" && isGlobalAdmin && (
            <LeaguesTabShell leagues={allLeagues} selectedLeagueId={selectedLeagueId}>
              <LeagueTab leagueId={selectedLeagueId!} isOwner={true} />
              <MembersTab
                leagueId={selectedLeagueId!}
                currentUserId={user!.id!}
                currentUserRole={LeagueRole.OWNER}
              />
            </LeaguesTabShell>
          )}
          {activeTab === "users" && role === UserRole.ADMIN && <UsersTab />}
          {activeTab === "settings" && role === UserRole.ADMIN && <SettingsTab />}
        </AdminTabs>
      </Suspense>
    </div>
  );
};

export default AdminPage;
