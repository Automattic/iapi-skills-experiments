import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../utils/wp-cli.mjs";

/**
 * E2E tests for the block-editor-block-styles scenario.
 *
 * Verifies that a block style registered under the slug `custom` causes the
 * `is-style-custom` CSS class to appear on the block wrapper on the front end
 * when the style is applied via the block's className attribute.
 */

test.describe("block editor block styles scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		// Ensure the block plugin is active before tests run.
		await requestUtils.activatePlugin(
			`plugin-block-editor-block-styles-${workerInfo.project.metadata.agentId}`,
		);
		post = await requestUtils.createPost({
			content:
				'<!-- wp:wp-skill/testing-block {"className":"is-style-custom"} /-->',
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

	test("is-style-custom class reaches the rendered block wrapper", async ({
		page,
	}) => {
		await expect(
			page.locator(".wp-block-wp-skill-testing-block"),
		).toHaveClass(/is-style-custom/);
	});
});
