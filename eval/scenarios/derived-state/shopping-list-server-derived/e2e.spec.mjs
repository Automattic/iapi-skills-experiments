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

		// In-cart icons: server must have rendered an icon/indicator on rows whose
		// item is in-cart. The block marks in-cart rows with a data attribute or
		// class — assert at least one such icon is visible in the raw HTML,
		// confirming the server-derived state was written into the markup.
		const inCartIcons = block.locator(
			"[data-in-cart='true'], .in-cart, [aria-label*='cart' i]",
		);
		const inCartCount = await inCartIcons.count();
		expect(inCartCount).toBeGreaterThan(0);

		await page.setJavaScriptEnabled(true);
	});

	test("in-cart items show their icon on first paint, not-in-cart rows do not", async ({
		page,
	}) => {
		// JavaScript disabled: evaluate only the static server-rendered HTML so
		// any icon presence is purely from server-computed per-row derived state.
		await page.setJavaScriptEnabled(false);
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		await expect(block).toBeVisible();

		// In-cart rows: server marks them with a data attribute or class.
		const inCartIcons = block.locator(
			"[data-in-cart='true'], .in-cart, [aria-label*='cart' i]",
		);

		// Out-of-cart rows: rows that do NOT carry the in-cart marker.
		const notInCartRows = block.locator(
			"li:not(.in-cart):not([data-in-cart='true']), [role='listitem']:not(.in-cart):not([data-in-cart='true'])",
		);

		// At least one row must be in-cart (seeded that way by the block) and its
		// icon must be present in the server HTML.
		const inCartCount = await inCartIcons.count();
		expect(inCartCount).toBeGreaterThan(0);

		// At least one row must be not-in-cart and must NOT carry the icon.
		const notInCartCount = await notInCartRows.count();
		expect(notInCartCount).toBeGreaterThan(0);

		// Confirm the not-in-cart rows truly lack the icon by verifying that none
		// of the not-in-cart row locators contain an in-cart icon descendant.
		for (let i = 0; i < notInCartCount; i++) {
			const row = notInCartRows.nth(i);
			const iconInRow = row.locator(
				"[data-in-cart='true'], .in-cart, [aria-label*='cart' i]",
			);
			await expect(iconInRow).toHaveCount(0);
		}

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
