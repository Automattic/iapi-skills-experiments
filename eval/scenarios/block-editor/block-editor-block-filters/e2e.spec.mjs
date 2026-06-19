import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the block-editor-block-filters scenario.
 *
 * Verifies that a render-time filter appends "Powered by my plugin" to the
 * rendered output of `wp-skill/testing-block` on every front-end page load,
 * without affecting other blocks.
 */

test.describe("block editor block filters scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		// Ensure the block plugin is active before tests run.
		await requestUtils.activatePlugin(
			`plugin-block-editor-block-filters-${workerInfo.project.metadata.agentId}`,
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

	test('block output contains "Powered by my plugin"', async ({ page }) => {
		await expect(
			page.locator(".wp-block-wp-skill-testing-block"),
		).toContainText("Powered by my plugin");
	});
});
