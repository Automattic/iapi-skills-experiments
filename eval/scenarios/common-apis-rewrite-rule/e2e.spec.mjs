import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../utils/wp-cli.mjs";

/**
 * E2E tests for the common-apis-rewrite-rule scenario.
 *
 * Asserts that the custom URL `/my-custom-page` returns HTTP 200 and
 * the plugin's pinned body token when the plugin is active.
 */

test.describe("common-apis-rewrite-rule scenario", () => {
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-common-apis-rewrite-rule-${workerInfo.project.metadata.agentId}`,
		);
	});

	test.afterAll(() => {
		deactivateAllPlugins();
	});

	test("GET /my-custom-page returns HTTP 200 with the plugin's body token", async ({
		page,
	}) => {
		const resp = await page.request.get("/my-custom-page");
		expect(resp.status()).toBe(200);
		expect(await resp.text()).toContain("Hello from my plugin");
	});
});
