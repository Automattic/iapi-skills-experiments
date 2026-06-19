import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../utils/wp-cli.mjs";

/**
 * E2E tests for the taxonomy-register scenario.
 *
 * Asserts that the `genre` taxonomy REST collection route returns
 * HTTP 200 when the plugin is active.
 */

test.describe("taxonomy-register scenario", () => {
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-taxonomy-register-${workerInfo.project.metadata.agentId}`,
		);
	});

	test.afterAll(() => {
		deactivateAllPlugins();
	});

	test("GET /wp-json/wp/v2/genre returns HTTP 200", async ({ page }) => {
		const resp = await page.request.get("/wp-json/wp/v2/genre");
		expect(resp.status()).toBe(200);
	});
});
