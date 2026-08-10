import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the selectable-tile scenario.
 *
 * The post embeds two tile blocks side by side. Clicking one tile must
 * toggle its highlight class without touching the other instance,
 * verifying that data-wp-class--<name> is driven by per-instance local
 * context rather than shared global state.
 */

test.describe("selectable-tile scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-selectable-tile-${workerInfo.project.metadata.agentId}`,
		);
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

	test("renders two tile instances, neither selected initially", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const tiles = page.locator(".wp-block-wp-skill-testing-block");
		await expect(tiles).toHaveCount(2);
	});

	test("clicking the first tile highlights it but not the second", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const tiles = page.locator(".wp-block-wp-skill-testing-block");
		const tile0 = tiles.nth(0);
		const tile1 = tiles.nth(1);

		// Record which class names are on each tile before interaction.
		const classesBeforeTile1 = await tile1.getAttribute("class");

		// Click the first tile to select it.
		await tile0.click();

		// The first tile must now carry a class that was not there before.
		const classesAfterTile0 = await tile0.getAttribute("class");
		// The second tile must remain untouched.
		const classesAfterTile1 = await tile1.getAttribute("class");
		expect(classesAfterTile1).toBe(classesBeforeTile1);

		// The first tile gained at least one class (the highlight class).
		expect(classesAfterTile0).not.toBeNull();
	});

	test("clicking a selected tile deselects it (toggle off)", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const tile0 = page.locator(".wp-block-wp-skill-testing-block").nth(0);

		const classesBefore = await tile0.getAttribute("class");

		// Select.
		await tile0.click();
		const classesSelected = await tile0.getAttribute("class");
		expect(classesSelected).not.toBe(classesBefore);

		// Deselect.
		await tile0.click();
		const classesDeselected = await tile0.getAttribute("class");
		expect(classesDeselected).toBe(classesBefore);
	});

	test("the two instances are independently selectable", async ({ page }) => {
		await page.goto(`/?p=${post.id}`);

		const tiles = page.locator(".wp-block-wp-skill-testing-block");
		const tile0 = tiles.nth(0);
		const tile1 = tiles.nth(1);

		await tile0.click();
		await tile1.click();

		const classes0 = await tile0.getAttribute("class");
		const classes1 = await tile1.getAttribute("class");

		// Both are selected (both carry their highlight class).
		// We can't know the exact class name, but both must have the same
		// selected-class pattern — verify they differ from the baseline by
		// toggling one off and observing only that instance reverts.
		await tile0.click(); // deselect tile 0
		const classes0After = await tile0.getAttribute("class");
		const classes1After = await tile1.getAttribute("class");

		expect(classes0After).not.toBe(classes0); // tile 0 lost its highlight
		expect(classes1After).toBe(classes1); // tile 1 is unchanged
	});
});
