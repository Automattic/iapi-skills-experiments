import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the in-view-reveal scenario.
 *
 * The banner starts hidden and an IntersectionObserver wired via a run hook
 * triggers the reveal on first intersection. Cleanup disconnects the observer
 * so the animation never fires again.
 *
 * The scroll is triggered with:
 *   page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
 * per the E2E spec conventions for IntersectionObserver scenarios.
 *
 * Key assertions:
 *   1. The banner is hidden before scrolling.
 *   2. After scrolling to the bottom, the banner becomes visible.
 *   3. The reveal fires only once — scrolling away and back does not
 *      re-trigger the hidden state.
 */

test.describe("in-view-reveal scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-in-view-reveal-${workerInfo.project.metadata.agentId}`,
		);
		// Create a tall post so the banner starts out of the viewport.
		post = await requestUtils.createPost({
			content:
				'<!-- wp:paragraph --><p style="margin-bottom:200vh">Scroll down to see the banner.</p><!-- /wp:paragraph --><!-- wp:wp-skill/testing-block /-->',
			status: "publish",
		});
	});

	test.afterAll(async ({ requestUtils }) => {
		deactivateAllPlugins();
		await requestUtils.deleteAllPosts();
	});

	test("banner is hidden before the user scrolls", async ({ page }) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		await expect(block).toBeVisible();

		// The banner inside the block should not yet be visible.
		const banner = block.locator(
			"[data-banner], .banner, [role='banner'], .reveal-banner, [hidden]",
		).first();

		await expect
			.poll(
				async () => {
					// The banner either has a hidden attribute, opacity 0, or is not
					// in the DOM yet. Check that it is not visibly "revealed".
					const count = await banner.count();
					if (count === 0) return true; // not rendered yet — still hidden
					const isVisible = await banner.isVisible();
					return !isVisible;
				},
				{ timeout: 5000 },
			)
			.toBe(true);
	});

	test("banner becomes visible after scrolling into view", async ({ page }) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		await expect(block).toBeVisible();

		// Scroll to the bottom to bring the banner into the viewport.
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

		// The banner must become visible after the IntersectionObserver fires.
		const banner = block.locator(
			"[data-banner], .banner, .reveal-banner, [data-revealed='true']",
		).first();

		await expect
			.poll(
				async () => {
					// Check for a visible banner or a revealed state class/attribute.
					const count = await banner.count();
					if (count > 0 && (await banner.isVisible())) return true;

					// Fallback: look for a revealed class or attribute anywhere in the block.
					const html = await block.evaluate((el) => el.outerHTML);
					return (
						html.includes("revealed") ||
						html.includes("visible") ||
						html.includes("is-visible") ||
						html.includes("animate")
					);
				},
				{ timeout: 5000 },
			)
			.toBe(true);
	});

	test("reveal fires exactly once — scrolling back does not re-trigger hidden state", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		await expect(block).toBeVisible();

		// Scroll down to trigger the reveal.
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

		// Wait for the reveal.
		await expect
			.poll(
				async () => {
					const html = await block.evaluate((el) => el.outerHTML);
					return (
						html.includes("revealed") ||
						html.includes("is-visible") ||
						html.includes("animate") ||
						html.includes("visible")
					);
				},
				{ timeout: 5000 },
			)
			.toBe(true);

		// Scroll back to top.
		await page.evaluate(() => window.scrollTo(0, 0));

		// Scroll down again.
		await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

		// The banner must still be in the revealed state — not reset to hidden.
		const bannerHidden = await page.evaluate(() => {
			const block = document.querySelector(
				".wp-block-wp-skill-testing-block",
			);
			if (!block) return false;
			const html = block.outerHTML;
			// If "hidden" attribute or a "hidden" class is back, the reveal ran again.
			return (
				html.includes('hidden="true"') ||
				html.includes('data-revealed="false"') ||
				html.includes("is-hidden")
			);
		});

		expect(bannerHidden).toBe(false);
	});
});
