import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the image-carousel scenario.
 *
 * Verifies arrow-key navigation, including wrap-around at both ends of
 * the image collection.
 */

test.describe("image-carousel scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-image-carousel-${workerInfo.project.metadata.agentId}`,
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

	test("renders the first image on load", async ({ page }) => {
		const block = page.locator(".wp-block-wp-skill-testing-block");
		// The active image element should be visible.
		const activeImage = block.locator("img").first();
		await expect(activeImage).toBeVisible();
	});

	test("Right arrow key advances to the next image", async ({ page }) => {
		const block = page.locator(".wp-block-wp-skill-testing-block");

		// Focus the block so keyboard events are received.
		await block.focus();

		// Capture the initial src / alt to compare after navigation.
		const initialSrc = await block.locator("img").first().getAttribute("src");

		await page.keyboard.press("ArrowRight");

		// The displayed image should change after pressing Right.
		const newSrc = await block.locator("img").first().getAttribute("src");
		expect(newSrc).not.toBe(initialSrc);
	});

	test("Left arrow key moves back to the previous image", async ({ page }) => {
		const block = page.locator(".wp-block-wp-skill-testing-block");
		await block.focus();

		// Advance one step.
		await page.keyboard.press("ArrowRight");
		const secondSrc = await block.locator("img").first().getAttribute("src");

		// Go back — should show the first image again.
		await page.keyboard.press("ArrowLeft");
		const backSrc = await block.locator("img").first().getAttribute("src");
		expect(backSrc).not.toBe(secondSrc);
	});

	test("Right arrow wraps around from the last image to the first", async ({
		page,
	}) => {
		const block = page.locator(".wp-block-wp-skill-testing-block");
		await block.focus();

		// Record the initial (first) image source.
		const firstSrc = await block.locator("img").first().getAttribute("src");

		// Determine the total number of images by reading the indicator text
		// (expected to contain something like "1 of N" or "1 / N").
		const indicator = block.locator("[data-wp-text]").filter({ hasText: /of|\// });
		const indicatorText = await indicator.textContent();
		const totalMatch = indicatorText.match(/(\d+)\s*(of|\/)\s*(\d+)/i);
		const total = totalMatch ? parseInt(totalMatch[3], 10) : null;

		if (total !== null && total > 1) {
			// Navigate to the last image.
			for (let i = 1; i < total; i++) {
				await page.keyboard.press("ArrowRight");
			}
			const lastSrc = await block.locator("img").first().getAttribute("src");
			expect(lastSrc).not.toBe(firstSrc);

			// One more Right — should wrap back to the first image.
			await page.keyboard.press("ArrowRight");
			const wrappedSrc = await block.locator("img").first().getAttribute("src");
			expect(wrappedSrc).toBe(firstSrc);
		} else {
			// If indicator is absent, drive Left from index 0 to confirm wrap.
			await page.keyboard.press("ArrowLeft");
			const wrappedSrc = await block.locator("img").first().getAttribute("src");
			// The src must differ from the initial first image.
			expect(wrappedSrc).not.toBe(firstSrc);
		}
	});

	test("Left arrow wraps around from the first image to the last", async ({
		page,
	}) => {
		const block = page.locator(".wp-block-wp-skill-testing-block");
		await block.focus();

		// On the first image, pressing Left should wrap to the last.
		const firstSrc = await block.locator("img").first().getAttribute("src");
		await page.keyboard.press("ArrowLeft");
		const wrappedSrc = await block.locator("img").first().getAttribute("src");
		expect(wrappedSrc).not.toBe(firstSrc);
	});

	test("indicator updates after arrow-key navigation", async ({ page }) => {
		const block = page.locator(".wp-block-wp-skill-testing-block");
		await block.focus();

		const indicator = block.locator("[data-wp-text]").filter({ hasText: /of|\/|\d/ });
		const initialText = await indicator.first().textContent();

		await page.keyboard.press("ArrowRight");

		const updatedText = await indicator.first().textContent();
		expect(updatedText).not.toBe(initialText);
	});
});
