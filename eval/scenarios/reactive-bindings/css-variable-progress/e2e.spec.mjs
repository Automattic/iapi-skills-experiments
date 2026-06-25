import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the css-variable-progress scenario.
 *
 * The key assertion is that the inline CSS custom property value changes
 * reactively as the user clicks Grow/Shrink, not that a particular visual
 * rendering is achieved. We read the inline `style` attribute to confirm the
 * CSS variable is present and changes — this avoids depending on computed
 * styles which vary by theme.
 */

test.describe("css-variable-progress scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-css-variable-progress-${workerInfo.project.metadata.agentId}`,
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

	test("the bar element carries an inline CSS custom property", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		// The bar element should have an inline style containing a CSS custom property
		// (a name starting with "--").
		const barEl = block.locator("[style*='--']").first();
		await expect(barEl).toBeVisible();
	});

	test("clicking Grow changes the CSS custom property value", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const barEl = block.locator("[style*='--']").first();
		const growBtn = block.getByRole("button", { name: /grow/i });

		const styleBefore = await barEl.getAttribute("style");

		await growBtn.click();

		const styleAfter = await barEl.getAttribute("style");
		expect(styleAfter).not.toBe(styleBefore);
	});

	test("clicking Shrink changes the CSS custom property value", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const barEl = block.locator("[style*='--']").first();
		const growBtn = block.getByRole("button", { name: /grow/i });
		const shrinkBtn = block.getByRole("button", { name: /shrink/i });

		// Grow first so there is room to shrink.
		await growBtn.click();
		await growBtn.click();
		const styleAtPeak = await barEl.getAttribute("style");

		await shrinkBtn.click();
		const styleAfterShrink = await barEl.getAttribute("style");
		expect(styleAfterShrink).not.toBe(styleAtPeak);
	});

	test("the bar is clamped at 0 — Shrink has no effect below 0%", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const barEl = block.locator("[style*='--']").first();
		const shrinkBtn = block.getByRole("button", { name: /shrink/i });

		// Click Shrink many times — value must stay at its minimum.
		await shrinkBtn.click();
		await shrinkBtn.click();
		await shrinkBtn.click();
		const styleAtMin = await barEl.getAttribute("style");

		await shrinkBtn.click();
		const styleAfterExtraClick = await barEl.getAttribute("style");
		expect(styleAfterExtraClick).toBe(styleAtMin);
	});

	test("the bar is clamped at 100 — Grow has no effect above 100%", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const barEl = block.locator("[style*='--']").first();
		const growBtn = block.getByRole("button", { name: /grow/i });

		// Click Grow many times — value must stay at its maximum.
		for (let i = 0; i < 12; i++) {
			await growBtn.click();
		}
		const styleAtMax = await barEl.getAttribute("style");

		await growBtn.click();
		const styleAfterExtraClick = await barEl.getAttribute("style");
		expect(styleAfterExtraClick).toBe(styleAtMax);
	});
});
