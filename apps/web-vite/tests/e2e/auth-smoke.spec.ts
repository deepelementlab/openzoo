import { expect, test } from "@playwright/test";

test("redirects unauthenticated users to login screen", async ({ page }) => {
  await page.goto("/issues");
  await expect(page.getByText("Sign in to OpenZoo")).toBeVisible();
  await expect(page.getByRole("button", { name: "Send Verification Code" })).toBeVisible();
});
