import {db} from "@/lib/db";
import {Match} from ".prisma/client";

export const getMatches = async (): Promise<Match[]> => {
    return db.match.findMany();
};

export const getMatchById = async (id: number): Promise<any> => {
    return  db.match.findFirst({
        select: {
            id: true,
            date: true,
            mvp_id: true,
            Game: {
                select: {
                    game_number: true,
                    team1_id: true,
                    team2_id: true,
                    Team1: {
                        select: {
                            name: true,
                        },
                    },
                    Team2: {
                        select: {
                            name: true,
                        },
                    },
                    GameDetail: {
                        select: {
                            event_type: true,
                            team_id: true,
                            player_id: true,

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


