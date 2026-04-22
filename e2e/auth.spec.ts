import { test, expect } from "@playwright/test";

const TEST_EMAIL = "playwright@test.local";
const TEST_PASSWORD = "TestPassword123!";

test.describe("Login page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/login");
  });

  test("mostra il form di login", async ({ page }) => {
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.getByLabel("Password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
  });

  test("mostra errore con email inesistente", async ({ page }) => {
    await page.getByLabel("Email").fill("notexists@example.com");
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Email does not exist!")).toBeVisible({ timeout: 8000 });
  });

  test("mostra errore con password errata", async ({ page }) => {
    await page.getByLabel("Email").fill(TEST_EMAIL);
    await page.getByLabel("Password").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page.getByText("Invalid credentials!")).toBeVisible({ timeout: 8000 });
  });

  test("mostra errore di validazione con campi vuoti", async ({ page }) => {
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.locator("form")).toContainText(/invalid|required/i);
  });

  test("login con credenziali corrette e redirect a dashboard", async ({ page }) => {
    await page.getByLabel("Email").fill(TEST_EMAIL);
    await page.getByLabel("Password").fill(TEST_PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();

    await expect(page).toHaveURL(/\/(dashboard|onboarding|leagues)/, { timeout: 10000 });
  });

  test("link a registrazione visibile", async ({ page }) => {
    await expect(page.getByRole("link", { name: /register/i })).toBeVisible();
  });

  test("link forgot password visibile", async ({ page }) => {
    await expect(page.getByRole("link", { name: /forgot password/i })).toBeVisible();
  });
});

test.describe("Rotte protette", () => {
  test("redirect a login se non autenticato", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });
  });

  test("admin redirect a login se non autenticato", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });
  });

  test("match redirect a login se non autenticato", async ({ page }) => {
    await page.goto("/match");
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 5000 });
  });
});
