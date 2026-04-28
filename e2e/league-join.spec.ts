import { test, expect } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import * as dotenv from "dotenv";

dotenv.config();

const adapter = new PrismaPg({ connectionString: process.env.POSTGRES_PRISMA_URL! });
const prisma = new PrismaClient({ adapter });

const GOOGLE_USER_EMAIL = "playwright-google@test.local";
const GOOGLE_USER_PASSWORD = "TestPassword123!";
const LEAGUE_SLUG = "playwright-join-league";
const INVITE_TOKEN = "playwright-invite-token-fixed";

// Real Google OAuth cannot be driven by Playwright (Google blocks automation).
// We simulate a Google-authenticated user by linking a provider="google" Account
// row, then sign in via credentials (password) to drive the UI.
test.beforeAll(async () => {
  const hashedPassword = await bcrypt.hash(GOOGLE_USER_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: GOOGLE_USER_EMAIL },
    update: { password: hashedPassword, emailVerified: new Date() },
    create: {
      email: GOOGLE_USER_EMAIL,
      name: "Playwright Google User",
      password: hashedPassword,
      emailVerified: new Date(),
    },
  });

  const fakeGoogleId = `google-${user.id}`;
  await prisma.account.upsert({
    where: {
      provider_providerAccountId: { provider: "google", providerAccountId: fakeGoogleId },
    },
    update: {},
    create: {
      userId: user.id,
      type: "oauth",
      provider: "google",
      providerAccountId: fakeGoogleId,
    },
  });

  // Owner for the league (separate user, otherwise our joiner would already be a member)
  const owner = await prisma.user.upsert({
    where: { email: "playwright-owner@test.local" },
    update: { emailVerified: new Date() },
    create: {
      email: "playwright-owner@test.local",
      name: "Playwright Owner",
      emailVerified: new Date(),
    },
  });

  const league = await prisma.league.upsert({
    where: { slug: LEAGUE_SLUG },
    update: { public_invite_token: INVITE_TOKEN },
    create: {
      name: "Playwright Join League",
      slug: LEAGUE_SLUG,
      description: "League used by the e2e join flow test",
      public_invite_token: INVITE_TOKEN,
    },
  });

  await prisma.leagueMember.upsert({
    where: { league_id_user_id: { league_id: league.id, user_id: owner.id } },
    update: { role: "OWNER" },
    create: { league_id: league.id, user_id: owner.id, role: "OWNER" },
  });

  // Reset any prior join request from the Google user so the test is idempotent.
  await prisma.leagueJoinRequest.deleteMany({
    where: { league_id: league.id, user_id: user.id },
  });
  await prisma.leagueMember.deleteMany({
    where: { league_id: league.id, user_id: user.id },
  });
});

test.afterAll(async () => {
  await prisma.$disconnect();
});

test.describe("League join via invite link (utente Google)", () => {
  test("richiede di unirsi a una lega tramite public invite token", async ({ page }) => {
    // Login (credentials proxy for the Google-linked account)
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill(GOOGLE_USER_EMAIL);
    await page.getByLabel("Password").fill(GOOGLE_USER_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/(dashboard|onboarding|leagues)/, { timeout: 10000 });

    // Visit the invite link
    await page.goto(`/leagues/join?token=${INVITE_TOKEN}`);
    await expect(page.getByText("Unisciti a Playwright Join League")).toBeVisible();

    // Submit the join request
    await page.getByRole("button", { name: "Richiedi di unirti" }).click();

    // UI confirms the request was sent
    await expect(
      page.locator("p", { hasText: /Richiesta inviata!/i })
    ).toBeVisible({ timeout: 10000 });

    // DB-side assertion: a PENDING JoinRequest exists for this user/league
    const league = await prisma.league.findUniqueOrThrow({ where: { slug: LEAGUE_SLUG } });
    const user = await prisma.user.findUniqueOrThrow({ where: { email: GOOGLE_USER_EMAIL } });
    const joinRequest = await prisma.leagueJoinRequest.findUnique({
      where: { league_id_user_id: { league_id: league.id, user_id: user.id } },
    });
    expect(joinRequest).not.toBeNull();
    expect(joinRequest?.status).toBe("PENDING");
  });

  test("link non valido mostra messaggio di errore", async ({ page }) => {
    await page.goto("/auth/login");
    await page.getByLabel("Email").fill(GOOGLE_USER_EMAIL);
    await page.getByLabel("Password").fill(GOOGLE_USER_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/(dashboard|onboarding|leagues)/, { timeout: 10000 });

    await page.goto("/leagues/join?token=token-inesistente-xyz");
    await expect(page.getByText(/Link non valido/i)).toBeVisible();
  });
});
