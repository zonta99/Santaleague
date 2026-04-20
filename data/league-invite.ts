import { db } from "@/lib/db";

export const getLeagueInviteByToken = async (token: string) => {
  return db.leagueInvite.findUnique({
    where: { token },
    include: { League: true },
  });
};

export const getLeagueInviteByEmailAndLeague = async (email: string, leagueId: string) => {
  return db.leagueInvite.findUnique({
    where: { email_league_id: { email, league_id: leagueId } },
  });
};
