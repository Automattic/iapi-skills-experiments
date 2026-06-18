# Design Doc Review

## Verdict: approved

## Summary

The revised design doc fully resolves the single rejection issue from iteration 1. The `rubrics: []` requirement is now unambiguously stated in three places — the `scenario.yaml` schema example (Interfaces and Data Flow), the File Layout section, and the Key Decisions "Add zero new shared rubrics" section — and is backed by a precise technical explanation of why `Array.isArray([])` is the only form that passes Skillsmith's `isScenarioShape` validator. Beyond the fix, the design is sound across every dimension reviewed: Skillsmith mechanics (flat discovery, plugin slug derivation, `verify-e2e.ts` spec path resolution) are accurately described and verified against the real codebase; the four e2e plans are feasible with proven harness capabilities; the CPT identifier (`books`) and REST route (`/wp-json/myplugin/v1/hello`) are pinned in the prompts to eliminate assertion drift; all prompts are user-voiced and tool-agnostic; the zero-rubrics decision is well-justified against the rubric/acceptance separation requirement; all 12 spec requirements and 9 acceptance criteria are covered; and the skill remains untouched. No inconsistencies were introduced by the revision.

## Non-blocking notes

- The `e2e.spec.mjs` interface pseudocode in the doc calls `deactivateAllPlugins()` without `await`, which matches exactly how the existing specs call it (the function is synchronous — it wraps `execFileSync`). Phase 4 implementers should not add `await` here; the existing pattern is intentional and correct.
- The doc notes that `scenario.name` need not equal the directory name, and states this batch sets them equal for clarity. Phase 4 must keep them in sync, as the Risks section already flags. This is not a defect — it is a correctly identified implementation constraint.
