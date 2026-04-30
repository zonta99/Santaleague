import { test, expect } from "@playwright/test";

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Pagina di registrazione", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/register");
  });

  test("mostra il form di registrazione", async ({ page }) => {
    await expect(page.getByLabel("Name")).toBeVisible();
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Create an account" })).toBeVisible();
  });

  test("mostra errore con email già in uso", async ({ page }) => {
    await page.getByLabel("Name").fill("Test User");
    await page.getByLabel("Email").fill("playwright@test.local");
    await page.getByLabel("Password").fill("TestPassword123!");
    await page.getByRole("button", { name: "Create an account" }).click();

    await expect(page.getByText(/email already in use/i)).toBeVisible({ timeout: 8000 });
  });

  test("mostra errore con password troppo corta", async ({ page }) => {
    await page.getByLabel("Name").fill("Test User");
    await page.getByLabel("Email").fill("newuser@example.com");
    await page.getByLabel("Password").fill("123");
    await page.getByRole("button", { name: "Create an account" }).click();

    await expect(page.locator("form")).toContainText(/minimum|at least|characters/i);
  });

  test("link a login visibile", async ({ page }) => {
    await expect(page.getByText("Already have an account?")).toBeVisible();
  });
});
