# Docs Summary: Complete iAPI eval scenario set + folder organization

## What

The docs run produced two coordinated documentation surfaces for the curated 68-scenario
Interactivity-API (iAPI) eval set and its new nested taxonomy:

- **`eval/scenarios/README.md` (new)** — the single contributor guide for the scenario set.
  It orients a contributor to what the set is and why it exists, enumerates the 12-group
  capability taxonomy (one sentence of capability area per group), explains the nested
  `eval/scenarios/<group>/<scenario>/` layout and what each scenario directory contains,
  documents the per-scenario authoring conventions (`scenario.yaml` fields, the prompt
  convention, the `acceptance`-vs-shared-rubric boundary, the e2e spec conventions), records
  the three deliberate convention exceptions, and gives an end-to-end add-a-scenario
  walkthrough.
- **`README.md` (root, realigned)** — the repo entry point for running the evals, updated
  from the obsolete flat layout to the nested `<group>/<scenario>` world: nested
  single-scenario addressing, the new folder-filtering capability, a corrected
  "Report location" section, a link to the new guide, and a nested-correct agent-cap section.

## Why

Before this run, the root README still taught the old flat layout and named scenarios
(`counter`, `async-fetch`) that no longer exist, and there was no document at all explaining
the curated set's taxonomy, per-scenario file structure, authoring conventions, or how to add
a scenario. The two surfaces together ensure that after the code phase no shipped doc points
at the old flat world and that a contributor can navigate, run, and extend the curated set
without reading the source. The guide also makes the taxonomy legible as a coverage map of
the iAPI surface.

## How

The guide was authored as one file across three sequential docs tasks (orientation →
authoring conventions → add-a-scenario walkthrough), each derived from the shipped tree and
scenario files rather than from hardcoded values, so descriptions stay drift-resistant (no
per-group scenario counts). Concrete claims are grounded in the shipped code: the
three-level-up helper import path, the fixed `wp-skill/testing-block` name and the
`plugin-<scenario>-<agentId>` slug from `eval/utils/scaffold-plugin.ts`, the `addLockProbe`
helper in `eval/utils/e2e-helpers.mjs`, and cited example prompts/acceptance from shipped
`scenario.yaml` files. The root README was realigned against the pinned Skillsmith trunk
behavior: segment-aware folder filtering (`selection.ts` `matchesScenarioFilter`) and
report/workspace keying on `scenario.name` (`pipeline.ts`), which is why report paths use the
bare leaf name even though the command line addresses scenarios by their nested path. All
cross-links between the two documents and to the rubric/utils were verified to resolve.

## Key decisions

- **Default the guide to `eval/scenarios/README.md`** (the docs plan allowed an alternate
  `eval/README.md` entry point). The writer kept the guide scoped to the scenario set at the
  default location; no `eval/README.md` was created.
- **Single source of truth for run commands.** The guide defers the canonical run
  instructions (prerequisites, environment, exact command, report location) to the root
  README rather than duplicating them, sketching only the nested single-scenario addressing
  shape it needs locally.
- **Drift-resistant group descriptions.** Group capability areas are described in prose
  derived from the shipped scenarios, with no per-group scenario counts that would rot as the
  set is re-curated.

## Known limitations

- The documentation deliberately asserts the **test-first** posture: the per-scenario
  `e2e.spec.mjs` files were authored against intended behavior and are **not executed** in
  this run. There is no passing/green suite, no golden or reference implementation, and no
  claim that the current iAPI reference makes the scenarios pass — improving the reference
  until they pass is a separate, later, owner-driven phase. This caveat is stated prominently
  in the guide (top banner plus a reminder in the authoring and add-a-scenario sections) and
  is reflected in the root README's agent-cap section.
