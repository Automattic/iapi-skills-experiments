import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { wpCli, deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the wp-cli-custom-command scenario.
 *
 * Activates the agent-generated plugin and exercises the custom WP-CLI command
 * via the wpCli() helper with stdio:"pipe", asserting that the pinned token
 * appears in the captured stdout.
 *
 * No DOM interaction or REST request is required — the assertion channel is
 * CLI stdout exclusively.
 */

test.describe("wp-cli-custom-command scenario", () => {
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-wp-cli-custom-command-${workerInfo.project.metadata.agentId}`,
		);
	});

	test.afterAll(() => {
		deactivateAllPlugins();
	});

	test('`wp my-plugin hello` prints "Hello from my-plugin" to stdout', () => {
		const out = wpCli(["my-plugin", "hello"], { stdio: "pipe" });
		expect(out).toContain("Hello from my-plugin");
	});
});
