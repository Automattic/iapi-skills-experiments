import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the like-button scenario.
 *
 * A heart button toggles between liked and unliked. Each toggle updates a
 * visible count — incrementing on like, decrementing on unlike. The count
 * and the toggle state are driven by a click handler on the element, not
 * by manual DOM writes.
 */

test.describe("like-button scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-like-button-${workerInfo.project.metadata.agentId}`,
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

	test("heart button and like count are visible on load", async ({ page }) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const heartBtn = block.getByRole("button").first();
		await expect(heartBtn).toBeVisible();

		// A numeric like count element must be present.
		const countEl = block.locator("[data-wp-text]").first();
		await expect(countEl).toBeVisible();
	});

	test("clicking the heart while unliked increments the count and marks it liked", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const heartBtn = block.getByRole("button").first();
		const countEl = block.locator("[data-wp-text]").first();

		const initialCount = parseInt(
			(await countEl.textContent()).trim(),
			10,
		);

		// Click to like.
		await heartBtn.click();

		// Count must have incremented.
		const newCount = parseInt((await countEl.textContent()).trim(), 10);
		expect(newCount).toBe(initialCount + 1);

		// The button must now reflect a liked state via aria-pressed or a class.
		const isLiked = await page.evaluate(() => {
			const btn = document.querySelector(
				".wp-block-wp-skill-testing-block button",
			);
			return (
				btn.getAttribute("aria-pressed") === "true" ||
				btn.classList.contains("is-liked") ||
				btn.classList.contains("liked") ||
				btn.classList.contains("active")
			);
		});
		expect(isLiked).toBe(true);
	});

	test("clicking the heart while liked decrements the count and marks it unliked", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const heartBtn = block.getByRole("button").first();
		const countEl = block.locator("[data-wp-text]").first();

		// Like first.
		await heartBtn.click();
		const likedCount = parseInt((await countEl.textContent()).trim(), 10);

		// Unlike.
		await heartBtn.click();
		const unlikedCount = parseInt((await countEl.textContent()).trim(), 10);
		expect(unlikedCount).toBe(likedCount - 1);

		// The button must now reflect the unliked state.
		const isUnliked = await page.evaluate(() => {
			const btn = document.querySelector(
				".wp-block-wp-skill-testing-block button",
			);
			return (
				btn.getAttribute("aria-pressed") === "false" ||
				(!btn.classList.contains("is-liked") &&
					!btn.classList.contains("liked") &&
					!btn.classList.contains("active"))
			);
		});
		expect(isUnliked).toBe(true);
	});

	test("toggling does not reload the page", async ({ page }) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const heartBtn = block.getByRole("button").first();

		const urlBefore = page.url();
		await heartBtn.click();
		await heartBtn.click();
		expect(page.url()).toBe(urlBefore);
	});
});
