import { PrismaClient, GameEventType } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.POSTGRES_PRISMA_URL! });
const prisma = new PrismaClient({ adapter });

const fakeUsers = [
  { name: "Marco Rossi", email: "marco.rossi@test.com" },
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

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

async function seedPastMatch(
  users: { id: string }[],
  locationId: number,
  date: Date,
  gamesCount: number
) {
  const shuffled = shuffle(users);
  const half = Math.floor(shuffled.length / 2);
  const team1Users = shuffled.slice(0, half);
  const team2Users = shuffled.slice(half);

  const match = await prisma.match.create({
    data: {
      date,
      status: "COMPLETED",
      match_type: "normal",
      location_id: locationId,
    },
  });

  await prisma.matchParticipant.createMany({
    data: users.map((u) => ({ match_id: match.id, user_id: u.id })),
    skipDuplicates: true,
  });

  const team1 = await prisma.team.create({
    data: { name: `${date.toLocaleDateString("it-IT")} - Bianchi`, team_type: null },
  });
  const team2 = await prisma.team.create({
    data: { name: `${date.toLocaleDateString("it-IT")} - Neri`, team_type: null },
  });

  await prisma.draftPick.createMany({
    data: [
      ...team1Users.map((u, i) => ({ match_id: match.id, team_id: team1.id, user_id: u.id, pick_order: i })),
      ...team2Users.map((u, i) => ({ match_id: match.id, team_id: team2.id, user_id: u.id, pick_order: i })),
    ],
  });

  for (let g = 1; g <= gamesCount; g++) {
    const mvpUser = pick([...team1Users, ...team2Users]);
    const game = await prisma.game.create({
      data: {
        match_id: match.id,
        game_number: g,
        status: "COMPLETED",
        team1_id: team1.id,
        team2_id: team2.id,
        mvp_id: mvpUser.id,
      },
    });

    // Generate random events
    const events: { event_type: GameEventType; player_id: string; team_id: number; minute: number }[] = [];

    let team1Goals = 0;
    let team2Goals = 0;

    const addEvents = (teamUsers: typeof team1Users, teamId: number) => {
      const goals = Math.floor(Math.random() * 4);
      if (teamId === team1.id) team1Goals = goals;
      else team2Goals = goals;
      for (let i = 0; i < goals; i++) {
        events.push({ event_type: "Goal", player_id: pick(teamUsers).id, team_id: teamId, minute: Math.floor(Math.random() * 40) + 1 });
      }
    };

    addEvents(team1Users, team1.id);
    addEvents(team2Users, team2.id);

    const winnerTeamId = team1Goals > team2Goals ? team1.id : team1Goals < team2Goals ? team2.id : null;

    await prisma.game.update({
      where: { id: game.id },
      data: { winner_team_id: winnerTeamId },
    });

    await prisma.gameDetail.createMany({
      data: events.map((e) => ({ ...e, game_id: game.id })),
    });
  }

  return match;
}

async function seedLevelFormula() {
  const existing = await prisma.levelFormula.findFirst();
  if (!existing) {
    await prisma.levelFormula.create({
      data: { field_weight: 0.5, win_weight: 0.3, goal_weight: 0.2 },
    });
    console.log("✅ LevelFormula seeded");
  }
}

async function main() {
  console.log("🌱 Seeding database...");
  await seedLevelFormula();

  const password = await bcrypt.hash("password123", 10);

  const users = await Promise.all(
    fakeUsers.map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: { ...u, password, emailVerified: new Date() },
      })
    )
  );
  console.log(`✅ Created/updated ${users.length} users`);

  const location = await prisma.location.upsert({
    where: { name: "Campo Sportivo Test" },
    update: {},
    create: { name: "Campo Sportivo Test", description: "Campo usato per i test" },
  });

  const location2 = await prisma.location.upsert({
    where: { name: "Palestra Comunale" },
    update: {},
    create: { name: "Palestra Comunale", description: "Secondo campo" },
  });
  console.log(`✅ Locations: ${location.name}, ${location2.name}`);

  // 5 past completed matches
  const pastDates = [60, 45, 30, 20, 10];
  const locations = [location, location2, location, location2, location];
  const gameCounts = [3, 4, 3, 4, 3];

  for (let i = 0; i < pastDates.length; i++) {
    const m = await seedPastMatch(users, locations[i].id, daysAgo(pastDates[i]), gameCounts[i]);
    console.log(`✅ Past match #${m.id} — ${daysAgo(pastDates[i]).toLocaleDateString("it-IT")} (${gameCounts[i]} games)`);
  }

  // 1 upcoming scheduled match
  const nextDate = daysAgo(-7);
  const nextMatch = await prisma.match.create({
    data: {
      date: nextDate,
      status: "SCHEDULED",
      match_type: "normal",
      location_id: location.id,
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
  console.log(`✅ Upcoming match #${nextMatch.id} (${nextDate.toLocaleDateString("it-IT")})`);

  console.log("\n📋 Login di test:");
  console.log("   Email: marco.rossi@test.com");
  console.log("   Password: password123");
  console.log(`\n🔗 Draft: /match/${nextMatch.id}/draft`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
