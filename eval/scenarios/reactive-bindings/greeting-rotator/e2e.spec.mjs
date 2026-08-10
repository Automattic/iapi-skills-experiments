import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the greeting-rotator scenario.
 *
 * The block must update the visible greeting text reactively each time
 * the "Next greeting" button is clicked, cycling through all phrases and
 * wrapping around — driven by data-wp-text bound to a state value, not
 * manual DOM writes.
 */

test.describe("greeting-rotator scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-greeting-rotator-${workerInfo.project.metadata.agentId}`,
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

	test("shows an initial greeting in the server-rendered HTML", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		// A greeting must be present before any interaction.
		await expect(block).not.toBeEmpty();
		const greetingText = await block
			.locator("[data-wp-text]")
			.first()
			.textContent();
		expect(greetingText.trim().length).toBeGreaterThan(0);
	});

	test("cycles the greeting text on each button click", async ({ page }) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const greetingEl = block.locator("[data-wp-text]").first();
		const nextBtn = block.getByRole("button", { name: /next greeting/i });

		const first = await greetingEl.textContent();

		await nextBtn.click();
		const second = await greetingEl.textContent();
		expect(second).not.toBe(first);

		await nextBtn.click();
		const third = await greetingEl.textContent();
		expect(third).not.toBe(second);
	});

	test("wraps around to the first greeting after the last one", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const greetingEl = block.locator("[data-wp-text]").first();
		const nextBtn = block.getByRole("button", { name: /next greeting/i });

		const initial = await greetingEl.textContent();

		// Collect unique greetings until we see the initial one again.
		const seen = new Set([initial.trim()]);
		let wrapped = false;
		for (let i = 0; i < 20; i++) {
			await nextBtn.click();
			const current = (await greetingEl.textContent()).trim();
			if (current === initial.trim() && seen.size > 1) {
				wrapped = true;
				break;
			}
			seen.add(current);
		}
		expect(wrapped).toBe(true);
	});
});
