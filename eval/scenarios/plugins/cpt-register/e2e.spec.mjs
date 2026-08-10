import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the cpt-register scenario.
 *
 * Asserts that the `books` custom post type REST collection route returns
 * HTTP 200 when the plugin is active.
 */

test.describe("cpt-register scenario", () => {
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-cpt-register-${workerInfo.project.metadata.agentId}`,
		);
	});

	test.afterAll(() => {
		deactivateAllPlugins();
	});

	test("GET /wp-json/wp/v2/books returns HTTP 200", async ({ page }) => {
		const resp = await page.request.get("/wp-json/wp/v2/books");
		expect(resp.status()).toBe(200);
	});
});
