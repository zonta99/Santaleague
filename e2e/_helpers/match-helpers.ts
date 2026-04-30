import { PrismaClient, MatchStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as dotenv from "dotenv";
import type { Page } from "@playwright/test";

dotenv.config({ path: ".env.test" });

const adapter = new PrismaPg({ connectionString: process.env.POSTGRES_PRISMA_URL! });
export const prismaHelper = new PrismaClient({ adapter });

export const LEAGUE_SLUG = "santaleague-roma";
export const ADMIN_EMAIL = "marco.rossi@test.com";
export const ADMIN_PASSWORD = "password123";
export const PLAYWRIGHT_EMAIL = "playwright@test.local";
export const PLAYWRIGHT_PASSWORD = "TestPassword123!";

export async function getLeague() {
  return prismaHelper.league.findUniqueOrThrow({ where: { slug: LEAGUE_SLUG } });
}

export async function findMatchByStatus(status: MatchStatus) {
  const league = await getLeague();
  return prismaHelper.match.findFirstOrThrow({
    where: { league_id: league.id, status },
    orderBy: { id: "asc" },
    select: { id: true },
  });
}

/** Login via the credentials form and set the active-league cookie. */
export async function loginAndSetLeague(page: Page, email: string, password: string) {
  const league = await getLeague();

  await page.goto("/auth/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/(dashboard|onboarding|leagues)/, { timeout: 15000 });

  await page.context().addCookies([
    {
      name: "active-league",
      value: JSON.stringify({ leagueId: league.id }),
      domain: "localhost",
      path: "/",
    },
  ]);
}
