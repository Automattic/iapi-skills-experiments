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

Every scenario in the curated set follows the same shape so the set reads as one
body of work and so the tooling can discover, run, and attribute each scenario
without per-scenario special-casing. This section is the contract a new
`scenario.yaml` + `e2e.spec.mjs` pair must match. The examples below are all
drawn from shipped scenarios — read the cited files when you need the full
context.

> [!NOTE]
> These conventions describe how the specs are *authored*. As stated at the top
> of this guide, the specs are written test-first and are **not executed** in
> this work — there is no green run to match against. Author a new spec to be
> runnable in shape against a later correct implementation, not to a passing
> suite.

### `scenario.yaml` conventions

A `scenario.yaml` is a Skillsmith scenario definition. Across the set it carries
the same six fields, in the same order:

```yaml
name: minimal-scaffold
description: Build the smallest correctly-wired Interactivity API block.
skills:
  - wordpress-development

prompt: |
  <outcome-focused feature request in non-expert user language>

acceptance:
  - <a criterion unique to this scenario>
  - <the distinct iAPI concept this scenario exercises>

rubrics:
  - wp-interactivity-api-best-practices
```

The fields, and the rules that govern them:

- **`name`** — the scenario identifier. It **equals the leaf directory name**,
  is **kebab-case**, and is **globally unique across the whole tree** — unique
  not just within its group but across every group. (Skillsmith keys reports and
  artifacts on `name`, and rejects a duplicate `name` at enumeration time, so a
  collision anywhere in the tree fails the whole run.) Keep the directory name
  and the `name` field in lockstep.
- **`description`** — one line, present tense, describing what the scenario
  builds. See `foundations/minimal-scaffold/scenario.yaml` for the canonical
  brevity.
- **`skills`** — the skill under test. For every scenario in this set this is
  the single-entry list `[wordpress-development]`.
- **`prompt`** — the human-worded feature request the testing agent is asked to
  build. See [Prompt convention](#prompt-convention) below — this is the most
  load-bearing field and has its own rules.
- **`acceptance`** — the scenario-specific grading criteria. See
  [`acceptance` vs. the shared rubric](#acceptance-vs-the-shared-rubric) below.
- **`rubrics`** — the shared rubric the result is graded against. For every
  scenario in this set this is the single-entry list
  `[wp-interactivity-api-best-practices]`, which points at
  [`eval/rubrics/wp-interactivity-api-best-practices.md`](../rubrics/wp-interactivity-api-best-practices.md).

`skills` and `rubrics` are the same for every scenario by design: the set holds
the **one** `wordpress-development` skill to the **one** shared iAPI rubric, and
the per-scenario variation lives entirely in `prompt` and `acceptance`.

### Prompt convention

The `prompt` is the heart of a scenario. It is a **realistic, outcome-focused
feature request written in non-expert user language**: it describes the behavior
the user wants and **never names an iAPI directive, store API, server helper, or
any other implementation mechanism**. The scenario tests whether the agent can
*choose* the right iAPI machinery from a plain-language outcome — so naming that
machinery in the prompt would defeat the test.

Inherently technical asks are still allowed, but they are phrased as **user
constraints**, not as directive names. For example:

- `typescript/ts-counter-inference` asks for type safety as a user goal —
  *"Please build it in TypeScript with full type safety — I want the type
  checker to understand the shape of the state automatically from how I define
  it, without me having to write any explicit type annotations or type casts."*
  It never mentions store generics or the `store()` type parameter.
- `state-and-context/locked-private-store` asks for hardening as a user goal —
  *"Harden it so other plugins can't tamper with it, even if they try to access
  the same namespace."* It never mentions `store()`'s `lock` option.

A quick before/after, drawn from `foundations/minimal-scaffold` — what the rule
rules out, and what the shipped prompt does instead:

- **Off-convention (names the mechanism):** "Add a block with a `data-wp-init`
  callback that logs `iapi-ready` to the console once on mount."
- **On-convention (shipped prompt):** *"once the runtime has picked the block up
  and finished setting it up on the client, I want to see `iapi-ready` logged to
  the browser console — just once per block instance, not every time the script
  file loads."*

Both describe the same outcome, but only the second leaves the agent to discover
that an init callback is the right tool. When you write a prompt, describe what
the visitor sees and does; let the rubric and `acceptance` judge whether the
agent reached for the right directive.

### `acceptance` vs. the shared rubric

A scenario's `acceptance` list holds **only** the criteria unique to that
scenario — its specific behavior and the distinct iAPI concept it exercises.
Generic iAPI wiring and reactivity expectations that apply to *every* scenario
(declaring `supports.interactivity`, using `viewScriptModule`, importing from
`@wordpress/interactivity` instead of `window.wp.*`, binding reactive text with
`data-wp-text`, seeding state with `wp_interactivity_state()`, and so on) are
**not** restated in `acceptance`. Those live in the shared rubric at
[`eval/rubrics/wp-interactivity-api-best-practices.md`](../rubrics/wp-interactivity-api-best-practices.md),
which opens by stating that its criteria apply to every scenario and "should not
be duplicated in scenario-level acceptance lists."

The rubric grades *how well the block is wired in general*; `acceptance` grades
*whether this scenario's specific behavior and concept are present*. For
example, `derived-state/price-with-vat` does not restate "binds reactive text
with `data-wp-text`" (the rubric owns that); its `acceptance` instead pins the
concept the scenario is for — that the VAT-inclusive total "is exposed as a
derived getter on the store (computed from the per-instance base price on
read) — it is not stored as a separate mutable field and is never written by an
action." When you write `acceptance`, ask of each line: *would this be true of
every scenario in the set?* If yes, it belongs to the rubric, not here.

### e2e spec conventions

Every `e2e.spec.mjs` is a Playwright spec authored against
`@wordpress/e2e-test-utils-playwright`, and every spec in the set follows the
same harness conventions:

- **Fixed block name.** The block under test is always
  `wp-skill/testing-block`. The spec creates a post whose content is the block
  comment `<!-- wp:wp-skill/testing-block /-->` and locates the rendered block
  by its wrapper class `.wp-block-wp-skill-testing-block`. (This name is fixed
  by the harness — `eval/utils/scaffold-plugin.ts` scaffolds the agent's plugin
  around exactly this block name.) For multi-instance scenarios, embed the block
  comment twice and address instances by index — see
  `state-and-context/cart-count-cross-block/e2e.spec.mjs`, which embeds
  `<!-- wp:wp-skill/testing-block /-->\n<!-- wp:wp-skill/testing-block /-->` and
  reads the two instances via `.nth(0)` / `.nth(1)`.
- **Per-(scenario, agent) plugin activation.** In `test.beforeAll`, the spec
  activates the plugin Skillsmith scaffolded for this scenario and agent. The
  plugin slug is `plugin-<scenario>-<agentId>`, and the agent id comes from the
  Playwright worker metadata:

  ```js
  await requestUtils.activatePlugin(
    `plugin-<scenario>-${workerInfo.project.metadata.agentId}`,
  );
  ```

- **State reset with `deactivateAllPlugins`.** Each spec deactivates every
  plugin at the start of `beforeAll` (before activating its own) and again in
  `afterAll`, so scenarios do not leak plugin state into one another.
  `afterAll` also cleans up the posts/pages it created (e.g.
  `requestUtils.deleteAllPosts()`).
- **Three-level-up helper imports.** Shared harness helpers live in
  `eval/utils/`. Because specs are nested two directories deeper than the flat
  layout (`eval/scenarios/<group>/<scenario>/`), they import from `eval/utils/`
  with a **three-level-up** relative path:

  ```js
  import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";
  ```

  Getting this depth wrong (`../../utils/...`) is the most common authoring slip
  — count three `../` for a nested spec.

The shared helper module is
[`eval/utils/e2e-helpers.mjs`](../utils/e2e-helpers.mjs). It currently exports a
single helper, `addLockProbe`, used by one scenario (see the exceptions below).
Special-case harness needs are handled in one of two ways: a **shared helper**
in `eval/utils/e2e-helpers.mjs` when more than one spec would need it, or
**inlined per spec** when only one scenario needs it and the setup is simple.
Read `eval/utils/e2e-helpers.mjs` and the two scenarios that use special
handling (`state-and-context/locked-private-store` and
`state-and-context/pageview-analytics-bridge`) for the concrete patterns rather
than copying internals from this guide.

### Documented exceptions to the conventions

Three scenarios deliberately depart from the conventions above. They are
recorded here — and in each scenario's own `acceptance` — so a reviewer reads
them as approved, not as off-convention mistakes. In each case the convention is
relaxed for a real reason; see the named scenario for the specifics.

- **`foundations/classic-theme-banner` — does not use `wp-skill/testing-block`.**
  This scenario asks for a banner injected from a *classic* theme into the
  footer, not a block in the editor. The agent's plugin emits the interactive
  banner HTML outside the block pipeline and processes its directives directly,
  so there is no testing-block wrapper to target. Its spec creates a plain post
  (no testing-block in the content) and locates the banner by its
  `data-wp-interactive` attribute or a distinctive class. This is the **sole**
  exception to the fixed-block-name convention. See
  `foundations/classic-theme-banner/`.
- **`state-and-context/locked-private-store` — uses the shared lock-probe
  helper.** A `store()` namespace registered as private is reachable only
  through an ES module import, not through any `window.*` global, so an inline
  `page.evaluate` cannot probe it. The spec imports `addLockProbe` from
  `eval/utils/e2e-helpers.mjs` to inject an adversarial probe and assert the
  re-open attempt is rejected. This is the one scenario that uses the shared
  helper. See `state-and-context/locked-private-store/` and
  [`eval/utils/e2e-helpers.mjs`](../utils/e2e-helpers.mjs).
- **`state-and-context/pageview-analytics-bridge` — inlines its analytics
  sink.** This scenario forwards a reactive value to a client-side analytics
  callback. Its spec stubs that callback inline (via `page.addInitScript`,
  before navigation) and asserts on what was captured, rather than factoring the
  stub into a shared helper — only this scenario needs it and the setup is
  small. See `state-and-context/pageview-analytics-bridge/`.

## Adding a new scenario

<!-- Populated by a later docs task. -->
