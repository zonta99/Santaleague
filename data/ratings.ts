import { db } from "@/lib/db";

/** Returns matches where rating window is open and the user participated but hasn't rated all teammates yet. */
export const getPendingRatingMatches = async (userId: string) => {
  const openMatches = await db.match.findMany({
    where: {
      rating_open: true,
      DraftPick: { some: { user_id: userId } },
    },
    select: {
      id: true,
      date: true,
      rating_opened_at: true,
      DraftPick: { select: { user_id: true } },
      MatchRating: {
        where: { rater_id: userId },
        select: { rated_player_id: true, role: true },
      },
    },
  });

  return openMatches.filter((match) => {
    if (match.rating_opened_at) {
      const diff = Date.now() - new Date(match.rating_opened_at).getTime();
      if (diff > 48 * 60 * 60 * 1000) return false;
    }

    const allPlayers = match.DraftPick.map((d) => d.user_id).filter((id) => id !== userId);
    return allPlayers.some((id) => {
      const given = match.MatchRating.filter((r) => r.rated_player_id === id);
      return !given.some((r) => r.role === "FIELD") || !given.some((r) => r.role === "GOALKEEPER");
    });
  });
};

/** Returns avg field and GK ratings for a player, optionally scoped to a season. */
export const getPlayerRatingStats = async (userId: string, seasonId?: number) => {
  const ratings = await db.matchRating.findMany({
    where: {
      rated_player_id: userId,
      Match: seasonId ? { season_id: seasonId } : undefined,
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

/** Returns all players in a match with their already-submitted ratings by the current user. */
export const getMatchRatingData = async (matchId: number, raterId: string) => {
  const match = await db.match.findUnique({
    where: { id: matchId },
    select: {
      id: true,
      rating_open: true,
      rating_opened_at: true,
      DraftPick: {
        select: {
          user_id: true,
          team_id: true,
          User: { select: { id: true, name: true, image: true } },
          Team: { select: { name: true } },
        },
      },
      MatchRating: {
        where: { rater_id: raterId },
        select: { rated_player_id: true, score: true, role: true },
      },
    },
  });

  return match;
};
