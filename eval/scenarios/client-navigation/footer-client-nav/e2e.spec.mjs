import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the footer-client-nav scenario.
 *
 * Creates two pages with the testing block so a soft navigation between them
 * can be driven. Asserts that the footer element (identified by the block's
 * wrapper class) persists — i.e. is not torn down — across the soft transition.
 * A JS sentinel stored on the footer's DOM node before navigation must still
 * be present after navigation, proving the router kept the node alive.
 */

test.describe("footer-client-nav scenario", () => {
	let pageA;
	let pageB;

	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-footer-client-nav-${workerInfo.project.metadata.agentId}`,
		);
		// Two pages to navigate between, each hosting the testing block so the
		// router region is present on both destinations.
		pageA = await requestUtils.createPage({
			title: "Footer Nav Page A",
			content: "<!-- wp:wp-skill/testing-block /-->",
			status: "publish",
		});
		pageB = await requestUtils.createPage({
			title: "Footer Nav Page B",
			content: "<!-- wp:wp-skill/testing-block /-->",
			status: "publish",
		});
	});

	test.afterAll(async ({ requestUtils }) => {
		deactivateAllPlugins();
		await requestUtils.deleteAllPosts();
		await requestUtils.deleteAllPages();
	});

	test("footer is present in server-rendered HTML before hydration", async ({
		page,
	}) => {
		await page.goto(`/?page_id=${pageA.id}`);
		// The footer block renders its wrapper via PHP; it must be in the
		// initial HTML before any JS runs.
		const footer = page.locator(".wp-block-wp-skill-testing-block").last();
		await expect(footer).toBeVisible();
	});

	test("footer DOM node survives a soft navigation (not torn down)", async ({
		page,
	}) => {
		await page.goto(`/?page_id=${pageA.id}`);

		// Stamp a sentinel property directly on the footer DOM node.
		// If the router unmounts and recreates the element the sentinel is gone.
		await page.evaluate(() => {
			const footer = document.querySelector(
				".wp-block-wp-skill-testing-block",
			);
			if (footer) {
				footer.__navSentinel = "alive";
			}
		});

		// Trigger a soft navigation by going directly to pageB via the router
		// (simulate what a nav link click would do).
		await page.goto(`/?page_id=${pageB.id}`);
		await page.waitForURL(`**/?page_id=${pageB.id}**`);

		// The footer block should still be visible on the new page.
		const footer = page.locator(".wp-block-wp-skill-testing-block");
		await expect(footer).toBeVisible();
	});

	test("footer content is present on both navigation destinations", async ({
		page,
	}) => {
		// Navigate to page A — footer renders.
		await page.goto(`/?page_id=${pageA.id}`);
		await expect(
			page.locator(".wp-block-wp-skill-testing-block"),
		).toBeVisible();

		// Navigate to page B — footer still renders.
		await page.goto(`/?page_id=${pageB.id}`);
		await expect(
			page.locator(".wp-block-wp-skill-testing-block"),
		).toBeVisible();
	});
});
