import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the section-jump-scroll scenario.
 *
 * Creates two pages with the testing block and enough content to make the
 * page scrollable. Asserts that after a soft navigation the scroll position
 * is reset to the top of the page.
 */

test.describe("section-jump-scroll scenario", () => {
	let pageA;
	let pageB;

	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-section-jump-scroll-${workerInfo.project.metadata.agentId}`,
		);
		// Create two pages with plenty of content so the viewport can scroll.
		pageA = await requestUtils.createPage({
			title: "Scroll Page A",
			content:
				"<!-- wp:wp-skill/testing-block /-->" +
				"\n\n" +
				"<!-- wp:paragraph --><p>" +
				"Filler paragraph. ".repeat(200) +
				"</p><!-- /wp:paragraph -->",
			status: "publish",
		});
		pageB = await requestUtils.createPage({
			title: "Scroll Page B",
			content:
				"<!-- wp:wp-skill/testing-block /-->" +
				"\n\n" +
				"<!-- wp:paragraph --><p>" +
				"More filler. ".repeat(200) +
				"</p><!-- /wp:paragraph -->",
			status: "publish",
		});
	});

	test.afterAll(async ({ requestUtils }) => {
		deactivateAllPlugins();
		await requestUtils.deleteAllPosts();
		await requestUtils.deleteAllPages();
	});

	test("scroll resets to top after a soft navigation", async ({ page }) => {
		await page.goto(`/?page_id=${pageA.id}`);

		// Scroll down so we are not already at the top.
		await page.evaluate(() => window.scrollTo(0, 500));
		const scrollBefore = await page.evaluate(() => window.scrollY);
		expect(scrollBefore).toBeGreaterThan(0);

		// Plant a no-reload sentinel.
		await page.evaluate(() => {
			window.__noReloadSentinel = true;
		});

		// Click the navigation link to page B via the soft router.
		const navLink = page
			.locator(".wp-block-wp-skill-testing-block")
			.getByRole("link")
			.first();
		await navLink.click();

		// Wait for the URL to update to page B.
		await expect(page).toHaveURL(new RegExp(`page_id=${pageB.id}`));

		// Scroll position should now be at (or very near) the top.
		const scrollAfter = await page.evaluate(() => window.scrollY);
		expect(scrollAfter).toBeLessThanOrEqual(50);

		// Confirm this was a soft navigation, not a full reload.
		const survived = await page.evaluate(
			() => window.__noReloadSentinel === true,
		);
		expect(survived).toBe(true);
	});
});
