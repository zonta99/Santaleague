import { PrismaClient, GameEventType, RatingRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.POSTGRES_PRISMA_URL! });
const prisma = new PrismaClient({ adapter });

const LEAGUE_SLUG = "santaleague-roma";

function deterministicScore(index: number, min: number, max: number): number {
  const val = ((index * 2654435761) >>> 0) % (max - min + 1);
  return min + val;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function cleanMatches(leagueId: number) {
  console.log(`🧹 Cleaning matches for league ${leagueId}...`);
  const matches = await prisma.match.findMany({
    where: { Season: { league_id: leagueId } },
    select: { id: true },
  });
  const matchIds = matches.map((m) => m.id);
  if (matchIds.length === 0) {
    console.log("ℹ️  No existing matches to clean");
    return;
  }

  const teamIds = (
    await prisma.draftPick.findMany({
      where: { match_id: { in: matchIds } },
      select: { team_id: true },
      distinct: ["team_id"],
    })
  ).map((t) => t.team_id);

  await prisma.gameDetail.deleteMany({ where: { Game: { match_id: { in: matchIds } } } });
  await prisma.game.deleteMany({ where: { match_id: { in: matchIds } } });
  await prisma.matchRating.deleteMany({ where: { match_id: { in: matchIds } } });
  await prisma.draftPick.deleteMany({ where: { match_id: { in: matchIds } } });
  await prisma.matchParticipant.deleteMany({ where: { match_id: { in: matchIds } } });
  await prisma.match.deleteMany({ where: { id: { in: matchIds } } });
  if (teamIds.length > 0) {
    await prisma.team.deleteMany({ where: { id: { in: teamIds } } });
  }
  console.log(`✅ Removed ${matchIds.length} matches`);
}

async function seedPastMatch(
  users: { id: string }[],
  locationId: number,
  date: Date,
  gamesCount: number,
  seasonId: number,
  matchIndex: number,
  leagueId: string
) {
  const half = Math.floor(users.length / 2);
  const team1Users = users.slice(0, half);
  const team2Users = users.slice(half);

  const match = await prisma.match.create({
    data: {
      date,
      status: "COMPLETED",
      match_type: "normal",
      location_id: locationId,
      season_id: seasonId,
      league_id: leagueId,
      draft_locked: true,
      rating_open: true,
      rating_opened_at: date,
      num_teams: 2,
      players_per_team: Math.max(team1Users.length, team2Users.length),
    },
  });

  await prisma.matchParticipant.createMany({
    data: users.map((u) => ({ match_id: match.id, user_id: u.id })),
    skipDuplicates: true,
  });

  const team1 = await prisma.team.create({
    data: { name: `Match ${matchIndex + 1} - Bianchi`, team_type: null },
  });
  const team2 = await prisma.team.create({
    data: { name: `Match ${matchIndex + 1} - Neri`, team_type: null },
  });

  await prisma.draftPick.createMany({
    data: [
      ...team1Users.map((u, i) => ({ match_id: match.id, team_id: team1.id, user_id: u.id, pick_order: i })),
      ...team2Users.map((u, i) => ({ match_id: match.id, team_id: team2.id, user_id: u.id, pick_order: i })),
    ],
  });

  const goalCounts: Record<string, number> = {};

  for (let g = 1; g <= gamesCount; g++) {
    const events: { event_type: GameEventType; player_id: string; team_id: number; minute: number }[] = [];
    let team1Goals = 0;
    let team2Goals = 0;

    const addGoals = (teamUsers: typeof team1Users, teamId: number, baseIndex: number) => {
      const goals = deterministicScore(matchIndex * 100 + g * 10 + baseIndex, 0, 3);
      if (teamId === team1.id) team1Goals = goals;
      else team2Goals = goals;
      for (let i = 0; i < goals; i++) {
        const scorerIdx = deterministicScore(matchIndex * 200 + g * 20 + baseIndex * 5 + i, 0, teamUsers.length - 1);
        const scorer = teamUsers[scorerIdx];
        goalCounts[scorer.id] = (goalCounts[scorer.id] ?? 0) + 1;
        events.push({
          event_type: "Goal" as GameEventType,
          player_id: scorer.id,
          team_id: teamId,
          minute: deterministicScore(matchIndex * 300 + g * 30 + i, 1, 40),
        });
      }
    };

    addGoals(team1Users, team1.id, 1);
    addGoals(team2Users, team2.id, 2);

    const winnerTeamId = team1Goals > team2Goals ? team1.id : team1Goals < team2Goals ? team2.id : null;
    const mvpIdx = deterministicScore(matchIndex * 50 + g, 0, users.length - 1);

    const game = await prisma.game.create({
      data: {
        match_id: match.id,
        game_number: g,
        status: "COMPLETED",
        team1_id: team1.id,
        team2_id: team2.id,
        winner_team_id: winnerTeamId,
        mvp_id: users[mvpIdx].id,
      },
    });

    await prisma.gameDetail.createMany({
      data: events.map((e) => ({ ...e, game_id: game.id })),
    });
  }

  const topScorer = Object.entries(goalCounts).sort((a, b) => b[1] - a[1])[0];
  const overallMvpId = topScorer ? topScorer[0] : users[0].id;

  await prisma.match.update({
    where: { id: match.id },
    data: { mvp_id: overallMvpId },
  });

  const allPlayerIds = users.map((u) => u.id);
  const ratingData: {
    match_id: number;
    rater_id: string;
    rated_player_id: string;
    score: number;
    role: RatingRole;
  }[] = [];

  let ratingIndex = 0;
  for (const rater of allPlayerIds) {
    for (const rated of allPlayerIds) {
      if (rater === rated) continue;
      ratingData.push({
        match_id: match.id,
        rater_id: rater,
        rated_player_id: rated,
        score: deterministicScore(matchIndex * 10000 + ratingIndex++, 3, 5),
        role: "FIELD",
      });
      ratingData.push({
        match_id: match.id,
        rater_id: rater,
        rated_player_id: rated,
        score: deterministicScore(matchIndex * 10000 + ratingIndex++, 2, 5),
        role: "GOALKEEPER",
      });
    }
  }

  await prisma.matchRating.createMany({ data: ratingData, skipDuplicates: true });
  return match;
}

async function seedOngoingMatch(users: { id: string }[], locationId: number, seasonId: number, leagueId: string) {
  const half = Math.floor(users.length / 2);
  const team1Users = users.slice(0, half);
  const team2Users = users.slice(half);

  const match = await prisma.match.create({
    data: {
      date: new Date(),
      status: "ONGOING",
      match_type: "normal",
      location_id: locationId,
      season_id: seasonId,
      league_id: leagueId,
      draft_locked: true,
      rating_open: false,
      num_teams: 2,
      players_per_team: Math.max(team1Users.length, team2Users.length),
    },
  });

  await prisma.matchParticipant.createMany({
    data: users.map((u) => ({ match_id: match.id, user_id: u.id })),
    skipDuplicates: true,
  });

  const team1 = await prisma.team.create({ data: { name: "Ongoing - Bianchi", team_type: null } });
  const team2 = await prisma.team.create({ data: { name: "Ongoing - Neri", team_type: null } });

  await prisma.draftPick.createMany({
    data: [
      ...team1Users.map((u, i) => ({ match_id: match.id, team_id: team1.id, user_id: u.id, pick_order: i })),
      ...team2Users.map((u, i) => ({ match_id: match.id, team_id: team2.id, user_id: u.id, pick_order: i })),
    ],
  });

  await prisma.teamMember.createMany({
    data: [
      ...team1Users.map((u) => ({ team_id: team1.id, user_id: u.id })),
      ...team2Users.map((u) => ({ team_id: team2.id, user_id: u.id })),
    ],
    skipDuplicates: true,
  });

  await prisma.game.create({
    data: {
      match_id: match.id, game_number: 1, status: "COMPLETED",
      team1_id: team1.id, team2_id: team2.id,
      winner_team_id: team1.id, mvp_id: team1Users[0].id,
    },
  });
  await prisma.game.create({
    data: { match_id: match.id, game_number: 2, status: "ONGOING", team1_id: team1.id, team2_id: team2.id },
  });
  await prisma.game.create({
    data: { match_id: match.id, game_number: 3, status: "SCHEDULED", team1_id: team1.id, team2_id: team2.id },
  });

  console.log(`✅ Ongoing match #${match.id}`);
  return match;
}

async function main() {
  console.log(`🌱 Seeding matches for league "${LEAGUE_SLUG}"...`);

  const league = await prisma.league.findUnique({ where: { slug: LEAGUE_SLUG } });
  if (!league) throw new Error(`League "${LEAGUE_SLUG}" not found. Run the main seed first.`);

  const members = await prisma.leagueMember.findMany({
    where: { league_id: league.id },
    include: { User: { select: { id: true, name: true } } },
    orderBy: { joined_at: "asc" },
  });
  const users = members.map((m) => ({ id: m.User.id }));
  if (users.length < 4) throw new Error(`League has only ${users.length} members; need at least 4.`);
  console.log(`✅ Using ${users.length} league members`);

  const locations = await prisma.location.findMany({ where: { league_id: league.id }, orderBy: { id: "asc" } });
  if (locations.length === 0) throw new Error("League has no locations.");
  const location1 = locations[0];
  const location2 = locations[1] ?? locations[0];
  console.log(`✅ Using locations: ${locations.map((l) => l.name).join(", ")}`);

  const seasons = await prisma.season.findMany({
    where: { league_id: league.id },
    orderBy: { start_date: "asc" },
  });
  if (seasons.length === 0) throw new Error("League has no seasons.");
  const completedSeason = seasons.find((s) => s.status === "COMPLETED") ?? seasons[0];
  const activeSeason = seasons.find((s) => s.status === "ACTIVE") ?? seasons[seasons.length - 1];
  console.log(`✅ Past matches → "${completedSeason.name}", live/upcoming → "${activeSeason.name}"`);

  await cleanMatches(league.id);

  const pastConfig = [
    { days: 60, location: location1, games: 3 },
    { days: 45, location: location2, games: 4 },
    { days: 30, location: location1, games: 3 },
    { days: 20, location: location2, games: 4 },
    { days: 10, location: location1, games: 3 },
  ];

  for (let i = 0; i < pastConfig.length; i++) {
    const cfg = pastConfig[i];
    const date = daysAgo(cfg.days);
    const m = await seedPastMatch(users, cfg.location.id, date, cfg.games, completedSeason.id, i, league.id);
    console.log(`✅ Past match #${m.id} — ${date.toLocaleDateString("it-IT")} (${cfg.games} games + ratings)`);
  }

  // Recompute champion of completed season
  const seasonGoals = await prisma.gameDetail.findMany({
    where: {
      event_type: "Goal",
      player_id: { not: null },
      Game: { Match: { season_id: completedSeason.id, status: "COMPLETED" } },
    },
    select: { player_id: true },
  });
  const seasonGames = await prisma.game.findMany({
    where: { status: "COMPLETED", Match: { season_id: completedSeason.id } },
    select: {
      winner_team_id: true,
      Match: { select: { DraftPick: { select: { user_id: true, team_id: true } } } },
    },
  });
  const goalMap = new Map<string, number>();
  for (const d of seasonGoals) if (d.player_id) goalMap.set(d.player_id, (goalMap.get(d.player_id) ?? 0) + 1);
  const winMap = new Map<string, number>();
  for (const g of seasonGames) {
    for (const pick of g.Match.DraftPick) {
      if (g.winner_team_id !== null && pick.team_id === g.winner_team_id)
        winMap.set(pick.user_id, (winMap.get(pick.user_id) ?? 0) + 1);
    }
  }
  const allIds = new Set([...goalMap.keys(), ...winMap.keys()]);
  let championId = users[0].id;
  let topPoints = -1;
  for (const uid of allIds) {
    const pts = (goalMap.get(uid) ?? 0) * 3 + (winMap.get(uid) ?? 0);
    if (pts > topPoints) { topPoints = pts; championId = uid; }
  }
  await prisma.season.update({ where: { id: completedSeason.id }, data: { champion_id: championId } });

  await seedOngoingMatch(users, location1.id, activeSeason.id, league.id);

  const futureDate = daysAgo(-7);
  const nextMatch = await prisma.match.create({
    data: {
      date: futureDate,
      status: "SCHEDULED",
      match_type: "normal",
      location_id: location2.id,
      season_id: activeSeason.id,
      league_id: league.id,
      draft_locked: false,
      rating_open: false,
      num_teams: 2,
      players_per_team: Math.max(1, Math.ceil(users.length / 2) + 2),
      Game: {
        create: [
          { game_number: 1, status: "SCHEDULED" },
          { game_number: 2, status: "SCHEDULED" },
          { game_number: 3, status: "SCHEDULED" },
        ],
      },
    },
  });
  await prisma.matchParticipant.createMany({
    data: users.map((u) => ({ match_id: nextMatch.id, user_id: u.id })),
    skipDuplicates: true,
  });
  console.log(`✅ Upcoming match #${nextMatch.id} (${futureDate.toLocaleDateString("it-IT")})`);

  console.log(`\n🔗 League: ${league.name} (${league.slug})`);
  console.log(`🔗 Draft: /match/${nextMatch.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
