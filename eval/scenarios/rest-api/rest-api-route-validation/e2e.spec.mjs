import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the rest-api-route-validation scenario.
 *
 * Activates the agent-generated plugin and sends direct GET requests to the
 * registered route with both an allowed and a disallowed `filter` value,
 * asserting HTTP 200 for the allowed value and HTTP 400 for the disallowed one.
 * No DOM interaction or post seeding is required — the endpoint is exercised
 * via the Playwright request context.
 */

test.describe("rest-api-route-validation scenario", () => {
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-rest-api-route-validation-${workerInfo.project.metadata.agentId}`,
		);
	});

	test.afterAll(() => {
		deactivateAllPlugins();
	});

	test("GET /wp-json/example/v1/color returns 200 for an allowed filter value and 400 for a disallowed one", async ({
		page,
	}) => {
		const ok = await page.request.get("/wp-json/example/v1/color?filter=blue");
		expect(ok.status()).toBe(200);

		const bad = await page.request.get(
			"/wp-json/example/v1/color?filter=purple",
		);
		expect(bad.status()).toBe(400);
	});
});
