// @ts-check
import { test, expect } from "@playwright/test";

/**
 * E2E tests for the toggle-visibility scenario.
 */

const POST_URL = "/test-toggle/";

test.describe("toggle-panel block", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(POST_URL);
    await page.waitForSelector("[data-wp-interactive]");
  });

  test("panel is hidden by default", async ({ page }) => {
    const panel = page.locator("[data-wp-bind--hidden]");
    await expect(panel).toBeHidden();
  });

  test("clicking the toggle button shows the panel", async ({ page }) => {
    const panel = page.locator("[data-wp-bind--hidden]");
    const toggleBtn = page.getByRole("button", { name: /toggle/i });

    await toggleBtn.click();
    await expect(panel).toBeVisible();
  });

  test("clicking the toggle button twice hides the panel again", async ({
    page,
  }) => {
    const panel = page.locator("[data-wp-bind--hidden]");
    const toggleBtn = page.getByRole("button", { name: /toggle/i });

    await toggleBtn.click();
    await expect(panel).toBeVisible();

    await toggleBtn.click();
    await expect(panel).toBeHidden();
  });
});
