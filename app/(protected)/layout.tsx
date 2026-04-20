import { redirect } from "next/navigation";

import { currentUser } from "@/lib/auth";
import { getActiveLeagueId, getActiveLeagueRole } from "@/lib/active-league";
import { getLeagueMember } from "@/data/league";
import { LeagueProvider } from "@/components/league/league-provider";
import { Navbar } from "@/app/(protected)/_components/navbar";
import { MobileNavbar } from "@/components/component/mobile-navbar";
import { LeagueRole } from "@prisma/client";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

const ProtectedLayout = async ({ children }: ProtectedLayoutProps) => {
  const [leagueId, leagueRole, user] = await Promise.all([
    getActiveLeagueId(),
    getActiveLeagueRole(),
    currentUser(),
  ]);

  if (!leagueId || !user?.id) redirect("/leagues");

  // Validate membership is still valid
  const member = await getLeagueMember(leagueId, user.id);
  if (!member) redirect("/leagues");

  const role = (leagueRole as LeagueRole) ?? member.role;

  return (
    <LeagueProvider leagueId={leagueId} role={role}>
      <div className="flex flex-col min-h-screen bg-background">
        <header className="hidden md:flex justify-center border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
          <Navbar />
        </header>
        <main className="flex-1 flex flex-col items-center px-4 pb-20 md:pb-6 pt-6">
          {children}
        </main>
        <MobileNavbar />
      </div>
    </LeagueProvider>
  );
};

export default ProtectedLayout;
