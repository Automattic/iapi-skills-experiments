import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the block-editor-dynamic-block scenario.
 *
 * Verifies that the block renders its front-end output dynamically in PHP at
 * render time and that the output contains the expected text "Hello from PHP".
 */

test.describe("block editor dynamic block scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		// Ensure the block plugin is active before tests run.
		await requestUtils.activatePlugin(
			`plugin-dynamic-block-${workerInfo.project.metadata.agentId}`,
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

	test("renders dynamic PHP output on the front end", async ({ page }) => {
		await expect(
			page.locator(".wp-block-wp-skill-testing-block"),
		).toContainText("Hello from PHP");
	});
});
