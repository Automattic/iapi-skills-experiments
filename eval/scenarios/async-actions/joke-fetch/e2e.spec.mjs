import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the joke-fetch scenario.
 *
 * The remote joke endpoint is intercepted with page.route() so the test is
 * fully isolated from any real network. The stub URL pattern matches whatever
 * endpoint the agent chooses; what matters is that clicking the button drives
 * a fetch, the response's joke field lands in reactive state, and the paragraph
 * renders it without a direct DOM write.
 */

test.describe("joke-fetch scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-joke-fetch-${workerInfo.project.metadata.agentId}`,
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

	test("clicking the button fetches and displays the joke text", async ({
		page,
	}) => {
		let requestCount = 0;
		// Intercept any URL the agent's action fetches so the test is not coupled
		// to a specific stub URL.
		await page.route("**/*", (route) => {
			const url = route.request().url();
			if (url.includes("joke") && !url.includes("wp-json")) {
				requestCount++;
				route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({
						joke: "Why did the chicken cross the road? To yield a Promise.",
					}),
				});
			} else {
				route.continue();
			}
		});

		await page.goto(`/?p=${post.id}`);

		await page.getByRole("button", { name: /get joke|fetch joke/i }).click();

		await expect(
			page.locator(".wp-block-wp-skill-testing-block"),
		).toContainText("Why did the chicken cross the road? To yield a Promise.");
		expect(requestCount).toBe(1);
	});

	test("paragraph is empty on load before the button is clicked", async ({
		page,
	}) => {
		// Route any joke fetch with a slow response so we can observe the
		// empty pre-click state on page load.
		await page.route("**/*", async (route) => {
			const url = route.request().url();
			if (url.includes("joke") && !url.includes("wp-json")) {
				await new Promise((r) => setTimeout(r, 300));
				route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ joke: "Eventually-resolved joke." }),
				});
			} else {
				route.continue();
			}
		});

		await page.goto(`/?p=${post.id}`);

		// Before any click the joke paragraph must be empty — not filled with
		// server-side or JS-initialised text.
		await expect(
			page.locator(".wp-block-wp-skill-testing-block"),
		).not.toContainText("Eventually-resolved joke.");

		await page.getByRole("button", { name: /get joke|fetch joke/i }).click();

		await expect(
			page.locator(".wp-block-wp-skill-testing-block"),
		).toContainText("Eventually-resolved joke.");
	});
});
