import { redirect } from "next/navigation";
import { LeagueRole } from "@prisma/client";

import { currentUser } from "@/lib/auth";
import { getLeagueById, getLeagueMember, getLeagueMembers } from "@/data/league";
import { MembersTable } from "@/components/league/members-table";
import { PublicLinkSection } from "@/components/league/public-link-section";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  params: Promise<{ leagueId: string }>;
}

export default async function LeagueSettingsPage({ params }: Props) {
  const { leagueId } = await params;
  const user = await currentUser();
  if (!user?.id) redirect("/auth/login");

  const [league, member, members] = await Promise.all([
    getLeagueById(leagueId),
    getLeagueMember(leagueId, user.id),
    getLeagueMembers(leagueId),
  ]);

  if (!league || !member) redirect("/leagues");

  const canInvite = member.role === LeagueRole.OWNER || member.role === LeagueRole.MANAGER;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{league.name}</h1>
        {league.description && <p className="text-muted-foreground text-sm mt-1">{league.description}</p>}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Membri</CardTitle>
          <CardDescription>{members.length} membro/i in questa lega</CardDescription>
        </CardHeader>
        <CardContent>
          <MembersTable
            members={members as any}
            currentUserId={user.id}
            currentUserRole={member.role}
            leagueId={leagueId}
          />
        </CardContent>
      </Card>

      {canInvite && (
        <Card>
          <CardHeader>
            <CardTitle>Link di invito</CardTitle>
            <CardDescription>
              Condividi il link pubblico per far richiedere l&apos;accesso alla lega. Le richieste devono essere approvate da un admin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PublicLinkSection
              leagueId={leagueId}
              currentToken={league.public_invite_token}
              appUrl={appUrl}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
