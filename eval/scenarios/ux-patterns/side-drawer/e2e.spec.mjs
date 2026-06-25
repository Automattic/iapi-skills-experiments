import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the side-drawer scenario.
 *
 * Asserts the open/close flow, Tab focus trap within the drawer, Escape
 * to close, and focus restoration to the trigger button. Scoped to the
 * testing-block class so theme navigation blocks on the same page do not
 * interfere.
 */

test.describe("side-drawer scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-side-drawer-${workerInfo.project.metadata.agentId}`,
		);
		post = await requestUtils.createPost({
			content: "<!-- wp:wp-skill/testing-block /-->",
			status: "publish",
		});
	});

	test.beforeEach(async ({ page }) => {
		await page.goto(`/?p=${post.id}`);
	});

	test.afterAll(async ({ requestUtils }) => {
		deactivateAllPlugins();
		await requestUtils.deleteAllPosts();
	});

	// Scope all locators to the testing-block wrapper so we don't pick up
	// theme-emitted navigation that also exposes links named Home / About /
	// Contact. We use the WP-emitted block class (derived from the fixed block
	// name) rather than the agent's chosen namespace, which is variable.
	const block = (page) => page.locator(".wp-block-wp-skill-testing-block");

	// Check whether the drawer is hidden via the DOM `hidden` attribute on an
	// ancestor of the Home link. This reflects `data-wp-bind--hidden` wiring
	// directly and is not defeated by CSS that overrides `display`.
	const isDrawerHidden = (page) =>
		page.evaluate(() => {
			const root = document.querySelector(".wp-block-wp-skill-testing-block");
			const link = root?.querySelector('a[href="#home"]');
			if (!link) return null;
			for (
				let el = link.parentElement;
				el && el !== root.parentElement;
				el = el.parentElement
			) {
				if (el.hidden) return true;
			}
			return false;
		});

	test("drawer is closed initially and the trigger announces closed state", async ({
		page,
	}) => {
		const trigger = block(page).getByRole("button", { name: /menu/i });
		await expect(trigger).toHaveAttribute("aria-expanded", "false");
		expect(await isDrawerHidden(page)).toBe(true);
	});

	test("clicking the trigger opens the drawer and reveals the nav links", async ({
		page,
	}) => {
		const trigger = block(page).getByRole("button", { name: /menu/i });
		await trigger.click();

		await expect(trigger).toHaveAttribute("aria-expanded", "true");
		await expect
			.poll(() => isDrawerHidden(page), { timeout: 5000 })
			.toBe(false);
		await expect(
			block(page).getByRole("link", { name: /^home$/i }),
		).toBeVisible();
		await expect(
			block(page).getByRole("link", { name: /^about$/i }),
		).toBeVisible();
		await expect(
			block(page).getByRole("link", { name: /^contact$/i }),
		).toBeVisible();
	});

	test("Escape closes the drawer and returns focus to the trigger", async ({
		page,
	}) => {
		const trigger = block(page).getByRole("button", { name: /menu/i });
		await trigger.click();
		await expect(trigger).toHaveAttribute("aria-expanded", "true");

		await page.keyboard.press("Escape");

		await expect(trigger).toHaveAttribute("aria-expanded", "false");
		await expect
			.poll(() => isDrawerHidden(page), { timeout: 5000 })
			.toBe(true);
		// Focus must return to the trigger so the keyboard user does not lose
		// their position in the page.
		await expect(trigger).toBeFocused();
	});

	test("Tab focus is trapped within the drawer links while the drawer is open", async ({
		page,
	}) => {
		await block(page).getByRole("button", { name: /menu/i }).click();

		const home = block(page).getByRole("link", { name: /^home$/i });
		const contact = block(page).getByRole("link", { name: /^contact$/i });

		// Forward wrap: Tab past the last link (Contact) wraps to the first (Home).
		await contact.focus();
		await page.keyboard.press("Tab");
		await expect(home).toBeFocused();

		// Backward wrap: Shift+Tab past the first link (Home) wraps to the last (Contact).
		await page.keyboard.press("Shift+Tab");
		await expect(contact).toBeFocused();
	});
});
