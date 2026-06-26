# Code Review

## Verdict: rejected

## Batch scope

Tasks reviewed (entire code plan, one pass):

- Task 1: Bump Skillsmith, patch `scenarioDirOf()`, drop deprecated rubric directive
- Task 2: Add the `addLockProbe` shared e2e helper
- Task 4: Migrate the 9 existing scenarios; delete the 2 non-curated + the index
- Task 5: Author `foundations` group (2 new)
- Task 6: Author `reactive-bindings` group (5 new)
- Task 7: Author `state-and-context` group (7 new)
- Task 8: Author `derived-state` group (4 new)
- Task 9: Author `server-rendering` group (2 new)
- Task 10: Author `events` group (6 new)
- Task 11: Author `async-actions` group (4 new)
- Task 12: Author `lifecycle` group (6 new)
- Task 13: Author `lists` group (3 new)
- Task 14: Author `client-navigation` group (11 new)
- Task 15: Author `typescript` group (4 new)
- Task 16: Author `ux-patterns` group (5 new)

(Task 3 was retired and folded into Task 1; it does not exist.)

## Summary

The foundation and migration mechanics are solid: the tree is exactly the 68 curated
scenarios across 12 groups, every leaf has both files, all `name` fields equal their
directory and are globally unique, no flat/non-curated directory or group-level YAML
remains, the 9 migrations preserve git history through the `git mv` commit, the Skillsmith
pin resolves and installs to the correct trunk SHA, `scenarioDirOf()` matches the design
for all enumerated cases, `addLockProbe` matches the design sketch exactly, the rubric edit
is a clean one-line removal, and the two special-harness specs (`locked-private-store`,
`pageview-analytics-bridge`) wire their harness exactly as designed. The new authored
scenarios (Tasks 5, 6, 9, 13, 15, 16 and most of 7, 8, 10, 11, 12, 14) are largely clean.

The batch is rejected for two clusters of must-fix defects, both attributable to specific
tasks. First and decisively: seven of the nine **migrated** scenarios (Task 4) were relocated
and (some) renamed but their pre-curation `acceptance` lists were never brought into
compliance with the curated authoring rules — they are saturated with iAPI directive names
and restate generic, rubric-owned wiring/reactivity expectations, violating Spec
Requirement 6 / Acceptance Criterion 5 (and the spirit of Requirement 5 / AC4). One of them
additionally re-endorses the `data-wp-on-async--<event>` directive that Task 1 deliberately
removed from the rubric. The reworked pair (`joke-fetch`, `side-drawer`) was cleaned
correctly, which proves the discipline was understood — it just wasn't applied to the other
seven. Second: two `derived-state` specs (Task 8) carry tests whose titles claim to verify
the scenario's distinctive derived-state behavior but whose assertions do not actually check
it, violating Acceptance Criterion 6 for those scenarios.

## Checks

This project has no guardrails convention, so there are no gates to run. The verdict is a
rejection on review judgment (Spec AC5/AC6 violations); per the workflow the gates would not
change the outcome.

| Check | Command | Result |
| ----- | ------- | ------ |
| (no guardrails convention defined for this project) | — | n/a |

## Behavior verification

Per the launch prompt, these specs are authored test-first and **not executed** in this run;
behavior verification is re-driving the E2E test plan's Flows 1–5 by inspecting the committed
repository state and the diff. Evidence captured:

- **Flow 1 (curated tree is exactly the 68 scenarios).** `find eval/scenarios -name
  scenario.yaml` yields exactly 68 leaf directories under exactly 12 group directories
  (`async-actions`, `client-navigation`, `derived-state`, `events`, `foundations`,
  `lifecycle`, `lists`, `reactive-bindings`, `server-rendering`, `state-and-context`,
  `typescript`, `ux-patterns`), matching the mapping table leaf-for-leaf. No
  `counter/`, `toggle-visibility/`, `_candidates.yaml`, flat scenario dir, or group-level
  `scenario.yaml` remains (verified by `find -maxdepth 2` and explicit `ls`). **Pass.**
- **Flow 2 (every directory is well-formed).** All 68 leaves contain both `scenario.yaml`
  and `e2e.spec.mjs` (count = 68 each; per-leaf loop found no missing `e2e`). All 68 `name`
  fields equal their directory name and are globally unique (no `uniq -d` output).
  Structurally **pass**; field-content defects are recorded under Issues.
- **Flow 3 (prompts user-language, acceptance scenario-specific).** Prompts spot-checked
  across all groups read as user-language. **Acceptance fails for seven migrated scenarios**
  (Issue 1) and re-endorses a deprecated directive in one (Issue 2). **Fail.**
- **Flow 4 (specs follow repo conventions, runnable in shape).** All 68 specs import from
  `../../../utils/wp-cli.mjs` (three levels up — no wrong-depth import found), import
  `@wordpress/e2e-test-utils-playwright`, call `deactivateAllPlugins`, activate
  `plugin-<scenario>-${...agentId}`, and (except `classic-theme-banner`, the recorded
  exception) target `wp-skill/testing-block`. `locked-private-store` imports `addLockProbe`
  from the existing `../../../utils/e2e-helpers.mjs` and asserts `__lockResult === "locked"`;
  `pageview-analytics-bridge` inlines its analytics stub via `page.addInitScript`;
  `classic-theme-banner` locates the banner by `[data-wp-interactive]` (not the
  testing-block) and records the exception in its acceptance. Structurally **pass**;
  assertion-strength defects recorded under Issue 3.
- **Flow 5 (tooling supports the nested layout).** `package.json` and `package-lock.json`
  both resolve `@automattic/skillsmith` to
  `github:Automattic/skillsmith#95c86bdbbcae79c4dc46dea07d15fd5d69e4ee2d`;
  `git ls-remote` confirms that SHA is Skillsmith trunk HEAD; `npm ls @automattic/skillsmith`
  resolves cleanly and `node_modules/@automattic/skillsmith` is present (install succeeds,
  per the project constraint I confirmed only that the pin resolves — I did not run the full
  eval). `scenarioDirOf()` returns `<group>/<scenario>` for ≥3-segment paths, the single
  parent for 2-segment flat paths, and `undefined` below that — matching every Task 1
  acceptance case. The rubric no longer contains `data-wp-on-async` and still lists the three
  non-deprecated `data-wp-on*` directives, with all other rubric content byte-for-byte
  unchanged. **Pass.**

## Issues

### Issue 1: Seven migrated scenarios restate rubric-owned wiring and name iAPI directives in `acceptance`

**Task:** Task 4: Migrate the 9 existing scenarios; delete the 2 non-curated + the index

**What's wrong:** Spec Requirement 6 / Acceptance Criterion 5 require that every scenario's
`acceptance` contain **only** criteria unique to that scenario, and that generic iAPI
wiring/reactivity expectations owned by the shared rubric are **not** restated. The shared
rubric (`eval/rubrics/wp-interactivity-api-best-practices.md`, line 3) states this contract
explicitly: "The criteria below apply to **every** Interactivity API scenario and should not
be duplicated in scenario-level acceptance lists." The rubric owns `data-wp-text`,
`data-wp-bind`/`data-wp-class`/`data-wp-style`, the `data-wp-on*` family + "no manual
`addEventListener`", `data-wp-interactive`/`store()` namespace match,
`wp_interactivity_state()`/`wp_interactivity_data_wp_context()` seeding, local-context-vs-
global-state preference, no-flash SSR, `data-wp-each` template/server-hydration, and the
generator/`yield`/`withSyncEvent` async form.

The reworked pair (`joke-fetch`, `side-drawer`) was correctly cleaned to scenario-specific,
mechanism-free acceptance — demonstrating the required discipline. But the other seven
migrated scenarios kept their pre-curation acceptance lists, which name directives directly
and restate rubric-owned points wholesale. Each must be rewritten to contain only the
behavior and the distinct concept unique to that scenario, with no directive/store/server-API
names and no rubric-owned restatement (mirroring what was done for `joke-fetch` /
`side-drawer`).

**Where:**

- `eval/scenarios/state-and-context/independent-counters/scenario.yaml:16-21` — names
  `data-wp-context`, `wp_interactivity_data_wp_context()`, `wp_interactivity_state()`,
  `getContext()`, `data-wp-on--click`, `data-wp-text`; restates per-instance seeding and the
  local-vs-global rule (all rubric-owned).
- `eval/scenarios/state-and-context/shared-state-tally/scenario.yaml:15-20` — names
  `wp_interactivity_state()`, `data-wp-context`, `data-wp-interactive`, `store()`,
  `data-wp-text`, `data-wp-on--click`; restates namespace-match, server seeding, and
  local-vs-global (all rubric-owned).
- `eval/scenarios/derived-state/derived-double/scenario.yaml:19-23` — names
  `wp_interactivity_state()`, `data-wp-on--click`; restates the "single property/getter
  reference, not inline arithmetic" rule (rubric line 32) and no-flash SSR.
- `eval/scenarios/server-rendering/config-rest-nonce/scenario.yaml:32-34` — names
  `data-wp-on--click`, `data-wp-text`; restates the generator-`yield` async form and no-flash
  SSR (rubric lines 36, 18). (See also Issue 2 for the deprecated-directive clause on line 32.)
- `eval/scenarios/lists/fruit-list-with-add/scenario.yaml:16-21` — names `data-wp-each`,
  `data-wp-text`, `data-wp-on--click`; restates seeding, the `data-wp-each` template/
  server-hydration pattern, and "no manual `addEventListener`" (all rubric-owned).
- `eval/scenarios/state-and-context/independent-counters/scenario.yaml` and
  `.../shared-state-tally/scenario.yaml` further restate "server-rendered HTML seeds the
  initial value … before hydration" (rubric line 18).
- `eval/scenarios/foundations/minimal-scaffold/scenario.yaml:18-19` — acceptance names
  `store(...)`, `data-wp-on--*`, `data-wp-watch`, and `data-wp-init` directly. The
  scenario's unique point (an init callback that runs once per instance) should be expressed
  without naming these mechanisms.

**Expected:** For each of these seven scenarios, rewrite `acceptance` to contain only
scenario-distinct criteria phrased without naming any iAPI directive, store API, or server
helper, dropping every item the shared rubric already owns — exactly as `joke-fetch` and
`side-drawer` were cleaned in this same task.

### Issue 2: `config-rest-nonce` re-endorses the deprecated `data-wp-on-async--<event>` directive

**Task:** Task 4: Migrate the 9 existing scenarios; delete the 2 non-curated + the index

**What's wrong:** Task 1 deliberately removed `data-wp-on-async--<event>` from the rubric
(Spec Requirement 11 / Acceptance Criterion 8) so that an `on-async` answer is not graded as
correct. This migrated scenario's acceptance explicitly offers `data-wp-on-async--click` as an
acceptable wiring, directly re-endorsing the deprecated directive the run just removed —
contradicting AC8 at the scenario level and re-introducing the exact grading gap the rubric
edit closed.

**Where:** `eval/scenarios/server-rendering/config-rest-nonce/scenario.yaml:32` — `'The
"Load post" button is wired with `data-wp-on--click` (or `data-wp-on-async--click`) …'`

**Expected:** Remove the `data-wp-on-async--click` alternative (and, per Issue 1, the whole
rubric-owned wiring restatement); acceptance should keep only the config/REST-nonce-specific
criteria (config seeded via `wp_interactivity_config()` semantics expressed in user terms,
the `X-WP-Nonce` header behavior, reading from config rather than recomputing).

### Issue 3: Two `derived-state` specs assert generic presence instead of the scenario's distinctive derived behavior

**Task:** Task 8: Author `derived-state` group (4 new scenarios)

**What's wrong:** Acceptance Criterion 6 requires each `e2e.spec.mjs` to assert the
scenario's intended user-facing behavior. In these two specs a test's title states it
verifies the scenario's distinctive derived-state outcome, but the assertion only checks that
an element is non-empty / that rows exist — it never verifies the derived computation or the
per-row server-derived state that is the entire point of the scenario. As written these tests
would pass against an implementation that does not actually compute the derived value
correctly, so they do not assert the scenario's behavior.

**Where:**

- `eval/scenarios/derived-state/price-with-vat/e2e.spec.mjs:71-86` — test "each card's
  displayed VAT total matches base price × 1.20" only asserts the VAT `[data-wp-text]`
  element is non-empty; it never reads the base price or checks the ×1.20 relationship.
- `eval/scenarios/derived-state/shopping-list-server-derived/e2e.spec.mjs:31-75` — both SSR
  tests build an `inCartIcons` locator (line 48) but never assert on it; the "in-cart icon
  present on first paint for in-cart items, absent otherwise" criterion is not asserted — the
  tests fall back to asserting only that rows exist / the HTML is non-empty.

**Expected:** Make each test assert the scenario's distinctive behavior: in `price-with-vat`,
extract the base price and the VAT total from each card and assert the total equals
base × 1.20; in `shopping-list-server-derived`, assert the in-cart icon is present for the
seeded in-cart row(s) and absent for the not-in-cart row(s) in the raw server HTML (the
`inCartIcons` locator is already there — assert a non-zero count for in-cart rows and zero for
out-of-cart rows).
