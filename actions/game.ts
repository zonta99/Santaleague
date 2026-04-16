"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { currentRole } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { GameDetailSchema } from "@/schemas";
import * as z from "zod";

export const addGameDetail = async (values: z.infer<typeof GameDetailSchema>) => {
  const role = await currentRole();
  if (role !== UserRole.ADMIN) return { error: "Non autorizzato" };

  const parsed = GameDetailSchema.safeParse(values);
  if (!parsed.success) return { error: "Dati non validi" };

  const { game_id, match_id, event_type, player_id, team_id, minute } = parsed.data;

  await db.gameDetail.create({
    data: {
      game_id,
      event_type,
      player_id,
      team_id,
      minute: minute ?? null,
    },
  });

  revalidatePath(`/match/${match_id}`);
  return { success: "Evento aggiunto" };
};

export const deleteGameDetail = async (detailId: number, matchId: number) => {
  const role = await currentRole();
  if (role !== UserRole.ADMIN) return { error: "Non autorizzato" };

  await db.gameDetail.delete({ where: { id: detailId } });

  revalidatePath(`/match/${matchId}`);
  return { success: "Evento eliminato" };
};
