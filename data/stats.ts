import { db } from "@/lib/db";
import { GameEventType, RatingRole } from "@prisma/client";

const TIER_LABELS = ["Bronze", "Silver", "Gold", "Platinum", "Legend"] as const;
export type Tier = (typeof TIER_LABELS)[number];

export function getTier(level: number): Tier {
  if (level >= 9) return "Legend";
  if (level >= 7) return "Platinum";
  if (level >= 5) return "Gold";
  if (level >= 3) return "Silver";
  return "Bronze";
}

function computeLevel(params: {
  avgFieldRating: number | null;
  wins: number;
  gamesPlayed: number;
  goals: number;
  weights: { field_weight: number; win_weight: number; goal_weight: number };
}): number {
  if (params.gamesPlayed === 0) return 0;
  const { avgFieldRating, wins, gamesPlayed, goals, weights } = params;
  const ratingPart = (avgFieldRating ?? 0) * weights.field_weight;
  const winPart = (wins / gamesPlayed) * 10 * weights.win_weight;
  const goalPart = (goals / gamesPlayed) * 10 * weights.goal_weight;
  return Math.min(10, Math.max(0, ratingPart + winPart + goalPart));
}

async function getFormulaWeights() {
  const formula = await db.levelFormula.findFirst();
  return {
    field_weight: formula?.field_weight ?? 0.5,
    win_weight: formula?.win_weight ?? 0.3,
    goal_weight: formula?.goal_weight ?? 0.2,
  };
}

export const getPlayerLevel = async (
  userId: string,
  seasonId?: number
): Promise<{ level: number; tier: Tier }> => {
  const matchFilter = seasonId ? { season_id: seasonId } : {};

  const picks = await db.draftPick.findMany({
    where: { user_id: userId, Match: matchFilter },
    select: { match_id: true, team_id: true },
  });

  if (picks.length === 0) return { level: 0, tier: "Bronze" };

  const matchIds = picks.map((p) => p.match_id);
  const teamByMatch = new Map(picks.map((p) => [p.match_id, p.team_id]));

  const [completedGames, goalsCount, ratingAgg, weights] = await Promise.all([
    db.game.findMany({
      where: { match_id: { in: matchIds }, status: "COMPLETED" },
      select: { winner_team_id: true, match_id: true },
    }),
    db.gameDetail.count({
      where: { player_id: userId, event_type: GameEventType.Goal, Game: { Match: matchFilter } },
    }),
    db.gameRating.aggregate({
      where: { rated_player_id: userId, role: RatingRole.FIELD, Game: { Match: matchFilter } },
      _avg: { score: true },
    }),
    getFormulaWeights(),
  ]);

  let wins = 0;
  for (const game of completedGames) {
    const userTeam = teamByMatch.get(game.match_id);
    if (userTeam && game.winner_team_id === userTeam) wins++;
  }

  const level = computeLevel({
    avgFieldRating: ratingAgg._avg.score,
    wins,
    gamesPlayed: completedGames.length,
    goals: goalsCount,
    weights,
  });

  return { level: Math.round(level * 10) / 10, tier: getTier(level) };
};

export const getLeaderboard = async (seasonId?: number) => {
  const matchFilter = seasonId
    ? { status: "COMPLETED" as const, season_id: seasonId }
    : { status: "COMPLETED" as const };

  const details = await db.gameDetail.findMany({
    where: {
      player_id: { not: null },
      event_type: GameEventType.Goal,
      Game: { Match: matchFilter },
    },
    select: {
      player_id: true,
      User: { select: { id: true, name: true, image: true } },
    },
  });

  // Count wins and games_played per player
  const completedGames = await db.game.findMany({
    where: {
      status: "COMPLETED",
      Match: matchFilter,
    },
    select: {
      winner_team_id: true,
      match_id: true,
      Match: {
        select: {
          DraftPick: { select: { user_id: true, team_id: true } },
        },
      },
    },
  });

  const weights = await getFormulaWeights();

  // Fetch avg ratings per player
  const ratings = await db.gameRating.findMany({
    where: { Game: { Match: matchFilter } },
    select: { rated_player_id: true, score: true, role: true },
  });
  const ratingMap = new Map<string, { fieldScores: number[]; gkScores: number[] }>();
  for (const r of ratings) {
    if (!ratingMap.has(r.rated_player_id)) ratingMap.set(r.rated_player_id, { fieldScores: [], gkScores: [] });
    const entry = ratingMap.get(r.rated_player_id)!;
    if (r.role === RatingRole.FIELD) entry.fieldScores.push(r.score);
    else entry.gkScores.push(r.score);
  }

  const mvpCounts = await db.game.groupBy({
    by: ["mvp_id"],
    where: { mvp_id: { not: null }, Match: matchFilter },
    _count: { mvp_id: true },
  });
  const mvpMap = new Map(mvpCounts.map((r) => [r.mvp_id!, r._count.mvp_id]));

  const goalMap = new Map<string, { user: { id: string; name: string | null; image: string | null }; goals: number }>();
  for (const d of details) {
    if (!d.player_id || !d.User) continue;
    if (!goalMap.has(d.player_id)) goalMap.set(d.player_id, { user: d.User, goals: 0 });
    goalMap.get(d.player_id)!.goals++;
  }

  // Build win counts and games_played per user
  const winMap = new Map<string, number>();
  const gamesPlayedMap = new Map<string, number>();
  for (const game of completedGames) {
    for (const pick of game.Match.DraftPick) {
      gamesPlayedMap.set(pick.user_id, (gamesPlayedMap.get(pick.user_id) ?? 0) + 1);
      if (game.winner_team_id !== null && pick.team_id === game.winner_team_id) {
        winMap.set(pick.user_id, (winMap.get(pick.user_id) ?? 0) + 1);
      }
    }
  }

  // Merge: include players with goals or wins
  const allUserIds = new Set([...Array.from(goalMap.keys()), ...Array.from(winMap.keys())]);

  // Fetch users not already in goalMap
  const missingIds = Array.from(allUserIds).filter((id) => !goalMap.has(id));
  if (missingIds.length > 0) {
    const users = await db.user.findMany({
      where: { id: { in: missingIds } },
      select: { id: true, name: true, image: true },
    });
    for (const u of users) goalMap.set(u.id, { user: u, goals: 0 });
  }

  return Array.from(allUserIds.values())
    .map((userId) => {
      const row = goalMap.get(userId)!;
      const wins = winMap.get(userId) ?? 0;
      const goals = row.goals;
      const rEntry = ratingMap.get(userId);
      const avgFieldRating = rEntry?.fieldScores.length
        ? rEntry.fieldScores.reduce((a, b) => a + b, 0) / rEntry.fieldScores.length
        : null;
      const avgGkRating = rEntry?.gkScores.length
        ? rEntry.gkScores.reduce((a, b) => a + b, 0) / rEntry.gkScores.length
        : null;
      const gamesPlayed = gamesPlayedMap.get(userId) ?? 0;
      const levelValue = computeLevel({ avgFieldRating, wins, gamesPlayed, goals, weights });
      const level = Math.round(levelValue * 10) / 10;
      return {
        user: row.user,
        goals,
        wins,
        gamesPlayed,
        mvpCount: mvpMap.get(userId) ?? 0,
        points: goals * 3 + wins,
        avgFieldRating,
        avgGkRating,
        level,
        tier: getTier(levelValue),
      };
    })
    .sort((a, b) => b.points - a.points);
};

export const getPlayerProfile = async (userId: string, seasonId?: number) => {
  const matchFilter = seasonId
    ? { status: "COMPLETED" as const, season_id: seasonId }
    : { status: "COMPLETED" as const };

  const [user, goalDetails, draftHistory] = await Promise.all([
    db.user.findUnique({ where: { id: userId }, select: { id: true, name: true, image: true } }),
    db.gameDetail.findMany({
      where: {
        player_id: userId,
        event_type: GameEventType.Goal,
        Game: { Match: matchFilter },
      },
      select: { event_type: true, Game: { select: { match_id: true } } },
    }),
    db.draftPick.findMany({
      where: { user_id: userId, Match: seasonId ? { season_id: seasonId } : undefined },
      select: {
        team_id: true,
        Match: {
          select: {
            id: true,
            date: true,
            status: true,
            Location: { select: { name: true } },
            Game: {
              select: {
                id: true,
                winner_team_id: true,
                status: true,
                GameDetail: {
                  where: { player_id: userId, event_type: GameEventType.Goal },
                  select: { event_type: true },
                },
                GameRating: {
                  where: { rated_player_id: userId },
                  select: { score: true, role: true },
                },
              },
            },
          },
        },
        Team: { select: { name: true } },
      },
      orderBy: { Match: { date: "desc" } },
    }),
  ]);

  const avg = (scores: number[]) => scores.reduce((a, b) => a + b, 0) / scores.length;

  const matchRows = draftHistory.map(({ Match: m, Team, team_id }) => {
    const goals = m.Game.flatMap((g) => g.GameDetail).length;
    const wins = m.Game.filter(
      (g) => g.status === "COMPLETED" && g.winner_team_id === team_id
    ).length;
    const matchRatings = m.Game.flatMap((g) => g.GameRating);
    const matchFieldScores = matchRatings.filter((r) => r.role === RatingRole.FIELD).map((r) => r.score);
    const matchGkScores = matchRatings.filter((r) => r.role === RatingRole.GOALKEEPER).map((r) => r.score);
    return {
      matchId: m.id,
      date: m.date,
      status: m.status,
      location: m.Location?.name ?? null,
      team: Team.name,
      goals,
      wins,
      points: goals * 3 + wins,
      avgFieldRating: matchFieldScores.length ? Math.round(avg(matchFieldScores) * 10) / 10 : null,
      avgGkRating: matchGkScores.length ? Math.round(avg(matchGkScores) * 10) / 10 : null,
    };
  });

  const goals = goalDetails.length;
  const wins = matchRows.reduce((sum, r) => sum + r.wins, 0);

  // Rating trend: last 10 rated games (oldest first for chart)
  const ratingTrend = draftHistory
    .flatMap(({ Match: m }) =>
      m.Game
        .filter((g) => g.GameRating.length > 0)
        .map((g) => ({
          date: m.date,
          avgRating: Math.round(avg(g.GameRating.map((r) => r.score)) * 10) / 10,
        }))
    )
    .slice(0, 10)
    .reverse();

  const allRatings = draftHistory.flatMap(({ Match: m }) => m.Game.flatMap((g) => g.GameRating));
  const fieldScores = allRatings.filter((r) => r.role === RatingRole.FIELD).map((r) => r.score);
  const gkScores = allRatings.filter((r) => r.role === RatingRole.GOALKEEPER).map((r) => r.score);
  const avgFieldRating = fieldScores.length ? avg(fieldScores) : null;
  const avgGkRating = gkScores.length ? avg(gkScores) : null;

  const { level, tier } = await getPlayerLevel(userId, seasonId);

  return {
    user,
    totals: { goals, wins, points: goals * 3 + wins, avgFieldRating, avgGkRating, level, tier },
    matchRows,
    ratingTrend,
  };
};

export const getHeadToHead = async (userId: string, opponentId: string) => {
  const [userPicks, opponentPicks] = await Promise.all([
    db.draftPick.findMany({ where: { user_id: userId }, select: { match_id: true, team_id: true } }),
    db.draftPick.findMany({ where: { user_id: opponentId }, select: { match_id: true, team_id: true } }),
  ]);

  const userMatchMap = new Map(userPicks.map((p) => [p.match_id, p.team_id]));
  const opponentMatchMap = new Map(opponentPicks.map((p) => [p.match_id, p.team_id]));
  const sharedMatchIds = Array.from(userMatchMap.keys()).filter((id) => opponentMatchMap.has(id));

  if (sharedMatchIds.length === 0) return { total: 0, sameTeam: 0, opposing: 0, userWins: 0 };

  const games = await db.game.findMany({
    where: { match_id: { in: sharedMatchIds }, status: "COMPLETED" },
    select: { match_id: true, winner_team_id: true },
  });

  let sameTeam = 0;
  let opposing = 0;
  let userWins = 0;

  for (const matchId of sharedMatchIds) {
    const userTeam = userMatchMap.get(matchId)!;
    const opponentTeam = opponentMatchMap.get(matchId)!;
    if (userTeam === opponentTeam) {
      sameTeam++;
    } else {
      opposing++;
      const matchGames = games.filter((g) => g.match_id === matchId);
      const winsInMatch = matchGames.filter((g) => g.winner_team_id === userTeam).length;
      if (winsInMatch > 0) userWins++;
    }
  }

  return { total: sharedMatchIds.length, sameTeam, opposing, userWins };
};

export const getAdminDashboardStats = async (seasonId?: number) => {
  const matchFilter = seasonId ? { season_id: seasonId } : {};
  const completedFilter = { ...matchFilter, status: "COMPLETED" as const };

  const [totalPlayers, completedMatches, scheduledMatches, totalMatches, goalsCount, ratingAgg, leaderboard] =
    await Promise.all([
      db.user.count(),
      db.match.count({ where: completedFilter }),
      db.match.count({ where: { ...matchFilter, status: "SCHEDULED" } }),
      db.match.count({ where: matchFilter }),
      db.gameDetail.count({
        where: { event_type: GameEventType.Goal, Game: { Match: completedFilter } },
      }),
      db.gameRating.aggregate({
        where: { Game: { Match: completedFilter } },
        _avg: { score: true },
      }),
      getLeaderboard(seasonId),
    ]);

  return {
    totalPlayers,
    completedMatches,
    scheduledMatches,
    totalMatches,
    avgGoalsPerMatch: completedMatches > 0 ? Math.round((goalsCount / completedMatches) * 10) / 10 : 0,
    avgPlayerRating: ratingAgg._avg.score ? Math.round(ratingAgg._avg.score * 10) / 10 : null,
    topPlayers: leaderboard.slice(0, 5),
  };
};

export const getUserStats = async (userId: string) => {
  const [matchesPlayed, goals, nextMatch] = await Promise.all([
    db.matchParticipant.count({ where: { user_id: userId } }),
    db.gameDetail.count({ where: { player_id: userId, event_type: GameEventType.Goal } }),
    db.match.findFirst({
      where: {
        status: "SCHEDULED",
        MatchParticipant: { some: { user_id: userId } },
      },
      orderBy: { date: "asc" },
      select: {
        id: true,
        date: true,
        Location: { select: { name: true } },
        _count: { select: { MatchParticipant: true } },
      },
    }),
  ]);

  return { matchesPlayed, goals, nextMatch };
};
