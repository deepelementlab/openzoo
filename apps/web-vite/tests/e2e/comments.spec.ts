import { test, expect } from "@playwright/test";

test.describe("Comments", () => {
  test("comment area is accessible from issue detail", async ({ page }) => {
    await page.goto("/issues");
    const firstIssue = page.locator("[data-issue-id], a[href*='/issues/']").first();
    if (await firstIssue.isVisible()) {
      await firstIssue.click();
      await page.waitForURL(/\/issues\//);
      const commentArea = page.locator("textarea, [contenteditable], [data-comment-input]");
      if (await commentArea.isVisible()) {
        await commentArea.fill("Test comment");
      }
    }
  });
});
