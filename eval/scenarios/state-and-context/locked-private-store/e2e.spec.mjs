import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";
import { addLockProbe } from "../../../utils/e2e-helpers.mjs";

/**
 * E2E tests for the locked-private-store scenario.
 *
 * Verifies that the block's store namespace is locked: a post-hydration attempt
 * to re-open the namespace without the lock key must throw an error
 * (window.__lockResult === "locked"). Also confirms the widget itself still
 * functions normally for the user.
 */

// The namespace the agent is expected to use for this block.
// We probe this namespace to confirm the lock is in place.
const NAMESPACE = "wp-skill/locked-private-store";

test.describe("locked-private-store scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-locked-private-store-${workerInfo.project.metadata.agentId}`,
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

	test("store namespace is locked — external re-open is rejected", async ({
		page,
	}) => {
		// The block must have hydrated before we probe
		await page.waitForLoadState("networkidle");

		// Inject the adversarial probe that tries to re-open the locked namespace
		await addLockProbe(page, NAMESPACE);

		// The probe must have written "locked" — not "unlocked"
		const result = await page.evaluate(() => window.__lockResult);
		expect(result).toBe("locked");
	});

	test("interactive widget still works normally after hardening", async ({
		page,
	}) => {
		const block = page.locator(".wp-block-wp-skill-testing-block");
		await expect(block).toBeVisible();

		// The widget should have at least one interactive element (a button)
		const btn = block.getByRole("button");
		await expect(btn).toBeVisible();

		// Clicking the button should update displayed state
		const counter = block.locator("[data-wp-text]");
		const before = await counter.textContent();
		await btn.click();
		const after = await counter.textContent();
		expect(after).not.toBe(before);
	});
});
