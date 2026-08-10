# Code Summary: Block Editor scenarios + scenario-folder organization

## What

Five new Block Editor scenario directories under `eval/scenarios/` — `block-editor-dynamic-block`, `block-editor-block-supports`, `block-editor-block-styles`, `block-editor-block-filters` (each with `scenario.yaml` + `e2e.spec.mjs`), and `block-editor-block-bindings` (`scenario.yaml` only, judge-only) — plus an in-place update of the Block Editor section of `eval/scenarios/_wp-dev-candidates.yaml` adding five full records, three deferral stubs, retaining two pre-existing stubs, and fixing a stale header line.

## Why

The `wordpress-development` skill evaluation suite had 21 scenarios covering the Interactivity API, v1 (Hooks/Filters, Shortcodes, Custom Post Types, REST endpoints), and Plugins areas, but the Block Editor area was entirely uncovered as a concept. This batch fills the gap with one simple, documentation-grounded scenario per major implementable Block Editor sub-area (dynamic/server-rendered blocks, block supports, block styles, block filters, block bindings), establishing the Block Editor area alongside the existing areas. It also answers the owner's standing question about scenario folder organization by adopting a `block-editor-` pseudo-folder naming convention — zero-risk visual grouping without any harness or Skillsmith change.

## How

All five scenario directories are flat immediate children of `eval/scenarios/` using the `block-editor-<concept>` prefix, keeping Skillsmith discovery, the `verify-e2e.ts` spec-location/attribution logic, and the `../../utils/wp-cli.mjs` import path all unchanged. Each scenario's `scenario.yaml` follows the established schema (`name`/`description`/`skills`/`prompt`/`acceptance`/`rubrics: []`, no catalog-only fields, no URLs). The four e2e scenarios reuse the existing block post-seed + render-assert lifecycle (mirroring `counter` and `fruit-list-each`): `beforeAll` deactivates all plugins, activates the scenario's plugin by slug derived from `workerInfo.project.metadata.agentId`, and seeds a published post containing `<!-- wp:wp-skill/testing-block … /-->`; `beforeEach` navigates to the rendered post; the single test asserts on `.wp-block-wp-skill-testing-block`; `afterAll` deactivates all plugins and deletes all posts. The judge-only scenario ships only `scenario.yaml`. The catalog update adds five full records (identical `prompt`/`acceptance` to the shipped `scenario.yaml` files, plus `source_files` with developer.wordpress.org provenance) and three lighter deferral stubs.

## Key decisions

- **`block-editor-` pseudo-folder naming (not real subdirectories).** Real subdirectories would break Skillsmith discovery (its `enumerate.ts` reads only immediate children non-recursively), the `../../utils` import depth in every e2e spec, `verify-e2e.ts` spec-location and failure attribution, and cause a Playwright-collects-but-Skillsmith-skips discover-vs-grade mismatch. The `block-editor-` prefix delivers the same visual grouping at zero harness risk, with every scenario remaining a flat immediate child whose name matches `/^[a-z0-9-]+$/`.

- **Mixed e2e/judge-only verification.** Dynamic block, supports, styles, and filters each yield a deterministic assertion on `.wp-block-wp-skill-testing-block` via the existing post-seed lifecycle. Block bindings can only be observed on `core/paragraph` (the testing-block is not a binding-supported block), so seeding binding metadata and asserting on `<p>` text would deviate from the standard lifecycle; judge-only is the correct, first-class verification channel for that scenario.

- **Seeding block-comment attributes for supports and styles.** Enabling a support in `block.json` alone produces no class on the rendered wrapper — the class (`has-background`, `is-style-custom`) is emitted by `get_block_wrapper_attributes()` only from a stored attribute value. Seeding `{"backgroundColor":"vivid-red"}` and `{"className":"is-style-custom"}` in the block comment makes the assertion deterministic; both values are pinned in the prompt, keeping prompt and assertion in lockstep.

- **PHP `render_block` filter for block-filters (distinct from JS `addFilter` stub).** The PHP `render_block` / `render_block_wp-skill/testing-block` hook modifies rendered HTML on the front end and is assertable by Playwright. The existing `block-filter-add-custom-attribute` catalog stub targets the JS-side `addFilter('blocks.registerBlockType', …)` mechanism, which is editor-only — so both records coexist without sub-area overlap or orphaning.

- **Five new full catalog records + three deferral stubs + two retained stubs.** Five implemented sub-areas get full records with verbatim `prompt`/`acceptance` and developer.wordpress.org `source_files`. Three deferred sub-areas (block variations — editor-only JS-only; InnerBlocks — multi-block parent/child; block patterns — multi-block composition) get lighter stubs with recorded reasons. The two pre-existing stubs (`block-api-static-block`, `block-filter-add-custom-attribute`) are retained unchanged: neither covers an implemented sub-area, so neither is orphaned.

## Known limitations

- **Existing 21 scenarios not renamed.** The `block-editor-` prefix applies only to the five new scenarios; the existing 21 keep their non-prefixed flat names, creating a mild forward inconsistency. A suite-wide rename to area-prefixed names is recorded as a future recommendation.

- **Real nested subdirectories deferred.** Enabling true filesystem nesting requires an upstream Skillsmith change (recursive or configurable `enumerate.ts` discovery) plus fixes to `../../utils` import depth in nested specs and `verify-e2e.ts` spec-location/attribution logic. Surfaced as a future recommendation contingent on that upstream change; not adopted in this review.

- **Block bindings require WordPress 6.5+.** `register_block_bindings_source()` is a WP 6.5+ API. `@wordpress/env@11.x` fetches the latest WordPress at env-start so WP 6.8+ is in effect; no explicit version pin contradicts this. A failing grade against the current skill is acceptable per the spec.

- **Scenarios not required to pass against the current skill.** Verification is static/structural only (Skillsmith discoverability, `node --check` / Playwright collectability). A failing grade is acceptable and expected — the scenarios lead and the skill catches up in later work.
