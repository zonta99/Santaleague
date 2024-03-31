import {NextRequest, NextResponse} from "next/server";
import {getMatchById} from "@/data/match"

export async function GET(req: NextRequest, params: any) {
    const {match_id} = params
    const match = await getMatchById(match_id)
    console.log(match)
    return NextResponse.json({
        match
    })
}