import { NextRequest } from "next/server";
import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { getLeaderboard } from "@/data/stats";

export async function GET(req: NextRequest) {
  const role = await currentRole();
  if (role !== UserRole.ADMIN) {
    return new Response("Forbidden", { status: 403 });
  }

  const seasonId = req.nextUrl.searchParams.get("seasonId");
  const sid = seasonId ? parseInt(seasonId) : undefined;

  const rows = await getLeaderboard(sid);

  const header = "Giocatore,Gol,Vittorie,Partite giocate,Media voto,Livello,Tier";
  const lines = rows.map((r) =>
    [
      `"${r.user.name ?? ""}"`,
      r.goals,
      r.wins,
      r.gamesPlayed,
      r.avgFieldRating != null ? r.avgFieldRating.toFixed(1) : "",
      r.level.toFixed(1),
      r.tier,
    ].join(",")
  );

  const csv = [header, ...lines].join("\n");
  const filename = sid ? `santaleague-stagione-${sid}.csv` : "santaleague-tutti.csv";

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
