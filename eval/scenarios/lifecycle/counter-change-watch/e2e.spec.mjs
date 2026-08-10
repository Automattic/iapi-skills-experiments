import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the counter-change-watch scenario.
 *
 * A watch callback re-runs every time the count changes. Crucially it also
 * fires on mount, so the readout is correct on first paint without any click.
 *
 * Assertions cover:
 *   1. The readout is correct on mount (watch fires on first render).
 *   2. Clicking "+" updates the readout.
 *   3. Clicking "−" updates the readout.
 */

test.describe("counter-change-watch scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-counter-change-watch-${workerInfo.project.metadata.agentId}`,
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

	test("readout shows the initial count on mount without any click", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		await expect(block).toBeVisible();

		// The readout must contain a numeric value on first render —
		// the watch fires on mount so no user action is needed.
		const readout = block.locator(
			"[data-readout], .readout, [aria-live], output",
		);
		await expect
			.poll(
				async () => {
					const count = await readout.count();
					if (count === 0) return null;
					return await readout.first().textContent();
				},
				{ timeout: 5000 },
			)
			.toMatch(/\d/);
	});

	test("readout updates when the increment button is clicked", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		await expect(block).toBeVisible();

		const incrementBtn = block.getByRole("button", { name: /\+|increment|plus|add/i });
		const readout = block.locator(
			"[data-readout], .readout, [aria-live], output",
		).first();

		// Capture value before click.
		const before = await readout.textContent();

		await incrementBtn.click();

		// The readout must reflect the new count — the watch re-ran.
		await expect(readout).not.toContainText(before ?? "");
	});

	test("readout updates when the decrement button is clicked", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		await expect(block).toBeVisible();

		const incrementBtn = block.getByRole("button", { name: /\+|increment|plus|add/i });
		const decrementBtn = block.getByRole("button", { name: /−|−|-|decrement|minus|subtract/i });
		const readout = block.locator(
			"[data-readout], .readout, [aria-live], output",
		).first();

		// Increment first so there is room to decrement.
		await incrementBtn.click();
		const afterIncrement = await readout.textContent();

		await decrementBtn.click();

		// The readout must change back — watch re-ran on decrement too.
		await expect(readout).not.toContainText(afterIncrement ?? "");
	});

	test("readout tracks multiple increments correctly", async ({ page }) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		await expect(block).toBeVisible();

		const incrementBtn = block.getByRole("button", { name: /\+|increment|plus|add/i });
		const readout = block.locator(
			"[data-readout], .readout, [aria-live], output",
		).first();

		const initialText = await readout.textContent();

		// Click three times.
		await incrementBtn.click();
		await incrementBtn.click();
		await incrementBtn.click();

		// The readout must differ from the initial value after three increments.
		await expect(readout).not.toContainText(initialText ?? "");
	});
});
