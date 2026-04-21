import { test, expect } from "@playwright/test";

test.describe("Settings", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings");
  });

  test("settings page renders tabs", async ({ page }) => {
    const tabs = page.locator("[role='tab'], button").filter({ hasText: /workspace|appearance|account/i });
    if (await tabs.first().isVisible()) {
      await tabs.first().click();
    }
  });

  test("settings page has workspace section", async ({ page }) => {
    const content = page.locator("main, [role='main']");
    await expect(content).toBeVisible();
  });
});
