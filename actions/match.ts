"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { currentUser, currentRole } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { UserRole } from "@prisma/client";
import { CreateMatchSchema } from "@/schemas";
import { checkCareerBadgesForPlayer } from "@/actions/badges";
import { getActiveSeason } from "@/data/season";

export const createMatch = async (values: z.infer<typeof CreateMatchSchema>) => {
  const role = await currentRole();
  if (!hasPermission(role, "createMatch")) return { error: "Non autorizzato" };

  const parsed = CreateMatchSchema.safeParse(values);
  if (!parsed.success) return { error: "Dati non validi" };

  const { date, location_id, match_type, num_games, num_teams, players_per_team } = parsed.data;
  const activeSeason = await getActiveSeason();

  const match = await db.match.create({
    data: {
      date: new Date(date),
      match_type,
      location_id,
      status: "SCHEDULED",
      season_id: activeSeason?.id ?? null,
      num_teams,
      players_per_team,
      Game: {
        create: Array.from({ length: num_games }, (_, i) => ({
          game_number: i + 1,
          status: "SCHEDULED",
        })),
      },
    },
  });

  revalidatePath("/match");
  revalidatePath("/dashboard");
  return { success: `Partita #${match.id} creata` };
};

export const joinMatch = async (matchId: number) => {
  const user = await currentUser();
  if (!user?.id) return { error: "Non autenticato" };

  const match = await db.match.findUnique({ where: { id: matchId } });
  if (!match) return { error: "Partita non trovata" };
  if (match.status !== "SCHEDULED") return { error: "Non è possibile iscriversi a questa partita" };

  try {
    await db.matchParticipant.create({
      data: { match_id: matchId, user_id: user.id },
    });
  } catch {
    return { error: "Sei già iscritto" };
  }

  revalidatePath("/match");
  return { success: "Iscrizione confermata" };
};

export const updateMatchStatus = async (matchId: number, status: "SCHEDULED" | "ONGOING" | "COMPLETED" | "CANCELED") => {
  const role = await currentRole();
  if (!hasPermission(role, "updateMatchStatus")) return { error: "Non autorizzato" };

  await db.match.update({ where: { id: matchId }, data: { status } });

  if (status === "COMPLETED") {
    await db.game.updateMany({
      where: { match_id: matchId },
      data: { rating_open: true, rating_opened_at: new Date() },
    });

    const participants = await db.matchParticipant.findMany({
      where: { match_id: matchId },
      select: { user_id: true },
    });
    await Promise.all(participants.map((p) => checkCareerBadgesForPlayer(p.user_id)));
  }

  revalidatePath(`/match/${matchId}`);
  revalidatePath("/match");
  revalidatePath("/dashboard");
  return { success: "Stato aggiornato" };
};

export const leaveMatch = async (matchId: number) => {
  const user = await currentUser();
  if (!user?.id) return { error: "Non autenticato" };

  await db.matchParticipant.deleteMany({
    where: { match_id: matchId, user_id: user.id },
  });

  revalidatePath("/match");
  return { success: "Iscrizione annullata" };
};
