"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { currentUser, currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { CreateMatchSchema } from "@/schemas";

export const createMatch = async (values: z.infer<typeof CreateMatchSchema>) => {
  const role = await currentRole();
  if (role !== UserRole.ADMIN) return { error: "Non autorizzato" };

  const parsed = CreateMatchSchema.safeParse(values);
  if (!parsed.success) return { error: "Dati non validi" };

  const { date, location_id, match_type, num_games } = parsed.data;

  const match = await db.match.create({
    data: {
      date: new Date(date),
      match_type,
      location_id,
      status: "SCHEDULED",
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

export const leaveMatch = async (matchId: number) => {
  const user = await currentUser();
  if (!user?.id) return { error: "Non autenticato" };

  await db.matchParticipant.deleteMany({
    where: { match_id: matchId, user_id: user.id },
  });

  revalidatePath("/match");
  return { success: "Iscrizione annullata" };
};
