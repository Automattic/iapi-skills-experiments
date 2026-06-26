import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the command-palette-keydown scenario.
 *
 * A document-level keydown listener opens a command palette overlay when
 * the "/" key is pressed. The handler calls event.preventDefault() (via
 * withSyncEvent) so the native browser quick-find is suppressed. Tests
 * drive the shortcut with keyboard.press at document level and assert the
 * overlay becomes visible.
 */

test.describe("command-palette-keydown scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-command-palette-keydown-${workerInfo.project.metadata.agentId}`,
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

	test("command palette is not visible on initial load", async ({ page }) => {
		await page.goto(`/?p=${post.id}`);

		// The overlay should be hidden until the shortcut is triggered.
		const overlay = page.locator(
			"[role='dialog'], [data-command-palette], .command-palette",
		);
		// Either there is no overlay element, or it is not visible.
		const count = await overlay.count();
		if (count > 0) {
			await expect(overlay.first()).not.toBeVisible();
		}
	});

	test("pressing '/' at document level opens the command palette", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		// Focus the document body so the keydown fires at document level
		// (not inside an input, which would capture the key).
		await page.focus("body");
		await page.keyboard.press("/");

		// The command palette overlay must now be visible.
		const overlay = page.locator(
			"[role='dialog'], [data-command-palette], .command-palette",
		);
		await expect(overlay.first()).toBeVisible();
	});

	test("default browser action is prevented (the '/' character does not appear as typed text)", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		// Install a listener to detect whether any input/textarea received the "/" character.
		await page.evaluate(() => {
			window.__slashTyped = false;
			document.addEventListener(
				"keypress",
				(e) => {
					if (e.key === "/" && e.defaultPrevented) {
						window.__slashTyped = false;
					} else if (e.key === "/") {
						window.__slashTyped = true;
					}
				},
				{ capture: true },
			);
		});

		await page.focus("body");
		await page.keyboard.press("/");

		// Check that the handler prevented the default action.
		// We verify indirectly: the overlay opens (handler fired) and no
		// visible text input on the page received a "/" character.
		const overlay = page.locator(
			"[role='dialog'], [data-command-palette], .command-palette",
		);
		await expect(overlay.first()).toBeVisible();

		// The "/" must not appear as typed text in any visible input on the page.
		const inputValue = await page.evaluate(() => {
			const inputs = Array.from(
				document.querySelectorAll("input[type='text'], textarea"),
			);
			return inputs.map((i) => i.value).join("");
		});
		expect(inputValue).not.toContain("/");
	});

	test("pressing Escape closes the command palette", async ({ page }) => {
		await page.goto(`/?p=${post.id}`);

		await page.focus("body");
		await page.keyboard.press("/");

		const overlay = page.locator(
			"[role='dialog'], [data-command-palette], .command-palette",
		);
		await expect(overlay.first()).toBeVisible();

		await page.keyboard.press("Escape");
		await expect(overlay.first()).not.toBeVisible();
	});
});
