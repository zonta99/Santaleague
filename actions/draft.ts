"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const executeDraft = async (matchId: number) => {
  const role = await currentRole();
  if (role !== UserRole.ADMIN) return { error: "Non autorizzato" };

  const match = await db.match.findUnique({
    where: { id: matchId },
    include: {
      MatchParticipant: true,
      Game: true,
    },
  });

  if (!match) return { error: "Partita non trovata" };
  if (match.MatchParticipant.length < 2) return { error: "Servono almeno 2 partecipanti" };

  const existing = await db.draftPick.count({ where: { match_id: matchId } });
  if (existing > 0) return { error: "Draft già eseguito per questa partita" };

  const shuffled = shuffle(match.MatchParticipant);
  const half = Math.ceil(shuffled.length / 2);
  const team1Players = shuffled.slice(0, half);
  const team2Players = shuffled.slice(half);

  const matchDate = new Date(match.date).toLocaleDateString("it-IT", {
    day: "numeric",
    month: "short",
  });

  const [team1, team2] = await Promise.all([
    db.team.create({ data: { name: `${matchDate} - Bianchi`, team_type: null } }),
    db.team.create({ data: { name: `${matchDate} - Neri`, team_type: null } }),
  ]);

  await db.draftPick.createMany({
    data: [
      ...team1Players.map((p, i) => ({
        match_id: matchId,
        team_id: team1.id,
        user_id: p.user_id,
        pick_order: i + 1,
      })),
      ...team2Players.map((p, i) => ({
        match_id: matchId,
        team_id: team2.id,
        user_id: p.user_id,
        pick_order: i + 1,
      })),
    ],
  });

  // Assign teams to all games in this match
  await db.game.updateMany({
    where: { match_id: matchId },
    data: { team1_id: team1.id, team2_id: team2.id },
  });

  revalidatePath(`/match/${matchId}`);
  revalidatePath(`/match/${matchId}/draft`);
  return { success: "Draft completato" };
};

export const setCaptain = async (matchId: number, teamId: number, userId: string) => {
  const role = await currentRole();
  if (role !== UserRole.ADMIN) return { error: "Non autorizzato" };

  // Unset all captains in this team, then set the chosen one
  await db.teamMember.updateMany({
    where: { team_id: teamId },
    data: { is_captain: false },
  });

  await db.teamMember.upsert({
    where: { team_id_user_id: { team_id: teamId, user_id: userId } },
    create: { team_id: teamId, user_id: userId, is_captain: true },
    update: { is_captain: true },
  });

  revalidatePath(`/match/${matchId}/draft`);
  return { success: "Capitano impostato" };
};

export const resetDraft = async (matchId: number) => {
  const role = await currentRole();
  if (role !== UserRole.ADMIN) return { error: "Non autorizzato" };

  // Remove DraftPick records
  await db.draftPick.deleteMany({ where: { match_id: matchId } });

  // Get teams used in this match's games
  const games = await db.game.findMany({
    where: { match_id: matchId },
    select: { team1_id: true, team2_id: true },
  });

  const rawIds = games.flatMap((g) => [g.team1_id, g.team2_id]).filter(Boolean) as number[];
  const teamIds = Array.from(new Set(rawIds));

  // Clear teams from games
  await db.game.updateMany({
    where: { match_id: matchId },
    data: { team1_id: null, team2_id: null },
  });

  // Delete TeamMember and draft teams (auto-created)
  if (teamIds.length > 0) {
    await db.teamMember.deleteMany({ where: { team_id: { in: teamIds } } });
    await db.team.deleteMany({ where: { id: { in: teamIds } } });
  }

  revalidatePath(`/match/${matchId}`);
  revalidatePath(`/match/${matchId}/draft`);
  return { success: "Draft azzerato" };
};
