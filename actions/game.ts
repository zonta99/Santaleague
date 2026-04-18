"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { currentRole } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { GameEventType } from "@prisma/client";
import { GameDetailSchema } from "@/schemas";
import * as z from "zod";
import { checkCareerBadgesForPlayer, checkHatTrickForGame } from "@/actions/badges";

export const addGameDetail = async (values: z.infer<typeof GameDetailSchema>) => {
  const role = await currentRole();
  if (!hasPermission(role, "manageGameEvents")) return { error: "Non autorizzato" };

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

  if (event_type === GameEventType.Goal && player_id) {
    await checkCareerBadgesForPlayer(player_id);
    await checkHatTrickForGame(game_id);
  }

  revalidatePath(`/match/${match_id}`);
  return { success: "Evento aggiunto" };
};

export const setGameWinner = async (gameId: number, matchId: number, winnerTeamId: number | null) => {
  const role = await currentRole();
  if (!hasPermission(role, "manageGameEvents")) return { error: "Non autorizzato" };

  await db.game.update({
    where: { id: gameId },
    data: { winner_team_id: winnerTeamId },
  });

  revalidatePath(`/match/${matchId}`);
  return { success: "Risultato aggiornato" };
};

export const deleteGameDetail = async (detailId: number, matchId: number) => {
  const role = await currentRole();
  if (!hasPermission(role, "manageGameEvents")) return { error: "Non autorizzato" };

  await db.gameDetail.delete({ where: { id: detailId } });

  revalidatePath(`/match/${matchId}`);
  return { success: "Evento eliminato" };
};
