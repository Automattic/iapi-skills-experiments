import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the live-char-counter scenario.
 *
 * A text field emits an input event on every keystroke; the handler updates
 * a count display and sets an over-limit flag when the count exceeds 280.
 * Tests verify the count updates per keystroke and the flag appears/disappears
 * correctly.
 */

test.describe("live-char-counter scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-live-char-counter-${workerInfo.project.metadata.agentId}`,
		);
		post = await requestUtils.createPost({
			content: "<!-- wp:wp-skill/testing-block /-->",
			status: "publish",
		});
	});

	test.afterAll(async ({ requestUtils }) => {
		deactivateAllPlugins();
		await requestUtils.deleteAllPosts();
	});

	test("counter starts at 0 / 280 on load", async ({ page }) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");

		// The counter should start at zero characters used.
		const counter = block.locator("[data-wp-text]").first();
		await expect(counter).toContainText("0");
		await expect(counter).toContainText("280");
	});

	test("counter updates with each character typed", async ({ page }) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const input = block.locator("input[type='text'], textarea").first();
		const counter = block.locator("[data-wp-text]").first();

		// Type a short string and verify the count reflects it.
		await input.fill("Hello");
		await expect(counter).toContainText("5");

		await input.fill("Hello, world!");
		await expect(counter).toContainText("13");
	});

	test("no over-limit indicator when under the limit", async ({ page }) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const input = block.locator("input[type='text'], textarea").first();

		// Type exactly 10 characters — well within the 280 limit.
		await input.fill("1234567890");

		// No over-limit class or message should be present.
		const overLimitEl = block.locator(
			".is-over-limit, .over-limit, [data-over-limit='true']",
		);
		const overMessage = block.getByText(/over|too long|limit exceeded/i);
		const overCount = await overLimitEl.count();
		const overMsgCount = await overMessage.count();
		expect(overCount + overMsgCount).toBe(0);
	});

	test("over-limit indicator appears when character count exceeds 280", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const input = block.locator("input[type='text'], textarea").first();

		// Fill with 281 characters to exceed the limit.
		const longText = "a".repeat(281);
		await input.fill(longText);

		// Counter should reflect 281 characters.
		const counter = block.locator("[data-wp-text]").first();
		await expect(counter).toContainText("281");

		// An over-limit indicator must be present — check class or warning element.
		const hasOverLimit = await page.evaluate(() => {
			const block = document.querySelector(
				".wp-block-wp-skill-testing-block",
			);
			// Look for a class-based or element-based over-limit indicator.
			return (
				block.querySelector(".is-over-limit, .over-limit") !== null ||
				block.querySelector("[data-over-limit='true']") !== null ||
				block.querySelector("[data-wp-class--is-over-limit]") !== null ||
				/over|limit/i.test(block.textContent)
			);
		});
		expect(hasOverLimit).toBe(true);
	});

	test("over-limit indicator clears when count drops back to 280 or below", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const input = block.locator("input[type='text'], textarea").first();

		// Go over the limit.
		await input.fill("a".repeat(285));

		// Come back under.
		await input.fill("a".repeat(280));

		const counter = block.locator("[data-wp-text]").first();
		await expect(counter).toContainText("280");

		// Over-limit indicator must be absent.
		const isStillOver = await page.evaluate(() => {
			const block = document.querySelector(
				".wp-block-wp-skill-testing-block",
			);
			return (
				block.querySelector(".is-over-limit, .over-limit") !== null ||
				block.querySelector("[data-over-limit='true']") !== null
			);
		});
		expect(isStillOver).toBe(false);
	});
});
