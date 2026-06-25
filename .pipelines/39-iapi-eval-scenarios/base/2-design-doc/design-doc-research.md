# Design Research: Complete iAPI eval scenario set + folder organization

## Research

<!-- Non-trivial findings from the design-doc-researcher, with sources cited. -->

### Harness analysis: per-scenario needs

Source: design-researcher reading Playwright 1.60 types, requestUtils source, Gutenberg fixture plugins, and existing e2e specs (2026-06-25).

**pageview-analytics-bridge:** `page.addInitScript({ content: 'window.__analyticsTracker = (...a) => { (window.__analyticsEvents ??= []).push(a); };' })` before navigation stubs the analytics callback. The prompt constrains the agent with user-level phrasing ("when the watched value changes, call `window.__analyticsTracker` with the new value") — an integration point, not an iAPI directive name. E2e asserts `page.evaluate(() => window.__analyticsEvents)`. Inline per spec; no shared helper file needed.

**locked-private-store:** `page.addScriptTag({ type: 'module', content: 'import {store} from "@wordpress/interactivity"; try { store(ns, {}); window.__lockResult = "unlocked"; } catch(e) { window.__lockResult = "locked"; }' })` after hydration. Relies on WordPress 6.5+ importmap. E2e reads `window.__lockResult` via `page.evaluate()`. A shared helper `addLockProbe(page, namespace)` in `eval/utils/e2e-helpers.mjs` wraps this.

**classic-theme-banner:** The agent's plugin hooks into a WordPress action (e.g. `wp_footer`) and outputs the interactive banner HTML via `wp_interactivity_process_directives()`. The e2e creates any post with `requestUtils.createPost`, visits it — the plugin action fires on every frontend page. The block is **NOT** `wp-skill/testing-block`; the e2e locates the banner by its own class or `data-wp-interactive` attribute. This is the one exception to the standard block-name convention. Standard harness covers it; no new capability needed.

**instrumented-mount, multi-directive-element:** `page.on('console', ...)` captures all log calls. Pattern already established in `minimal-scaffold/e2e.spec.mjs` (lines 32–44). Standard.

**TypeScript scenarios (4):** Runtime behavior only (DOM state, reactive text). Type correctness is an authoring/review requirement, not an e2e concern. Standard harness.

**countdown-to-event, live-scoreboard-polling, interval-with-cleanup:** Playwright 1.60 `page.clock` confirmed available. `await page.clock.install(); await page.clock.runFor(3000)` advances `setInterval` timers. Standard.

**in-view-reveal:** `page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))` triggers `IntersectionObserver`. Standard.

**global-toast:** `requestUtils.createPage()` available (REST `/wp/v2/pages`). Create two pages, navigate between them via router link click. Standard.

### `window.wp.interactivity` global exposure (adversarial store probe)

Source: design-researcher reading `packages/interactivity/src/store.ts` and `index.ts` on Gutenberg trunk (SHA 13c47262).

`@wordpress/interactivity` is a pure ES module. Zero assignment to `window.wp.*` anywhere. `storeLocks` is a module-private `Map`. `store()` is accessible only via ES `import` — `page.evaluate(() => window.wp?.interactivity?.store)` returns `undefined`.

**How to probe the lock from an e2e test:**

- **Option A (chosen):** `page.addScriptTag({ type: 'module', content: 'import {store} from "@wordpress/interactivity"; try { store(ns,{}); window.__lockResult="unlocked"; } catch(e){ window.__lockResult="locked"; }' })`. WordPress 6.5+ injects an importmap in `<head>` mapping `"@wordpress/interactivity"` to its URL. Chromium (Playwright 1.60) supports `type: module` in `addScriptTag`. Wrapped in `addLockProbe(page, namespace)` in `eval/utils/e2e-helpers.mjs`.

- **Option B (not chosen):** The agent's plugin registers a second script module that tries the override and writes `window.__lockResult`. Requires the agent to author the probe, adding authoring burden.

Option A is used: probe stays in the harness, agent is unaware of it.

### Skillsmith trunk PR #52 design doc supplement

Source: design-researcher reading PR #52 design doc at Skillsmith trunk SHA.

- Discovery recurses into all descendants; `scenario.yaml` files should exist only at leaf `<group>/<scenario>/` nodes (not at group level).
- Filter matching is segment-aware: `events` matches `events/like-button` but not `my-events/x` or `events-old/x`.
- Iteration workspace dirs are keyed by `scenario.name` (not `dirName`): `iteration-N/<scenario.name>/<agent>/workspace`. This is already what `verify-e2e.ts` lines 46–56 read (`scenarioEntry.name`), so that path is unaffected by nesting.
- Duplicate `scenario.name` across the entire tree throws `UserFacingError` with message: "Duplicate scenario.name values are not supported because reports and artifacts are keyed by scenario.name."

### Skillsmith trunk: nested discovery and dirName

Source: design-researcher reading `Automattic/skillsmith` source via GitHub API (2026-06-23).

**Latest trunk SHA:** `95c86bdbbcae79c4dc46dea07d15fd5d69e4ee2d` (merges PR #52 "support nested scenario folders and folder filtering").

**Nested discovery (trunk):** `src/scenarios/enumerate.ts` does a recursive `visitChildren()` walk — finds `scenario.yaml` at any depth. The current pinned SHA (`6bd90c34...`) uses a single flat `readdirSync(scenariosRoot)`, so the trunk bump is required for nesting to work.

**`dirName` for nested scenarios:** trunk sets `id = segments.join('/')`, `dirName: id` (alias for `id`). JSDoc: "Nested scenarios include their parent folders, for example `blocks/counter`". So for `eval/scenarios/foundations/minimal-scaffold/scenario.yaml`, trunk produces `dirName = "foundations/minimal-scaffold"`. The pinned SHA would have produced `dirName = "minimal-scaffold"`.

**`skillsmith.config.ts` changes:** none required. `paths.scenarios` default is `eval/scenarios`. Scenario YAML schema is unchanged.

**Folder filtering (trunk):** `src/scenarios/selection.ts` `matchesScenarioFilter(filter, id)` = `filter === '.' || id === filter || id.startsWith(filter + '/')`. So `--filter foundations` matches `foundations/minimal-scaffold` etc. Works correctly with nested layout.

**Scenario name uniqueness:** trunk `validateConfiguredScenarioNamesAreUnique()` throws if two `scenario.yaml` share the same `name` field, even in different folders. `name` must be globally unique across all 68 scenarios.

**verify-e2e.ts impact:**
- Line 74 spec path: `join("eval", "scenarios", dirName, "e2e.spec.mjs")` — with trunk `dirName = "foundations/minimal-scaffold"` this becomes `eval/scenarios/foundations/minimal-scaffold/e2e.spec.mjs`. Correct automatically.
- `scenarioDirOf()` (lines 225–228): takes the *second-to-last* segment of the spec path — currently returns just `<scenario>`. Playwright reports paths relative to `testDir` (`eval/scenarios`), so it reports `foundations/minimal-scaffold/e2e.spec.mjs`. `scenarioDirOf` would return `minimal-scaffold` (just the leaf), but `dirToName` map is keyed on the full `foundations/minimal-scaffold`. Attribution breaks. Fix: return the last **two** path segments joined as `<group>/<scenario>` when the path has ≥ 3 segments (group + scenario + filename).

## Topics

### Topic: Nested taxonomy & directory names

- **Spec link:** Requirements 1, 2, 3 / Acceptance Criteria 1, 2
- **Decision:** 68 scenarios across 12 groups. All 68 names are globally unique (verified by researcher). Directory name equals `scenario.yaml` `name` field in every case.

**Complete mapping — directory path → `name` field:**

| Group | Directory name (`name` field) | Source |
|---|---|---|
| `foundations` | `minimal-scaffold` | migrate from flat `minimal-scaffold` |
| `foundations` | `classic-theme-banner` | new |
| `foundations` | `multi-directive-element` | new |
| `reactive-bindings` | `greeting-rotator` | new |
| `reactive-bindings` | `selectable-tile` | new |
| `reactive-bindings` | `css-variable-progress` | new |
| `reactive-bindings` | `on-sale-attribute` | new |
| `reactive-bindings` | `accessible-disclosure` | new |
| `state-and-context` | `independent-counters` | migrate from flat `independent-counters` |
| `state-and-context` | `nested-theme-card` | new |
| `state-and-context` | `php-seeded-context` | new |
| `state-and-context` | `product-quantity-stepper` | new |
| `state-and-context` | `shared-state-tally` | migrate from flat `shared-state` (rename) |
| `state-and-context` | `cart-count-cross-block` | new |
| `state-and-context` | `locked-private-store` | new |
| `state-and-context` | `pageview-analytics-bridge` | new |
| `state-and-context` | `cross-namespace-now-playing` | new |
| `derived-state` | `derived-double` | migrate from flat `derived-double` |
| `derived-state` | `price-with-vat` | new |
| `derived-state` | `tax-calculator-mixed` | new |
| `derived-state` | `results-no-flash` | new |
| `derived-state` | `shopping-list-server-derived` | new |
| `server-rendering` | `config-rest-nonce` | migrate from flat `config-fetch` (rename) |
| `server-rendering` | `welcome-banner-i18n` | new |
| `server-rendering` | `stable-tab-ids` | new |
| `events` | `like-button` | new |
| `events` | `live-char-counter` | new |
| `events` | `viewport-width-display` | new |
| `events` | `command-palette-keydown` | new |
| `events` | `menu-touch-hover` | new |
| `events` | `newsletter-submit-guard` | new |
| `async-actions` | `joke-fetch` | migrate from flat `async-fetch` (rename + rework) |
| `async-actions` | `load-more-posts` | new |
| `async-actions` | `validated-async-form` | new |
| `async-actions` | `batch-processor` | new |
| `async-actions` | `live-scoreboard-polling` | new |
| `lifecycle` | `autofocus-revealed-form` | new |
| `lifecycle` | `instrumented-mount` | new |
| `lifecycle` | `counter-change-watch` | new |
| `lifecycle` | `interval-with-cleanup` | new |
| `lifecycle` | `countdown-to-event` | new |
| `lifecycle` | `in-view-reveal` | new |
| `lists` | `fruit-list-with-add` | migrate from flat `fruit-list-each` (rename) |
| `lists` | `reorderable-todo-list` | new |
| `lists` | `image-carousel` | new |
| `lists` | `live-search-filter` | new |
| `client-navigation` | `footer-client-nav` | new |
| `client-navigation` | `paginated-posts-router` | migrate from flat `paginated-list` (rename) |
| `client-navigation` | `prefetch-on-hover` | new |
| `client-navigation` | `section-jump-scroll` | new |
| `client-navigation` | `filter-bar-replace-history` | new |
| `client-navigation` | `comment-force-refresh` | new |
| `client-navigation` | `resilient-link-fallback` | new |
| `client-navigation` | `external-link-respect` | new |
| `client-navigation` | `pageview-tracker` | new |
| `client-navigation` | `global-toast` | new |
| `client-navigation` | `page-header-server-sync` | new |
| `client-navigation` | `recipe-card-server-context` | new |
| `typescript` | `ts-counter-inference` | new |
| `typescript` | `ts-server-state-merge` | new |
| `typescript` | `ts-async-derived` | new |
| `typescript` | `ts-typed-context-import` | new |
| `ux-patterns` | `accessible-tabs` | new |
| `ux-patterns` | `accessible-accordion` | new |
| `ux-patterns` | `accessible-modal` | new |
| `ux-patterns` | `image-lightbox` | new |
| `ux-patterns` | `side-drawer` | migrate from flat `focus-trap-menu` (rename + rework) |
| `ux-patterns` | `expandable-search` | new |

**Flat scenarios removed (not migrated):**
- `counter` — generic counter with no curated counterpart; deleted.
- `toggle-visibility` — fully subsumed by `reactive-bindings/accessible-disclosure` (same iAPI concept: boolean-attribute binding + aria-expanded); deleted.
- `_candidates.yaml` — superseded by the curated set; deleted.

**Migration summary:** 8 existing scenarios migrate (some with renames); 2 are deleted; 58 are new.

- **Rationale:** Directory names are maximally descriptive, consistently kebab-case, and match the `name` field so Skillsmith's uniqueness check and artifact keying are consistent. The mapping is derived directly from the proposal's scenario titles, shortened to practical identifiers.

### Topic: Skillsmith trunk bump

- **Spec link:** Requirements 12, 13 / Acceptance Criteria 9, 10
- **Options:**
  1. Pin exact trunk SHA `95c86bdbbcae79c4dc46dea07d15fd5d69e4ee2d` in `package.json` (matches existing style: `github:Automattic/skillsmith#<SHA>`).
  2. Use bare `github:Automattic/skillsmith` (always tracks tip, non-reproducible).
- **Trade-offs:** Option 1 is reproducible and matches existing style; option 2 can drift silently.
- **Decision:** Pin SHA `95c86bdbbcae79c4dc46dea07d15fd5d69e4ee2d` — `"@automattic/skillsmith": "github:Automattic/skillsmith#95c86bdbbcae79c4dc46dea07d15fd5d69e4ee2d"`.
- **Rationale:** Exact SHA matches existing pin style, reproducible, and this commit is the one merging PR #52 (nested-folder support).
- **Other changes:** None to `skillsmith.config.ts` or scenario YAML schema.

### Topic: verify-e2e.ts change

- **Spec link:** Requirement 13 / Acceptance Criterion 10
- **Analysis:** With trunk, `dirName = "foundations/minimal-scaffold"` (full group/scenario path). Two effects on `verify-e2e.ts`:
  1. **Line 74 (spec path):** `join("eval", "scenarios", dirName, "e2e.spec.mjs")` — with the nested `dirName` this already produces the correct path `eval/scenarios/foundations/minimal-scaffold/e2e.spec.mjs`. No change needed.
  2. **`scenarioDirOf()` (lines 225–228):** Playwright reports paths relative to `testDir` (`eval/scenarios`), so the reported path is `foundations/minimal-scaffold/e2e.spec.mjs`. The current function takes only the second-to-last segment (`minimal-scaffold`), but `dirToName` is keyed on the full `foundations/minimal-scaffold`. Attribution breaks.
- **Options:**
  1. Change `scenarioDirOf` to return the last **two** non-empty segments joined with `/` when there are ≥ 3 segments — i.e., `segments[n-2] + '/' + segments[n-1]`. Falls back to just the parent segment if only one parent exists (maintains backward compatibility shape).
  2. Re-key `dirToName` on the scenario name segment only — but this breaks uniqueness since names could collide across groups.
- **Decision:** Option 1. `scenarioDirOf` returns `segments[n-2] + '/' + segments[n-1]` when `segments.length >= 3`, else `segments[n-2]` (existing single-segment behavior for truly flat paths, though none will exist post-migration).
- **Rationale:** This is the minimal fix, touches only the parsing function, and correctly reconstructs the `<group>/<scenario>` key that the trunk-generated `dirToName` map expects. The Playwright test-dir-relative path always has the form `<group>/<scenario>/e2e.spec.mjs` (3 segments), so the guard on `>= 3` is always true.
- **Exact change:**
  ```typescript
  function scenarioDirOf(file: string): string | undefined {
    const segments = file.split(/[\\/]/).filter((s) => s.length > 0);
    if (segments.length >= 3) return `${segments[segments.length - 3]}/${segments[segments.length - 2]}`;
    if (segments.length >= 2) return segments[segments.length - 2];
    return undefined;
  }
  ```

### Topic: e2e harness extensions

- **Spec link:** Requirements 7, 8, 9 / Acceptance Criteria 6, 7

**Analysis of scenarios by harness need (finalized):**

| Scenario | Need | Mechanism |
|---|---|---|
| `pageview-analytics-bridge` | Analytics sink | `page.addInitScript()` stubs `window.__analyticsTracker`; prompt constrains agent to call it |
| `locked-private-store` | Adversarial `store()` probe | `page.addScriptTag({ type: 'module' })` injects ES module via WP importmap; shared helper |
| `classic-theme-banner` | PHP action banner (no testing-block) | Plugin hooks `wp_footer`, outputs banner via `wp_interactivity_process_directives()`; any post; locate by class |
| `instrumented-mount`, `multi-directive-element` | Multiple console messages | `page.on("console", ...)` — existing pattern from `minimal-scaffold` |
| TypeScript scenarios (4) | Runtime behavior only | Standard harness; type correctness is authoring/review concern |
| `countdown-to-event`, `live-scoreboard-polling`, `interval-with-cleanup` | Fake timers | `page.clock.install()` + `page.clock.runFor()` — Playwright 1.60 confirmed |
| `in-view-reveal` | IntersectionObserver | `page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))` |
| `global-toast` | Multi-page router navigation | `requestUtils.createPage()` (confirmed available) × 2, navigate via router link |
| Multi-block scenarios | Two block instances | Two `<!-- wp:wp-skill/testing-block /-->` in post content — existing pattern |

**New harness file: `eval/utils/e2e-helpers.mjs`**

One new helper file containing:

1. **`addLockProbe(page, namespace)`** — calls `page.addScriptTag({ type: 'module', content: \`import {store} from "@wordpress/interactivity"; try { store("${namespace}", {}); window.__lockResult = "unlocked"; } catch(e) { window.__lockResult = "locked"; }\` })`. The `locked-private-store` e2e calls this after `page.goto()` (post-hydration), then asserts `await page.evaluate(() => window.__lockResult) === "locked"`. Relies on WordPress 6.5+ importmap (present in `wp-env`). Helper also asserts `window.__lockResult` is defined after injection (guards against silent importmap failure).

**Analytics sink — inline per spec, no shared helper:**

The `pageview-analytics-bridge` e2e uses `page.addInitScript({ content: 'window.__analyticsTracker = (...a) => { (window.__analyticsEvents ??= []).push(a); };' })` inline, not in a shared helper — the pattern is used by only one or two scenarios and is simple enough to inline. The `acceptance` list constrains the agent: "the block calls `window.__analyticsTracker(value)` when the watched value changes."

**`classic-theme-banner` — exception to the block-name convention:**

The agent's plugin hooks into `wp_footer` (or equivalent WordPress action) and outputs the interactive banner HTML directly, calling `wp_interactivity_process_directives()` on the markup. The e2e creates any post via `requestUtils.createPost`, visits it, and locates the banner by its own `data-wp-interactive` attribute or a distinctive class — NOT by `wp-skill/testing-block`. This is the one scenario that does not use the fixed block name. The `acceptance` list records the constraint: "the plugin's output is processed by `wp_interactivity_process_directives()`, not the block directive pipeline."

**Scenarios with no e2e:**

None. All 68 scenarios have `e2e.spec.mjs`.

- **Decision:** Add `eval/utils/e2e-helpers.mjs` with `addLockProbe(page, namespace)`. Analytics stub is inline per spec. All 68 scenarios have `e2e.spec.mjs`. `classic-theme-banner` is the one exception to the `wp-skill/testing-block` convention.
- **Rationale:** Spec Requirement 8 is explicit: harness gaps are not a reason to omit e2e. The one new shared helper (`addLockProbe`) is a thin wrapper around `page.addScriptTag`. The analytics stub is simple enough to inline. The `classic-theme-banner` exception is necessary to correctly test `wp_interactivity_process_directives()` outside the block system.

### Topic: Standard e2e conventions

- **Spec link:** Requirement 10 / Acceptance Criterion 6
- **Established conventions from existing specs (carried forward):**
  - Import from `@wordpress/e2e-test-utils-playwright` and `deactivateAllPlugins` from `../../utils/wp-cli.mjs` (path relative to `eval/scenarios/<group>/<scenario>/` — will be `../../../utils/wp-cli.mjs` for nested specs).
  - `test.beforeAll`: call `deactivateAllPlugins()`, then `requestUtils.activatePlugin(`plugin-<scenario>-${workerInfo.project.metadata.agentId}`)`, then `requestUtils.createPost`.
  - Block markup: `<!-- wp:wp-skill/testing-block /-->` (fixed block name `wp-skill/testing-block`).
  - `test.afterAll`: `deactivateAllPlugins()` + `requestUtils.deleteAllPosts()`.
- **Relative import path change:** Existing specs use `../../utils/wp-cli.mjs`. With nesting at `eval/scenarios/<group>/<scenario>/`, the relative path becomes `../../../utils/wp-cli.mjs`. All new specs must use the three-level-up import.
- **Multi-instance assertions:** For scenarios testing per-instance isolation (e.g., `independent-counters`, `product-quantity-stepper`), embed the block twice: `<!-- wp:wp-skill/testing-block /-->\n<!-- wp:wp-skill/testing-block /-->`. Use `.locator(".wp-block-wp-skill-testing-block").nth(0)` etc.
- **Server-HTML checks:** Where the spec exercises SSR (e.g., derived state visible before JS), navigate to the page and check content visibility before hydration signals. Use `page.locator(...)` with `toContainText` / `toHaveAttribute`.
- **Accessibility-tree checks:** Use `getByRole(...)` selectors (e.g., `getByRole("button", { name: /label/i })`) and `toHaveAttribute("aria-expanded", "true")` for ARIA state. For dialog semantics, assert `role="dialog"` present/absent.
- **Router navigation:** For client-navigation scenarios, use `page.click(...)` on navigation links, then `await page.waitForURL(...)` or `expect(page).toHaveURL(...)` to assert soft navigation.
- **Selector strategy:** Prefer role-based selectors (`getByRole`), then text-based (`getByText`), then attribute-based (`locator("[data-wp-text]")`). Avoid class-only selectors except for the block wrapper (`.wp-block-wp-skill-testing-block`).
- **Exception — `classic-theme-banner`:** This scenario does not use `wp-skill/testing-block` in post content. The agent's plugin outputs the banner via a WordPress action hook; the e2e locates it by `data-wp-interactive` attribute or a distinctive class. All other conventions apply.
- **Decision:** These conventions are codified and all new specs must follow them. The relative import path change (2 → 3 levels up) is the only structural difference from existing specs. `classic-theme-banner` is the sole exception to the fixed block name.
- **Rationale:** Consistency with existing specs reduces review friction. The conventions already reflect Playwright best practices and WP e2e test-utils-playwright patterns.

### Topic: Authoring approach

- **Spec link:** Requirements 4, 5, 6 / Acceptance Criteria 3, 4, 5
- **Decision:** Each scenario is authored as a discrete file-write task in the code phase. No code generation or templating tooling is introduced — the code writer produces `scenario.yaml` and `e2e.spec.mjs` directly as text files.
- **Scenario YAML authoring rules:**
  - `name`: kebab-case directory name (globally unique).
  - `description`: one sentence, present tense, describes what the block does.
  - `skills`: `[wordpress-development]`.
  - `prompt`: outcome-focused, user-language, no directive/API names. Written as a feature request from a non-expert.
  - `acceptance`: scenario-specific only — behaviors or constraints unique to this scenario. Rubric covers generic wiring; acceptance covers the distinct iAPI concept being exercised (e.g., "The counter is independent per block instance — two blocks on the same page do not share counts").
  - `rubrics`: `[wp-interactivity-api-best-practices]`.
- **Migration of existing scenarios:**
  - `minimal-scaffold` → `eval/scenarios/foundations/minimal-scaffold/` (git mv). Name unchanged. `scenario.yaml` and `e2e.spec.mjs` updated to fix relative import paths.
  - `independent-counters` → `eval/scenarios/state-and-context/independent-counters/` (git mv). Name unchanged. Imports updated.
  - `derived-double` → `eval/scenarios/derived-state/derived-double/` (git mv). Name unchanged. Imports updated.
  - `async-fetch` → `eval/scenarios/async-actions/joke-fetch/` (git mv + rename). `name` field changes to `joke-fetch`. Prompt/acceptance updated to match the "Joke of the day" scenario. e2e updated.
  - `config-fetch` → `eval/scenarios/server-rendering/config-rest-nonce/` (git mv + rename). `name` changes to `config-rest-nonce`. Content updated to match the proposal.
  - `fruit-list-each` → `eval/scenarios/lists/fruit-list-with-add/` (git mv + rename). `name` changes to `fruit-list-with-add`. Content updated.
  - `shared-state` → `eval/scenarios/state-and-context/shared-state-tally/` (git mv + rename). `name` changes to `shared-state-tally`. Content updated.
  - `paginated-list` → `eval/scenarios/client-navigation/paginated-posts-router/` (git mv + rename). `name` changes to `paginated-posts-router`. Content updated.
  - `focus-trap-menu` → `eval/scenarios/ux-patterns/side-drawer/` (git mv + rename). `name` changes to `side-drawer`. Content rewritten (it already tests a focus-trap hamburger menu, which matches the proposal's "Side drawer with focus trap" scenario exactly). e2e updated.
  - `counter` → **deleted** (`git rm`). Generic counter with no curated counterpart.
  - `toggle-visibility` → **deleted** (`git rm`). Subsumed by `reactive-bindings/accessible-disclosure`.
  - `_candidates.yaml` → **deleted** (`git rm`). No longer needed once the curated set is implemented.
- **New scenarios (57 remaining after 8 migrate):** Each authored from scratch as a new directory under the appropriate group, containing `scenario.yaml` + `e2e.spec.mjs`.
- **Rationale:** Using `git mv` for migrating scenarios preserves file history. Authoring from scratch for new scenarios is correct since the proposal descriptions are detailed enough to write prompts and e2e tests without a reference implementation.

### Topic: Rubric edit

- **Spec link:** Requirement 11 / Acceptance Criterion 8
- **Current text (line 30, Reactivity and directives section):** `DOM events are wired through the \`data-wp-on*\` directive family (\`data-wp-on--<event>\`, \`data-wp-on-window--<event>\`, \`data-wp-on-document--<event>\`, \`data-wp-on-async--<event>\`) — never via manual \`addEventListener\` calls in \`view.js\`.`
- **Decision:** Remove `data-wp-on-async--<event>` from the directive family enumeration in that bullet. The sentence becomes: `DOM events are wired through the \`data-wp-on*\` directive family (\`data-wp-on--<event>\`, \`data-wp-on-window--<event>\`, \`data-wp-on-document--<event>\`) — never via manual \`addEventListener\` calls in \`view.js\`.`
- **Rationale:** `data-wp-on-async` is deprecated — `data-wp-on` is async by default now. Removing it from the rubric ensures a testing agent that uses `data-wp-on-async--click` is not graded as correct. No other rubric text references `on-async`. No other rubric changes needed (no coverage gap found during scenario design).
- **Scope:** Exactly one line changes; all other rubric content is preserved.

## Open Questions

None — all design questions are resolved.

## Risks

1. **`probeStoreOverride` importmap dependency:** The `page.addScriptTag({ type: 'module' })` approach relies on WordPress injecting an importmap for `@wordpress/interactivity` in the page `<head>`. This is standard in WP 6.5+ with `wp-env`. If the importmap URL changes between WP versions, the injected module fails silently. Mitigation: the `probeStoreOverride` helper should assert that `window.__lockResult` is defined after the script tag executes (not just check its value), so a missing importmap surfaces as a test failure rather than a false negative.

2. **TypeScript scenario e2e depth:** The TypeScript scenarios exercise type-system constraints. Runtime behavior can be tested (counter increments, state merges correctly), but type correctness (no `as any`, no explicit casts) cannot be verified at runtime. The e2e covers runtime behavior only; type correctness is an authoring requirement checked during code review. This is acceptable per spec (e2e tests runtime behavior).

3. **`classic-theme-banner` scope drift:** If the scenario must genuinely test `wp_interactivity_process_directives()` on non-block HTML (a classic theme template), the harness would need custom PHP in the theme directory. The design scopes it to a block `render.php` that calls the function directly — simpler and covers the same API surface. The plan phase should record this scoping so reviewers do not flag it as underimplemented.

4. **Code-phase task volume:** 58 new scenarios + 8 migrations = ~66 file-authoring tasks. Each produces two files (`scenario.yaml` + `e2e.spec.mjs`). The plan phase must batch these into parallel groups (e.g., one task per group folder) to stay within agent context limits. This is a planning risk, not a design risk.
