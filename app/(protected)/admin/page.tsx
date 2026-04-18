import { Suspense } from "react";
import { redirect } from "next/navigation";
import { UserRole } from "@prisma/client";
import { currentRole } from "@/lib/auth";
import { getActiveSeason } from "@/data/season";
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
  const role = await currentRole();
  if (!role || (role !== UserRole.ADMIN && role !== UserRole.MODERATOR)) {
    redirect("/dashboard");
  }

  const { tab } = await searchParams;
  const activeTab = tab ?? "overview";

  // admin-only tabs
  if ((activeTab === "users" || activeTab === "settings") && role !== UserRole.ADMIN) {
    redirect("/admin?tab=overview");
  }

  const activeSeason = await getActiveSeason();

  return (
    <div className="w-full max-w-4xl space-y-4">
      <h1 className="text-2xl font-bold">{role === UserRole.ADMIN ? "Admin" : "Gestione"}</h1>

      <Suspense fallback={null}>
        <AdminTabs role={role}>
          {activeTab === "overview" && <OverviewTab seasonId={activeSeason?.id} />}
          {activeTab === "matches" && <MatchesTab />}
          {activeTab === "seasons" && <SeasonsTab />}
          {activeTab === "users" && role === UserRole.ADMIN && <UsersTab />}
          {activeTab === "settings" && role === UserRole.ADMIN && <SettingsTab />}
        </AdminTabs>
      </Suspense>
    </div>
  );
};

export default AdminPage;
