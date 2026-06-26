import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the load-more-posts scenario.
 *
 * The REST endpoint that serves the next page of posts is intercepted with
 * page.route() so the test is fully isolated from real post data. The key
 * assertion is append-not-replace: items rendered before clicking "Load more"
 * must still be present in the DOM after clicking.
 */

test.describe("load-more-posts scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-load-more-posts-${workerInfo.project.metadata.agentId}`,
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

	test("clicking Load more appends posts and does not replace existing ones", async ({
		page,
	}) => {
		// Stub the fetch that retrieves the second page so we control what is
		// appended. The route pattern matches the agent's chosen endpoint; we
		// allow anything non-wp-json through unmolested on the first hit (the
		// initial server-rendered batch) then intercept the page-2 request.
		let fetchCount = 0;
		await page.route("**/*", (route) => {
			const url = route.request().url();
			if (
				(url.includes("load-more") || url.includes("posts") || url.includes("page")) &&
				!url.includes("wp-json") &&
				!url.includes("wp-admin") &&
				route.request().method() === "GET" &&
				fetchCount === 0
			) {
				fetchCount++;
				route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({
						posts: [
							{ id: 101, title: "Appended Post Alpha" },
							{ id: 102, title: "Appended Post Beta" },
						],
						hasMore: false,
					}),
				});
			} else {
				route.continue();
			}
		});

		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");

		// Capture the titles that are server-rendered in the initial batch so we
		// can assert they are still present after appending.
		const initialItems = block.locator("li, [role='listitem']");
		const initialCount = await initialItems.count();
		expect(initialCount).toBeGreaterThan(0);

		// Collect initial text for append verification.
		const firstItemText = await initialItems.first().textContent();

		await block.getByRole("button", { name: /load more/i }).click();

		// After clicking, the new items appear.
		await expect(block).toContainText("Appended Post Alpha");
		await expect(block).toContainText("Appended Post Beta");

		// The original first item is still present — list was appended, not replaced.
		await expect(block).toContainText(firstItemText.trim());

		// The total number of rendered items grew.
		const finalCount = await block.locator("li, [role='listitem']").count();
		expect(finalCount).toBeGreaterThan(initialCount);
	});

	test("Load more button disappears when no further pages are available", async ({
		page,
	}) => {
		await page.route("**/*", (route) => {
			const url = route.request().url();
			if (
				(url.includes("load-more") || url.includes("posts") || url.includes("page")) &&
				!url.includes("wp-json") &&
				!url.includes("wp-admin") &&
				route.request().method() === "GET"
			) {
				route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({
						posts: [{ id: 201, title: "Final Post" }],
						hasMore: false,
					}),
				});
			} else {
				route.continue();
			}
		});

		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const loadMoreButton = block.getByRole("button", { name: /load more/i });

		await loadMoreButton.click();

		await expect(block).toContainText("Final Post");

		// The button should now be hidden or removed.
		await expect(loadMoreButton).not.toBeVisible();
	});
});
