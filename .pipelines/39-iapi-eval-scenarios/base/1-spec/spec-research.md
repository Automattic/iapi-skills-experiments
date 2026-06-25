# Spec Research: Complete iAPI eval scenario set + folder organization

> Intent copied verbatim below (from `base/0-intent/intent.md`). The authoritative
> list of scenarios to implement is `base/0-intent/proposal.md`.

## Intent

### Goal

Implement a curated, de-duplicated set of Interactivity-API (iAPI) eval scenarios — each authored in the Skillsmith format (a `scenario.yaml` plus an `e2e.spec.mjs` end-to-end test wherever feasible) — that together cover the full iAPI surface with no overlap, organized into the curated capability-based folder taxonomy. The set drives how the Interactivity API reference in the `wordpress-development` skill evolves: every concept in the API maps to at least one scenario, and running the Skillsmith suite surfaces where the reference falls short.

### Constraints

- The curated taxonomy and scenario set are settled scope (not reopened).
- Skillsmith format is authoritative, tracking Skillsmith trunk (bump `@automattic/skillsmith` to trunk; trunk already supports nested scenario folders + folder filtering).
- Nested folder layout: `eval/scenarios/<group>/<scenario>/`; existing scenarios move in.
- Prompts read as real human feature requests; never name directives/APIs or guide implementation.
- iAPI-specific only.
- Acceptance criteria stay scenario-specific; generic wiring/reactivity lives in the shared `wp-interactivity-api-best-practices` rubric. Avoid rubric changes unless a genuine gap is found.
- Drop deprecated `data-wp-on-async` from the set and the rubric.
- e2e coverage for as many scenarios as feasible; harness/setup may be modified (some scenarios may need extended harness capability — analytics sink, adversarial `store()` probe, multi-block fixtures).

### Context

- Existing ~11 scenarios were an initial workflow-exercising set; they fold into the new taxonomy.
- Builds on the Skillsmith integration from issue #34 (`scaffold-plugin.ts`, `verify-e2e.ts` `afterAllScenarios` hook, `playwright.config.ts`). `verify-e2e.ts` needs a small change for nested spec lookup while keeping failure attribution keyed on the scenario dir.
- Shared rubric: `eval/rubrics/wp-interactivity-api-best-practices.md`.
- Per-run policy: agents never run the full matrix (one scenario × one agent cap). Improving the reference until all scenarios pass is the owner's manual downstream step.

## Q&A

### Q1 — Verification bar / e2e scope

The proposal tags scenarios by how they'd be verified. Most have a clean behavioral Playwright signal, but a handful don't: some need new harness capability (an analytics sink the action writes to, an adversarial `store()` probe, multi-block fixtures), and a few are essentially source/rubric-only (the TypeScript typing scenarios, the locked private store). The intent says "e2e for as many scenarios as feasible" and allows modifying the harness.

What is the verification bar for this run — i.e., what makes a scenario "done"?

**A1:** Add e2e tests for every scenario unless an e2e test genuinely doesn't make sense (no meaningful runtime signal to assert). Do **not** let harness capability be the limiting factor — build whatever the test needs (analytics sink, adversarial `store()` probe, multi-block fixtures, etc.). The only reason to skip an e2e is that a runtime test wouldn't meaningfully verify the scenario's point.

### Q2 — Disposition of the existing scenarios

The 11 existing flat scenarios mostly correspond to a curated scenario (often under a refined name), but one (`counter`) has no curated counterpart — the proposal treats a plain numeric counter as an assumed baseline, not a curated scenario.

Mapping (existing → curated):
- `minimal-scaffold` → minimal-scaffold (same)
- `independent-counters` → independent-counters (same)
- `shared-state` → shared state tally
- `derived-double` → derived double (same)
- `fruit-list-each` → fruit list with add
- `config-fetch` → config REST fetch with nonce
- `async-fetch` → joke of the day fetch (async generator)
- `paginated-list` → paginated posts router region
- `toggle-visibility` → accessible disclosure toggle
- `focus-trap-menu` → side drawer with focus trap (or another ux-pattern)
- `counter` → **no curated counterpart**

Should the final `eval/scenarios/` contain **exactly** the curated set (nested), with non-corresponding leftovers like `counter` removed and corresponding ones migrated/updated to the curated definition? Or keep extra baseline scenarios around?

**A2:** Follow the proposal's structure and scenario set exactly. The end state of `eval/scenarios/` is precisely the 12 folders and the scenarios the proposal defines, in the nested layout. Existing scenarios may be removed, updated in place, or used as inspiration — but the result must be exactly the proposal's set, so a leftover with no curated counterpart (e.g. `counter`) is removed. Per-scenario committed structure stays `scenario.yaml` + `e2e.spec.mjs` (the proposal's "one each").

### Q3 — How confident must we be that each e2e spec actually passes?

The committed deliverable per scenario is only `scenario.yaml` + `e2e.spec.mjs` (no reference implementation — matching the existing convention and the proposal). But an `e2e.spec.mjs` is only trustworthy if it has been run against a correct implementation of the scenario and seen to pass. The repo has no committed reference implementations, and during normal Skillsmith runs the specs run against agent-produced code (the owner's manual matrix step).

What's the quality bar for "the e2e spec is done"?
- **Executed-green:** for each scenario, build a known-good reference implementation, run the spec against it until green (then discard the implementation — only `scenario.yaml` + `e2e.spec.mjs` are committed), so every committed spec is proven runnable and correct.
- **Authored + reviewed:** specs are written and reviewed for correctness but not necessarily executed in this run.
- Something in between (e.g. executed-green for a sample / the tricky ones, reviewed for the rest).

**A3:** Authored + reviewed. The e2e specs are written and reviewed for correctness but **not executed** in this run. Treat it like TDD: we are defining the tests first. Actually running them green happens later, while evaluating and improving the skill (the owner's downstream phase). Implication: building reference implementations and running specs to green is out of scope here; harness extensions a spec depends on are still authored so the spec is coherent and reviewable, but nothing is executed against a live runtime in this run.

## Research

### Existing scenario directories (flat, pre-migration)

`eval/scenarios/`: async-fetch, config-fetch, counter, derived-double, focus-trap-menu, fruit-list-each, independent-counters, minimal-scaffold, paginated-list, shared-state, toggle-visibility. Each contains only `scenario.yaml` + `e2e.spec.mjs` (no committed reference implementation). Source: `ls eval/scenarios/`.

## Out of Scope

Confirmed with the owner (Q&A wrap-up):

1. Improving the `wordpress-development` iAPI reference so scenarios pass — the later eval/improve phase.
2. Running the full Skillsmith `scenarios × agents` matrix — owner's manual step (agents capped at one scenario × one agent).
3. Executing e2e specs to green / building reference implementations — deferred to the later eval phase (TDD-first; see A3).
4. Changes to Skillsmith's own source — only the dependency is bumped to trunk; nested-folder + folder-filtering support already exists upstream.
5. Rubric changes beyond dropping `data-wp-on-async` — made only if a genuine coverage gap is found while authoring.
6. Re-curating the scenario set or taxonomy — settled by the proposal.
7. CI/automation changes to run e2e automatically — not part of this run (specs aren't executed here).

## Consolidated Requirements

1. The final `eval/scenarios/` contains **exactly** the proposal's curated scenario set, organized into the 12 capability folders, nested as `eval/scenarios/<group>/<scenario>/`. Existing flat scenarios are removed, migrated, or used as inspiration so the end state matches the proposal exactly (e.g. `counter`, with no curated counterpart, is removed).
2. Each scenario directory contains a `scenario.yaml` following Skillsmith's schema (`name`, `description`, `skills: [wordpress-development]`, `prompt`, `acceptance`, `rubrics: [wp-interactivity-api-best-practices]`) and, where a runtime test is meaningful, an `e2e.spec.mjs`.
3. Each prompt is a realistic, outcome-focused human feature request; it never names iAPI directives/APIs or prescribes implementation.
4. Each scenario's `acceptance` list contains only criteria unique to that scenario; generic iAPI wiring/reactivity stays in the shared rubric (not duplicated per scenario).
5. Every scenario gets an `e2e.spec.mjs` unless a runtime test fundamentally doesn't make sense for it; harness capability is built as needed (analytics sink, adversarial `store()` probe, multi-block fixtures, etc.) rather than capping coverage.
6. e2e specs are authored + reviewed for correctness, **not executed** in this run (TDD-first), and follow the established e2e conventions (fixed `wp-skill/testing-block` block name, per-(scenario, agent) plugin activation, `deactivateAllPlugins`, etc.).
7. The `@automattic/skillsmith` dependency is updated to track Skillsmith trunk (which supports nested scenario folders + folder filtering).
8. `eval/utils/verify-e2e.ts` is updated so the nested `<group>/<scenario>/e2e.spec.mjs` path is used for spec lookup while failure attribution stays keyed on the scenario directory.
9. The `wp-interactivity-api-best-practices` rubric drops `data-wp-on-async` so an `on-async` answer is not graded correct; no other rubric changes unless a genuine coverage gap is found while authoring.
10. The nested layout works end-to-end with the existing tooling: Skillsmith discovers `eval/scenarios/*/*/scenario.yaml`, Playwright discovers the nested specs (already recursive), and the plugin scaffolding is unaffected.
