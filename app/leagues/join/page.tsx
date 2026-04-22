import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getLeagueByPublicToken } from "@/data/league";
import { JoinRequestForm } from "@/components/league/join-request-form";

interface Props {
  searchParams: Promise<{ token?: string }>;
}

export default async function JoinLeaguePage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Link non valido.</p>
      </div>
    );
  }

  const league = await getLeagueByPublicToken(token);

  if (!league) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Link non valido o disabilitato.</p>
      </div>
    );
  }

  const session = await auth();

  if (!session?.user) {
    redirect(`/auth/login?callbackUrl=/leagues/join?token=${token}`);
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <JoinRequestForm token={token} leagueName={league.name} leagueDescription={league.description} />
    </div>
  );
}
