import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the page-header-server-sync scenario.
 *
 * Creates two pages each seeding a different section label (via the testing
 * block). Asserts that:
 *   - The section label updates to the destination page's server value after
 *     a soft navigation.
 *   - A client-side "compact view" toggle state persists across the navigation
 *     (not reset by the server state refresh).
 */

test.describe("page-header-server-sync scenario", () => {
	let pageA;
	let pageB;

	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-page-header-server-sync-${workerInfo.project.metadata.agentId}`,
		);
		// Two pages — each page's PHP will seed a different section label.
		pageA = await requestUtils.createPage({
			title: "Header Sync Page A",
			content: "<!-- wp:wp-skill/testing-block /-->",
			status: "publish",
		});
		pageB = await requestUtils.createPage({
			title: "Header Sync Page B",
			content: "<!-- wp:wp-skill/testing-block /-->",
			status: "publish",
		});
	});

	test.afterAll(async ({ requestUtils }) => {
		deactivateAllPlugins();
		await requestUtils.deleteAllPosts();
		await requestUtils.deleteAllPages();
	});

	test("server-provided section label is present on initial page load", async ({
		page,
	}) => {
		await page.goto(`/?page_id=${pageA.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		// The section label (a server-seeded value) must be visible.
		// It could be in a heading, paragraph, or a dedicated element.
		const sectionLabel = block.locator(
			"[data-section-label], [class*='section'], h1, h2, h3, [class*='label']",
		);
		await expect(sectionLabel.first()).toBeVisible();
	});

	test("compact view toggle persists across a soft navigation", async ({
		page,
	}) => {
		await page.goto(`/?page_id=${pageA.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");

		// Activate the compact view toggle.
		const compactToggle = block.getByRole("button", {
			name: /compact|toggle|view/i,
		});
		await compactToggle.click();

		// Capture the toggled state — look for a class or attribute that marks
		// the compact mode as active.
		const isCompactBefore = await block.evaluate((el) =>
			el.classList.contains("is-compact") ||
			el.getAttribute("data-compact") === "true",
		);
		// The toggle should have changed some visible state.
		expect(isCompactBefore).toBeTruthy();

		// Navigate to page B via soft navigation.
		const navLink = block.getByRole("link").first();
		await navLink.click();
		await expect(page).toHaveURL(new RegExp(`page_id=${pageB.id}`), {
			timeout: 15_000,
		});

		// After navigation the compact state should still be active.
		const blockAfterNav = page.locator(".wp-block-wp-skill-testing-block");
		const isCompactAfter = await blockAfterNav.evaluate((el) =>
			el.classList.contains("is-compact") ||
			el.getAttribute("data-compact") === "true",
		);
		expect(isCompactAfter).toBe(isCompactBefore);
	});

	test("server-provided section label updates after a soft navigation", async ({
		page,
	}) => {
		await page.goto(`/?page_id=${pageA.id}`);

		const blockA = page.locator(".wp-block-wp-skill-testing-block");
		const labelA = await blockA
			.locator(
				"[data-section-label], [class*='section-label'], [class*='label']",
			)
			.first()
			.textContent();

		// Navigate to page B.
		const navLink = blockA.getByRole("link").first();
		await navLink.click();
		await expect(page).toHaveURL(new RegExp(`page_id=${pageB.id}`), {
			timeout: 15_000,
		});

		const blockB = page.locator(".wp-block-wp-skill-testing-block");
		const labelB = await blockB
			.locator(
				"[data-section-label], [class*='section-label'], [class*='label']",
			)
			.first()
			.textContent();

		// The label should have changed to reflect the new page's server value.
		expect(labelB).not.toBe(labelA);
	});
});
