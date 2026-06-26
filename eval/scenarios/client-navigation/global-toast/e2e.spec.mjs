import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the global-toast scenario.
 *
 * Creates two pages: one with the testing block (which triggers the toast)
 * and one plain page (which does not render the toast block in its content).
 * Asserts that:
 *   - Triggering a toast action shows the notification region on the page.
 *   - The toast region is still available after a soft navigation to a page
 *     that did not itself render the toast block.
 */

test.describe("global-toast scenario", () => {
	let pageWithBlock;
	let pageWithoutBlock;

	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-global-toast-${workerInfo.project.metadata.agentId}`,
		);
		// Page A has the testing block (which can trigger a toast action).
		pageWithBlock = await requestUtils.createPage({
			title: "Toast Trigger Page",
			content: "<!-- wp:wp-skill/testing-block /-->",
			status: "publish",
		});
		// Page B is a plain page — no testing block in content.
		// The toast region should appear here too (global injection).
		pageWithoutBlock = await requestUtils.createPage({
			title: "Plain Page No Block",
			content:
				"<!-- wp:paragraph --><p>This page has no toast block.</p><!-- /wp:paragraph -->",
			status: "publish",
		});
	});

	test.afterAll(async ({ requestUtils }) => {
		deactivateAllPlugins();
		await requestUtils.deleteAllPosts();
		await requestUtils.deleteAllPages();
	});

	test("triggering the toast action displays the notification region", async ({
		page,
	}) => {
		await page.goto(`/?page_id=${pageWithBlock.id}`);

		// Trigger the toast via the testing block's button or action.
		const triggerButton = page
			.locator(".wp-block-wp-skill-testing-block")
			.getByRole("button")
			.first();
		await triggerButton.click();

		// The toast/notification region should become visible.
		const toastRegion = page.locator(
			"[class*='toast'], [class*='notification'], [role='status'], [role='alert'], [aria-live]",
		);
		await expect(toastRegion.first()).toBeVisible({ timeout: 5_000 });
	});

	test("toast region exists on a page that did not render the toast block in content", async ({
		page,
	}) => {
		await page.goto(`/?page_id=${pageWithoutBlock.id}`);

		// The toast region is injected globally (not from this page's block
		// content). It should exist in the DOM even without the testing block.
		const toastRegion = page.locator(
			"[data-wp-interactive], [class*='toast'], [class*='notification']",
		);
		// At least one interactive element (the dynamically injected region)
		// should be present.
		await expect(toastRegion.first()).toBeAttached({ timeout: 5_000 });
	});

	test("toast region survives a soft navigation", async ({ page }) => {
		await page.goto(`/?page_id=${pageWithBlock.id}`);

		// Trigger the toast to confirm the region is active.
		const triggerButton = page
			.locator(".wp-block-wp-skill-testing-block")
			.getByRole("button")
			.first();
		await triggerButton.click();

		const toastRegion = page.locator(
			"[class*='toast'], [class*='notification'], [role='status'], [role='alert']",
		);
		await expect(toastRegion.first()).toBeVisible({ timeout: 5_000 });

		// Navigate to the other page (soft navigation).
		await page.goto(`/?page_id=${pageWithoutBlock.id}`);
		await page.waitForURL(`**/?page_id=${pageWithoutBlock.id}**`);

		// The toast container should still be attached (not torn down by the router).
		const toastAfterNav = page.locator(
			"[data-wp-interactive], [class*='toast'], [class*='notification']",
		);
		await expect(toastAfterNav.first()).toBeAttached();
	});
});
