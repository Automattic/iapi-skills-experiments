// @ts-check
import { test, expect } from "@playwright/test";

/**
 * E2E tests for the counter-block scenario.
 */

const POST_URL = "/test-counter/";

test.describe("interactive-counter block", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(POST_URL);
    await page.waitForSelector("[data-wp-interactive]");
  });

  test("renders the initial counter value of 5", async ({ page }) => {
    const counter = page.locator("[data-wp-text]");
    await expect(counter).toHaveText("5");
  });

  test("increments the counter when clicking the increment button", async ({
    page,
  }) => {
    const counter = page.locator("[data-wp-text]");
    const incrementBtn = page.getByRole("button", { name: /increment/i });

    await incrementBtn.click();
    await expect(counter).toHaveText("6");

    await incrementBtn.click();
    await expect(counter).toHaveText("7");
  });

  test("decrements the counter when clicking the decrement button", async ({
    page,
  }) => {
    const counter = page.locator("[data-wp-text]");
    const decrementBtn = page.getByRole("button", { name: /decrement/i });

    await decrementBtn.click();
    await expect(counter).toHaveText("4");
  });

  test("supports both increment and decrement in sequence", async ({
    page,
  }) => {
    const counter = page.locator("[data-wp-text]");
    const incrementBtn = page.getByRole("button", { name: /increment/i });
    const decrementBtn = page.getByRole("button", { name: /decrement/i });

    await incrementBtn.click();
    await incrementBtn.click();
    await decrementBtn.click();
    await expect(counter).toHaveText("6");
  });
});
