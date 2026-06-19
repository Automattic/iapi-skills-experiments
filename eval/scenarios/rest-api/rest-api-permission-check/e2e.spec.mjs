import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../utils/wp-cli.mjs";

/**
 * E2E tests for the rest-api-permission-check scenario.
 *
 * Activates the agent-generated plugin and exercises the gated route via both
 * REST channels:
 *  - Anonymous half: uses the unauthenticated Playwright request context
 *    (`page.request`) and asserts HTTP 401.
 *  - Authenticated half: uses `requestUtils.rest()` (authenticated as admin)
 *    and asserts the returned body equals "This is private data.".
 *
 * No DOM interaction or post seeding is required.
 */

test.describe("rest-api-permission-check scenario", () => {
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-rest-api-permission-check-${workerInfo.project.metadata.agentId}`,
		);
	});

	test.afterAll(() => {
		deactivateAllPlugins();
	});

	test("GET /wp-json/example/v1/private returns 401 for anonymous requests and the private body for admins", async ({
		page,
		requestUtils,
	}) => {
		// Anonymous request — must be denied with 401.
		const denied = await page.request.get("/wp-json/example/v1/private");
		expect(denied.status()).toBe(401);

		// Authenticated administrator request — must return the private body.
		const body = await requestUtils.rest({ path: "/example/v1/private" });
		expect(body).toBe("This is private data.");
	});
});
