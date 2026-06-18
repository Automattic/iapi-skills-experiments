# Spec: Initial simple WordPress development scenarios

## Overview

The `wordpress-development` skill is evaluated by a Skillsmith-based suite under `eval/`. Today every scenario in `eval/scenarios/` targets the **Interactivity API**, and the only rubric (`eval/rubrics/wp-interactivity-api-best-practices.md`) is Interactivity-API-specific.

This work adds an **initial set of simple scenarios that broaden the suite beyond the Interactivity API**, drawn from the official WordPress developer documentation (developer.wordpress.org and its sublinks). The aim is to start exercising the wider WordPress development domain (e.g. plugins, themes, the REST API, common APIs) with small, focused scenarios, so the skill can later be grown to cover them.

The spec is deliberately **criteria-based**: it defines what qualifies as an acceptable scenario for this batch and how "done" is measured, but does **not** fix the exact topics, the specific scenarios, or the total count — those are chosen in the later design and plan phases. Cross-cutting best practices shared across scenarios are captured in **simple, general rubrics** rather than repeated per scenario. The skill itself is not changed in this work; the scenarios lead and the skill catches up later.

Each scenario follows the existing Skillsmith conventions already established by the Interactivity API scenarios:
- A directory `eval/scenarios/<dir>/` containing a `scenario.yaml` and, where applicable, an `e2e.spec.mjs`.
- `scenario.yaml` keys: `name`, `description`, `skills: [wordpress-development]`, `prompt`, `acceptance` (a list of scenario-specific success points), and optional `rubrics` (shared best-practice files referenced by filename stem).
- Skillsmith grades each scenario with an LLM judge against its `acceptance` list and any referenced `rubrics`, and additionally runs the Playwright `e2e.spec.mjs` in a `wp-env` runtime when one is present (the e2e spec is optional per scenario).

## Requirements

1. **Broaden beyond the Interactivity API.** Add new scenarios that cover WordPress development topic areas *other than* the Interactivity API. The batch must span **more than one** new topic area and add enough scenarios to demonstrably broaden the suite. No new Interactivity API scenarios are added in this batch.

2. **Documentation-driven.** Every scenario is grounded in the official WordPress developer documentation at developer.wordpress.org and its sublinks (e.g. Block Editor Handbook, Themes Handbook, Plugin Handbook, REST API Handbook, Common APIs, Coding Standards). Each scenario's success points are traceable to that documentation.

3. **Simple — one concept, one small feature.** Each scenario is a single focused task exercising one concept in one plugin, with a handful of acceptance points — on par with the existing `counter`, `toggle-visibility`, and `minimal-scaffold` scenarios. Multi-feature, multi-step, or otherwise complex scenarios are out of scope for this batch.

4. **Criteria-based selection; picks deferred.** The spec sets the qualifying criteria (Requirements 1–3) and the rough shape (~1–2 scenarios per chosen topic area). The exact topic areas, the specific scenarios, and the total count are selected during the later design/plan phases, not fixed here.

5. **User-voice, tool-agnostic prompts.** Each scenario's `prompt` reads like a real user's request: simple and phrased by desired outcome. It must **not** name the specific tool, API, framework, or technology the implementer should use (e.g. it must not say "use the Interactivity API" or "register a custom post type via `register_post_type`"). Deciding the approach is the skill's job. This matches how the existing scenario prompts are written.

6. **Schema-conformant.** Each scenario directory and its `scenario.yaml` conform to the existing Skillsmith scenario schema (keys listed in the Overview). `skills` is `[wordpress-development]`.

7. **Mixed verification bar.** For scenarios where a real-runtime check is feasible, provide a Playwright `e2e.spec.mjs` that runs in `wp-env` (following the pattern of the existing e2e specs: activate the scaffolded plugin, exercise it, assert behavior). Where an e2e check would be impractical for a simple case, a **judge-only** scenario (graded against `acceptance` + `rubrics`, no e2e spec) is acceptable.

8. **Separation of scenario criteria and rubrics.** A scenario's `acceptance` list contains only points unique to that scenario. Any check that is general and shared across multiple scenarios in the batch belongs in a **rubric**, not in the per-scenario acceptance list — and must not be duplicated between the two.

9. **Shared rubrics (in scope, kept simple).** Adding new shared rubrics under `eval/rubrics/` is in scope, but only where a genuinely cross-cutting check is shared across multiple scenarios in the batch. Such rubrics must stay simple and general (mirroring the style of the existing Interactivity API rubric). Adding **zero** new rubrics is acceptable if no genuinely-shared check emerges.

10. **Topic grouping.** New scenarios are organized by topic. The exact folder structure, and whether to reorganize the existing Interactivity API scenarios into that structure, is decided in the design phase.

11. **Skill untouched.** No file under `skills/wordpress-development/` is modified by this work.

12. **Individually runnable.** Each new scenario can be run on its own via `npx skillsmith <scenario-dir>`, consistent with the project's agent eval cap (agents run at most one scenario against one testing agent).

## Out of Scope

1. **Complex or multi-step scenarios** — anything beyond "one concept, one small feature." Deferred to later batches.
2. **Additional Interactivity API scenarios** — already covered by the existing suite.
3. **Any change to the skill itself** (`skills/wordpress-development/`) — this work adds scenarios and rubrics only; expanding the skill to document the new topics is separate follow-up work.
4. **Requiring scenarios to pass against the current skill, and running the full `scenarios × testing-agents` eval matrix** — well-formedness/runnability is the bar; full-matrix runs remain the owner's manual step.
5. **Finalizing a folder taxonomy or reorganizing the existing Interactivity API scenarios** — topic grouping is a design-phase decision; moving the existing scenarios is optional and not a required deliverable here.
6. **Scenarios grounded in non-official sources** — content must derive from developer.wordpress.org and its sublinks.
7. **CI / GitHub Actions / build-tooling changes** — not part of this batch unless strictly required to register a new scenario.

## Acceptance Criteria

1. **Broadened coverage**
   Given the completed batch, When inspecting `eval/scenarios/`, Then it contains new scenarios spanning more than one non-Interactivity-API topic area, and no newly added scenario targets the Interactivity API.

2. **Schema conformance**
   Given any new scenario directory, When reading its `scenario.yaml`, Then it has `name`, `description`, `skills: [wordpress-development]`, `prompt`, and `acceptance`, with `rubrics` present only when the scenario references one.

3. **User-voice, tool-agnostic prompt**
   Given any new scenario, When reading its `prompt`, Then it is phrased as a user-style request by outcome and does not name the tool/API/technology to use.

4. **Documentation traceability**
   Given any new scenario, When reviewing its `acceptance` points, Then each is supported by official developer.wordpress.org documentation.

5. **Simplicity**
   Given any new scenario, When assessing its scope, Then it covers one concept / one small feature with a handful of acceptance points (no multi-feature or multi-step tasks).

6. **Mixed verification present and correct**
   Given a new scenario for which a real-runtime check is feasible, Then its directory includes an `e2e.spec.mjs` that runs under `wp-env`; And given a new scenario where e2e is impractical, Then it may omit the e2e spec and be graded by judge against `acceptance` + `rubrics`.

7. **Runnable without harness errors**
   Given any new scenario, When it is run via `npx skillsmith <scenario-dir>`, Then it executes to a graded result without harness/configuration errors (a failing grade against the current skill is acceptable and does not violate this criterion).

8. **Rubric / acceptance separation**
   Given a best-practice check that applies across multiple scenarios in the batch, When locating it, Then it lives in a rubric under `eval/rubrics/` and is not duplicated in any scenario's `acceptance` list; And given any new rubric, Then it is simple and general (no scenario-specific criteria).

9. **Skill unchanged**
   Given the batch's diff, When inspecting paths under `skills/wordpress-development/`, Then no file there is modified.
