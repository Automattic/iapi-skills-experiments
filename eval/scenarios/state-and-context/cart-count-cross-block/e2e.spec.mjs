import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the cart-count-cross-block scenario.
 *
 * Two wp-skill/testing-block instances are embedded: the first acts as the
 * product card (with "Add to cart"), the second as the header badge displaying
 * the cart count. Tests confirm that clicking Add to cart on the first block
 * updates the count shown in the second — cross-block communication through
 * one shared global-state namespace.
 */

test.describe("cart-count-cross-block scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-cart-count-cross-block-${workerInfo.project.metadata.agentId}`,
		);
		// First instance = product card, second instance = cart badge
		post = await requestUtils.createPost({
			content:
				"<!-- wp:wp-skill/testing-block /-->\n<!-- wp:wp-skill/testing-block /-->",
			status: "publish",
		});
	});

	test.beforeEach(async ({ page }) => {
		await page.goto(`/?p=${post.id}`);
	});

	test.afterAll(async ({ requestUtils }) => {
		deactivateAllPlugins();
		await requestUtils.deleteAllPosts();
	});

	test("cart count badge starts at 0", async ({ page }) => {
		const wrappers = page.locator(".wp-block-wp-skill-testing-block");
		await expect(wrappers).toHaveCount(2);

		// The badge block (second instance) shows the cart count
		const badge = wrappers.nth(1).locator("[data-wp-text]");
		await expect(badge).toContainText("0");
	});

	test("clicking Add to cart increments the badge count", async ({ page }) => {
		const wrappers = page.locator(".wp-block-wp-skill-testing-block");

		const addBtn = wrappers.nth(0).getByRole("button", {
			name: /add to cart/i,
		});
		const badge = wrappers.nth(1).locator("[data-wp-text]");

		await addBtn.click();
		await expect(badge).toContainText("1");

		await addBtn.click();
		await expect(badge).toContainText("2");

		await addBtn.click();
		await expect(badge).toContainText("3");
	});

	test("badge updates without a page reload", async ({ page }) => {
		const wrappers = page.locator(".wp-block-wp-skill-testing-block");
		const addBtn = wrappers.nth(0).getByRole("button", {
			name: /add to cart/i,
		});
		const badge = wrappers.nth(1).locator("[data-wp-text]");

		// Record the URL before clicking — it must not change
		const urlBefore = page.url();
		await addBtn.click();
		await expect(badge).toContainText("1");
		expect(page.url()).toBe(urlBefore);
	});
});
