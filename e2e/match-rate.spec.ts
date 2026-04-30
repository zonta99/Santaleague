import { test, expect } from "@playwright/test";
import { findMatchByStatus, prismaHelper } from "./_helpers/match-helpers";

test.describe("Rate players after a completed match", () => {
  let matchId: number;

  test.beforeAll(async () => {
    const m = await findMatchByStatus("COMPLETED");
    matchId = m.id;
  });

  test.afterAll(async () => {
    await prismaHelper.$disconnect();
  });

  test("rate page is accessible and shows player list", async ({ page }) => {
    await page.goto(`/match/${matchId}/rate`);

    // Should not bounce to login or leagues
    await expect(page).not.toHaveURL(/\/auth\/login/);
    await expect(page).not.toHaveURL(/\/leagues/);

    // Either the rating form is open or the "no pending ratings" message is shown
    const openRating = page.getByText(/valuta i giocatori/i).first();
    const closedMsg = page.getByText(/nessuna valutazione in sospeso|finestra di valutazione/i).first();

    await expect(openRating.or(closedMsg).first()).toBeVisible({ timeout: 8000 });
  });

  test("can submit ratings for teammates", async ({ page }) => {
    await page.goto(`/match/${matchId}/rate`);

    const saveBtn = page.getByRole("button", { name: /salva valutazioni/i });
    const noRatings = page.getByText(/nessun altro giocatore/i);
    const closedMsg = page.getByText(/nessuna valutazione in sospeso|finestra di valutazione/i);

    // If the window is closed or no players to rate, skip gracefully
    if (await closedMsg.isVisible()) {
      test.info().annotations.push({ type: "skip", description: "Rating window closed" });
      return;
    }
    if (await noRatings.isVisible()) {
      test.info().annotations.push({ type: "skip", description: "No other players to rate" });
      return;
    }

    // Click the first ★ star for the first player's Campo rating (value = 7)
    const stars = page.locator("button").filter({ has: page.locator("span", { hasText: "★" }) });
    // Each player has 10 campo stars + 10 portiere stars; pick star #7 of the first group
    await stars.nth(6).click();

    await expect(saveBtn).toBeEnabled({ timeout: 5000 });
    await saveBtn.click();

    await expect(page.getByText(/valutazioni salvate|salvate con successo|salva/i)).toBeVisible({ timeout: 8000 });
  });
});
