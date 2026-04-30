import { test, expect } from "@playwright/test";

test.describe("Dashboard (autenticato)", () => {
  test("accesso alla dashboard dopo login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });

  test("navigazione a match page", async ({ page }) => {
    await page.goto("/match");
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });

  test("navigazione a leaderboard", async ({ page }) => {
    await page.goto("/leaderboard");
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });

  test("navigazione a settings", async ({ page }) => {
    await page.goto("/settings");
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });
});
