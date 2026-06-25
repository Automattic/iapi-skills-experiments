# Intent: Complete iAPI eval scenario set + folder organization

> Source: GitHub issue [Automattic/wordpress-skill-experiments#39](https://github.com/Automattic/wordpress-skill-experiments/issues/39) (mirrored in Linear as BILLOW-104).
> This file is self-contained; agents do not need to open the source issue.

## Goal

Implement a curated, de-duplicated set of Interactivity-API (iAPI) eval scenarios — each authored in the Skillsmith format (a `scenario.yaml` plus an `e2e.spec.mjs` end-to-end test wherever feasible) — that together cover the full iAPI surface with no overlap, organized into the curated capability-based folder taxonomy. The set drives how the Interactivity API reference in the `wordpress-development` skill evolves: every concept in the API maps to at least one scenario, and running the Skillsmith suite surfaces where the reference falls short.

## Constraints

- **The curated taxonomy and scenario set are settled scope.** The 12-folder taxonomy and the full scenario set (see the linked proposal) are already curated; this run implements them as specified. It is not a re-curation — folders and scenarios are not reopened.
- **Skillsmith format is authoritative, tracking Skillsmith trunk.** Scenarios follow Skillsmith's scenario schema. The project's `@automattic/skillsmith` dependency must be updated to track **Skillsmith trunk** (currently pinned to an older commit; trunk already supports nested scenario folders and folder filtering).
- **Nested folder layout.** Scenarios live at `eval/scenarios/<group>/<scenario>/`. Existing scenarios move into the taxonomy (e.g. via `git mv`).
- **Prompts read as real human feature requests.** Each prompt describes the outcome a user wants, phrased the way a non-expert would. Prompts must never name directives, APIs, or otherwise guide the implementation.
- **iAPI-specific only.** Every scenario exercises the Interactivity API (`data-wp-*` directives, the `@wordpress/interactivity` store, `wp_interactivity_*` server helpers, or the client-side router).
- **Acceptance criteria stay scenario-specific.** A scenario's acceptance list contains only what is unique to it; generic wiring/reactivity expectations live in the shared `wp-interactivity-api-best-practices` rubric and are not duplicated per scenario. Avoid changing the rubric unless a genuine coverage gap is found.
- **Drop deprecated `data-wp-on-async`.** Exclude it from the set and remove it from the best-practices rubric so an `on-async` answer isn't graded correct.
- **End-to-end coverage is a priority.** Include e2e tests for as many scenarios as feasible; the e2e harness/setup may be modified where necessary to make a scenario testable (a few scenarios may need extended harness capability — e.g. an analytics sink, an adversarial `store()` probe, multi-block fixtures).

## Context

- The existing ~11 scenarios under `eval/scenarios/` were an initial workflow-exercising set, not real coverage; they fold into the new taxonomy.
- Builds on the Skillsmith integration from issue #34: the project consumes `@automattic/skillsmith`, scaffolds a WordPress plugin per testing agent (`eval/utils/scaffold-plugin.ts`), and runs e2e specs against a real `wp-env` runtime via the `afterAllScenarios` hook (`eval/utils/verify-e2e.ts`, `playwright.config.ts`). `verify-e2e.ts` needs a small change so the nested `<group>/<scenario>/` path is used for spec lookup while failure attribution stays keyed on the scenario dir.
- The shared rubric lives at `eval/rubrics/wp-interactivity-api-best-practices.md`.
- Per-run policy: agents must never run the full Skillsmith scenarios × agents matrix (capped at one scenario × one agent). Running the full matrix and "improving the reference until all scenarios pass" is the owner's manual step, downstream of this work.

## Curated scenario set

Organized by capability into 12 folders, one level deep — the tree doubles as a coverage map:

`foundations` · `reactive-bindings` · `state-and-context` · `derived-state` · `server-rendering` · `events` · `async-actions` · `lifecycle` · `lists` · `client-navigation` · `typescript` · `ux-patterns`

The full curated set — every scenario with a brief description of its user-facing behavior and the iAPI concept it exercises — is in [`proposal.md`](./proposal.md) (a verbatim copy of issue #39, committed alongside this intent). That is the authoritative list of scenarios to implement.
