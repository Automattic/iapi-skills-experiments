import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the autofocus-revealed-form scenario.
 *
 * The block shows a "Show form" button. Clicking it reveals a form and an init
 * callback fires at mount to focus the first input. We assert focus is received
 * without any additional user interaction.
 */

test.describe("autofocus-revealed-form scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-autofocus-revealed-form-${workerInfo.project.metadata.agentId}`,
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

	test("form is hidden on initial load", async ({ page }) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		await expect(block).toBeVisible();

		// The form should not be visible before the reveal button is clicked.
		const form = block.locator("form, [role='form'], .reveal-form");
		const firstInput = block.locator("input").first();

		// Either the form is hidden or there are no inputs rendered yet.
		const inputCount = await firstInput.count();
		if (inputCount > 0) {
			await expect(firstInput).not.toBeVisible();
		}
	});

	test("first input receives focus when the form is revealed", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		await expect(block).toBeVisible();

		// Click the reveal button.
		const revealButton = block.getByRole("button", {
			name: /show form|reveal|open form/i,
		});
		await revealButton.click();

		// The first input must become visible.
		const firstInput = block.locator("input").first();
		await expect(firstInput).toBeVisible();

		// The init callback runs on mount and focuses the first field —
		// no additional interaction needed.
		await expect(firstInput).toBeFocused();
	});

	test("focus moves automatically without a second user click", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");

		// Click reveal — this is the one and only user interaction.
		await block.getByRole("button", { name: /show form|reveal|open form/i }).click();

		const firstInput = block.locator("input").first();
		await expect(firstInput).toBeVisible();

		// Confirm the focused element IS the first input inside the block.
		const focusedHandle = await page.evaluateHandle(() => document.activeElement);
		const inputHandle = await firstInput.elementHandle();
		const isFocused = await page.evaluate(
			([focused, input]) => focused === input,
			[focusedHandle, inputHandle],
		);
		expect(isFocused).toBe(true);
	});
});
