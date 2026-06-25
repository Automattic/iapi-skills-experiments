# Docs Plan Review

## Verdict: approved

## Summary

The documentation plan is grounded, drift-resistant, traceable, and feasible. It documents
only shipped artifacts: a new scenario-set contributor guide (`eval/scenarios/README.md`,
verified absent today) covering the 12-group nested taxonomy, the per-scenario file
structure, the authoring conventions (human-worded prompts, scenario-specific `acceptance`
vs. the shared rubric, the e2e conventions and their three documented exceptions), the
how-to-add-a-scenario walkthrough; and a realignment of the stale root `README.md` (verified
present, teaching the flat layout, naming `counter`/`async-fetch`, and carrying
`iteration-N/<scenario>` report paths). A full repository sweep confirms these are the only
project surfaces that reference the affected behavior — the `wordpress-development` skill does
not reference the eval suite, and `skillsmith.config.ts`, the prompt files, and `.rp.md` are
reasonably excluded. The test-first reality is enforced everywhere: every task mandates the
"not executed / not green / no golden implementations" note, with Task 1 calling it
"mandatory and load-bearing." The Guardrail-scopes section correctly renders `None`/`None`
(this project defines no deterministic gates, confirmed against conventions and the code
plan), so there were no commands to execute. Each task names a concrete audience, a concrete
file path, what it must convey, and the shipped artifacts it documents, with multiple
evaluable, drift-resistant acceptance criteria consistent with the spec criteria and code
tasks they trace to.

A particular strength: the plan anticipates the two highest drift hazards — the
folder-filtering CLI syntax and the report-location path shape (which the design keys on
`scenario.name`, not the directory path) — and explicitly defers both to shipped-behavior
verification rather than asserting a brittle example. The structural tokens it does name
(`scenario.yaml` field names, the `wp-skill/testing-block` block name, the three-level-up
`../../../utils/` import path, the three exception scenarios, and the `e2e-helpers.mjs`
module) are stable contract/invariant facts that I verified against the shipped code, and the
plan consistently directs the writer to "point at" rather than restate implementation
internals, keeping the guide drift-resistant.

## Issues

None. The plan is approved as written.

### Verification notes (for the record)

- **Surfaces.** Swept `*.md`, `*.ts`, `*.mjs`, `*.json`, `*.js` repo-wide (excluding
  `node_modules`, `.git`, `.pipelines`). Only `README.md` carries the affected behavior; no
  `eval/README.md` or `eval/scenarios/README.md` exists today. Both surfaces are covered.
- **Stale README content confirmed.** `README.md` line 31 ("the bare directory names under
  `eval/scenarios/` (e.g. `counter`, `async-fetch`)"), line 33 (`npx skillsmith counter`), and
  lines 49-50 (`iteration-N/<scenario>/...` report paths) match exactly what Task 4 targets.
- **Conventions grounded in shipped code.** Block name `wp-skill/testing-block`, the current
  flat import depth `../../utils/` (→ nested `../../../utils/`), the rubric's `data-wp-on*`
  bullet still listing `data-wp-on-async--<event>`, and the `scenario.yaml` field set
  (`name`/`description`/`skills`/`prompt`/`acceptance`/`rubrics`) all verified present.
- **Counts.** Code-plan mapping table has exactly 68 scenario rows across 12 groups;
  `base/0-intent/proposal.md` (the authoritative enumeration) exists.
- **Scope and exclusions.** The rubric edit and `eval/prompts/testing-agent.md` are reasonably
  excluded; no task plans code; out-of-scope items (reference improvement, Skillsmith source,
  re-curation) are respected.
- **Guardrail scopes.** Rendered `None`/`None`; no scoped gate was passed and the project
  defines none, so the single `None` row is the correct rendering. No commands to validate.
