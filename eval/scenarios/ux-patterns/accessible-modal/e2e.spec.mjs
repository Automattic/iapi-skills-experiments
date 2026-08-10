import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the accessible-modal scenario.
 *
 * Asserts that role="dialog" is present only while the modal is open,
 * that keyboard focus is trapped within the dialog, that Escape closes the
 * modal and restores focus to the trigger button, and that the Close button
 * also dismisses the modal and returns focus to the trigger.
 */

test.describe("accessible-modal scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-accessible-modal-${workerInfo.project.metadata.agentId}`,
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

	test("modal dialog is not present or not visible before the trigger is clicked", async ({
		page,
	}) => {
		// role="dialog" must be absent or not visible when the modal is closed.
		const dialog = block(page).getByRole("dialog");
		const count = await dialog.count();
		if (count > 0) {
			// If the element exists in the DOM (e.g. pre-rendered but hidden),
			// it must not be visible to assistive technology / the user.
			await expect(dialog).not.toBeVisible();
		}
		// No dialog role exposed means count === 0, which passes trivially.
	});

	test("clicking the trigger opens the modal and exposes role=dialog", async ({
		page,
	}) => {
		const trigger = block(page).getByRole("button", { name: /open modal/i });
		await trigger.click();

		const dialog = block(page).getByRole("dialog");
		await expect(dialog).toBeVisible();
	});

	test("role=dialog is gone or hidden after the modal is closed", async ({
		page,
	}) => {
		const trigger = block(page).getByRole("button", { name: /open modal/i });
		await trigger.click();

		await expect(block(page).getByRole("dialog")).toBeVisible();

		await page.keyboard.press("Escape");

		const dialog = block(page).getByRole("dialog");
		const count = await dialog.count();
		if (count > 0) {
			await expect(dialog).not.toBeVisible();
		}
	});

	test("Escape closes the modal and returns focus to the trigger", async ({
		page,
	}) => {
		const trigger = block(page).getByRole("button", { name: /open modal/i });
		await trigger.click();
		await expect(block(page).getByRole("dialog")).toBeVisible();

		await page.keyboard.press("Escape");

		await expect(trigger).toBeFocused();
	});

	test("Close button dismisses the modal and returns focus to the trigger", async ({
		page,
	}) => {
		const trigger = block(page).getByRole("button", { name: /open modal/i });
		await trigger.click();

		const dialog = block(page).getByRole("dialog");
		await expect(dialog).toBeVisible();

		const closeButton = dialog.getByRole("button", { name: /close/i });
		await closeButton.click();

		await expect(trigger).toBeFocused();
	});

	test("Tab focus is trapped within the dialog while the modal is open", async ({
		page,
	}) => {
		const trigger = block(page).getByRole("button", { name: /open modal/i });
		await trigger.click();

		const dialog = block(page).getByRole("dialog");
		await expect(dialog).toBeVisible();

		// Collect all focusable elements inside the dialog.
		const focusableCount = await dialog.evaluate((el) => {
			const focusable = el.querySelectorAll(
				'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])',
			);
			return focusable.length;
		});
		expect(focusableCount).toBeGreaterThan(0);

		// Tab through all focusable elements inside the dialog. After cycling
		// through all of them, focus should remain within the dialog (not escape).
		for (let i = 0; i <= focusableCount; i++) {
			await page.keyboard.press("Tab");
		}

		// Focus must still be within the dialog element after wrapping.
		const focusedInsideDialog = await page.evaluate(() => {
			const dialog = document.querySelector(
				".wp-block-wp-skill-testing-block [role='dialog']",
			);
			return dialog ? dialog.contains(document.activeElement) : false;
		});
		expect(focusedInsideDialog).toBe(true);
	});
});
