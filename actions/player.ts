"use server";

import { getHeadToHead } from "@/data/stats";

export async function getHeadToHeadAction(userId: string, opponentId: string, leagueId: string) {
  return getHeadToHead(userId, opponentId, leagueId);
}
