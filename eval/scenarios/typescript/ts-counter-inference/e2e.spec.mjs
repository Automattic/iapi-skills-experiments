import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the ts-counter-inference scenario.
 *
 * The TypeScript constraint (inference-only, no explicit annotations) is an
 * authoring requirement verified by code review, not at runtime. These tests
 * verify the runtime behavior: the counter renders its initial count and
 * increments / decrements correctly when the buttons are clicked.
 */

test.describe("ts-counter-inference scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-ts-counter-inference-${workerInfo.project.metadata.agentId}`,
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

	test("counter renders an initial count on first paint", async ({ page }) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		await expect(block).toBeVisible();

		// The current count should be visible in the block output
		await expect(block).toContainText(/\d/);
	});

	test("clicking Increment increases the displayed count by one", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const countEl = block.locator("[data-wp-text]").first();

		const initial = parseInt(await countEl.textContent(), 10);

		await block.getByRole("button", { name: /increment/i }).click();

		await expect(countEl).toHaveText(String(initial + 1));
	});

	test("clicking Decrement decreases the displayed count by one", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const countEl = block.locator("[data-wp-text]").first();

		const initial = parseInt(await countEl.textContent(), 10);

		await block.getByRole("button", { name: /decrement/i }).click();

		await expect(countEl).toHaveText(String(initial - 1));
	});

	test("counter can be incremented multiple times in sequence", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const countEl = block.locator("[data-wp-text]").first();
		const incrementBtn = block.getByRole("button", { name: /increment/i });

		const initial = parseInt(await countEl.textContent(), 10);

		await incrementBtn.click();
		await incrementBtn.click();
		await incrementBtn.click();

		await expect(countEl).toHaveText(String(initial + 3));
	});
});
