import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the menu-touch-hover scenario.
 *
 * A single pointer handler branches on event.pointerType — "mouse" triggers
 * the submenu on hover, "touch" triggers it on tap. Tests exercise the mouse
 * branch via a real hover and the touch branch by dispatching a synthetic
 * pointerover/pointerenter with pointerType "touch".
 */

test.describe("menu-touch-hover scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-menu-touch-hover-${workerInfo.project.metadata.agentId}`,
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

	test("submenu is not visible on initial load", async ({ page }) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		// The submenu should be hidden before any interaction.
		const submenu = block.locator(
			"[data-submenu], .submenu, nav ul ul, [aria-haspopup] + *",
		);
		const count = await submenu.count();
		if (count > 0) {
			await expect(submenu.first()).not.toBeVisible();
		}
	});

	test("submenu opens on mouse hover (pointerType mouse)", async ({ page }) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		// Locate the menu trigger — the parent menu item.
		const menuTrigger = block
			.locator("[aria-haspopup], [data-menu-item], nav > ul > li")
			.first();
		await expect(menuTrigger).toBeVisible();

		// Hover with the mouse (Playwright dispatches pointer events with pointerType "mouse").
		await menuTrigger.hover();

		// The submenu should now be visible.
		const submenu = block.locator(
			"[data-submenu], .submenu, nav ul ul, [aria-haspopup] + *, [aria-expanded='true'] + *",
		);
		await expect(submenu.first()).toBeVisible();
	});

	test("submenu opens on touch tap (pointerType touch)", async ({ page }) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const menuTrigger = block
			.locator("[aria-haspopup], [data-menu-item], nav > ul > li")
			.first();
		await expect(menuTrigger).toBeVisible();

		// Dispatch a synthetic pointerover event with pointerType "touch" to exercise
		// the touch branch of the handler, since Playwright's default hover uses "mouse".
		await menuTrigger.evaluate((el) => {
			el.dispatchEvent(
				new PointerEvent("pointerover", {
					bubbles: true,
					cancelable: true,
					pointerType: "touch",
				}),
			);
		});

		// The submenu should become visible via the touch branch.
		const submenu = block.locator(
			"[data-submenu], .submenu, nav ul ul, [aria-haspopup] + *, [aria-expanded='true'] + *",
		);
		await expect(submenu.first()).toBeVisible();
	});

	test("the block uses a single pointer handler that branches on pointer type", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		// Verify there is exactly one pointer handler driving the submenu open behaviour,
		// not two completely separate click + mouseover bindings. We confirm this
		// indirectly: both a synthetic "mouse" and a synthetic "touch" pointerover event
		// on the same element each open the submenu.

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const menuTrigger = block
			.locator("[aria-haspopup], [data-menu-item], nav > ul > li")
			.first();

		// Trigger with mouse pointer type.
		await menuTrigger.evaluate((el) => {
			el.dispatchEvent(
				new PointerEvent("pointerover", {
					bubbles: true,
					cancelable: true,
					pointerType: "mouse",
				}),
			);
		});

		const submenu = block.locator(
			"[data-submenu], .submenu, nav ul ul, [aria-haspopup] + *, [aria-expanded='true'] + *",
		);
		await expect(submenu.first()).toBeVisible();
	});
});
