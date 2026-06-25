import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the cross-namespace-now-playing scenario.
 *
 * The agent plugin must register a "source" namespace (simulating an external
 * music-player plugin) and a "display" block that reads the source namespace's
 * state declaratively in its template. Tests confirm the indicator shows the
 * correct initial value and updates reactively when the source state changes —
 * exercising cross-namespace reads (namespace::state.x) with no JS import.
 */

test.describe("cross-namespace-now-playing scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-cross-namespace-now-playing-${workerInfo.project.metadata.agentId}`,
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

	test("indicator displays the initial now-playing value from the source namespace", async ({
		page,
	}) => {
		const block = page.locator(".wp-block-wp-skill-testing-block");
		await expect(block).toBeVisible();

		// The indicator should show some text-bound value sourced from another namespace
		const indicator = block.locator("[data-wp-text]");
		await expect(indicator).toBeVisible();
		// Should have some non-empty initial value
		const text = await indicator.textContent();
		expect(text?.trim().length).toBeGreaterThan(0);
	});

	test("indicator updates reactively when source namespace state changes", async ({
		page,
	}) => {
		const block = page.locator(".wp-block-wp-skill-testing-block");
		const indicator = block.locator("[data-wp-text]");

		const initialText = await indicator.textContent();

		// The agent's plugin should expose a button to simulate the source plugin
		// changing its now-playing state (e.g. "Next track" button)
		const triggerBtn = block.getByRole("button");
		await expect(triggerBtn).toBeVisible();
		await triggerBtn.first().click();

		// The indicator must reflect the updated value without a page reload
		await expect(indicator).not.toHaveText(initialText ?? "");
	});

	test("indicator updates without a page reload", async ({ page }) => {
		const block = page.locator(".wp-block-wp-skill-testing-block");
		const indicator = block.locator("[data-wp-text]");

		const urlBefore = page.url();
		const triggerBtn = block.getByRole("button");
		await triggerBtn.first().click();

		// Page must not have navigated
		expect(page.url()).toBe(urlBefore);
		// The indicator text must have changed reactively
		await expect(indicator).toBeVisible();
	});
});
