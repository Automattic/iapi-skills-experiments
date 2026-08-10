import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the newsletter-submit-guard scenario.
 *
 * The form's submit handler uses withSyncEvent() so preventDefault() is
 * called synchronously — the only way to stop a form submission in the
 * browser. Tests confirm: no navigation occurs on submit, and an inline
 * confirmation message appears in the block.
 */

test.describe("newsletter-submit-guard scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-newsletter-submit-guard-${workerInfo.project.metadata.agentId}`,
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

	test("email field and Subscribe button are visible on load", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const emailInput = block.locator("input[type='email'], input[type='text']").first();
		const submitBtn = block.getByRole("button", { name: /subscribe/i });

		await expect(emailInput).toBeVisible();
		await expect(submitBtn).toBeVisible();
	});

	test("submitting the form does not navigate away from the page", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const urlBefore = page.url();

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const emailInput = block.locator("input[type='email'], input[type='text']").first();
		const submitBtn = block.getByRole("button", { name: /subscribe/i });

		await emailInput.fill("test@example.com");
		await submitBtn.click();

		// The URL must not have changed — no page reload, no navigation.
		expect(page.url()).toBe(urlBefore);

		// The page must still show the block (i.e. we haven't navigated away).
		await expect(block).toBeVisible();
	});

	test("an inline confirmation message appears after submit", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const emailInput = block.locator("input[type='email'], input[type='text']").first();
		const submitBtn = block.getByRole("button", { name: /subscribe/i });

		await emailInput.fill("hello@example.com");
		await submitBtn.click();

		// A confirmation message must appear inside the block.
		const confirmation = block.getByText(
			/thank|subscribed|success|confirm/i,
		);
		await expect(confirmation).toBeVisible();
	});

	test("no full-page reload occurs on submit (DOM is preserved)", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		// Tag a DOM node — if the page reloads this element reference becomes stale.
		const block = page.locator(".wp-block-wp-skill-testing-block");
		await expect(block).toBeVisible();

		const emailInput = block.locator("input[type='email'], input[type='text']").first();
		const submitBtn = block.getByRole("button", { name: /subscribe/i });

		// Track whether a navigation event fires.
		let navigated = false;
		page.on("framenavigated", () => {
			navigated = true;
		});

		await emailInput.fill("noreload@example.com");
		await submitBtn.click();

		// A brief wait to allow any navigation to complete if it were going to happen.
		await page.waitForTimeout(500);

		expect(navigated).toBe(false);

		// The confirmation must still have appeared.
		const confirmation = block.getByText(
			/thank|subscribed|success|confirm/i,
		);
		await expect(confirmation).toBeVisible();
	});
});
