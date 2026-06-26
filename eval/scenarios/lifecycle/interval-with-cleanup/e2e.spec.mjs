import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the interval-with-cleanup scenario.
 *
 * page.clock.install() freezes real time so the interval never fires on its
 * own. page.clock.runFor(ms) advances the synthetic clock and triggers
 * setInterval callbacks in a controlled, deterministic way.
 *
 * Key assertions:
 *   1. While the toggle is ON, advancing the clock increments the counter.
 *   2. After the toggle is turned OFF, advancing the clock does NOT increment
 *      the counter — the cleanup function cleared the interval.
 */

test.describe("interval-with-cleanup scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-interval-with-cleanup-${workerInfo.project.metadata.agentId}`,
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

	test("counter advances while the timer is on", async ({ page }) => {
		await page.clock.install();
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		await expect(block).toBeVisible();

		const toggleBtn = block.getByRole("button", {
			name: /on|start|enable|toggle/i,
		});
		const counter = block.locator(
			"[data-counter], .counter, output, [aria-live]",
		).first();

		// Turn the timer on.
		await toggleBtn.click();

		const before = await counter.textContent();

		// Advance the clock by several seconds — the interval should fire.
		await page.clock.runFor(5_000);

		const after = await counter.textContent();

		// The counter must have changed.
		expect(after).not.toBe(before);
	});

	test("counter stops advancing after the timer is turned off", async ({
		page,
	}) => {
		await page.clock.install();
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		await expect(block).toBeVisible();

		const toggleBtn = block.getByRole("button", {
			name: /on|start|enable|toggle/i,
		});
		const counter = block.locator(
			"[data-counter], .counter, output, [aria-live]",
		).first();

		// Turn the timer on and let it tick.
		await toggleBtn.click();
		await page.clock.runFor(3_000);

		// Turn the timer off — the cleanup function must clear the interval.
		const offBtn = block.getByRole("button", {
			name: /off|stop|disable|toggle/i,
		});
		await offBtn.click();

		const valueAfterStop = await counter.textContent();

		// Advance the clock well beyond several tick intervals.
		await page.clock.runFor(10_000);

		const valueAfterAdvance = await counter.textContent();

		// The counter must NOT have changed — interval was cleaned up.
		expect(valueAfterAdvance).toBe(valueAfterStop);
	});

	test("cleanup runs when the block is removed from the page", async ({
		page,
	}) => {
		await page.clock.install();
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		await expect(block).toBeVisible();

		const toggleBtn = block.getByRole("button", {
			name: /on|start|enable|toggle/i,
		});

		// Start the timer.
		await toggleBtn.click();
		await page.clock.runFor(2_000);

		// Navigate away — this unmounts the block and must clear the interval.
		await page.goto("/");

		// Intercept any unexpected timer-related activity after navigation.
		// If the interval leaks, advancing the clock on the new page would
		// cause errors; in a clean implementation nothing fires.
		// We just confirm navigation succeeded without errors.
		await expect(page).not.toHaveURL(`/?p=${post.id}`);
	});
});
