import { notFound } from "next/navigation";
import { getMatchById } from "@/data/match";
import { ScoreboardClient } from "../_components/scoreboard-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ScoreboardPage({ params }: Props) {
  const { id } = await params;
  const matchId = parseInt(id, 10);
  if (isNaN(matchId)) notFound();

  const match = await getMatchById(matchId);
  if (!match) notFound();

  return <ScoreboardClient match={match} />;
}
