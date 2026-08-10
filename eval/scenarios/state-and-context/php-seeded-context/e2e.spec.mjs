import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the php-seeded-context scenario.
 *
 * Verifies that each block instance's list of items is server-seeded into
 * per-instance context so the markup is correct before hydration and distinct
 * across instances.
 */

test.describe("php-seeded-context scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-php-seeded-context-${workerInfo.project.metadata.agentId}`,
		);
		// Two instances so we can verify they carry distinct seeds
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

	test("both instances render list items in server-rendered HTML", async ({
		page,
	}) => {
		const wrappers = page.locator(".wp-block-wp-skill-testing-block");
		await expect(wrappers).toHaveCount(2);

		// Each instance should have at least one list item in the DOM
		for (let i = 0; i < 2; i++) {
			const items = wrappers.nth(i).locator("li");
			await expect(items).not.toHaveCount(0);
		}
	});

	test("the seeded list is present before hydration (server-rendered HTML)", async ({
		page,
	}) => {
		// Disable JavaScript and reload so only the SSR HTML is evaluated
		await page.setJavaScriptEnabled(false);
		await page.goto(`/?p=${post.id}`);

		const wrappers = page.locator(".wp-block-wp-skill-testing-block");
		await expect(wrappers).toHaveCount(2);

		// Items must exist in static HTML — no JS required
		const firstInstanceItems = wrappers.nth(0).locator("li");
		await expect(firstInstanceItems).not.toHaveCount(0);

		await page.setJavaScriptEnabled(true);
	});

	test("two instances show distinct server-seeded lists", async ({ page }) => {
		const wrappers = page.locator(".wp-block-wp-skill-testing-block");

		const firstText = await wrappers.nth(0).textContent();
		const secondText = await wrappers.nth(1).textContent();

		// The block's PHP render callback should seed different items per instance
		expect(firstText).not.toEqual(secondText);
	});
});
