import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the rest-custom-endpoint scenario.
 *
 * Activates the agent-generated plugin and sends a direct GET request to the
 * registered route, asserting a 200 status and a `message` field in the JSON
 * response. No DOM or post seeding is required — the endpoint is exercised via
 * the Playwright request context.
 */

test.describe("rest-custom-endpoint scenario", () => {
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-custom-endpoint-${workerInfo.project.metadata.agentId}`,
		);
	});

	test.afterAll(() => {
		deactivateAllPlugins();
	});

	test("GET /wp-json/myplugin/v1/hello returns 200 and a message field", async ({
		page,
	}) => {
		const resp = await page.request.get("/wp-json/myplugin/v1/hello");
		expect(resp.status()).toBe(200);
		expect(await resp.json()).toHaveProperty("message");
	});
});
