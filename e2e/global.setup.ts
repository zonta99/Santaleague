import { test as setup, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

const adapter = new PrismaPg({ connectionString: process.env.POSTGRES_PRISMA_URL! });
const prisma = new PrismaClient({ adapter });

const PLAYWRIGHT_EMAIL = "playwright@test.local";
const PLAYWRIGHT_PASSWORD = "TestPassword123!";
const LEAGUE_SLUG = "santaleague-roma";

setup("create test user and set league cookie", async ({ page }) => {
  const hashedPassword = await bcrypt.hash(PLAYWRIGHT_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: PLAYWRIGHT_EMAIL },
    update: { password: hashedPassword, emailVerified: new Date() },
    create: {
      email: PLAYWRIGHT_EMAIL,
      name: "Playwright Test",
      password: hashedPassword,
      emailVerified: new Date(),
    },
  });

  // Ensure the playwright user is a member of the seeded league
  const league = await prisma.league.findUnique({ where: { slug: LEAGUE_SLUG } });
  if (league) {
    await prisma.leagueMember.upsert({
      where: { league_id_user_id: { league_id: league.id, user_id: user.id } },
      update: {},
      create: { league_id: league.id, user_id: user.id, role: "MEMBER" },
    });

    // Also ensure they are a MatchParticipant on the completed matches (for rating tests)
    const completedMatches = await prisma.match.findMany({
      where: { league_id: league.id, status: "COMPLETED" },
      select: { id: true },
    });
    await prisma.matchParticipant.createMany({
      data: completedMatches.map((m) => ({ match_id: m.id, user_id: user.id })),
      skipDuplicates: true,
    });
  }

  await prisma.$disconnect();

  // Log in via the credentials form
  await page.goto("/auth/login");
  await page.getByLabel("Email").fill(PLAYWRIGHT_EMAIL);
  await page.getByLabel("Password").fill(PLAYWRIGHT_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/(dashboard|onboarding|leagues)/, { timeout: 15000 });

  // Set the active-league cookie so protected pages don't redirect to /leagues
  if (league) {
    await page.context().addCookies([
      {
        name: "active-league",
        value: JSON.stringify({ leagueId: league.id }),
        domain: "localhost",
        path: "/",
      },
    ]);
  }

  await page.context().storageState({ path: "e2e/.auth/user.json" });
});
