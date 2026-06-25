import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the multi-directive-element scenario.
 *
 * This scenario exercises the unique-ID directive suffix (`data-wp-init---<id>`,
 * triple-hyphen form) which lets the same directive type appear more than once
 * on a single element. Both init callbacks must run independently on mount.
 *
 * The console-capture pattern mirrors `minimal-scaffold`: listen before goto,
 * then poll for each expected marker.
 */

test.describe("multi-directive-element scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-multi-directive-element-${workerInfo.project.metadata.agentId}`,
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

	test("both independent init callbacks run on mount", async ({ page }) => {
		const consoleMessages = [];
		page.on("console", (msg) => consoleMessages.push(msg.text()));

		await page.goto(`/?p=${post.id}`);

		// The block must be present and hydrated.
		await expect(
			page.locator(".wp-block-wp-skill-testing-block"),
		).toBeVisible();

		// Analytics "viewed" callback must fire.
		await expect
			.poll(
				() =>
					consoleMessages.some((m) => m.toLowerCase().includes("viewed")),
				{ timeout: 5000 },
			)
			.toBe(true);

		// Debug init marker callback must also fire independently.
		await expect
			.poll(
				() =>
					consoleMessages.some((m) =>
						m.toLowerCase().includes("init"),
					),
				{ timeout: 5000 },
			)
			.toBe(true);

		// Both ran — confirm we saw at least two distinct console messages
		// from the init callbacks (analytics + debug).
		const initRelated = consoleMessages.filter(
			(m) =>
				m.toLowerCase().includes("viewed") ||
				m.toLowerCase().includes("init"),
		);
		expect(initRelated.length).toBeGreaterThanOrEqual(2);
	});

	test("the block element carries two independent init-directive attributes", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block").first();
		await expect(block).toBeVisible();

		// The block's root element (or a child) must expose at least two
		// attributes that follow the triple-hyphen unique-ID suffix pattern.
		// Verify by inspecting the serialised outer HTML for two `data-wp-init---` attrs.
		const html = await block.evaluate((el) => el.outerHTML);
		const matches = html.match(/data-wp-init---[^"\s=]+/g) ?? [];
		expect(matches.length).toBeGreaterThanOrEqual(2);

		// The two attributes must use distinct IDs.
		const uniqueIds = new Set(matches);
		expect(uniqueIds.size).toBeGreaterThanOrEqual(2);
	});
});
