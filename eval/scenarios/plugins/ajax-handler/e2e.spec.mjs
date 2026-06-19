import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the ajax-handler scenario.
 *
 * Activates the agent-generated plugin and exercises the registered admin-ajax
 * handler via the authed admin channel:
 *  - Authenticated POST to `/wp-admin/admin-ajax.php?action=my_plugin_ping`
 *    using `requestUtils.request` (raw Playwright APIRequestContext carrying
 *    admin cookies), asserting the JSON response contains `"success": true`.
 *
 * Note: `check_ajax_referer` (nonce verification) is graded statically by the
 * judge against the produced PHP, since the e2e cannot mint a valid WordPress
 * ajax nonce independently. The e2e asserts the authed JSON success path.
 */

test.describe("ajax-handler scenario", () => {
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-ajax-handler-${workerInfo.project.metadata.agentId}`,
		);
	});

	test.afterAll(() => {
		deactivateAllPlugins();
	});

	test("authenticated POST to admin-ajax.php?action=my_plugin_ping returns JSON success", async ({
		requestUtils,
	}) => {
		// Authenticated admin POST via the raw request context (carries admin cookies).
		const res = await requestUtils.request.post(
			"/wp-admin/admin-ajax.php?action=my_plugin_ping",
		);

		const body = await res.json();

		// wp_send_json_success() always produces {"success":true,...}.
		expect(body.success).toBe(true);
	});
});
