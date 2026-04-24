import { redirect } from "next/navigation";
import { headers } from "next/headers";

import { currentUser } from "@/lib/auth";
import { getActiveLeagueId } from "@/lib/active-league";
import { getLeagueMember, getLeagueById } from "@/data/league";
import { LeagueProvider } from "@/components/league/league-provider";
import { Navbar } from "@/app/(protected)/_components/navbar";
import { MobileNavbar } from "@/components/component/mobile-navbar";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

const ProtectedLayout = async ({ children }: ProtectedLayoutProps) => {
  const hdrs = await headers();
  const pathname = hdrs.get("x-pathname") ?? "";
  const isLeaguePath = pathname.startsWith("/leagues");

  // Leagues pages don't need a league context
  if (isLeaguePath) {
    return (
      <div className="flex flex-col min-h-screen bg-background">
        <main className="flex-1 flex flex-col items-center px-4 pb-20 md:pb-6 pt-6">
          {children}
        </main>
      </div>
    );
  }

  const [leagueId, user] = await Promise.all([
    getActiveLeagueId(),
    currentUser(),
  ]);

  if (!leagueId || !user?.id) redirect("/leagues");

  const [member, league] = await Promise.all([
    getLeagueMember(leagueId, user.id),
    getLeagueById(leagueId),
  ]);
  if (!member) redirect("/leagues");

  return (
    <LeagueProvider leagueId={leagueId} leagueName={league?.name ?? "Santaleague"} role={member.role}>
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
