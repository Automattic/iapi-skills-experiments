import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the filter-body-class scenario.
 */

test.describe("filter body class scenario", () => {
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		// Ensure the plugin is active before tests run.
		await requestUtils.activatePlugin(
			`plugin-filter-body-class-${workerInfo.project.metadata.agentId}`,
		);
	});

	test.afterAll(() => {
		deactivateAllPlugins();
	});

	test("body element carries the custom CSS class on the front end", async ({
		page,
	}) => {
		await page.goto("/");
		await expect(page.locator("body")).toHaveClass(/my-custom-class/);
	});
});
