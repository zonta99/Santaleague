import { test, expect } from "@playwright/test";
import { findMatchByStatus, prismaHelper, LEAGUE_SLUG } from "./_helpers/match-helpers";

test.describe("Join / leave a scheduled match", () => {
  let matchId: number;

  test.beforeAll(async () => {
    const m = await findMatchByStatus("SCHEDULED");
    matchId = m.id;
  });

  test.afterAll(async () => {
    await prismaHelper.$disconnect();
  });

  test("join a scheduled match", async ({ page }) => {
    await page.goto("/match");
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page).not.toHaveURL(/\/leagues/);

    // Open the scheduled match detail
    await page.goto(`/match/${matchId}`);
    await expect(page).toHaveURL(`/match/${matchId}`);

    // The join button should be visible
    const joinBtn = page.getByRole("button", { name: /partecipa/i });
    await expect(joinBtn).toBeVisible({ timeout: 8000 });

    const participantTextBefore = page.getByText(/iscritti/i).first();
    const countBefore = parseInt((await participantTextBefore.textContent() ?? "0 iscritti").match(/(\d+)/)?.[1] ?? "0");

    await joinBtn.click();

    // After joining the button text changes to "Annulla iscrizione"
    await expect(page.getByRole("button", { name: /annulla iscrizione/i })).toBeVisible({ timeout: 8000 });

    // Participant count should have gone up
    await page.reload();
    const participantTextAfter = page.getByText(/iscritti/i).first();
    const countAfter = parseInt((await participantTextAfter.textContent() ?? "0 iscritti").match(/(\d+)/)?.[1] ?? "0");
    expect(countAfter).toBeGreaterThan(countBefore);
  });

  test("leave a scheduled match after joining", async ({ page }) => {
    // Ensure we are already joined (idempotent: join first)
    await page.goto(`/match/${matchId}`);

    const joinBtn = page.getByRole("button", { name: /partecipa/i });
    const leaveBtn = page.getByRole("button", { name: /annulla iscrizione/i });

    // If not yet joined, join first
    if (await joinBtn.isVisible()) {
      await joinBtn.click();
      await expect(leaveBtn).toBeVisible({ timeout: 8000 });
    }

    await leaveBtn.click();
    await expect(page.getByRole("button", { name: /partecipa/i })).toBeVisible({ timeout: 8000 });
  });
});
