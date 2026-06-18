# Design Doc: Block Editor scenarios + scenario-folder organization

## Overview

The `wordpress-development` skill is evaluated by a Skillsmith-based suite under `eval/`. A prior review (review-1) established a dated reference taxonomy of developer.wordpress.org, committed a candidate catalog at `eval/scenarios/_wp-dev-candidates.yaml`, and implemented six scenarios for one foundational area (Plugins). The suite today holds **21 scenarios** — 11 Interactivity API, 4 v1 (Hooks/Filters, Shortcodes, Custom Post Types, custom REST endpoints), and 6 Plugins. The **Block Editor** area is still uncovered as a topic: every existing block-based scenario builds on the single scaffold-provided block (`wp-skill/testing-block`) and exercises Interactivity-API client logic — never block-registration mechanics, supports, styles, bindings, or filters as a concept.

This review extends coverage to the **Block Editor** area with a small batch of five simple, documentation-grounded scenarios — roughly one per major uncovered Block Editor sub-area — reusing (not rebuilding) the existing taxonomy and catalog. In parallel it answers a standing question the owner raised: **can scenarios be organized into topic folders under `eval/scenarios/`?** Skillsmith's scenario discovery enumerates only the immediate children of `eval/scenarios/` and lives in an external pinned dependency in gitignored `node_modules`, so real nested subdirectories are not a free change. This doc therefore records a three-option folders exploration with a single clear recommendation, and adopts only a low-risk organization (`block-editor-*` pseudo-folder naming) for the new scenarios. As in review-1, the skill itself is not touched — the scenarios lead and the skill catches up in later work; verification is **static/structural only** (scenarios discoverable by Skillsmith, e2e specs loadable by Playwright), and scenarios are not required to pass against the current skill.

The deliverables are: (1) **five Block Editor scenarios** — `block-editor-dynamic-block`, `block-editor-block-supports`, `block-editor-block-styles`, `block-editor-block-filters` (each shipping an `e2e.spec.mjs`), and `block-editor-block-bindings` (judge-only); (2) a recorded **folders recommendation** adopting `block-editor-*` pseudo-folder naming and deferring real subdirectories as a future upstream-Skillsmith-contingent recommendation; and (3) a **catalog promotion + reconciliation** of the Block Editor section of `_wp-dev-candidates.yaml`. The existing 21 scenarios, the scaffold, the harness, Skillsmith, the iAPI `_candidates.yaml`, and the skill are all untouched.

## Approach

The end-to-end mental model the implementer works from:

**Naming convention (the new structural element).** All five new scenarios use the prefix `block-editor-<concept>` as their directory name, their `scenario.yaml` `name`, and their catalog record `name` — identical in all three places. This is the adopted "pseudo-folder" organization: it visually clusters Block Editor scenarios when `eval/scenarios/` is listed and sorted, while every scenario remains a **flat immediate child** of `eval/scenarios/` whose name matches `/^[a-z0-9-]+$/`. No filesystem nesting is introduced, so Skillsmith discovery, the e2e lifecycle, the `verify-e2e.ts` spec-location/attribution logic, Playwright collection, and the scaffold are all unchanged. The existing 21 scenarios are NOT renamed.

**Scenarios (the implemented work).** Each scenario is a self-contained directory `eval/scenarios/<name>/` containing a `scenario.yaml` and, for the four e2e scenarios, an `e2e.spec.mjs` — exactly mirroring `eval/scenarios/counter/`, `eval/scenarios/fruit-list-each/`, and the review-1 scenarios. The established runtime lifecycle is reused unchanged:

1. **Skillsmith discovers the scenario** by reading the immediate children of `eval/scenarios/` and loading each child's `scenario.yaml`. The directory name is the scenario's discovery identity; the `name` field inside the YAML is the plugin-slug fragment used downstream. For every scenario here, `name` equals the directory name.
2. **Skillsmith scaffolds a plugin** per (scenario, testing-agent) via `eval/utils/scaffold-plugin.ts`. The scaffold is block-centric: it writes `index.php` (plugin header + an `init` hook that registers any block under `src/blocks`/`build/blocks`), a `package.json`, and a fixed `src/blocks/testing-block/block.json` named `wp-skill/testing-block` whose `block.json` declares `render: "file:./render.php"`. The plugin slug is `plugin-<scenario.name>-<agentId>`.
3. **The testing agent implements the requested feature** within the fixed scaffold: block supports/attributes/styles via the block's `block.json`; server output via `render.php`; PHP-only Block Editor APIs (style registration, binding-source registration, render-time block filters) via the plugin's `index.php`. The block's fixed name and registration mechanism are never changed, and no scenario requires a second block type.
4. **An LLM judge grades the produced code** against the scenario's `acceptance` list. Every scenario declares `rubrics: []`, so only `acceptance` is used.
5. **The e2e harness (`eval/utils/verify-e2e.ts`) runs the Playwright spec** in a `wp-env` runtime for the four e2e scenarios: it builds plugins that have a `src/blocks` directory (all do, from the scaffold), boots `wp-env` with every produced plugin registered but deactivated, then runs each scenario's `e2e.spec.mjs`. The spec deactivates all plugins, activates exactly its own plugin, optionally seeds a post containing `<!-- wp:wp-skill/testing-block … -->`, navigates to the rendered post, and asserts on the `.wp-block-wp-skill-testing-block` output. The judge-only scenario ships no spec and is graded by judge alone.

**The render mechanism (load-bearing scaffold nuance).** The scaffold registers the block through `block.json`'s `render: "file:./render.php"` key — **not** a PHP `render_callback`. A dynamic block scenario therefore edits `render.php`; the agent does not register a `render_callback`. `render.php` receives `$attributes`, `$content`, and `$block` in scope and is expected to call `get_block_wrapper_attributes()` on the wrapper element (mandated by `testing-agent.md`), which is what emits the wrapper classes the supports/styles e2e scenarios assert.

**Catalog.** The Block Editor section of `eval/scenarios/_wp-dev-candidates.yaml` is updated: five new full records (one per implemented scenario, with `prompt`/`acceptance` matching the shipped `scenario.yaml` and `source_files` carrying developer.wordpress.org provenance); the two pre-existing stubs retained for still-unimplemented sub-areas; three new lighter deferral stubs. The iAPI `_candidates.yaml` and all non-Block-Editor records are untouched.

**No change is made** to the scaffold, the e2e harness, the Skillsmith package, the skill, the existing 21 scenarios, or `_candidates.yaml`.

## The five Block Editor scenarios

The Block Editor "Block API" taxonomy row, refined to its concept-level sub-areas (block registration, dynamic/server-rendered blocks, block supports, block variations, block styles, block bindings, InnerBlocks) plus the editor "Hooks/Filters" row (block filters), and excluding the Interactivity-API sub-area (saturated by the existing 11 iAPI scenarios), yields the candidate set. Five are implemented (within the 4–6 batch-size target); the rest are deferred to catalog stubs (see Catalog promotion + reconciliation). The sub-area selection is summarized below, followed by each scenario fully specified so phase 3/4 build them without re-deciding.

### Sub-area selection

| Sub-area | e2e? | Single `block.json`/`index.php`/`render.php` edit? | Decision |
|---|---|---|---|
| Dynamic / server-rendered block | YES — `render.php` output assertable in rendered DOM | Yes — edit `render.php` | IMPLEMENT e2e — `block-editor-dynamic-block` |
| Block supports | YES — `{"backgroundColor":"vivid-red"}` in seeded comment → `has-background` class on wrapper | Yes — `block.json` `supports` | IMPLEMENT e2e — `block-editor-block-supports` |
| Block styles | YES — `{"className":"is-style-custom"}` in seeded comment → `is-style-custom` on wrapper | Yes — `register_block_style()` in `index.php` | IMPLEMENT e2e — `block-editor-block-styles` |
| Block filters (PHP `render_block`) | YES — `render_block` filter modifies rendered HTML; assertable on front end | Yes — `add_filter('render_block_wp-skill/testing-block', …)` in `index.php` | IMPLEMENT e2e — `block-editor-block-filters` |
| Block bindings | Feasible but non-standard (asserts on `core/paragraph`, not the testing-block wrapper) | Yes — `register_block_bindings_source()` in `index.php` | IMPLEMENT judge-only — `block-editor-block-bindings` |
| Block variations | No — editor-only, no front-end footprint | No — JS-only registration path, no PHP equivalent | DEFER to catalog stub |
| Block registration / static block | No — JS `save()` output, no dynamic PHP | Awkward — scaffold has no compiled JS `save()` | DEFER — existing `block-api-static-block` stub retained |
| InnerBlocks | No — parent/child two-block setup | No — multi-block, exceeds single-block scaffold | DEFER to catalog stub |
| Block patterns | Partial (editor inserter only) | No — multi-block composition | DEFER to catalog stub |

Four scenarios are e2e — where the front-end DOM surface is clean and deterministic — and one is judge-only, where the e2e would require a non-standard assertion on a `core/paragraph` block.

### Scenario 1 — `block-editor-dynamic-block` (Dynamic / server-rendered block) — e2e

- **Sub-area:** Dynamic / server-rendered blocks. Distinct from all 11 iAPI scenarios: those use `render.php` as a *vehicle for Interactivity-API directives* (`data-wp-*` attributes, store context); this scenario uses `render.php` as the block's front-end output mechanism — server-side rendering with no iAPI directives. The `fruit-list-each` scenario proves the post-seed + render-assert pattern.
- **Source URL(s):** https://developer.wordpress.org/block-editor/how-to-guides/block-tutorial/creating-dynamic-blocks/
- **Mechanism:** Agent edits `render.php` to output PHP-computed HTML at render time. The block is already `"apiVersion": 3` with `"render": "file:./render.php"` (the scaffold's fixed pattern) — the agent adds PHP logic that computes and returns HTML; it does NOT register a `render_callback` and ships no non-null JS `save()`.
- **Prompt shape (user-voice, tool-agnostic; pins a literal the e2e asserts):** Request a block whose front-end output is generated dynamically in PHP at render time, displaying a specific computed/fixed string the e2e can assert. Pin the exact output string — phase 4 selects it (suggested literal: `Hello from PHP`). The prompt must not name `render.php`, `register_block_type`, or any function.
- **`acceptance` (scenario-unique, judge-checked, clean checks, no URLs):**
  1. The block's front-end output is generated dynamically in PHP at render time (not from a static JS `save()`).
  2. The render template produces and returns HTML output.
  3. `get_block_wrapper_attributes()` is called on the block's wrapper element.
  4. The output includes the pinned text (the literal pinned in the prompt).
  5. No JavaScript `save()` function returns non-null content — the block is dynamic.
- **e2e:** seed `<!-- wp:wp-skill/testing-block /-->`; `page.goto` the post; assert `.wp-block-wp-skill-testing-block` contains the pinned text (`toContainText`). Proves front-end server render. `afterAll`: `deactivateAllPlugins()` + `requestUtils.deleteAllPosts()`.

### Scenario 2 — `block-editor-block-supports` (Block supports) — e2e

- **Sub-area:** Block supports.
- **Source URL(s):** https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/
- **Mechanism:** Agent adds a `supports` declaration (e.g. `"supports": {"color": {"background": true, "text": true}}`) to `block.json`. The wrapper must be emitted via `get_block_wrapper_attributes()` (mandated by the scaffold) so the stored color attribute becomes a CSS class. **Seeding dependency (load-bearing):** enabling the support in `block.json` ALONE produces no class on the front-end wrapper — the class (`has-background has-vivid-red-background-color`) appears only when the seeded block comment carries the attribute value. `get_block_wrapper_attributes()` emits the class from the stored attribute; no stored value → no class.
- **Prompt shape:** Request that the block expose a background (and/or text) color control in the editor, so a `vivid-red` background can be set on the block. Pin `vivid-red` — this is the seeded attribute value the e2e relies on. Do not name `block.json`, `supports`, or `get_block_wrapper_attributes()`.
- **`acceptance` (scenario-unique):**
  1. The block declares at least one block support (e.g. color background and/or text) so the corresponding editor control appears.
  2. `get_block_wrapper_attributes()` is called on the wrapper element so support-derived classes reach the rendered output.
  3. No custom attribute registration is used — the support relies on the built-in attribute the support provides.
- **e2e:** seed `<!-- wp:wp-skill/testing-block {"backgroundColor":"vivid-red"} /-->`; assert `.wp-block-wp-skill-testing-block` has class `has-background` (and/or `has-vivid-red-background-color`). Proves the support is wired through `get_block_wrapper_attributes()`. `afterAll`: `deactivateAllPlugins()` + `deleteAllPosts()`.

### Scenario 3 — `block-editor-block-styles` (Block styles) — e2e

- **Sub-area:** Block styles.
- **Source URL(s):** https://developer.wordpress.org/block-editor/reference-guides/block-api/block-styles/
- **Mechanism:** Agent calls `register_block_style('wp-skill/testing-block', ['name' => 'custom', 'label' => …])` in `index.php` on `init` (a PHP-only API). The style registers as an editor Styles-panel option; `className` is a **built-in block attribute** (no custom attribute registration needed). When the seeded block comment includes `{"className":"is-style-custom"}`, `get_block_wrapper_attributes()` processing the stored `className` emits `is-style-custom` on the rendered wrapper.
- **Prompt shape:** Request a named, selectable visual style for the block, registered under the slug `custom`. Pin the style slug `custom` (the e2e asserts `is-style-custom`). Do not name `register_block_style()`.
- **`acceptance` (scenario-unique):**
  1. A block style named `custom` is registered for `wp-skill/testing-block` on the `init` hook.
  2. The registered style has a `name` (slug `custom`) and a human-readable `label`.
  3. No CSS file is required — registering the style and emitting the class is the acceptance bar (CSS is optional).
- **e2e:** seed `<!-- wp:wp-skill/testing-block {"className":"is-style-custom"} /-->`; assert `.wp-block-wp-skill-testing-block` has class `is-style-custom`. Proves style registration plus class emission. `afterAll`: `deactivateAllPlugins()` + `deleteAllPosts()`.

### Scenario 4 — `block-editor-block-filters` (Block filters — PHP `render_block`) — e2e

- **Sub-area:** Block filters (PHP-side, the `render_block` / `render_block_{namespace/block}` filter). This is **distinct** from the existing `block-filter-add-custom-attribute` catalog stub, which targets the JS-side `addFilter('blocks.registerBlockType', …)` mechanism. Mechanism distinctness keeps both records non-orphaned.
- **Source URL(s):** https://developer.wordpress.org/block-editor/reference-guides/filters/block-filters/ (covers both the PHP `render_block` and JS `blocks.registerBlockType` filters)
- **Mechanism:** Agent adds a `render_block_wp-skill/testing-block` (block-specific) or a `render_block` (generic, with a name check) PHP filter in `index.php` that modifies the block's rendered HTML — e.g. appending a string. This is a pure PHP hook running at render time on front-end output; no JS file is needed. (`add_filter('blocks.registerBlockType', …)` is JS-only and `register_block_type_args` fires at registration time, so neither is front-end-visible — `render_block` is the e2e-feasible choice.)
- **Prompt shape:** Request that the block's rendered output always include a specific short string (e.g. appended after the block's HTML on every page load), without naming the hook. Pin the exact appended string — phase 4 selects it (suggested literal: `Powered by my plugin`).
- **`acceptance` (scenario-unique):**
  1. A render-time filter on the block's output is registered in `index.php`.
  2. The filter callback receives the block's rendered HTML and returns modified HTML (the pinned string appended/prepended/wrapped).
  3. The modification targets only `wp-skill/testing-block` — via the block-specific hook variant or a block-name check in a generic callback (it must not modify all blocks).
- **e2e:** seed `<!-- wp:wp-skill/testing-block /-->`; assert the rendered page contains the pinned appended string within or adjacent to the `.wp-block-wp-skill-testing-block` wrapper. `render_block` output is fully front-end-visible. `afterAll`: `deactivateAllPlugins()` + `deleteAllPosts()`.

### Scenario 5 — `block-editor-block-bindings` (Block bindings) — judge-only

- **Sub-area:** Block bindings.
- **Source URL(s):** https://developer.wordpress.org/block-editor/reference-guides/block-api/block-bindings/
- **Mechanism:** Agent calls `register_block_bindings_source('<plugin-namespace>/<name>', […])` in `index.php` on `init` (PHP-only, WP 6.5+), providing a `get_value_callback` that returns a string. Pin the source name so acceptance can check it — phase 4 selects it (suggested: `my-plugin/greeting`).
- **Prompt shape:** Request a custom data source, registered under a specific name, that supplies a value to a block from PHP. Pin the source name. Do not name `register_block_bindings_source()`.
- **`acceptance` (scenario-unique):**
  1. A custom block binding source is registered on the `init` hook.
  2. The source name matches `/^[a-z0-9-]+\/[a-z0-9-]+$/` and equals the pinned name.
  3. A value callback (`get_value_callback`) is provided that returns a non-empty string.
  4. The source namespace matches the plugin's namespace.
- **Why no e2e (rationale for omitting it):** Block bindings are supported only on a fixed set of core blocks — `core/image`, `core/heading`, `core/paragraph`, `core/button`, `core/navigation-link`. The testing-block (`wp-skill/testing-block`) is **not** in that list, so the bound value can only be observed by seeding a `core/paragraph` block with binding metadata:
  ```
  <!-- wp:paragraph {"metadata":{"bindings":{"content":{"source":"my-plugin/greeting"}}}} -->
  <p>Fallback</p>
  <!-- /wp:paragraph -->
  ```
  An e2e would therefore have to assert on `<p>` text rather than on `.wp-block-wp-skill-testing-block` — a deviation from the standard suite lifecycle — and would require injecting complex binding metadata that exceeds a "simple" scenario. The PHP registration (registration on `init`, source name, value callback, namespace) is fully judge-checkable. Per the spec, judge-only is a first-class deliverable; this scenario ships no `e2e.spec.mjs`. (See Risks for the WP 6.5+ runtime note.)

### Summary

| # | Scenario (= dir = `name`) | Sub-area | Verify | e2e channel / why judge-only |
|---|---|---|---|---|
| 1 | `block-editor-dynamic-block` | Dynamic / server-rendered block | e2e | seed default block, assert pinned text in `.wp-block-wp-skill-testing-block` |
| 2 | `block-editor-block-supports` | Block supports | e2e | seed `{"backgroundColor":"vivid-red"}`, assert `has-background` class |
| 3 | `block-editor-block-styles` | Block styles | e2e | seed `{"className":"is-style-custom"}`, assert `is-style-custom` class |
| 4 | `block-editor-block-filters` | Block filters (PHP `render_block`) | e2e | seed default block, assert pinned appended string |
| 5 | `block-editor-block-bindings` | Block bindings | judge-only | binding observable only on `core/paragraph` (not the testing-block wrapper) + complex seeded metadata → non-standard for a simple e2e |

All five declare `rubrics: []`. Every literal an e2e asserts (the dynamic-block text, `vivid-red`, `is-style-custom` via slug `custom`, the appended filter string) is pinned in that scenario's prompt, keeping prompt and assertion in lockstep.

## Folders recommendation

The owner asked whether Block Editor (and future) scenarios can be organized into topic folders under `eval/scenarios/`. The binding constraint is **Skillsmith's discovery**: `enumerate.ts` (at `node_modules/@automattic/skillsmith/src/scenarios/enumerate.ts`, an **external pinned dependency** in gitignored `node_modules` — verified at pinned SHA `6bd90c34d88b815fdf4fd661dc8c51288111444c`) reads **only the immediate children** of `eval/scenarios/` via a single non-recursive `readdirSync(scenariosRoot)` (enumerate.ts:33-37). There is no recursion, no glob, and no second-level walk; `paths.scenarios` is a single string, not a glob/array, so config cannot point at a nested pattern (types.ts:89-90). Editing `enumerate.ts` is wiped on reinstall and cannot be committed.

Three options were explored.

### Option 1 — Real subdirectories (`eval/scenarios/block-editor/<name>/`)

Group by area in real filesystem directories. **Classified NOT low-risk.** Concrete breakage:

- **Skillsmith discovery — BREAKS.** A nested `eval/scenarios/block-editor/<name>/scenario.yaml` is invisible to the non-recursive `readdirSync`; Skillsmith silently skips every nested scenario (enumerate.ts:33-37).
- **Nested e2e relative imports — BREAK.** Every existing spec imports `../../utils/wp-cli.mjs` (two `../` levels, assuming `eval/scenarios/<name>/e2e.spec.mjs`). A spec at `eval/scenarios/block-editor/<name>/e2e.spec.mjs` would resolve `../../utils` to the nonexistent `eval/scenarios/utils` and fail import at Playwright collection time; it would need `../../../utils`.
- **Test runner still collects nested specs — discover-vs-grade mismatch.** Playwright's `testMatch: "**/e2e.spec.mjs"` with `testDir: eval/scenarios` (playwright.config.ts:26-27) is recursive — it WOULD find and run nested specs that Skillsmith never enumerated or graded. Playwright runs; Skillsmith grades zero.
- **`verify-e2e.ts` spec-location and failure attribution — BREAK.** `verify-e2e.ts:71-75` builds the spec path from a flat `dirName` (`join("eval","scenarios",dirName,"e2e.spec.mjs")`), assuming a flat immediate child; and `scenarioDirOf` (verify-e2e.ts:225-228) takes `segments[length-2]` as the scenario key, so nesting mis-attributes failures.
- **What enabling it requires:** fork or repin the external Skillsmith package to add recursive/configurable discovery (a change in gitignored `node_modules` that cannot be committed from this repo), PLUS fix the `../../utils` import depth in every nested spec, PLUS update `verify-e2e.ts`'s spec-location and attribution logic. A multi-point in-repo change coupled to an external pinned-dependency change.

### Option 2 — Naming-convention pseudo-folders (`block-editor-<concept>`)

Flat immediate children with a uniform area prefix; visual grouping via the prefix, no structural change. **Cost/risk:**

- Zero harness change. All scenarios remain flat immediate children of `eval/scenarios/`.
- Skillsmith discovery unchanged — names match `/^[a-z0-9-]+$/`, direct children.
- `../../utils/wp-cli.mjs` imports resolve correctly (standard two-level depth).
- `verify-e2e.ts` spec-location and attribution unchanged; Playwright collection unchanged; scaffold unchanged.
- Visual grouping: `ls eval/scenarios/ | sort` clusters all `block-editor-*` entries together, mirroring the `# === Area: Block Editor ===` catalog header.
- Mild forward inconsistency: the existing 21 scenarios use non-prefixed names (`taxonomy-register`, `settings-register`, etc.). Applying area prefixes to them is a future, explicitly out-of-scope decision; the existing 21 are NOT renamed here.

### Option 3 — Stay flat (no prefix)

Keep the current descriptive-name convention (`taxonomy-register`, `settings-register`, …) with no area prefix. **Cost/risk:** zero change anywhere; consistent with the current 21; no migration cost. But forfeits the visual grouping clarity the owner explicitly asked to explore — grouping would exist only via the catalog's `# === Area: … ===` headers.

### Adopted decision

**Adopt Option 2 — naming-convention pseudo-folders with the `block-editor-` prefix for all five new Block Editor scenarios.**

- The prefix is the natural convention: it matches the `# === Area: Block Editor ===` catalog header and mirrors what a real folder name would be, delivering the grouping the owner wanted at **zero harness risk**.
- Option 1 (real subdirectories) is classified **NOT low-risk** per the spec and is surfaced only as a **future recommendation contingent on an upstream Skillsmith change** that adds recursive or configurable discovery; it is not adopted in this review.
- Option 3 is equally safe but forfeits the grouping clarity; Option 2 captures that clarity with no added risk.
- The adopted convention is internally consistent (a single, uniform `block-editor-` prefix), discovery-safe (every scenario remains a flat immediate child whose name matches `/^[a-z0-9-]+$/`), and the directory name == `scenario.yaml` `name` == catalog record `name` for all five.
- The existing 21 scenarios are **NOT renamed**; the convention applies only to the new Block Editor scenarios and is surfaced as a recommendation for the wider suite.

## Catalog promotion + reconciliation

The Block Editor section of `eval/scenarios/_wp-dev-candidates.yaml`, under `# === Area: Block Editor ===`, is updated as follows. The iAPI `_candidates.yaml` and all non-Block-Editor records (Themes, Plugins, Common APIs, Advanced Admin, Coding Standards, Playground, Code Reference, REST API, WP-CLI) are NOT modified.

### Five new full records (one per implemented scenario, 1:1 identity)

Each implemented scenario gets exactly one full record whose `name` equals the scenario's directory name and its `scenario.yaml` `name`, carrying the **same `prompt` and `acceptance` text** as the shipped `scenario.yaml`, plus `source_files` citing the developer.wordpress.org page(s) grounding its acceptance points, plus `difficulty`/`concepts`/`source: dev.wordpress.org` (the established catalog-record shape). Provenance lives only here, never in `scenario.yaml`.

| Record `name` | `source_files` (provenance) |
|---|---|
| `block-editor-dynamic-block` | https://developer.wordpress.org/block-editor/how-to-guides/block-tutorial/creating-dynamic-blocks/ |
| `block-editor-block-supports` | https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/ |
| `block-editor-block-styles` | https://developer.wordpress.org/block-editor/reference-guides/block-api/block-styles/ |
| `block-editor-block-filters` | https://developer.wordpress.org/block-editor/reference-guides/filters/block-filters/ |
| `block-editor-block-bindings` | https://developer.wordpress.org/block-editor/reference-guides/block-api/block-bindings/ |

### Pre-existing stubs — retained, no orphan, no name mismatch

| Existing stub | Sub-area | Implemented this review? | Action |
|---|---|---|---|
| `block-api-static-block` | Static block (JS `edit.js` + `save.js`) | No — distinct from the dynamic block (scaffold has no compiled JS `save()`) | Retain as a lighter stub for the still-unimplemented static-block sub-area (recorded reason: requires a compiled JS `save()` function not provided by the scaffold). |
| `block-filter-add-custom-attribute` | JS-side `addFilter('blocks.registerBlockType', …)` | No — `block-editor-block-filters` uses the PHP `render_block` hook, a distinct mechanism | Retain as a lighter stub for the JS-side `addFilter` approach. No name mismatch and no sub-area overlap with any implemented scenario. |

Neither pre-existing stub covers a sub-area implemented by the five new scenarios, so there is no orphaned stub duplicating an implemented sub-area and no name mismatch between a catalog record and a scenario directory.

### Three new deferral stubs (lighter, with recorded reason)

Each deferred sub-area is recorded as a lighter stub carrying a brief recorded reason drawn from the recognized triggers, keeping the area broadly represented and the omission traceable:

| New stub `name` | Sub-area | Recorded reason (recognized trigger) |
|---|---|---|
| `block-editor-block-variations` | Block variations | Editor-only (no front-end footprint), JS-only registration path (no PHP `register_block_variation()`); requires a JavaScript file + enqueue, cannot be scoped to a simple `index.php` edit. |
| `block-editor-inner-blocks` | InnerBlocks | Parent/child multi-block setup; cannot be scoped to a single-block-scaffold edit. |
| `block-editor-block-patterns` | Block patterns | Multi-block composition; no clean single-block-scaffold surface. |

After the update, every implemented Block Editor sub-area is represented by exactly one full record under its final scenario name; deferred sub-areas are lighter stubs with reasons; and the two pre-existing stubs remain as lighter stubs for still-unimplemented sub-areas.

## Components

### New components (this review)

- `eval/scenarios/block-editor-dynamic-block/` — `scenario.yaml` + `e2e.spec.mjs` (e2e)
- `eval/scenarios/block-editor-block-supports/` — `scenario.yaml` + `e2e.spec.mjs` (e2e)
- `eval/scenarios/block-editor-block-styles/` — `scenario.yaml` + `e2e.spec.mjs` (e2e)
- `eval/scenarios/block-editor-block-filters/` — `scenario.yaml` + `e2e.spec.mjs` (e2e)
- `eval/scenarios/block-editor-block-bindings/` — `scenario.yaml` only (judge-only)
- `eval/scenarios/_wp-dev-candidates.yaml` — Block Editor section updated in place (5 new full records, 2 existing stubs retained, 3 new deferral stubs).

All five directory names match `/^[a-z0-9-]+$/`, equal their `scenario.yaml` `name`, are flat immediate children of `eval/scenarios/`, and were verified free of collision with the existing 21 scenario directories (`counter`, `config-fetch`, `async-fetch`, `derived-double`, `focus-trap-menu`, `fruit-list-each`, `independent-counters`, `minimal-scaffold`, `paginated-list`, `shared-state`, `toggle-visibility`, `cpt-register`, `filter-body-class`, `rest-custom-endpoint`, `shortcode-with-attr`, `taxonomy-register`, `post-meta-rest`, `settings-register`, `cron-event`, `i18n-textdomain`, `admin-menu-page`).

### Untouched-but-relevant components (consumed, not modified)

- `eval/utils/scaffold-plugin.ts` — scaffolds the per-(scenario, agent) plugin. Fixed facts the scenarios depend on: slug `plugin-<scenario.name>-<agentId>`; block name hardcoded `wp-skill/testing-block`; `block.json` declares `render: "file:./render.php"`; the `init` hook registers blocks under `src/blocks`/`build/blocks`. Agents add PHP to `index.php` and edit `block.json`/`render.php`. Throws if `name` (or `agentId`) does not match `/^[a-z0-9-]+$/`.
- `eval/utils/verify-e2e.ts` — locates each ran scenario's spec at `eval/scenarios/<dirName>/e2e.spec.mjs` (assumes flat immediate child), runs `wp-scripts build` for plugins with `src/blocks` (always present), boots `wp-env`, runs the specs, and maps failures back per (scenario, agent). The four new specs plug in by existing at the flat path; the judge-only scenario contributes no spec.
- `eval/utils/wp-cli.mjs` — exports `deactivateAllPlugins()` used by every spec's `beforeAll`. The four new specs reuse it identically.
- `@wordpress/e2e-test-utils-playwright` (`test`, `expect`, `requestUtils`) — provides `activatePlugin`, `createPost`, `deleteAllPosts`, plus `page.goto`/`page.locator`. These are the e2e channels the four e2e scenarios use.
- `@automattic/skillsmith` (`enumerate.ts`) — discovers scenarios by reading only the immediate children of `eval/scenarios/` (no recursion). External pinned dependency at SHA `6bd90c34d88b815fdf4fd661dc8c51288111444c`; NOT modified.
- `playwright.config.ts` — `testMatch: "**/e2e.spec.mjs"`, `testDir: eval/scenarios`.

### Explicitly NOT modified

- Any existing scenario directory (the 21 are not moved, renamed, or reorganized).
- `eval/scenarios/_candidates.yaml` (the iAPI catalog).
- Non-Block-Editor records in `_wp-dev-candidates.yaml`.
- `eval/rubrics/` (no new shared rubric).
- Anything under `skills/wordpress-development/`.

## Interfaces and Data Flow

### `scenario.yaml` schema (per `counter` and the review-1 scenarios)

```yaml
name: block-editor-dynamic-block   # matches /^[a-z0-9-]+$/, equals the directory name; plugin-slug fragment
description: <one line>
skills:
  - wordpress-development
prompt: |
  <user-voice, outcome-phrased; does NOT name render.php / register_block_style /
   register_block_bindings_source / render_block / get_block_wrapper_attributes / any function>
acceptance:
  - <scenario-unique, clean, human-readable check; NO embedded source URL>
rubrics: []                          # explicit empty array — REQUIRED for discovery
```

**The `rubrics` key must be present as an explicit empty array (`rubrics: []`).** Skillsmith's discovery validator (`isScenarioShape`) checks `Array.isArray(r.rubrics)`, which is `false` for an omitted key (`undefined`) or a valueless `rubrics:` (parsed as `null`) — either form silently fails discovery and the scenario is never graded. The same check requires `name`, `description`, `skills`, `prompt`, and `acceptance` to be present and well-typed. **Catalog-only fields (`difficulty`, `concepts`, `source`, `source_files`) never appear in a `scenario.yaml`.**

`name` is the plugin-slug fragment; the scaffolded plugin slug is `plugin-<name>-<agentId>`, and the e2e spec must activate that exact slug. For all five scenarios `name` equals the directory name (e.g. `block-editor-dynamic-block` → slug `plugin-block-editor-dynamic-block-<agentId>`). Names contain hyphens only (no underscores), which is valid.

### `e2e.spec.mjs` interface (the four e2e scenarios — same lifecycle as review-1 / `counter` / `fruit-list-each`)

```js
import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../utils/wp-cli.mjs";

test.describe("block-editor-<concept> scenario", () => {
  let post;
  test.beforeAll(async ({ requestUtils }, workerInfo) => {
    deactivateAllPlugins();
    await requestUtils.activatePlugin(
      `plugin-block-editor-<concept>-${workerInfo.project.metadata.agentId}`,
    );
    post = await requestUtils.createPost({
      // dynamic-block / block-filters: bare block; supports/styles: seeded attributes in the comment
      content: '<!-- wp:wp-skill/testing-block {"<key>":"<pinned-value>"} /-->',
      status: "publish",
    });
  });
  test.beforeEach(async ({ page }) => {
    await page.goto(`/?p=${post.id}`);
  });
  test.afterAll(async ({ requestUtils }) => {
    deactivateAllPlugins();
    await requestUtils.deleteAllPosts();
  });
  test("renders the expected output", async ({ page }) => {
    const block = page.locator(".wp-block-wp-skill-testing-block");
    // dynamic-block / block-filters: await expect(block).toContainText("<pinned text>");
    // block-supports:               await expect(block).toHaveClass(/has-background/);
    // block-styles:                 await expect(block).toHaveClass(/is-style-custom/);
  });
});
```

The `../../utils/wp-cli.mjs` import (two-level depth) resolves correctly precisely because the scenario directory is a flat immediate child of `eval/scenarios/` — the same reason the pseudo-folder approach is zero-risk and real nesting would break the import.

### Catalog record shape (Block Editor area, in `_wp-dev-candidates.yaml`)

```yaml
- name: block-editor-dynamic-block          # == directory name == scenario.yaml name
  description: <one line>
  difficulty: simple
  concepts: [render.php, dynamic-block, server-side-render]
  source: dev.wordpress.org
  source_files:
    - https://developer.wordpress.org/block-editor/how-to-guides/block-tutorial/creating-dynamic-blocks/
  prompt: |
    <exact same text as the shipped scenario.yaml prompt>
  acceptance:
    - <exact same items as the shipped scenario.yaml acceptance>
```

Deferral stubs carry the lighter shape (`name`/`description`/`difficulty`/`concepts`/`source`/`source_files`, with the recorded reason and no `prompt`/`acceptance`), mirroring the existing `block-api-static-block` / `block-filter-add-custom-attribute` stubs.

### Data flow

`scenario.yaml` (discovery + judge input) → scaffold writes plugin `plugin-<name>-<agentId>` → testing agent edits `block.json`/`render.php`/`index.php` → judge grades code against `acceptance` → for the four e2e scenarios: `verify-e2e.ts` builds + boots `wp-env` → `e2e.spec.mjs` activates the plugin, seeds a `wp:wp-skill/testing-block` post, navigates, and asserts on `.wp-block-wp-skill-testing-block` → Playwright JSON report → harness maps failures back to (scenario, agent). The catalog file feeds nothing in this flow; it is a committed planning artifact read by humans and future reviews.

## Key Decisions

### Decision: Adopt `block-editor-*` pseudo-folder naming; defer real subdirectories as a future Skillsmith-contingent recommendation

- **Choice:** All five new scenarios use a uniform `block-editor-<concept>` prefix as flat immediate children of `eval/scenarios/` (directory name == `scenario.yaml` `name` == catalog record `name`). Real subdirectories are surfaced only as a future recommendation contingent on an upstream Skillsmith change.
- **Alternatives:** (1) Real subdirectories via a harness/config change; (3) stay flat with no prefix.
- **Trade-offs:** Real subdirectories are NOT low-risk — they require changing the external pinned `enumerate.ts` (uncommittable in gitignored `node_modules`) plus three in-repo coupling points (`../../utils` import depth, `verify-e2e.ts` spec-location/attribution, and a Playwright-collects-but-Skillsmith-skips discover-vs-grade mismatch). Staying flat is equally safe but forfeits the grouping clarity the owner asked to explore. The prefix delivers that clarity at zero harness risk, every scenario remaining a flat immediate child whose name matches `/^[a-z0-9-]+$/`.
- **Traces to:** Requirements D.14, D.15, D.16; Acceptance Criteria 13, 14, 15.

### Decision: Existing 21 scenarios are not renamed or reorganized

- **Choice:** The `block-editor-` prefix applies only to the five new scenarios; the existing 21 keep their flat non-prefixed names and locations.
- **Alternatives:** Retroactively apply area prefixes (e.g. `plugins-*`, `iapi-*`) suite-wide.
- **Trade-offs:** A suite-wide rename is out of scope and would risk breaking discovery/attribution for 21 working scenarios for purely cosmetic gain. The forward inconsistency (prefixed new scenarios beside non-prefixed old ones) is accepted and recorded; a suite-wide convention is left as a future recommendation.
- **Traces to:** Requirements D.16, E.19; Acceptance Criteria 15, 18.

### Decision: Implement five scenarios (4 e2e + 1 judge-only), one per major uncovered sub-area; defer the rest to catalog stubs

- **Choice:** Implement `block-editor-dynamic-block`, `block-editor-block-supports`, `block-editor-block-styles`, `block-editor-block-filters` (e2e) and `block-editor-block-bindings` (judge-only). Defer block variations, InnerBlocks, and block patterns to new catalog stubs; retain `block-api-static-block` and `block-filter-add-custom-attribute` as stubs for still-unimplemented sub-areas.
- **Alternatives:** Implement every uncovered Block Editor sub-area; or implement only the e2e-feasible ones.
- **Trade-offs:** Five is within the 4–6 batch-size target comparable to prior reviews (v1 = 4, Plugins = 6) and covers the major implementable sub-areas with a clean e2e/judge split. Deferred sub-areas are excluded with recorded reasons (block variations: editor-only + JS-only registration; InnerBlocks: parent/child multi-block; block patterns: multi-block composition) so phase 4 does not second-guess.
- **Traces to:** Requirements A.2, A.3, A.4, A.5, B.7; Acceptance Criteria 2, 3, 4, 6, 7.

### Decision: e2e for dynamic block, supports, styles, and filters; judge-only for block bindings

- **Choice:** Ship `e2e.spec.mjs` for the four sub-areas with a clean, deterministic front-end DOM surface; keep block bindings judge-only.
- **Alternatives:** e2e for all five (including bindings); judge-only for all five.
- **Trade-offs:** Dynamic block (server-rendered text), supports (`has-background` from a seeded `backgroundColor`), styles (`is-style-custom` from a seeded `className`), and filters (`render_block` modifying rendered HTML) each yield a deterministic assertion on the standard `.wp-block-wp-skill-testing-block` wrapper. Block bindings can only be observed on a `core/paragraph` block (the testing-block is not a binding-supported block) with complex seeded metadata — a non-standard assertion target that exceeds a "simple" e2e. Its PHP registration is fully judge-checkable; judge-only is first-class per the spec.
- **Traces to:** Requirement B.7; Acceptance Criteria 6, 7.

### Decision: Dynamic block uses `block.json` `render` → `render.php`, not a `render_callback`

- **Choice:** The dynamic-block scenario edits `render.php`, the file the scaffold's `block.json` already points at via `render: "file:./render.php"`. The agent does not register a PHP `render_callback` and ships no non-null JS `save()`.
- **Alternatives:** Register a `render_callback` in `index.php`.
- **Trade-offs:** The scaffold's fixed registration mechanism is `block.json` `render`; routing dynamic output through `render.php` matches the scaffold (and the `fruit-list-each` precedent) and keeps the edit a single-file change within the fixed block. A `render_callback` would fight the scaffold's existing registration. The acceptance must therefore check for `render.php` producing PHP-computed HTML, not for a `render_callback`.
- **Traces to:** Requirement B.8; Acceptance Criterion 7.

### Decision: `block-editor-block-filters` uses the PHP `render_block` hook (distinct from the existing JS `addFilter` stub)

- **Choice:** Implement block filters via a `render_block` / `render_block_wp-skill/testing-block` PHP filter in `index.php`. Keep the existing `block-filter-add-custom-attribute` stub for the JS-side `addFilter('blocks.registerBlockType', …)` approach.
- **Alternatives:** Implement the JS-side `addFilter` (would need a JS file + enqueue, and is editor-only); use `register_block_type_args` (fires at registration time, not render time → not front-end-visible).
- **Trade-offs:** `render_block` is a single `index.php` edit, front-end-visible, and Playwright-assertable, and is mechanism-distinct from the JS `addFilter` stub — so both records coexist with no orphan or duplication. The callback must target only `wp-skill/testing-block` (block-specific hook or a name check) to avoid modifying all blocks — a correctness acceptance point.
- **Traces to:** Requirements B.7, B.8, C.12; Acceptance Criteria 6, 7, 11.

### Decision: Supports/styles assert wrapper classes derived from seeded block-comment attributes

- **Choice:** The supports e2e seeds `{"backgroundColor":"vivid-red"}` and asserts `has-background`; the styles e2e seeds `{"className":"is-style-custom"}` and asserts `is-style-custom`. Both pin the seeded value in the prompt.
- **Alternatives:** Enable the support / register the style without seeding an attribute and expect a class to appear.
- **Trade-offs:** Enabling a support in `block.json` or registering a style alone produces NO class on the front-end wrapper — the class is emitted by `get_block_wrapper_attributes()` only from a stored attribute value. Seeding the attribute in the block comment is what makes the assertion deterministic, and pinning the value in the prompt keeps prompt and assertion in lockstep. `className` and the support's color attribute are built-in, so no custom attribute registration is needed.
- **Traces to:** Requirements B.7, B.8; Acceptance Criteria 6, 7.

### Decision: Add zero new shared rubrics; every scenario declares `rubrics: []`

- **Choice:** Add no files under `eval/rubrics/`; each scenario carries its checks in `acceptance` and declares the explicit empty array `rubrics: []`.
- **Alternatives:** A shared "register on the right hook" or "uses `get_block_wrapper_attributes()`" rubric.
- **Trade-offs:** No single check recurs uniformly across all five in the same form: `get_block_wrapper_attributes()` is central only to dynamic-block/supports/styles (not filters/bindings); the registration hook differs per scenario. A catch-all rubric would risk duplicating per-scenario acceptance points (which the spec forbids) or being too vague to help the judge. The spec permits zero rubrics when no genuinely cross-cutting check emerges; this mirrors the v1 / Plugins outcome.
- **Traces to:** Requirement B.10; Acceptance Criterion 9.

### Decision: Provenance lives in catalog `source_files`, not in `scenario.yaml`; prompts are tool-agnostic and pin every e2e literal

- **Choice:** Each implemented scenario's documentation grounding is recorded in its `_wp-dev-candidates.yaml` record's `source_files` (developer.wordpress.org URLs). `scenario.yaml` `prompt` is user-voice and never names the tool/API/function; `acceptance` strings are clean checks with no embedded URLs; every literal an e2e asserts is pinned in the prompt.
- **Alternatives:** Embed source URLs in the `scenario.yaml`; name the API in the prompt; let the agent choose the asserted identifier.
- **Trade-offs:** The spec bars catalog-only fields and URLs from `scenario.yaml` and requires tool-agnostic prompts; the catalog's `source_files` is the designated home for traceability. Pinning the asserted literal (the dynamic-block text, `vivid-red`, slug `custom`, the appended filter string) keeps the e2e deterministic without naming the mechanism.
- **Traces to:** Requirements B.7, B.9, C.11; Acceptance Criteria 6, 8, 10.

### Decision: Promote five full catalog records, retain two stubs, add three deferral stubs; leave iAPI and other records untouched

- **Choice:** Five full Block Editor records (1:1 with the scenarios, identical prompt/acceptance, with `source_files`); retain `block-api-static-block` and `block-filter-add-custom-attribute` as lighter stubs; add `block-editor-block-variations`, `block-editor-inner-blocks`, `block-editor-block-patterns` deferral stubs. `_candidates.yaml` and non-Block-Editor records unchanged.
- **Alternatives:** Promote-and-rename the existing stubs into implemented scenario names; modify other catalog areas.
- **Trade-offs:** Neither existing stub covers an implemented sub-area (static block ≠ dynamic block; JS `addFilter` ≠ PHP `render_block`), so renaming them would create a name mismatch or false duplication — retaining them as stubs leaves no orphan. The deferral stubs keep the area broadly represented with traceable reasons. Confining edits to the Block Editor section keeps the iAPI catalog and other areas intact.
- **Traces to:** Requirements C.11, C.12, C.13; Acceptance Criteria 4, 10, 11, 12.

### Decision: Static / structural verification only; scenarios not required to pass; skill untouched

- **Choice:** Verify the five scenarios are Skillsmith-discoverable (scenario-shape check) and the four e2e specs are Playwright-loadable (parse + imports resolve). Do not boot `wp-env`, run the full matrix, or generate plugin code. Modify nothing under `skills/wordpress-development/`.
- **Alternatives:** Run the scenarios against the current skill and require passing grades.
- **Trade-offs:** The scenarios lead and the skill catches up later; a failing grade against the current skill is acceptable per the spec. The bar is well-formedness/runnability, matching review-1.
- **Traces to:** Requirements E.17, E.18, E.19; Acceptance Criteria 16, 17, 18.

## Dependencies

All dependencies already exist in the repo; this review introduces **no new** dependency.

- **Internal:** `eval/utils/scaffold-plugin.ts`, `eval/utils/verify-e2e.ts`, `eval/utils/wp-cli.mjs` (`deactivateAllPlugins`), `playwright.config.ts`, the `eval/scenarios/counter/` and `eval/scenarios/fruit-list-each/` reference patterns (block lifecycle precedent), and the existing `eval/scenarios/_wp-dev-candidates.yaml` (catalog precedent shape, Block Editor section edited; rest untouched).
- **External (already present):** `@automattic/skillsmith` (discovery, scaffold orchestration, judge) pinned at SHA `6bd90c34d88b815fdf4fd661dc8c51288111444c`; `@wordpress/e2e-test-utils-playwright` (`test`, `expect`, `requestUtils`); `@wordpress/scripts` (`wp-scripts build`); `@wordpress/env` (`wp-env` runtime); Playwright.
- **Runtime version note (not a new dependency):** the `block-editor-block-bindings` scenario's `register_block_bindings_source()` requires WordPress 6.5+. `@wordpress/env@11.x` fetches the latest WordPress at env-start with no pinned version, so WP 6.8+ is in effect and bindings registration is safe. Phase 4 should confirm no explicit WP version pin in the `wp-env` config contradicts this. A failing grade is acceptable per the spec.
- **Documentation (selection/acceptance grounding, not a runtime dependency):** the developer.wordpress.org pages cited per scenario and in the catalog `source_files`.

## Failure Modes and Observability

- **Scenario not discovered:** a directory not placed as a flat immediate child of `eval/scenarios/`, or missing `scenario.yaml`, is silently skipped by `enumerate.ts`. Mitigation: all five use the flat `block-editor-*` layout, each with a `scenario.yaml`.
- **Malformed `scenario.yaml`:** `isScenarioShape` requires `rubrics` as a present array; an omitted key (`undefined`) or valueless `rubrics:` (`null`) fails the shape check and the scenario is silently skipped. Mitigation: every scenario declares `rubrics: []` explicitly; `name`/`description`/`skills`/`prompt`/`acceptance` are all present and well-typed.
- **Invalid `name`:** `scaffold-plugin.ts` throws if `name` (or `agentId`) does not match `/^[a-z0-9-]+$/`. All five `block-editor-*` names conform (hyphens only, no underscores).
- **Wrong plugin slug in an e2e:** a spec must activate `plugin-<scenario.name>-${workerInfo.project.metadata.agentId}`; activating any other slug errors. Mitigation: specs derive the slug from `name` (== directory name) exactly as existing specs do.
- **Nested-spec import failure (relevant only if real subdirectories were ever attempted):** a spec at a nested path would resolve `../../utils` to the nonexistent `eval/scenarios/utils` and fail at collection. Mitigation: the adopted flat layout keeps the two-level import correct — this is the concrete reason real nesting is deferred.
- **Supports/styles class not present:** if the agent omits `get_block_wrapper_attributes()` on the wrapper, the seeded `backgroundColor`/`className` produces no `has-background`/`is-style-custom` class and the e2e fails. This is the scenario-level acceptance point the scenario is designed to exercise, not a harness error; a failing grade against the current skill is acceptable.
- **Block-filters over-broad targeting:** if the agent uses a generic `render_block` filter without a block-name check (instead of the block-specific `render_block_wp-skill/testing-block` variant), it modifies all blocks' output. This is a correctness acceptance point, not a harness error.
- **Block-bindings WP version:** on WP < 6.5, `register_block_bindings_source()` does not exist → PHP fatal or silent no-op. The scenario is judge-only (no e2e fails); a PHP fatal would surface in build/activation logs. Risk accepted; `@wordpress/env@11.x` fetches latest WP so WP 6.8+ is in effect.
- **Observability:** e2e failures surface through Playwright's JSON report, which `verify-e2e.ts` parses into per-(scenario, agent) failure records; judge results surface through Skillsmith's grading output; `wp-env` start/stop and build steps log to stdout/stderr.
- **Expected non-failure:** per the spec, a *failing grade against the current skill* is acceptable and is not a harness error. The bar is that each scenario runs to a graded result and any e2e executes without harness/configuration errors.

## Risks and Open Questions

- **Exact prompt literal for `block-editor-dynamic-block` (phase-4 choice, NOT blocking).** Which specific PHP-computed string is pinned in the prompt for the e2e assertion. The design requires the literal to be pinned in the prompt (not left to the agent). Suggested: `Hello from PHP`. Prompt string and e2e assertion must stay in lockstep if reworded.
- **Exact prompt literal for `block-editor-block-filters` (phase-4 choice, NOT blocking).** Which specific string the `render_block` filter appends, pinned in the prompt. Suggested: `Powered by my plugin`.
- **Exact binding source name for `block-editor-block-bindings` (phase-4 choice, NOT blocking).** The pinned source name the acceptance checks (must match `/^[a-z0-9-]+\/[a-z0-9-]+$/` and equal the plugin namespace). Suggested: `my-plugin/greeting`.
- **`wp-env` WP-version confirmation (phase-4 verification, LOW).** `@wordpress/env@11.x` fetches the latest WordPress at env-start (no pinned version), so WP 6.8+ is in effect and block bindings (WP 6.5+) are safe. Phase 4 should confirm the `wp-env` config has no explicit version pin contradicting this. A failing grade is acceptable.
- **Supports/styles depend on `get_block_wrapper_attributes()` (intentional, not a harness risk).** `testing-agent.md` mandates calling it, but if an agent omits it the wrapper class won't appear and the e2e fails. This is the acceptance point the scenario tests — by design, not a defect.
- **Block-filters prompt tool-agnosticism (LOW).** The `render_block` hook is a specific PHP API, but the prompt is phrased as an outcome ("I want text appended to my block's output on every page load") without naming the hook — the testing agent picks the mechanism.
- **Static-block sub-area remains uncovered (intentional).** `block-api-static-block` stays a stub: the dynamic-block scenario covers server-rendered output, not the static JS `save()` mechanism, which the scaffold (no compiled JS `save()` path) cannot host as a simple edit. A future review can address it when/if the scaffold gains a JS build step.
- **Naming forward inconsistency (recorded, out of scope).** The new `block-editor-*` scenarios sit beside the non-prefixed existing 21 (`taxonomy-register`, `settings-register`, etc.). A suite-wide rename to area-prefixed names is surfaced as a future recommendation, not done here.
- **Real nested subdirectories deferred (recorded, out of scope).** Enabling them requires an upstream/external Skillsmith change (recursive or configurable discovery) plus the in-repo coupling fixes documented in the Folders recommendation. Surfaced as a future recommendation contingent on that upstream change; not adopted in this review.
