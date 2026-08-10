import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the product-quantity-stepper scenario.
 *
 * Two block instances are embedded. Tests verify each instance keeps its own
 * quantity (local context) and that stepping one does not affect the other —
 * confirming local context is used rather than shared global state.
 */

test.describe("product-quantity-stepper scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-product-quantity-stepper-${workerInfo.project.metadata.agentId}`,
		);
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

	test("each instance starts at quantity 1", async ({ page }) => {
		const wrappers = page.locator(".wp-block-wp-skill-testing-block");
		await expect(wrappers).toHaveCount(2);

		for (let i = 0; i < 2; i++) {
			const qty = wrappers.nth(i).locator("[data-wp-text]");
			await expect(qty).toContainText("1");
		}
	});

	test("incrementing the first instance does not affect the second", async ({
		page,
	}) => {
		const wrappers = page.locator(".wp-block-wp-skill-testing-block");

		const plusBtn0 = wrappers.nth(0).getByRole("button", { name: /\+/i });
		const qty0 = wrappers.nth(0).locator("[data-wp-text]");
		const qty1 = wrappers.nth(1).locator("[data-wp-text]");

		await plusBtn0.click();
		await plusBtn0.click();
		await plusBtn0.click();

		await expect(qty0).toContainText("4");
		await expect(qty1).toContainText("1");
	});

	test("incrementing the second instance does not affect the first", async ({
		page,
	}) => {
		const wrappers = page.locator(".wp-block-wp-skill-testing-block");

		const plusBtn1 = wrappers.nth(1).getByRole("button", { name: /\+/i });
		const qty0 = wrappers.nth(0).locator("[data-wp-text]");
		const qty1 = wrappers.nth(1).locator("[data-wp-text]");

		await plusBtn1.click();
		await plusBtn1.click();

		await expect(qty0).toContainText("1");
		await expect(qty1).toContainText("3");
	});

	test("quantity does not go below 1 when decrementing", async ({ page }) => {
		const wrappers = page.locator(".wp-block-wp-skill-testing-block");
		const minusBtn0 = wrappers.nth(0).getByRole("button", { name: /−|-/i });
		const qty0 = wrappers.nth(0).locator("[data-wp-text]");

		// Clicking minus when already at 1 should keep it at 1
		await minusBtn0.click();
		await expect(qty0).toContainText("1");
	});
});
