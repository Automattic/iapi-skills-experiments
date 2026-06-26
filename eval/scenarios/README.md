# iAPI eval scenario set

This directory holds the curated Skillsmith eval scenarios for the WordPress
Interactivity API (iAPI). It is the source of truth for **what iAPI behavior the
`wordpress-development` skill is held to** — a contributor browsing, running, or
extending the evals starts here.

> [!IMPORTANT]
> **The e2e specs are authored test-first and are not executed in this work.**
> Every scenario ships a Playwright `e2e.spec.mjs`, but those specs were written
> against the scenarios' *intended* behavior and have **not** been run. There is
> no passing/green suite, no golden or reference implementation, and no claim
> that the current iAPI reference makes these scenarios pass. Improving the
> reference until the scenarios pass is a separate, later, owner-driven phase.
> When you add or edit a scenario, author its spec to be runnable in shape — not
> to a green run.

## What this set is and why it exists

The set exists so the Skillsmith suite can **objectively drive how the iAPI
reference in the `wordpress-development` skill evolves**. It replaces an earlier
flat set of workflow-exercising scenarios with a de-duplicated set that covers
the full iAPI surface with no overlap: every iAPI concept maps to at least one
scenario, and running the suite surfaces where the reference falls short.

Because the scenarios are organized by capability, the directory tree doubles as
a **coverage map**: each capability group is a region of the API, and the
scenarios under it are the concrete behaviors that exercise that region. To see
whether a capability is covered, look for the group it belongs to and the
scenarios within.

For how the suite as a whole runs (prerequisites, environment, single-scenario
vs. full-matrix invocation, the one-scenario-per-agent cap, and where reports
land), see the [root README](../../README.md).

## Layout

Scenarios are nested exactly **one level deep**:

```
eval/scenarios/
  <group>/                  # one of the 12 capability groups
    <scenario>/             # kebab-case, globally unique scenario name
      scenario.yaml         # Skillsmith scenario definition
      e2e.spec.mjs          # Playwright e2e spec (authored test-first)
```

Rules that follow from this layout:

- **Group directories** are the 12 capability groups enumerated below. You do
  not add files directly to a group directory.
- **Scenario directories** are kebab-case identifiers and are **globally
  unique** across the whole tree — a `name` is unique not just within its group
  but across every group.
- **`scenario.yaml` lives only at the leaf** `<group>/<scenario>/` level —
  **never** at the group level. Skillsmith discovers scenarios by recursively
  walking for `scenario.yaml`, so a stray group-level YAML would be picked up as
  a malformed scenario. A group directory contains only scenario directories.

To place a new scenario for a given iAPI capability: find the capability group
its behavior belongs to (below), then create a new kebab-case leaf directory
under that group. That leaf is where its `scenario.yaml` and `e2e.spec.mjs` go.

## The 12 capability groups

Each group covers one region of the iAPI surface. The descriptions below
summarize the capability area each group covers; browse a group's directory for
the specific scenarios it currently contains.

- **`foundations`** — the smallest correctly-wired interactive block and the
  basic shapes of attaching directives to an element, including running
  interactivity outside the block system from a classic theme.
- **`reactive-bindings`** — binding reactive state to what the DOM shows: text,
  classes, CSS custom properties, boolean/conditional attributes, and the
  accessibility attributes that must move with them.
- **`state-and-context`** — the distinction between per-instance local context
  and shared global state, how state is seeded and inherited, sharing state
  across blocks and namespaces, and hardening a private store against tampering.
- **`derived-state`** — values computed from other state via derived getters,
  including server-derived values that must be correct on first paint without a
  flash of stale or empty content.
- **`server-rendering`** — server-side rendering and seeding so the block is
  correct before hydration: config-supplied data, server-side i18n, and IDs that
  stay stable across loads and soft navigations.
- **`events`** — wiring DOM events (clicks, keydown, input, resize, hover/touch,
  form submit) to actions, including window/document-scoped events.
- **`async-actions`** — asynchronous actions that fetch, poll, paginate, batch,
  or submit while keeping the UI responsive and reflecting loading/success/error
  states.
- **`lifecycle`** — mount/effect lifecycle: init callbacks, watching state for
  changes, intervals and timers with proper cleanup, focus management on reveal,
  and reacting to viewport visibility.
- **`lists`** — rendering and mutating lists: server-rendered iteration, keyed
  reordering without recreating nodes, live filtering, and keyboard-navigated
  collections.
- **`client-navigation`** — the Interactivity API router: soft client-side
  navigation, persisting regions across transitions, history handling, prefetch,
  per-navigation server sync, resilient fallbacks, and respecting external links.
- **`typescript`** — authoring interactive blocks in TypeScript with full type
  safety: inferred store types, merging server-seeded state into the store type,
  typed async/derived values, and importing another plugin's exported types.
- **`ux-patterns`** — accessible interactive UI patterns end to end: tabs,
  accordions, modals, lightboxes, drawers, and expandable search, with correct
  ARIA semantics and focus handling.

## What a scenario directory contains

Every curated scenario directory holds exactly two files, and **no scenario
omits either** — every curated scenario ships both:

- **`scenario.yaml`** — the Skillsmith scenario definition: the human-worded
  prompt the testing agent is asked to build, the scenario-specific acceptance
  criteria, and the skill and rubric it is graded against. Generic iAPI
  best-practice criteria are not restated here; they live in the shared rubric at
  [`eval/rubrics/wp-interactivity-api-best-practices.md`](../rubrics/wp-interactivity-api-best-practices.md).
- **`e2e.spec.mjs`** — a Playwright end-to-end spec that asserts the scenario's
  intended user-facing behavior (visible DOM/state changes, accessibility-tree
  attributes, and/or server-rendered HTML) in a real `wp-env` runtime. As noted
  above, these specs are authored test-first and are not executed in this work.

## Authoring and extending the set

This guide continues with the conventions you must follow and a step-by-step
walkthrough:

- **[Authoring conventions](#authoring-conventions)** — the rules a
  `scenario.yaml` and `e2e.spec.mjs` pair must follow to match the curated set's
  established shape.
- **[Adding a new scenario](#adding-a-new-scenario)** — an ordered walkthrough
  for adding a brand-new scenario end to end.

<!--
  Section anchors reserved for the authoring-conventions and add-a-scenario
  content. These sections are filled in by later docs tasks; the orientation
  content above forward-links to them.
-->

## Authoring conventions

<!-- Populated by a later docs task. -->

## Adding a new scenario

<!-- Populated by a later docs task. -->
