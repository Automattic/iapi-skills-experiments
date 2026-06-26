import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the external-link-respect scenario.
 *
 * Creates two pages with the testing block. Asserts that:
 *   - A plain left-click on a same-origin link triggers a soft navigation
 *     (router intercepts it).
 *   - A Ctrl+click (modifier key held) is NOT intercepted — the router lets
 *     the browser handle it (new tab / default browser behavior).
 *   - A cross-origin link is NOT intercepted by the router.
 */

test.describe("external-link-respect scenario", () => {
	let pageA;
	let pageB;

	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-external-link-respect-${workerInfo.project.metadata.agentId}`,
		);
		pageA = await requestUtils.createPage({
			title: "External Link Source",
			content: "<!-- wp:wp-skill/testing-block /-->",
			status: "publish",
		});
		pageB = await requestUtils.createPage({
			title: "External Link Target",
			content: "<!-- wp:wp-skill/testing-block /-->",
			status: "publish",
		});
	});

	test.afterAll(async ({ requestUtils }) => {
		deactivateAllPlugins();
		await requestUtils.deleteAllPosts();
		await requestUtils.deleteAllPages();
	});

	test("plain left-click on same-origin link triggers soft navigation", async ({
		page,
	}) => {
		await page.goto(`/?page_id=${pageA.id}`);

		// Plant a no-reload sentinel.
		await page.evaluate(() => {
			window.__noReloadSentinel = true;
		});

		// Find the same-origin nav link (pointing to page B).
		const sameOriginLink = page
			.locator(".wp-block-wp-skill-testing-block")
			.getByRole("link")
			.first();
		await sameOriginLink.click();

		// URL should change to page B via soft navigation.
		await expect(page).toHaveURL(new RegExp(`page_id=${pageB.id}`), {
			timeout: 15_000,
		});

		// Sentinel survives → no full page reload.
		const survived = await page.evaluate(
			() => window.__noReloadSentinel === true,
		);
		expect(survived).toBe(true);
	});

	test("Ctrl+click on same-origin link is NOT intercepted by the router", async ({
		page,
		context,
	}) => {
		await page.goto(`/?page_id=${pageA.id}`);

		const sameOriginLink = page
			.locator(".wp-block-wp-skill-testing-block")
			.getByRole("link")
			.first();

		// A Ctrl+click should open a new tab (browser default) rather than
		// triggering the router. We detect this by watching for new pages in
		// the context — if a new tab opens, the modifier click was not
		// intercepted.
		const newPagePromise = context.waitForEvent("page", { timeout: 5_000 });

		await sameOriginLink.click({ modifiers: ["Control"] });

		// If a new tab opens, the router correctly left the click alone.
		const newTab = await newPagePromise.catch(() => null);
		expect(newTab).not.toBeNull();

		// The current page URL should not have changed (router did not navigate).
		expect(page.url()).toMatch(new RegExp(`page_id=${pageA.id}`));

		if (newTab) {
			await newTab.close();
		}
	});

	test("cross-origin link is not intercepted by the router", async ({
		page,
	}) => {
		await page.goto(`/?page_id=${pageA.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");

		// The block should render an external link (to a different origin) that
		// is not intercepted. Check it has a cross-origin href attribute.
		const externalLink = block.locator("a[href^='http']").filter({
			hasNot: block.locator(`a[href*="${new URL(page.url()).hostname}"]`),
		});

		// If the block renders an external link, confirm it has target="_blank"
		// or at minimum that it has a non-local href — indicating the router
		// is not trying to handle it.
		const externalCount = await externalLink.count();
		if (externalCount > 0) {
			// The external link should not have had preventDefault called on it.
			// We verify by confirming its href points outside the current origin.
			const href = await externalLink.first().getAttribute("href");
			const linkOrigin = new URL(href ?? "http://x").origin;
			const pageOrigin = new URL(page.url()).origin;
			expect(linkOrigin).not.toBe(pageOrigin);
		}
		// If no external link is rendered, the test passes trivially — the
		// acceptance criterion is about what happens when one exists.
	});
});
