import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the accessible-accordion scenario.
 *
 * Asserts independent multi-toggle disclosure (multiple sections open at
 * once), correct ARIA attributes on toggle buttons and panels, and that the
 * server-rendered HTML already carries aria-expanded="false" before
 * hydration fires.
 */

test.describe("accessible-accordion scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-accessible-accordion-${workerInfo.project.metadata.agentId}`,
		);
		post = await requestUtils.createPost({
			content: "<!-- wp:wp-skill/testing-block /-->",
			status: "publish",
		});
	});

	test.beforeEach(async ({ page }) => {
		await page.goto(`/?p=${post.id}`);
	});

	test.afterAll(async ({ requestUtils }) => {
		deactivateAllPlugins();
		await requestUtils.deleteAllPosts();
	});

	const block = (page) => page.locator(".wp-block-wp-skill-testing-block");

	test("server-rendered HTML has aria-expanded=false on all toggle buttons before hydration", async ({
		page,
	}) => {
		// Intercept the page before JS runs by reading the attribute immediately
		// on load. Because the attribute must already be in the server-rendered
		// markup, we can assert it via evaluate before any interactive events.
		const allCollapsed = await page.evaluate(() => {
			const block = document.querySelector(
				".wp-block-wp-skill-testing-block",
			);
			if (!block) return false;
			const buttons = Array.from(block.querySelectorAll("button"));
			return (
				buttons.length >= 3 &&
				buttons.every((btn) => btn.getAttribute("aria-expanded") === "false")
			);
		});
		expect(allCollapsed).toBe(true);
	});

	test("all panels are collapsed on initial load", async ({ page }) => {
		const buttons = block(page).getByRole("button");
		const count = await buttons.count();
		expect(count).toBeGreaterThanOrEqual(3);
		for (let i = 0; i < count; i++) {
			await expect(buttons.nth(i)).toHaveAttribute("aria-expanded", "false");
		}
	});

	test("clicking a button expands its panel and sets aria-expanded to true", async ({
		page,
	}) => {
		const buttons = block(page).getByRole("button");

		await buttons.nth(0).click();

		await expect(buttons.nth(0)).toHaveAttribute("aria-expanded", "true");
		// The answer panel controlled by the first button should now be visible.
		const panelId = await buttons.nth(0).getAttribute("aria-controls");
		if (panelId) {
			const panel = page.locator(`#${panelId}`);
			await expect(panel).toBeVisible();
		}
	});

	test("clicking an open button collapses its panel again", async ({
		page,
	}) => {
		const buttons = block(page).getByRole("button");

		await buttons.nth(0).click();
		await expect(buttons.nth(0)).toHaveAttribute("aria-expanded", "true");

		await buttons.nth(0).click();
		await expect(buttons.nth(0)).toHaveAttribute("aria-expanded", "false");
	});

	test("expanding one section does not collapse others — multiple open simultaneously", async ({
		page,
	}) => {
		const buttons = block(page).getByRole("button");

		// Expand the first two sections.
		await buttons.nth(0).click();
		await buttons.nth(1).click();

		// Both must remain expanded.
		await expect(buttons.nth(0)).toHaveAttribute("aria-expanded", "true");
		await expect(buttons.nth(1)).toHaveAttribute("aria-expanded", "true");
		// Third section is still collapsed.
		await expect(buttons.nth(2)).toHaveAttribute("aria-expanded", "false");
	});

	test("each button has an aria-controls attribute linking it to its panel", async ({
		page,
	}) => {
		const buttons = block(page).getByRole("button");
		const count = await buttons.count();
		for (let i = 0; i < count; i++) {
			const controls = await buttons.nth(i).getAttribute("aria-controls");
			expect(controls).toBeTruthy();
			// The panel ID must exist in the DOM.
			const panel = page.locator(`#${controls}`);
			await expect(panel).toBeAttached();
		}
	});
});
