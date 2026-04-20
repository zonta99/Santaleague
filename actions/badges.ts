"use server";

import { db } from "@/lib/db";
import { GameEventType } from "@prisma/client";
import { BADGE_DEFINITIONS } from "@/lib/badge-definitions";
import { getLeaderboard, getPlayerLevel } from "@/data/stats";

async function ensureBadgesExist(leagueId: string) {
  for (const def of BADGE_DEFINITIONS) {
    await db.badge.upsert({
      where: { league_id_key: { league_id: leagueId, key: def.key } },
      update: { name: def.name, description: def.description, icon: def.icon },
      create: { ...def, league_id: leagueId },
    });
  }
}

async function awardBadge(userId: string, badgeKey: string, leagueId: string, seasonId?: number) {
  const badge = await db.badge.findUnique({
    where: { league_id_key: { league_id: leagueId, key: badgeKey } },
  });
  if (!badge) return;

  const existing = await db.userBadge.findFirst({
    where: { user_id: userId, badge_id: badge.id, season_id: seasonId ?? null },
  });
  if (existing) return;

  await db.userBadge.create({
    data: { user_id: userId, badge_id: badge.id, season_id: seasonId ?? null },
  });
}

async function getMaxConsecutiveStreak(userId: string, leagueId: string): Promise<number> {
  const allMatches = await db.match.findMany({
    where: { status: "COMPLETED", Season: { league_id: leagueId } },
    select: { id: true },
    orderBy: { date: "asc" },
  });

  const userMatchIds = new Set(
    (
      await db.matchParticipant.findMany({
        where: { user_id: userId },
        select: { match_id: true },
      })
    ).map((p) => p.match_id)
  );

  let maxStreak = 0;
  let streak = 0;
  for (const match of allMatches) {
    if (userMatchIds.has(match.id)) {
      streak++;
      if (streak > maxStreak) maxStreak = streak;
    } else {
      streak = 0;
    }
  }
  return maxStreak;
}

export async function checkCareerBadgesForPlayer(userId: string, leagueId: string) {
  await ensureBadgesExist(leagueId);

  const [totalGoals, totalMatches] = await Promise.all([
    db.gameDetail.count({ where: { player_id: userId, event_type: GameEventType.Goal } }),
    db.matchParticipant.count({ where: { user_id: userId } }),
  ]);

  if (totalGoals >= 1) await awardBadge(userId, "first_goal", leagueId);
  if (totalMatches >= 10) await awardBadge(userId, "matches_10", leagueId);
  if (totalMatches >= 50) await awardBadge(userId, "matches_50", leagueId);
  if (totalMatches >= 100) await awardBadge(userId, "matches_100", leagueId);

  const perfect = await db.matchRating.findFirst({
    where: { rated_player_id: userId, score: 10 },
  });
  if (perfect) await awardBadge(userId, "perfect_10", leagueId);

  const streak = await getMaxConsecutiveStreak(userId, leagueId);
  if (streak >= 5) await awardBadge(userId, "ironman_5", leagueId);
  if (streak >= 10) await awardBadge(userId, "ironman_10", leagueId);
  if (streak >= 20) await awardBadge(userId, "ironman_20", leagueId);
}

export async function checkHatTrickForGame(gameId: number, leagueId: string) {
  await ensureBadgesExist(leagueId);

  const goals = await db.gameDetail.findMany({
    where: { game_id: gameId, event_type: GameEventType.Goal, player_id: { not: null } },
    select: { player_id: true },
  });

  const countByPlayer = new Map<string, number>();
  for (const g of goals) {
    if (!g.player_id) continue;
    countByPlayer.set(g.player_id, (countByPlayer.get(g.player_id) ?? 0) + 1);
  }

  for (const [playerId, count] of Array.from(countByPlayer.entries())) {
    if (count >= 3) await awardBadge(playerId, "hat_trick", leagueId);
  }
}

export async function awardSeasonBadges(seasonId: number, leagueId: string) {
  await ensureBadgesExist(leagueId);

  const leaderboard = await getLeaderboard(leagueId, seasonId);
  if (leaderboard.length === 0) return;

  const champion = leaderboard[0];
  if (champion.user?.id) await awardBadge(champion.user.id, "season_champion", leagueId, seasonId);

  const sorted = [...leaderboard].sort((a, b) => b.goals - a.goals);
  if (sorted[0]?.user?.id && sorted[0].goals > 0) {
    await awardBadge(sorted[0].user.id, "top_scorer", leagueId, seasonId);
  }

  const byWins = [...leaderboard].sort((a, b) => b.wins - a.wins);
  if (byWins[0]?.user?.id && byWins[0].wins > 0) {
    await awardBadge(byWins[0].user.id, "most_wins", leagueId, seasonId);
  }

  const withFieldRating = leaderboard.filter((p) => p.avgFieldRating !== null && p.gamesPlayed >= 5);
  if (withFieldRating.length > 0) {
    const best = withFieldRating.reduce((a, b) =>
      (a.avgFieldRating ?? 0) > (b.avgFieldRating ?? 0) ? a : b
    );
    if (best.user?.id) await awardBadge(best.user.id, "best_field_rating", leagueId, seasonId);
  }

  const withGkRating = leaderboard.filter((p) => p.avgGkRating !== null && p.gamesPlayed >= 5);
  if (withGkRating.length > 0) {
    const best = withGkRating.reduce((a, b) =>
      (a.avgGkRating ?? 0) > (b.avgGkRating ?? 0) ? a : b
    );
    if (best.user?.id) await awardBadge(best.user.id, "best_gk_rating", leagueId, seasonId);
  }

  const prevSeason = await db.season.findFirst({
    where: { status: "COMPLETED", id: { not: seasonId }, league_id: leagueId },
    orderBy: { end_date: "desc" },
  });

  if (prevSeason) {
    const improvements = await Promise.all(
      leaderboard
        .filter((p) => p.user?.id)
        .map(async (p) => {
          const [curr, prev] = await Promise.all([
            getPlayerLevel(p.user.id, leagueId, seasonId),
            getPlayerLevel(p.user.id, leagueId, prevSeason.id),
          ]);
          return { userId: p.user.id, delta: curr.level - prev.level };
        })
    );

    const best = improvements.reduce((a, b) => (a.delta > b.delta ? a : b), improvements[0]);
    if (best && best.delta > 0) await awardBadge(best.userId, "most_improved", leagueId, seasonId);
  }
}
