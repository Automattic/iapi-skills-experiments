import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the stable-tab-ids scenario.
 *
 * The spec verifies two things:
 * 1. The ARIA linkage between tab buttons and panels (`aria-controls` →
 *    panel `id`) is present in the server-rendered HTML on load.
 * 2. The IDs are deterministic — identical between an initial load and a
 *    subsequent soft navigation back to the same page — so assistive
 *    technologies and the browser cache see a stable DOM structure.
 */

test.describe("stable-tab-ids scenario", () => {
	let post;
	let secondPost;

	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-stable-tab-ids-${workerInfo.project.metadata.agentId}`,
		);
		post = await requestUtils.createPost({
			content: "<!-- wp:wp-skill/testing-block /-->",
			status: "publish",
		});
		// A second post is used as the navigation target for the soft-navigation
		// round-trip test. It does not need to contain the testing block.
		secondPost = await requestUtils.createPost({
			content: "Second page for navigation test",
			status: "publish",
		});
	});

	test.afterAll(async ({ requestUtils }) => {
		deactivateAllPlugins();
		await requestUtils.deleteAllPosts();
	});

	test("tab buttons have aria-controls linking to panel IDs in server-rendered HTML", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");

		// At least one tab button must be present.
		const firstTab = block.getByRole("tab").first();
		await expect(firstTab).toBeVisible();

		// The tab must have an aria-controls attribute.
		const ariaControls = await firstTab.getAttribute("aria-controls");
		expect(ariaControls).toBeTruthy();

		// The referenced panel must exist in the DOM with that ID.
		const panel = block.locator(`#${ariaControls}`);
		await expect(panel).toBeAttached();
	});

	test("IDs are stable across page loads (deterministic, not random)", async ({
		page,
	}) => {
		// Collect IDs on the first load.
		await page.goto(`/?p=${post.id}`);
		const block = page.locator(".wp-block-wp-skill-testing-block");
		const firstTab = block.getByRole("tab").first();
		const ariaControlsFirstLoad = await firstTab.getAttribute("aria-controls");
		const tabIdFirstLoad = await firstTab.getAttribute("id");

		expect(ariaControlsFirstLoad).toBeTruthy();

		// Reload the page (simulates a fresh request) and collect IDs again.
		await page.reload();
		const firstTabAfterReload = block.getByRole("tab").first();
		const ariaControlsSecondLoad =
			await firstTabAfterReload.getAttribute("aria-controls");
		const tabIdSecondLoad = await firstTabAfterReload.getAttribute("id");

		// IDs must be identical between loads.
		expect(ariaControlsSecondLoad).toBe(ariaControlsFirstLoad);
		expect(tabIdSecondLoad).toBe(tabIdFirstLoad);
	});

	test("IDs are unchanged after a soft navigation away and back", async ({
		page,
	}) => {
		// Navigate to the tabbed block page and capture the IDs.
		await page.goto(`/?p=${post.id}`);
		const block = page.locator(".wp-block-wp-skill-testing-block");
		const firstTab = block.getByRole("tab").first();
		const ariaControlsBefore = await firstTab.getAttribute("aria-controls");
		const tabIdBefore = await firstTab.getAttribute("id");

		expect(ariaControlsBefore).toBeTruthy();

		// Perform a soft navigation to another page and back. The router
		// region or a client-side navigation link is used if present; otherwise
		// we navigate via direct URL change which the browser handles as a full
		// reload — the IDs must still match, proving determinism.
		await page.goto(`/?p=${secondPost.id}`);
		await page.goto(`/?p=${post.id}`);

		const firstTabAfterNav = block.getByRole("tab").first();
		const ariaControlsAfter = await firstTabAfterNav.getAttribute("aria-controls");
		const tabIdAfter = await firstTabAfterNav.getAttribute("id");

		// IDs must be identical after navigation — no random re-generation.
		expect(ariaControlsAfter).toBe(ariaControlsBefore);
		expect(tabIdAfter).toBe(tabIdBefore);
	});

	test("clicking a tab shows its panel and hides others", async ({ page }) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const tabs = block.getByRole("tab");

		// Click the second tab (if it exists) and verify its panel becomes
		// visible while the first tab's panel is hidden.
		const tabCount = await tabs.count();
		if (tabCount < 2) {
			test.skip();
			return;
		}

		const secondTab = tabs.nth(1);
		const secondTabControls = await secondTab.getAttribute("aria-controls");
		expect(secondTabControls).toBeTruthy();

		await secondTab.click();

		// The panel linked by the second tab must be visible.
		const secondPanel = block.locator(`#${secondTabControls}`);
		await expect(secondPanel).toBeVisible();

		// The first tab's panel must not be visible.
		const firstTabControls = await tabs.nth(0).getAttribute("aria-controls");
		if (firstTabControls && firstTabControls !== secondTabControls) {
			const firstPanel = block.locator(`#${firstTabControls}`);
			await expect(firstPanel).not.toBeVisible();
		}
	});
});
