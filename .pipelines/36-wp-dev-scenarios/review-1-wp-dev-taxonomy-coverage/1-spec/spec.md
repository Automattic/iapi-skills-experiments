# Spec: Exhaustive WordPress-development scenario taxonomy + first-area scenarios

## Overview

The `wordpress-development` skill is evaluated by a Skillsmith-based suite under `eval/`. A first batch (v1) added four scenarios beyond the Interactivity API suite — `filter-body-class` (Hooks/Filters), `shortcode-with-attr` (Shortcodes), `cpt-register` (Custom Post Types), and `rest-custom-endpoint` (custom REST endpoints) — but the suite still covers only a small slice of the WordPress-development domain documented at developer.wordpress.org. There is no organizing map of what the full domain contains, so coverage cannot be planned or measured, and follow-up work has nothing to draw from.

This review establishes that organizing backbone and begins filling it in, **batched by area**. It delivers three things: (1) an **exhaustive area → sub-area taxonomy** covering every top-level area of developer.wordpress.org (its Documentation handbooks and its API Reference); (2) a committed **candidate catalog** of prospective scenarios spanning that taxonomy, mirroring the shape of the existing `eval/scenarios/_candidates.yaml`; and (3) **implemented scenarios for exactly one foundational area** — approximately one simple scenario per major sub-area of that area, excluding the sub-areas already covered by v1. The taxonomy and catalog are broad (all areas); only the first area is implemented now, with the remaining areas left as explicit follow-up reviews. The skill itself is not changed: the taxonomy and catalog are planning artifacts and the scenarios lead, with the skill catching up in later work.

The first area is **not fixed by this spec** — it is selected and justified during the design phase against the checkable criteria below. Likewise, the exact taxonomy contents, the catalog's file path/name, and the specific scenarios are design/plan decisions. The spec sets the criteria and the "done" bar, not the answers. Verification is **static/structural only**: scenarios must be discoverable by Skillsmith and their e2e specs (where present) loadable by Playwright; scenarios are not required to pass against the current skill, and agents do not run the full evaluation matrix or boot `wp-env`.

For context, each implemented scenario follows the established Skillsmith conventions already used by the v1 and Interactivity API scenarios:
- A directory `eval/scenarios/<name>/` that is an immediate (flat) child of `eval/scenarios/`, containing a `scenario.yaml` and, where applicable, an `e2e.spec.mjs`.
- `scenario.yaml` keys: `name`, `description`, `skills: [wordpress-development]`, `prompt`, `acceptance` (scenario-specific success points), and `rubrics` (a list, `[]` when none).
- Skillsmith discovers only immediate children of `eval/scenarios/` that contain a `scenario.yaml`; nested directories and non-directory/leading-underscore files are skipped. This is why a catalog file can sit safely among real scenario directories.

## Requirements

### A. Reference taxonomy (exhaustive)

1. **Exhaustive area → sub-area taxonomy.** The review delivers a committed taxonomy mapping every top-level area of developer.wordpress.org — both its Documentation handbooks and its API Reference — to its major sub-areas. The Documentation areas covered are at least: Block Editor, Themes, Plugins, Common APIs, Advanced Administration, and Coding Standards (plus WordPress Playground where relevant). The API Reference areas covered are at least: Code Reference, REST API, and WP-CLI Commands. "Exhaustive" applies to the area layer (all ~10 top-level areas present) and to each area's major sub-areas as enumerated from the site navigation.

2. **Traceable and drift-auditable.** Every taxonomy area and sub-area traces to a concrete developer.wordpress.org URL. The taxonomy is recorded as a dated, source-URL-bearing point-in-time snapshot rather than a frozen contract, so future reviews can detect and refresh drift. The area layer is treated as stable; the sub-area leaf layer is expected to need periodic refresh.

### B. Candidate catalog

3. **Committed candidate catalog mirroring the `_candidates.yaml` precedent.** The review delivers a committed candidate catalog whose entries mirror the shape of the existing `eval/scenarios/_candidates.yaml`: a flat list of candidate records, grouped by area, each carrying at least an intended scenario `name`, a one-line `description`, the concept(s) covered, and source provenance (a developer.wordpress.org URL / path). The catalog covers the taxonomy broadly — at minimum every top-level area is represented, ideally with one candidate per major sub-area. Entry depth may be lighter for not-yet-implemented areas; only the first area's chosen scenarios require fully-authored `prompt` + `acceptance` records in the catalog.

4. **Catalog preserves flat discovery and is distinct from the iAPI catalog.** Wherever the taxonomy/catalog artifact lives, it does not break Skillsmith's flat scenario discovery: if placed inside `eval/scenarios/`, it is a non-directory file and/or uses a leading-underscore name so the discovery guards skip it. It is a real committed repo artifact (not pipeline-only), and it is clearly distinguishable from the Interactivity-API-specific `_candidates.yaml`. The exact path and filename are a design-phase decision subject to these constraints.

### C. First-area selection and implementation

5. **One foundational, non-saturated first area, justified.** The review implements scenarios for exactly ONE top-level area, chosen and justified by the design phase against checkable criteria:
   - (a) **Non-saturation** — the area has multiple major sub-areas not already covered by the v1 batch (after subtracting Hooks/Filters, Shortcodes, Custom Post Types, and custom REST endpoints, enough sub-areas remain to host ~1 scenario each).
   - (b) **Foundational / broad applicability** — argued by showing at least two of its sub-areas are prerequisites reused across other WordPress-development areas.
   - (c) **Simple-scaffoldable** — each chosen sub-area yields a one-concept / one-small-feature scenario implementable as a single scaffolded-plugin edit.
   - (d) **E2e-feasible** — the area contains at least some sub-areas whose behavior is observable in a booted `wp-env` site.
   - (e) **Documentation-grounded and drift-stable** — every chosen sub-area traces to a concrete developer.wordpress.org page, favoring stable handbook structures.
   - (f) **Tool-agnostic-promptable** — each chosen sub-area is expressible as a user-voice, outcome-phrased prompt.

   Saturated areas, niche server-ops or tooling areas (Advanced Administration, WP-CLI, Playground), and 100%-judge-only areas (Coding Standards) are weak first-area picks.

6. **~1 simple scenario per major un-covered sub-area.** The first area is implemented as approximately one simple scenario per major sub-area of that area not already covered by v1. Each scenario is a single focused task exercising one concept in one plugin, with a handful of acceptance points — on par with the existing v1 and Interactivity API scenarios. No multi-feature, multi-step, or otherwise complex scenarios.

7. **No duplication with the v1 batch (sub-area level).** No newly implemented scenario duplicates a sub-area already covered by the v1 batch: Hooks/Filters (via `filter-body-class`), Shortcodes (`shortcode-with-attr`), Custom Post Types (`cpt-register`), or custom REST endpoints (`rest-custom-endpoint`). Duplication is judged at the sub-area level, because these topics are dual-documented across multiple handbooks and no top-level area is 100% clean of them.

8. **Documentation-driven, user-voice, tool-agnostic.** Every implemented scenario is grounded in developer.wordpress.org: each acceptance point traces to an official documentation page (cited URL), and each `prompt` reads like a real user's outcome-phrased request that does NOT name the tool, API, function, framework, or technology to use. Deciding the approach is the skill's job.

### D. Scenario shape and verification

9. **Schema-conformant scenarios.** Each implemented scenario is a directory that is an immediate child of `eval/scenarios/` containing a `scenario.yaml` with exactly the required keys: `name` (lowercase-kebab matching `/^[a-z0-9-]+$/` and equal to the directory name), `description`, `skills: [wordpress-development]`, `prompt`, `acceptance` (a list of scenario-unique checks), and `rubrics` (present as an array). Catalog-only fields (`difficulty`, `concepts`, `source`, `source_files`) do not appear in a `scenario.yaml`.

10. **Default zero shared rubrics; `rubrics: []`.** Each new scenario declares `rubrics: []` by default and no new shared rubric is added, mirroring the v1 outcome. A new shared rubric under `eval/rubrics/` is added only if a genuinely cross-cutting check is shared across multiple of this review's scenarios; if added, it is simple and general and is never duplicated in any scenario's `acceptance` list. The `rubrics:` key is always present (never omitted), even when empty.

11. **Mixed verification bar.** For each implemented scenario whose behavior is observable in a real runtime, the scenario directory includes an `e2e.spec.mjs` following the established v1 lifecycle: it imports `{ expect, test }` from `@wordpress/e2e-test-utils-playwright` and `deactivateAllPlugins` from the e2e utils; in `beforeAll` it deactivates all plugins then activates `plugin-<name>-${agentId}` (optionally seeding posts); in `afterAll` it deactivates all plugins (and deletes any seeded posts); and its assertions are observable in a booted `wp-env` site (DOM state, rendered post content, or REST status/JSON). Every literal the e2e asserts (CSS class, slug, route, attribute value) is pinned in that scenario's `prompt`, so prompt and assertion stay in lockstep. Where a real-runtime check is impractical, a judge-only scenario (no `e2e.spec.mjs`, graded against `acceptance`) is acceptable.

12. **Well-formed and runnable, not required to pass.** Each implemented scenario is statically/structurally verified to be DISCOVERABLE (passes Skillsmith's `isScenarioShape`) and, where an `e2e.spec.mjs` is present, LOADABLE/COLLECTABLE by Playwright (the spec parses and its imports resolve) — i.e. `npx skillsmith <scenario-dir>` would execute to a graded result without harness or configuration errors. A failing grade against the current skill is acceptable and does not violate this bar. Agents do not run the full `scenarios × testing-agents` matrix, do not boot `wp-env` for a real pass, and do not generate the plugin code; full-matrix execution remains the owner's manual step.

### E. Integration and non-disruption

13. **Skill untouched.** No file under `skills/wordpress-development/` is modified by this review.

14. **Builds on the existing suite without disruption.** The existing scenarios (the Interactivity API suite and the four v1 scenarios) and the existing `_candidates.yaml` are not reorganized, moved, or broken, and Skillsmith's flat discovery under `eval/scenarios/` continues to work. New scenario directories are added as flat immediate children of `eval/scenarios/`.

## Out of Scope

1. **Implementing the other areas.** Only the first area's scenarios are implemented this run; the remaining ~9 areas are explicit follow-up reviews. The whole catalog is NOT implemented in one run.
2. **Any change to the skill** (`skills/wordpress-development/`).
3. **Nested scenario folders / area-directory nesting.** Structure is expressed as a catalog/taxonomy document plus naming conventions, never as nested directories (flat discovery would not see them).
4. **Reorganizing or moving existing scenarios** (the Interactivity API suite, the v1 scenarios) or the existing `_candidates.yaml`.
5. **Requiring scenarios to pass against the current skill, or running the full `scenarios × testing-agents` matrix / booting `wp-env` for a live pass.** Well-formedness/runnability (discoverable + e2e-loadable) is the bar; full-matrix runs remain the owner's manual step.
6. **Fully-authoring scenario-quality prompt+acceptance records for every sub-area across all areas.** Only the first area's chosen scenarios are fully authored; other areas' catalog entries may be lighter candidate records.
7. **Scenarios grounded in non-official sources.** All taxonomy entries and scenario acceptance points derive from developer.wordpress.org and its sublinks.
8. **Adding shared rubrics by default.** Zero new rubrics is the expected outcome; a rubric is added only on a genuinely cross-cutting shared check across this review's scenarios.
9. **Performing the exhaustive developer.wordpress.org sweep and the specific first-area pick in this spec phase.** Both are performed in the design phase.

## Acceptance Criteria

1. **Exhaustive taxonomy delivered**
   Given the completed review, When inspecting the committed taxonomy artifact, Then every top-level developer.wordpress.org area is present — at least Block Editor, Themes, Plugins, Common APIs, Advanced Administration, and Coding Standards from Documentation, and Code Reference, REST API, and WP-CLI Commands from the API Reference — and each lists its major sub-areas.

2. **Taxonomy is traceable and dated**
   Given any area or sub-area in the taxonomy, When reviewing its record, Then it carries a developer.wordpress.org source URL, and the artifact is marked as a dated point-in-time snapshot.

3. **Candidate catalog present and broad**
   Given the committed candidate catalog, When reading it, Then its entries mirror the `_candidates.yaml` record shape (each with at least `name`, a one-line `description`, concept(s), and a source URL/path), every top-level area is represented, and the first area's chosen scenarios carry fully-authored `prompt` + `acceptance` records.

4. **Catalog does not break discovery and is distinct from the iAPI catalog**
   Given the catalog/taxonomy artifact, When checking its location and name, Then it is a real committed repo file that — if placed under `eval/scenarios/` — is a non-directory and/or leading-underscore file that Skillsmith's discovery skips, and its name/header clearly distinguishes it from the Interactivity-API `_candidates.yaml`. And given Skillsmith discovery is run, Then the artifact is not enumerated as a scenario.

5. **Exactly one area implemented, with justification**
   Given the implemented scenarios, When mapping them to top-level areas, Then they all belong to a single area; And given the design rationale, Then it justifies that pick against criteria (a)–(f) of Requirement 5 with cited sub-area URLs.

6. **One simple scenario per major un-covered sub-area**
   Given the chosen area's major sub-areas with the v1-covered sub-areas removed, When counting implemented scenarios, Then there is roughly one simple scenario per remaining major sub-area, and each scenario is a single one-concept / one-small-feature task with a handful of acceptance points (no multi-feature or multi-step tasks).

7. **No v1 sub-area duplication**
   Given each newly implemented scenario, When identifying its sub-area, Then it is none of Hooks/Filters, Shortcodes, Custom Post Types, or custom REST endpoints (the v1 four), evaluated at the sub-area level.

8. **Documentation-traceable, user-voice, tool-agnostic prompts**
   Given any newly implemented scenario, When reading its `prompt`, Then it is phrased as a user-style request by desired outcome and does not name the tool/API/function/technology to use; And When reviewing its `acceptance` points, Then each is supported by an official developer.wordpress.org documentation page (cited URL).

9. **Schema conformance**
   Given any newly implemented scenario's `scenario.yaml`, When reading it, Then it has `name` (lowercase-kebab matching `/^[a-z0-9-]+$/` and equal to the directory name), `description`, `skills: [wordpress-development]`, `prompt`, `acceptance`, and `rubrics` present as an array; And it contains no catalog-only fields (`difficulty`, `concepts`, `source`, `source_files`).

10. **Default zero rubrics**
    Given the newly implemented scenarios, When reading each `rubrics` key, Then it is present as `[]` by default; And given any new shared rubric was added under `eval/rubrics/`, Then a genuinely cross-cutting check is shared across multiple of this review's scenarios, the rubric is simple and general, and the check is not duplicated in any scenario's `acceptance` list.

11. **Mixed verification present and correct**
    Given a newly implemented scenario whose behavior is observable in a real runtime, Then its directory includes an `e2e.spec.mjs` that follows the v1 lifecycle (imports `{ expect, test }` from `@wordpress/e2e-test-utils-playwright` and `deactivateAllPlugins` from the e2e utils; `beforeAll` deactivates all plugins then activates `plugin-<name>-${agentId}`; `afterAll` deactivates all plugins) and whose assertions are observable in a booted `wp-env` site; And every literal the e2e asserts is pinned in that scenario's `prompt`; And given a scenario where an e2e check is impractical, Then it may omit the e2e spec and be graded by judge against `acceptance`.

12. **Discoverable and e2e-loadable, pass not required**
    Given any newly implemented scenario, When it is statically/structurally verified, Then it passes Skillsmith's `isScenarioShape` (so it is discoverable) and any present `e2e.spec.mjs` parses and resolves its imports under Playwright collection — such that `npx skillsmith <scenario-dir>` would execute to a graded result without harness or configuration errors; And a failing grade against the current skill does not violate this criterion; And no agent runs the full `scenarios × testing-agents` matrix, boots `wp-env` for a real pass, or generates the plugin code.

13. **Skill unchanged**
    Given the review's diff, When inspecting paths under `skills/wordpress-development/`, Then no file there is modified.

14. **Existing suite intact**
    Given the review's diff, When inspecting the existing scenarios (Interactivity API suite and the four v1 scenarios) and the existing `_candidates.yaml`, Then none of them are moved, renamed, reorganized, or otherwise broken, and Skillsmith's flat discovery still enumerates them; And any new scenario directories are flat immediate children of `eval/scenarios/`.
