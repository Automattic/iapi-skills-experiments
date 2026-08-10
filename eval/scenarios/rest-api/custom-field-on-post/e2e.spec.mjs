import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the rest-api-custom-field-on-post scenario.
 *
 * Asserts that a top-level `reading_time` field is present on a post's REST
 * API response and returns the value `5 min`, without being nested under the
 * post's meta object.
 */

test.describe("rest-api-custom-field-on-post scenario", () => {
	let post;

	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-custom-field-on-post-${workerInfo.project.metadata.agentId}`,
		);
		post = await requestUtils.createPost({ status: "publish" });
	});

	test.afterAll(async ({ requestUtils }) => {
		deactivateAllPlugins();
		await requestUtils.deleteAllPosts();
	});

	test("GET /wp-json/wp/v2/posts/:id includes top-level reading_time field", async ({
		page,
	}) => {
		const resp = await page.request.get(`/wp-json/wp/v2/posts/${post.id}`);
		expect((await resp.json()).reading_time).toBe("5 min");
	});
});
