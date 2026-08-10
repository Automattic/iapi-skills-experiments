import { expect } from "@wordpress/e2e-test-utils-playwright";

/**
 * Injects a module-type script into the page that probes whether a given
 * WordPress Interactivity API store namespace is locked.
 *
 * The injected script imports `store` from `@wordpress/interactivity` via the
 * WordPress-managed `<head>` importmap, then attempts to re-open `namespace`
 * without the `lock` option (`store(namespace, {})`). If the call succeeds the
 * store is not locked and `window.__lockResult` is set to `"unlocked"`; if it
 * throws (because the namespace was registered with `lock: true`) the result is
 * set to `"locked"`.
 *
 * After injecting the script the function asserts via `expect.poll` that
 * `window.__lockResult` is defined. A missing or changed importmap — which
 * would prevent the module from loading and therefore leave `__lockResult`
 * undefined — surfaces as a loud test failure rather than a silent false
 * negative.
 *
 * Typical usage inside a `locked-private-store` scenario spec:
 *
 * ```js
 * import { addLockProbe } from "../../../utils/e2e-helpers.mjs";
 *
 * await page.goto(postUrl);
 * await addLockProbe(page, "my-plugin/private-store");
 * expect(await page.evaluate(() => window.__lockResult)).toBe("locked");
 * ```
 *
 * @param {import("@playwright/test").Page} page      - The Playwright page object.
 * @param {string}                          namespace - The iAPI store namespace to probe.
 * @returns {Promise<void>} Resolves once the probe script has executed and
 *   `window.__lockResult` is confirmed to be defined.
 */
export async function addLockProbe(page, namespace) {
	await page.addScriptTag({
		type: "module",
		content: `import { store } from "@wordpress/interactivity";
        try { store(${JSON.stringify(namespace)}, {}); window.__lockResult = "unlocked"; }
        catch (e) { window.__lockResult = "locked"; }`,
	});
	await expect.poll(() => page.evaluate(() => window.__lockResult)).toBeDefined();
}
