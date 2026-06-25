import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the classic-theme-banner scenario.
 *
 * This scenario is the sole exception to the `wp-skill/testing-block` convention:
 * the plugin hooks `wp_footer` and emits the interactive banner HTML directly,
 * calling `wp_interactivity_process_directives()` outside the block pipeline.
 * The spec therefore creates a plain post (no testing-block in content) and
 * locates the banner by its `data-wp-interactive` attribute or a distinctive class.
 */

test.describe("classic-theme-banner scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-classic-theme-banner-${workerInfo.project.metadata.agentId}`,
		);
		// A plain post — no testing-block markup needed; the plugin hooks wp_footer.
		post = await requestUtils.createPost({
			content: "Test post content.",
			status: "publish",
		});
	});

	test.afterAll(async ({ requestUtils }) => {
		deactivateAllPlugins();
		await requestUtils.deleteAllPosts();
	});

	test("banner is visible on page load", async ({ page }) => {
		await page.goto(`/?p=${post.id}`);

		// Locate the banner by its data-wp-interactive attribute — not by the
		// testing-block wrapper (this is the approved off-convention selector).
		const banner = page.locator("[data-wp-interactive]").filter({
			has: page.locator("button", { hasText: /dismiss/i }),
		});

		await expect(banner).toBeVisible();
	});

	test("clicking Dismiss hides the banner without a page reload", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const banner = page.locator("[data-wp-interactive]").filter({
			has: page.locator("button", { hasText: /dismiss/i }),
		});

		await expect(banner).toBeVisible();

		// Track navigation events — none should fire on dismiss.
		let navigated = false;
		page.on("framenavigated", () => {
			navigated = true;
		});

		await page.getByRole("button", { name: /dismiss/i }).click();

		await expect(banner).toBeHidden();
		expect(navigated).toBe(false);
	});
});
