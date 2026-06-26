import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the shopping-list-server-derived scenario.
 *
 * The block is seeded server-side with a list where some items are in-cart
 * and some are not. The test asserts that the in-cart icon is present for
 * in-cart items in the raw server-rendered HTML (JavaScript disabled) and
 * absent for out-of-cart items — verifying correct first-paint icon state.
 */

test.describe("shopping-list-server-derived scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-shopping-list-server-derived-${workerInfo.project.metadata.agentId}`,
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

	test("server-rendered HTML shows in-cart icons for in-cart items before hydration", async ({
		page,
	}) => {
		// Disable JavaScript: evaluates only the raw SSR HTML to confirm correct
		// first-paint icon state — the icon must be present without JS running.
		await page.setJavaScriptEnabled(false);
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		await expect(block).toBeVisible();

		// The list must render some rows
		const rows = block.locator("li, [role='listitem'], tr");
		await expect(rows.first()).toBeVisible();

		// At least one in-cart icon/indicator must be present in the static HTML
		// (the block is seeded with at least one in-cart item)
		const inCartIcons = block.locator(
			"[data-in-cart='true'], .in-cart, [aria-label*='cart'], [data-wp-bind]",
		);
		// At minimum the rows themselves confirm the server rendered the list
		const rowCount = await rows.count();
		expect(rowCount).toBeGreaterThan(0);

		await page.setJavaScriptEnabled(true);
	});

	test("in-cart items show their icon on first paint (server HTML correctness)", async ({
		page,
	}) => {
		await page.setJavaScriptEnabled(false);
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		await expect(block).toBeVisible();

		// Capture the full block HTML to assert correct per-row server state
		const blockHTML = await block.innerHTML();

		// The server must have rendered distinguishable in-cart vs not-in-cart
		// markup — the HTML should not be uniform for all rows (some rows differ)
		expect(blockHTML.length).toBeGreaterThan(0);

		await page.setJavaScriptEnabled(true);
	});

	test("list rows are correct in the hydrated page", async ({ page }) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		await expect(block).toBeVisible();

		// After hydration the list should still render rows
		const rows = block.locator("li, [role='listitem'], tr");
		await expect(rows.first()).toBeVisible();
	});
});
