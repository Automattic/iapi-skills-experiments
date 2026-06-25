<!-- Verbatim copy of GitHub issue Automattic/wordpress-skill-experiments#39, committed with the intent so the phase-0 folder is self-contained. Source: https://github.com/Automattic/wordpress-skill-experiments/issues/39 -->

# Proposal: Interactivity API eval scenario set + folder organization

We want the skillsmith eval suite to drive how we evolve the **Interactivity API reference** in the `wordpress-development` skill. The current handful of scenarios under `eval/scenarios/` was an initial set for exercising the workflow, not real coverage.

This issue proposes:
1. A curated set of **Interactivity-API scenarios** aiming to cover the full API surface with no overlap, and
2. A **folder organization** for them.
Nothing here is built yet — it's a proposal to discuss the scenarios and the organization before we implement them.

## Principles behind the set

- **Interactivity-API-specific only** — every scenario exercises iAPI: `data-wp-*` directives, the `@wordpress/interactivity` store, the `wp_interactivity_*` server helpers, or the client-side router.
- **Real, outcome-focused prompts** — each scenario is phrased as a feature request a user would actually make, describing the behavior they want, not the directives to use.
- **One concept per scenario, no overlap** — the set is heavily de-duplicated.
- **Full coverage** — every concept in the API (directives, store/client API, server-side rendering, client navigation, TypeScript typing, and the common real-world UX patterns) maps to at least one scenario.

Each scenario below lists the user-facing behavior and, in *Tests:*, the iAPI concept it exists to exercise.

**`data-wp-on-async` is intentionally excluded** — it's deprecated (`data-wp-on` is async by default now). We should drop it from the best-practices rubric so an `on-async` answer isn't graded as correct.

## Proposed scenarios & organization

Organize by **iAPI capability / primary concept** (not by UX pattern or difficulty). I guess the list will change/evolve once we start working on the scenarios, but I wanted to start from a solid foundation that we agree on.

| Folder | Count |
|---|---:|
| `foundations` | 3 |
| `reactive-bindings` | 5 |
| `state-and-context` | 9 |
| `derived-state` | 5 |
| `server-rendering` | 3 |
| `events` | 6 |
| `async-actions` | 5 |
| `lifecycle` | 5 |
| `lists` | 4 |
| `client-navigation` | 12 |
| `typescript` | 4 |
| `ux-patterns` | 6 |

### `foundations` — getting iAPI wired up
- **Minimal scaffold** — the smallest correctly-wired interactive block that proves the runtime is alive. *Tests:* the minimal wiring — `supports.interactivity` + `viewScriptModule`, `data-wp-interactive`, and an init callback that runs once per instance.
- **Classic theme dismissible banner** — a dismissible announcement bar rendered from a classic (non-block) theme template. *Tests:* `wp_interactivity_process_directives()` and running iAPI on server HTML outside the block system.
- **Multiple directives on one element** — a block that runs two independent setup steps when it first appears, each wired as its own callback on the same element. *Tests:* the unique-ID directive suffix (`data-wp-init---<id>`, triple-hyphen) for attaching the same directive more than once to one element — the mechanism generalizes to `data-wp-watch` / `data-wp-run`.

### `reactive-bindings` — binding reactive values to the DOM (text / class / style / attributes)
- **Greeting rotator** — a button cycles a displayed greeting through several strings. *Tests:* `data-wp-text` reactive text content driven from state (no manual `textContent` writes).
- **Selectable tile class toggle** — a card whose selected state toggles a highlight, per instance. *Tests:* `data-wp-class--<name>` toggling a CSS class from a boolean.
- **CSS variable progress meter** — a bar whose fill grows/shrinks via buttons. *Tests:* `data-wp-style--<prop>` binding an inline CSS custom property (value from a derived getter).
- **On sale link attribute removal** — a badge whose link/tooltip are present when on sale and fully absent otherwise. *Tests:* `data-wp-bind--<attr>` where a null/false getter removes the attribute entirely (not an empty value).
- **Accessible disclosure toggle** — a show/hide button whose announced state and label stay in sync. *Tests:* boolean-attribute binding (`hidden` / `aria-expanded`) plus a derived label from a single boolean.

### `state-and-context` — where data lives and who can touch it
- **Independent counters** — each instance keeps its own count. *Tests:* per-instance local context (`data-wp-context` + `getContext()`).
- **Nested theme card** — an inner panel inherits some parent values and overrides others. *Tests:* nested context inheritance and selective override.
- **PHP seeded context list** — the initial list is built server-side per instance. *Tests:* server-seeded local context via `wp_interactivity_data_wp_context()`.
- **Product card quantity stepper** — each card tracks its own quantity. *Tests:* choosing local context over global state (the two-instances-share-state footgun); a global-state answer fails.
- **Shared state tally** — every instance shows the same page-wide count. *Tests:* global state shared across instances of one block.
- **Cart count across two blocks** — an "Add to cart" button updates a separate header badge. *Tests:* cross-block communication through one shared global-state namespace.
- **Locked private store** — a widget other plugins can't tamper with. *Tests:* the store `lock` option preventing re-opening/overriding the namespace.
- **Pageview analytics bridge** — a UI-less block forwarding a shared value's changes to an analytics stub. *Tests:* the programmatic `watch()` function subscribing at module load (with unsubscribe).
- **Now playing cross namespace** — an indicator that lights up from another plugin's state. *Tests:* declarative cross-namespace reads (`namespace::state.x`) in a directive, no JS import.

### `derived-state` — computed values from a single source of truth
- **Derived double** — shows a counter and its doubled value. *Tests:* a derived getter computed from one source of truth (global).
- **Price with VAT per instance** — each card shows its price with tax, computed once. *Tests:* a derived getter reading `getContext()` so one getter yields per-instance results (server-seeded via a closure).
- **Tax calculator mixed scope** — one global tax rate applied to each card's own price. *Tests:* a derived getter combining global state with per-instance context.
- **Results panel no flash** — the "No results" message never flashes when there are results. *Tests:* server-computed derived state so the initial HTML is correct before hydration.
- **Shopping list server derived icon** — in-cart items show an icon, correct on first paint. *Tests:* per-row server-computed derived state via a `wp_interactivity_state` closure using `wp_interactivity_get_context()`.

### `server-rendering` — server-side seeding & PHP helpers
- **Config REST fetch with nonce** — a button loads data over REST. *Tests:* `wp_interactivity_config()` / `getConfig()` for immutable server→client values (REST URL + nonce), kept out of state.
- **Welcome banner i18n state** — a localized greeting that's correct on load. *Tests:* translating seeded state on the server (`__()` inside `wp_interactivity_state`), with no client-side translation.
- **Stable tab IDs across navigation** — ARIA-linked IDs that don't change between renders. *Tests:* `wp_unique_id_from_values()` producing deterministic IDs stable across renders and soft navigations.

### `events` — the `data-wp-on` family
- **Like button** — a heart button that toggles liked/unliked and updates a like count when clicked. *Tests:* the basic `data-wp-on--click` element handler — wiring a click to a store action (the simplest event).
- **Live character counter** — a message field showing a live "x / 280" character count that flags going over the limit as the user types. *Tests:* `data-wp-on--input` reacting to each keystroke (basic input-event handling).
- **Viewport width display** — shows the live window width. *Tests:* `data-wp-on-window--resize` (window-level listener lifecycle).
- **Command palette document keydown** — a "/" shortcut opens an overlay from anywhere. *Tests:* `data-wp-on-document--keydown` (page-wide key handling) + `withSyncEvent` `preventDefault`.
- **Menu touch vs hover** — submenu opens on hover with a mouse, on tap with touch. *Tests:* branching on `event.pointerType` inside pointer-event handlers.
- **Newsletter submit guard** — submit shows an inline confirmation without reloading. *Tests:* `withSyncEvent()` to call `event.preventDefault()` synchronously; judgment that the handler must be sync, not async.

### `async-actions` — user-triggered work that takes time
- **Joke of the day fetch** — a button fetches and displays a joke. *Tests:* a generator action (`function*` + `yield`) for async fetch, mutating state after the yield.
- **Load more posts** — a button appends the next batch of posts. *Tests:* fetching and appending results into a growing list (append, not replace).
- **Validated async form** — inline validation + async submit with status states. *Tests:* form handling — validation getters + generator POST + `disabled`/loading/success/error states.
- **Batch processor progress** — processes a large list while staying responsive. *Tests:* `splitTask()` yielding to the main thread inside a long loop.
- **Live scoreboard polling** — a value that refreshes from the server every few seconds. *Tests:* an interval fetch loop (`setInterval` + generator `fetch`) with cleanup on teardown.

### `lifecycle` — behavior tied to an element being on the page
- **Autofocus revealed form** — a revealed form focuses its first field. *Tests:* `data-wp-init` running once on mount with `getElement().ref` focus.
- **Instrumented mount (multi-init)** — two independent setup steps on first render: an analytics "viewed" ping and a separate debug init marker. *Tests:* multiple `data-wp-init---<id>` callbacks on one element (the triple-hyphen form).
- **Counter change watch** — a readout reacts to the count changing, including on mount. *Tests:* `data-wp-watch` re-running on dependency change (and on mount).
- **Interval with cleanup toggle** — an on/off switch starts/stops a ticking timer with no leaks. *Tests:* a `data-wp-watch` cleanup function (teardown on re-run / unmount).
- **Countdown to event** — a live countdown that ends with a message. *Tests:* `withScope()` wrapping a `setInterval` callback so store helpers resolve, with cleanup.
- **In view reveal** — a banner animates in the first time it scrolls into view. *Tests:* `data-wp-run` with `useState`/`useEffect` hooks (+ IntersectionObserver, effect cleanup).

### `lists` — iteration
- **Fruit list with add** — a seeded list with an Add button. *Tests:* `data-wp-each` over a seeded array, `data-wp-each-child` SSR hydration, and in-place `.push()` mutation.
- **Reorderable keyed todo list** — todos that reorder without rebuilding rows. *Tests:* `data-wp-each--<alias>` + `data-wp-each-key` (keyed iteration of objects; DOM reuse on reorder).
- **Image carousel with arrow keys** — a gallery navigated with Left/Right keys. *Tests:* arrow-key navigation over an indexed collection with wrap-around (derived current / has-next).
- **Live search filter** — a list that narrows as you type. *Tests:* a derived filtered list rendered via `data-wp-each` (client-side reactive filtering).

### `client-navigation` — the router
- **Footer client navigation opt in** — a static footer that survives soft transitions. *Tests:* the `supports.interactivity.clientNavigation` opt-in for a no-JS block.
- **Paginated posts router region** — Next/Prev swap only the list, no reload. *Tests:* `data-wp-router-region` + `actions.navigate()` with `data-wp-key` and a no-JS anchor fallback.
- **Prefetch on hover pagination** — hovering a page link preloads it. *Tests:* `actions.prefetch()` on hover + `actions.navigate()` on click.
- **Section jump scroll to top** — soft navigation scrolls back to the top. *Tests:* a post-navigation side effect (`window.scrollTo` after `yield actions.navigate`).
- **Filter bar replace history** — filtering updates the URL without cluttering history. *Tests:* `actions.navigate(url, { replace: true })` (replaceState semantics).
- **Comment form force refresh** — after posting, the list refreshes without a stale cache. *Tests:* `actions.navigate(href, { force: true })` to bypass the cache after a mutation.
- **Resilient link HTML fallback** — a link that shows a fallback panel if the fetch fails. *Tests:* `actions.navigate(url, { html })` fallback after a manual fetch try/catch.
- **External link respects browser** — modifier-clicks and cross-origin links use the browser. *Tests:* guarding on modifier keys / same-origin before `preventDefault` so the router is skipped.
- **Pageview tracker on router state** — fires a pageview on load and on every soft navigation. *Tests:* reacting to the router's `state.url` via `data-wp-watch`.
- **Global toast attached to body** — a toast region present on every page. *Tests:* the `data-wp-router-region` `attachTo` option (dynamic region injection on navigation).
- **Page header server state sync** — a site-wide header shows a server-provided section label that refreshes on each soft navigation, while a "compact view" toggle the reader set persists. *Tests:* `getServerState()` selectively syncing global state across navigations — refresh the server field, leave the client-only field untouched.
- **Recipe card server context sync** — the title updates per page while a client adjustment persists. *Tests:* `getServerContext()` re-syncing local context across navigations.

### `typescript` — typing constraints
- **TypeScript counter inference** — a counter built in TS with no explicit types. *Tests:* typed store via inference (no annotations, generics, or casts).
- **TypeScript server state merge** — a TS counter whose count comes from PHP. *Tests:* typing server-seeded state via `ServerState & typeof storeDef`.
- **TypeScript async and derived types** — a TS counter with an async action and a derived value. *Tests:* `AsyncAction<T>` for generators + explicit derived-getter return types (breaking TS reference cycles).
- **TypeScript typed context import** — a second plugin adds to an existing plugin's store. *Tests:* importing another module's typed `{ state, actions }` (+ typed `getContext<T>()`) with a script-module dependency.

### `ux-patterns` — composed accessible widgets
- **Accessible tabs** — a tab strip with one visible panel. *Tests:* single-active-selection tabs with roving arrow-key navigation and correct ARIA.
- **Accessible accordion** — an FAQ where multiple sections can be open. *Tests:* an independent multi-toggle disclosure group with ARIA, correct before JS runs.
- **Accessible modal dialog** — a modal with focus trap and Escape. *Tests:* dialog semantics present only while open (null-removal), focus trap, Escape, and focus restoration.
- **Image lightbox** — click to zoom an image full-screen. *Tests:* an overlay driven by CSS custom properties from `getBoundingClientRect` + dialog semantics and focus restoration.
- **Side drawer with focus trap** — a hamburger drawer of nav links. *Tests:* off-canvas nav with Tab focus trap, Escape, and focus return to the trigger.
- **Expandable search** — a magnifier button that expands a search field. *Tests:* focus management + outside-click / `focusout` close (`ref.contains(relatedTarget)`).

## Tooling / migration notes

- **Nested subfolders** (`eval/scenarios/<group>/<scenario>/`) is the recommendation. Playwright already discovers specs recursively (`testMatch: **/e2e.spec.mjs`), and the plugin scaffolding is unaffected.
- It needs one small change to `eval/utils/verify-e2e.ts` (so a nested path is used for the spec lookup while failure attribution stays keyed on the scenario dir), and the skillsmith scenario discovery must look one level deeper (`eval/scenarios/*/*/scenario.yaml`).

## Open questions

- Anything you're missing? Any iAPI concept not covered?
- Anything you'd remove?
- Does the organization make sense?

## Next steps

- Settle the above here.
- Implement the agreed scenarios in the skillsmith format (one `scenario.yaml` + `e2e.spec.mjs` each).
- Improve the reference until all scenarios pass.

