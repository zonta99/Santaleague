'use client';

import {Table, TableBody, TableCell, TableRow} from "@/components/ui/table";
import Image from "next/image";

export function GameScore(team1: any, team2: any) {
    return (
        <div className="flex items-center gap-4">

            <div className="flex items-center gap-2">
                <Image
                    alt={team1.name}
                    className="rounded-full"
                    height="48"
                    src="/placeholder.svg"
                    style={{
                        aspectRatio: "48/48",
                        objectFit: "cover",
                    }}
                    width="48"
                />
                <div>
                    <h3 className="font-medium">{team1.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{team1.name}</p>
                </div>
            </div>
            <div className="border border-gray-200 dark:border-gray-800 rounded-lg w-16 h-10">
                <div className="flex h-full items-center justify-center text-sm font-semibold">1-1</div>
            </div>
            <div className="flex items-center gap-2">
                <Image
                    alt={team2.name}
                    className="rounded-full"
                    height="48"
                    src="/placeholder.svg"
                    style={{
                        aspectRatio: "48/48",
                        objectFit: "cover",
                    }}
                    width="48"
                />
                <div>
                    <h3 className="font-medium">{team2.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{team2.name}</p>
                </div>
            </div>
        </div>
    )
}

export function GameDetailTable() {
    return (
        <div className="mt-4">
            <Table>
                <TableBody>
                    <TableRow>
                        <TableCell className="font-medium">1</TableCell>
                        <TableCell>Goal</TableCell>
                        <TableCell>Cristiano Ronaldo</TableCell>
                        <TableCell>10</TableCell>
                    </TableRow>
                    <TableRow>
                        <TableCell className="font-medium">2</TableCell>
                        <TableCell>Goal</TableCell>
                        <TableCell>Zlatan IbrahimoviÄ</TableCell>
                        <TableCell>25</TableCell>
                    </TableRow>
                </TableBody>
            </Table>
        </div>
    )
}

export default function GameInfo(game: any) {
    console.log(game)
    return (
        <div className="flex flex-col gap-4">
            <GameScore team1={game.Team1} te />
            <GameDetailTable/>
        </div>
    )
}