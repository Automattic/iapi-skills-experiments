import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the accessible-tabs scenario.
 *
 * Asserts single-active tab selection, roving arrow-key navigation between
 * tabs, and correct ARIA roles and aria-selected attributes. All locators
 * are scoped to the testing-block wrapper so theme or page elements do not
 * interfere.
 */

test.describe("accessible-tabs scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-accessible-tabs-${workerInfo.project.metadata.agentId}`,
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

	test("first tab is active on load and its panel is the only one visible", async ({
		page,
	}) => {
		const tabs = block(page).getByRole("tab");
		const panels = block(page).getByRole("tabpanel");

		// First tab is selected; others are not.
		await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "true");
		await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "false");
		await expect(tabs.nth(2)).toHaveAttribute("aria-selected", "false");

		// Only the first panel is visible.
		await expect(panels.nth(0)).toBeVisible();
		await expect(panels.nth(1)).not.toBeVisible();
		await expect(panels.nth(2)).not.toBeVisible();
	});

	test("clicking a tab activates it, hides the previous panel, and shows the new one", async ({
		page,
	}) => {
		const tabs = block(page).getByRole("tab");
		const panels = block(page).getByRole("tabpanel");

		// Click the second tab ("Details").
		await tabs.nth(1).click();

		await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "false");
		await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
		await expect(tabs.nth(2)).toHaveAttribute("aria-selected", "false");

		await expect(panels.nth(0)).not.toBeVisible();
		await expect(panels.nth(1)).toBeVisible();
		await expect(panels.nth(2)).not.toBeVisible();
	});

	test("Right arrow key moves focus to the next tab and activates it immediately", async ({
		page,
	}) => {
		const tabs = block(page).getByRole("tab");
		const panels = block(page).getByRole("tabpanel");

		// Focus the first tab and press Right to move to the second.
		await tabs.nth(0).focus();
		await page.keyboard.press("ArrowRight");

		await expect(tabs.nth(1)).toBeFocused();
		await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
		await expect(panels.nth(1)).toBeVisible();
		await expect(panels.nth(0)).not.toBeVisible();
	});

	test("Left arrow key moves focus to the previous tab and activates it immediately", async ({
		page,
	}) => {
		const tabs = block(page).getByRole("tab");
		const panels = block(page).getByRole("tabpanel");

		// Start on the second tab, then press Left to return to the first.
		await tabs.nth(1).click();
		await tabs.nth(1).focus();
		await page.keyboard.press("ArrowLeft");

		await expect(tabs.nth(0)).toBeFocused();
		await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "true");
		await expect(panels.nth(0)).toBeVisible();
		await expect(panels.nth(1)).not.toBeVisible();
	});

	test("arrow-key navigation wraps around: Right from the last tab focuses the first", async ({
		page,
	}) => {
		const tabs = block(page).getByRole("tab");

		// Focus the last tab and press Right — should wrap to the first.
		await tabs.nth(2).click();
		await tabs.nth(2).focus();
		await page.keyboard.press("ArrowRight");

		await expect(tabs.nth(0)).toBeFocused();
		await expect(tabs.nth(0)).toHaveAttribute("aria-selected", "true");
	});

	test("Left arrow on the first tab wraps to the last tab", async ({
		page,
	}) => {
		const tabs = block(page).getByRole("tab");

		await tabs.nth(0).focus();
		await page.keyboard.press("ArrowLeft");

		await expect(tabs.nth(2)).toBeFocused();
		await expect(tabs.nth(2)).toHaveAttribute("aria-selected", "true");
	});

	test("each tab has the tab role and each panel has the tabpanel role", async ({
		page,
	}) => {
		// Role assertions are implicit in getByRole; additionally confirm the
		// tablist container exists to validate the full ARIA pattern.
		const tablist = block(page).getByRole("tablist");
		await expect(tablist).toBeVisible();

		const tabs = block(page).getByRole("tab");
		await expect(tabs).toHaveCount(3);

		const panels = block(page).getByRole("tabpanel");
		// All three panels must exist in the DOM (only visibility differs).
		await expect(panels).toHaveCount(3);
	});
});
