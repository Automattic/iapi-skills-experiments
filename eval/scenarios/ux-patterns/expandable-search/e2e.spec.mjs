import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the expandable-search scenario.
 *
 * Asserts that clicking the magnifier button expands the search field and
 * moves focus to the input, that clicking outside (or focusout) collapses
 * the field, and that the collapse does not fire spuriously when focus moves
 * between elements inside the component.
 */

test.describe("expandable-search scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-expandable-search-${workerInfo.project.metadata.agentId}`,
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

	const block = (page) => page.locator(".wp-block-wp-skill-testing-block");

	test("search input is not visible before the magnifier is clicked", async ({
		page,
	}) => {
		const searchInput = block(page).getByRole("searchbox").or(
			block(page).locator('input[type="search"], input[type="text"]'),
		);
		const count = await searchInput.count();
		if (count > 0) {
			await expect(searchInput.first()).not.toBeVisible();
		}
	});

	test("clicking the magnifier button expands the field and moves focus to the input", async ({
		page,
	}) => {
		// The trigger is a button — use a role-based selector; the magnifier
		// may be a button with an icon or a recognisable label.
		const trigger = block(page)
			.getByRole("button")
			.first();
		await trigger.click();

		// The search input must become visible.
		const searchInput = block(page)
			.locator('input[type="search"], input[type="text"], [role="searchbox"]')
			.first();
		await expect(searchInput).toBeVisible();

		// Focus must have moved to the input automatically.
		await expect(searchInput).toBeFocused();
	});

	test("the search field stays open while focus remains inside the component", async ({
		page,
	}) => {
		const trigger = block(page).getByRole("button").first();
		await trigger.click();

		const searchInput = block(page)
			.locator('input[type="search"], input[type="text"], [role="searchbox"]')
			.first();
		await expect(searchInput).toBeVisible();

		// Typing in the field should not collapse it.
		await searchInput.type("hello");
		await expect(searchInput).toBeVisible();
	});

	test("pressing Tab to move focus outside the component collapses the search field", async ({
		page,
	}) => {
		const trigger = block(page).getByRole("button").first();
		await trigger.click();

		const searchInput = block(page)
			.locator('input[type="search"], input[type="text"], [role="searchbox"]')
			.first();
		await expect(searchInput).toBeVisible();

		// Tab away from the search component to trigger focusout.
		await page.keyboard.press("Tab");

		// Confirm focus has moved outside the block.
		const focusInsideBlock = await page.evaluate(() => {
			const block = document.querySelector(
				".wp-block-wp-skill-testing-block",
			);
			return block ? block.contains(document.activeElement) : false;
		});
		expect(focusInsideBlock).toBe(false);

		// The field must now be collapsed / hidden.
		await expect.poll(
			async () => {
				const count = await searchInput.count();
				if (count === 0) return false;
				return searchInput.isVisible();
			},
			{ timeout: 3000 },
		).toBe(false);
	});

	test("clicking outside the component collapses the search field", async ({
		page,
	}) => {
		const trigger = block(page).getByRole("button").first();
		await trigger.click();

		const searchInput = block(page)
			.locator('input[type="search"], input[type="text"], [role="searchbox"]')
			.first();
		await expect(searchInput).toBeVisible();

		// Click somewhere outside the block entirely.
		await page.locator("body").click({ position: { x: 10, y: 10 } });

		await expect.poll(
			async () => {
				const count = await searchInput.count();
				if (count === 0) return false;
				return searchInput.isVisible();
			},
			{ timeout: 3000 },
		).toBe(false);
	});
});
