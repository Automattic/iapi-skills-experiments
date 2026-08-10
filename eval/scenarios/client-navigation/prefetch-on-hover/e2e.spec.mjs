import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the prefetch-on-hover scenario.
 *
 * Creates two pages with the testing block. Asserts that:
 *   - Hovering a navigation link triggers a network request for the target
 *     page (prefetch).
 *   - Clicking the link after hovering still completes a smooth soft
 *     navigation — URL changes without a full reload.
 */

test.describe("prefetch-on-hover scenario", () => {
	let pageA;
	let pageB;

	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-prefetch-on-hover-${workerInfo.project.metadata.agentId}`,
		);
		pageA = await requestUtils.createPage({
			title: "Prefetch Page A",
			content: "<!-- wp:wp-skill/testing-block /-->",
			status: "publish",
		});
		pageB = await requestUtils.createPage({
			title: "Prefetch Page B",
			content: "<!-- wp:wp-skill/testing-block /-->",
			status: "publish",
		});
	});

	test.afterAll(async ({ requestUtils }) => {
		deactivateAllPlugins();
		await requestUtils.deleteAllPosts();
		await requestUtils.deleteAllPages();
	});

	test("hovering a nav link triggers a prefetch request for the target page", async ({
		page,
	}) => {
		await page.goto(`/?page_id=${pageA.id}`);

		// Collect all outgoing network requests while we hover.
		const prefetchedUrls = [];
		page.on("request", (req) => {
			prefetchedUrls.push(req.url());
		});

		const navLink = page
			.locator(".wp-block-wp-skill-testing-block")
			.getByRole("link")
			.first();
		const linkHref = await navLink.getAttribute("href");

		// Hover the link to trigger prefetch.
		await navLink.hover();

		// Give the prefetch a moment to fire.
		await expect
			.poll(
				() => prefetchedUrls.some((url) => url.includes(linkHref ?? "")),
				{ timeout: 5000 },
			)
			.toBe(true);
	});

	test("clicking after hover completes a soft navigation to the target page", async ({
		page,
	}) => {
		await page.goto(`/?page_id=${pageA.id}`);

		// Plant a no-reload sentinel — survives a soft nav, wiped by a full reload.
		await page.evaluate(() => {
			window.__noReloadSentinel = true;
		});

		const navLink = page
			.locator(".wp-block-wp-skill-testing-block")
			.getByRole("link")
			.first();

		// Hover first to trigger prefetch, then click.
		await navLink.hover();
		await navLink.click();

		// URL should have changed (soft navigation landed).
		await expect(page).toHaveURL(new RegExp(`page_id=${pageB.id}`));

		// Sentinel survives → no full page reload.
		const survived = await page.evaluate(
			() => window.__noReloadSentinel === true,
		);
		expect(survived).toBe(true);
	});

	test("navigation links are real anchors with valid href (no-JS fallback)", async ({
		page,
	}) => {
		await page.goto(`/?page_id=${pageA.id}`);

		const navLinks = page
			.locator(".wp-block-wp-skill-testing-block")
			.getByRole("link");
		const count = await navLinks.count();
		expect(count).toBeGreaterThan(0);

		// Every link must have a non-empty href.
		for (let i = 0; i < count; i++) {
			const href = await navLinks.nth(i).getAttribute("href");
			expect(href).toBeTruthy();
		}
	});
});
