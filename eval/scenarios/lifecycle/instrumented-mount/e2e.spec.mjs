import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the instrumented-mount scenario.
 *
 * Two independent init callbacks are wired on the same element using the
 * triple-hyphen unique-ID suffix (`data-wp-init---<id>`). Each logs a distinct
 * console message: one for the analytics "viewed" ping, one for the debug init
 * marker. Both must fire on a single page load with no user interaction.
 *
 * Console capture follows the same pattern as minimal-scaffold: attach the
 * listener before page.goto, then poll for each expected marker.
 */

test.describe("instrumented-mount scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-instrumented-mount-${workerInfo.project.metadata.agentId}`,
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

	test("analytics viewed ping fires on mount", async ({ page }) => {
		const consoleMessages = [];
		page.on("console", (msg) => consoleMessages.push(msg.text()));

		await page.goto(`/?p=${post.id}`);

		await expect(
			page.locator(".wp-block-wp-skill-testing-block"),
		).toBeVisible();

		// The analytics "viewed" callback must emit a recognisable console message.
		await expect
			.poll(
				() => consoleMessages.some((m) => m.toLowerCase().includes("viewed")),
				{ timeout: 5000 },
			)
			.toBe(true);
	});

	test("debug init marker fires on mount", async ({ page }) => {
		const consoleMessages = [];
		page.on("console", (msg) => consoleMessages.push(msg.text()));

		await page.goto(`/?p=${post.id}`);

		await expect(
			page.locator(".wp-block-wp-skill-testing-block"),
		).toBeVisible();

		// The debug init callback must emit a recognisable console message.
		await expect
			.poll(
				() =>
					consoleMessages.some(
						(m) =>
							m.toLowerCase().includes("init") ||
							m.toLowerCase().includes("debug") ||
							m.toLowerCase().includes("ready"),
					),
				{ timeout: 5000 },
			)
			.toBe(true);
	});

	test("both callbacks are wired as separate triple-hyphen init directives", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block").first();
		await expect(block).toBeVisible();

		// The block (or a child element) must carry at least two attributes
		// using the data-wp-init---<id> triple-hyphen unique-ID suffix form.
		const html = await block.evaluate((el) => el.outerHTML);
		const matches = html.match(/data-wp-init---[^"\s=]+/g) ?? [];
		expect(matches.length).toBeGreaterThanOrEqual(2);

		// Each attribute must reference a distinct callback ID.
		const uniqueIds = new Set(matches);
		expect(uniqueIds.size).toBeGreaterThanOrEqual(2);
	});

	test("both callbacks fire on the same page load", async ({ page }) => {
		const consoleMessages = [];
		page.on("console", (msg) => consoleMessages.push(msg.text()));

		await page.goto(`/?p=${post.id}`);

		await expect(
			page.locator(".wp-block-wp-skill-testing-block"),
		).toBeVisible();

		// Wait for both markers to appear.
		await expect
			.poll(
				() => consoleMessages.some((m) => m.toLowerCase().includes("viewed")),
				{ timeout: 5000 },
			)
			.toBe(true);

		await expect
			.poll(
				() =>
					consoleMessages.some(
						(m) =>
							m.toLowerCase().includes("init") ||
							m.toLowerCase().includes("debug") ||
							m.toLowerCase().includes("ready"),
					),
				{ timeout: 5000 },
			)
			.toBe(true);
	});
});
