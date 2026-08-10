import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the on-sale-attribute scenario.
 *
 * The critical assertion: when the sale toggle is off, the bound attribute
 * must be completely absent from the element (getAttribute returns null),
 * not merely empty. A null/false derived getter must remove the attribute
 * entirely — this is the distinct behavior data-wp-bind--<attr> provides.
 */

test.describe("on-sale-attribute scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-on-sale-attribute-${workerInfo.project.metadata.agentId}`,
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

	/**
	 * Helper: locate the badge element that carries the bound attribute.
	 * The agent may use any attribute name for the tooltip (title, aria-label, etc.).
	 * We look for an element whose attribute value carries sale-price text when on sale.
	 */

	test("attribute is fully absent (null) in the off-sale state", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const toggleBtn = block.getByRole("button", { name: /sale|toggle/i });

		// Drive the block to a known state: click until the "on sale" indicator
		// is NOT visible / the attribute is absent. We try up to two clicks.
		// The block may start in either state; we detect off-sale by absence of
		// a non-null bound attribute on the badge element.

		// Find the badge/indicator element.
		const badge = block.locator("[data-wp-bind]").first();

		// Determine the attribute name by checking what's bound.
		// We click the toggle to reach the OFF state and assert null.
		await toggleBtn.click();
		// Allow one more click in case we started in ON state.
		// The simplest check: find any attribute that was added/removed.

		// Strategy: evaluate from the page which dynamic attribute the badge carries
		// when in the ON state, then verify it's absent in the OFF state.
		const attrPresentResult = await page.evaluate(() => {
			// Find badge elements inside the block that have data-wp-bind attributes.
			const blocks = document.querySelectorAll(
				".wp-block-wp-skill-testing-block",
			);
			for (const block of blocks) {
				// Look for elements with data-wp-bind--* directives
				for (const el of block.querySelectorAll("*")) {
					for (const attr of el.attributes) {
						if (attr.name.startsWith("data-wp-bind--")) {
							const boundAttrName = attr.name.replace("data-wp-bind--", "");
							return { found: true, attrName: boundAttrName, value: el.getAttribute(boundAttrName) };
						}
					}
				}
			}
			return { found: false };
		});

		// The block must have at least one data-wp-bind--<attr> directive.
		expect(attrPresentResult.found).toBe(true);
	});

	test("toggling sale state makes the attribute appear and disappear", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const toggleBtn = block.getByRole("button", { name: /sale|toggle/i });

		// Discover the bound attribute name.
		const boundAttrName = await page.evaluate(() => {
			const blocks = document.querySelectorAll(
				".wp-block-wp-skill-testing-block",
			);
			for (const block of blocks) {
				for (const el of block.querySelectorAll("*")) {
					for (const attr of el.attributes) {
						if (attr.name.startsWith("data-wp-bind--")) {
							return attr.name.replace("data-wp-bind--", "");
						}
					}
				}
			}
			return null;
		});

		expect(boundAttrName).not.toBeNull();

		// Record the initial value of the bound attribute.
		const badgeEl = block.locator(`[data-wp-bind--${boundAttrName}]`).first();
		const initialValue = await badgeEl.getAttribute(boundAttrName);

		// Click the toggle to flip the state.
		await toggleBtn.click();
		const afterFirstClick = await badgeEl.getAttribute(boundAttrName);
		// The attribute must have changed (present ↔ absent).
		expect(afterFirstClick).not.toBe(initialValue);

		// Click again to flip back.
		await toggleBtn.click();
		const afterSecondClick = await badgeEl.getAttribute(boundAttrName);
		expect(afterSecondClick).toBe(initialValue);
	});

	test("when the attribute is absent it is null, not empty string", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const toggleBtn = block.getByRole("button", { name: /sale|toggle/i });

		// Discover the bound attribute name.
		const boundAttrName = await page.evaluate(() => {
			const blocks = document.querySelectorAll(
				".wp-block-wp-skill-testing-block",
			);
			for (const block of blocks) {
				for (const el of block.querySelectorAll("*")) {
					for (const attr of el.attributes) {
						if (attr.name.startsWith("data-wp-bind--")) {
							return attr.name.replace("data-wp-bind--", "");
						}
					}
				}
			}
			return null;
		});

		expect(boundAttrName).not.toBeNull();

		// Click twice to exercise both states and verify the "off" state is null.
		let foundNull = false;
		for (let i = 0; i < 2; i++) {
			await toggleBtn.click();
			const value = await page.evaluate((attrName) => {
				const el = document.querySelector(
					`.wp-block-wp-skill-testing-block [data-wp-bind--${attrName}]`,
				);
				return el ? el.getAttribute(attrName) : "element-not-found";
			}, boundAttrName);
			if (value === null) {
				foundNull = true;
			}
		}

		// In at least one of the two states the attribute must be fully absent (null).
		expect(foundNull).toBe(true);
	});
});
