import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the live-search-filter scenario.
 *
 * Verifies that typing into the search field narrows the rendered list and
 * that clearing the field restores all items, without mutating the source data.
 */

test.describe("live-search-filter scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-live-search-filter-${workerInfo.project.metadata.agentId}`,
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

	test("shows the full list when the search field is empty", async ({
		page,
	}) => {
		const block = page.locator(".wp-block-wp-skill-testing-block");
		const items = block.locator("li");
		const totalCount = await items.count();
		expect(totalCount).toBeGreaterThanOrEqual(2);
	});

	test("typing filters the list to matching items only", async ({ page }) => {
		const block = page.locator(".wp-block-wp-skill-testing-block");
		const items = block.locator("li");
		const totalCount = await items.count();

		// Capture the text of the first item to use as a unique search term.
		const firstItemText = await items.nth(0).textContent();
		// Use only the first few characters to keep the search realistic.
		const query = firstItemText.trim().slice(0, 3);

		const searchInput = block.getByRole("searchbox").or(
			block.locator("input[type='search'], input[type='text']").first(),
		);
		await searchInput.fill(query);

		// The list should narrow — visible count must be less than total.
		await expect.poll(async () => {
			const visible = await items.count();
			return visible;
		}).toBeLessThan(totalCount);

		// Every visible item should contain the query text (case-insensitive).
		const visibleCount = await items.count();
		for (let i = 0; i < visibleCount; i++) {
			const text = await items.nth(i).textContent();
			expect(text.toLowerCase()).toContain(query.toLowerCase());
		}
	});

	test("clearing the search field restores the full list", async ({ page }) => {
		const block = page.locator(".wp-block-wp-skill-testing-block");
		const items = block.locator("li");
		const totalCount = await items.count();

		const searchInput = block.getByRole("searchbox").or(
			block.locator("input[type='search'], input[type='text']").first(),
		);

		// Type something that narrows the list.
		await searchInput.fill("zzz");

		// Clear the field.
		await searchInput.fill("");

		// All items should be visible again.
		await expect(items).toHaveCount(totalCount);
	});

	test("non-matching query shows an empty list or a no-results message", async ({
		page,
	}) => {
		const block = page.locator(".wp-block-wp-skill-testing-block");
		const items = block.locator("li");

		const searchInput = block.getByRole("searchbox").or(
			block.locator("input[type='search'], input[type='text']").first(),
		);

		// Type something guaranteed to match nothing in any reasonable seed data.
		await searchInput.fill("zzzzzzz_no_match");

		// Either the list is empty or a "no results" message appears.
		const itemCount = await items.count();
		if (itemCount > 0) {
			// If items are still rendered they should all be hidden (display:none).
			// With data-wp-each, non-matching rows are simply absent, so count = 0
			// is the normal case. A non-zero count here means the implementation
			// is hiding rather than removing rows — both are acceptable.
			const noResultsMsg = block.getByText(/no results|nothing found|no items/i);
			const msgVisible = await noResultsMsg.isVisible().catch(() => false);
			expect(itemCount === 0 || msgVisible).toBe(true);
		}
	});
});
