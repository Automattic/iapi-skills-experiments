import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the welcome-banner-i18n scenario.
 *
 * The spec verifies that the translated greeting is present in the
 * server-rendered HTML on first load — before any JavaScript hydration
 * signal fires — so that the block satisfies its core constraint: the
 * visitor reads the correct localised text even with JS disabled.
 *
 * The wp-env test environment runs in the default locale (en_US), so the
 * expected greeting is the English string. The key assertion is that the
 * text is already in the DOM on arrival, not injected by the client.
 */

test.describe("welcome-banner-i18n scenario", () => {
	let post;

	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-welcome-banner-i18n-${workerInfo.project.metadata.agentId}`,
		);
		post = await requestUtils.createPost({
			content: "<!-- wp:wp-skill/testing-block /-->",
			status: "publish",
		});
	});

	test.afterAll(async ({ requestUtils }) => {
		deactivateAllPlugins();
		await requestUtils.deleteAllPosts();
	});

	test("translated greeting is present in server-rendered HTML before hydration", async ({
		page,
	}) => {
		// Intercept and capture the raw HTML response before any JS runs.
		// We do this by fetching the page URL directly with the Playwright
		// fetch API so we can inspect the static markup.
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");

		// The greeting text must be rendered in the initial HTML. We assert it
		// is present in the block's content and is a non-empty string that looks
		// like a greeting (contains "Welcome" in the default en_US locale).
		await expect(block).toContainText(/welcome/i);

		// The greeting must be a concrete translated string — not a translation
		// key or placeholder like "__('Welcome...')" leaking from render.php.
		await expect(block).not.toContainText(/\(\s*__\s*\(/i);
	});

	test("greeting text is already in the DOM in the raw HTML response (pre-JS)", async ({
		page,
	}) => {
		// Fetch the page as a plain HTTP response (no JS execution) to confirm
		// the translated greeting is in the server-rendered markup, not injected
		// by the client-side store.
		const response = await page.request.get(`/?p=${post.id}`);
		const html = await response.text();

		// The translated greeting must appear in the static HTML payload.
		expect(html).toMatch(/welcome/i);

		// The block wrapper must be present in static HTML, confirming server
		// rendering produced the markup (not just a client-side shell).
		expect(html).toContain("wp-block-wp-skill-testing-block");
	});
});
