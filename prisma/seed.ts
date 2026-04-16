import { PrismaClient } from "@prisma/client";
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

async function main() {
  console.log("🌱 Seeding database...");

  const password = await bcrypt.hash("password123", 10);

  // Create fake users
  const users = await Promise.all(
    fakeUsers.map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: {},
        create: { ...u, password, emailVerified: new Date() },
      })
    )
  );
  console.log(`✅ Created ${users.length} users`);

  // Create a test location
  const location = await prisma.location.upsert({
    where: { name: "Campo Sportivo Test" },
    update: {},
    create: { name: "Campo Sportivo Test", description: "Campo usato per i test" },
  });
  console.log(`✅ Location: ${location.name}`);

  // Create a SCHEDULED match in the near future
  const matchDate = new Date();
  matchDate.setDate(matchDate.getDate() + 7);

  const match = await prisma.match.create({
    data: {
      date: matchDate,
      status: "SCHEDULED",
      match_type: "normal",
      location_id: location.id,
      Game: {
        create: [
          { game_number: 1, status: "SCHEDULED" },
          { game_number: 2, status: "SCHEDULED" },
        ],
      },
    },
  });
  console.log(`✅ Match #${match.id} created (${matchDate.toLocaleDateString("it-IT")})`);

  // Sign up all fake users for the match
  await prisma.matchParticipant.createMany({
    data: users.map((u) => ({ match_id: match.id, user_id: u.id })),
    skipDuplicates: true,
  });
  console.log(`✅ ${users.length} partecipanti iscritti alla partita`);

  console.log("\n📋 Login di test:");
  console.log("   Email: marco.rossi@test.com");
  console.log("   Password: password123");
  console.log(`\n🔗 Draft: /match/${match.id}/draft`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
