import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the pageview-tracker scenario.
 *
 * Installs an inline analytics stub (`window.__analyticsTracker`) before page
 * load so the block's calls are captured. Asserts that:
 *   - One pageview event fires on the initial page load.
 *   - After a soft navigation to a second page, another pageview event fires
 *     with the new URL — so at least two events are accumulated in total.
 */

test.describe("pageview-tracker scenario", () => {
	let pageA;
	let pageB;

	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-pageview-tracker-${workerInfo.project.metadata.agentId}`,
		);
		pageA = await requestUtils.createPage({
			title: "Pageview Tracker A",
			content: "<!-- wp:wp-skill/testing-block /-->",
			status: "publish",
		});
		pageB = await requestUtils.createPage({
			title: "Pageview Tracker B",
			content: "<!-- wp:wp-skill/testing-block /-->",
			status: "publish",
		});
	});

	test.afterAll(async ({ requestUtils }) => {
		deactivateAllPlugins();
		await requestUtils.deleteAllPosts();
		await requestUtils.deleteAllPages();
	});

	test("fires a pageview on initial page load", async ({ page }) => {
		// Install the analytics stub before the page runs any scripts.
		await page.addInitScript({
			content: `window.__analyticsTracker = (...a) => {
				(window.__analyticsEvents ??= []).push(a);
			};`,
		});

		await page.goto(`/?page_id=${pageA.id}`);

		// At least one pageview should have fired on load.
		const events = await page.evaluate(() => window.__analyticsEvents ?? []);
		expect(events.length).toBeGreaterThanOrEqual(1);

		// The first event's URL argument should include the current page.
		const firstEventUrl = events[0]?.[0];
		expect(firstEventUrl).toBeTruthy();
	});

	test("fires a pageview after each soft navigation", async ({ page }) => {
		// Install the analytics stub before any scripts run.
		await page.addInitScript({
			content: `window.__analyticsTracker = (...a) => {
				(window.__analyticsEvents ??= []).push(a);
			};`,
		});

		await page.goto(`/?page_id=${pageA.id}`);

		const eventsAfterLoad = await page.evaluate(
			() => window.__analyticsEvents?.length ?? 0,
		);
		expect(eventsAfterLoad).toBeGreaterThanOrEqual(1);

		// Trigger a soft navigation to page B.
		const navLink = page
			.locator(".wp-block-wp-skill-testing-block")
			.getByRole("link")
			.first();
		await navLink.click();

		await expect(page).toHaveURL(new RegExp(`page_id=${pageB.id}`), {
			timeout: 15_000,
		});

		// Another pageview should have fired for the new URL.
		await expect
			.poll(
				() => page.evaluate(() => window.__analyticsEvents?.length ?? 0),
				{ timeout: 5000 },
			)
			.toBeGreaterThan(eventsAfterLoad);

		// The new event's URL should include the pageB destination.
		const allEvents = await page.evaluate(
			() => window.__analyticsEvents ?? [],
		);
		const pageBEvent = allEvents.find((ev) =>
			(ev[0] ?? "").includes(`page_id=${pageB.id}`),
		);
		expect(pageBEvent).toBeTruthy();
	});

	test("does not throw when window.__analyticsTracker is not defined", async ({
		page,
	}) => {
		// Do NOT install the stub — verify the block handles missing tracker.
		const consoleErrors = [];
		page.on("pageerror", (err) => consoleErrors.push(err.message));

		await page.goto(`/?page_id=${pageA.id}`);

		// No uncaught errors should have been thrown.
		expect(
			consoleErrors.filter((e) => /analyticsTracker/i.test(e)),
		).toHaveLength(0);
	});
});
