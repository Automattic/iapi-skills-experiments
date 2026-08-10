# Spec Research

## Rough Idea

Ship ~5 simple Block Editor sub-area scenarios into `eval/scenarios/block-editor/`, promoting the 5 stubs:
- `block-api-static-block`
- `block-filter-add-custom-attribute`
- `block-editor-block-variations`
- `block-editor-inner-blocks`
- `block-editor-block-patterns`

Relaxed constraints: JS toolchain / editor-only acceptable; harness wall → judge-only with recorded `# Harness dependency:` note. Decide e2e vs judge-only per scenario. Each goes in `eval/scenarios/block-editor/<scenario>/`. Dedup against existing 5: dynamic-block, block-supports, block-styles, block-filters, block-bindings.

## Q&A

### Q1: For `block-editor-block-patterns`, can `register_block_pattern` (PHP) be verified e2e via the REST patterns endpoint? Is the endpoint exposed in wp-env, does a registered pattern appear by name, and is there existing precedent for a non-front-end REST assertion?

**A:** Yes — e2e-feasible via REST. The endpoint `/wp-json/wp/v2/block-patterns/patterns` is real (`WP_REST_Block_Patterns_Controller`, `rest_base = block-patterns/patterns`), introduced in WP 6.0.0, present in all WP 6.x. Response items carry `name`, `title`, `content` (readonly), so a registered pattern shows by name.

Auth caveat: the endpoint is NOT anonymous — `get_items_permissions_check` requires `current_user_can('edit_posts')`; an anon GET returns 401/403. BUT the harness e2e runs authed: Playwright uses `storageState` (`.auth/admin.json`, admin app-password cookie from global-setup `requestUtils.setupRest()`), so `page.request.get(...)` carries admin auth automatically and returns 200 + pattern list. So the e2e works as long as we assert the authed 200 (do not assert anon).

Precedent: several existing scenarios assert a `/wp-json/...` REST URL with no front-end post navigation. Best mirror = `eval/scenarios/plugins/taxonomy-register/e2e.spec.mjs` — `page.request.get("/wp-json/wp/v2/genre")` then `expect(resp.status()).toBe(200)`, with only `activatePlugin` in `beforeAll`. Others: `plugins/{settings-register,post-meta-rest,cpt-register}`, `rest-api/*`, `abilities-api/abilities-api-register`, `interactivity-api/config-fetch`.

Plan for patterns: register `register_block_pattern('namespace/slug', [...])` on `init` (PHP, no JS build). e2e: activate plugin, `page.request.get('/wp-json/wp/v2/block-patterns/patterns')`, expect 200, and (stronger) parse JSON and assert an item with `name === 'namespace/slug'` exists.

**Disposition:** e2e (REST endpoint assertion). No harness dependency needed — PHP + authed REST, both already supported.

**Reasoning:** The pattern is registered server-side in PHP and exposed through a core REST controller that the authed Playwright context can reach; this is a clean runtime assertion, matching the taxonomy-register precedent.

**Sources:** developer.wordpress.org/reference/classes/wp_rest_block_patterns_controller/ ; developer.wordpress.org/block-editor/reference-guides/block-api/block-patterns/ ; eval/scenarios/plugins/taxonomy-register/e2e.spec.mjs:23-26 ; playwright.config.ts:5-8,36-39 (storageState authed) ; eval/utils/global-setup.mjs:23 (setupRest issues app password).

### Q2: For `block-api-static-block`, does the harness build and run scenario block JS in the browser? Is a static block's front-end render of saved content e2e-assertable, or is it judge-only?

**A:** The harness DOES build and run scenario block JS in the browser — the JS toolchain is fully available and proven (so static-block is not blocked by build).

- Harness builds JS: `eval/utils/verify-e2e.ts:80-92` runs `wp-scripts build` for any plugin with a `src/blocks` dir before booting wp-env (`@wordpress/scripts ^32` devDep). Plugin `index.php` prefers `build/blocks` over `src/blocks` and registers each via `register_block_type($block_path)`.
- JS actually executes client-side: the iAPI counter scenario (`eval/scenarios/interactivity-api/counter/e2e.spec.mjs:48-56`) clicks buttons and asserts the displayed number changes — only passes if the compiled `view.js` runs in the browser. ~12 iAPI scenarios depend on this, so build+enqueue+execute is proven.

Two frictions specific to a STATIC block (important design nuances):
1. **Scaffold defaults to DYNAMIC.** `scaffold-plugin.ts:57-71` writes a starter `block.json` with `render: "file:./render.php"` and no `save`/`editorScript`; the testing-agent prompt (`eval/prompts/testing-agent.md:5-7`) says implement in `src/blocks/testing-block`, keep name+registration, and apply `get_block_wrapper_attributes()` on the render.php root element. So scaffold + prompt are built for DYNAMIC blocks. A genuine static block requires the agent to replace `block.json` (drop `render`, add `save`/`editorScript`) — possible but cuts against the scaffold's grain and the render.php instruction.
2. **Post content must carry saved markup.** Existing block-editor specs seed a self-closing comment `<!-- wp:wp-skill/testing-block /-->` (fine for dynamic — render.php fills it). A static block's front-end text lives in the SAVED markup, so a void comment renders nothing. An e2e would have to seed post content with the block's exact serialized save output and pin that HTML — brittle across agents.

**Disposition:** judge-only with `# Harness dependency: static save()/JS build` note. Two options were on the table — (A) e2e asserting pinned saved markup on `/?p=...`, technically feasible since the toolchain works; (B) judge-only, graded on produced `block.json`/`edit.js`/`save.js`. Chosen: **(B) judge-only.** Rationale: e2e would require hardcoding the agent's exact `save()` HTML (brittle) and forces the agent to fight a dynamic-oriented scaffold/prompt; the campaign's relaxed posture explicitly permits judge-only at a harness wall. The wall here is not "JS doesn't build" but "asserting a specific static save() render is brittle and contradicts the dynamic scaffold." Grades on the produced static-block artifacts.

**Reasoning:** The cleanest, lowest-risk runtime assertion does not exist for a static save() block in this scaffold, even though the JS build path works; so judge-only (graded on produced JS/PHP) with a recorded harness dependency is the right call per the campaign rules.

**Sources:** eval/utils/verify-e2e.ts:80-92 (wp-scripts build) ; package.json (@wordpress/scripts ^32) ; eval/scenarios/interactivity-api/counter/e2e.spec.mjs:48-56 (client JS executes) ; eval/utils/scaffold-plugin.ts:40-46,57-71 ; eval/prompts/testing-agent.md:5-7 ; developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/.

### Q3: For the three editor-only JS registrations (`block-filter-add-custom-attribute`, `block-editor-block-variations`, `block-editor-inner-blocks`) — is there any clean runtime assertion, are they distinct from the 5 implemented scenarios, what is each one's grounding URL, and what should the judge grade?

**A:** All three are judge-only — no clean runtime assertion.

**Decisive cross-cutting fact:** NO e2e spec in the suite drives the block editor. A grep of all 30 `e2e.spec.mjs` finds zero use of `createNewPost` / `editor.` / `insertBlock` / `/wp-admin` / `post-new` / `visitAdminPage`. Only two fixtures are ever used: `requestUtils` (47x) and `page` (27x); every assertion is a front-end `/?p=...` page OR a `page.request.get('/wp-json/...')` REST call. There is no fixture, wiring, or precedent to open the editor and assert editor-side state. So any concept whose observable effect is editor-only has no runtime assertion → judge-only. (Adding editor-driving e2e would be a harness change, out of scope for this campaign.)

**(a) block-filter-add-custom-attribute — judge-only.**
- Runtime surface: none clean. `addFilter('blocks.registerBlockType', ...)` runs in editor JS at client block registration, adding an attribute to the block's in-editor settings/state. Not exposed via REST; not reliably on the front end (the core block's own save() controls front-end markup; the custom attr only surfaces if also wired into a BlockEdit/BlockSave HOC, which is brittle/agent-specific, not a fixed token). → judge-only + `# Harness dependency: editor-only JS filter (no front-end/REST surface)`.
- Dedup: DISTINCT from `block-editor-block-filters` (PHP `add_filter('render_block', ...)` mutating SERVER front-end HTML). This is JS `addFilter('blocks.registerBlockType')` extending an existing/core block's client registration — different language, hook system (@wordpress/hooks client vs WP PHP hooks), and lifecycle (editor registration vs server render). No overlap with supports/styles/bindings/dynamic.
- Grounding: https://developer.wordpress.org/block-editor/reference-guides/filters/block-filters/ (canonical — documents `blocks.registerBlockType` as the client-registration filter). Keep `filters/` as context; add `block-filters/` as primary.
- Judge grades: an `addFilter` hooked on `'blocks.registerBlockType'` that returns settings with a new custom attribute merged into `settings.attributes` (spread-preserving existing), targeting a named/core block. Unique core = JS client-side attribute injection via the registerBlockType filter.

**(b) block-editor-block-variations — judge-only.**
- Runtime surface: none. `registerBlockVariation('core/x', {...})` is editor-only JS — the variation appears in the inserter/transforms. No front-end footprint (once inserted, a variation is indistinguishable from the base block on the front end), no REST surface. → judge-only + `# Harness dependency: editor-only JS variation registration (inserter-only, no front-end/REST surface)`.
- Dedup: DISTINCT. Closest neighbor `block-editor-block-styles` = `register_block_style` (PHP, emits an `is-style-*` class that DOES reach the front end — why styles is e2e). Variations = `registerBlockVariation` (JS, a preconfigured attribute/innerblocks preset in the inserter, no guaranteed front-end class). Different API, language, surface. No overlap with the other four.
- Grounding: https://developer.wordpress.org/block-editor/reference-guides/block-api/block-variations/ (matches candidate).
- Judge grades: a `registerBlockVariation(<existing block name>, { name, title/label, attributes, ... })` call registering a named variation that preconfigures the block. Unique core = JS variation (named preset of an existing block in the inserter).

**(c) block-editor-inner-blocks — judge-only (despite a partial front-end render).**
- Runtime nuance: a static InnerBlocks block DOES render nested children on the front end (`InnerBlocks.Content` in save() bakes children into post_content), so SOME front-end render exists in principle. BUT the DISTINCTIVE concept — the `allowedBlocks` parent/child RESTRICTION — is enforced only in the editor inserter (limits offered child types); it is NOT enforced on the front end. You cannot assert "only allowed children permitted" from front-end HTML, and the harness can't drive the inserter. Asserting nested render would also require building a static InnerBlocks block (same scaffold-is-dynamic / brittle-saved-markup friction as static-block) plus seeding nested post content. So no clean runtime assertion for the graded concept. → judge-only + `# Harness dependency: editor-only InnerBlocks/allowedBlocks (parent-child restriction is inserter-only)`.
- Dedup: DISTINCT — no existing scenario touches nested/parent-child composition or InnerBlocks.
- Grounding: https://developer.wordpress.org/block-editor/how-to-guides/block-tutorial/nested-blocks-inner-blocks/ (canonical, dedicated "Nested Blocks: Using InnerBlocks" page covering InnerBlocks, InnerBlocks.Content, allowedBlocks, template). RECOMMEND switching to this (candidate currently lists `block-api/block-edit-save/`, acceptable as secondary).
- Judge grades: an edit.js using `<InnerBlocks allowedBlocks={[...]} />` (template optional) to nest children with a restricted child set, plus `InnerBlocks.Content` in save() (or dynamic equivalent). Unique core = parent block hosting nested child blocks with an allowedBlocks restriction.

**Disposition summary (batch):** patterns → e2e (REST); static-block → judge-only (harness dep); filter-add-custom-attribute → judge-only; block-variations → judge-only; inner-blocks → judge-only. All 5 distinct from the 5 implemented (dynamic-block/supports/styles/filters/bindings) — confirmed.

**Reasoning:** The suite has no editor-driving e2e capability and only `requestUtils` + `page` fixtures; the observable effect of each of these three concepts is editor-only (or, for inner-blocks, the graded restriction is inserter-only), so none yields a clean runtime assertion and all are judge-only with a recorded harness dependency.

**Sources:** grep of eval/scenarios/*/e2e.spec.mjs (no editor-driving APIs; only requestUtils + page fixtures) ; developer.wordpress.org/block-editor/reference-guides/filters/block-filters/ ; .../block-api/block-variations/ ; .../how-to-guides/block-tutorial/nested-blocks-inner-blocks/ ; .../block-api/block-edit-save/.

## Research

### Existing block-editor scenario shape and conventions

- Each block-editor scenario lives at `eval/scenarios/block-editor/<name>/` and contains a `scenario.yaml` (and, for e2e ones, an `e2e.spec.mjs`).
- `scenario.yaml` keys: `name` (lowercase-kebab `/^[a-z0-9-]+$/`, equal to directory name), `description`, `skills: [wordpress-development]`, `prompt` (user-voice, tool-agnostic, outcome-phrased), `acceptance` (scenario-unique human-readable checks, no embedded URLs), `rubrics: []`. No catalog-only fields (`difficulty`, `concepts`, `source`, `source_files`) in a `scenario.yaml`.
- e2e specs import from `@wordpress/e2e-test-utils-playwright` and `deactivateAllPlugins` from `"../../../utils/wp-cli.mjs"` (3-level import, because block-editor scenarios are nested one level deeper than the flat `eval/scenarios/<name>/` scenarios). They activate `plugin-<name>-${agentId}` in `beforeAll` via `requestUtils.activatePlugin`, deactivate all plugins in teardown, and assert either on a front-end page (`/?p=...`) or on a REST URL (`page.request.get('/wp-json/...')`).
- The existing 5 implemented block-editor scenarios are: `block-editor-dynamic-block` (PHP render.php, e2e), `block-editor-block-supports` (block.json supports), `block-editor-block-styles` (`register_block_style` PHP, emits `is-style-*`), `block-editor-block-filters` (PHP `render_block` filter, e2e), `block-editor-block-bindings` (`register_block_bindings_source` PHP).

### Catalog (`_wp-dev-candidates.yaml`) Block Editor structure and promotion mechanics

Current Block Editor area layout (verified):
- Header comment (`# === Area: Block Editor ===`, folder note).
- Two stubs WITHOUT prompt/acceptance, placed BEFORE the implemented sub-header: `block-api-static-block` (no `# Deferred:` marker — a bare stub) and `block-filter-add-custom-attribute` (carries a `# Deferred:` marker).
- A `# Implemented Block Editor scenarios — full records` sub-header, followed by the 5 implemented full records (dynamic-block, block-supports, block-styles, block-filters, block-bindings).
- A `# Deferred Block Editor sub-areas — lighter stubs (no prompt/acceptance yet)` sub-header, followed by three stubs: `block-editor-block-variations`, `block-editor-inner-blocks`, `block-editor-block-patterns` (each with a `# Deferred:` marker).

Promotion mechanics for this review (each stub promoted IN PLACE to a full record):
- Drop every `# Deferred:`/stub marker on the 5 promoted records and add verbatim `prompt` + `acceptance` (matching the shipped `scenario.yaml`).
- For the four judge-only ones, add a `# Harness dependency:` note (see per-scenario notes above).
- After promotion, all 5 are full records; the natural placement is under the `# Implemented Block Editor scenarios — full records` sub-header, and the now-empty `# Deferred Block Editor sub-areas — lighter stubs` sub-header is removed (no Block Editor stub remains).
- Exactly one record per name; no duplicates; no name mismatch between any record and its scenario directory.
- The catalog header comment already lists "Block Editor" among areas with full prompt+acceptance — no header-line change is needed for this review.
- Keep the existing stub names verbatim as the directory == `scenario.yaml` `name` == catalog record `name`.

(Exact final prompt/acceptance wording and the precise in-file ordering are design/plan/code decisions; this spec fixes the dispositions, the per-scenario shape, the verification expectations, and the catalog-consistency rules.)

## Consolidated Requirements

### Scope and batch

1. **Five Block Editor sub-area scenarios are shipped, promoting the five existing catalog stubs.** The batch is exactly: `block-api-static-block`, `block-filter-add-custom-attribute`, `block-editor-block-variations`, `block-editor-inner-blocks`, `block-editor-block-patterns`. Each ships into the existing `eval/scenarios/block-editor/<scenario>/` topic folder. Every one is shipped (none deferred) — the relaxed constraints (JS toolchain / editor-only acceptable; harness wall → judge-only with a recorded dependency) remove every blocker.

2. **Each scenario keeps its existing stub name verbatim.** The directory name, the `scenario.yaml` `name`, and the catalog record `name` are identical, lowercase-kebab matching `/^[a-z0-9-]+$/`. No existing scenario or stub is renamed.

### Per-scenario disposition (e2e vs judge-only)

3. **`block-editor-block-patterns` ships as e2e (REST assertion).** A `register_block_pattern('<namespace>/<slug>', [...])` registration on `init` (PHP, no JS build) is verified by an `e2e.spec.mjs` that activates the scenario plugin in `beforeAll`, issues `page.request.get('/wp-json/wp/v2/block-patterns/patterns')` (authed via the harness's admin storageState — not anonymous), asserts HTTP 200, and asserts an item with the pinned `name === '<namespace>/<slug>'` exists. Every literal the spec asserts (the pattern namespace/slug) is pinned in the scenario's `prompt`. No harness dependency note is required for this one.

4. **`block-api-static-block` ships as judge-only.** The JS build toolchain works (verify-e2e runs `wp-scripts build`, and iAPI scenarios prove client JS executes), but a static `save()` block's only clean assertion would require hardcoding the agent's exact serialized save markup (brittle across agents) and forces the agent to fight a dynamic-oriented scaffold/prompt. It is graded by the judge against the produced `block.json`/`edit.js`/`save.js`, and carries a `# Harness dependency:` note recording the static-save/JS-build wall. No `e2e.spec.mjs`.

5. **`block-filter-add-custom-attribute` ships as judge-only.** A JS `addFilter('blocks.registerBlockType', ...)` that adds a custom attribute to an existing/core block has no front-end or REST surface (the harness has no editor-driving e2e capability). Graded against the produced JS; carries a `# Harness dependency:` note for the editor-only JS filter. No `e2e.spec.mjs`.

6. **`block-editor-block-variations` ships as judge-only.** `registerBlockVariation(...)` is an editor-only (inserter-only) JS registration with no front-end or REST footprint. Graded against the produced JS; carries a `# Harness dependency:` note for the editor-only JS variation registration. No `e2e.spec.mjs`.

7. **`block-editor-inner-blocks` ships as judge-only.** Although a static InnerBlocks block renders nested children on the front end, the scenario's distinctive concept — the `allowedBlocks` parent/child restriction — is enforced only in the editor inserter and is not front-end observable, and the harness cannot drive the inserter. Graded against the produced JS (`<InnerBlocks allowedBlocks={[...]} />` plus `InnerBlocks.Content` in save() or a dynamic equivalent); carries a `# Harness dependency:` note for the editor-only allowedBlocks restriction. No `e2e.spec.mjs`.

8. **e2e-collectable, pass not required.** Each shipped scenario is statically/structurally verified to be discoverable by Skillsmith; the patterns scenario's `e2e.spec.mjs` parses and resolves its imports under test-runner collection. A failing grade against the current skill is acceptable; no agent runs the full matrix, boots wp-env for a live pass, or generates the plugin code.

### Per-scenario shape (each scenario.yaml)

9. **Schema-conformant scenarios.** Each `scenario.yaml` has exactly `name`, `description`, `skills: [wordpress-development]`, `prompt`, `acceptance`, and `rubrics: []` — with no catalog-only fields (`difficulty`, `concepts`, `source`, `source_files`).

10. **User-voice, tool-agnostic prompts.** Each `prompt` reads as an outcome-phrased request that does not name the tool, API, function, framework, or technology to use; the `acceptance` strings are clean human-readable checks with no embedded source URLs.

11. **Scenario-unique acceptance per the distinct concept.** Each scenario's `acceptance` grades its unique core: patterns → a registered block pattern exposed by name at the patterns REST endpoint; static-block → a static block whose `save()` serializes markup into post content (`block.json` + edit/save, no render.php); filter-add-custom-attribute → an `addFilter` on `'blocks.registerBlockType'` merging a new attribute into `settings.attributes` for a named block; variations → a `registerBlockVariation` registering a named preset of an existing block; inner-blocks → a parent block hosting nested children with an `allowedBlocks` restriction (`InnerBlocks` + `InnerBlocks.Content`).

12. **Zero shared rubrics.** Each scenario declares `rubrics: []`; no new shared rubric under `eval/rubrics/` is added.

### Dedup and grounding

13. **Each new scenario is distinct from the five implemented Block Editor scenarios.** None duplicates dynamic-block, block-supports, block-styles, block-filters, or block-bindings at the sub-area level: patterns (`register_block_pattern`) vs none; static-block (JS static save) vs dynamic-block (PHP render.php); filter-add-custom-attribute (JS `blocks.registerBlockType` editor filter) vs block-filters (PHP `render_block` server filter); variations (JS `registerBlockVariation` inserter preset) vs block-styles (PHP `register_block_style` front-end class); inner-blocks (parent/child InnerBlocks) vs none.

14. **Each scenario is grounded to an on-domain developer.wordpress.org Block Editor reference URL** (provenance in the catalog record only, never in the `scenario.yaml`):
    - block-editor-block-patterns → `/block-editor/reference-guides/block-api/block-patterns/`
    - block-api-static-block → `/block-editor/reference-guides/block-api/block-edit-save/` (canonical for `save()` serialization; getting-started/ acceptable as secondary)
    - block-filter-add-custom-attribute → `/block-editor/reference-guides/filters/block-filters/` (primary; `filters/` as context)
    - block-editor-block-variations → `/block-editor/reference-guides/block-api/block-variations/`
    - block-editor-inner-blocks → `/block-editor/how-to-guides/block-tutorial/nested-blocks-inner-blocks/` (canonical; block-edit-save/ acceptable as secondary)

### Catalog promotion

15. **Each stub is promoted in place to a full catalog record.** In `_wp-dev-candidates.yaml`, each of the five records drops its `# Deferred:`/stub marker and gains the verbatim `prompt` + `acceptance` text from its shipped `scenario.yaml` (same text, order, quoting), keeping/citing its developer.wordpress.org grounding in `source_files`.

16. **A `# Harness dependency:` note is added to each of the four judge-only records** (static-block, filter-add-custom-attribute, variations, inner-blocks), recording why it is judge-only rather than e2e. The patterns record (e2e) carries no such note.

17. **Exactly one full record per name; no duplicates; no name mismatch.** After promotion, all five Block Editor stubs are full records under the `# Implemented Block Editor scenarios — full records` sub-header (the natural home), the now-empty `# Deferred Block Editor sub-areas — lighter stubs` sub-header is removed, and no Block Editor stub remains. Every record's `name` matches its scenario directory and its `scenario.yaml` `name`.

### Non-disruption

18. **The skill, the iAPI `_candidates.yaml`, and all non-Block-Editor catalog records and scenarios are untouched.** No file under `skills/wordpress-development/` is modified; `eval/scenarios/_candidates.yaml` is unmodified; only Block Editor records change in `_wp-dev-candidates.yaml` (the catalog header line already lists Block Editor, so no header change is needed). The existing five implemented Block Editor scenarios and all other areas' scenarios are not moved, renamed, reorganized, or broken; Skillsmith's flat discovery continues to enumerate them; the new scenario directories sit under the existing `eval/scenarios/block-editor/` topic folder.

### Sub-area campaign status

19. **This is sub-area review 1 of 3.** It ships the five Block Editor stubs; the remaining within-area sub-topic stubs are handled in the subsequent two sub-area reviews.

