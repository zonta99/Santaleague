import {db} from "@/lib/db";


export const getMatchById = async (id: number): Promise<any> => {
    return  db.match.findFirst({
        select: {
            id: true,
            date: true,
            mvp_id: true,
            Game: {
                select: {
                    id: true,
                    game_number: true,
                    team1_id: true,
                    team2_id: true,
                    Team1: {
                        select: {
                            name: true,
                            logo: true,
                        },
                    },
                    Team2: {
                        select: {
                            name: true,
                            logo: true,
                        },
                    },
                    GameDetail: {
                        select: {
                            event_type: true,
                            team_id: true,
                            player_id: true,
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




