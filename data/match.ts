import { db } from "@/lib/db";

export const getAllMatches = async () => {
  return db.match.findMany({
    orderBy: { date: "desc" },
    select: {
      id: true,
      date: true,
      status: true,
      match_type: true,
      Location: { select: { name: true } },
      _count: { select: { Game: true, MatchParticipant: true } },
    },
  });
};

export const getMatchParticipants = async (matchId: number) => {
  return db.matchParticipant.findMany({
    where: { match_id: matchId },
    select: {
      user_id: true,
      joined_at: true,
      User: { select: { name: true, image: true } },
    },
  });
};

export const getRecentMatches = async (take = 3) => {
  return db.match.findMany({
    orderBy: { date: "desc" },
    take,
    select: {
      id: true,
      date: true,
      status: true,
      Location: { select: { name: true } },
      _count: { select: { Game: true } },
    },
  });
};


export const getMatchById = async (id: number): Promise<any> => {
    return  db.match.findFirst({
        select: {
            id: true,
            date: true,
            status: true,
            match_type: true,
            mvp_id: true,
            DraftPick: {
                select: {
                    user_id: true,
                    team_id: true,
                    User: { select: { id: true, name: true, image: true } },
                    Team: { select: { TeamMember: { select: { user_id: true, is_captain: true } } } },
                },
            },
            Game: {
                select: {
                    id: true,
                    game_number: true,
                    team1_id: true,
                    team2_id: true,
                    Team1: {
                        select: {
                            id: true,
                            name: true,
                            logo: true,
                        },
                    },
                    Team2: {
                        select: {
                            id: true,
                            name: true,
                            logo: true,
                        },
                    },
                    GameDetail: {
                        orderBy: { minute: "asc" },
                        select: {
                            id: true,
                            event_type: true,
                            team_id: true,
                            player_id: true,
                            minute: true,
                            User: {
                                select: {
                                    name: true,
                                    image: true,
                                },
                            },
                            Team: {
                                select: {
                                    name: true,
                                    logo: true,
                                }
                            },
                        },
                    },
                },
            },
        },
        where: {
            id: id,
        },
    });
};




