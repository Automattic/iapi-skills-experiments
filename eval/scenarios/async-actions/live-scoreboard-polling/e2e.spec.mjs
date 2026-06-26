import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the live-scoreboard-polling scenario.
 *
 * page.clock.install() freezes real time so the polling interval never fires
 * on its own. page.clock.runFor(ms) advances the synthetic clock, triggering
 * setInterval callbacks exactly when expected. The fetch for each poll tick is
 * intercepted with page.route() so responses are deterministic.
 *
 * Two assertions matter most:
 *   1. Advancing the clock causes the displayed score to update.
 *   2. After the block is torn down (navigating away / afterAll cleanup), no
 *      further fetch requests are made — the interval was cleared.
 */

test.describe("live-scoreboard-polling scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-live-scoreboard-polling-${workerInfo.project.metadata.agentId}`,
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

	test("clock-driven poll updates the displayed score", async ({ page }) => {
		let requestCount = 0;

		// First response: initial scores.
		// Subsequent responses: updated scores.
		await page.route("**/*", (route) => {
			const url = route.request().url();
			if (
				(url.includes("score") || url.includes("poll") || url.includes("live")) &&
				!url.includes("wp-json") &&
				!url.includes("wp-admin")
			) {
				requestCount++;
				const score = requestCount === 1 ? "Home 0 — Away 0" : "Home 2 — Away 1";
				route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({
						home: requestCount === 1 ? 0 : 2,
						away: requestCount === 1 ? 0 : 1,
						label: score,
					}),
				});
			} else {
				route.continue();
			}
		});

		// Install synthetic clock before navigation so the interval is under our
		// control from the moment the block initialises.
		await page.clock.install();

		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");

		// Advance the clock enough to fire at least one poll tick (assume the
		// agent uses an interval of ≤ 5 s; 10 s is generous).
		await page.clock.runFor(10_000);

		// After at least one poll, the score must have updated to the second
		// response value.
		await expect(block).toContainText(/home.*2|2.*away|home 2|2.*1/i);

		// At least two fetches must have occurred: the initial load + one poll.
		expect(requestCount).toBeGreaterThanOrEqual(2);
	});

	test("polling stops after the block is removed from the page", async ({
		page,
	}) => {
		let fetchCountAfterNav = 0;

		await page.route("**/*", (route) => {
			const url = route.request().url();
			if (
				(url.includes("score") || url.includes("poll") || url.includes("live")) &&
				!url.includes("wp-json") &&
				!url.includes("wp-admin")
			) {
				route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ home: 0, away: 0 }),
				});
			} else {
				route.continue();
			}
		});

		await page.clock.install();
		await page.goto(`/?p=${post.id}`);

		// Fire the first interval tick.
		await page.clock.runFor(10_000);

		// Navigate away — this unmounts the block, which must clear its interval.
		await page.goto("/");

		// Start counting fetches that happen AFTER the navigation.
		await page.route("**/*", (route) => {
			const url = route.request().url();
			if (
				(url.includes("score") || url.includes("poll") || url.includes("live")) &&
				!url.includes("wp-json") &&
				!url.includes("wp-admin")
			) {
				fetchCountAfterNav++;
				route.continue();
			} else {
				route.continue();
			}
		});

		// Advance the clock well beyond several poll intervals.
		await page.clock.runFor(30_000);

		// If cleanup works, no further fetch should fire.
		expect(fetchCountAfterNav).toBe(0);
	});
});
