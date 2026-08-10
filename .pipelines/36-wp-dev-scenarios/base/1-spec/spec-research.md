# Spec Research: Initial simple WordPress development scenarios

> Source: GitHub issue [Automattic/wordpress-skill-experiments#36](https://github.com/Automattic/wordpress-skill-experiments/issues/36).
> This file is self-contained; agents do not need to open the source issue.

## Goal

The `wordpress-development` eval suite covers more than the Interactivity API. It includes an initial set of **simple** scenarios drawn from the official WordPress developer documentation (developer.wordpress.org and its sublinks), so the skill can be evaluated across a broader range of WordPress development tasks. Cross-cutting best practices that are shared across scenarios are captured in **simple, general rubrics** rather than repeated in each scenario's own success criteria.

## Constraints (from intent)

- Scope this first batch to **simple** scenarios only; more complex scenarios are deliberately left for later, separate work.
- **Scenario prompts must stay simple and read like a real user's request** — phrased by outcome/intent, not by implementation. They must **not** name the specific tool, API, or technology to use; choosing the right approach is the skill's job.
- Do **not** change the skill itself (`skills/wordpress-development/`) in this work. Only scenarios and rubrics are added/changed here.
- Scenarios must be grounded in the official WordPress developer documentation at developer.wordpress.org and its sublinks.
- Any shared rubrics added must stay **simple** and contain only general, cross-cutting checks. A scenario's success criteria must not restate anything its rubrics already cover, and rubrics must not absorb scenario-specific criteria.

## Context (from intent)

- Today every scenario under `eval/scenarios/` targets the Interactivity API, and the only rubric is `wp-interactivity-api-best-practices.md`.
- Scenarios are authored for and tested with **Skillsmith** (https://github.com/Automattic/skillsmith); new scenarios and rubrics must fit its scenario format and conventions.
- This issue intentionally stops at scenarios (and shared rubrics). Expanding the skill is follow-up work — the scenarios lead, the skill catches up later.
- Primary source: https://developer.wordpress.org/ and its sublinks.

## Assumptions / directions to explore (from intent, open)

- Organizing scenarios into per-topic folders is worth exploring — the exact structure is open.
- The existing Interactivity API scenarios may be reorganized into that topic structure; whether to move them is left to the pipeline.
- Topic selection for the first batch is intentionally left open.
- Plausible cross-cutting rubric themes: WordPress coding standards, security (escaping/sanitization/nonces), i18n. Which rubrics, if any, are warranted is open.

## Q&A

### Q1 — Target size/shape of the initial batch
The intent deliberately leaves the number of scenarios and the topic spread open. To write testable acceptance criteria, the spec needs a target for what "an initial set" means. Roughly how big should this first batch be, and how concrete should the spec be about it?

**A1:** Criteria-based — the spec defines selection criteria (simple, doc-driven, ~1–2 per chosen area) and a rough floor, but leaves the exact count and the specific scenario picks to the later design/plan phases.

### Q2 — Verification standard for new scenarios
Skillsmith grades each scenario with an LLM judge (against the scenario's `acceptance` list plus any referenced `rubrics`) and *additionally* runs a Playwright e2e spec when the scenario directory contains an `e2e.spec.mjs`. Per `eval/utils/verify-e2e.ts`, that e2e spec is **optional per scenario** — scenarios without one are judge-graded only, with no runtime check. What verification standard should this initial batch require?

**A2:** e2e where practical, judge-only allowed. Require an e2e spec for scenarios where a real-runtime check is feasible; allow judge-only scenarios (acceptance + rubric graded, no e2e) where e2e would be impractical for a simple case.

### Q3 — What "done"/success means, given the skill isn't changed yet
The skill documents only the Interactivity API today, and the intent says scenarios lead while the skill catches up later (skill untouched here). New non-IAPI scenarios may therefore fail against the *current* skill. Also, per project conventions, agents never run the full eval matrix (owner's manual step). So what is the completion bar for a scenario in this batch?

**A3:** Well-formed & runnable; passing today's skill is NOT a criterion. A scenario is done when it is doc-grounded, follows the Skillsmith scenario schema, has sound `acceptance`/`rubrics` (+ optional e2e per A2), and executes without harness errors. The scenarios define targets for the skill's future expansion.

### Q4 — Interactivity API: in or out for this batch?
The goal is to broaden coverage *beyond* the Interactivity API, which is already covered by the existing scenarios. Should this initial batch focus on new, non-IAPI topic areas, or may it also include more Interactivity API scenarios?

**A4:** New areas only — exclude additional Interactivity API scenarios from this batch.

### Q5 — Calibrating "simple"
Since the spec is criteria-based, "simple" is the key bar. Where should it sit, using the existing `counter` / `toggle-visibility` / `minimal-scaffold` scenarios as anchors?

**A5:** One concept, one small feature — a single focused task exercising one concept in one plugin, with a handful of acceptance points (on par with counter/toggle-visibility). Anything multi-feature or multi-step is too complex for this batch.

### Q6 — Confirm out-of-scope (step 4)
Consolidated exclusions surfaced during Q&A, presented for confirmation.

**A6:** Confirmed complete — the seven exclusions below are correct.

## Research

- **Skillsmith verification model** (`skillsmith.config.ts`, `eval/utils/verify-e2e.ts`): each scenario is graded by an LLM judge against its `acceptance` list and any referenced `rubrics`. Separately, an `afterAllScenarios` hook boots a `wp-env` instance and runs Playwright e2e specs. `verify-e2e.ts` builds the path `eval/scenarios/<dir>/e2e.spec.mjs` and **filters to specs that exist**, returning early when none do — so `e2e.spec.mjs` is **optional per scenario**; a scenario lacking one is judge-only with no runtime failure.
- The e2e build step runs `wp-scripts build` only for plugins containing `src/blocks`; non-block plugins skip the build. So plain-PHP scenarios (e.g. CPT / shortcode / REST endpoint) could still ship an e2e spec that activates the plugin and asserts behavior, or skip e2e entirely.
- **Existing scenario shape** (`eval/scenarios/counter/scenario.yaml`): keys are `name`, `description`, `skills: [wordpress-development]`, `prompt`, `acceptance: [...]`, `rubrics: [...]`. e2e specs use `@wordpress/e2e-test-utils-playwright`, activate `plugin-<name>-<agentId>`, create a post, and assert DOM behavior.
- **Rubric precedent** (`eval/rubrics/wp-interactivity-api-best-practices.md`): a markdown file of general best-practice checks that "apply to every Interactivity API scenario and should not be duplicated in scenario-level acceptance lists." Referenced from a scenario via the `rubrics:` key by filename stem.

## Out of Scope

_(Confirmed complete by owner in Q6.)_

1. **Complex or multi-step scenarios** — anything beyond "one concept, one small feature" (A5). Deferred to later batches.
2. **Additional Interactivity API scenarios** — already covered by the existing suite (A4).
3. **Any change to the skill itself** (`skills/wordpress-development/`) — scenarios and rubrics only; expanding the skill to document the new topics is separate follow-up work.
4. **Requiring scenarios to pass against the current skill, and running the full `scenarios × testing-agents` eval matrix** — well-formedness/runnability is the bar (A3); full-matrix runs remain the owner's manual step.
5. **Finalizing a folder taxonomy or reorganizing the existing Interactivity API scenarios** — topic grouping is a design-phase decision; moving the existing scenarios is optional and not a required deliverable here.
6. **Scenarios grounded in non-official sources** — content must derive from developer.wordpress.org and its sublinks.
7. **CI / GitHub Actions / build-tooling changes** — not part of this batch unless strictly required to register a new scenario.

## Consolidated Requirements

1. Add an initial set of **new eval scenarios** that broaden the `wordpress-development` suite **beyond the Interactivity API**, grounded in the official WordPress developer documentation (developer.wordpress.org and its sublinks).
2. Selection is **criteria-based**: scenarios are simple ("one concept, one small feature"), doc-driven, target **non-IAPI** topic areas, ~1–2 per chosen area. The exact count and the specific topic/scenario picks are chosen in the later design/plan phases — not fixed in the spec. Rough floor: enough scenarios across **more than one** new topic area to demonstrably broaden the suite.
3. Each scenario conforms to the existing Skillsmith scenario schema at `eval/scenarios/<dir>/scenario.yaml`: `name`, `description`, `skills: [wordpress-development]`, `prompt`, `acceptance`, optional `rubrics`.
4. Scenario **prompts are written in the user's voice** — simple, outcome/intent-oriented — and must **not** name the tool/API/technology to use; the skill decides the approach.
5. **Verification is mixed**: provide a Playwright `e2e.spec.mjs` for scenarios where a real-runtime check is feasible; **judge-only** (acceptance + rubric) is acceptable where e2e is impractical for a simple case.
6. A scenario is **done** when it is well-formed, doc-grounded, schema-conformant, has sound acceptance criteria (plus rubrics/e2e as applicable), and **executes in Skillsmith without harness errors**. Passing against the current skill is **not** required.
7. **Shared rubrics** are in scope: add simple, general rubrics for genuinely cross-cutting best practices, but only where a check is shared across multiple scenarios in the batch; keep them simple. Acceptance lists must not restate rubric checks, and rubrics must not absorb scenario-specific criteria. Zero new rubrics is acceptable if no genuinely-shared check emerges.
8. New scenarios are **grouped by topic**; the exact folder structure (and whether to reorganize the existing IAPI scenarios) is a **design-phase** decision.
9. The skill (`skills/wordpress-development/`) is **not modified**.
10. Each new scenario is runnable individually via `npx skillsmith <scenario-dir>`, consistent with the agent eval cap.
