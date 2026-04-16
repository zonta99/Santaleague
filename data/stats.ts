import { db } from "@/lib/db";
import { GameEventType } from "@prisma/client";

export const getUserStats = async (userId: string) => {
  const [
    matchesPlayed,
    goals,
    assists,
    yellowCards,
    redCards,
    nextMatch,
  ] = await Promise.all([
    db.matchParticipant.count({ where: { user_id: userId } }),
    db.gameDetail.count({ where: { player_id: userId, event_type: GameEventType.Goal } }),
    db.gameDetail.count({ where: { player_id: userId, event_type: GameEventType.Assist } }),
    db.gameDetail.count({ where: { player_id: userId, event_type: GameEventType.YellowCard } }),
    db.gameDetail.count({ where: { player_id: userId, event_type: GameEventType.RedCard } }),
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

  return { matchesPlayed, goals, assists, yellowCards, redCards, nextMatch };
};
