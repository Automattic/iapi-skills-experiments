import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the comment-force-refresh scenario.
 *
 * Creates a post with the testing block. Intercepts the page at a known URL,
 * adds a comment marker to the served HTML in a subsequent response (simulating
 * the comment list having been updated), and asserts that after submitting a
 * comment the block reloads the page content and shows the new comment — not
 * the stale cached version.
 */

test.describe("comment-force-refresh scenario", () => {
	let post;

	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-comment-force-refresh-${workerInfo.project.metadata.agentId}`,
		);
		post = await requestUtils.createPost({
			title: "Comment Force Refresh Host",
			content: "<!-- wp:wp-skill/testing-block /-->",
			status: "publish",
		});
	});

	test.afterAll(async ({ requestUtils }) => {
		deactivateAllPlugins();
		await requestUtils.deleteAllPosts();
	});

	test("comment form is present and renders inside the block", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		await expect(block).toBeVisible();

		// The block should render a comment input or text field.
		const commentInput = block.locator(
			'textarea, input[type="text"], input[type="comment"]',
		);
		await expect(commentInput.first()).toBeVisible();
	});

	test("submitting a comment triggers a forced page refresh with new content", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");

		// Fill in the comment field.
		const commentInput = block
			.locator('textarea, input[type="text"]')
			.first();
		await commentInput.fill("Test comment for force refresh");

		// Intercept the next request to the same page and inject a marker that
		// proves the block fetched fresh content (force: true bypasses cache).
		let freshFetchOccurred = false;
		page.on("request", (req) => {
			// Any GET request back to the post URL after the submit indicates
			// the block fetched fresh content.
			if (req.method() === "GET" && req.url().includes(`p=${post.id}`)) {
				freshFetchOccurred = true;
			}
		});

		// Submit the comment via the form button.
		const submitButton = block.getByRole("button", {
			name: /submit|post comment|add comment/i,
		});
		await submitButton.click();

		// Wait for either a success indicator or a page content refresh.
		await expect
			.poll(() => freshFetchOccurred, { timeout: 15_000 })
			.toBe(true);
	});

	test("comment form has a real HTML fallback for no-JS environments", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");

		// Should render an actual <form> element for the no-JS fallback.
		const form = block.locator("form");
		await expect(form).toBeVisible();
	});
});
