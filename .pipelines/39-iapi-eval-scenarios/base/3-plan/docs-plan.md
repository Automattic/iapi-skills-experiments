# Docs Plan: Complete iAPI eval scenario set + folder organization

## Overview

This work replaces the old flat `eval/scenarios/` set (~11 workflow-exercising scenarios)
with a curated **68-scenario Interactivity-API (iAPI) eval set** organized into a
**12-group capability taxonomy** nested one level deep
(`eval/scenarios/<group>/<scenario>/`), each scenario authored as a Skillsmith
`scenario.yaml` plus a test-first Playwright `e2e.spec.mjs`. The supporting tooling changes
(Skillsmith trunk bump for nested discovery + folder filtering, the `verify-e2e.ts`
attribution patch, the new shared `eval/utils/e2e-helpers.mjs` helper, the inline analytics
convention, and the one-line rubric edit) ship alongside it. The documentation surfaces
affected are: the **root `README.md`**, which currently teaches the flat layout and names
scenarios (`counter`, `async-fetch`) that will no longer exist; and the **absence of any
guide** to the scenario set — there is today no doc that explains the taxonomy, the
per-scenario file structure, the authoring conventions (human-worded prompts, scenario-
specific `acceptance` vs. the shared rubric, the e2e conventions and their exceptions), or
how to add a scenario. This plan adds a new contributor guide for the scenario set and
realigns the root README, so that after the code phase no shipped doc points at the old flat
world and contributors can navigate and extend the curated set. All documentation must
describe only what actually shipped: the specs are authored test-first and **not executed**
in this run, so no doc may claim a green/passing suite, golden implementations, or that the
reference makes the scenarios pass.

## Guardrail scopes

This project defines no Guardrails — there are no deterministic gates and no guardrail
scopes to fill.

| Gate | Scope |
| ---- | ----- |
| None | None |

## Tasks

### Task 1: Add the scenario-set contributor guide (new `eval/scenarios/README.md`)

- **Goal:** Create the single missing document that lets a contributor navigate the curated
  scenario set — what the set is, how it is organized into the 12-group capability taxonomy,
  how to find where a given capability lives, and what each scenario directory contains. This
  is the navigational/orientation half of the guide; authoring conventions and the
  add-a-scenario walkthrough are Tasks 2 and 3.
- **Audience:** Contributors and maintainers who extend, browse, or run the iAPI eval set
  (internal). Not end users of the `wordpress-development` skill.
- **Files to change:** Create `eval/scenarios/README.md` (new). (If, on reading the shipped
  tree, the docs-writer judges that placing the guide one level up at `eval/README.md` reads
  more naturally as the eval-suite entry point, that location is acceptable — but it must
  then also cover the rubric/prompts/utils siblings at least by pointer; default to
  `eval/scenarios/README.md` scoped to the scenario set.)
- **Sections / scope:**
  - What the curated set is and why it exists: it objectively drives how the iAPI reference
    in `wordpress-development` evolves — every iAPI concept maps to at least one scenario, and
    running the suite surfaces where the reference falls short. The taxonomy tree doubles as
    the coverage map.
  - The nested layout: `eval/scenarios/<group>/<scenario>/`, one level deep, kebab-case
    scenario directory names, `scenario.yaml` lives only at the leaf (never at the group
    level). Enumerate the 12 capability groups and describe, in a sentence each, the
    capability area each group covers (read the shipped group directories and their scenarios
    to write these — do not hardcode a count of scenarios per group that could drift).
  - What a scenario directory contains: a `scenario.yaml` (Skillsmith definition) and an
    `e2e.spec.mjs` (Playwright spec), and the note that every curated scenario ships both —
    none omits its e2e.
  - **Status banner / explicit note:** the e2e specs are authored **test-first and not run in
    this work**; the suite is not claimed green, there are no golden/reference
    implementations, and improving the reference until the scenarios pass is a later,
    owner-driven phase. This note is mandatory and load-bearing.
  - Forward pointers to the authoring-conventions section (Task 2) and the add-a-scenario
    walkthrough (Task 3), and a back-link from / to the root README (coordinated with Task 4).
- **Depends on:** none (but the file it creates is extended by Tasks 2 and 3, so those three
  share one file — sequence 1 → 2 → 3 on `eval/scenarios/README.md`).
- **Traces to:** Spec requirements 1, 2 / Acceptance criteria 1, 2 / Code-plan Tasks 4-16
  (the taxonomy and tree they build) and the design doc "Nested one-level taxonomy" decision.
- **Acceptance:**
  - A contributor can read the guide and correctly state where in the tree a new scenario for
    a given iAPI capability should live, and that `scenario.yaml` exists only at leaf
    directories.
  - The guide enumerates all 12 capability groups and explains what capability area each
    covers, derived from the shipped tree (no per-group scenario counts that would drift).
  - The guide states that each scenario directory holds a `scenario.yaml` and an
    `e2e.spec.mjs` and that no curated scenario omits its e2e.
  - The guide carries an explicit, prominent note that the e2e specs are authored test-first
    and not executed in this run — no claim of a passing/green suite, golden implementations,
    or a reference that already makes the scenarios pass.
  - The guide cross-links to the authoring-conventions and add-a-scenario sections and to the
    root README.

### Task 2: Document the per-scenario authoring conventions (extend the scenario-set guide)

- **Goal:** Capture, in the scenario-set guide, the conventions a contributor must follow
  when authoring or editing a scenario, so that a new `scenario.yaml` + `e2e.spec.mjs` pair
  matches the curated set's established shape. This is the "rules of the road" half of the
  guide.
- **Audience:** Contributors authoring or reviewing scenarios (internal).
- **Files to change:** `eval/scenarios/README.md` (extend the file created in Task 1).
- **Sections / scope:**
  - **`scenario.yaml` conventions:** the fields a scenario definition carries
    (`name`/`description`/`skills`/`prompt`/`acceptance`/`rubrics`) and the rules that govern
    them — `name` equals the directory name and is kebab-case and globally unique across the
    whole tree; `skills` is the `wordpress-development` skill and `rubrics` is the shared iAPI
    rubric. Describe these from the shipped scenario files; do not lock exact field ordering
    or values beyond what the shipped files consistently show.
  - **Prompt convention (load-bearing):** prompts are realistic, outcome-focused feature
    requests written in non-expert user language; they describe the behavior the user wants
    and **never name an iAPI directive, store/server API, or other implementation mechanism**.
    Inherently technical asks (e.g. "build it in TypeScript with full type safety", "harden it
    so other plugins can't tamper with it") are phrased as user constraints, not as directive
    names. Include at least one before/after-style illustration drawn from a shipped prompt.
  - **`acceptance` vs. the shared rubric (load-bearing):** a scenario's `acceptance` list
    holds **only** the criteria unique to that scenario — its specific behavior and the
    distinct iAPI concept it exercises. Generic iAPI wiring/reactivity expectations that apply
    to every scenario are **not** restated there; the shared rubric
    (`eval/rubrics/wp-interactivity-api-best-practices.md`) owns those. Cross-link the rubric
    file so the boundary is discoverable.
  - **e2e spec conventions:** the established conventions every spec follows — target the
    fixed block name `wp-skill/testing-block`; activate the per-(scenario, agent) plugin
    (`plugin-<scenario>-<agentId>`); reset state with `deactivateAllPlugins`; import shared
    helpers from `eval/utils/` using the **three-level-up** relative path that the nested
    layout requires (`../../../utils/...`). Note the available shared helper module
    (`eval/utils/e2e-helpers.mjs`) and that special-case harness needs are handled either by a
    shared helper or inlined per spec — point the reader to read the shipped helper and the
    two scenarios that use special handling rather than restating their internals.
  - **Documented exceptions to the conventions** (so reviewers do not flag them as
    off-convention): the `classic-theme-banner` scenario does not use `wp-skill/testing-block`
    (its banner is emitted outside the block pipeline and located by its interactivity
    attribute / a distinctive class); the `locked-private-store` scenario uses the shared lock
    probe helper; the `pageview-analytics-bridge` scenario inlines its analytics sink. Describe
    each as "the exception and why", pointing at the scenario for specifics.
  - **Test-first reminder:** specs are authored to be runnable in shape against a later correct
    implementation and are **not executed** here; reassert that the suite is not claimed green.
- **Depends on:** Task 1 (same file).
- **Traces to:** Spec requirements 4, 5, 6, 7, 8, 9, 10 / Acceptance criteria 3, 4, 5, 6, 7 /
  Code-plan "scenario.yaml authoring rules" and "E2E spec conventions" sections, Tasks 2, 4-16,
  and the design decisions "One shared e2e helper; analytics inline" and the
  `classic-theme-banner` exception.
- **Acceptance:**
  - A contributor can author a conformant `scenario.yaml` from the guide: they know the
    fields, that `name` matches the directory and is globally unique kebab-case, and that
    `skills`/`rubrics` point at the `wordpress-development` skill and the shared iAPI rubric.
  - The guide states the prompt rule (user language, never naming directives/store/server
    APIs, technical asks as user constraints) and illustrates it with a shipped example.
  - The guide explains the `acceptance`-vs-rubric division of labor and cross-links the shared
    rubric file.
  - The guide states the e2e conventions including the fixed block name, the
    per-(scenario, agent) plugin activation, `deactivateAllPlugins` reset, and the
    three-level-up helper import path, and points the reader at the shared helper module.
  - The guide records the three documented exceptions (`classic-theme-banner`,
    `locked-private-store`, `pageview-analytics-bridge`) as deliberate, with a pointer to each
    scenario for specifics — without restating implementation internals that live in the code.
  - No statement in the section claims the specs are executed or the suite passes.

### Task 3: Document how to add a new scenario (extend the scenario-set guide)

- **Goal:** Give a contributor a clear, ordered walkthrough for adding a brand-new scenario to
  the curated set end to end, tying together the taxonomy (Task 1) and the conventions
  (Task 2) into an actionable procedure.
- **Audience:** Contributors adding a new scenario (internal).
- **Files to change:** `eval/scenarios/README.md` (extend the file from Tasks 1-2).
- **Sections / scope:**
  - The ordered steps: pick the right capability group (or recognize a new group is needed),
    choose a kebab-case scenario directory name that is globally unique, create the leaf
    directory under that group, author the `scenario.yaml` and `e2e.spec.mjs` per the
    conventions (Task 2), and decide whether a special harness capability is needed (and where
    it lives — shared helper vs. inline).
  - How to run a single scenario locally to sanity-check it during authoring, using a nested
    scenario path, and the agent-cap rule that the full matrix is never run as part of
    authoring (point at the root README's run section rather than duplicating it; coordinate
    with Task 4).
  - The "every scenario ships an e2e" rule and the test-first posture: the new spec is authored
    to be runnable in shape but is not executed/greened in this work.
  - A pointer to the shared rubric for what NOT to duplicate in `acceptance`.
- **Depends on:** Tasks 1 and 2 (same file; this section references both).
- **Traces to:** Spec requirements 1, 2, 4, 5, 6, 7 / Acceptance criteria 1, 2, 4, 5, 6 /
  Code-plan Tasks 4-16 and the design "Migrate / new" authoring approach.
- **Acceptance:**
  - A contributor can follow the steps and produce a new, correctly placed, correctly named
    scenario directory with both required files and conformant prompt/acceptance.
  - The walkthrough tells the contributor how to run that one scenario locally via its nested
    path and reiterates the agent-cap (never run the full matrix as part of authoring),
    deferring the canonical run instructions to the root README rather than duplicating them.
  - The walkthrough states the every-scenario-has-an-e2e rule and that the spec is authored
    test-first and not executed in this run.
  - The walkthrough points at the shared rubric as the source of generic criteria that must
    not be duplicated in a scenario's `acceptance`.

### Task 4: Realign the root `README.md` to the nested layout and curated set

- **Goal:** Update the root README so it no longer teaches the obsolete flat layout or names
  scenarios that no longer exist, reflects the nested `<group>/<scenario>` invocation and the
  new folder-filtering capability, and links contributors to the new scenario-set guide.
- **Audience:** Anyone setting up or running the evals from the repo root — the broadest
  audience (new contributors, the owner). Public-facing repo README.
- **Files to change:** `README.md` (root).
- **Sections / scope:**
  - The "Running evals → Single scenario" guidance currently says scenario names are "the bare
    directory names under `eval/scenarios/`" and uses `counter` / `npx skillsmith counter` as
    the example. Update it so the example and explanation match the shipped nested layout (a
    scenario is addressed by its `<group>/<scenario>` path) and use a scenario that actually
    exists in the shipped tree. Do not hardcode a brittle example that could be re-curated
    away — read the shipped tree and pick a stable, representative scenario, or describe the
    pattern with a placeholder plus one concrete shipped example.
  - Document the **folder-filtering** capability the Skillsmith trunk bump enables: a whole
    capability group can be selected/filtered by its group folder. Describe what it does and
    how to invoke it for a group, grounded in the shipped Skillsmith behavior and config; keep
    it drift-resistant (capability and shape, not exact internal flag semantics beyond what the
    shipped tooling exposes).
  - The "Report location" section references `iteration-N/<scenario>/...` paths — verify
    against the shipped behavior whether the scenario segment is now the nested
    `<group>/<scenario>` or stays the bare scenario name (the design keys
    workspaces/artifacts on `scenario.name`, not the dir path); correct the README only as
    needed to match what actually ships, and do not introduce a claim the code does not back.
  - Add a link from the README to the new scenario-set guide (Task 1) so a reader who wants to
    extend the set is routed there. Preserve the existing prerequisites, environment-setup, and
    agent-cap content except where it names the flat layout.
  - Keep the agent-cap section accurate for the nested world (still "at most one scenario", now
    addressed by a nested path).
- **Depends on:** Task 1 (the guide it links to must exist). Can otherwise proceed
  independently of Tasks 2-3.
- **Traces to:** Spec requirements 1, 2, 12, 14 / Acceptance criteria 1, 3, 9 / Code-plan
  Task 1 (Skillsmith trunk bump enabling nested discovery + folder filtering) and the design
  decision "Pin `@automattic/skillsmith` to trunk SHA".
- **Acceptance:**
  - The README no longer instructs the reader to address a scenario by a bare flat directory
    name and no longer uses `counter` / `async-fetch` (or any other deleted scenario) as a
    run example; its single-scenario example uses a scenario that exists in the shipped nested
    tree and shows the `<group>/<scenario>` addressing.
  - The README documents the folder-filtering capability (selecting a whole capability group),
    grounded in the shipped tooling.
  - The "Report location" paths are consistent with what the shipped tooling actually emits
    (the scenario segment is described correctly, not asserted to be nested if it is not).
  - The README links to the new scenario-set guide as the entry point for extending the set.
  - No README statement claims the e2e suite is run/green as part of this work or that the
    reference makes the scenarios pass; the agent-cap guidance remains correct for the nested
    layout.
