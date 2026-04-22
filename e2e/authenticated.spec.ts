import { test, expect } from "@playwright/test";

const TEST_EMAIL = "playwright@test.local";
const TEST_PASSWORD = "TestPassword123!";

async function loginAs(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto("/auth/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/(dashboard|onboarding|leagues)/, { timeout: 10000 });
}

test.describe("Dashboard (autenticato)", () => {
  test("accesso alla dashboard dopo login", async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD);
    await page.goto("/dashboard");
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });

  test("navigazione a match page", async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD);
    await page.goto("/match");
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });

  test("navigazione a leaderboard", async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD);
    await page.goto("/leaderboard");
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });

  test("navigazione a settings", async ({ page }) => {
    await loginAs(page, TEST_EMAIL, TEST_PASSWORD);
    await page.goto("/settings");
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });
});
