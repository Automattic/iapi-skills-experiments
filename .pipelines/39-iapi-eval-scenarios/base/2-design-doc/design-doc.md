# Design Doc: Complete iAPI eval scenario set + folder organization

## Overview

The repository hosts the `wordpress-development` skill and a Skillsmith-based evaluation
suite under `eval/`. The suite sends scenario prompts to LLM "testing agents" that each
build a WordPress block; judges and a shared rubric grade the result, and an end-to-end
(e2e) hook validates the block in a real `wp-env` runtime. Today `eval/scenarios/` holds
~11 flat scenarios that were an initial workflow-exercising set, not real coverage of the
WordPress Interactivity API (iAPI).

This work replaces that initial set with a curated, de-duplicated set of **68 iAPI eval
scenarios** organized into a **12-group capability taxonomy** nested one level deep
(`eval/scenarios/<group>/<scenario>/`). Each scenario is authored as a Skillsmith
`scenario.yaml` plus an `e2e.spec.mjs`. The scenarios are authored and reviewed for
correctness but **not executed** in this run (TDD-style, test-first); executing them and
improving the iAPI reference until they pass is a later, owner-driven phase. Realizing the
nested layout also requires bumping the `@automattic/skillsmith` dependency to a trunk
commit that supports nested discovery and folder filtering, a small revision to
`eval/utils/verify-e2e.ts` so failure attribution stays keyed on the scenario directory,
one new shared e2e helper in a new `eval/utils/e2e-helpers.mjs`, and one line dropped from
the shared rubric.

## Approach

The end state is a fully curated `eval/scenarios/` tree and the minimal tooling changes
that make it work. The mental model for the implementer:

1. **Taxonomy.** `eval/scenarios/` contains exactly 12 group directories. Each group holds
   one directory per scenario, named in kebab-case. There are 68 scenario directories
   total. `scenario.yaml` files live **only** at the leaf `<group>/<scenario>/` level —
   never at the group level (Skillsmith discovery recurses into all descendants, so a
   stray group-level YAML would be picked up as a malformed scenario).

2. **Per-scenario artifacts.** Every scenario directory contains a `scenario.yaml`
   (Skillsmith schema) and an `e2e.spec.mjs` (Playwright spec, authored test-first). No
   scenario is omitted from e2e — analysis found every scenario has testable runtime
   behavior.

3. **Migration vs. new.** 9 of the existing flat scenarios map onto curated scenarios and
   are moved with `git mv` (some renamed) to preserve history; 2 existing scenarios plus
   the `_candidates.yaml` index are deleted (`git rm`); the remaining 59 scenarios are
   authored from scratch.

4. **Tooling.** Bump `@automattic/skillsmith` to the trunk SHA that supports nested
   folders; this changes Skillsmith's reported `dirName` from `<scenario>` to
   `<group>/<scenario>`. That single change automatically fixes spec lookup in
   `verify-e2e.ts` but breaks failure attribution in its `scenarioDirOf()` parser, which is
   patched. Add `eval/utils/e2e-helpers.mjs` with the one shared harness helper
   (`addLockProbe`) the `locked-private-store` scenario needs. Drop the deprecated
   `data-wp-on-async--<event>` directive from the shared rubric.

5. **No reference, no execution.** This run does not build golden implementations, does not
   run the Skillsmith `scenarios × agents` matrix, and does not run the e2e specs to green.
   The specs are written so they are *runnable in shape* against a later correct
   implementation.

## Components

### `eval/scenarios/` (replaced)

The scenario tree is fully restructured from flat to nested. Final shape:

```
eval/scenarios/
  <group>/                         # one of 12 capability groups
    <scenario>/                    # kebab-case, globally unique name
      scenario.yaml                # Skillsmith scenario definition
      e2e.spec.mjs                 # Playwright e2e spec (test-first)
```

The 12 groups: `foundations`, `reactive-bindings`, `state-and-context`, `derived-state`,
`server-rendering`, `events`, `async-actions`, `lifecycle`, `lists`, `client-navigation`,
`typescript`, `ux-patterns`.

The complete directory mapping (all 68 scenarios) is in **Interfaces and Data Flow →
Scenario directory mapping** below.

### `eval/utils/verify-e2e.ts` (modified)

The post-iteration e2e hook. It locates each ran scenario's spec, builds the agent plugins,
boots `wp-env`, runs Playwright, and attributes failures back to `(scenario, agent)`. Only
its `scenarioDirOf()` parser changes (see Key Decisions). Spec-path construction (line 74),
plugin scaffolding, the `nameToDir`/`dirToName` maps, the wp-env lifecycle, and the report
parser are unaffected.

### `eval/utils/e2e-helpers.mjs` (new)

A new ESM helpers module exporting a single shared helper, `addLockProbe(page, namespace)`,
used by the `locked-private-store` scenario to mount an adversarial `store()` override
probe. It is a thin wrapper over `page.addScriptTag`. The `locked-private-store` nested
spec imports it via
`import { addLockProbe } from "../../../utils/e2e-helpers.mjs"`. The analytics sink that
`pageview-analytics-bridge` needs is **not** a shared helper — it is inlined per spec with
`page.addInitScript` (see Interfaces and Data Flow).

### `eval/rubrics/wp-interactivity-api-best-practices.md` (modified)

The shared rubric grading generic iAPI best practices, referenced by every scenario's
`rubrics: [wp-interactivity-api-best-practices]`. Exactly one line changes: the
`data-wp-on-async--<event>` directive is removed from the `data-wp-on*` family
enumeration. All other rubric content is preserved.

### `package.json` (modified)

The `@automattic/skillsmith` dependency is repinned to the trunk SHA that supports nested
discovery and folder filtering.

### Untouched but relevant

- **`eval/utils/scaffold-plugin.ts`** — keys plugin dirs on `scenario.name`
  (`plugin-<name>-<agentId>`), not on the directory path, so nesting does not affect it.
- **`playwright.config.ts`** — its `**/e2e.spec.mjs` match is already recursive, so it
  discovers nested specs without change.
- **`eval/utils/wp-cli.mjs`** — exports `deactivateAllPlugins`; nested specs import it from
  `../../../utils/wp-cli.mjs` (one extra level up vs. the flat specs' `../../utils/`).
- **`skillsmith.config.ts`** — `paths.scenarios` default is `eval/scenarios`; no change
  needed.

## Interfaces and Data Flow

### Scenario discovery and run flow

```
Skillsmith (trunk)
  └─ enumerate.ts recursive walk → finds eval/scenarios/*/*/scenario.yaml
       → each scenario gets id = "<group>/<scenario>", dirName = id, name = YAML `name`
  └─ for each (scenario, agent): agent builds a plugin in
       iteration-N/<scenario.name>/<agent>/workspace/plugin-<name>-<agentId>/
  └─ post-iteration hook: runE2eVerification(iterationDir, scenarios)
       ├─ nameToDir: scenario.name → "<group>/<scenario>"   (locate spec)
       ├─ spec path: eval/scenarios/<group>/<scenario>/e2e.spec.mjs
       ├─ Playwright runs spec; reports file path relative to testDir (eval/scenarios)
       │    → "<group>/<scenario>/e2e.spec.mjs"
       └─ scenarioDirOf(path) → "<group>/<scenario>"  →  dirToName → scenario.name
            → VerificationFailure { scenario: name, agent }
```

### `scenario.yaml` schema (Skillsmith)

Every `scenario.yaml` has exactly these fields:

```yaml
name: <kebab-case-id>              # matches the directory name; globally unique across all 68
description: <one line>            # present tense, what the block does
skills: [wordpress-development]
prompt: |
  <outcome-focused feature request in non-expert user language;
   names no iAPI directive, store/server API, or implementation mechanism>
acceptance:
  - <scenario-specific behavior or constraint only>
  - <the distinct iAPI concept this scenario exercises>
rubrics: [wp-interactivity-api-best-practices]
```

Field rules:

- **`name`** — equals the directory name, kebab-case, **globally unique** across the entire
  tree (Skillsmith's `validateConfiguredScenarioNamesAreUnique()` throws a
  `UserFacingError` on any duplicate `name`, even across different groups; all 68 names are
  verified unique).
- **`description`** — one sentence, present tense.
- **`prompt`** — a realistic feature request phrased as a non-expert user would write it.
  It describes the desired behavior and never names an iAPI directive, store API, server
  helper, or other implementation mechanism. Inherently technical asks are expressed as
  user constraints (e.g. "build it in TypeScript with full type safety", "harden it so
  other plugins can't tamper with it"), not as directive names.
- **`acceptance`** — only criteria unique to this scenario: the specific behavior and the
  distinct iAPI concept it exercises. Generic wiring/reactivity expectations that apply to
  every scenario are **not** restated here; the shared rubric owns those.

### `e2e.spec.mjs` shape (standard conventions)

Imports (note the **three**-level-up paths for nested specs):

```js
import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";
// only the locked-private-store spec:
import { addLockProbe } from "../../../utils/e2e-helpers.mjs";
```

Lifecycle and fixtures:

- `test.beforeAll`: `deactivateAllPlugins()`, then
  `requestUtils.activatePlugin(`plugin-<scenario>-${workerInfo.project.metadata.agentId}`)`,
  then create the post(s)/page(s) the scenario needs.
- Block markup uses the **fixed block name** `wp-skill/testing-block`:
  `<!-- wp:wp-skill/testing-block /-->`. For multi-instance scenarios, embed it twice:
  `<!-- wp:wp-skill/testing-block /-->\n<!-- wp:wp-skill/testing-block /-->` and address
  instances via `.locator(".wp-block-wp-skill-testing-block").nth(0)` / `.nth(1)`.
  **`classic-theme-banner` is the sole exception:** its plugin hooks `wp_footer` and emits
  the banner outside the block pipeline, so its spec creates any post (no testing-block in
  the content) and locates the banner by its `data-wp-interactive` attribute or a
  distinctive class.
- `test.afterAll`: `deactivateAllPlugins()` + `requestUtils.deleteAllPosts()` (and delete
  any created pages).

Assertion patterns:

- **Selectors:** prefer role-based (`getByRole("button", { name: /…/i })`), then text
  (`getByText`), then attribute (`locator("[data-wp-text]")`). Class-only selectors are
  reserved for the block wrapper (`.wp-block-wp-skill-testing-block`).
- **Reactive DOM/state:** `toContainText`, `toHaveAttribute`, `expect.poll(...)` for async
  hydration markers (the `page.on("console", …)` pattern from `minimal-scaffold`).
- **Accessibility tree:** assert ARIA state via `toHaveAttribute("aria-expanded", "true")`,
  `role="dialog"` present/absent, etc.
- **Server-rendered HTML:** for SSR scenarios, assert the content is correct before
  hydration signals (the directive's target reads correctly from seeded state/context).
- **Router navigation:** `page.click(...)` on a nav link, then
  `await page.waitForURL(...)` / `expect(page).toHaveURL(...)` to assert soft navigation.
- **Fake timers:** `await page.clock.install(); await page.clock.runFor(ms)` for
  `setInterval`/`setTimeout`-driven scenarios (`page.clock` confirmed available in the
  pinned Playwright).
- **IntersectionObserver:** trigger via
  `page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))`.

### Scenario directory mapping (all 68)

Directory name equals the `scenario.yaml` `name` field in every case. "Source" indicates
whether the scenario is migrated (with the originating flat directory), and whether the
migration is a rename and/or content rework.

| Group | Directory / `name` | Source |
|---|---|---|
| `foundations` | `minimal-scaffold` | migrate (`git mv`) from `minimal-scaffold`, name unchanged |
| `foundations` | `classic-theme-banner` | new |
| `foundations` | `multi-directive-element` | new |
| `reactive-bindings` | `greeting-rotator` | new |
| `reactive-bindings` | `selectable-tile` | new |
| `reactive-bindings` | `css-variable-progress` | new |
| `reactive-bindings` | `on-sale-attribute` | new |
| `reactive-bindings` | `accessible-disclosure` | new |
| `state-and-context` | `independent-counters` | migrate from `independent-counters`, name unchanged |
| `state-and-context` | `nested-theme-card` | new |
| `state-and-context` | `php-seeded-context` | new |
| `state-and-context` | `product-quantity-stepper` | new |
| `state-and-context` | `shared-state-tally` | migrate + rename from `shared-state` |
| `state-and-context` | `cart-count-cross-block` | new |
| `state-and-context` | `locked-private-store` | new |
| `state-and-context` | `pageview-analytics-bridge` | new |
| `state-and-context` | `cross-namespace-now-playing` | new |
| `derived-state` | `derived-double` | migrate from `derived-double`, name unchanged |
| `derived-state` | `price-with-vat` | new |
| `derived-state` | `tax-calculator-mixed` | new |
| `derived-state` | `results-no-flash` | new |
| `derived-state` | `shopping-list-server-derived` | new |
| `server-rendering` | `config-rest-nonce` | migrate + rename from `config-fetch` |
| `server-rendering` | `welcome-banner-i18n` | new |
| `server-rendering` | `stable-tab-ids` | new |
| `events` | `like-button` | new |
| `events` | `live-char-counter` | new |
| `events` | `viewport-width-display` | new |
| `events` | `command-palette-keydown` | new |
| `events` | `menu-touch-hover` | new |
| `events` | `newsletter-submit-guard` | new |
| `async-actions` | `joke-fetch` | migrate + rename + rework from `async-fetch` |
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
| `lists` | `fruit-list-with-add` | migrate + rename from `fruit-list-each` |
| `lists` | `reorderable-todo-list` | new |
| `lists` | `image-carousel` | new |
| `lists` | `live-search-filter` | new |
| `client-navigation` | `footer-client-nav` | new |
| `client-navigation` | `paginated-posts-router` | migrate + rename from `paginated-list` |
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
| `ux-patterns` | `side-drawer` | migrate + rename + rework from `focus-trap-menu` |
| `ux-patterns` | `expandable-search` | new |

**Deleted (not migrated):**

- `counter` (`git rm`) — generic counter with no curated counterpart.
- `toggle-visibility` (`git rm`) — subsumed by `reactive-bindings/accessible-disclosure`
  (same concept: boolean-attribute binding + `aria-expanded`).
- `_candidates.yaml` (`git rm`) — the pre-curation candidate index, superseded by the
  curated set.

**Totals:** 9 migrate (6 with rename, 2 of those reworked), 2 scenarios + 1 index deleted,
59 new = 68 scenarios.

### Harness capabilities for the two scenarios that need them

**Shared helper — `eval/utils/e2e-helpers.mjs`:**

- **`addLockProbe(page, namespace)`** — used only by `locked-private-store`. Injects an ES
  module via `page.addScriptTag({ type: "module", content: … })` that imports `store` from
  `@wordpress/interactivity` through WordPress's own importmap, attempts to re-open
  `namespace` without the `lock` key, and writes
  `window.__lockResult = "unlocked" | "locked"` depending on whether the override was
  accepted. The spec calls `addLockProbe(page, namespace)` **after** `page.goto(...)`
  (post-hydration), then asserts `await page.evaluate(() => window.__lockResult) ===
  "locked"`. The helper also asserts `window.__lockResult` is *defined* after the script
  runs, so a missing/changed importmap surfaces as a test failure rather than a silent
  false negative. Sketch:

  ```js
  export async function addLockProbe(page, namespace) {
    await page.addScriptTag({
      type: "module",
      content: `import { store } from "@wordpress/interactivity";
        try { store(${JSON.stringify(namespace)}, {}); window.__lockResult = "unlocked"; }
        catch (e) { window.__lockResult = "locked"; }`,
    });
    // guard against silent importmap failure
    await expect.poll(() => page.evaluate(() => window.__lockResult)).toBeDefined();
  }
  ```

**Analytics sink — inline per spec (no shared helper):**

`pageview-analytics-bridge` does **not** use a shared helper. Its spec stubs the analytics
callback inline, **before** navigation:

```js
await page.addInitScript({
  content:
    "window.__analyticsTracker = (...a) => { (window.__analyticsEvents ??= []).push(a); };",
});
```

then asserts on `page.evaluate(() => window.__analyticsEvents)`. The scenario's `acceptance`
constrains the agent in user language to call `window.__analyticsTracker(value)` when the
watched value changes — an integration point, not an iAPI directive name. The pattern is
used by only this scenario and is simple enough to inline.

## Key Decisions

### Decision: Nested one-level taxonomy with directory name == `name` field

- **Choice:** Lay scenarios out as `eval/scenarios/<group>/<scenario>/`, 12 groups, 68
  leaf scenario directories, with each directory name equal to its `scenario.yaml` `name`
  field. `scenario.yaml` exists only at leaf nodes.
- **Alternatives:** Keep the flat layout (rejected — does not express the capability
  taxonomy the proposal settled and does not scale to 68); deeper nesting (rejected —
  proposal specifies exactly one level); allow group-level YAML (rejected — Skillsmith's
  recursive discovery would treat it as a malformed scenario).
- **Trade-offs:** Directory == `name` makes Skillsmith's uniqueness check and artifact
  keying align with the on-disk layout and keeps lookup intuitive; the cost is that names
  must be globally unique, not just per-group (all 68 verified unique). Names are shortened
  from the proposal's scenario titles to practical kebab-case identifiers.
- **Traces to:** Requirements 1, 2, 3 / Acceptance Criteria 1, 2, 3.

### Decision: Pin `@automattic/skillsmith` to trunk SHA `95c86bdbbcae79c4dc46dea07d15fd5d69e4ee2d`

- **Choice:** Set
  `"@automattic/skillsmith": "github:Automattic/skillsmith#95c86bdbbcae79c4dc46dea07d15fd5d69e4ee2d"`
  in `package.json` (replacing the current pin
  `6bd90c34d88b815fdf4fd661dc8c51288111444c`). This commit merges Skillsmith PR #52
  ("support nested scenario folders and folder filtering"). Confirmed on trunk:
  `src/scenarios/enumerate.ts` recursively walks descendants to find `scenario.yaml` at any
  depth; it sets `id = segments.join('/')` and `dirName: id`, so
  `eval/scenarios/foundations/minimal-scaffold/scenario.yaml` yields
  `dirName = "foundations/minimal-scaffold"`; `src/scenarios/selection.ts`
  `matchesScenarioFilter` is segment-aware (`--filter foundations` matches
  `foundations/minimal-scaffold` but not `my-events/x` or `events-old/x`); iteration
  workspaces are keyed by `scenario.name`, not `dirName`. No `skillsmith.config.ts` or
  scenario-schema change is required.
- **Alternatives:** Bare `github:Automattic/skillsmith` (rejected — tracks the moving tip,
  non-reproducible, can drift silently); stay on the current pin (rejected — its flat
  `readdirSync(scenariosRoot)` cannot discover nested scenarios).
- **Trade-offs:** An exact SHA is reproducible and matches the existing pin style; the cost
  is a manual bump when future Skillsmith changes are needed (acceptable — out of scope
  here).
- **Traces to:** Requirements 12, 14 / Acceptance Criterion 9.

### Decision: Patch `scenarioDirOf()` to return `<group>/<scenario>`

- **Choice:** With the trunk bump, `dirName` becomes `<group>/<scenario>` and Playwright
  reports spec paths relative to its `testDir` (`eval/scenarios`) as
  `<group>/<scenario>/e2e.spec.mjs`. Spec-path construction at line 74
  (`join("eval", "scenarios", dirName, "e2e.spec.mjs")`) already produces the correct
  nested path with no change. But `scenarioDirOf()` currently returns only the
  second-to-last segment (the leaf `<scenario>`), while `dirToName` is keyed on the full
  `<group>/<scenario>` — so attribution would break. Fix `scenarioDirOf()` to return the
  **group and scenario segments** (third-to-last and second-to-last, skipping the trailing
  filename) joined with `/` when the path has ≥ 3 segments, falling back to the single
  parent segment otherwise:

  ```typescript
  function scenarioDirOf(file: string): string | undefined {
    const segments = file.split(/[\\/]/).filter((s) => s.length > 0);
    if (segments.length >= 3)
      return `${segments[segments.length - 3]}/${segments[segments.length - 2]}`;
    if (segments.length >= 2) return segments[segments.length - 2];
    return undefined;
  }
  ```

  The reported path always has the form `<group>/<scenario>/e2e.spec.mjs` (3 segments), so
  the `>= 3` branch always fires post-migration; the `>= 2` fallback preserves the old
  single-segment behavior for any truly flat path.
- **Alternatives:** Re-key `dirToName` on the scenario-name segment only (rejected — names
  could collide across groups and it discards the group context Skillsmith now supplies).
- **Trade-offs:** This is the minimal fix — it touches only the parser, leaves the maps and
  lifecycle untouched, and reconstructs exactly the key the trunk-generated `dirToName`
  expects.
- **Traces to:** Requirement 13 / Acceptance Criterion 10.

### Decision: One shared e2e helper (`addLockProbe`); analytics inline; no scenario omitted

- **Choice:** Build `eval/utils/e2e-helpers.mjs` exporting exactly one helper,
  `addLockProbe(page, namespace)`. The analytics sink is inlined per spec. Every one of the
  68 scenarios has an `e2e.spec.mjs` — analysis found no scenario lacks meaningful runtime
  signal.
- **`addLockProbe`:** the `locked-private-store` adversarial probe must call `store()`,
  which is reachable **only** through an ES `import` — `@wordpress/interactivity` is a pure
  ES module that makes no assignment to `window.wp.*`, and `storeLocks` is a module-private
  `Map` (verified on Gutenberg trunk). So `page.evaluate(() => window.wp?.interactivity?.store)`
  returns `undefined` and cannot be used. The chosen mechanism injects a `type: "module"`
  script via `page.addScriptTag` that resolves `@wordpress/interactivity` through the
  WordPress 6.5+ importmap, attempts to re-open the namespace without the `lock` key, and
  writes `window.__lockResult`. The spec asserts the result is `"locked"`. The alternative —
  having the agent's plugin register a second probe script module (Gutenberg's own fixture
  pattern) — is rejected because it leaks the test into the agent's plugin and adds
  authoring burden; the chosen approach keeps the probe entirely in the harness.
- **Analytics sink — inline, not a shared helper:** `pageview-analytics-bridge` stubs the
  analytics callback inline with `page.addInitScript` before navigation
  (`window.__analyticsTracker = (...a) => { (window.__analyticsEvents ??= []).push(a); }`)
  and asserts on `window.__analyticsEvents`. The analytics target is a **client-side
  callback** the scenario asks the agent to invoke (`window.__analyticsTracker(value)` when
  the watched value changes), not necessarily an HTTP request — so network interception
  (`page.route`) is the wrong tool. The pattern is used by only this scenario and is simple
  enough to inline rather than factor into a shared helper.
- **`classic-theme-banner` — exception to the fixed block name:** this scenario does not use
  `wp-skill/testing-block`. The agent's plugin hooks `wp_footer` and outputs the interactive
  banner HTML directly, calling `wp_interactivity_process_directives()` on the markup so the
  directives are processed outside the block directive pipeline. The e2e creates any post,
  visits it, and locates the banner by its `data-wp-interactive` attribute or a distinctive
  class. The scenario's `acceptance` records the constraint so reviewers do not read it as
  off-convention.
- **Standard mechanisms needing no helper:** console capture (`page.on("console", …)`,
  already established in `minimal-scaffold`), fake timers (`page.clock`),
  IntersectionObserver scroll trigger, multi-instance markup, and cross-page router
  navigation (`requestUtils.createPage()` ×2) are all standard Playwright and handled
  inline per spec.
- **Trade-offs:** `addLockProbe` is a thin wrapper over `page.addScriptTag`, not new
  infrastructure; inlining the analytics stub keeps the helper surface to one export. Both
  satisfy the spec's rule that harness gaps are never a reason to omit an e2e.
- **Traces to:** Requirements 7, 8, 9 / Acceptance Criteria 6, 7.

### Decision: Migrate 9 scenarios with `git mv`; delete 2 + the candidates index

- **Choice:** Use `git mv` to relocate the 9 existing scenarios that map onto curated ones
  (renaming the `name` field and reworking prompt/acceptance/e2e where the curated scenario
  differs), preserving file history. Delete `counter`, `toggle-visibility`, and
  `_candidates.yaml` with `git rm`. Author the remaining 59 scenarios from scratch. No
  code-generation or templating tooling is introduced — each `scenario.yaml` and
  `e2e.spec.mjs` is written directly as text.
- **Alternatives:** Delete-and-recreate the 9 migrated scenarios (rejected — loses git
  history); keep `counter`/`toggle-visibility` (rejected — `counter` has no curated
  counterpart and `toggle-visibility` is fully subsumed, so keeping them would violate
  "no non-curated scenarios remain").
- **Trade-offs:** `git mv` preserves history at the cost of per-file move tasks; authoring
  59 from scratch is viable because the proposal descriptions are detailed enough to write
  prompts and test-first specs without a reference implementation.
- **Traces to:** Requirements 3, 4, 5, 6 / Acceptance Criteria 1, 4, 5, 6.

### Decision: Drop `data-wp-on-async--<event>` from the rubric

- **Choice:** In `eval/rubrics/wp-interactivity-api-best-practices.md` (Reactivity and
  directives section, the `data-wp-on*` family bullet), remove `data-wp-on-async--<event>`
  from the enumeration so the bullet reads
  ``data-wp-on--<event>``, ``data-wp-on-window--<event>``, ``data-wp-on-document--<event>``.
  Exactly one line changes; all other rubric content is preserved.
- **Alternatives:** Leave it in (rejected — `data-wp-on-async` is deprecated;
  `data-wp-on` is async by default now, so an agent answering with `data-wp-on-async--click`
  would be graded correct against a deprecated directive); broader rubric edits (rejected —
  spec limits rubric changes to this one line unless a genuine new coverage gap is found,
  and scenario design surfaced none).
- **Trade-offs:** Minimal, targeted change keeps the rubric's generic coverage intact while
  closing the one deprecated path.
- **Traces to:** Requirement 11 / Acceptance Criterion 8.

## Dependencies

- **`@automattic/skillsmith`** (existing, **re-pinned**) → trunk SHA
  `95c86bdbbcae79c4dc46dea07d15fd5d69e4ee2d` for nested discovery + folder filtering. This
  is the only dependency change; Skillsmith's own source is not modified.
- **`@wordpress/e2e-test-utils-playwright`** (existing) — `test`, `expect`, `requestUtils`
  (`activatePlugin`, `createPost`, `createPage`, `deleteAllPosts`), and `page.clock`,
  `page.addInitScript`, `page.addScriptTag`, `page.on("console")` from the pinned
  Playwright.
- **`@wordpress/interactivity`** (runtime, via WordPress 6.5+ importmap) — `addLockProbe`
  resolves `store` through the importmap WordPress injects in `<head>`. Not a new package
  dependency; a runtime contract the probe relies on.
- **`eval/utils/wp-cli.mjs`** (existing) — `deactivateAllPlugins`, imported by every spec.
- **`eval/utils/e2e-helpers.mjs`** (new internal module) — exports `addLockProbe`, imported
  only by the `locked-private-store` spec.
- No new external services. The analytics callback `pageview-analytics-bridge` exercises is
  a client-side stub installed by the spec; nothing is sent over the network.

## Failure Modes and Observability

- **Duplicate `scenario.name`** — Skillsmith's `validateConfiguredScenarioNamesAreUnique()`
  throws a `UserFacingError` ("Duplicate scenario.name values are not supported because
  reports and artifacts are keyed by scenario.name"). Detected at enumeration time, before
  any agent runs. All 68 names are verified unique up front.
- **Stray group-level `scenario.yaml`** — recursive discovery would pick it up as a
  malformed scenario. Avoided by the invariant that YAML lives only at leaf nodes.
- **Spec mis-attribution** — if `scenarioDirOf()` returned the wrong key, a failing spec
  would either be dropped (no matching `dirToName` entry → `continue`) or mapped to the
  wrong scenario. The patched two-segment parser keeps attribution exact; the
  `runE2eVerification` path already de-duplicates on `scenario::agent`.
- **Probe importmap drift** — `addLockProbe` depends on WordPress injecting an importmap for
  `@wordpress/interactivity`. If the importmap URL changes across WP versions the injected
  module fails silently; the helper guards against a false negative by asserting
  `window.__lockResult` is *defined* (not merely a particular value), so a missing importmap
  surfaces as a test failure.
- **Observability** — failures are surfaced as `VerificationFailure { scenario, agent,
  details }` from the e2e hook; Playwright's JSON report (`tests-report.json`) is the
  source of truth; hydration/lifecycle scenarios assert on captured `console` output. These
  are existing channels; nothing new is introduced. (These specs are not executed in this
  run; the failure modes describe the behavior they are authored to produce later.)

## Risks and Open Questions

No open design questions remain. Risks for the implementation plan to carry:

1. **`addLockProbe` importmap dependency.** Relies on the WP 6.5+ importmap being present
   under `wp-env`. Mitigated by asserting `window.__lockResult` is defined after the script
   runs, so a missing importmap fails loudly rather than silently. The plan should ensure
   the helper implements this assertion.
2. **TypeScript scenario e2e depth.** The 4 `typescript/*` scenarios exercise type-system
   constraints. e2e can verify runtime behavior (counter increments, state merges) but not
   type correctness (no `as any`, no explicit casts) — that is an authoring/review
   requirement, not a runtime assertion. Acceptable per spec (e2e tests runtime behavior).
3. **`classic-theme-banner` off-convention scope.** The agent's plugin hooks `wp_footer`
   and emits the banner via `wp_interactivity_process_directives()` outside the block
   pipeline; the spec creates any post and locates the banner by `data-wp-interactive` /
   class rather than `wp-skill/testing-block`. This is the sole exception to the fixed
   block-name convention. The plan must record this scoping in the scenario's `acceptance`
   so reviewers do not flag it as off-convention or underimplemented.
4. **Code-phase task volume (planning risk, not design risk).** ~68 authoring tasks (59 new
   + 9 migrations), each producing `scenario.yaml` + `e2e.spec.mjs`. The plan should batch
   these (e.g. one task per group) to stay within agent context limits.
