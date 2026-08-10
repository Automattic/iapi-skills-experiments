# Docs Summary

## What

No documentation changes were needed for run `review-2-block-editor-and-folders`. The doc plan was empty by design (zero tasks), and an independent end-to-end sweep of the live repository — verified against the actually-shipped code — confirms no live documentation goes stale now that this run landed: five new `block-editor-*` scenarios (`block-editor-dynamic-block`, `block-editor-block-supports`, `block-editor-block-styles`, `block-editor-block-filters`, `block-editor-block-bindings`) plus the in-place Block Editor promotion of `eval/scenarios/_wp-dev-candidates.yaml` (five records promoted to full, three deferral stubs added, two pre-existing stubs retained, and its self-describing header line fixed by the code phase).

## Why

The project's live docs are deliberately drift-resistant about the eval suite: no live doc enumerates scenarios, claims a scenario count, asserts "all scenarios target the Interactivity API," describes a scenario-directory naming convention, or restates the candidate catalogs' per-record contents (the spec forbids duplicating `scenario.yaml`/catalog content in external docs precisely because it would drift). Because every doc that references the eval suite, the scenarios, the catalogs, the Block Editor area, or the block scaffold is written at a level of abstraction that this run does not invalidate, there was nothing live to update. An empty doc plan is the correct deliverable.

## How

I re-swept every live documentation surface myself rather than trusting the doc plan's recorded sweep, and checked each concrete claim against the shipped code and diff:

- **README "two candidate catalogs" pointer** — accurate after an in-place catalog edit; `ls eval/scenarios/` shows exactly the two `_`-prefixed catalogs (no rename, no third catalog), and the recorded role for `_wp-dev-candidates.yaml` still spans the developer.wordpress.org areas (Block Editor is one).
- **README `(e.g. counter, cpt-register)`** — an illustration of bare directory names, not an enumeration; both directories still exist; the new `block-editor-*` names do not falsify it.
- **No scenario-naming-convention doc exists** — the adopted `block-editor-*` pseudo-folder convention is a design-doc recommendation; no live doc describes any naming scheme, so prefixed names beside the non-prefixed 21 break nothing.
- **`eval/prompts/testing-agent.md`** — already mandates the fixed block name, fixed registration mechanism, and `get_block_wrapper_attributes()` wrapper behavior; the five scenarios consume this scaffold unchanged.
- **`_wp-dev-candidates.yaml` header-line fix** — verified in the code diff: now reads "for the implemented Plugins and Block Editor scenarios," accurately self-describing the file after promotion; the pre-edit wording would have been stale, but the fix is owned by the code phase.
- **Out of scope and unaffected** — the iAPI rubric, `eval/prompts/improver.md`, the iAPI `_candidates.yaml`, `.rp.md`, the README skill sentence, and the README run-mechanics sections.

No guardrail gates exist in this project (`package.json` exposes no lint/typecheck/unit/structural gate), so the accuracy spot-check above is the verification evidence.

## Key decisions

- **The empty doc plan is justified.** Every live doc surface remains accurate after the run lands; no documentation task was warranted.
- **Surfaces left deliberately untouched.** The README catalog pointer and `(e.g.)` example, `testing-agent.md`, the iAPI rubric, `improver.md`, `_candidates.yaml`, `.rp.md`, and the skill — each verified accurate or out of scope.
- **The one genuinely-staling surface is a code-phase surface, not a doc-phase miss.** The `_wp-dev-candidates.yaml` header is a self-describing planning/data file owned and fixed by the code phase; its refresh shipped with the catalog promotion.

## Known limitations

- A forward inconsistency is now present in the suite: the five new `block-editor-*` scenarios use an area prefix while the existing 21 scenarios keep non-prefixed names. This is recorded in the design doc as an accepted trade-off; a suite-wide naming convention is surfaced there as a future recommendation, not adopted here, and no live doc documents a naming convention, so nothing is stale.
- Provenance for the five new scenarios lives in the catalog records' `source_files` (owned by the code phase), not in any external doc — by design, to avoid drift.
