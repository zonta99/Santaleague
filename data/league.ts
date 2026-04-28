import { db } from "@/lib/db";

export const getLeagueById = async (id: string) => {
  return db.league.findUnique({ where: { id } });
};

export const getLeagueBySlug = async (slug: string) => {
  return db.league.findUnique({ where: { slug } });
};

export const getUserLeagues = async (userId: string) => {
  return db.leagueMember.findMany({
    where: { user_id: userId },
    include: { League: true },
    orderBy: { joined_at: "asc" },
  });
};

export const getLeagueMember = async (leagueId: string, userId: string) => {
  return db.leagueMember.findUnique({
    where: { league_id_user_id: { league_id: leagueId, user_id: userId } },
  });
};

export const getLeagueMembers = async (leagueId: string) => {
  return db.leagueMember.findMany({
    where: { league_id: leagueId },
    include: { User: true },
    orderBy: { joined_at: "asc" },
  });
};

export const getLeagueByPublicToken = async (token: string) => {
  return db.league.findUnique({ where: { public_invite_token: token } });
};

export const getPendingJoinRequests = async (leagueId: string) => {
  return db.leagueJoinRequest.findMany({
    where: { league_id: leagueId, status: "PENDING" },
    include: { User: { select: { id: true, name: true, email: true, image: true } } },
    orderBy: { created_at: "asc" },
  });
};
