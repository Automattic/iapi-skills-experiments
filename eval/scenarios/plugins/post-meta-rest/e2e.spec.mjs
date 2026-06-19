import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../utils/wp-cli.mjs";

/**
 * E2E tests for the post-meta-rest scenario.
 *
 * Asserts that a registered `subtitle` post meta with `show_in_rest => true`
 * surfaces under the `.meta` object of a post's REST API response.
 */

test.describe("post-meta-rest scenario", () => {
	let post;

	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-post-meta-rest-${workerInfo.project.metadata.agentId}`,
		);
		post = await requestUtils.createPost({ status: "publish" });
	});

	test.afterAll(async ({ requestUtils }) => {
		deactivateAllPlugins();
		await requestUtils.deleteAllPosts();
	});

	test("GET /wp-json/wp/v2/posts/:id includes subtitle in meta", async ({
		page,
	}) => {
		const resp = await page.request.get(`/wp-json/wp/v2/posts/${post.id}`);
		expect((await resp.json()).meta).toHaveProperty("subtitle");
	});
});
