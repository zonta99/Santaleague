"use server";

import { getHeadToHead } from "@/data/stats";

export async function getHeadToHeadAction(userId: string, opponentId: string) {
  return getHeadToHead(userId, opponentId);
}
