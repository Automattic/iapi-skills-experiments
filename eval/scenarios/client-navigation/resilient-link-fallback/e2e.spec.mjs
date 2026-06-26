import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the resilient-link-fallback scenario.
 *
 * Creates a source page with the testing block and a target page. Intercepts
 * requests to the target page URL at the network level to force a fetch failure,
 * then asserts that the block renders a visible fallback error panel rather than
 * breaking silently.
 */

test.describe("resilient-link-fallback scenario", () => {
	let pageA;
	let pageB;

	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-resilient-link-fallback-${workerInfo.project.metadata.agentId}`,
		);
		pageA = await requestUtils.createPage({
			title: "Resilient Nav Source",
			content: "<!-- wp:wp-skill/testing-block /-->",
			status: "publish",
		});
		pageB = await requestUtils.createPage({
			title: "Resilient Nav Target",
			content: "<!-- wp:wp-skill/testing-block /-->",
			status: "publish",
		});
	});

	test.afterAll(async ({ requestUtils }) => {
		deactivateAllPlugins();
		await requestUtils.deleteAllPosts();
		await requestUtils.deleteAllPages();
	});

	test("navigation link renders as a real anchor with href", async ({
		page,
	}) => {
		await page.goto(`/?page_id=${pageA.id}`);

		const navLink = page
			.locator(".wp-block-wp-skill-testing-block")
			.getByRole("link")
			.first();
		await expect(navLink).toBeVisible();

		const href = await navLink.getAttribute("href");
		expect(href).toBeTruthy();
	});

	test("fallback error panel renders when the fetch for the target page fails", async ({
		page,
	}) => {
		await page.goto(`/?page_id=${pageA.id}`);

		// Intercept requests for page B and make them fail with a network error
		// to simulate a fetch failure inside the router's navigate call.
		await page.route(`**/?page_id=${pageB.id}**`, (route) => {
			route.abort("failed");
		});

		// Click the navigation link pointing to page B.
		const navLink = page
			.locator(".wp-block-wp-skill-testing-block")
			.getByRole("link")
			.first();
		await navLink.click();

		// The block should display a visible fallback / error panel.
		// The fallback content is rendered where the new page content would have
		// appeared; look for any visible text indicating an error state.
		const block = page.locator("[data-wp-router-region]");
		await expect(
			block.locator(
				"[class*='error'], [class*='fallback'], [role='alert'], [aria-live]",
			),
		).toBeVisible({ timeout: 10_000 });
	});

	test("page still shows something useful after a failed navigation (not blank)", async ({
		page,
	}) => {
		await page.goto(`/?page_id=${pageA.id}`);

		await page.route(`**/?page_id=${pageB.id}**`, (route) => {
			route.abort("failed");
		});

		const navLink = page
			.locator(".wp-block-wp-skill-testing-block")
			.getByRole("link")
			.first();
		await navLink.click();

		// The router region must not be empty after a failed navigation.
		const region = page.locator("[data-wp-router-region]");
		await expect(region).not.toBeEmpty();
	});
});
