import { headers } from "next/headers";

export async function getActiveLeagueId(): Promise<string | null> {
  return (await headers()).get("x-league-id");
}
