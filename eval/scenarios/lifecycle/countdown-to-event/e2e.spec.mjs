import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the countdown-to-event scenario.
 *
 * page.clock.install() + page.clock.setSystemTime() freeze the wall clock so
 * the agent's target date is always in the future when we load the page.
 * page.clock.runFor(ms) advances time, triggering setInterval ticks and
 * letting us jump past the event deadline deterministically.
 *
 * Key assertions:
 *   1. The countdown display is visible and contains numeric time parts.
 *   2. Advancing the clock causes the countdown to decrease.
 *   3. After the clock passes the event time, the end message appears.
 *   4. No negative values are shown after expiry.
 */

test.describe("countdown-to-event scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-countdown-to-event-${workerInfo.project.metadata.agentId}`,
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

	test("countdown display is visible and contains numeric time parts", async ({
		page,
	}) => {
		await page.clock.install();
		// Set system time to a fixed past moment so the target date is in the future.
		await page.clock.setSystemTime(new Date("2024-01-01T00:00:00Z"));

		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		await expect(block).toBeVisible();

		// The countdown region must contain at least one numeric digit.
		const countdownEl = block.locator(
			"[data-countdown], .countdown, [aria-live], time",
		).first();

		await expect
			.poll(
				async () => {
					const count = await countdownEl.count();
					if (count > 0) {
						const text = await countdownEl.textContent();
						return /\d/.test(text ?? "");
					}
					// Fallback: check the whole block for numbers.
					const blockText = await block.textContent();
					return /\d/.test(blockText ?? "");
				},
				{ timeout: 5000 },
			)
			.toBe(true);
	});

	test("countdown decreases as time advances", async ({ page }) => {
		await page.clock.install();
		await page.clock.setSystemTime(new Date("2024-01-01T00:00:00Z"));

		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		await expect(block).toBeVisible();

		// Capture an early snapshot of the countdown text.
		const before = await block.textContent();

		// Advance the clock by 10 seconds — the interval must have fired.
		await page.clock.runFor(10_000);

		const after = await block.textContent();

		// The countdown text must differ (time has moved).
		expect(after).not.toBe(before);
	});

	test("end message appears when countdown reaches zero", async ({ page }) => {
		// Place the fake clock just 3 seconds before the agent's target date.
		// We don't know the exact target, so we jump far into the future past
		// any reasonable event date.
		await page.clock.install();
		await page.clock.setSystemTime(new Date("2024-01-01T00:00:00Z"));

		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		await expect(block).toBeVisible();

		// Jump far past any reasonable event deadline (10 years should suffice).
		await page.clock.runFor(10 * 365 * 24 * 60 * 60 * 1000);

		// An end message must appear — something like "started", "arrived",
		// "here", "done", or similar. No negative numbers should be visible.
		await expect
			.poll(
				async () => {
					const text = (await block.textContent()) ?? "";
					const hasEndMessage =
						/started|arrived|here|done|over|now|event/i.test(text);
					const hasNegative = /-\d/.test(text);
					return hasEndMessage && !hasNegative;
				},
				{ timeout: 5000 },
			)
			.toBe(true);
	});

	test("no negative values shown after expiry", async ({ page }) => {
		await page.clock.install();
		await page.clock.setSystemTime(new Date("2024-01-01T00:00:00Z"));

		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		await expect(block).toBeVisible();

		// Jump past expiry.
		await page.clock.runFor(10 * 365 * 24 * 60 * 60 * 1000);

		const text = (await block.textContent()) ?? "";
		// No negative numbers should appear in the rendered output.
		expect(/-\d/.test(text)).toBe(false);
	});
});
