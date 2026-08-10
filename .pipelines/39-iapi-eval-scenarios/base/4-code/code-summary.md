# Code Summary: Complete iAPI eval scenario set + folder organization

## What

The code phase replaced the ~11 flat, workflow-exercising scenarios under `eval/scenarios/`
with a curated set of **68 WordPress Interactivity-API (iAPI) eval scenarios** organized into
a **12-group capability taxonomy** nested one level deep (`eval/scenarios/<group>/<scenario>/`).
Each scenario is a Skillsmith `scenario.yaml` plus a Playwright `e2e.spec.mjs`. Alongside the
tree it landed the minimal tooling changes that make the nested layout work: the
`@automattic/skillsmith` pin, a `scenarioDirOf()` patch in `eval/utils/verify-e2e.ts`, a new
shared e2e helper `eval/utils/e2e-helpers.mjs`, and a one-line rubric edit.

The 12 groups: `foundations`, `reactive-bindings`, `state-and-context`, `derived-state`,
`server-rendering`, `events`, `async-actions`, `lifecycle`, `lists`, `client-navigation`,
`typescript`, `ux-patterns`.

## Why

The eval suite drives how the iAPI reference in the `wordpress-development` skill evolves: it
sends each scenario's prompt to LLM testing agents, which build a WordPress block, then judges,
a shared rubric, and an e2e hook grade the result. The prior flat set was an initial
workflow-exercising set, not real coverage of the iAPI surface. This curated set maps every
iAPI concept to at least one scenario with no overlap, so running the suite surfaces exactly
where the reference falls short. The specs are authored **test-first and not executed** in this
run; executing them and improving the reference until they pass is a later, owner-driven phase.

## How

The work ran in three phases over the diff `81a5dbe → HEAD`:

1. **Foundation (Tasks 1–2).** Repinned `@automattic/skillsmith` to trunk SHA
   `95c86bdbbcae79c4dc46dea07d15fd5d69e4ee2d` (nested discovery + folder filtering) and ran the
   install so the lockfile/`node_modules` resolve. Patched `scenarioDirOf()` so a nested
   `<group>/<scenario>/e2e.spec.mjs` path resolves to the key `<group>/<scenario>` (≥3 segments
   → group+scenario joined; 2 segments → legacy flat fallback; otherwise `undefined`), keeping
   failure attribution keyed on the scenario dir. Added `eval/utils/e2e-helpers.mjs` exporting
   exactly one helper, `addLockProbe(page, namespace)`, a thin wrapper over `page.addScriptTag`
   that injects a `type: "module"` probe importing `store` from `@wordpress/interactivity`,
   re-opens the namespace without the `lock` key, writes `window.__lockResult`
   (`"locked"`/`"unlocked"`), and `expect.poll`s that the result is defined so a missing
   importmap fails loudly. Dropped the deprecated `data-wp-on-async--<event>` directive from the
   shared rubric's `data-wp-on*` family bullet (one line; everything else byte-for-byte
   preserved).

2. **Migration (Task 4).** `git mv`'d the 9 existing scenarios that map onto curated ones into
   their nested homes (6 renamed, 2 of those — `joke-fetch`, `side-drawer` — reworked),
   preserving history; fixed every moved spec's import depth from `../../utils/` to
   `../../../utils/`; updated each renamed `name` to match its directory; and `git rm`'d the two
   non-curated scenarios (`counter`, `toggle-visibility`) plus the `_candidates.yaml` index, so
   no flat or non-curated directory remains.

3. **Authoring (Tasks 5–16).** Authored the remaining 59 scenarios from scratch, one task per
   capability group, each as a `scenario.yaml` (user-language prompt naming no mechanism;
   scenario-distinct acceptance) plus an `e2e.spec.mjs` written to the repo's e2e conventions
   (fixed block `wp-skill/testing-block`, per-(scenario, agent) plugin activation,
   `deactivateAllPlugins` reset, shared `eval/utils/` helpers). The two special-harness specs
   wire their harness as designed: `locked-private-store` imports `addLockProbe` and asserts
   `window.__lockResult === "locked"`; `pageview-analytics-bridge` inlines its analytics stub via
   `page.addInitScript`. `classic-theme-banner` is the sole block-name exception (locates the
   banner by `data-wp-interactive`/class and records the exception in its acceptance).

### Iteration-1 fixes folded in

The batch was rejected once (`code-review-1-rejected.md`) for three defects, all fixed and
re-approved in iteration 2:

- **Task 4 (`d194552`).** Cleaned the `acceptance` lists of the 7 affected migrated scenarios
  (`minimal-scaffold`, `independent-counters`, `shared-state-tally`, `derived-double`,
  `config-rest-nonce`, `fruit-list-with-add`, `paginated-posts-router`) to remove iAPI
  directive/store/server-API names and rubric-owned restatements, keeping only each scenario's
  distinct concept — and removed the deprecated `data-wp-on-async--click` reference from
  `config-rest-nonce`.
- **Task 8 (`c369265`).** Made `price-with-vat` parse the two decimals per card and assert
  `vatTotal ≈ basePrice × 1.20`, and made `shopping-list-server-derived` assert the per-row
  server-derived in-cart icon is present on in-cart rows and absent on not-in-cart rows in the
  raw server HTML.

## Key decisions

- **Directory name == `name` field, one level of nesting.** Aligns Skillsmith's uniqueness
  check and artifact keying with the on-disk layout; the cost is that all 68 names must be
  globally unique (verified). Deeper nesting and group-level YAML were rejected (the latter would
  be picked up by Skillsmith's recursive discovery as a malformed scenario).
- **Pin Skillsmith to an exact trunk SHA**, not the moving tip — reproducible and matches the
  existing pin style.
- **One shared e2e helper (`addLockProbe`); analytics inlined.** The lock probe must call
  `store()`, reachable only through an ES `import` (the package makes no `window.wp.*`
  assignment), so it is injected as a module script; the analytics sink is a per-spec
  client-side stub, simple enough to inline rather than factor into a helper.
- **First-paint acceptance phrased against concrete seeded values.** When cleaning migrated
  acceptance lists, generic "no flash of unbound content" wording (rubric-owned) was dropped, but
  scenario-specific first-paint claims tied to the concrete seeded value (e.g. "Hello from iAPI",
  "counter 1 / doubled 2", "starts at 0") were kept — matching the approved `joke-fetch` /
  `side-drawer` template.

## Known limitations

- **Specs are authored, not executed.** They are written to be runnable in shape against a later
  correct implementation; no golden/reference implementations exist yet and the full Skillsmith
  `scenarios × agents` matrix was not run (the owner's manual step). Review of the specs is by
  inspection of repository state, not by green test runs.
- **TypeScript scenarios' type constraints are review-time, not runtime.** The four `typescript/*`
  e2e specs verify runtime behavior (increments, merges) but cannot assert type-system properties
  (no `as any`, no explicit casts); those remain an authoring/review requirement.
- **`addLockProbe` depends on the WP 6.5+ importmap** being present under `wp-env`; the helper
  guards against silent importmap drift by asserting `window.__lockResult` is defined, so a
  missing importmap fails loudly rather than producing a false negative.
