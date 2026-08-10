import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the viewport-width-display scenario.
 *
 * A window-level resize listener updates the displayed width value whenever
 * the viewport changes. Tests drive resize via page.setViewportSize and
 * assert the rendered text updates to match the new width.
 */

test.describe("viewport-width-display scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-viewport-width-display-${workerInfo.project.metadata.agentId}`,
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

	test("displays the current viewport width on load", async ({ page }) => {
		await page.setViewportSize({ width: 1024, height: 768 });
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		// The block must show a number that matches (or is close to) the viewport width.
		await expect(block).toContainText("1024");
	});

	test("displayed width updates after viewport resize", async ({ page }) => {
		await page.setViewportSize({ width: 1200, height: 768 });
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		await expect(block).toContainText("1200");

		// Resize to a different width.
		await page.setViewportSize({ width: 800, height: 600 });

		// The displayed value must update to reflect the new width.
		await expect(block).toContainText("800");
	});

	test("width updates again on a second resize", async ({ page }) => {
		await page.setViewportSize({ width: 1024, height: 768 });
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");

		// First resize.
		await page.setViewportSize({ width: 640, height: 480 });
		await expect(block).toContainText("640");

		// Second resize.
		await page.setViewportSize({ width: 1280, height: 900 });
		await expect(block).toContainText("1280");
	});

	test("resize does not cause a page navigation", async ({ page }) => {
		await page.setViewportSize({ width: 1024, height: 768 });
		await page.goto(`/?p=${post.id}`);

		const urlBefore = page.url();

		await page.setViewportSize({ width: 480, height: 720 });

		const block = page.locator(".wp-block-wp-skill-testing-block");
		await expect(block).toContainText("480");

		expect(page.url()).toBe(urlBefore);
	});
});
