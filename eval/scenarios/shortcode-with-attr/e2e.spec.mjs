import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../utils/wp-cli.mjs";

/**
 * E2E tests for the shortcode-with-attr scenario.
 */

test.describe("shortcode with attr scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-shortcode-with-attr-${workerInfo.project.metadata.agentId}`,
		);
		post = await requestUtils.createPost({
			content: '[greeting name="Alice"]',
			status: "publish",
		});
	});

	test.afterAll(async ({ requestUtils }) => {
		deactivateAllPlugins();
		await requestUtils.deleteAllPosts();
	});

	test("renders the name attribute in the greeting output", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);
		await expect(page.locator("body")).toContainText("Alice");
	});
});
