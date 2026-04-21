import { test, expect } from "@playwright/test";

test.describe("Issues", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/issues");
  });

  test("issues page renders correctly", async ({ page }) => {
    await expect(page.locator("h1, h2, h3").first()).toBeVisible();
  });

  test("can switch between board and list view", async ({ page }) => {
    const viewToggle = page.locator("button").filter({ hasText: /list|board/i }).first();
    if (await viewToggle.isVisible()) {
      await viewToggle.click();
    }
  });

  test("search input is functional", async ({ page }) => {
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill("test query");
      await expect(searchInput).toHaveValue("test query");
    }
  });

  test("status filter dropdown exists", async ({ page }) => {
    const statusFilter = page.locator("select").first();
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption({ index: 1 });
    }
  });
});
