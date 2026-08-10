import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the abilities-api-register scenario.
 *
 * Activates the agent-generated plugin and asserts that the pinned ability id
 * (`my-plugin/greeting`) appears in the list returned by the site's authenticated
 * data API endpoint for available abilities.
 *
 * REST surface key facts:
 *  - Namespace: wp-abilities/v1
 *  - LIST endpoint: GET /wp-json/wp-abilities/v1/abilities — bare JSON array,
 *    each item has a `name` field.
 *  - ALL endpoints require an authenticated user; anonymous requests return 401.
 *  - Abilities must set meta.show_in_rest => true to appear in the list.
 *
 * No DOM interaction or post seeding is required.
 */

test.describe("abilities-api-register scenario", () => {
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-register-${workerInfo.project.metadata.agentId}`,
		);
	});

	test.afterAll(() => {
		deactivateAllPlugins();
	});

	test("my-plugin/greeting ability is listed over the authenticated REST surface and anonymous access is denied", async ({
		page,
		requestUtils,
	}) => {
		// Anonymous request — must be denied with 401 (all abilities endpoints are auth-gated).
		const denied = await page.request.get(
			"/wp-json/wp-abilities/v1/abilities",
		);
		expect(denied.status()).toBe(401);

		// Authenticated administrator request — must return an array that includes
		// the pinned ability id registered by the agent.
		const abilities = await requestUtils.rest({
			path: "/wp-abilities/v1/abilities",
		});
		expect(Array.isArray(abilities)).toBe(true);
		const names = abilities.map((entry) => entry.name);
		expect(names).toContain("my-plugin/greeting");
	});
});
