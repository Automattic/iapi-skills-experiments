# Code Plan Review

## Verdict: approved

## Summary

The prior rejection's sole issue — Task 7 title and Goal claiming "8 new scenarios" while
the task body specified 7 — is fully resolved. Task 7 now reads "Author `state-and-context`
group (7 new scenarios)" and "Author the 7 net-new `state-and-context` scenarios" throughout,
consistent with the 7-file list, the mapping table, and the acceptance criterion.

The full adversarial re-review finds no remaining issues. Scenario coverage is exact: the
mapping table contains 68 rows, verified at 9 migrate and 59 new, matching both the design
doc's table and the design doc's stated totals. The authoring task arithmetic checks out
independently (Tasks 5-16: 2+5+7+4+2+6+4+6+3+11+4+5 = 59 new). The 9 migration sources
each map to a codebase-existing flat directory (confirmed: `minimal-scaffold`,
`independent-counters`, `derived-double`, `shared-state`, `config-fetch`, `fruit-list-each`,
`paginated-list`, `async-fetch`, `focus-trap-menu` all exist in `eval/scenarios/`). The
3 deletions (`counter`, `toggle-visibility`, `_candidates.yaml`) also exist.

Task ordering is sound: Tasks 1 and 2 are independent and may run in parallel; Task 4 is
correctly gated on Task 1 (needs the bumped Skillsmith and the `scenarioDirOf` patch);
Tasks 5-16 are gated on Task 4 with Task 7 additionally gated on Task 2 (because
`locked-private-store` imports `addLockProbe` from `e2e-helpers.mjs`). No cycles or missing
prerequisites exist.

The three special cases are correctly handled: `classic-theme-banner` off-convention scoping
is specified in Task 5, the exception is recorded in the scenario's `acceptance`, and the
e2e locates the banner by `data-wp-interactive` / class. `locked-private-store` correctly
imports `addLockProbe` from `../../../utils/e2e-helpers.mjs` and calls it post-navigation.
`pageview-analytics-bridge` uses the inline `page.addInitScript` analytics stub (no shared
helper), consistent with the design doc decision.

Writer-type assignments are correct: Tasks 1 and 2 are `tdd` (Task 1 patches
`scenarioDirOf()` which has unit-testable behavior; Task 2 creates `addLockProbe` with
testable behavior); Tasks 4-16 are `e2e` (scenario authoring has no unit-testable surface
beyond the authored specs themselves). The rubric currently contains `data-wp-on-async--<event>`
and Task 1 correctly targets its removal. `e2e-helpers.mjs` does not exist yet — Task 2
creates it. Per-task acceptance criteria are observable, specific, and traceable; no task
prescribes which unit tests to write; no task produces documentation. Scope is contained
strictly to the spec and design.
