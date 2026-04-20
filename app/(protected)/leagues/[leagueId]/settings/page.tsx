import { redirect } from "next/navigation";
import { LeagueRole } from "@prisma/client";

import { currentUser } from "@/lib/auth";
import { getLeagueById, getLeagueMember, getLeagueMembers, getPendingInvites } from "@/data/league";
import { MembersTable } from "@/components/league/members-table";
import { InviteForm } from "@/components/league/invite-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface Props {
  params: Promise<{ leagueId: string }>;
}

export default async function LeagueSettingsPage({ params }: Props) {
  const { leagueId } = await params;
  const user = await currentUser();
  if (!user?.id) redirect("/auth/login");

  const [league, member, members, invites] = await Promise.all([
    getLeagueById(leagueId),
    getLeagueMember(leagueId, user.id),
    getLeagueMembers(leagueId),
    getPendingInvites(leagueId),
  ]);

  if (!league || !member) redirect("/leagues");

  const canInvite = member.role === LeagueRole.OWNER || member.role === LeagueRole.MANAGER;
  const isOwner = member.role === LeagueRole.OWNER;

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
            <CardTitle>Invita un membro</CardTitle>
            <CardDescription>Invia un link di invito via email. Il link scade dopo 48 ore.</CardDescription>
          </CardHeader>
          <CardContent>
            <InviteForm leagueId={leagueId} pendingInvites={invites as any} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
