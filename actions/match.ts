"use server";

import * as z from "zod";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { canPerformLeagueAction } from "@/lib/league-auth";
import { getLeagueMember } from "@/data/league";
import { CreateMatchSchema } from "@/schemas";
import { checkCareerBadgesForPlayer } from "@/actions/badges";
import { createNotificationsForUsers } from "@/actions/notifications";
import { getActiveSeason } from "@/data/season";
import { deriveFormat, roundRobinPairs, buildEliminationBracket } from "@/lib/match-format";
import type { MatchFormat } from "@/lib/match-format";

export const createMatch = async (values: z.infer<typeof CreateMatchSchema>, leagueId: string) => {
  const allowed = await canPerformLeagueAction(leagueId, "createMatch");
  if (!allowed) return { error: "Non autorizzato" };

  const parsed = CreateMatchSchema.safeParse(values);
  if (!parsed.success) return { error: "Dati non validi" };

  const { date, location_id, num_games, num_teams, players_per_team, bracket_format, bracket_seed } = parsed.data;

  const [activeSeason, location] = await Promise.all([
    getActiveSeason(leagueId),
    db.location.findFirst({ where: { id: location_id }, select: { id: true } }),
  ]);

  if (!activeSeason) return { error: "Nessuna stagione attiva per questa lega." };
  if (!location) return { error: "Campo non valido." };

  const format: MatchFormat = deriveFormat(num_teams, bracket_format)

  // Build game list based on format
  type GameCreate = { game_number: number; status: "SCHEDULED"; round?: string; bracket_slot?: number; fed_from_game1?: number; fed_from_game2?: number }
  let gamesToCreate: GameCreate[]

  if (format === "NORMALE") {
    gamesToCreate = Array.from({ length: num_games }, (_, i) => ({ game_number: i + 1, status: "SCHEDULED" as const }))
  } else if (format === "GIRONE") {
    const pairs = roundRobinPairs(num_teams)
    gamesToCreate = pairs.map((_, i) => ({ game_number: i + 1, status: "SCHEDULED" as const }))
  } else {
    // BRACKET_ELIMINATION or BRACKET_GROUPS
    const slots = buildEliminationBracket(num_teams)
    gamesToCreate = slots.map((s, i) => ({
      game_number: i + 1,
      status: "SCHEDULED" as const,
      round: s.round,
      bracket_slot: s.bracket_slot,
    }))
  }

  const match = await db.$transaction(async (tx) => {
    const created = await tx.match.create({
      data: {
        date: new Date(date),
        format,
        location_id,
        status: "SCHEDULED",
        league_id: leagueId,
        season_id: activeSeason.id,
        num_teams,
        players_per_team,
        Game: { create: gamesToCreate },
      },
      include: { Game: { orderBy: { game_number: "asc" } } },
    })

    // For bracket: wire up fed_from_game references now that we have game IDs
    if (format === "BRACKET_ELIMINATION" || format === "BRACKET_GROUPS") {
      const slots = buildEliminationBracket(num_teams)
      for (const slot of slots) {
        if (slot.fed_from_slot_a === null && slot.fed_from_slot_b === null) continue
        const thisGame = created.Game.find((g) => g.bracket_slot === slot.bracket_slot)
        if (!thisGame) continue
        const feeder1 = slot.fed_from_slot_a !== null
          ? created.Game.find((g) => g.bracket_slot === slot.fed_from_slot_a) : null
        const feeder2 = slot.fed_from_slot_b !== null
          ? created.Game.find((g) => g.bracket_slot === slot.fed_from_slot_b) : null
        await tx.game.update({
          where: { id: thisGame.id },
          data: { fed_from_game1: feeder1?.id ?? null, fed_from_game2: feeder2?.id ?? null },
        })
      }

      // Save bracket seed if provided
      if (bracket_seed && bracket_seed.length > 0) {
        await tx.matchBracketSeed.createMany({
          data: bracket_seed.map((name, i) => ({ match_id: created.id, position: i + 1, team_name: name })),
        })
      }
    }

    return created
  })

  const leagueMembers = await db.leagueMember.findMany({
    where: { league_id: leagueId },
    select: { user_id: true },
  });
  await createNotificationsForUsers(
    leagueMembers.map((u) => u.user_id),
    "MATCH_SCHEDULED",
    "Nuova partita programmata",
    `È stata programmata una nuova partita per il ${new Date(date).toLocaleDateString("it-IT")}.`,
    { match_id: match.id }
  );

  revalidatePath("/match");
  revalidatePath("/dashboard");
  return { success: `Partita #${match.id} creata` };
};

export const joinMatch = async (matchId: number) => {
  const user = await currentUser();
  if (!user?.id) return { error: "Non autenticato" };

  const match = await db.match.findUnique({
    where: { id: matchId },
    select: {
      status: true,
      num_teams: true,
      players_per_team: true,
      league_id: true,
      Season: { select: { league_id: true } },
      _count: { select: { MatchParticipant: true } },
    },
  });
  if (!match) return { error: "Partita non trovata" };
  if (match.status !== "SCHEDULED") return { error: "Non è possibile iscriversi a questa partita" };

  const capacity = (match.num_teams ?? 2) * (match.players_per_team ?? 1);
  if (match._count.MatchParticipant >= capacity) {
    return { error: `Partita al completo` };
  }

  const leagueId = match.Season?.league_id ?? match.league_id;
  if (leagueId) {
    const member = await getLeagueMember(leagueId, user.id);
    if (!member) return { error: "Non sei membro di questa lega" };
  }

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
  const match = await db.match.findUnique({
    where: { id: matchId },
    select: { status: true, draft_locked: true, league_id: true, Season: { select: { league_id: true } } },
  });
  if (!match) return { error: "Partita non trovata" };

  const leagueId = match.Season?.league_id ?? match.league_id ?? "";
  const allowed = await canPerformLeagueAction(leagueId, "updateMatchStatus");
  if (!allowed) return { error: "Non autorizzato" };

  if (match.status === "CANCELED") {
    return { error: "Non è possibile modificare una partita annullata" };
  }
  const ORDER = { SCHEDULED: 0, ONGOING: 1, COMPLETED: 2, CANCELED: 3 };
  if (ORDER[status] < ORDER[match.status as keyof typeof ORDER]) {
    return { error: "Non è possibile tornare a uno stato precedente" };
  }

  if (status === "ONGOING" && !match.draft_locked) {
    return { error: "Il draft deve essere bloccato prima di iniziare la partita" };
  }

  await db.match.update({ where: { id: matchId }, data: { status } });
  if (status === "COMPLETED") {
    // Complete all games not yet completed
    await db.game.updateMany({ where: { match_id: matchId, status: { not: "COMPLETED" } }, data: { status: "COMPLETED" } });
  } else if (status === "CANCELED") {
    await db.match.update({ where: { id: matchId }, data: { rating_open: false } });
    await db.game.updateMany({ where: { match_id: matchId, status: { not: "COMPLETED" } }, data: { status: "CANCELED" } });
  }
  // When ONGOING: games stay SCHEDULED; admin starts each game individually via startGame action

  if (status === "ONGOING") {
    const participants = await db.matchParticipant.findMany({
      where: { match_id: matchId },
      select: { user_id: true },
    });
    await createNotificationsForUsers(
      participants.map((p) => p.user_id),
      "MATCH_STARTED",
      "La partita è iniziata!",
      `La partita #${matchId} è ora in corso.`,
      { match_id: matchId }
    );
  }

  if (status === "COMPLETED") {
    await db.match.update({
      where: { id: matchId },
      data: { rating_open: true, rating_opened_at: new Date() },
    });

    // Auto-compute winner_team_id inside a transaction for a consistent goal snapshot
    await db.$transaction(async (tx) => {
      const games = await tx.game.findMany({
        where: { match_id: matchId },
        select: {
          id: true,
          team1_id: true,
          team2_id: true,
          GameDetail: { where: { event_type: "Goal" }, select: { team_id: true } },
        },
      });
      await Promise.all(
        games.map((game) => {
          if (!game.team1_id || !game.team2_id) return Promise.resolve();
          const t1 = game.GameDetail.filter((d) => d.team_id === game.team1_id).length;
          const t2 = game.GameDetail.filter((d) => d.team_id === game.team2_id).length;
          const winner = t1 > t2 ? game.team1_id : t2 > t1 ? game.team2_id : null;
          return tx.game.update({ where: { id: game.id }, data: { winner_team_id: winner } });
        })
      );
    });

    const participants = await db.matchParticipant.findMany({
      where: { match_id: matchId },
      select: { user_id: true },
    });
    await Promise.all(participants.map((p) => checkCareerBadgesForPlayer(p.user_id, leagueId)));
    await createNotificationsForUsers(
      participants.map((p) => p.user_id),
      "MATCH_COMPLETED",
      "Partita completata",
      `La partita #${matchId} è terminata. Puoi ora lasciare le tue valutazioni.`,
      { match_id: matchId }
    );
  }

  revalidatePath(`/match/${matchId}`);
  revalidatePath("/match");
  revalidatePath("/dashboard");
  return { success: "Stato aggiornato" };
};

export const leaveMatch = async (matchId: number) => {
  const user = await currentUser();
  if (!user?.id) return { error: "Non autenticato" };

  const match = await db.match.findUnique({ where: { id: matchId }, select: { status: true } });
  if (!match) return { error: "Partita non trovata" };
  if (match.status !== "SCHEDULED") return { error: "Non puoi abbandonare una partita già iniziata o completata" };

  await db.matchParticipant.deleteMany({
    where: { match_id: matchId, user_id: user.id },
  });

  revalidatePath("/match");
  return { success: "Iscrizione annullata" };
};
