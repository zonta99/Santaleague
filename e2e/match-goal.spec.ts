import { test, expect } from "@playwright/test";
import {
  findMatchByStatus,
  loginAndSetLeague,
  prismaHelper,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
} from "./_helpers/match-helpers";

// Uses a fresh login as admin (not the default storageState) so we get OWNER permissions.
test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Score a goal in an ongoing match (admin)", () => {
  let matchId: number;

  test.beforeAll(async () => {
    const m = await findMatchByStatus("ONGOING");
    matchId = m.id;
  });

  test.afterAll(async () => {
    await prismaHelper.$disconnect();
  });

  test("admin can register a goal event in an ongoing game", async ({ page }) => {
    await loginAndSetLeague(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    await page.goto(`/match/${matchId}`);
    await expect(page).toHaveURL(`/match/${matchId}`);

    // Switch to the "Partite" tab
    const partiteTab = page.getByRole("button", { name: /partite/i });
    await expect(partiteTab).toBeVisible({ timeout: 8000 });
    await partiteTab.click();

    // The event recorder should appear (requires draft picks)
    await expect(page.getByText(/tipo evento/i).first()).toBeVisible({ timeout: 8000 });

    // Select "Gol" event type
    await page.getByRole("button", { name: /gol/i }).first().click();

    // Player chips are full-width buttons (w-full) inside the player grid section
    const firstPlayer = page.locator("button.w-full").first();
    await firstPlayer.click();

    // Set minute
    await page.locator("input[type=number]").first().fill("10");

    // Submit — click the first enabled "Registra evento" button (game 2 is ONGOING)
    await page.getByRole("button", { name: /registra evento/i }).first().click();

    // Toast confirms success
    await expect(page.getByText(/evento registrato/i)).toBeVisible({ timeout: 8000 });

    // The goal should appear in the event log (⚽ icon)
    await expect(page.locator("text=⚽").first()).toBeVisible({ timeout: 8000 });
  });
});
