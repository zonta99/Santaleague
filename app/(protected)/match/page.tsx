
import {getMatchById} from "@/data/match"
import MatchComponent from "@/components/component/match/match";
import {Match} from ".prisma/client";





const MatchPage = async () => {
    const match :Match= await getMatchById(3)
    console.log('match',match)

    return(
        <></>
    )


}

export default MatchPage;