# Code Plan: Complete iAPI eval scenario set + folder organization

## Overview

This plan implements a curated set of **68 WordPress Interactivity-API (iAPI) eval scenarios**
organized into a **12-group capability taxonomy** nested one level deep under
`eval/scenarios/<group>/<scenario>/`. Each scenario is authored as a Skillsmith
`scenario.yaml` plus a Playwright `e2e.spec.mjs`, written **test-first (TDD-style) and NOT
executed** in this run. The plan runs in three phases. **Phase 1 (foundation, Tasks 1-3,
serial):** bump `@automattic/skillsmith` to the nested-folder-capable trunk SHA, patch
`eval/utils/verify-e2e.ts` `scenarioDirOf()`, add the new `eval/utils/e2e-helpers.mjs`
helper, and drop the deprecated `data-wp-on-async--<event>` line from the shared rubric.
**Phase 2 (migration, Task 4, after Phase 1):** `git mv` the 9 existing scenarios that map
onto curated ones into their nested homes (renaming 6, reworking 2 of those) and `git rm`
the 2 non-curated scenarios plus the `_candidates.yaml` index. **Phase 3 (authoring, Tasks
5-16, parallelizable after Phase 2):** author the remaining scenarios from scratch, batched
one task per capability group. The end state is a fully curated `eval/scenarios/` tree
containing exactly the 68 scenarios with no non-curated directories remaining.

This is an eval-scenario **authoring** task, not runtime feature code. There is no separate
"implementation" to unit-test; the `scenario.yaml` + `e2e.spec.mjs` pairs **are** the
deliverable. Every authoring task is therefore assigned to `code-writer-e2e`. The three
foundation/migration tasks are straightforward source edits / file moves and are assigned to
`code-writer-tdd` (the foundation code — `scenarioDirOf` and `addLockProbe` — has testable
behavior), except the rubric edit and the migration which have no unit-testable runtime
surface and are noted as plain edits within their task.

## E2E test plan

This project's "e2e tests" are the per-scenario `e2e.spec.mjs` files that this plan
authors. They are written test-first and **not executed** in this run. The acceptance
criteria below are repository-state criteria (the spec defines acceptance as "the state of
the repository at the end of this work"), re-expressed as the end-to-end checks a reviewer
re-drives by inspection. Per-scenario runtime assertion flows are captured in the authoring
tasks (Tasks 4-16) and the conventions in **E2E spec conventions** below; they are not
re-listed per scenario here.

### Flow 1: Curated tree is exactly the 68 scenarios

- **Steps:** List `eval/scenarios/` recursively. Compare the group directories and the
  leaf scenario directories against the **Scenario directory mapping** table below.
- **Expected:** Exactly 12 group directories (`foundations`, `reactive-bindings`,
  `state-and-context`, `derived-state`, `server-rendering`, `events`, `async-actions`,
  `lifecycle`, `lists`, `client-navigation`, `typescript`, `ux-patterns`) and exactly the
  68 leaf scenario directories listed. No `counter`, `toggle-visibility`, or
  `_candidates.yaml` remains; no flat scenario directory remains; no non-curated directory
  exists; no `scenario.yaml` exists at a group level (only at leaves).
- **Traces to:** Acceptance criterion 1, 2

### Flow 2: Every scenario directory is well-formed

- **Steps:** For each of the 68 `eval/scenarios/<group>/<scenario>/` directories, confirm
  it contains a `scenario.yaml` and an `e2e.spec.mjs`.
- **Expected:** Every directory contains both files (no scenario omits its e2e — analysis
  found every scenario has testable runtime behavior). `scenario.yaml` has `name` equal to
  the directory name (kebab-case), `description` (one line), `skills:
  [wordpress-development]`, a `prompt`, an `acceptance` list, and `rubrics:
  [wp-interactivity-api-best-practices]`.
- **Traces to:** Acceptance criterion 2, 3

### Flow 3: Prompts are user-language, acceptance is scenario-specific

- **Steps:** Read each `scenario.yaml` `prompt` and `acceptance`. Cross-check `prompt`
  against iAPI vocabulary; cross-check `acceptance` against the shared rubric.
- **Expected:** No `prompt` names an iAPI directive (`data-wp-*`), store API (`store`,
  `getContext`, `getConfig`, `getElement`, `withSyncEvent`, `watch`, etc.), server helper
  (`wp_interactivity_*`), or other implementation mechanism; inherently technical asks are
  phrased as user constraints. Every `acceptance` item is unique to that scenario and none
  restates a generic wiring/reactivity expectation the shared rubric already owns.
- **Traces to:** Acceptance criterion 4, 5

### Flow 4: e2e specs follow repo conventions and are runnable in shape

- **Steps:** Read each `e2e.spec.mjs`. Confirm it imports `deactivateAllPlugins` from
  `../../../utils/wp-cli.mjs` (three levels up), activates
  `plugin-<scenario>-<agentId>`, targets `wp-skill/testing-block` (except
  `classic-theme-banner`), and asserts the scenario's user-facing behavior. Confirm any
  referenced helper/fixture exists.
- **Expected:** Each spec is self-consistent and runnable in shape; it references no
  non-existent helper or fixture. `locked-private-store` imports `addLockProbe` from
  `../../../utils/e2e-helpers.mjs`, which exists. `pageview-analytics-bridge` inlines its
  analytics stub. `classic-theme-banner` locates the banner by `data-wp-interactive` /
  class rather than the testing-block.
- **Traces to:** Acceptance criterion 6, 7

### Flow 5: Tooling supports the nested layout end-to-end

- **Steps:** Resolve `package.json`'s `@automattic/skillsmith`; install. Inspect
  `eval/utils/verify-e2e.ts` `scenarioDirOf()`. Inspect the rubric.
- **Expected:** `@automattic/skillsmith` points at trunk SHA
  `95c86bdbbcae79c4dc46dea07d15fd5d69e4ee2d` (nested-folder-capable) and installs. A nested
  spec path `<group>/<scenario>/e2e.spec.mjs` resolves to the key `<group>/<scenario>` so
  failure attribution stays keyed on the scenario dir. The rubric no longer permits
  `data-wp-on-async--<event>` and still covers the generic best practices it covered
  before.
- **Traces to:** Acceptance criterion 8, 9, 10

## E2E spec conventions (apply to every authored `e2e.spec.mjs`)

Every authoring task below must produce specs that follow these conventions verbatim. They
are stated once here and referenced by every scenario task so the code-writer never
re-derives them.

- **Imports (note the THREE-level-up paths for nested specs):**
  ```js
  import { expect, test } from "@wordpress/e2e-test-utils-playwright";
  import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";
  // ONLY the locked-private-store spec also imports:
  import { addLockProbe } from "../../../utils/e2e-helpers.mjs";
  ```
- **Lifecycle.** `test.beforeAll`: call `deactivateAllPlugins()`, then
  `await requestUtils.activatePlugin(`plugin-<scenario>-${workerInfo.project.metadata.agentId}`)`,
  then create the post(s)/page(s) the scenario needs. `test.afterAll`:
  `deactivateAllPlugins()` + `await requestUtils.deleteAllPosts()` (and delete any created
  pages).
- **Block markup.** Use the fixed block name `wp-skill/testing-block`:
  `<!-- wp:wp-skill/testing-block /-->`. For multi-instance scenarios, embed it twice and
  address instances via `.locator(".wp-block-wp-skill-testing-block").nth(0)` / `.nth(1)`.
  **`classic-theme-banner` is the sole exception:** create any post (no testing-block in the
  content) and locate the banner by its `data-wp-interactive` attribute or a distinctive
  class; record this exception in that scenario's `acceptance`.
- **Selectors.** Prefer role-based (`getByRole("button", { name: /…/i })`), then text
  (`getByText`), then attribute (`locator("[data-wp-text]")`). Class-only selectors are
  reserved for the block wrapper (`.wp-block-wp-skill-testing-block`).
- **Reactive DOM/state.** `toContainText`, `toHaveAttribute`, `expect.poll(...)` for async
  hydration markers (the `page.on("console", …)` pattern from `minimal-scaffold`).
- **Accessibility tree.** Assert ARIA via `toHaveAttribute("aria-expanded", "true")`,
  `role="dialog"` present/absent, etc.
- **Server-rendered HTML.** For SSR scenarios, assert content is correct before hydration
  signals (the directive's target reads correctly from seeded state/context).
- **Router navigation.** `page.click(...)` on a nav link, then `await page.waitForURL(...)`
  / `expect(page).toHaveURL(...)` to assert soft navigation.
- **Fake timers.** `await page.clock.install(); await page.clock.runFor(ms)` for
  `setInterval` / `setTimeout`-driven scenarios.
- **IntersectionObserver.** Trigger via
  `page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))`.
- **Not executed.** Do NOT run the specs in this run; author them so they are runnable in
  shape against a later correct implementation.

## scenario.yaml authoring rules (apply to every authored `scenario.yaml`)

- Fields, in order: `name`, `description`, `skills`, `prompt`, `acceptance`, `rubrics`.
- `name` equals the directory name, kebab-case, **globally unique across all 68** (a
  duplicate `name` makes Skillsmith throw at enumeration). The directory names in the
  mapping table are already verified unique — use them verbatim.
- `description` — one sentence, present tense, describing what the block does.
- `skills` — `[wordpress-development]`. `rubrics` — `[wp-interactivity-api-best-practices]`.
- `prompt` — a realistic, outcome-focused feature request phrased as a non-expert user would
  write it. It describes the behavior the user wants and **never** names an iAPI directive,
  store/server API, or other implementation mechanism. Inherently technical asks ("build it
  in TypeScript with full type safety", "harden it so other plugins can't tamper with it")
  are phrased as user constraints, not directive names.
- `acceptance` — **only** criteria unique to this scenario: the specific behavior and the
  distinct iAPI concept it exercises (per the "Tests:" note in each scenario's row of the
  mapping table). Do **not** restate generic wiring/reactivity expectations the shared
  rubric already owns (block.json wiring, namespace, server seeding, "directives not manual
  DOM", generator async form, etc.).

## Scenario directory mapping (all 68)

Directory name equals the `scenario.yaml` `name` field in every case. The "Concept it
exercises" column is the basis for the scenario-specific `acceptance` and the e2e
assertions; full per-scenario descriptions are in `base/0-intent/proposal.md` and
`base/2-design-doc/design-doc.md`. "Source" is migrate / new.

| Task | Group | Directory / `name` | Source | Concept it exercises (drives acceptance + e2e) |
|---|---|---|---|---|
| 4 | `foundations` | `minimal-scaffold` | migrate (`git mv`, unchanged) | minimal wiring + init callback once per instance |
| 4 | `state-and-context` | `independent-counters` | migrate (`git mv`, unchanged) | per-instance local context |
| 4 | `derived-state` | `derived-double` | migrate (`git mv`, unchanged) | derived getter from one global source |
| 4 | `state-and-context` | `shared-state-tally` | migrate + rename from `shared-state` | global state shared across instances |
| 4 | `server-rendering` | `config-rest-nonce` | migrate + rename from `config-fetch` | `getConfig()` for immutable server→client values |
| 4 | `lists` | `fruit-list-with-add` | migrate + rename from `fruit-list-each` | `data-wp-each` SSR hydration + in-place push |
| 4 | `client-navigation` | `paginated-posts-router` | migrate + rename from `paginated-list` | router region + `navigate()` + no-JS fallback |
| 4 | `async-actions` | `joke-fetch` | migrate + rename + **rework** from `async-fetch` | generator fetch action, mutate after yield |
| 4 | `ux-patterns` | `side-drawer` | migrate + rename + **rework** from `focus-trap-menu` | off-canvas nav, focus trap, Escape, focus return |
| 5 | `foundations` | `classic-theme-banner` | new | iAPI on classic-theme server HTML outside the block system |
| 5 | `foundations` | `multi-directive-element` | new | unique-ID directive suffix (`data-wp-init---<id>`) |
| 6 | `reactive-bindings` | `greeting-rotator` | new | `data-wp-text` reactive text from state |
| 6 | `reactive-bindings` | `selectable-tile` | new | `data-wp-class--<name>` from a boolean |
| 6 | `reactive-bindings` | `css-variable-progress` | new | `data-wp-style--<prop>` inline CSS custom property |
| 6 | `reactive-bindings` | `on-sale-attribute` | new | `data-wp-bind--<attr>` null/false removes the attribute |
| 6 | `reactive-bindings` | `accessible-disclosure` | new | boolean-attribute binding + `aria-expanded` + derived label |
| 7 | `state-and-context` | `nested-theme-card` | new | nested context inheritance + selective override |
| 7 | `state-and-context` | `php-seeded-context` | new | server-seeded local context |
| 7 | `state-and-context` | `product-quantity-stepper` | new | choosing local context over global state (footgun) |
| 7 | `state-and-context` | `cart-count-cross-block` | new | cross-block via one shared global-state namespace |
| 7 | `state-and-context` | `locked-private-store` | new | store `lock` option preventing re-open/override |
| 7 | `state-and-context` | `pageview-analytics-bridge` | new | programmatic `watch()` subscribe at module load + unsubscribe |
| 7 | `state-and-context` | `cross-namespace-now-playing` | new | declarative cross-namespace reads (`namespace::state.x`) |
| 8 | `derived-state` | `price-with-vat` | new | derived getter reading `getContext()`, per-instance |
| 8 | `derived-state` | `tax-calculator-mixed` | new | derived getter combining global state + per-instance context |
| 8 | `derived-state` | `results-no-flash` | new | server-computed derived state, correct initial HTML |
| 8 | `derived-state` | `shopping-list-server-derived` | new | per-row server-computed derived state via state closure |
| 9 | `server-rendering` | `welcome-banner-i18n` | new | translating seeded state on the server, no client translation |
| 9 | `server-rendering` | `stable-tab-ids` | new | deterministic IDs stable across renders / soft navigations |
| 10 | `events` | `like-button` | new | basic `data-wp-on--click` element handler |
| 10 | `events` | `live-char-counter` | new | `data-wp-on--input` per keystroke |
| 10 | `events` | `viewport-width-display` | new | `data-wp-on-window--resize` window-level listener |
| 10 | `events` | `command-palette-keydown` | new | `data-wp-on-document--keydown` + `withSyncEvent` preventDefault |
| 10 | `events` | `menu-touch-hover` | new | branching on `event.pointerType` in pointer handlers |
| 10 | `events` | `newsletter-submit-guard` | new | `withSyncEvent()` sync `preventDefault`; handler must be sync |
| 11 | `async-actions` | `load-more-posts` | new | fetch + append into a growing list (append, not replace) |
| 11 | `async-actions` | `validated-async-form` | new | validation getters + generator POST + disabled/loading/success/error |
| 11 | `async-actions` | `batch-processor` | new | `splitTask()` yielding to the main thread in a long loop |
| 11 | `async-actions` | `live-scoreboard-polling` | new | interval fetch loop (`setInterval` + generator) + cleanup |
| 12 | `lifecycle` | `autofocus-revealed-form` | new | `data-wp-init` once on mount with `getElement().ref` focus |
| 12 | `lifecycle` | `instrumented-mount` | new | multiple `data-wp-init---<id>` callbacks on one element |
| 12 | `lifecycle` | `counter-change-watch` | new | `data-wp-watch` re-running on dependency change + on mount |
| 12 | `lifecycle` | `interval-with-cleanup` | new | `data-wp-watch` cleanup function (teardown on re-run/unmount) |
| 12 | `lifecycle` | `countdown-to-event` | new | `withScope()` wrapping a `setInterval` callback + cleanup |
| 12 | `lifecycle` | `in-view-reveal` | new | `data-wp-run` with hooks + IntersectionObserver + cleanup |
| 13 | `lists` | `reorderable-todo-list` | new | `data-wp-each--<alias>` + `data-wp-each-key` keyed iteration |
| 13 | `lists` | `image-carousel` | new | arrow-key nav over indexed collection with wrap-around |
| 13 | `lists` | `live-search-filter` | new | derived filtered list rendered via `data-wp-each` |
| 14 | `client-navigation` | `footer-client-nav` | new | `supports.interactivity.clientNavigation` opt-in for a no-JS block |
| 14 | `client-navigation` | `prefetch-on-hover` | new | `actions.prefetch()` on hover + `navigate()` on click |
| 14 | `client-navigation` | `section-jump-scroll` | new | post-navigation side effect (`scrollTo` after `yield navigate`) |
| 14 | `client-navigation` | `filter-bar-replace-history` | new | `navigate(url, { replace: true })` replaceState semantics |
| 14 | `client-navigation` | `comment-force-refresh` | new | `navigate(href, { force: true })` to bypass cache after mutation |
| 14 | `client-navigation` | `resilient-link-fallback` | new | `navigate(url, { html })` fallback after manual fetch try/catch |
| 14 | `client-navigation` | `external-link-respect` | new | guard modifier keys / same-origin before preventDefault |
| 14 | `client-navigation` | `pageview-tracker` | new | reacting to router `state.url` via `data-wp-watch` |
| 14 | `client-navigation` | `global-toast` | new | `data-wp-router-region` `attachTo` (dynamic region injection) |
| 14 | `client-navigation` | `page-header-server-sync` | new | `getServerState()` selectively syncing global state across nav |
| 14 | `client-navigation` | `recipe-card-server-context` | new | `getServerContext()` re-syncing local context across nav |
| 15 | `typescript` | `ts-counter-inference` | new | typed store via inference (no annotations/generics/casts) |
| 15 | `typescript` | `ts-server-state-merge` | new | typing server-seeded state via `ServerState & typeof storeDef` |
| 15 | `typescript` | `ts-async-derived` | new | `AsyncAction<T>` for generators + explicit derived return types |
| 15 | `typescript` | `ts-typed-context-import` | new | importing another module's typed `{ state, actions }` + dep |
| 16 | `ux-patterns` | `accessible-tabs` | new | single-active tabs, roving arrow-key nav, correct ARIA |
| 16 | `ux-patterns` | `accessible-accordion` | new | independent multi-toggle disclosure group, ARIA, correct pre-JS |
| 16 | `ux-patterns` | `accessible-modal` | new | dialog semantics only while open, focus trap, Escape, restore |
| 16 | `ux-patterns` | `image-lightbox` | new | overlay via CSS vars from `getBoundingClientRect` + dialog + restore |
| 16 | `ux-patterns` | `expandable-search` | new | focus mgmt + outside-click / `focusout` close (`ref.contains`) |

**Deleted in Task 4 (not migrated):** `counter` (`git rm` — no curated counterpart),
`toggle-visibility` (`git rm` — subsumed by `reactive-bindings/accessible-disclosure`),
`_candidates.yaml` (`git rm` — superseded by the curated set).

## Tasks

### Task 1: Bump Skillsmith, patch `scenarioDirOf()`, drop deprecated rubric directive

- **Goal:** Land the three small source/config changes that make the nested layout work and
  close the deprecated-directive grading gap, all independent of the scenario tree.
- **Type:** tdd
- **Files to change:**
  - `package.json` — repin `@automattic/skillsmith`.
  - `eval/utils/verify-e2e.ts` — patch `scenarioDirOf()` only.
  - `eval/rubrics/wp-interactivity-api-best-practices.md` — drop one directive (plain edit,
    no unit test).
- **Changes:**
  - In `package.json`, set `"@automattic/skillsmith"` to
    `"github:Automattic/skillsmith#95c86bdbbcae79c4dc46dea07d15fd5d69e4ee2d"` (replacing the
    current pin `…#6bd90c34d88b815fdf4fd661dc8c51288111444c`). Run the project's install so
    the lockfile/`node_modules` resolve to the new SHA, and confirm install succeeds.
  - In `eval/utils/verify-e2e.ts`, replace the body of `scenarioDirOf(file)` so that for a
    path with ≥ 3 non-empty segments it returns the third-to-last and second-to-last
    segments joined with `/` (i.e. `<group>/<scenario>`), for exactly 2 segments returns the
    single second-to-last segment (legacy flat fallback), and otherwise returns `undefined`.
    The reported spec path is always `<group>/<scenario>/e2e.spec.mjs` (3 segments), so the
    ≥ 3 branch fires post-migration. Update the function's doc comment to describe the nested
    behavior. Do NOT change spec-path construction (line ~74), the `nameToDir`/`dirToName`
    maps, the wp-env lifecycle, or `parsePlaywrightReport`.
  - In `eval/rubrics/wp-interactivity-api-best-practices.md`, in the "Reactivity and
    directives" section's `data-wp-on*` family bullet, remove `data-wp-on-async--<event>`
    from the enumeration so the bullet lists only `data-wp-on--<event>`,
    `data-wp-on-window--<event>`, and `data-wp-on-document--<event>`. Change nothing else in
    the rubric.
- **Depends on:** none
- **Traces to:** Spec requirements 11, 12, 13; Acceptance criteria 8, 9, 10; Design
  decisions "Pin `@automattic/skillsmith` to trunk SHA", "Patch `scenarioDirOf()`", "Drop
  `data-wp-on-async--<event>` from the rubric"
- **Acceptance:**
  - `package.json`'s `@automattic/skillsmith` resolves to trunk SHA
    `95c86bdbbcae79c4dc46dea07d15fd5d69e4ee2d`, and installing the dependency succeeds.
  - `scenarioDirOf("foundations/minimal-scaffold/e2e.spec.mjs")` returns
    `"foundations/minimal-scaffold"`.
  - `scenarioDirOf("counter/e2e.spec.mjs")` returns `"counter"` (2-segment flat fallback
    preserved).
  - `scenarioDirOf("e2e.spec.mjs")` and `scenarioDirOf("")` return `undefined`.
  - An absolute path ending in `…/eval/scenarios/<group>/<scenario>/e2e.spec.mjs` returns
    `"<group>/<scenario>"` (last group+scenario segments, not deeper ancestors).
  - The rubric no longer contains `data-wp-on-async`, and the `data-wp-on*` family bullet
    still lists `data-wp-on--<event>`, `data-wp-on-window--<event>`, and
    `data-wp-on-document--<event>`; all other rubric sections (Block wiring, Server-side
    initialization, the rest of Reactivity and directives, Async actions) are byte-for-byte
    unchanged.

### Task 2: Add the `addLockProbe` shared e2e helper

- **Goal:** Create the one new shared harness helper the `locked-private-store` scenario
  depends on, so its spec (authored in Task 7) references an existing module.
- **Type:** tdd
- **Files to change:** `eval/utils/e2e-helpers.mjs` (new).
- **Changes:** Create `eval/utils/e2e-helpers.mjs` as an ESM module exporting exactly one
  async function `addLockProbe(page, namespace)`. It injects a `type: "module"` script via
  `page.addScriptTag` whose content imports `store` from `@wordpress/interactivity` (resolved
  through WordPress's `<head>` importmap), attempts to re-open `namespace` without the `lock`
  key (`store(namespace, {})` inside a try/catch), and writes
  `window.__lockResult = "unlocked"` on success or `"locked"` on a thrown error. After
  injecting the script it must guard against silent importmap failure by asserting (via
  `expect.poll`) that `window.__lockResult` is *defined* — so a missing/changed importmap
  surfaces as a test failure rather than a false negative. The helper is a thin wrapper over
  `page.addScriptTag`; introduce no other exports. Reference sketch (design doc, "Harness
  capabilities"):
  ```js
  export async function addLockProbe(page, namespace) {
    await page.addScriptTag({
      type: "module",
      content: `import { store } from "@wordpress/interactivity";
        try { store(${JSON.stringify(namespace)}, {}); window.__lockResult = "unlocked"; }
        catch (e) { window.__lockResult = "locked"; }`,
    });
    await expect.poll(() => page.evaluate(() => window.__lockResult)).toBeDefined();
  }
  ```
- **Depends on:** none (can run in parallel with Task 1)
- **Traces to:** Spec requirements 7, 8; Acceptance criteria 6, 7; Design decision "One
  shared e2e helper (`addLockProbe`)"
- **Acceptance:**
  - `eval/utils/e2e-helpers.mjs` exists and exports an async `addLockProbe(page, namespace)`
    and no other symbol.
  - `addLockProbe` injects a `type: "module"` script via `page.addScriptTag` that imports
    `store` from `@wordpress/interactivity` and re-opens `namespace` **without** a `lock`
    key.
  - The injected script sets `window.__lockResult` to `"locked"` when the re-open throws and
    `"unlocked"` when it does not.
  - After injecting the script, `addLockProbe` asserts `window.__lockResult` is defined, so a
    missing importmap fails loudly.
  - The module is importable as `import { addLockProbe } from "../../../utils/e2e-helpers.mjs"`
    from a nested scenario spec (correct relative depth from
    `eval/scenarios/<group>/<scenario>/`).

### Task 3 (REMOVED — folded into Task 1)

The rubric edit is part of Task 1. This number is intentionally retired to keep Task 1 a
single coherent foundation commit; no separate task exists.

### Task 4: Migrate the 9 existing scenarios; delete the 2 non-curated + the index

- **Goal:** Relocate the 9 existing scenarios that map onto curated ones into their nested
  homes (renaming 6, reworking 2) preserving git history, and remove the 2 non-curated
  scenarios and the candidates index, so no flat or non-curated directory remains.
- **Type:** e2e
- **Files to change (each scenario = its `scenario.yaml` + `e2e.spec.mjs` pair):**
  - `git mv eval/scenarios/minimal-scaffold` → `eval/scenarios/foundations/minimal-scaffold`
  - `git mv eval/scenarios/independent-counters` →
    `eval/scenarios/state-and-context/independent-counters`
  - `git mv eval/scenarios/derived-double` → `eval/scenarios/derived-state/derived-double`
  - `git mv eval/scenarios/shared-state` →
    `eval/scenarios/state-and-context/shared-state-tally` (**rename**)
  - `git mv eval/scenarios/config-fetch` →
    `eval/scenarios/server-rendering/config-rest-nonce` (**rename**)
  - `git mv eval/scenarios/fruit-list-each` → `eval/scenarios/lists/fruit-list-with-add`
    (**rename**)
  - `git mv eval/scenarios/paginated-list` →
    `eval/scenarios/client-navigation/paginated-posts-router` (**rename**)
  - `git mv eval/scenarios/async-fetch` → `eval/scenarios/async-actions/joke-fetch`
    (**rename + rework**)
  - `git mv eval/scenarios/focus-trap-menu` → `eval/scenarios/ux-patterns/side-drawer`
    (**rename + rework**)
  - `git rm -r eval/scenarios/counter`
  - `git rm -r eval/scenarios/toggle-visibility`
  - `git rm eval/scenarios/_candidates.yaml`
- **Changes:**
  - Create the group directories as needed and `git mv` each scenario directory (both files
    move together) to preserve history. Do **not** delete-and-recreate.
  - **Fix the import depth in every moved `e2e.spec.mjs`:** the flat specs import from
    `../../utils/…`; after moving one level deeper they must import from `../../../utils/…`.
    Update every `../../utils/` to `../../../utils/` in each moved spec.
  - **Update `name` in every renamed `scenario.yaml`** to equal its new directory name
    (`shared-state-tally`, `config-rest-nonce`, `fruit-list-with-add`,
    `paginated-posts-router`, `joke-fetch`, `side-drawer`); for the 3 unchanged names
    (`minimal-scaffold`, `independent-counters`, `derived-double`) the `name` already
    matches — leave it.
  - **Rework `joke-fetch`** (from `async-fetch`): re-word `prompt` to a non-expert
    "joke of the day" feature request that names no directive/store API (the existing prompt
    is acceptable in shape but must not name mechanisms); ensure `description` is present
    tense; trim `acceptance` so it contains only the generator-fetch concept and the joke
    behavior unique to this scenario (drop any item the shared rubric already owns — e.g.
    "server-rendered HTML reflects initial empty value" and "no manual DOM writes" are
    rubric-owned). Keep/adjust the e2e to assert the user-facing flow (click "Fetch joke" →
    joke text appears in the paragraph) with a stubbed/intercepted response, following the
    spec conventions.
  - **Rework `side-drawer`** (from `focus-trap-menu`): re-word `prompt` to a hamburger
    off-canvas drawer of nav links in user language; set `acceptance` to the
    side-drawer-specific concept (Tab focus trap, Escape to close, focus returns to the
    trigger), dropping anything rubric-owned. Update the e2e to drive: open via the trigger,
    Tab cycles within the drawer, Escape closes, focus returns to the trigger button.
  - **Verify `minimal-scaffold` post-move:** its `name` stays `minimal-scaffold`, its spec
    now imports from `../../../utils/wp-cli.mjs`, and it still asserts the Hello text +
    `iapi-ready` hydration log.
- **Depends on:** Task 1 (so the nested layout and `scenarioDirOf` are in place; the bumped
  Skillsmith enumerates the nested paths). Independent of Tasks 2.
- **Traces to:** Spec requirements 1, 2, 3, 4, 5, 6; Acceptance criteria 1, 2, 4, 5, 6;
  Design decision "Migrate 9 scenarios with `git mv`; delete 2 + the candidates index"
- **Acceptance:**
  - All 9 scenarios live at their nested target paths above; each still contains a
    `scenario.yaml` and an `e2e.spec.mjs`; git records these as renames/moves (history
    preserved).
  - `eval/scenarios/counter/`, `eval/scenarios/toggle-visibility/`, and
    `eval/scenarios/_candidates.yaml` no longer exist; no flat scenario directory remains at
    `eval/scenarios/<scenario>/`.
  - Every moved `e2e.spec.mjs` imports its helpers from `../../../utils/…` (three levels up),
    not `../../utils/…`.
  - Each renamed `scenario.yaml`'s `name` equals its new directory name; the 3 unchanged
    names are untouched and still match their directories.
  - `joke-fetch`'s `prompt` names no iAPI directive/store/server API, its `acceptance`
    contains only joke-of-the-day + generator-fetch-specific items (nothing the shared rubric
    already covers), and its e2e asserts the click-to-fetch-and-display flow.
  - `side-drawer`'s `prompt` names no iAPI directive/store/server API, its `acceptance`
    contains only the focus-trap/Escape/focus-return items, and its e2e drives open → Tab
    trap → Escape close → focus restoration.
  - `minimal-scaffold` (unchanged content) still asserts the Hello text and the `iapi-ready`
    hydration console log, now from its nested location.

### Task 5: Author `foundations` group (2 new scenarios)

- **Goal:** Author the 2 net-new `foundations` scenarios as `scenario.yaml` + `e2e.spec.mjs`
  pairs.
- **Type:** e2e
- **Files to change (create):**
  - `eval/scenarios/foundations/classic-theme-banner/scenario.yaml` + `e2e.spec.mjs`
  - `eval/scenarios/foundations/multi-directive-element/scenario.yaml` + `e2e.spec.mjs`
- **Changes:** For each scenario, write a `scenario.yaml` per the **scenario.yaml authoring
  rules** and an `e2e.spec.mjs` per the **E2E spec conventions** above, driving the concept
  in that scenario's mapping-table row.
  - `classic-theme-banner` — a dismissible announcement bar rendered from a classic
    (non-block) theme template. **Sole exception to the fixed block name:** the agent's
    plugin hooks `wp_footer` and emits the banner HTML, processing its directives outside the
    block pipeline; the spec creates **any** post (no `wp-skill/testing-block` in content) and
    locates the banner by its `data-wp-interactive` attribute or a distinctive class.
    **Record this off-convention scoping explicitly in the scenario's `acceptance`** so
    reviewers do not flag it. The e2e asserts the banner shows on load and dismisses on click.
  - `multi-directive-element` — a block that runs two independent setup steps when it first
    appears, each wired as its own callback on the same element (the unique-ID directive
    suffix, triple-hyphen form). The e2e asserts both setup steps run on mount (e.g. via two
    distinct console markers / two observable effects).
- **Depends on:** Task 4 (group dir `foundations/` exists from the `minimal-scaffold`
  migration; nested layout and tooling in place). Parallelizable with Tasks 6-16.
- **Traces to:** Spec requirements 1, 2, 4, 5, 6, 7; Acceptance criteria 1, 2, 4, 5, 6;
  Design decisions "Nested one-level taxonomy", "classic-theme-banner exception"
- **Acceptance:**
  - Both directories exist under `eval/scenarios/foundations/`, each with a `scenario.yaml`
    and an `e2e.spec.mjs`; each `name` equals its directory name and is unique.
  - Each `prompt` names no iAPI directive/store/server API; each `acceptance` is
    scenario-specific (no rubric-owned restatement).
  - `classic-theme-banner`'s `acceptance` records the `wp_footer` / non-testing-block
    exception, and its e2e locates the banner by `data-wp-interactive` / class (not the
    testing-block) and asserts show-on-load + dismiss-on-click.
  - `multi-directive-element`'s e2e asserts both independent mount callbacks run.
  - Both specs import from `../../../utils/wp-cli.mjs`, activate
    `plugin-<scenario>-<agentId>`, and reset state with `deactivateAllPlugins`.

### Task 6: Author `reactive-bindings` group (5 new scenarios)

- **Goal:** Author the 5 `reactive-bindings` scenarios.
- **Type:** e2e
- **Files to change (create, each `scenario.yaml` + `e2e.spec.mjs`):**
  - `eval/scenarios/reactive-bindings/greeting-rotator/`
  - `eval/scenarios/reactive-bindings/selectable-tile/`
  - `eval/scenarios/reactive-bindings/css-variable-progress/`
  - `eval/scenarios/reactive-bindings/on-sale-attribute/`
  - `eval/scenarios/reactive-bindings/accessible-disclosure/`
- **Changes:** For each, author `scenario.yaml` + `e2e.spec.mjs` per the shared rules and
  conventions, driving the concept in its mapping-table row. e2e assertion focus:
  - `greeting-rotator` — clicking the button cycles the displayed greeting through several
    strings (assert the visible text changes per click).
  - `selectable-tile` — selecting a tile toggles its highlight class **per instance**
    (multi-instance markup; assert the class on `.nth(0)` toggles without affecting `.nth(1)`).
  - `css-variable-progress` — buttons grow/shrink a bar's fill (assert the inline CSS custom
    property / computed width changes).
  - `on-sale-attribute` — the badge's link/tooltip attribute is present when on sale and
    fully **absent** otherwise (assert the attribute is removed entirely, not empty).
  - `accessible-disclosure` — a show/hide button whose announced state (`aria-expanded`) and
    label stay in sync, and the controlled region's `hidden` toggles (assert ARIA + label +
    visibility). This scenario subsumes the deleted `toggle-visibility`.
- **Depends on:** Task 4. Parallelizable with Tasks 5, 7-16.
- **Traces to:** Spec requirements 1, 2, 4, 5, 6; Acceptance criteria 1, 2, 4, 5, 6; Design
  decision "Nested one-level taxonomy"
- **Acceptance:**
  - All 5 directories exist under `eval/scenarios/reactive-bindings/`, each with a
    `scenario.yaml` and an `e2e.spec.mjs`; each `name` equals its directory and is unique.
  - Each `prompt` names no iAPI directive/store/server API; each `acceptance` is
    scenario-specific.
  - `selectable-tile`'s e2e uses two block instances and asserts per-instance class toggling.
  - `on-sale-attribute`'s e2e asserts the attribute is fully removed (absent) in the off
    state.
  - `accessible-disclosure`'s e2e asserts `aria-expanded` and the label/visibility stay in
    sync.
  - All specs import from `../../../utils/wp-cli.mjs`, target `wp-skill/testing-block`, and
    reset with `deactivateAllPlugins`.

### Task 7: Author `state-and-context` group (8 new scenarios)

- **Goal:** Author the 8 net-new `state-and-context` scenarios (the migrated
  `independent-counters` and `shared-state-tally` are handled in Task 4).
- **Type:** e2e
- **Files to change (create, each `scenario.yaml` + `e2e.spec.mjs`):**
  - `eval/scenarios/state-and-context/nested-theme-card/`
  - `eval/scenarios/state-and-context/php-seeded-context/`
  - `eval/scenarios/state-and-context/product-quantity-stepper/`
  - `eval/scenarios/state-and-context/cart-count-cross-block/`
  - `eval/scenarios/state-and-context/locked-private-store/`
  - `eval/scenarios/state-and-context/pageview-analytics-bridge/`
  - `eval/scenarios/state-and-context/cross-namespace-now-playing/`
- **Changes:** For each, author `scenario.yaml` + `e2e.spec.mjs` per the shared rules and
  conventions, driving the mapping-table concept. e2e assertion focus and special handling:
  - `nested-theme-card` — an inner panel inherits some parent values and overrides others
    (assert inherited vs overridden values render correctly).
  - `php-seeded-context` — the initial list is built server-side per instance (assert the
    seeded list is present in server-rendered HTML before hydration; multi-instance shows
    distinct seeds).
  - `product-quantity-stepper` — each card tracks its **own** quantity (two instances;
    assert stepping one does not change the other — the local-context-vs-global footgun).
  - `cart-count-cross-block` — an "Add to cart" button updates a **separate** header badge
    (two blocks sharing one namespace; assert clicking add increments the badge).
  - `locked-private-store` — a widget other plugins can't tamper with. **This is the one spec
    that imports `addLockProbe`:** `import { addLockProbe } from
    "../../../utils/e2e-helpers.mjs"`. After `page.goto(...)` (post-hydration) call
    `addLockProbe(page, namespace)` and assert
    `await page.evaluate(() => window.__lockResult) === "locked"`. The prompt expresses the
    lock as a user constraint ("harden it so other plugins can't tamper with it"), naming no
    `lock` API.
  - `pageview-analytics-bridge` — a UI-less block forwarding a shared value's changes to an
    analytics stub. **Inline analytics sink, no shared helper:** before navigation, call
    `page.addInitScript({ content: "window.__analyticsTracker = (...a) => {
    (window.__analyticsEvents ??= []).push(a); };" })`, then after triggering the watched
    change assert on `page.evaluate(() => window.__analyticsEvents)`. The scenario's
    `acceptance` constrains the agent in user language to call `window.__analyticsTracker(value)`
    when the watched value changes (an integration point, not a directive name).
  - `cross-namespace-now-playing` — an indicator that lights up from another plugin's state
    (declarative `namespace::state.x` read; assert the indicator reflects the other
    namespace's value, no JS import).
- **Depends on:** Task 4 (group dir + nested layout) and Task 2 (`addLockProbe` must exist
  before `locked-private-store`'s spec references it). Parallelizable with Tasks 5, 6, 8-16.
- **Traces to:** Spec requirements 1, 2, 4, 5, 6, 7, 8; Acceptance criteria 1, 2, 4, 5, 6, 7;
  Design decisions "Nested one-level taxonomy", "One shared e2e helper; analytics inline"
- **Acceptance:**
  - All 7 directories exist under `eval/scenarios/state-and-context/`, each with a
    `scenario.yaml` and an `e2e.spec.mjs`; each `name` equals its directory and is unique
    across the whole tree.
  - Each `prompt` names no iAPI directive/store/server API; each `acceptance` is
    scenario-specific; `locked-private-store` and `pageview-analytics-bridge` express their
    technical asks as user constraints.
  - `locked-private-store`'s spec imports `addLockProbe` from `../../../utils/e2e-helpers.mjs`,
    calls it after `page.goto`, and asserts `window.__lockResult === "locked"`.
  - `pageview-analytics-bridge`'s spec installs the inline `window.__analyticsTracker` stub
    via `page.addInitScript` **before** navigation and asserts on `window.__analyticsEvents`;
    its `acceptance` names `window.__analyticsTracker(value)` as the integration point.
  - `product-quantity-stepper` and `cart-count-cross-block` use multi-instance / multi-block
    markup and assert the cross-instance/cross-block behavior.
  - All specs import from `../../../utils/wp-cli.mjs` and reset with `deactivateAllPlugins`.

### Task 8: Author `derived-state` group (4 new scenarios)

- **Goal:** Author the 4 net-new `derived-state` scenarios (`derived-double` migrates in
  Task 4).
- **Type:** e2e
- **Files to change (create, each `scenario.yaml` + `e2e.spec.mjs`):**
  - `eval/scenarios/derived-state/price-with-vat/`
  - `eval/scenarios/derived-state/tax-calculator-mixed/`
  - `eval/scenarios/derived-state/results-no-flash/`
  - `eval/scenarios/derived-state/shopping-list-server-derived/`
- **Changes:** Author each pair per the shared rules and conventions. e2e assertion focus:
  - `price-with-vat` — each card shows its price with tax, computed once (two instances;
    assert each shows its own price-with-VAT, server-seeded).
  - `tax-calculator-mixed` — one global tax rate applied to each card's own price (assert a
    global rate change updates every card's derived total).
  - `results-no-flash` — the "No results" message never flashes when there are results
    (assert the initial server-rendered HTML shows results and **not** the empty-state
    message before hydration — assert server HTML correctness pre-hydration).
  - `shopping-list-server-derived` — in-cart items show an icon, correct on first paint
    (assert per-row server-computed icon presence in the initial HTML).
- **Depends on:** Task 4. Parallelizable with Tasks 5-7, 9-16.
- **Traces to:** Spec requirements 1, 2, 4, 5, 6; Acceptance criteria 1, 2, 4, 5, 6; Design
  decision "Nested one-level taxonomy"
- **Acceptance:**
  - All 4 directories exist under `eval/scenarios/derived-state/` with both files; each
    `name` equals its directory and is unique.
  - Each `prompt` names no iAPI directive/store/server API; each `acceptance` is
    scenario-specific.
  - `results-no-flash` and `shopping-list-server-derived` specs assert correctness of the
    **server-rendered HTML before hydration** (no flash / icon correct on first paint).
  - All specs import from `../../../utils/wp-cli.mjs`, target `wp-skill/testing-block`, reset
    with `deactivateAllPlugins`.

### Task 9: Author `server-rendering` group (2 new scenarios)

- **Goal:** Author the 2 net-new `server-rendering` scenarios (`config-rest-nonce` migrates
  in Task 4).
- **Type:** e2e
- **Files to change (create, each `scenario.yaml` + `e2e.spec.mjs`):**
  - `eval/scenarios/server-rendering/welcome-banner-i18n/`
  - `eval/scenarios/server-rendering/stable-tab-ids/`
- **Changes:** Author each pair per the shared rules and conventions. e2e assertion focus:
  - `welcome-banner-i18n` — a localized greeting that's correct on load (assert the
    server-rendered greeting text is the translated value, present before any client work).
  - `stable-tab-ids` — ARIA-linked IDs that don't change between renders / soft navigations
    (assert the `id`/`aria-controls` linkage is present and stable; if a soft navigation is
    in scope, assert the IDs are unchanged after it).
- **Depends on:** Task 4. Parallelizable with Tasks 5-8, 10-16.
- **Traces to:** Spec requirements 1, 2, 4, 5, 6; Acceptance criteria 1, 2, 4, 5, 6; Design
  decision "Nested one-level taxonomy"
- **Acceptance:**
  - Both directories exist under `eval/scenarios/server-rendering/` with both files; each
    `name` equals its directory and is unique.
  - Each `prompt` names no iAPI directive/store/server API; each `acceptance` is
    scenario-specific.
  - `welcome-banner-i18n`'s e2e asserts the translated greeting is correct in server-rendered
    HTML on load.
  - `stable-tab-ids`'s e2e asserts stable ARIA-linked IDs.
  - Both specs import from `../../../utils/wp-cli.mjs` and reset with `deactivateAllPlugins`.

### Task 10: Author `events` group (6 new scenarios)

- **Goal:** Author the 6 `events` scenarios.
- **Type:** e2e
- **Files to change (create, each `scenario.yaml` + `e2e.spec.mjs`):**
  - `eval/scenarios/events/like-button/`
  - `eval/scenarios/events/live-char-counter/`
  - `eval/scenarios/events/viewport-width-display/`
  - `eval/scenarios/events/command-palette-keydown/`
  - `eval/scenarios/events/menu-touch-hover/`
  - `eval/scenarios/events/newsletter-submit-guard/`
- **Changes:** Author each pair per the shared rules and conventions. e2e assertion focus:
  - `like-button` — a heart toggles liked/unliked and updates a like count on click (assert
    the toggle + count change).
  - `live-char-counter` — a field showing live "x / 280" count that flags going over as the
    user types (assert the count updates per keystroke and the over-limit flag appears).
  - `viewport-width-display` — shows the live window width (resize the viewport via
    `page.setViewportSize` and assert the displayed width updates — window-level listener).
  - `command-palette-keydown` — a "/" shortcut opens an overlay from anywhere (press "/" at
    document level and assert the overlay opens; assert default action prevented).
  - `menu-touch-hover` — submenu opens on hover with a mouse, on tap with touch (assert the
    branch on `event.pointerType`).
  - `newsletter-submit-guard` — submit shows an inline confirmation without reloading (assert
    no navigation occurs and the confirmation appears — the handler must be synchronous).
- **Depends on:** Task 4. Parallelizable with Tasks 5-9, 11-16.
- **Traces to:** Spec requirements 1, 2, 4, 5, 6; Acceptance criteria 1, 2, 4, 5, 6; Design
  decision "Nested one-level taxonomy"
- **Acceptance:**
  - All 6 directories exist under `eval/scenarios/events/` with both files; each `name`
    equals its directory and is unique.
  - Each `prompt` names no iAPI directive/store/server API; each `acceptance` is
    scenario-specific.
  - `newsletter-submit-guard`'s e2e asserts the page does **not** reload/navigate on submit
    and the confirmation appears.
  - `command-palette-keydown`'s e2e triggers a document-level "/" keypress and asserts the
    overlay opens.
  - All specs import from `../../../utils/wp-cli.mjs`, target `wp-skill/testing-block`, reset
    with `deactivateAllPlugins`.

### Task 11: Author `async-actions` group (4 new scenarios)

- **Goal:** Author the 4 net-new `async-actions` scenarios (`joke-fetch` migrates+reworks in
  Task 4).
- **Type:** e2e
- **Files to change (create, each `scenario.yaml` + `e2e.spec.mjs`):**
  - `eval/scenarios/async-actions/load-more-posts/`
  - `eval/scenarios/async-actions/validated-async-form/`
  - `eval/scenarios/async-actions/batch-processor/`
  - `eval/scenarios/async-actions/live-scoreboard-polling/`
- **Changes:** Author each pair per the shared rules and conventions. e2e assertion focus:
  - `load-more-posts` — a button appends the next batch (assert the list grows / appends,
    not replaces, after clicking; stub/intercept the fetch response).
  - `validated-async-form` — inline validation + async submit with status states (assert
    invalid input is flagged, the submit button disables during submit, and
    success/error states render).
  - `batch-processor` — processes a large list while staying responsive (assert progress
    advances and the UI stays responsive — `splitTask()` yielding; a fake-timer / poll
    pattern is acceptable).
  - `live-scoreboard-polling` — a value that refreshes every few seconds (use
    `page.clock.install()` + `page.clock.runFor(ms)` to drive the interval; assert the value
    refreshes and the interval is cleaned up on teardown).
- **Depends on:** Task 4. Parallelizable with Tasks 5-10, 12-16.
- **Traces to:** Spec requirements 1, 2, 4, 5, 6; Acceptance criteria 1, 2, 4, 5, 6; Design
  decision "Nested one-level taxonomy"
- **Acceptance:**
  - All 4 directories exist under `eval/scenarios/async-actions/` with both files; each
    `name` equals its directory and is unique.
  - Each `prompt` names no iAPI directive/store/server API; each `acceptance` is
    scenario-specific.
  - `load-more-posts`'s e2e asserts append (not replace) behavior.
  - `live-scoreboard-polling`'s e2e drives the interval with `page.clock` and asserts the
    refresh.
  - All specs import from `../../../utils/wp-cli.mjs`, target `wp-skill/testing-block`, reset
    with `deactivateAllPlugins`.

### Task 12: Author `lifecycle` group (6 new scenarios)

- **Goal:** Author the 6 `lifecycle` scenarios.
- **Type:** e2e
- **Files to change (create, each `scenario.yaml` + `e2e.spec.mjs`):**
  - `eval/scenarios/lifecycle/autofocus-revealed-form/`
  - `eval/scenarios/lifecycle/instrumented-mount/`
  - `eval/scenarios/lifecycle/counter-change-watch/`
  - `eval/scenarios/lifecycle/interval-with-cleanup/`
  - `eval/scenarios/lifecycle/countdown-to-event/`
  - `eval/scenarios/lifecycle/in-view-reveal/`
- **Changes:** Author each pair per the shared rules and conventions. e2e assertion focus:
  - `autofocus-revealed-form` — a revealed form focuses its first field (reveal the form and
    assert the first field receives focus on mount).
  - `instrumented-mount` — two independent setup steps on first render (assert both the
    analytics "viewed" ping and the debug init marker fire on mount — multiple
    `data-wp-init---<id>`).
  - `counter-change-watch` — a readout reacts to the count changing, including on mount
    (assert the readout updates on mount and on each change).
  - `interval-with-cleanup` — an on/off switch starts/stops a ticking timer with no leaks
    (use `page.clock`; assert turning off stops the ticking — watch cleanup runs).
  - `countdown-to-event` — a live countdown that ends with a message (use `page.clock` to
    advance time; assert it counts down and shows the end message; cleanup on teardown).
  - `in-view-reveal` — a banner animates in the first time it scrolls into view (trigger via
    `page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))`; assert the reveal
    fires once — IntersectionObserver + effect cleanup).
- **Depends on:** Task 4. Parallelizable with Tasks 5-11, 13-16.
- **Traces to:** Spec requirements 1, 2, 4, 5, 6; Acceptance criteria 1, 2, 4, 5, 6; Design
  decision "Nested one-level taxonomy"
- **Acceptance:**
  - All 6 directories exist under `eval/scenarios/lifecycle/` with both files; each `name`
    equals its directory and is unique.
  - Each `prompt` names no iAPI directive/store/server API; each `acceptance` is
    scenario-specific.
  - `interval-with-cleanup` and `countdown-to-event` specs drive time with `page.clock`.
  - `in-view-reveal`'s spec triggers the reveal via a scroll `page.evaluate`.
  - All specs import from `../../../utils/wp-cli.mjs`, target `wp-skill/testing-block`, reset
    with `deactivateAllPlugins`.

### Task 13: Author `lists` group (3 new scenarios)

- **Goal:** Author the 3 net-new `lists` scenarios (`fruit-list-with-add` migrates in
  Task 4).
- **Type:** e2e
- **Files to change (create, each `scenario.yaml` + `e2e.spec.mjs`):**
  - `eval/scenarios/lists/reorderable-todo-list/`
  - `eval/scenarios/lists/image-carousel/`
  - `eval/scenarios/lists/live-search-filter/`
- **Changes:** Author each pair per the shared rules and conventions. e2e assertion focus:
  - `reorderable-todo-list` — todos reorder without rebuilding rows (assert reordering
    preserves keyed DOM nodes — keyed iteration with `data-wp-each-key`).
  - `image-carousel` — a gallery navigated with Left/Right keys (assert arrow keys move the
    current image with wrap-around).
  - `live-search-filter` — a list that narrows as you type (assert typing filters the
    rendered list — derived filtered list).
- **Depends on:** Task 4. Parallelizable with Tasks 5-12, 14-16.
- **Traces to:** Spec requirements 1, 2, 4, 5, 6; Acceptance criteria 1, 2, 4, 5, 6; Design
  decision "Nested one-level taxonomy"
- **Acceptance:**
  - All 3 directories exist under `eval/scenarios/lists/` with both files; each `name` equals
    its directory and is unique.
  - Each `prompt` names no iAPI directive/store/server API; each `acceptance` is
    scenario-specific.
  - `image-carousel`'s e2e drives arrow-key navigation and asserts wrap-around.
  - `live-search-filter`'s e2e asserts the list narrows as text is typed.
  - All specs import from `../../../utils/wp-cli.mjs`, target `wp-skill/testing-block`, reset
    with `deactivateAllPlugins`.

### Task 14: Author `client-navigation` group (11 new scenarios)

- **Goal:** Author the 11 net-new `client-navigation` scenarios
  (`paginated-posts-router` migrates+renames in Task 4).
- **Type:** e2e
- **Files to change (create, each `scenario.yaml` + `e2e.spec.mjs`):**
  - `eval/scenarios/client-navigation/footer-client-nav/`
  - `eval/scenarios/client-navigation/prefetch-on-hover/`
  - `eval/scenarios/client-navigation/section-jump-scroll/`
  - `eval/scenarios/client-navigation/filter-bar-replace-history/`
  - `eval/scenarios/client-navigation/comment-force-refresh/`
  - `eval/scenarios/client-navigation/resilient-link-fallback/`
  - `eval/scenarios/client-navigation/external-link-respect/`
  - `eval/scenarios/client-navigation/pageview-tracker/`
  - `eval/scenarios/client-navigation/global-toast/`
  - `eval/scenarios/client-navigation/page-header-server-sync/`
  - `eval/scenarios/client-navigation/recipe-card-server-context/`
- **Changes:** Author each pair per the shared rules and conventions. Router scenarios
  typically need **two pages/posts** (`requestUtils.createPage()`/`createPost()` ×2) and
  assert soft navigation via `page.click(...)` then `await page.waitForURL(...)` /
  `expect(page).toHaveURL(...)`. e2e assertion focus:
  - `footer-client-nav` — a static footer that survives soft transitions (assert the footer
    node persists across a soft navigation — the no-JS clientNavigation opt-in).
  - `prefetch-on-hover` — hovering a page link preloads it (assert a hover triggers prefetch;
    a navigation after hover still works — prefetch + navigate).
  - `section-jump-scroll` — soft navigation scrolls back to the top (assert scroll position
    resets to top after a soft navigation).
  - `filter-bar-replace-history` — filtering updates the URL without cluttering history
    (assert the URL changes but `history.length` does not grow — replaceState).
  - `comment-force-refresh` — after posting, the list refreshes without a stale cache (assert
    a forced navigation brings fresh content).
  - `resilient-link-fallback` — a link shows a fallback panel if the fetch fails (assert the
    fallback HTML renders when navigation's fetch fails).
  - `external-link-respect` — modifier-clicks and cross-origin links use the browser (assert
    a modifier-click / cross-origin link is NOT intercepted by the router).
  - `pageview-tracker` — fires a pageview on load and on every soft navigation (assert a
    pageview fires on load and again after each soft navigation — watching router
    `state.url`). May reuse the inline analytics-stub pattern if the prompt frames the
    pageview as a client callback; otherwise assert a visible counter.
  - `global-toast` — a toast region present on every page (assert the toast region appears on
    a page that did not itself render it — `attachTo` dynamic region injection).
  - `page-header-server-sync` — a header's server section label refreshes on soft navigation
    while a client-only "compact view" toggle persists (assert the server field refreshes and
    the client field is untouched after navigation — `getServerState`).
  - `recipe-card-server-context` — the title updates per page while a client adjustment
    persists (assert the server-provided title changes across navigation while a client value
    persists — `getServerContext`).
- **Depends on:** Task 4. Parallelizable with Tasks 5-13, 15-16.
- **Traces to:** Spec requirements 1, 2, 4, 5, 6; Acceptance criteria 1, 2, 4, 5, 6; Design
  decision "Nested one-level taxonomy"
- **Acceptance:**
  - All 11 directories exist under `eval/scenarios/client-navigation/` with both files; each
    `name` equals its directory and is unique across the whole tree.
  - Each `prompt` names no iAPI directive/store/server API; each `acceptance` is
    scenario-specific.
  - Router specs that need two destinations create two pages/posts in `beforeAll`, assert
    soft navigation with `page.waitForURL` / `toHaveURL`, and delete created pages in
    `afterAll`.
  - `filter-bar-replace-history`'s e2e asserts the URL changes without growing
    `history.length`.
  - `external-link-respect`'s e2e asserts the router does **not** intercept the
    modifier/cross-origin case.
  - All specs import from `../../../utils/wp-cli.mjs` and reset with `deactivateAllPlugins`.

### Task 15: Author `typescript` group (4 new scenarios)

- **Goal:** Author the 4 `typescript` scenarios.
- **Type:** e2e
- **Files to change (create, each `scenario.yaml` + `e2e.spec.mjs`):**
  - `eval/scenarios/typescript/ts-counter-inference/`
  - `eval/scenarios/typescript/ts-server-state-merge/`
  - `eval/scenarios/typescript/ts-async-derived/`
  - `eval/scenarios/typescript/ts-typed-context-import/`
- **Changes:** Author each pair per the shared rules and conventions. The TypeScript
  constraints are **user-language asks in the `prompt`** ("build it in TypeScript with full
  type safety", "no explicit type annotations / casts") and **scenario-specific `acceptance`
  items** describing the typing concept — they are an authoring/review requirement, not a
  runtime assertion. The `e2e.spec.mjs` asserts only the **runtime** behavior (per the design
  doc note that e2e verifies runtime, not type correctness). e2e assertion focus:
  - `ts-counter-inference` — a counter built in TS with no explicit types (assert the counter
    increments at runtime).
  - `ts-server-state-merge` — a TS counter whose count comes from PHP (assert the
    server-seeded initial count renders and increments).
  - `ts-async-derived` — a TS counter with an async action and a derived value (assert the
    async action updates state and the derived value reflects it).
  - `ts-typed-context-import` — a second plugin adds to an existing plugin's store (assert the
    second module's contribution is visible at runtime; note the script-module dependency in
    `acceptance`).
- **Depends on:** Task 4. Parallelizable with Tasks 5-14, 16.
- **Traces to:** Spec requirements 1, 2, 4, 5, 6; Acceptance criteria 1, 2, 4, 5, 6; Design
  decision "Nested one-level taxonomy"; Risk 2 (TypeScript e2e depth)
- **Acceptance:**
  - All 4 directories exist under `eval/scenarios/typescript/` with both files; each `name`
    equals its directory and is unique.
  - Each `prompt` expresses the TypeScript constraint as a user-language ask (e.g. "in
    TypeScript with full type safety") and names no iAPI directive/store/server API.
  - Each `acceptance` captures the typing concept (inference / server-state merge / async +
    derived types / typed context import) as a scenario-specific item.
  - Each `e2e.spec.mjs` asserts the scenario's **runtime** behavior (increment / seeded count
    / async + derived update / cross-module contribution), not type correctness.
  - All specs import from `../../../utils/wp-cli.mjs`, target `wp-skill/testing-block`, reset
    with `deactivateAllPlugins`.

### Task 16: Author `ux-patterns` group (5 new scenarios)

- **Goal:** Author the 5 net-new `ux-patterns` scenarios (`side-drawer` migrates+reworks in
  Task 4).
- **Type:** e2e
- **Files to change (create, each `scenario.yaml` + `e2e.spec.mjs`):**
  - `eval/scenarios/ux-patterns/accessible-tabs/`
  - `eval/scenarios/ux-patterns/accessible-accordion/`
  - `eval/scenarios/ux-patterns/accessible-modal/`
  - `eval/scenarios/ux-patterns/image-lightbox/`
  - `eval/scenarios/ux-patterns/expandable-search/`
- **Changes:** Author each pair per the shared rules and conventions, with strong ARIA /
  accessibility-tree assertions. e2e assertion focus:
  - `accessible-tabs` — a tab strip with one visible panel (assert single-active selection,
    roving arrow-key navigation, and correct ARIA `role`/`aria-selected`).
  - `accessible-accordion` — an FAQ where multiple sections can be open (assert independent
    multi-toggle disclosure with ARIA, correct before JS runs).
  - `accessible-modal` — a modal with focus trap and Escape (assert `role="dialog"` present
    only while open, focus trap, Escape closes, focus restoration).
  - `image-lightbox` — click to zoom an image full-screen (assert the overlay opens with
    dialog semantics and focus restores on close).
  - `expandable-search` — a magnifier button that expands a search field (assert focus moves
    to the field on expand and outside-click / `focusout` closes it).
- **Depends on:** Task 4. Parallelizable with Tasks 5-15.
- **Traces to:** Spec requirements 1, 2, 4, 5, 6; Acceptance criteria 1, 2, 4, 5, 6; Design
  decision "Nested one-level taxonomy"
- **Acceptance:**
  - All 5 directories exist under `eval/scenarios/ux-patterns/` with both files; each `name`
    equals its directory and is unique.
  - Each `prompt` names no iAPI directive/store/server API; each `acceptance` is
    scenario-specific.
  - `accessible-modal`'s e2e asserts `role="dialog"` is present only while open, focus is
    trapped, Escape closes, and focus restores to the trigger.
  - `accessible-tabs`' e2e asserts roving arrow-key navigation and correct ARIA.
  - All specs import from `../../../utils/wp-cli.mjs`, target `wp-skill/testing-block`, reset
    with `deactivateAllPlugins`.

## Ordering and batching summary

- **Phase 1 (serial foundation):** Task 1 and Task 2 may run in parallel (independent
  files); both must complete before Phase 2. Task 1 changes `package.json`,
  `verify-e2e.ts`, and the rubric; Task 2 adds `e2e-helpers.mjs`.
- **Phase 2 (migration):** Task 4 runs after Task 1. It establishes the group directories,
  moves the 9 migrating scenarios, and deletes the 2 + index.
- **Phase 3 (authoring, parallel):** Tasks 5-16 run after Task 4. They are mutually
  independent (each writes only files inside its own group directory) and can run in
  parallel, **except** Task 7 (`state-and-context`) additionally requires Task 2 because
  `locked-private-store` imports `addLockProbe`. The 12 group-tasks together author the
  remaining 59 new scenarios (Task 4 having migrated 9), totaling 68.

## Coverage check (every acceptance criterion is addressed)

- **AC1 (exactly the curated set):** Tasks 4-16 create exactly the 68 mapped directories;
  Task 4 deletes `counter`, `toggle-visibility`, `_candidates.yaml` and leaves no flat dir.
- **AC2 (each dir has scenario.yaml + e2e.spec.mjs):** every authoring task requires both
  files per scenario; no scenario is omitted from e2e.
- **AC3 (schema + nested enumeration):** scenario.yaml authoring rules pin the schema fields;
  Task 1's Skillsmith bump enables nested enumeration.
- **AC4 (user-language prompts):** every authoring task's acceptance forbids naming
  directives/store/server APIs in the prompt.
- **AC5 (scenario-specific acceptance):** every authoring task's acceptance requires
  scenario-specific acceptance with no rubric-owned restatement.
- **AC6 (e2e conventions, runnable in shape):** the E2E spec conventions section + each
  task's acceptance pin the conventions.
- **AC7 (harness capability present):** Task 2 builds `addLockProbe`; Task 7 wires it and the
  inline analytics stub; both referenced before/where used.
- **AC8 (rubric drops on-async):** Task 1.
- **AC9 (Skillsmith pin installs):** Task 1.
- **AC10 (failure attribution keyed on scenario dir):** Task 1's `scenarioDirOf()` patch.
