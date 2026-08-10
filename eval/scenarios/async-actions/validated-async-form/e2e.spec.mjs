import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the validated-async-form scenario.
 *
 * The form submission endpoint is intercepted with page.route() so tests run
 * in isolation. The three key assertions are:
 *   1. Inline validation flags invalid/empty fields before submit.
 *   2. The submit button is disabled for the duration of the in-flight request.
 *   3. Success and error states render in place without a page reload.
 */

test.describe("validated-async-form scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-validated-async-form-${workerInfo.project.metadata.agentId}`,
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

	test("required field validation shows an inline message without submitting", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");

		// Click submit without filling in any fields.
		await block.getByRole("button", { name: /submit/i }).click();

		// An inline validation message must be present near the empty field.
		await expect(
			block.locator("[aria-live], .error, .validation-message, [role='alert']").first(),
		).toBeVisible();
	});

	test("invalid email format is flagged inline", async ({ page }) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const emailField = block.getByRole("textbox", { name: /email/i });

		await emailField.fill("not-an-email");
		// Blur or attempt submit to trigger validation.
		await emailField.blur();

		await expect(
			block.locator("[aria-live], .error, .validation-message, [role='alert']").first(),
		).toBeVisible();
	});

	test("submit button is disabled while the request is in flight", async ({
		page,
	}) => {
		// Use a slow response so we can observe the disabled state mid-flight.
		let resolveRequest;
		await page.route("**/*", async (route) => {
			const url = route.request().url();
			if (
				(url.includes("contact") || url.includes("form") || url.includes("submit")) &&
				!url.includes("wp-json") &&
				!url.includes("wp-admin") &&
				route.request().method() === "POST"
			) {
				await new Promise((r) => {
					resolveRequest = r;
				});
				route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ success: true }),
				});
			} else {
				route.continue();
			}
		});

		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");

		// Fill in valid data to pass validation.
		const nameField = block.getByRole("textbox", { name: /name/i });
		const emailField = block.getByRole("textbox", { name: /email/i });
		if (await nameField.isVisible()) {
			await nameField.fill("Test User");
		}
		await emailField.fill("test@example.com");

		const submitButton = block.getByRole("button", { name: /submit/i });
		await submitButton.click();

		// While the request is pending, the button must be disabled.
		await expect(submitButton).toBeDisabled();

		// Unblock the request and wait for completion.
		resolveRequest?.();

		// After success, the button is re-enabled or the form is replaced.
		await expect(block).toContainText(/.+/);
	});

	test("shows success state after a successful submission", async ({
		page,
	}) => {
		await page.route("**/*", (route) => {
			const url = route.request().url();
			if (
				(url.includes("contact") || url.includes("form") || url.includes("submit")) &&
				!url.includes("wp-json") &&
				!url.includes("wp-admin") &&
				route.request().method() === "POST"
			) {
				route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ success: true, message: "Message sent!" }),
				});
			} else {
				route.continue();
			}
		});

		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");

		const nameField = block.getByRole("textbox", { name: /name/i });
		const emailField = block.getByRole("textbox", { name: /email/i });
		if (await nameField.isVisible()) {
			await nameField.fill("Test User");
		}
		await emailField.fill("test@example.com");

		const currentUrl = page.url();
		await block.getByRole("button", { name: /submit/i }).click();

		// A success message is shown in place.
		await expect(
			block.locator(".success, [role='status'], [aria-live='polite']").first(),
		).toBeVisible();

		// The page did not navigate away.
		expect(page.url()).toBe(currentUrl);
	});

	test("shows error state after a failed submission", async ({ page }) => {
		await page.route("**/*", (route) => {
			const url = route.request().url();
			if (
				(url.includes("contact") || url.includes("form") || url.includes("submit")) &&
				!url.includes("wp-json") &&
				!url.includes("wp-admin") &&
				route.request().method() === "POST"
			) {
				route.fulfill({
					status: 500,
					contentType: "application/json",
					body: JSON.stringify({ success: false, message: "Server error" }),
				});
			} else {
				route.continue();
			}
		});

		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");

		const nameField = block.getByRole("textbox", { name: /name/i });
		const emailField = block.getByRole("textbox", { name: /email/i });
		if (await nameField.isVisible()) {
			await nameField.fill("Test User");
		}
		await emailField.fill("test@example.com");

		await block.getByRole("button", { name: /submit/i }).click();

		// An error state is shown in place.
		await expect(
			block.locator(".error, [role='alert'], [aria-live='assertive']").first(),
		).toBeVisible();
	});
});
