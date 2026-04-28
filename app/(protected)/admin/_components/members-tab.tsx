import { LeagueRole } from "@prisma/client";
import { getLeagueMembers, getPendingJoinRequests } from "@/data/league";
import { db } from "@/lib/db";
import { MembersTable } from "@/components/league/members-table";
import { JoinRequestsList } from "@/components/league/join-requests-list";
import { PublicLinkSection } from "@/components/league/public-link-section";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  leagueId: string;
  currentUserId: string;
  currentUserRole: LeagueRole;
}

export async function MembersTab({ leagueId, currentUserId, currentUserRole }: Props) {
  const [members, joinRequests, league] = await Promise.all([
    getLeagueMembers(leagueId),
    getPendingJoinRequests(leagueId),
    db.league.findUnique({ where: { id: leagueId }, select: { public_invite_token: true } }),
  ]);

  const canManage = currentUserRole === LeagueRole.OWNER || currentUserRole === LeagueRole.MANAGER;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Membri</CardTitle>
          <CardDescription>{members.length} membro/i in questa lega</CardDescription>
        </CardHeader>
        <CardContent>
          <MembersTable
            members={members as any}
            currentUserId={currentUserId}
            currentUserRole={currentUserRole}
            leagueId={leagueId}
          />
        </CardContent>
      </Card>

      {canManage && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>
                Richieste di accesso
                {joinRequests.length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-xs w-5 h-5">
                    {joinRequests.length}
                  </span>
                )}
              </CardTitle>
              <CardDescription>Utenti che hanno richiesto di unirsi tramite link pubblico</CardDescription>
            </CardHeader>
            <CardContent>
              <JoinRequestsList requests={joinRequests as any} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Link di invito</CardTitle>
              <CardDescription>Condividi il link pubblico per far richiedere l&apos;accesso alla lega.</CardDescription>
            </CardHeader>
            <CardContent>
              <PublicLinkSection
                leagueId={leagueId}
                currentToken={league?.public_invite_token ?? null}
                appUrl={appUrl}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
