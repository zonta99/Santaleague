import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getLeagueInviteByToken } from "@/data/league-invite";
import { InviteAccept } from "@/components/league/invite-accept";

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function InvitePage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Link di invito non valido.</p>
      </div>
    );
  }

  const invite = await getLeagueInviteByToken(token);

  if (!invite || invite.expires < new Date()) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Invito non trovato o scaduto.</p>
      </div>
    );
  }

  const session = await auth();

  if (!session?.user) {
    redirect(`/auth/login?callbackUrl=/leagues/invite?token=${token}`);
  }

  if (session.user.email !== invite.email) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">
          Questo invito è per <strong>{invite.email}</strong>. Sei loggato come{" "}
          <strong>{session.user.email}</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <InviteAccept
        token={token}
        leagueName={invite.League.name}
        role={invite.role}
      />
    </div>
  );
}
