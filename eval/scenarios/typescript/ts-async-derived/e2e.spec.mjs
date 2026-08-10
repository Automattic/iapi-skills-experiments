import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the ts-async-derived scenario.
 *
 * The TypeScript `AsyncAction<void>` and explicit derived return-type annotations
 * are authoring requirements verified by code review, not at runtime. These
 * tests verify the runtime behavior: the async fetch action updates the count
 * and the derived "doubled" value automatically reflects any change to the
 * count — from either the increment button or the fetch action.
 */

test.describe("ts-async-derived scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-ts-async-derived-${workerInfo.project.metadata.agentId}`,
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

	test("block renders the count and the derived doubled value on load", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		await expect(block).toBeVisible();

		// The block should display at least two numeric values: count and doubled
		const text = await block.textContent();
		const numbers = (text ?? "").match(/\d+/g);
		expect(numbers).not.toBeNull();
		expect(numbers.length).toBeGreaterThanOrEqual(2);
	});

	test("clicking Increment updates the count and the derived doubled value", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		// Expect the first [data-wp-text] to be the count and the second the derived doubled
		const allTextEls = block.locator("[data-wp-text]");

		const initialCount = parseInt(
			await allTextEls.first().textContent(),
			10,
		);
		const initialDoubled = parseInt(
			await allTextEls.nth(1).textContent(),
			10,
		);

		// Verify the derived doubled value already doubles the count on load
		expect(initialDoubled).toBe(initialCount * 2);

		await block.getByRole("button", { name: /increment/i }).click();

		// After increment, the count and derived doubled must both update
		await expect(allTextEls.first()).toHaveText(String(initialCount + 1));
		await expect(allTextEls.nth(1)).toHaveText(
			String((initialCount + 1) * 2),
		);
	});

	test("fetch-and-set async action updates the count and the derived doubled value", async ({
		page,
	}) => {
		// Intercept the fetch the action makes and return a known number
		await page.route("**/*", (route) => {
			const url = route.request().url();
			if (!url.includes("wp-json") && !url.includes("wp-login")) {
				// Respond to any non-WordPress request with a numeric payload
				route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ count: 7 }),
				});
			} else {
				route.continue();
			}
		});

		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const allTextEls = block.locator("[data-wp-text]");

		// Click the async fetch-and-set button
		await block
			.getByRole("button", { name: /fetch.*set|set.*fetch|load/i })
			.click();

		// After the async action resolves, count and doubled should reflect the fetched value
		await expect(allTextEls.first()).toHaveText("7", { timeout: 5000 });
		await expect(allTextEls.nth(1)).toHaveText("14");
	});
});
