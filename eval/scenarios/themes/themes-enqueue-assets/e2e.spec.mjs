import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the themes-enqueue-assets scenario.
 */

test.describe("themes-enqueue-assets scenario", () => {
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		// Ensure the plugin is active before tests run.
		await requestUtils.activatePlugin(
			`plugin-themes-enqueue-assets-${workerInfo.project.metadata.agentId}`,
		);
	});

	test.afterAll(() => {
		deactivateAllPlugins();
	});

	test("stylesheet and script for the shared handle appear on the front-end home page", async ({
		page,
	}) => {
		await page.goto("/");
		await expect(page.locator("link#themes-frontend-assets-css")).toBeAttached();
		await expect(page.locator("script#themes-frontend-assets-js")).toBeAttached();
	});
});
