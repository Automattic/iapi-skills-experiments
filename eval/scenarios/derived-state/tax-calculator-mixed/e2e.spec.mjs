import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the tax-calculator-mixed scenario.
 *
 * Two block instances carry different base prices via per-instance context.
 * A single shared global tax rate drives the derived totals for every card.
 * The test asserts that changing the global rate updates both cards'
 * displayed totals simultaneously — derived getter reading both sources.
 */

test.describe("tax-calculator-mixed scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-tax-calculator-mixed-${workerInfo.project.metadata.agentId}`,
		);
		// Two product cards with different per-instance prices
		post = await requestUtils.createPost({
			content:
				"<!-- wp:wp-skill/testing-block /-->\n<!-- wp:wp-skill/testing-block /-->",
			status: "publish",
		});
	});

	test.afterAll(async ({ requestUtils }) => {
		deactivateAllPlugins();
		await requestUtils.deleteAllPosts();
	});

	test("renders an initial tax total in each card on page load", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const cards = page.locator(".wp-block-wp-skill-testing-block");
		await expect(cards).toHaveCount(2);

		// Both cards should display some non-empty derived total
		for (let i = 0; i < 2; i++) {
			const total = cards.nth(i).locator("[data-wp-text]").last();
			await expect(total).not.toBeEmpty();
		}
	});

	test("increasing the global tax rate updates every card's derived total", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const cards = page.locator(".wp-block-wp-skill-testing-block");
		await expect(cards).toHaveCount(2);

		// Capture totals before rate change
		const beforeFirst = await cards.nth(0).locator("[data-wp-text]").last().textContent();
		const beforeSecond = await cards.nth(1).locator("[data-wp-text]").last().textContent();

		// Find and click the increase-rate control (+ button or similar)
		const increaseBtn = page.getByRole("button", { name: /\+|increase|up/i }).first();
		await increaseBtn.click();

		// Both totals must change after the global rate changes
		const afterFirst = await cards.nth(0).locator("[data-wp-text]").last().textContent();
		const afterSecond = await cards.nth(1).locator("[data-wp-text]").last().textContent();

		expect(afterFirst).not.toBe(beforeFirst);
		expect(afterSecond).not.toBe(beforeSecond);
	});

	test("two cards show different totals reflecting their own base prices", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const cards = page.locator(".wp-block-wp-skill-testing-block");
		await expect(cards).toHaveCount(2);

		const totalFirst = await cards.nth(0).locator("[data-wp-text]").last().textContent();
		const totalSecond = await cards.nth(1).locator("[data-wp-text]").last().textContent();

		// Different base prices mean different totals even at the same tax rate
		expect(totalFirst.trim()).not.toEqual(totalSecond.trim());
	});
});
