import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../utils/wp-cli.mjs";

/**
 * E2E tests for the block-editor-block-supports scenario.
 *
 * Verifies that the block's color support is declared in block.json AND the
 * wrapper is emitted via get_block_wrapper_attributes() so the stored vivid-red
 * value becomes a CSS class (has-background) on the front end.
 */

test.describe("block editor block supports scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		// Ensure the block plugin is active before tests run.
		await requestUtils.activatePlugin(
			`plugin-block-editor-block-supports-${workerInfo.project.metadata.agentId}`,
		);
		post = await requestUtils.createPost({
			content:
				'<!-- wp:wp-skill/testing-block {"backgroundColor":"vivid-red"} /-->',
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

	test("support-derived has-background class reaches the rendered wrapper", async ({
		page,
	}) => {
		await expect(
			page.locator(".wp-block-wp-skill-testing-block"),
		).toHaveClass(/has-background/);
	});
});
