import { db } from "@/lib/db";

/** Returns games where rating window is open and the user participated but hasn't rated all teammates yet. */
export const getPendingRatingGames = async (userId: string) => {
  const openGames = await db.game.findMany({
    where: {
      rating_open: true,
      Match: {
        DraftPick: { some: { user_id: userId } },
      },
    },
    select: {
      id: true,
      match_id: true,
      game_number: true,
      rating_opened_at: true,
      Match: {
        select: {
          id: true,
          date: true,
          DraftPick: { select: { user_id: true } },
        },
      },
      GameRating: {
        where: { rater_id: userId },
        select: { rated_player_id: true, role: true },
      },
    },
  });

  return openGames.filter((game) => {
    // Check 48h window
    if (game.rating_opened_at) {
      const diff = Date.now() - new Date(game.rating_opened_at).getTime();
      if (diff > 48 * 60 * 60 * 1000) return false;
    }

    const allPlayers = game.Match.DraftPick.map((d) => d.user_id).filter((id) => id !== userId);
    // Each player needs both FIELD and GOALKEEPER ratings
    return allPlayers.some((id) => {
      const given = game.GameRating.filter((r) => r.rated_player_id === id);
      return !given.some((r) => r.role === "FIELD") || !given.some((r) => r.role === "GOALKEEPER");
    });
  });
};

/** Returns avg field and GK ratings for a player, optionally scoped to a season. */
export const getPlayerRatingStats = async (userId: string, seasonId?: number) => {
  const matchFilter = seasonId ? { season_id: seasonId } : undefined;

  const ratings = await db.gameRating.findMany({
    where: {
      rated_player_id: userId,
      Game: { Match: matchFilter ? { ...matchFilter } : undefined },
    },
    select: { score: true, role: true },
  });

  const field = ratings.filter((r) => r.role === "FIELD");
  const gk = ratings.filter((r) => r.role === "GOALKEEPER");

  return {
    avgFieldRating: field.length ? field.reduce((s, r) => s + r.score, 0) / field.length : null,
    avgGkRating: gk.length ? gk.reduce((s, r) => s + r.score, 0) / gk.length : null,
    totalRatings: ratings.length,
  };
};

/** Returns all players in a game with their already-submitted ratings by the current user. */
export const getGameRatingData = async (gameId: number, raterId: string) => {
  const game = await db.game.findUnique({
    where: { id: gameId },
    select: {
      id: true,
      game_number: true,
      rating_open: true,
      rating_opened_at: true,
      match_id: true,
      Match: {
        select: {
          DraftPick: {
            select: {
              user_id: true,
              team_id: true,
              User: { select: { id: true, name: true, image: true } },
              Team: { select: { name: true } },
            },
          },
        },
      },
      GameRating: {
        where: { rater_id: raterId },
        select: { rated_player_id: true, score: true, role: true },
      },
    },
  });

  return game;
};
