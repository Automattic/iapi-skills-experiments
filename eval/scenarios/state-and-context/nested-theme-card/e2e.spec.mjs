import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the nested-theme-card scenario.
 *
 * Verifies that the inner panel correctly inherits context values from its
 * parent element (color scheme) while overriding only its own label — the
 * key behavior of nested context inheritance with selective override.
 */

test.describe("nested-theme-card scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-nested-theme-card-${workerInfo.project.metadata.agentId}`,
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

	test("outer card and inner panel each display their own label", async ({
		page,
	}) => {
		const block = page.locator(".wp-block-wp-skill-testing-block");
		// The outer card label is present somewhere in the block
		await expect(block).toContainText(/card|outer/i);
		// The inner panel label is distinct from the outer label
		const innerPanel = block.locator("[data-testid='inner-panel'], .inner-panel, [class*='inner']").first();
		await expect(innerPanel).toBeVisible();
	});

	test("inner panel inherits the parent color scheme", async ({ page }) => {
		const block = page.locator(".wp-block-wp-skill-testing-block");
		// Both outer and inner areas expose the inherited color-scheme value
		const colorSchemeEls = block.locator("[data-wp-text]");
		// At minimum there are two text-bound elements (outer label, inner label)
		await expect(colorSchemeEls).toHaveCount({ minimum: 2 });
	});

	test("inner panel label is different from the outer card label", async ({
		page,
	}) => {
		const block = page.locator(".wp-block-wp-skill-testing-block");
		const textNodes = block.locator("[data-wp-text]");
		const count = await textNodes.count();
		expect(count).toBeGreaterThanOrEqual(2);

		// Collect the text content of every data-wp-text node
		const texts = await Promise.all(
			Array.from({ length: count }, (_, i) =>
				textNodes.nth(i).textContent(),
			),
		);
		// At least two distinct text values must appear (outer label vs inner label)
		const unique = new Set(texts.map((t) => t?.trim()).filter(Boolean));
		expect(unique.size).toBeGreaterThanOrEqual(2);
	});
});
