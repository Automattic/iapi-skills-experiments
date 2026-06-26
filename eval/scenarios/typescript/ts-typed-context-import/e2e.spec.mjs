import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the ts-typed-context-import scenario.
 *
 * The TypeScript cross-plugin import types and the `wp_script_module` dependency
 * declaration are authoring requirements verified by code review, not at runtime.
 * These tests verify the runtime behavior: the second plugin's contribution (a
 * Reset button) is visible in the block, clicking it resets the count to zero,
 * and the counter can be incremented after a reset — demonstrating that both
 * plugins operate on the same shared store at runtime.
 */

test.describe("ts-typed-context-import scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-ts-typed-context-import-${workerInfo.project.metadata.agentId}`,
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

	test("the second plugin's Reset button is visible in the block", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		await expect(block).toBeVisible();

		// The second plugin contributes a Reset button
		const resetBtn = block.getByRole("button", { name: /reset/i });
		await expect(resetBtn).toBeVisible();
	});

	test("clicking Reset sets the count to zero", async ({ page }) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const countEl = block.locator("[data-wp-text]").first();
		const incrementBtn = block.getByRole("button", { name: /increment/i });
		const resetBtn = block.getByRole("button", { name: /reset/i });

		// Increment a few times so the count is non-zero
		await incrementBtn.click();
		await incrementBtn.click();
		await incrementBtn.click();

		const afterIncrement = parseInt(await countEl.textContent(), 10);
		expect(afterIncrement).toBeGreaterThan(0);

		// Reset should bring the count back to zero
		await resetBtn.click();

		await expect(countEl).toHaveText("0");
	});

	test("counter can be incremented again after a reset", async ({ page }) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const countEl = block.locator("[data-wp-text]").first();
		const incrementBtn = block.getByRole("button", { name: /increment/i });
		const resetBtn = block.getByRole("button", { name: /reset/i });

		// Increment, reset, then increment again
		await incrementBtn.click();
		await incrementBtn.click();
		await resetBtn.click();
		await expect(countEl).toHaveText("0");

		await incrementBtn.click();
		await expect(countEl).toHaveText("1");
	});

	test("reset does not cause a page reload", async ({ page }) => {
		await page.goto(`/?p=${post.id}`);

		const urlBefore = page.url();

		const block = page.locator(".wp-block-wp-skill-testing-block");
		await block.getByRole("button", { name: /reset/i }).click();

		// The page must not have navigated
		expect(page.url()).toBe(urlBefore);
	});
});
