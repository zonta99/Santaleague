import { getMatchById, getMatchParticipants } from "@/data/match";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { User, GameDetail, Game, Team, Match } from "@prisma/client";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { notFound } from "next/navigation";
import { JoinMatchButton } from "../_components/join-match-button";
import { Users } from "lucide-react";

type GameDetailType = GameDetail & {
  id: number;
  event_type: string;
  player_id: number;
  team_id: number;
  User: User;
  Team: Team;
};

type GameType = Game & {
  Team1: Team;
  Team2: Team;
  GameDetail: GameDetailType[];
};

type MatchType = Match & {
  Game: GameType[];
};

const TeamLogo = ({ team }: { team: Team }) => (
  <Image
    alt={team.name}
    className="rounded-full"
    height={25}
    src={team.logo || "https://e7.pngegg.com/pngimages/177/345/png-clipart-juventus-logo-juventus-f-c-serie-a-juventus-stadium-football-uefa-champions-league-football-text-sport-thumbnail.png"}
    style={{ aspectRatio: "1", objectFit: "cover" }}
    width={25}
  />
);

const GameScore = ({ game }: { game: GameType }) => {
  const team1Score = game.GameDetail.filter((el) => el.event_type === "Goal" && el.team_id === game.team1_id).length;
  const team2Score = game.GameDetail.filter((el) => el.event_type === "Goal" && el.team_id === game.team2_id).length;

  return (
    <div className="flex items-center justify-center gap-4 py-2">
      <div className="flex items-center gap-2">
        <Image alt={game.Team1.name} className="rounded-full" height={48} src={game.Team1.logo || "/none.png"} style={{ aspectRatio: "1", objectFit: "cover" }} width={48} />
        <h3 className="font-medium">{game.Team1.name}</h3>
      </div>
      <div className="border border-border rounded-lg w-16 h-10 flex items-center justify-center text-sm font-semibold">
        {team1Score} - {team2Score}
      </div>
      <div className="flex items-center gap-2">
        <h3 className="font-medium">{game.Team2.name}</h3>
        <Image alt={game.Team2.name} className="rounded-full" height={48} src={game.Team2.logo || "/none.png"} style={{ aspectRatio: "1", objectFit: "cover" }} width={48} />
      </div>
    </div>
  );
};

const GameDetailTable = ({ gameDetails }: { gameDetails: GameDetailType[] }) => (
  <div className="mt-4">
    <Table>
      <TableBody>
        {gameDetails.map((el) => (
          <TableRow key={el.id}>
            <TableCell className="text-muted-foreground w-10">{el.minute}'</TableCell>
            <TableCell>{el.event_type}</TableCell>
            <TableCell>{el.User?.name}</TableCell>
            <TableCell><TeamLogo team={el.Team} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

function Avatar({ name, image }: { name: string | null; image: string | null }) {
  const initials = (name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  if (image) {
    return (
      <Image
        src={image}
        alt={name ?? ""}
        width={40}
        height={40}
        className="rounded-full object-cover"
      />
    );
  }

  return (
    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
      {initials}
    </div>
  );
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function MatchDetailPage({ params }: Props) {
  const { id } = await params;
  const matchId = parseInt(id, 10);
  if (isNaN(matchId)) notFound();

  const session = await auth();
  const userId = session?.user?.id;

  const [match, participants] = await Promise.all([
    getMatchById(matchId) as Promise<MatchType | null>,
    getMatchParticipants(matchId),
  ]);

  if (!match) notFound();

  const isJoined = userId
    ? !!(await db.matchParticipant.findUnique({
        where: { match_id_user_id: { match_id: matchId, user_id: userId } },
      }))
    : false;

  const canJoin = match.status === "SCHEDULED";

  return (
    <div className="w-full max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {new Date(match.date).toLocaleDateString("it-IT", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </h1>
          <p className="text-muted-foreground text-sm capitalize">{match.match_type}</p>
        </div>
        {canJoin && <JoinMatchButton matchId={matchId} isJoined={isJoined} />}
      </div>

      {/* Participants */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Partecipanti
            </CardTitle>
            <Badge variant="secondary">{participants.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {participants.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Nessuno iscritto ancora.{" "}
              {canJoin && "Sii il primo a partecipare!"}
            </p>
          ) : (
            <div className="space-y-3">
              {participants.map((p, i) => (
                <div key={p.user_id} className="flex items-center gap-3">
                  <span className="text-muted-foreground text-sm w-5 text-right">{i + 1}</span>
                  <Avatar name={p.User.name} image={p.User.image} />
                  <div>
                    <p className="text-sm font-medium">{p.User.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Iscritto il{" "}
                      {new Date(p.joined_at).toLocaleDateString("it-IT", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Games */}
      {match.Game.map((game) => (
        <Card key={game.id}>
          <CardHeader>
            {match.Game.length > 1 && <CardTitle>Game {game.game_number}</CardTitle>}
            {game.Team1 && game.Team2 && (
              <CardDescription>
                <GameScore game={game} />
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            {game.GameDetail.length > 0 ? (
              <GameDetailTable gameDetails={game.GameDetail} />
            ) : (
              <p className="text-muted-foreground text-sm">Nessun evento registrato.</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
