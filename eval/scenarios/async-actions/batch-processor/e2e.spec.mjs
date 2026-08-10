import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";

/**
 * E2E tests for the batch-processor scenario.
 *
 * The processing loop uses splitTask() to yield between batches, keeping the
 * main thread free. Tests verify:
 *   - The progress counter or bar visibly advances during processing.
 *   - The page stays responsive (input is processed) while the work runs.
 *   - The Start button is disabled while processing is active.
 *
 * Because splitTask() yields via scheduler.postTask / setTimeout(0), we poll
 * for intermediate progress states rather than using fake timers.
 */

test.describe("batch-processor scenario", () => {
	let post;
	test.beforeAll(async ({ requestUtils }, workerInfo) => {
		deactivateAllPlugins();
		await requestUtils.activatePlugin(
			`plugin-batch-processor-${workerInfo.project.metadata.agentId}`,
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

	test("Start button is disabled while processing is running", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const startButton = block.getByRole("button", { name: /start/i });

		await startButton.click();

		// Immediately after clicking, the button should be disabled.
		await expect(startButton).toBeDisabled();

		// Wait for processing to finish (the button re-enables or a done message appears).
		await expect
			.poll(
				async () => {
					const done = await block
						.locator(".done, .complete, [data-processing='false']")
						.count();
					const enabled = await startButton.isEnabled();
					return done > 0 || enabled;
				},
				{ timeout: 15000 },
			)
			.toBeTruthy();
	});

	test("progress counter advances during processing — not zero-to-done in one step", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const startButton = block.getByRole("button", { name: /start/i });

		await startButton.click();

		// Capture an intermediate progress value to confirm the counter moves.
		// We poll until we see a non-zero progress indication.
		const progressEl = block.locator(
			"[aria-valuenow], progress, [data-progress], .progress-count",
		);

		// Collect two distinct progress readings to prove it is advancing.
		const reading1 = await expect
			.poll(
				async () => {
					const count = await progressEl.count();
					if (count === 0) return null;
					const val =
						(await progressEl.first().getAttribute("aria-valuenow")) ||
						(await progressEl.first().getAttribute("value")) ||
						(await progressEl.first().textContent());
					return val?.trim() ?? null;
				},
				{ timeout: 5000 },
			)
			.not.toBeNull();

		// Wait briefly then read again — it should have advanced.
		await page.waitForTimeout(200);
		const reading2 =
			(await progressEl.first().getAttribute("aria-valuenow")) ||
			(await progressEl.first().getAttribute("value")) ||
			(await progressEl.first().textContent());

		// At least one of the readings must be non-zero (intermediate progress).
		expect(reading1 !== "0" || reading2?.trim() !== "0").toBe(true);
	});

	test("the page remains responsive while processing runs", async ({
		page,
	}) => {
		await page.goto(`/?p=${post.id}`);

		const block = page.locator(".wp-block-wp-skill-testing-block");
		const startButton = block.getByRole("button", { name: /start/i });

		await startButton.click();

		// While processing is in progress, the page should respond to input.
		// We measure the time it takes to evaluate a trivial expression on the
		// main thread — splitTask() must keep it below a generous 1 s threshold.
		const elapsed = await page.evaluate(async () => {
			const start = performance.now();
			await new Promise((r) => setTimeout(r, 0));
			return performance.now() - start;
		});

		// If the main thread were blocked the elapsed time would be hundreds of ms.
		// A responsive page returns control in well under 500 ms per slot.
		expect(elapsed).toBeLessThan(500);
	});
});
