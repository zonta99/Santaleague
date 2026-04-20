"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { canPerformLeagueAction } from "@/lib/league-auth";
import { GameEventType } from "@prisma/client";
import { GameDetailSchema } from "@/schemas";
import * as z from "zod";
import { checkCareerBadgesForPlayer, checkHatTrickForGame } from "@/actions/badges";

async function resolveLeagueIdFromGame(gameId: number): Promise<string> {
  const game = await db.game.findUnique({
    where: { id: gameId },
    select: { Match: { select: { Season: { select: { league_id: true } } } } },
  });
  return game?.Match?.Season?.league_id ?? "";
}

async function resolveLeagueIdFromMatch(matchId: number): Promise<string> {
  const match = await db.match.findUnique({
    where: { id: matchId },
    select: { Season: { select: { league_id: true } } },
  });
  return match?.Season?.league_id ?? "";
}

export const addGameDetail = async (values: z.infer<typeof GameDetailSchema>) => {
  const parsed = GameDetailSchema.safeParse(values);
  if (!parsed.success) return { error: "Dati non validi" };

  const { game_id, match_id, event_type, player_id, team_id, minute } = parsed.data;

  const leagueId = await resolveLeagueIdFromGame(game_id);
  const allowed = await canPerformLeagueAction(leagueId, "manageGameEvents");
  if (!allowed) return { error: "Non autorizzato" };

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
    await checkCareerBadgesForPlayer(player_id, leagueId);
    await checkHatTrickForGame(game_id, leagueId);
  }

  revalidatePath(`/match/${match_id}`);
  return { success: "Evento aggiunto" };
};

export const setGameWinner = async (gameId: number, matchId: number, winnerTeamId: number | null) => {
  const leagueId = await resolveLeagueIdFromMatch(matchId);
  const allowed = await canPerformLeagueAction(leagueId, "manageGameEvents");
  if (!allowed) return { error: "Non autorizzato" };

  await db.game.update({
    where: { id: gameId },
    data: { winner_team_id: winnerTeamId },
  });

  revalidatePath(`/match/${matchId}`);
  return { success: "Risultato aggiornato" };
};

export const deleteGameDetail = async (detailId: number, matchId: number) => {
  const leagueId = await resolveLeagueIdFromMatch(matchId);
  const allowed = await canPerformLeagueAction(leagueId, "manageGameEvents");
  if (!allowed) return { error: "Non autorizzato" };

  await db.gameDetail.delete({ where: { id: detailId } });

  revalidatePath(`/match/${matchId}`);
  return { success: "Evento eliminato" };
};
