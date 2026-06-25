# Spec: Complete iAPI eval scenario set + folder organization

## Overview

This project hosts the `wordpress-development` skill and a Skillsmith-based evaluation
suite under `eval/`. The suite sends scenario prompts to LLM "testing agents", which
build a WordPress block; judges and a shared rubric grade the result, and an end-to-end
(e2e) hook validates it in a real `wp-env` runtime. Today `eval/scenarios/` holds ~11
flat scenarios that were an initial workflow-exercising set, not real coverage of the
WordPress Interactivity API (iAPI).

This work replaces that initial set with a curated, de-duplicated set of iAPI eval
scenarios that together cover the full iAPI surface with no overlap, organized into a
capability-based folder taxonomy. The set exists so the Skillsmith suite can objectively
drive how the iAPI reference in the `wordpress-development` skill evolves: every concept
in the API maps to at least one scenario, and running the suite surfaces where the
reference falls short.

The curated taxonomy and scenario set are **already settled** (see the authoritative
enumeration in `base/0-intent/proposal.md`, a verbatim copy of the source issue). This
work implements them; it does not re-curate them.

Each scenario is authored as a Skillsmith `scenario.yaml` plus, where a runtime test is
meaningful, an `e2e.spec.mjs`. The specs are written **test-first (TDD-style)**: authored
and reviewed for correctness but not executed in this run. Executing them — and improving
the iAPI reference until they pass — is a later, owner-driven phase.

## Requirements

### Scenario set and layout

1. The final `eval/scenarios/` contains **exactly** the curated scenario set defined in
   `base/0-intent/proposal.md` — the 12 capability folders (`foundations`,
   `reactive-bindings`, `state-and-context`, `derived-state`, `server-rendering`,
   `events`, `async-actions`, `lifecycle`, `lists`, `client-navigation`, `typescript`,
   `ux-patterns`) and the scenarios listed under each.
2. Scenarios are nested one level deep: `eval/scenarios/<group>/<scenario>/`. Each
   `<scenario>` directory name is a kebab-case identifier for that scenario.
3. The existing flat scenarios are removed, migrated, or used as inspiration so that the
   end state matches the curated set exactly. Any existing scenario with no curated
   counterpart (e.g. `counter`) is removed; no non-curated scenarios remain.

### Per-scenario authoring

4. Each scenario directory contains a `scenario.yaml` conforming to Skillsmith's scenario
   schema, with fields:
   - `name` — the scenario identifier (matches the directory name, kebab-case).
   - `description` — one line describing what it builds.
   - `skills` — `[wordpress-development]`.
   - `prompt` — see Requirement 5.
   - `acceptance` — see Requirement 6.
   - `rubrics` — `[wp-interactivity-api-best-practices]`.
5. Each `prompt` is a realistic, outcome-focused feature request phrased as a non-expert
   user would write it: it describes the behavior the user wants and never names iAPI
   directives, store/server APIs, or otherwise prescribes the implementation. Inherently
   technical asks (e.g. "build it in TypeScript with full type safety", "harden it so
   other plugins can't tamper with it") are expressed as user constraints, not as
   directive names.
6. Each `acceptance` list contains **only** criteria unique to that scenario — the
   specific behavior and the distinct iAPI concept it exercises. Generic iAPI wiring and
   reactivity expectations that apply to every scenario are **not** duplicated here; they
   are covered by the shared rubric (Requirement 11).

### End-to-end tests

7. Every scenario has an `e2e.spec.mjs` **unless a runtime e2e test fundamentally does
   not make sense** for that scenario (no meaningful runtime signal to assert). The
   decision to omit an e2e is made per scenario and recorded with a brief rationale.
8. Lack of test-harness capability is **not** a reason to omit an e2e. Where a scenario
   needs harness capability the current setup lacks (e.g. an analytics sink an action can
   write to, an adversarial `store()` probe, multi-block fixtures), that capability is
   built so the scenario can be tested.
9. e2e specs are **authored and reviewed for correctness but not executed** in this run.
   They are written test-first: each spec asserts the scenario's intended user-facing
   behavior (visible DOM/state changes, accessibility-tree attributes, and/or
   server-rendered HTML) so that it is ready to run later against a correct
   implementation.
10. e2e specs follow the established conventions in this repo: they target the fixed block
    name `wp-skill/testing-block`, activate the per-(scenario, agent) plugin
    (`plugin-<scenario>-<agentId>`), reset state with `deactivateAllPlugins`, and import
    shared helpers from `eval/utils/`.

### Rubric

11. The shared rubric `eval/rubrics/wp-interactivity-api-best-practices.md` continues to
    own generic iAPI best practices (block wiring, server-side seeding, reactivity and
    directives, async actions). It is updated to drop the deprecated
    `data-wp-on-async--<event>` directive so that an `on-async` answer is not graded as
    correct. No other rubric changes are made unless authoring a scenario reveals a
    genuine coverage gap not already handled by the rubric or a scenario's own acceptance.

### Tooling and integration

12. The project's `@automattic/skillsmith` dependency is updated to track Skillsmith
    trunk, which supports nested scenario folders and folder filtering. Skillsmith
    discovers scenarios at `eval/scenarios/*/*/scenario.yaml`.
13. `eval/utils/verify-e2e.ts` is updated so the nested `<group>/<scenario>/e2e.spec.mjs`
    path is used to locate specs, while failure attribution remains keyed on the scenario
    directory name (so a failing spec still maps back to its scenario and testing agent).
14. The nested layout works end-to-end with the rest of the tooling without regressions:
    Skillsmith enumerates the nested scenarios, Playwright discovers the nested specs (its
    `**/e2e.spec.mjs` match is already recursive), and the plugin scaffolding
    (`eval/utils/scaffold-plugin.ts`) is unaffected.

## Out of Scope

- Improving the `wordpress-development` iAPI reference so the scenarios pass — that is the
  later eval/improve phase.
- Running the full Skillsmith `scenarios × agents` matrix — the owner's manual step.
- Executing the e2e specs to green or building reference/golden implementations of the
  scenarios — deferred to the later eval phase (these specs are authored test-first).
- Changes to Skillsmith's own source — only the dependency is bumped to trunk.
- Rubric changes beyond dropping `data-wp-on-async` — made only on a genuine, newly
  discovered coverage gap.
- Re-curating the scenario set or the taxonomy — both are settled by the proposal.
- CI/automation changes to run the e2e suite automatically.

## Acceptance Criteria

Criteria describe the state of the repository at the end of this work.

1. **Given** the curated set in `base/0-intent/proposal.md`, **when** `eval/scenarios/` is
   listed, **then** it contains exactly the 12 capability folders and, under each, exactly
   the scenarios the proposal defines — and no scenario directory exists that is not in the
   proposal.
2. **Given** any scenario, **when** its directory is inspected, **then** it lives at
   `eval/scenarios/<group>/<scenario>/` and contains a `scenario.yaml`, plus an
   `e2e.spec.mjs` unless that scenario is on the recorded list of scenarios for which a
   runtime e2e does not make sense.
3. **Given** any `scenario.yaml`, **when** it is parsed, **then** it satisfies the
   Skillsmith schema with `skills: [wordpress-development]` and
   `rubrics: [wp-interactivity-api-best-practices]`, and Skillsmith enumerates it from the
   nested path without error.
4. **Given** any `prompt`, **when** it is read, **then** it describes the desired outcome
   in user language and names no iAPI directive, store API, server helper, or other
   implementation mechanism.
5. **Given** any scenario's `acceptance` list, **when** it is compared against the shared
   rubric, **then** every item is specific to that scenario and none restates a generic
   wiring/reactivity expectation already covered by the rubric.
6. **Given** any `e2e.spec.mjs`, **when** it is reviewed, **then** it asserts the
   scenario's intended user-facing behavior using the repo's e2e conventions (fixed block
   name, per-(scenario, agent) plugin activation, shared `eval/utils/` helpers) and is
   self-consistent and runnable in shape, even though it is not executed in this run.
7. **Given** a scenario that needs harness capability the prior setup lacked, **when** its
   `e2e.spec.mjs` is reviewed, **then** the supporting harness capability it depends on is
   present in the repo (the spec does not reference non-existent fixtures/helpers).
8. **Given** the rubric, **when** it is read, **then** it no longer endorses or permits
   `data-wp-on-async--<event>`, and it still covers the generic best practices it covered
   before.
9. **Given** `package.json`, **when** the `@automattic/skillsmith` dependency is resolved,
   **then** it points at Skillsmith trunk (nested-folder-capable), and installing it
   succeeds.
10. **Given** `eval/utils/verify-e2e.ts`, **when** a nested scenario's spec fails in a
    Skillsmith run, **then** the failure is attributed to the correct scenario directory
    and testing agent (the nested path is resolved for lookup; attribution stays keyed on
    the scenario dir).
