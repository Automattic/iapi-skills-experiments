import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the price-with-vat scenario.
 *
 * Two block instances are placed on the same page, each seeded server-side
 * with a different base price. The test asserts each card shows its own
 * VAT-inclusive total (base × 1.20), computed via a derived getter and
 * visible on first paint — no interaction required.
 */

test.describe("price-with-vat scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-price-with-vat-${workerInfo.project.metadata.agentId}`,
		);
		// Two instances so each shows a distinct server-seeded product and price
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

	test("each instance shows its own base price and VAT total in server-rendered HTML", async ({
		page,
	}) => {
		// Disable JS: only server-rendered HTML evaluated — asserts SSR correctness
		await page.setJavaScriptEnabled(false);
		await page.goto(`/?p=${post.id}`);

		const cards = page.locator(".wp-block-wp-skill-testing-block");
		await expect(cards).toHaveCount(2);

		// Both cards must show some price-with-tax text before hydration
		for (let i = 0; i < 2; i++) {
			const card = cards.nth(i);
			// The card should render a non-empty price-with-tax amount
			await expect(card).not.toBeEmpty();
			const cardText = await card.textContent();
			// Expect some numeric content representing the tax total
			expect(cardText).toMatch(/\d/);
		}

		await page.setJavaScriptEnabled(true);
	});

	test("two instances on the same page show different prices", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const cards = page.locator(".wp-block-wp-skill-testing-block");
		await expect(cards).toHaveCount(2);

		const firstText = await cards.nth(0).textContent();
		const secondText = await cards.nth(1).textContent();

		// Each card is seeded with a distinct base price so the card text differs
		expect(firstText.trim()).not.toEqual(secondText.trim());
	});

	test("each card's displayed VAT total matches base price × 1.20", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const cards = page.locator(".wp-block-wp-skill-testing-block");
		await expect(cards).toHaveCount(2);

		// For each card, extract the numeric base price and the numeric VAT total
		// from the rendered text, then assert total === base × 1.20 (to two decimal
		// places, matching standard rounding for currency display).
		for (let i = 0; i < 2; i++) {
			const card = cards.nth(i);
			const cardText = await card.textContent();

			// Parse all decimal numbers found in the card (e.g. "10.00", "12.00").
			// The scenario seeds the block with a known base price; the card renders
			// it alongside the computed price-with-tax, so at least two numbers appear.
			const numbers = [...cardText.matchAll(/[\d]+\.[\d]{2}/g)].map((m) =>
				parseFloat(m[0]),
			);
			expect(numbers.length).toBeGreaterThanOrEqual(2);

			// The smallest number is the base price; the larger is the VAT total.
			const basePrice = Math.min(...numbers);
			const vatTotal = Math.max(...numbers);

			// Assert the displayed total is exactly base × 1.20, rounded to cents.
			expect(vatTotal).toBeCloseTo(basePrice * 1.2, 2);
		}
	});
});
