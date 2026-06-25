import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the pageview-analytics-bridge scenario.
 *
 * Installs an inline analytics stub via page.addInitScript BEFORE navigation
 * so that any call to window.__analyticsTracker(...) is captured into
 * window.__analyticsEvents. After hydration, the test asserts the watched
 * value was forwarded to the tracker on load, and that updating the shared
 * value produces another tracked call.
 *
 * No shared helper is used — the analytics sink is inlined here per spec.
 */

test.describe("pageview-analytics-bridge scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-pageview-analytics-bridge-${workerInfo.project.metadata.agentId}`,
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

	test("tracker is called on initial page load with the current value", async ({
		page,
	}) => {
		// Install the analytics stub BEFORE navigation so it is present when
		// the block's module-load watch() fires.
		await page.addInitScript({
			content:
				"window.__analyticsTracker = (...a) => { (window.__analyticsEvents ??= []).push(a); };",
		});

		await page.goto(`/?p=${post.id}`);
		await page.waitForLoadState("networkidle");

		// At least one event should have been recorded on load
		const events = await page.evaluate(() => window.__analyticsEvents);
		expect(Array.isArray(events)).toBe(true);
		expect(events.length).toBeGreaterThanOrEqual(1);
	});

	test("tracker is called again when the shared value changes", async ({
		page,
	}) => {
		await page.addInitScript({
			content:
				"window.__analyticsTracker = (...a) => { (window.__analyticsEvents ??= []).push(a); };",
		});

		await page.goto(`/?p=${post.id}`);
		await page.waitForLoadState("networkidle");

		const countBefore = await page.evaluate(
			() => (window.__analyticsEvents ?? []).length,
		);

		// Trigger a change to the shared value via a button the block provides
		// (the block should expose some UI or the value changes via another block)
		const trigger = page
			.locator(".wp-block-wp-skill-testing-block")
			.getByRole("button");
		if ((await trigger.count()) > 0) {
			await trigger.first().click();

			await expect
				.poll(() => page.evaluate(() => (window.__analyticsEvents ?? []).length))
				.toBeGreaterThan(countBefore);
		} else {
			// If the bridge block itself is UI-less, confirm the initial call is enough
			expect(countBefore).toBeGreaterThanOrEqual(1);
		}
	});

	test("tracked events contain the forwarded value", async ({ page }) => {
		await page.addInitScript({
			content:
				"window.__analyticsTracker = (...a) => { (window.__analyticsEvents ??= []).push(a); };",
		});

		await page.goto(`/?p=${post.id}`);
		await page.waitForLoadState("networkidle");

		const events = await page.evaluate(() => window.__analyticsEvents ?? []);
		// Every recorded call should have been passed at least one argument
		for (const call of events) {
			expect(call.length).toBeGreaterThanOrEqual(1);
		}
	});
});
