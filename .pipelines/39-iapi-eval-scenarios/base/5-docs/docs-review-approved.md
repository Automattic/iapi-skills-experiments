# Docs Review

## Verdict: approved

## Batch scope

Tasks reviewed (the entire docs plan, diffed `81a5dbe` → HEAD):

- **Task 1** — Add the scenario-set contributor guide (new `eval/scenarios/README.md`): orientation, taxonomy, per-directory contents, test-first banner, cross-links.
- **Task 2** — Document the per-scenario authoring conventions (extends the guide): `scenario.yaml` fields, prompt convention, `acceptance` vs. rubric, e2e conventions, the three documented exceptions.
- **Task 3** — Document how to add a new scenario (extends the guide): the ordered walkthrough, single-scenario local run, agent cap, every-scenario-has-an-e2e rule, test-first posture.
- **Task 4** — Realign the root `README.md` to the nested `<group>/<scenario>` layout: single-scenario addressing, folder filtering, report-location keying, link to the new guide, agent cap.

## Summary

The batch is accurate, complete, and faithful to the shipped code and the approved spec/design rationale. Both documentation surfaces named by the docs plan — the root `README.md` and the new `eval/scenarios/README.md` — were updated, and no other doc surface was touched (the one-line `eval/rubrics/...` change is part of the phase-4 code diff, not a docs-writer surface). Every per-task Acceptance criterion is met. I spot-checked at least one concrete claim per task against the shipped code and tooling: the nested tree (12 groups / 68 leaves), the `addLockProbe` helper and its import depth, the segment-aware folder-filter behavior in the pinned Skillsmith trunk source, and the report-location keying on `scenario.name`. All verify. The load-bearing test-first posture is correctly and prominently asserted in all three required places, no doc claims a green/passing suite or golden/reference implementation, and the agent-cap "at most one scenario" guidance is accurate for the nested layout. No issues found.

## Checks

This project defines **no guardrails convention** — there are no deterministic gates to run. (The docs plan's "Guardrail scopes" section records `None`.) Per the workflow, the step-3 accuracy spot-check below is the verification evidence for this review.

| Check | Command | Result |
| ----- | ------- | ------ |
| (no guardrails convention defined) | — | n/a — no gates exist |

## Accuracy spot-check

Each claim below was verified by inspecting the shipped code/tooling (not by running the eval matrix or standing up wp-env, per the project constraint).

**Task 1 — taxonomy (12 groups / 68 leaves) and leaf-only `scenario.yaml`.**
`find eval/scenarios -maxdepth 1 -mindepth 1 -type d` → 12 group directories matching the enumerated list (`foundations` … `ux-patterns`). `find eval/scenarios -name scenario.yaml | wc -l` → 68. No `scenario.yaml` exists at `eval/scenarios/*/scenario.yaml` (top level) — confirming the "leaf only, never at the group level" rule. The 12-group capability descriptions were each checked against their shipped scenario directories (e.g. `client-navigation` lists `prefetch-on-hover`, `external-link-respect`, `filter-bar-replace-history`, `resilient-link-fallback`; `typescript` lists `ts-typed-context-import`; `ux-patterns` lists tabs/accordion/modal/lightbox/`side-drawer`/`expandable-search`) — every description maps to scenarios that actually ship, with no per-group counts that could drift.

**Task 2 — three-level-up helper import path, multi-instance pattern, and the documented exceptions.**
`eval/scenarios/state-and-context/locked-private-store/e2e.spec.mjs` imports `addLockProbe` from `../../../utils/e2e-helpers.mjs` and `deactivateAllPlugins` from `../../../utils/wp-cli.mjs` — exactly the three-level-up path the guide documents. `eval/utils/e2e-helpers.mjs` exports a single helper `addLockProbe(page, namespace)` matching the guide's description (injects a `type: "module"` script, probes the lock, asserts `window.__lockResult` is defined). `state-and-context/cart-count-cross-block/e2e.spec.mjs` embeds `<!-- wp:wp-skill/testing-block /-->\n<!-- wp:wp-skill/testing-block /-->` and reads instances via `.nth(0)`/`.nth(1)` — matching the cited multi-instance example. `foundations/classic-theme-banner/e2e.spec.mjs` uses no testing-block and locates the banner via `page.locator("[data-wp-interactive]")` — matching the documented sole block-name exception. `state-and-context/pageview-analytics-bridge/e2e.spec.mjs` installs `window.__analyticsTracker` via `page.addInitScript` before navigation and asserts on `window.__analyticsEvents` — matching the documented inline-analytics exception. The cited prompt/acceptance quotes verify verbatim: `foundations/minimal-scaffold` ("once the runtime has picked the block up … just once per block instance, not every time the script file loads"), `typescript/ts-counter-inference` and `state-and-context/locked-private-store` (technical asks phrased as user constraints), and `derived-state/price-with-vat` acceptance ("is exposed as a derived getter on the store … never written by an action"). The rubric quote ("should not be duplicated in scenario-level acceptance lists") matches `eval/rubrics/wp-interactivity-api-best-practices.md` line 3.

**Task 3 — agent cap, nested single-scenario addressing, every-scenario-has-an-e2e.**
The walkthrough addresses a single scenario by its nested `<group>/<scenario>` path (e.g. `foundations/minimal-scaffold`) and defers the canonical run command to the root README — consistent with the shipped Skillsmith selection behavior (`selection.ts` `matchesScenarioFilter` matches a full id or a folder prefix). The "every scenario ships an e2e, none omits it" rule holds against the tree: every one of the 68 leaf directories contains both `scenario.yaml` and `e2e.spec.mjs`. The test-first NOTE is present in this section (guide line ~357).

**Task 4 — folder filtering, report-location keying, and removal of stale flat references.**
Folder filtering: `node_modules/@automattic/skillsmith/src/scenarios/selection.ts` `matchesScenarioFilter(filter, id)` returns `id === filter || id.startsWith(`${filter}/`)` — segment-aware, so `foundations` selects `foundations/minimal-scaffold` but not a differently named group, exactly as the README states; unknown filters throw a `UserFacingError` listing available ids (`selectScenariosByNormalizedFilters`), matching "an unknown filter fails the run with the list of available scenarios." Report location: `src/pipeline/pipeline.ts:485` `const scenarioDirectory = resolve(args.iterationDirectory, scenario.name)` keys the scenario output directory on the bare `scenario.name`, not the nested `dirName` — confirming the README's claim that `iteration-N/<scenario>/...` uses the bare leaf name; `src/reports/scenario-report.ts` writes `<scenario>/<agent>/report.json` and `<scenario>/report.json`, and `verify-e2e.ts:97` writes `tests-report.json` at the iteration root — all matching the README's "Report location" bullets. Run base is `./.skillsmith/<runId>` (`config/defaults.ts`). Stale references: `grep` for `counter`, `async-fetch`, "flat", and "bare directory" in the root README returns nothing; the deleted scenario directories (`counter`, `async-fetch`, `toggle-visibility`, `_candidates.yaml`) are gone from the tree.

**Cross-links (both docs).** All relative links resolve to existing files: the root README ↔ guide back/forward links, the guide → rubric, → `eval/utils/e2e-helpers.mjs`, → `eval/utils/wp-cli.mjs`, and the in-page anchors to the authoring-conventions and add-a-scenario sections.

**Test-first / no-green guardrail.** The mandatory test-first note appears in all three required places (Task 1 top banner, Task 2 authoring-conventions NOTE, Task 3 add-a-scenario NOTE). No statement in either doc claims a passing/green suite, golden/reference implementations, or that the reference already makes the scenarios pass; the only grep hits for "passing"/"not an agent task" are negations.

## Issues

None.
