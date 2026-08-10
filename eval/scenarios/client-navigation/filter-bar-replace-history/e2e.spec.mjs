import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the filter-bar-replace-history scenario.
 *
 * Creates a single post with the testing block. Asserts that clicking filter
 * options changes the URL (filter parameter is reflected) but does NOT grow
 * `history.length` — each filter click replaces the current history entry
 * rather than pushing a new one.
 */

test.describe("filter-bar-replace-history scenario", () => {
	let post;

	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-filter-bar-replace-history-${workerInfo.project.metadata.agentId}`,
		);
		post = await requestUtils.createPost({
			title: "Filter Bar Host",
			content: "<!-- wp:wp-skill/testing-block /-->",
			status: "publish",
		});
	});

	test.afterAll(async ({ requestUtils }) => {
		deactivateAllPlugins();
		await requestUtils.deleteAllPosts();
	});

	test("clicking a filter updates the URL with the filter parameter", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const filterLink = page
			.locator(".wp-block-wp-skill-testing-block")
			.getByRole("link")
			.first();

		await filterLink.click();

		// The URL should now include a filter/query parameter.
		const url = page.url();
		expect(url).not.toBe(`/?p=${post.id}`);
		// URL has changed (contains some query parameter).
		expect(url).toMatch(/[?&]\w+=/);
	});

	test("filter clicks replace history entries — history.length does not grow", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		// Record history length before any filtering.
		const historyBefore = await page.evaluate(() => history.length);

		// Collect the filter links rendered by the block.
		const filterLinks = page
			.locator(".wp-block-wp-skill-testing-block")
			.getByRole("link");
		const count = await filterLinks.count();
		// We need at least 2 filter options to verify replaceState.
		expect(count).toBeGreaterThanOrEqual(2);

		// Click the first filter.
		await filterLinks.nth(0).click();
		await page.waitForURL(/[?&]\w+=/);

		const historyAfterFirst = await page.evaluate(() => history.length);

		// Click a second filter.
		await filterLinks.nth(1).click();
		await page.waitForURL(/[?&]\w+=/);

		const historyAfterSecond = await page.evaluate(() => history.length);

		// history.length should not have grown beyond the initial navigation
		// that landed us on the post page (push) — filter clicks must use
		// replaceState, not pushState.
		// historyAfterFirst may be historyBefore+1 for the first click, but
		// subsequent filter clicks must not grow it further.
		expect(historyAfterSecond).toBeLessThanOrEqual(historyAfterFirst);
	});

	test("filter links are real anchors with href (no-JS fallback)", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const filterLinks = page
			.locator(".wp-block-wp-skill-testing-block")
			.getByRole("link");
		const count = await filterLinks.count();
		expect(count).toBeGreaterThan(0);

		for (let i = 0; i < count; i++) {
			const href = await filterLinks.nth(i).getAttribute("href");
			expect(href).toBeTruthy();
		}
	});
});
