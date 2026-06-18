# Spec: Block Editor scenarios + scenario-folder organization

## Overview

The `wordpress-development` skill is evaluated by a Skillsmith-based suite under `eval/`. A prior review established a broad area → sub-area taxonomy of developer.wordpress.org, a committed candidate catalog (`eval/scenarios/_wp-dev-candidates.yaml`), and implemented scenarios for one foundational area (Plugins). The suite now holds 21 scenarios — 11 Interactivity API, 4 v1 (Hooks/Filters, Shortcodes, Custom Post Types, custom REST endpoints), and 6 Plugins — but the **Block Editor** area is still uncovered as a topic: all existing block-based scenarios build on a single scaffold-provided block (`wp-skill/testing-block`) and exercise Interactivity API client logic, never block-registration mechanics, supports, variations, styles, bindings, or filters as a concept.

This review extends coverage to the **Block Editor** area with a small batch of simple, documentation-grounded scenarios — approximately one per major uncovered Block Editor sub-area — reusing (not rebuilding) the existing taxonomy and catalog. In parallel, it answers a standing question the owner raised: **can scenarios be organized into topic folders under `eval/scenarios/`?** Skillsmith's scenario discovery enumerates only the immediate children of `eval/scenarios/`, so real nested subdirectories are not a free change. The review therefore requires a recorded exploration of the folder options with a clear recommendation, and adopts only a low-risk organization for the new scenarios. As before, the skill itself is not modified — the scenarios lead and the skill catches up in later work; verification is **static/structural only** (scenarios discoverable by Skillsmith and any e2e specs loadable by Playwright), and scenarios are not required to pass against the current skill.

The exact sub-area picks, each scenario's contents, the final folder decision, and any directory-naming scheme are **design/plan decisions**. This spec sets the selection criteria, the per-scenario shape, the catalog-consistency rules, the folders-exploration bar, and the "done" bar — not the answers.

For context, each implemented scenario follows the established Skillsmith conventions already used by the existing scenarios:
- A directory `eval/scenarios/<name>/` that is a flat immediate child of `eval/scenarios/`, containing a `scenario.yaml` and, where applicable, an `e2e.spec.mjs`.
- `scenario.yaml` keys: `name`, `description`, `skills: [wordpress-development]`, `prompt`, `acceptance` (scenario-specific success points), and `rubrics` (a list, `[]` when none).
- Skillsmith discovers only immediate children of `eval/scenarios/` that contain a `scenario.yaml`; nested directories and non-directory/leading-underscore files are skipped. This is why a catalog file (`_wp-dev-candidates.yaml`) can sit safely among real scenario directories.
- The block scaffold provides ONE block whose name (`wp-skill/testing-block`) and registration mechanism are fixed, but whose `block.json` contents and `render.php` are agent-editable; PHP-only Block Editor APIs are registered in the plugin's `index.php`.

## Requirements

### A. Block Editor scenario selection and scope

1. **One area only: Block Editor.** Every newly implemented scenario in this review belongs to the Block Editor area. No newly implemented scenario targets any other top-level area, and the existing Interactivity API, v1, and Plugins scenarios are not re-scoped.

2. **Approximately one simple scenario per major uncovered Block Editor sub-area.** The review implements roughly one simple scenario per major uncovered Block Editor sub-area. The "major sub-areas" are the prior taxonomy's coarse "Block API" row refined into its concept-level sub-areas (e.g. block registration, dynamic/server-rendered blocks, block supports, block variations, block styles, block bindings, InnerBlocks), plus the editor "Hooks/Filters" row (block filters). The Interactivity API sub-area is excluded, being already saturated by the existing 11 Interactivity API scenarios.

3. **Each scenario is one concept, one small feature.** Each implemented scenario is a single one-concept / one-small-feature task realizable as a single scaffolded-plugin edit, with a handful of acceptance points. No multi-feature, multi-step, multi-block, or parent/child scenarios.

4. **Batch size comparable to prior reviews.** The implemented batch is on the scale of prior reviews (v1 = 4, Plugins = 6) — roughly 4–6 scenarios. Not every uncovered sub-area must be implemented.

5. **Defer-with-reason for sub-areas that don't fit.** Any major uncovered Block Editor sub-area that is NOT implemented as a scenario is recorded in the catalog as a lighter stub carrying a brief recorded reason, so the area stays broadly represented and the omission is traceable. Recognized reasons for not implementing a sub-area are: it cannot be scoped to one simple concept; it has no clean testable surface or is inherently contrived/multi-concept; it overlaps an already-saturated area; or it is niche/heavy/awkward to express as a simple single-block-scaffold edit. In particular, sub-areas that cannot be a simple single-block edit (e.g. InnerBlocks parent/child, multi-block patterns) are deferred to catalog stubs rather than forced into a scenario.

6. **No duplication with already-covered sub-areas.** No newly implemented scenario duplicates a sub-area already covered by the Interactivity API suite, by the v1 four (Hooks/Filters, Shortcodes, Custom Post Types, custom REST endpoints), or by the six Plugins scenarios. Duplication is judged at the sub-area level.

### B. Per-scenario shape and verification

7. **Mixed verification — e2e where front-end-observable, judge-only otherwise; judge-only is first-class.** Each implemented scenario whose effect is observable in a booted `wp-env` site (front-end DOM, rendered post content, or REST) ships an `e2e.spec.mjs` following the established lifecycle (deactivate all plugins, then activate `plugin-<name>-${agentId}`, optionally seed a post containing `<!-- wp:wp-skill/testing-block … -->`, assert on the rendered `.wp-block-wp-skill-testing-block` output, deactivate all plugins in teardown). Front-end-visible sub-areas (dynamic/server-rendered blocks, block supports, block bindings, and block styles with style-bearing seeded markup) are the natural e2e set. Scenarios whose effect is editor-only (e.g. block variations, block filters, or style registration with no rendered class) ship as judge-only — no `e2e.spec.mjs`, graded against `acceptance` — and are equally valid deliverables, not lesser ones. Every literal an e2e asserts (CSS class, slug, attribute value, rendered text) is pinned in that scenario's `prompt`, so prompt and assertion stay in lockstep.

8. **Realizable within the fixed block scaffold.** Each implemented scenario is realizable as an edit to the existing scaffolded block plugin without changing the block's fixed name (`wp-skill/testing-block`) or its registration mechanism: block supports / attributes / styles via the block's `block.json` contents, server output via `render.php`, and PHP-only Block Editor APIs (e.g. pattern, binding, or style registration) via the plugin's `index.php`. No newly implemented scenario requires a second block type or a renamed block.

9. **Schema-conformant, tool-agnostic, doc-grounded scenarios.** Each implemented scenario is a directory that is a flat immediate child of `eval/scenarios/`, containing a `scenario.yaml` with exactly `name` (lowercase-kebab matching `/^[a-z0-9-]+$/`, equal to the directory name), `description`, `skills: [wordpress-development]`, `prompt`, `acceptance` (scenario-unique check statements), and `rubrics` (present as an array). The `prompt` reads as a user-voice, outcome-phrased request that does NOT name the tool, API, function, framework, or technology to use; the `acceptance` strings are clean, human-readable check statements with no embedded source URLs; and no catalog-only fields (`difficulty`, `concepts`, `source`, `source_files`) appear in any `scenario.yaml`. Each scenario's documentation grounding traces to developer.wordpress.org via its catalog entry's provenance.

10. **Default zero shared rubrics.** Each new scenario declares `rubrics: []` by default. No new shared rubric under `eval/rubrics/` is added unless a genuinely cross-cutting check is shared across multiple of this review's scenarios; if one is added, it is simple and general and is never duplicated in any scenario's `acceptance`. The `rubrics:` key is always present, even when empty.

### C. Catalog update

11. **Full catalog record per implemented scenario (1:1 identity).** For each implemented Block Editor scenario, `_wp-dev-candidates.yaml` contains a full record under the Block Editor area whose `name` equals the scenario's directory name and its `scenario.yaml` `name`, carrying the same `prompt` and `acceptance` text as the shipped `scenario.yaml`, plus `source_files` citing the developer.wordpress.org page(s) that ground its acceptance points. Provenance (source URLs) lives only in the catalog record's `source_files`, never in the `scenario.yaml`.

12. **No stale or mismatched stubs; naming reconciled.** After the update, every implemented Block Editor sub-area is represented by exactly one full catalog record under its final scenario name. The two pre-existing concept-named Block Editor stubs (`block-api-static-block`, `block-filter-add-custom-attribute`) are either promoted-and-renamed to the implemented scenario names or left as lighter stubs for still-unimplemented sub-areas — leaving no orphaned stub that duplicates an implemented sub-area and no name mismatch between a catalog record and its scenario directory.

13. **iAPI catalog and non-Block-Editor records untouched.** The Interactivity-API catalog `_candidates.yaml` is not modified. Within `_wp-dev-candidates.yaml`, only Block Editor records (and any Block Editor stubs) are added or promoted; the other areas' records are not rebuilt or re-derived.

### D. Folders exploration (key new requirement)

14. **The design records the folders exploration.** The design phase delivers, as an inspectable record, an evaluation of whether Block Editor (and future) scenarios can be organized into topic folders under `eval/scenarios/`, given that Skillsmith's scenario discovery enumerates only the immediate children of `eval/scenarios/` and lives in an external pinned dependency (in gitignored `node_modules`). The record assesses at least three options — (i) real subdirectories via a harness/config change, (ii) naming-convention pseudo-folders (area-prefixed flat scenario names, e.g. `block-editor-*`), and (iii) staying flat — with the cost/risk of each, and notes the concrete breakage real nesting would cause: Skillsmith would not discover a nested `scenario.yaml`; nested e2e specs' relative imports into `eval/utils` and the harness's spec-location/failure-attribution would break; and the test runner would still collect nested specs, creating a discover-vs-grade mismatch.

15. **A clear recommendation, adopting only the low-risk path.** The design states a single clear recommendation with rationale. Real subdirectories are treated as NOT low-risk — they require changing an external pinned dependency plus multiple in-repo coupling points — and are therefore surfaced only as a future recommendation contingent on an upstream Skillsmith change, not adopted in this review. Only a low-risk organization is adopted for the new scenarios: either the naming-convention pseudo-folder approach or staying flat, both of which leave Skillsmith discovery, the e2e lifecycle, the harness's spec-location/attribution, the test runner's collection, and the scaffold unchanged. Any adopted naming scheme is internally consistent (a single, uniform convention) and discovery-safe (every scenario remains a flat immediate child whose name matches `/^[a-z0-9-]+$/`).

16. **Existing scenarios not reorganized.** A large reorganization or renaming of the existing 21 scenarios is out of scope; they keep their current flat names and locations. The folders decision applies only to the new Block Editor scenarios (and is surfaced as a recommendation for the wider suite), unless a reorganization is trivially safe. If the pseudo-folder convention is adopted, the new scenario directory names, their `scenario.yaml` `name`, and their catalog records all use the same final names consistently.

### E. Done-criteria and non-disruption (inherited from the prior review)

17. **Well-formed and runnable, not required to pass.** Each implemented scenario is statically/structurally verified to be discoverable by Skillsmith (passes its scenario-shape check) and, where an `e2e.spec.mjs` is present, loadable/collectable by the test runner (the spec parses and its imports resolve) — such that running Skillsmith on the scenario directory would execute to a graded result without harness or configuration errors. A failing grade against the current skill is acceptable and does not violate this bar. No agent runs the full `scenarios × testing-agents` matrix, boots `wp-env` for a real pass, or generates the plugin code.

18. **Skill untouched.** No file under `skills/wordpress-development/` is modified by this review.

19. **Existing suite intact; flat discovery preserved.** The existing Interactivity API suite, the v1 and Plugins scenarios, and the existing `_candidates.yaml` are not moved, renamed, reorganized, or broken; Skillsmith's flat discovery under `eval/scenarios/` continues to enumerate them; and any new scenario directories are flat immediate children of `eval/scenarios/`.

## Out of Scope

1. **Implementing the other top-level areas**, or rebuilding/re-deriving the taxonomy or the whole catalog — the prior review's artifacts are reused, not rebuilt.
2. **Any change to the skill** (`skills/wordpress-development/`).
3. **Enabling real nested scenario subdirectories** (requires an upstream/external Skillsmith change; surfaced as a future recommendation only, not adopted).
4. **A large reorganization or renaming of the existing 21 scenarios**, or any change to the iAPI `_candidates.yaml`.
5. **Requiring scenarios to pass against the current skill, running the full `scenarios × testing-agents` matrix, or booting `wp-env` for a live pass.** Well-formedness/runnability (discoverable + e2e-loadable) is the bar.
6. **Generating the plugin code for any scenario**, or authoring full prompt+acceptance for sub-areas beyond the implemented Block Editor set (deferred sub-areas stay lighter stubs).
7. **Adding shared rubrics by default.**
8. **Multi-block / parent-child scenarios** (e.g. InnerBlocks parent/child, multi-block patterns) that exceed a simple single-block-scaffold edit — deferred to catalog stubs.

## Acceptance Criteria

1. **One area: Block Editor**
   Given the newly implemented scenarios, When mapping each to a top-level area, Then every one belongs to the Block Editor area, and the existing Interactivity API, v1, and Plugins scenarios are unchanged in scope.

2. **One simple scenario per major uncovered sub-area**
   Given the Block Editor sub-areas (the refined "Block API" concept-level sub-areas plus block filters, excluding the saturated Interactivity API), When counting the newly implemented scenarios, Then there is roughly one simple scenario per implemented major uncovered sub-area, and each is a single one-concept / one-small-feature task with a handful of acceptance points — no multi-feature, multi-step, multi-block, or parent/child tasks.

3. **Batch size comparable to prior reviews**
   Given the newly implemented scenarios, When counting them, Then the count is on the scale of prior reviews (roughly 4–6), and not every uncovered sub-area is necessarily implemented.

4. **Defer-with-reason recorded**
   Given any major uncovered Block Editor sub-area that was not implemented as a scenario, When inspecting the catalog, Then it appears as a lighter stub carrying a brief recorded reason drawn from the recognized triggers (not scopeable to one concept, no clean testable surface / contrived-or-multi-concept, overlaps a saturated area, or niche/heavy/awkward); And given a sub-area that cannot be a simple single-block edit (e.g. InnerBlocks parent/child, multi-block patterns), Then it is deferred to a catalog stub rather than implemented.

5. **No duplication with covered sub-areas**
   Given each newly implemented scenario, When identifying its sub-area, Then it is none of the Interactivity API sub-area, the v1 four (Hooks/Filters, Shortcodes, Custom Post Types, custom REST endpoints), or the six Plugins sub-areas, evaluated at the sub-area level.

6. **Mixed verification present and correct**
   Given a newly implemented scenario whose effect is observable in a booted `wp-env` site, Then its directory includes an `e2e.spec.mjs` that follows the established lifecycle (deactivate all plugins, activate `plugin-<name>-${agentId}`, optionally seed a `wp:wp-skill/testing-block` post, assert on the rendered `.wp-block-wp-skill-testing-block` output, deactivate all plugins in teardown) with assertions observable in the booted site; And every literal the e2e asserts is pinned in that scenario's `prompt`; And given a scenario whose effect is editor-only, Then it omits the `e2e.spec.mjs` and is graded by judge against `acceptance`, and is treated as an equally valid deliverable.

7. **Realizable within the fixed block scaffold**
   Given each newly implemented scenario, When inspecting what it asks for, Then it is realizable as an edit to the existing scaffolded block plugin without changing the block's fixed name (`wp-skill/testing-block`) or registration mechanism, and it does not require a second block type — supports/attributes/styles go via `block.json`, server output via `render.php`, and PHP-only Block Editor APIs via `index.php`.

8. **Schema conformance, tool-agnostic, doc-grounded**
   Given any newly implemented scenario's `scenario.yaml`, When reading it, Then it has exactly `name` (lowercase-kebab matching `/^[a-z0-9-]+$/` and equal to the directory name), `description`, `skills: [wordpress-development]`, `prompt`, `acceptance`, and `rubrics` present as an array, with no catalog-only fields (`difficulty`, `concepts`, `source`, `source_files`); And When reading its `prompt`, Then it is a user-voice, outcome-phrased request that does not name the tool/API/function/technology; And When reading its `acceptance` strings, Then they are clean human-readable checks with no embedded URLs; And When inspecting its catalog entry, Then the developer.wordpress.org page(s) grounding its acceptance points are cited there.

9. **Default zero rubrics**
   Given each newly implemented scenario, When reading its `rubrics` key, Then it is present as `[]` by default; And given any new shared rubric was added under `eval/rubrics/`, Then a genuinely cross-cutting check is shared across multiple of this review's scenarios, the rubric is simple and general, and the check is not duplicated in any scenario's `acceptance`.

10. **Full catalog record per implemented scenario (1:1 identity)**
    Given each newly implemented Block Editor scenario, When inspecting `_wp-dev-candidates.yaml`, Then there is exactly one full Block Editor record whose `name` equals the scenario's directory name and its `scenario.yaml` `name`, whose `prompt` and `acceptance` text match the shipped `scenario.yaml`, and whose `source_files` cite the developer.wordpress.org page(s) grounding its acceptance points; And no source URL appears in the `scenario.yaml`.

11. **No stale or mismatched stubs; naming reconciled**
    Given the updated catalog, When inspecting the Block Editor records, Then every implemented sub-area has exactly one full record under its final scenario name, the pre-existing stubs (`block-api-static-block`, `block-filter-add-custom-attribute`) are either promoted-and-renamed to implemented scenario names or left as lighter stubs for still-unimplemented sub-areas, and there is no orphaned stub duplicating an implemented sub-area and no name mismatch between any catalog record and its scenario directory.

12. **iAPI catalog and other records untouched**
    Given the review's diff, When inspecting `eval/scenarios/_candidates.yaml` and the non-Block-Editor records in `_wp-dev-candidates.yaml`, Then `_candidates.yaml` is unmodified and only Block Editor records (and stubs) in `_wp-dev-candidates.yaml` are added or promoted.

13. **Folders exploration recorded**
    Given the design artifact, When reading it, Then it records an evaluation of organizing scenarios into topic folders that states Skillsmith discovery enumerates only immediate children of `eval/scenarios/` and lives in an external pinned dependency, assesses at least three options (real subdirectories, naming-convention pseudo-folders, staying flat) with each option's cost/risk, and notes the concrete breakage real nesting would cause (Skillsmith would not discover a nested `scenario.yaml`; nested e2e specs' imports into `eval/utils` and the harness's spec-location/attribution would break; the test runner would still collect nested specs, creating a discover-vs-grade mismatch).

14. **Recommendation adopts only the low-risk path**
    Given the design artifact, When reading its recommendation, Then it gives a single clear recommendation with rationale; real subdirectories are classified as not low-risk and surfaced only as a future recommendation contingent on an upstream Skillsmith change; And given the organization adopted for the new scenarios, Then it is either naming-convention pseudo-folders or staying flat — and if a naming scheme is adopted it is a single uniform convention with every scenario remaining a flat immediate child whose name matches `/^[a-z0-9-]+$/`, leaving discovery, the e2e lifecycle, the harness, the test runner, and the scaffold unchanged.

15. **Existing scenarios not reorganized; naming consistent**
    Given the review's diff, When inspecting the existing 21 scenarios, Then none are renamed, moved, or reorganized; And given the new scenarios under any adopted pseudo-folder convention, Then each scenario's directory name, its `scenario.yaml` `name`, and its catalog record `name` are identical and use the same convention.

16. **Discoverable and e2e-loadable, pass not required**
    Given any newly implemented scenario, When it is statically/structurally verified, Then it passes Skillsmith's scenario-shape check (so it is discoverable) and any present `e2e.spec.mjs` parses and resolves its imports under test-runner collection — such that running Skillsmith on the scenario directory would execute to a graded result without harness or configuration errors; And a failing grade against the current skill does not violate this criterion; And no agent runs the full `scenarios × testing-agents` matrix, boots `wp-env` for a real pass, or generates the plugin code.

17. **Skill unchanged**
    Given the review's diff, When inspecting paths under `skills/wordpress-development/`, Then no file there is modified.

18. **Existing suite intact; flat discovery preserved**
    Given the review's diff, When inspecting the existing Interactivity API suite, the v1 and Plugins scenarios, and the existing `_candidates.yaml`, Then none are moved, renamed, reorganized, or broken, Skillsmith's flat discovery still enumerates them, and any new scenario directories are flat immediate children of `eval/scenarios/`.
