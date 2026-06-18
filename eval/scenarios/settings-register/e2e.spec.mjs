import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../utils/wp-cli.mjs";

/**
 * E2E tests for the settings-register scenario.
 *
 * Asserts that the `my_plugin_tagline` setting surfaces in the WordPress
 * REST API settings endpoint with its registered default value when the
 * plugin is active.
 */

test.describe("settings-register scenario", () => {
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-settings-register-${workerInfo.project.metadata.agentId}`,
		);
	});

	test.afterAll(() => {
		deactivateAllPlugins();
	});

	test("my_plugin_tagline surfaces in /wp/v2/settings with default value", async ({
		requestUtils,
	}) => {
		const settings = await requestUtils.getSiteSettings();
		expect(settings.my_plugin_tagline).toBe("Hello world");
	});
});
