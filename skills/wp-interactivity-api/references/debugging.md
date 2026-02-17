# Debugging checklist

1. Confirm the interactive root exists in the rendered HTML (`data-wp-interactive`).
2. Confirm the view script module is loaded (network + source maps).
3. Confirm store namespace matches what markup expects.
4. Check console for errors before any interaction.
5. Reduce scope:
   - temporarily remove directives to isolate which directive/store path breaks.
6. If hydration mismatch occurs:
   - ensure initial state/context matches server markup.

## block.json setup

Verify these fields are correctly configured:

```json
{
  "apiVersion": 3,
  "supports": {
    "interactivity": true
  },
  "viewScriptModule": "file:./view.js"
}
```

Build scripts require the `--experimental-modules` flag:

```json
{
  "scripts": {
    "build": "wp-scripts build --experimental-modules",
    "start": "wp-scripts start --experimental-modules"
  }
}
```

## Common failure patterns

### Directives present but inert

- `viewScriptModule` not enqueued or wrong path.
- Missing `data-wp-interactive` on a parent element.
- Store namespace mismatch between HTML directives and `store()` call.
- JavaScript error before hydration runs.

### Hydration mismatch / flicker

- Server-rendered markup differs from what the client expects.
- Derived state not defined in PHP — use `wp_interactivity_state()` with closures.
- State initialized in both PHP and JS with different values.

### Layout shift on load

- Derived state like `state.hasItems` missing on server, so `hidden` attribute is absent in initial HTML.
- Fix by defining derived values in PHP (see `references/server-side-rendering.md`).

### Async actions not working

- Using `async/await` instead of generator functions (`function*` + `yield`).
- Forgetting to `yield` promises inside generators.

### `event.preventDefault()` not working

- Not wrapping the action in `withSyncEvent()` (required since WP 6.8).
- Using `data-wp-on-async` (deprecated) instead of `data-wp-on` + `withSyncEvent()`.

### Context not accessible

- Trying to access context outside an interactive region (`data-wp-interactive`).
- Nested context not merging as expected — child contexts override, not deep-merge.
- `getContext()` called without the correct namespace.

### `ref` is null

- Accessing `getElement().ref` during first render or inside `wp-run` without checking.
- Use `useEffect` or `useInit` hooks inside `wp-run` callbacks for safe DOM access.

## WordPress 6.8+ specific issues

**`event.preventDefault()` deprecation warning:**
- All `wp-on` handlers now run asynchronously by default.
- Synchronous event methods require `withSyncEvent()`.
- `data-wp-on-async` is deprecated — use `data-wp-on` instead (same behavior).

## WordPress 6.9 specific issues

**State not persisting across navigation:**
- `getServerState()` and `getServerContext()` now reset between client-side page transitions.
- If you relied on stale values persisting, refactor to use the store's reactive state instead.

**Multiple plugins conflicting on same element:**
- Use unique directive IDs with the `---` separator to avoid attribute collisions.
- Example: `data-wp-on--click---my-plugin="actions.handle"`

**`data-wp-ignore` not working:**
- This directive is deprecated in 6.9 and will be removed. It caused context inheritance and navigation bugs.
- Find an alternative approach (conditional rendering, separate interactive regions).

**Router regions / overlays not rendering:**
- WordPress 6.9 adds `attachTo` property for router regions to render overlays anywhere on the page.
- Ensure nested router regions are properly structured.

## External references

- [Interactivity API Best Practices in 6.8](https://make.wordpress.org/core/2025/03/24/interactivity-api-best-practices-in-6-8/)
- [Changes to the Interactivity API in WordPress 6.9](https://make.wordpress.org/core/2025/11/12/changes-to-the-interactivity-api-in-wordpress-6-9/)
- [Interactivity API Dev Note (6.5)](https://make.wordpress.org/core/2024/03/04/interactivity-api-dev-note/)
