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
    select: { Match: { select: { league_id: true, Season: { select: { league_id: true } } } } },
  });
  return game?.Match?.Season?.league_id ?? game?.Match?.league_id ?? "";
}

async function resolveLeagueIdFromMatch(matchId: number): Promise<string> {
  const match = await db.match.findUnique({
    where: { id: matchId },
    select: { league_id: true, Season: { select: { league_id: true } } },
  });
  return match?.Season?.league_id ?? match?.league_id ?? "";
}

export const addGameDetail = async (values: z.infer<typeof GameDetailSchema>) => {
  const parsed = GameDetailSchema.safeParse(values);
  if (!parsed.success) return { error: "Dati non validi" };

  const { game_id, match_id, event_type, player_id, team_id, minute } = parsed.data;

  const leagueId = await resolveLeagueIdFromGame(game_id);
  const allowed = await canPerformLeagueAction(leagueId, "manageGameEvents");
  if (!allowed) return { error: "Non autorizzato" };

  const game = await db.game.findUnique({
    where: { id: game_id },
    select: {
      status: true,
      team1_id: true,
      team2_id: true,
      Match: { select: { id: true } },
    },
  });
  if (!game) return { error: "Partita non trovata" };
  if (game.status !== "ONGOING") return { error: "Non è possibile aggiungere eventi a una partita non in corso" };

  if (team_id !== game.team1_id && team_id !== game.team2_id) {
    return { error: "La squadra non appartiene a questa partita" };
  }
  if (player_id) {
    const member = await db.teamMember.findUnique({
      where: { team_id_user_id: { team_id: team_id, user_id: player_id } },
    });
    if (!member) return { error: "Il giocatore non appartiene a questa squadra" };
  }

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

  const game = await db.game.findUnique({ where: { id: gameId }, select: { status: true } });
  if (!game) return { error: "Partita non trovata" };
  if (game.status !== "ONGOING") return { error: "Il risultato può essere impostato solo per partite in corso" };

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

  const detail = await db.gameDetail.findUnique({
    where: { id: detailId },
    select: { Game: { select: { match_id: true } } },
  });
  if (!detail || detail.Game.match_id !== matchId) return { error: "Evento non trovato" };

  await db.gameDetail.delete({ where: { id: detailId } });

  revalidatePath(`/match/${matchId}`);
  return { success: "Evento eliminato" };
};
