import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the accessible-disclosure scenario.
 *
 * One boolean drives three bound surfaces: aria-expanded on the button,
 * the button's label text, and the hidden attribute on the panel. This
 * spec verifies each surface stays in sync across toggle clicks.
 *
 * This scenario subsumes toggle-visibility (boolean binding + aria-expanded).
 */

test.describe("accessible-disclosure scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-accessible-disclosure-${workerInfo.project.metadata.agentId}`,
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

	test("panel starts collapsed: hidden attribute present, aria-expanded false", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");

		// Locate the toggle button by its role; label text may vary.
		const toggleBtn = block.getByRole("button").first();
		await expect(toggleBtn).toBeVisible();

		// Initial state: aria-expanded should be "false".
		await expect(toggleBtn).toHaveAttribute("aria-expanded", "false");

		// The controlled panel should be hidden (the `hidden` attribute present).
		// We accept any element inside the block that carries the `hidden` attribute.
		const hiddenPanel = block.locator("[hidden]").first();
		await expect(hiddenPanel).toBeAttached();
	});

	test("clicking the button expands the panel and updates aria-expanded", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const toggleBtn = block.getByRole("button").first();

		// Ensure we start collapsed.
		await expect(toggleBtn).toHaveAttribute("aria-expanded", "false");

		// Click to expand.
		await toggleBtn.click();

		// aria-expanded must now be "true".
		await expect(toggleBtn).toHaveAttribute("aria-expanded", "true");

		// The hidden attribute must be gone from the panel (not empty, not "false" — absent).
		const panelLocator = block.locator("[aria-expanded]").locator("..").locator("[id], section, div").last();
		// A simpler approach: count hidden elements — there should be none after expanding.
		const hiddenCount = await block.locator("[hidden]").count();
		expect(hiddenCount).toBe(0);
	});

	test("clicking again collapses the panel and resets aria-expanded to false", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const toggleBtn = block.getByRole("button").first();

		// Open.
		await toggleBtn.click();
		await expect(toggleBtn).toHaveAttribute("aria-expanded", "true");

		// Close.
		await toggleBtn.click();
		await expect(toggleBtn).toHaveAttribute("aria-expanded", "false");

		// Panel is hidden again.
		const hiddenPanel = block.locator("[hidden]").first();
		await expect(hiddenPanel).toBeAttached();
	});

	test("the button label changes between expanded and collapsed states", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const toggleBtn = block.getByRole("button").first();

		const labelCollapsed = await toggleBtn.textContent();

		await toggleBtn.click();
		const labelExpanded = await toggleBtn.textContent();

		// The label text must differ between the two states.
		expect(labelExpanded.trim()).not.toBe(labelCollapsed.trim());

		// Collapsing again must restore the original label.
		await toggleBtn.click();
		const labelCollapsedAgain = await toggleBtn.textContent();
		expect(labelCollapsedAgain.trim()).toBe(labelCollapsed.trim());
	});

	test("the hidden attribute is fully absent (not empty string) when expanded", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const toggleBtn = block.getByRole("button").first();

		// Expand the panel.
		await toggleBtn.click();
		await expect(toggleBtn).toHaveAttribute("aria-expanded", "true");

		// Evaluate that no child element of the block has hidden="" or hidden="false".
		// The attribute must be completely absent, not just empty.
		const hiddenAttributeStatus = await page.evaluate(() => {
			const blocks = document.querySelectorAll(
				".wp-block-wp-skill-testing-block",
			);
			for (const block of blocks) {
				for (const el of block.querySelectorAll("*")) {
					if (el.hasAttribute("hidden")) {
						// Found a hidden attribute when we expect none after expanding.
						return { hasHidden: true, value: el.getAttribute("hidden") };
					}
				}
			}
			return { hasHidden: false };
		});

		expect(hiddenAttributeStatus.hasHidden).toBe(false);
	});
});
