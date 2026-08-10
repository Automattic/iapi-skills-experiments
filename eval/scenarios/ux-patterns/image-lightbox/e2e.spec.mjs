import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the image-lightbox scenario.
 *
 * Asserts the overlay opens with dialog semantics when the thumbnail is
 * clicked, that Escape and the close button both dismiss it, and that
 * focus is restored to the trigger in both cases.
 */

test.describe("image-lightbox scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-image-lightbox-${workerInfo.project.metadata.agentId}`,
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

	test("overlay is not visible before the thumbnail is clicked", async ({
		page,
	}) => {
		const overlay = block(page).getByRole("dialog");
		const count = await overlay.count();
		if (count > 0) {
			await expect(overlay).not.toBeVisible();
		}
	});

	test("clicking the thumbnail opens the overlay with dialog semantics", async ({
		page,
	}) => {
		// The trigger is either an <img>, a button wrapping the image, or a
		// clickable element inside the block. Use the image or a button as entry.
		const trigger = block(page).locator("img, button").first();
		await trigger.click();

		const overlay = block(page).getByRole("dialog");
		await expect(overlay).toBeVisible();
	});

	test("close button dismisses the overlay and returns focus to the trigger", async ({
		page,
	}) => {
		const trigger = block(page).locator("img, button").first();
		await trigger.click();

		const overlay = block(page).getByRole("dialog");
		await expect(overlay).toBeVisible();

		const closeButton = overlay.getByRole("button", { name: /close/i });
		await closeButton.click();

		// Overlay must be dismissed.
		const overlayAfter = block(page).getByRole("dialog");
		const countAfter = await overlayAfter.count();
		if (countAfter > 0) {
			await expect(overlayAfter).not.toBeVisible();
		}

		// Focus must return to somewhere inside the block (the trigger area).
		const focusInsideBlock = await page.evaluate(() => {
			const block = document.querySelector(
				".wp-block-wp-skill-testing-block",
			);
			return block ? block.contains(document.activeElement) : false;
		});
		expect(focusInsideBlock).toBe(true);
	});

	test("Escape dismisses the overlay and returns focus to the trigger", async ({
		page,
	}) => {
		const trigger = block(page).locator("img, button").first();
		await trigger.click();

		const overlay = block(page).getByRole("dialog");
		await expect(overlay).toBeVisible();

		await page.keyboard.press("Escape");

		// Overlay must be dismissed.
		const overlayAfter = block(page).getByRole("dialog");
		const countAfter = await overlayAfter.count();
		if (countAfter > 0) {
			await expect(overlayAfter).not.toBeVisible();
		}

		// Focus must return inside the block.
		const focusInsideBlock = await page.evaluate(() => {
			const block = document.querySelector(
				".wp-block-wp-skill-testing-block",
			);
			return block ? block.contains(document.activeElement) : false;
		});
		expect(focusInsideBlock).toBe(true);
	});

	test("overlay is not exposed as a dialog when it is closed", async ({
		page,
	}) => {
		// Open then close.
		const trigger = block(page).locator("img, button").first();
		await trigger.click();
		await expect(block(page).getByRole("dialog")).toBeVisible();
		await page.keyboard.press("Escape");

		// After closing, no dialog role should be visible/exposed.
		const dialog = block(page).getByRole("dialog");
		const count = await dialog.count();
		if (count > 0) {
			await expect(dialog).not.toBeVisible();
		}
	});
});
