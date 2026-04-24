import { NextRequest, NextResponse } from "next/server";
import { getMatchById } from "@/data/match";
import { currentUser } from "@/lib/auth";
import { getLeagueMember } from "@/data/league";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ match_id: string }> }
) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Non autenticato" }, { status: 401 });

  const { match_id } = await params;
  const id = parseInt(match_id, 10);
  if (isNaN(id)) return NextResponse.json({ error: "ID non valido" }, { status: 400 });

  const match = await getMatchById(id);
  if (!match) return NextResponse.json({ error: "Match non trovato" }, { status: 404 });

  const leagueId = match.Season?.league_id;
  if (leagueId) {
    const member = await getLeagueMember(leagueId, user.id!);
    if (!member) return NextResponse.json({ error: "Non autorizzato" }, { status: 403 });
  }

  return NextResponse.json({ match });
}
