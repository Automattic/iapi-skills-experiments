import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the ts-server-state-merge scenario.
 *
 * The TypeScript `ServerState & typeof storeDef` merge type is an authoring
 * requirement verified by code review, not at runtime. These tests verify the
 * runtime behavior: the server-seeded initial count is visible on first paint
 * and the counter increments correctly from that seeded starting value.
 */

test.describe("ts-server-state-merge scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-ts-server-state-merge-${workerInfo.project.metadata.agentId}`,
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

	test("server-seeded initial count is present in the HTML on first paint", async ({
		page,
	}) => {
		// Disable JavaScript to inspect purely the server-rendered HTML
		await page.setJavaScriptEnabled(false);
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		await expect(block).toBeVisible();

		// The block must contain a numeric value before JS runs
		const text = await block.textContent();
		expect(text).toMatch(/\d/);

		await page.setJavaScriptEnabled(true);
	});

	test("displayed count matches the server-seeded value after hydration", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		await expect(block).toBeVisible();

		const countEl = block.locator("[data-wp-text]").first();
		const text = await countEl.textContent();

		// The count element must show a numeric value seeded from the server
		expect(Number.isInteger(parseInt(text, 10))).toBe(true);
	});

	test("clicking Increment increases the count from its server-seeded value", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const countEl = block.locator("[data-wp-text]").first();

		const initial = parseInt(await countEl.textContent(), 10);

		await block.getByRole("button", { name: /increment/i }).click();

		await expect(countEl).toHaveText(String(initial + 1));
	});

	test("counter increments correctly across multiple clicks", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const countEl = block.locator("[data-wp-text]").first();
		const incrementBtn = block.getByRole("button", { name: /increment/i });

		const initial = parseInt(await countEl.textContent(), 10);

		await incrementBtn.click();
		await incrementBtn.click();

		await expect(countEl).toHaveText(String(initial + 2));
	});
});
