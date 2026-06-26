import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the results-no-flash scenario.
 *
 * The block is seeded server-side with a non-empty results list. The test
 * asserts that the initial server-rendered HTML already shows the results
 * and does NOT contain the visible empty-state message — JavaScript must not
 * need to run first to establish the correct state, so no flash occurs.
 */

test.describe("results-no-flash scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-results-no-flash-${workerInfo.project.metadata.agentId}`,
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

	test("server-rendered HTML shows results and not the empty-state message before hydration", async ({
		page,
	}) => {
		// Disable JavaScript to evaluate only the raw server-rendered HTML —
		// this is the definitive test that no flash can occur: the HTML must be
		// correct before any client code runs.
		await page.setJavaScriptEnabled(false);
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		await expect(block).toBeVisible();

		// At least one result item must be present in the static HTML
		const items = block.locator("li, [data-result], [data-wp-each-child]");
		await expect(items.first()).toBeVisible();

		// The "No results" message must NOT be visible in the static HTML when
		// results exist — this is the no-flash guarantee.
		const emptyMessage = block.getByText(/no results/i);
		await expect(emptyMessage).not.toBeVisible();

		await page.setJavaScriptEnabled(true);
	});

	test("results are present and the empty message is hidden after hydration", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		await expect(block).toBeVisible();

		// Results remain visible after client hydration
		const items = block.locator("li, [data-result], [data-wp-each-child]");
		await expect(items.first()).toBeVisible();

		// Empty-state message stays hidden when results exist
		const emptyMessage = block.getByText(/no results/i);
		await expect(emptyMessage).not.toBeVisible();
	});
});
