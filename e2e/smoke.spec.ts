import { test, expect } from "@playwright/test";

/**
 * Smoke E2E test — validates the app loads correctly.
 */
test("should redirect root to dashboard or login", async ({ page }) => {
  await page.goto("/");

  // Should redirect somewhere (login or dashboard)
  await expect(page).not.toHaveURL("/", { timeout: 5000 });
});
