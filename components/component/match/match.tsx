import {Card, CardContent, CardHeader} from "@/components/ui/card";
import MatchHeader from "@/components/component/match/match-header";
import MatchScore from "@/components/component/match/match-score";
import MatchDetailTable from "@/components/component/match/match-detail-table";
import {Match} from ".prisma/client";
import GameInfo from "@/components/component/gameInfo/game-info";


export default function MatchComponent({match} : {match: any}){
    console.log(match)
    const games = match.Game.map((el :any)=> <GameInfo key={el.id} game={el}/>)
    return (
        <Card className="w-full max-w-3xl">
            <CardHeader>
                <MatchHeader/>
            </CardHeader>
            <CardContent>
                {games}
            </CardContent>
        </Card>
    )
}