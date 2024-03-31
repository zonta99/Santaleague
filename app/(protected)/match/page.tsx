import {getMatchById} from "@/data/match"
import MatchComponent from "@/components/component/match/match";





const MatchPage = async () => {
    const match = await getMatchById(3)

    return(
        <MatchComponent match={match}/>
    )


}

export default MatchPage;