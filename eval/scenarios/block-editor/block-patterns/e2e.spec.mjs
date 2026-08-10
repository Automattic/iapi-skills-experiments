import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the block-editor-block-patterns scenario.
 *
 * Verifies that a block pattern registered via `register_block_pattern` on
 * the `init` hook under the pinned name `my-plugin/hero` is listed by name
 * at the authenticated block-patterns REST endpoint
 * (`/wp/v2/block-patterns/patterns`).
 *
 * The endpoint requires `edit_posts` capability and therefore uses the
 * authed `requestUtils` channel (admin app-password credentials) rather than
 * an anonymous page request.
 */

test.describe("block editor block patterns scenario", () => {
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-block-patterns-${workerInfo.project.metadata.agentId}`,
		);
	});

	test.afterAll(() => {
		deactivateAllPlugins();
	});

	test("registered pattern my-plugin/hero is listed at the patterns REST endpoint", async ({
		requestUtils,
	}) => {
		// The block-patterns endpoint requires edit_posts — use the authed channel.
		const patterns = await requestUtils.rest({
			path: "/wp/v2/block-patterns/patterns",
		});

		expect(Array.isArray(patterns)).toBe(true);

		const hero = patterns.find((p) => p.name === "my-plugin/hero");
		expect(hero).toBeDefined();
	});
});
