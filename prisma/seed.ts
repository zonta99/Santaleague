import { PrismaClient, GameEventType, RatingRole } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.POSTGRES_PRISMA_URL! });
const prisma = new PrismaClient({ adapter });

const fakeUsers = [
  { name: "Marco Rossi", email: "marco.rossi@test.com", role: "ADMIN" as const },
  { name: "Luca Ferrari", email: "luca.ferrari@test.com" },
  { name: "Alessandro Bianchi", email: "ale.bianchi@test.com" },
  { name: "Davide Esposito", email: "davide.esposito@test.com" },
  { name: "Matteo Ricci", email: "matteo.ricci@test.com" },
  { name: "Simone Conti", email: "simone.conti@test.com" },
  { name: "Federico Gallo", email: "federico.gallo@test.com" },
  { name: "Andrea Marini", email: "andrea.marini@test.com" },
  { name: "Gabriele Costa", email: "gabriele.costa@test.com" },
  { name: "Lorenzo Fontana", email: "lorenzo.fontana@test.com" },
  { name: "Nicola Bruno", email: "nicola.bruno@test.com" },
  { name: "Stefano Greco", email: "stefano.greco@test.com" },
  { name: "Riccardo Lombardi", email: "riccardo.lombardi@test.com" },
  { name: "Claudio Barbieri", email: "claudio.barbieri@test.com" },
];

function deterministicScore(index: number, min: number, max: number): number {
  const val = ((index * 2654435761) >>> 0) % (max - min + 1);
  return min + val;
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function cleanDatabase() {
  console.log("🧹 Cleaning database...");
  await prisma.gameDetail.deleteMany();
  await prisma.game.deleteMany();
  await prisma.matchRating.deleteMany();
  await prisma.draftPick.deleteMany();
  await prisma.matchParticipant.deleteMany();
  await prisma.match.deleteMany();
  await prisma.team.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.notificationPreferences.deleteMany();
  await prisma.season.deleteMany();
  await prisma.leagueMember.deleteMany();
  await prisma.league.deleteMany();
  await prisma.twoFactorConfirmation.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.location.deleteMany();
  await prisma.$executeRawUnsafe(`DELETE FROM level_formula`);
  console.log("✅ Database cleaned");
}

async function seedPastMatch(
  users: { id: string }[],
  locationId: number,
  date: Date,
  gamesCount: number,
  seasonId: number,
  matchIndex: number
) {
  const half = Math.floor(users.length / 2);
  const team1Users = users.slice(0, half);
  const team2Users = users.slice(half);

  const match = await prisma.match.create({
    data: {
      date,
      status: "COMPLETED",
      format: "NORMALE",
      location_id: locationId,
      season_id: seasonId,
      draft_locked: true,
      rating_open: true,
      rating_opened_at: date,
      num_teams: 2,
      players_per_team: 7,
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

async function seedOngoingMatch(users: { id: string }[], locationId: number, seasonId: number) {
  const half = Math.floor(users.length / 2);
  const team1Users = users.slice(0, half);
  const team2Users = users.slice(half);

  const match = await prisma.match.create({
    data: {
      date: new Date(),
      status: "ONGOING",
      format: "NORMALE",
      location_id: locationId,
      season_id: seasonId,
      draft_locked: true,
      rating_open: false,
      num_teams: 2,
      players_per_team: 7,
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
  console.log("🌱 Seeding database...");
  await cleanDatabase();

  // League
  const league = await prisma.league.create({
    data: {
      name: "Santaleague Roma",
      slug: "santaleague-roma",
      description: "Lega principale di test",
    },
  });
  console.log(`✅ League created: ${league.name}`);

  // Users
  const password = await bcrypt.hash("password123", 10);
  const users = await Promise.all(
    fakeUsers.map((u) =>
      prisma.user.create({
        data: {
          name: u.name,
          email: u.email,
          password,
          emailVerified: new Date(),
          role: u.role ?? "USER",
        },
      })
    )
  );
  console.log(`✅ ${users.length} users created`);

  // LeagueMembers
  await prisma.leagueMember.createMany({
    data: users.map((u, i) => ({
      league_id: league.id,
      user_id: u.id,
      role: i === 0 ? "OWNER" : i === 1 ? "MANAGER" : "MEMBER",
    })),
  });
  console.log("✅ LeagueMembers seeded");

  // NotificationPreferences
  await prisma.notificationPreferences.createMany({
    data: users.map((u) => ({
      user_id: u.id,
      match_scheduled: true,
      match_started: true,
      draft_picked: true,
      match_completed: true,
      admin_announcement: true,
      email_enabled: true,
    })),
  });
  console.log("✅ NotificationPreferences seeded");

  // LevelFormula
  await prisma.levelFormula.create({
    data: {
      field_weight: 0.5,
      win_weight: 0.3,
      goal_weight: 0.2,
      league_id: league.id,
    },
  });
  console.log("✅ LevelFormula seeded");

  // Locations
  const location1 = await prisma.location.create({
    data: { name: "Campo Sportivo Test", description: "Campo usato per i test", league_id: league.id },
  });
  const location2 = await prisma.location.create({
    data: { name: "Palestra Comunale", description: "Secondo campo", league_id: league.id },
  });
  console.log("✅ Locations seeded");

  // Seasons
  const season1 = await prisma.season.create({
    data: {
      name: "2024/2025",
      start_date: new Date("2024-09-01"),
      end_date: new Date("2025-06-30"),
      status: "COMPLETED",
      league_id: league.id,
    },
  });
  const season2 = await prisma.season.create({
    data: {
      name: "2025/2026",
      start_date: new Date("2025-09-01"),
      end_date: new Date("2026-06-30"),
      status: "ACTIVE",
      league_id: league.id,
    },
  });
  console.log("✅ Seasons seeded");

  // Past matches (Season 1)
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
    const m = await seedPastMatch(users, cfg.location.id, date, cfg.games, season1.id, i);
    console.log(`✅ Past match #${m.id} — ${date.toLocaleDateString("it-IT")} (${cfg.games} games + ratings)`);
  }

  // Season 1 champion
  const season1Goals = await prisma.gameDetail.findMany({
    where: {
      event_type: "Goal",
      player_id: { not: null },
      Game: { Match: { season_id: season1.id, status: "COMPLETED" } },
    },
    select: { player_id: true },
  });
  const season1Games = await prisma.game.findMany({
    where: { status: "COMPLETED", Match: { season_id: season1.id } },
    select: {
      winner_team_id: true,
      Match: { select: { DraftPick: { select: { user_id: true, team_id: true } } } },
    },
  });
  const s1GoalMap = new Map<string, number>();
  for (const d of season1Goals) {
    if (d.player_id) s1GoalMap.set(d.player_id, (s1GoalMap.get(d.player_id) ?? 0) + 1);
  }
  const s1WinMap = new Map<string, number>();
  for (const g of season1Games) {
    for (const pick of g.Match.DraftPick) {
      if (g.winner_team_id !== null && pick.team_id === g.winner_team_id)
        s1WinMap.set(pick.user_id, (s1WinMap.get(pick.user_id) ?? 0) + 1);
    }
  }
  const allPlayerIds = new Set([...Array.from(s1GoalMap.keys()), ...Array.from(s1WinMap.keys())]);
  let season1ChampionId = users[0].id;
  let season1TopPoints = -1;
  for (const uid of Array.from(allPlayerIds)) {
    const pts = (s1GoalMap.get(uid) ?? 0) * 3 + (s1WinMap.get(uid) ?? 0);
    if (pts > season1TopPoints) { season1TopPoints = pts; season1ChampionId = uid; }
  }
  await prisma.season.update({
    where: { id: season1.id },
    data: { champion_id: season1ChampionId },
  });

  // Ongoing match (Season 2)
  await seedOngoingMatch(users, location1.id, season2.id);

  // Future scheduled match (Season 2)
  const futureDate = daysAgo(-7);
  const nextMatch = await prisma.match.create({
    data: {
      date: futureDate,
      status: "SCHEDULED",
      format: "NORMALE",
      location_id: location2.id,
      season_id: season2.id,
      draft_locked: false,
      rating_open: false,
      num_teams: 2,
      players_per_team: 7,
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

  // Badges
  const badgeTopScorer = await prisma.badge.create({
    data: { key: "top_scorer", name: "Top Scorer", description: "Miglior marcatore della stagione", icon: "⚽", type: "CAREER", league_id: league.id },
  });
  const badgeMvp = await prisma.badge.create({
    data: { key: "mvp_match", name: "MVP", description: "MVP del match", icon: "🏆", type: "SEASON", league_id: league.id },
  });
  const badgeFirstWin = await prisma.badge.create({
    data: { key: "first_win", name: "Prima Vittoria", description: "Prima vittoria in assoluto", icon: "🥇", type: "CAREER", league_id: league.id },
  });

  await prisma.userBadge.createMany({
    data: [
      { user_id: users[0].id, badge_id: badgeTopScorer.id },
      { user_id: users[0].id, badge_id: badgeMvp.id, season_id: season1.id },
      { user_id: users[1].id, badge_id: badgeFirstWin.id },
      { user_id: users[2].id, badge_id: badgeMvp.id, season_id: season1.id },
    ],
  });
  console.log("✅ Badges seeded");

  console.log("\n📋 Test credentials:");
  console.log("   Admin/Owner → marco.rossi@test.com / password123");
  console.log("   Manager     → luca.ferrari@test.com / password123");
  console.log("   Player      → ale.bianchi@test.com / password123");
  console.log(`\n🔗 League slug: ${league.slug} (id: ${league.id})`);
  console.log(`🔗 Draft: /match/${nextMatch.id}`);
  console.log("🎯 Leaderboard, ratings, badges: all populated");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
