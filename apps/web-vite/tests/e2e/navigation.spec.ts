import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("sidebar navigation links are visible", async ({ page }) => {
    const sidebar = page.locator("nav, [data-sidebar]");
    await expect(sidebar).toBeVisible();
  });

  test("navigating to issues page", async ({ page }) => {
    await page.click('a[href="/issues"]');
    await expect(page).toHaveURL(/\/issues/);
  });

  test("navigating to agents page", async ({ page }) => {
    await page.click('a[href="/agents"]');
    await expect(page).toHaveURL(/\/agents/);
  });

  test("navigating to settings page", async ({ page }) => {
    await page.click('a[href="/settings"]');
    await expect(page).toHaveURL(/\/settings/);
  });
});
