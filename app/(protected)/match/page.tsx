import {getMatchById} from "@/data/match"
import {User, GameDetail, Game, Team, Match} from "@prisma/client";
import Image from "next/image";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Table, TableBody, TableCell, TableRow} from "@/components/ui/table";

type GameDetailType = GameDetail & {
    id: number
    event_type: string
    player_id: number
    team_id: number
    User: User
    Team: Team
}

type GameType = Game & {
    Team1: Team
    Team2: Team
    GameDetail: GameDetailType[]
}

type MatchType = Match & {
    Game: GameType[]
}

const TeamLogo = ({team}: { team: Team }) => {
    return (
        <Image
            alt={team.name}
            className="rounded-full"
            height="25"
            src={team.logo || 'https://e7.pngegg.com/pngimages/177/345/png-clipart-juventus-logo-juventus-f-c-serie-a-juventus-stadium-football-uefa-champions-league-football-text-sport-thumbnail.png'}
            style={{
                aspectRatio: "1",
                objectFit: "cover",
            }}
            width="25"
        />
    )
}

const GameScore = ({game}: { game: GameType }) => {

    const team1Score = game.GameDetail.filter((el) => el.event_type == 'Goal' && el.team_id === game.team1_id).length
    const team2Score = game.GameDetail.filter((el) => el.event_type == 'Goal' && el.team_id === game.team2_id).length


    return (
        <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
                <Image
                    alt={game.Team1.name}
                    className="rounded-full"
                    height="48"
                    src={game.Team1.logo || '/none.png'}
                    style={{
                        aspectRatio: "48/48",
                        objectFit: "cover",
                    }}
                    width="48"
                />
                <div>
                    <h3 className="font-medium">{game.Team1.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{game.Team1.name}</p>
                </div>
            </div>
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg w-16 h-10">
                <div className="flex h-full items-center justify-center text-sm font-semibold">{
                    `${team1Score} - ${team2Score}`
                }</div>
            </div>
            <div className="flex items-center gap-2">
                <div>
                    <h3 className="font-medium">{game.Team2.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{game.Team2.name}</p>
                </div>
                <Image
                    alt={game.Team2.name}
                    className="rounded-full"
                    height="48"
                    src={game.Team2.logo || '/none.png'}
                    style={{
                        aspectRatio: "48/48",
                        objectFit: "cover",
                    }}
                    width="48"
                />

            </div>
        </div>
    )
}

const GameDetailTable = ({gameDetails}: { gameDetails: GameDetailType[] }) => {

    const detailRows = gameDetails?.map((el: GameDetailType) => (
        <TableRow key={el.id}>
            <TableCell>{el.minute}</TableCell>
            <TableCell>{el.id}</TableCell>
            <TableCell>{el.event_type}</TableCell>
            <TableCell>{el.User.name}</TableCell>
            <TableCell><TeamLogo team={el.Team}/></TableCell>
        </TableRow>
    ))
    return (
        <div className="mt-4">
            <Table>
                <TableBody >
                    {detailRows}
                </TableBody>
            </Table>
        </div>
    )
}

const MatchPage = async () => {
    const match: MatchType = await getMatchById(3)
    const games = match.Game.map((game) => {
        return (
            <div key={game.id}>
                {match.Game.length > 1 && <h2 className="text-xl font-semibold">Game {game.game_number}</h2>}
                <GameScore game={game}/>
                <GameDetailTable gameDetails={game.GameDetail}/>
            </div>
        )
    })

    return (
        <Card className="w-full max-w-3xl">
            <CardHeader>
                <CardHeader>
                    <CardTitle>Partita di clacio</CardTitle>
                    <CardDescription>Game between Juve and Milan</CardDescription>
                </CardHeader>
            </CardHeader>
            <CardContent>
                {games}
            </CardContent>
        </Card>
    )
}

export default MatchPage;