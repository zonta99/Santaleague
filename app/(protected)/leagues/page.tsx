import { redirect } from "next/navigation";

import { currentUser } from "@/lib/auth";
import { getUserLeagues } from "@/data/league";
import { LeagueOnboarding } from "@/components/league/league-onboarding";

export default async function LeaguesPage() {
  const user = await currentUser();
  if (!user?.id) redirect("/auth/login");

  const memberships = await getUserLeagues(user.id);
  const canCreate = user.canCreateLeague || user.role === "ADMIN";

  if (memberships.length === 1) {
    redirect(`/api/league/activate?id=${memberships[0].league_id}&redirect=/dashboard`);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-md mx-auto">
      <LeagueOnboarding memberships={memberships} canCreateLeague={canCreate} />
    </div>
  );
}
