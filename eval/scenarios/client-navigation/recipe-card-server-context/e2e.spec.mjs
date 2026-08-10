import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the recipe-card-server-context scenario.
 *
 * Creates two pages each seeding different recipe data (via the testing block).
 * Asserts that:
 *   - The recipe title updates to the destination page's server-provided value
 *     after a soft navigation.
 *   - A client-side servings adjustment made before navigation persists after
 *     the navigation (not reset by the server context re-sync).
 */

test.describe("recipe-card-server-context scenario", () => {
	let pageA;
	let pageB;

	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-recipe-card-server-context-${workerInfo.project.metadata.agentId}`,
		);
		// Two pages — each page's PHP seeds a different recipe title via context.
		pageA = await requestUtils.createPage({
			title: "Recipe Card Page A",
			content: "<!-- wp:wp-skill/testing-block /-->",
			status: "publish",
		});
		pageB = await requestUtils.createPage({
			title: "Recipe Card Page B",
			content: "<!-- wp:wp-skill/testing-block /-->",
			status: "publish",
		});
	});

	test.afterAll(async ({ requestUtils }) => {
		deactivateAllPlugins();
		await requestUtils.deleteAllPosts();
		await requestUtils.deleteAllPages();
	});

	test("recipe title is visible and server-provided on initial load", async ({
		page,
	}) => {
		await page.goto(`/?page_id=${pageA.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		// The server-seeded recipe title should be visible in a heading or label.
		const title = block.locator("h1, h2, h3, [class*='title'], [class*='recipe']");
		await expect(title.first()).toBeVisible();

		const titleText = await title.first().textContent();
		expect(titleText?.trim().length).toBeGreaterThan(0);
	});

	test("servings adjustment persists across a soft navigation", async ({
		page,
	}) => {
		await page.goto(`/?page_id=${pageA.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");

		// Adjust servings upward.
		const increaseButton = block.getByRole("button", {
			name: /\+|increase|more|add serving/i,
		});
		await increaseButton.click();

		// Read the displayed servings count after clicking.
		const servingsDisplay = block.locator(
			"[class*='serving'], [data-servings], output, [class*='count']",
		);
		const servingsBefore = await servingsDisplay.first().textContent();

		// Navigate to page B via the nav link.
		const navLink = block.getByRole("link").first();
		await navLink.click();
		await expect(page).toHaveURL(new RegExp(`page_id=${pageB.id}`), {
			timeout: 15_000,
		});

		// The servings count should still reflect the visitor's adjustment.
		const blockAfterNav = page.locator(".wp-block-wp-skill-testing-block");
		const servingsDisplayAfterNav = blockAfterNav.locator(
			"[class*='serving'], [data-servings], output, [class*='count']",
		);
		const servingsAfter = await servingsDisplayAfterNav.first().textContent();

		expect(servingsAfter).toBe(servingsBefore);
	});

	test("recipe title updates to the new page value after a soft navigation", async ({
		page,
	}) => {
		await page.goto(`/?page_id=${pageA.id}`);

		const blockA = page.locator(".wp-block-wp-skill-testing-block");
		const titleSelectorA = blockA.locator(
			"h1, h2, h3, [class*='title'], [class*='recipe']",
		);
		const titleA = await titleSelectorA.first().textContent();

		// Navigate to page B.
		const navLink = blockA.getByRole("link").first();
		await navLink.click();
		await expect(page).toHaveURL(new RegExp(`page_id=${pageB.id}`), {
			timeout: 15_000,
		});

		const blockB = page.locator(".wp-block-wp-skill-testing-block");
		const titleSelectorB = blockB.locator(
			"h1, h2, h3, [class*='title'], [class*='recipe']",
		);
		const titleB = await titleSelectorB.first().textContent();

		// The recipe title should now reflect page B's server-seeded value.
		expect(titleB).not.toBe(titleA);
	});
});
