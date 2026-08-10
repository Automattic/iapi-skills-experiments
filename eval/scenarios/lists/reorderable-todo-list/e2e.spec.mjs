import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the reorderable-todo-list scenario.
 *
 * Asserts that items reorder without rebuilding DOM nodes by tracking the
 * data-wp-each-key attribute on each row before and after a move.
 */

test.describe("reorderable-todo-list scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-reorderable-todo-list-${workerInfo.project.metadata.agentId}`,
		);
		post = await requestUtils.createPost({
			content: "<!-- wp:wp-skill/testing-block /-->",
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

	test("renders the initial to-do list", async ({ page }) => {
		const block = page.locator(".wp-block-wp-skill-testing-block");
		const items = block.locator("[data-wp-each-key]");
		await expect(items).toHaveCount(await items.count());
		// The list must have at least two items to be reorderable.
		const count = await items.count();
		expect(count).toBeGreaterThanOrEqual(2);
	});

	test("Up button moves item to the previous position", async ({ page }) => {
		const block = page.locator(".wp-block-wp-skill-testing-block");
		const items = block.locator("[data-wp-each-key]");

		// Capture the key of the second item before reordering.
		const secondItemKey = await items.nth(1).getAttribute("data-wp-each-key");
		// Capture the key of the first item before reordering.
		const firstItemKey = await items.nth(0).getAttribute("data-wp-each-key");

		// Click "Up" on the second item to move it to position 0.
		const upButtons = block.getByRole("button", { name: /up/i });
		await upButtons.nth(1).click();

		// After the move the second item's key should now appear at position 0.
		await expect(items.nth(0)).toHaveAttribute(
			"data-wp-each-key",
			secondItemKey,
		);
		await expect(items.nth(1)).toHaveAttribute("data-wp-each-key", firstItemKey);
	});

	test("Down button moves item to the next position", async ({ page }) => {
		const block = page.locator(".wp-block-wp-skill-testing-block");
		const items = block.locator("[data-wp-each-key]");

		// Capture keys of the first two items.
		const firstItemKey = await items.nth(0).getAttribute("data-wp-each-key");
		const secondItemKey = await items.nth(1).getAttribute("data-wp-each-key");

		// Click "Down" on the first item.
		const downButtons = block.getByRole("button", { name: /down/i });
		await downButtons.nth(0).click();

		// First item should now be at position 1; second at position 0.
		await expect(items.nth(0)).toHaveAttribute(
			"data-wp-each-key",
			secondItemKey,
		);
		await expect(items.nth(1)).toHaveAttribute("data-wp-each-key", firstItemKey);
	});

	test("keyed DOM nodes are preserved across a reorder (no rebuild)", async ({
		page,
	}) => {
		const block = page.locator(".wp-block-wp-skill-testing-block");
		const items = block.locator("[data-wp-each-key]");

		// Grab a JS handle to the first DOM element before the move.
		const firstElementBefore = await items.nth(0).elementHandle();

		// Move the first item down.
		const downButtons = block.getByRole("button", { name: /down/i });
		await downButtons.nth(0).click();

		// The same DOM node should now be at position 1 — not a new element.
		const firstElementAfter = await items.nth(1).elementHandle();
		expect(await page.evaluate(([a, b]) => a === b, [firstElementBefore, firstElementAfter])).toBe(true);
	});
});
