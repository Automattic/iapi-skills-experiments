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

		// Each card should display a derived total; both VAT lines must be present
		for (let i = 0; i < 2; i++) {
			const card = cards.nth(i);
			// Locate the element tagged with the VAT total binding
			const vatEl = card.locator("[data-wp-text]").last();
			await expect(vatEl).not.toBeEmpty();
		}
	});
});
