# Design Research: Block Editor scenarios + scenario-folder organization

## Research

### Skillsmith enumerate.ts — flat discovery constraint

From review-1 design doc and spec-research Q3 (verified at pinned SHA `6bd90c34d88b815fdf4fd661dc8c51288111444c`):
- `enumerate.ts` lives at `node_modules/@automattic/skillsmith/src/scenarios/enumerate.ts` — an **external pinned dependency**, not tracked by this repo (`node_modules/` is gitignored). Editing it is wiped on reinstall; changes cannot be committed.
- It reads **only the immediate children** of `eval/scenarios/` via a single non-recursive `readdirSync(scenariosRoot)` (enumerate.ts:33-37). No recursion, no glob, no second-level walk.
- Guard A (`isDirectorySafe`): skips non-directories. Guard B (`existsSync(yamlPath)`): skips directories lacking a top-level `scenario.yaml`.
- A flat non-directory file with a leading underscore is skipped by Guard A (not by an underscore branch). A directory named `_foo` WITH a `scenario.yaml` WOULD be discovered.
- `paths.scenarios` is a single string, not a glob/array — config cannot point at a nested pattern (types.ts:89-90).

Sources: package.json:14; node_modules/@automattic/skillsmith/src/scenarios/enumerate.ts:33-37; .../types.ts:89-90; spec-research.md Q3.

### playwright.config.ts — spec collection pattern

- `testMatch: "**/e2e.spec.mjs"`, `testDir: eval/scenarios`.
- Playwright collects specs **recursively** via `**` — it WOULD collect `e2e.spec.mjs` files inside nested subdirectories even though Skillsmith would not enumerate them.

Source: playwright.config.ts:26-27; spec-research.md Q3.

### verify-e2e.ts — spec location and failure attribution

- `verify-e2e.ts:71-75` builds spec path from flat dirName: `join("eval","scenarios",dirName,"e2e.spec.mjs")` — assumes flat immediate child.
- `verify-e2e.ts:225-228`: `scenarioDirOf` takes `segments[length-2]` as the scenario key. Nesting mis-attributes failures.

Source: eval/utils/verify-e2e.ts:71-75, 225-228; spec-research.md Q3.

### e2e.spec.mjs import paths

All existing specs import `../../utils/wp-cli.mjs` — a two-level relative path assuming `eval/scenarios/<name>/e2e.spec.mjs`. A nested spec at `eval/scenarios/block-editor/<name>/e2e.spec.mjs` would resolve `../../utils` to the nonexistent `eval/scenarios/utils`, breaking import at collection time.

Source: eval/scenarios/*/e2e.spec.mjs:2 (18 specs); spec-research.md Q3.

### Existing Block Editor catalog stubs

Two pre-existing stubs in `_wp-dev-candidates.yaml` under `# === Area: Block Editor ===`:
1. `block-api-static-block` — Register a simple static block with block.json, edit.js, save.js, and an icon. (concepts: registerBlockType, block.json, edit, save). No prompt/acceptance.
2. `block-filter-add-custom-attribute` — Add a custom attribute to an existing core block via the blocks.registerBlockType filter. (concepts: addFilter, blocks.registerBlockType, BlockEdit, BlockSave). No prompt/acceptance.

Source: eval/scenarios/_wp-dev-candidates.yaml:33-49.

### Scaffold — fixed facts relevant to Block Editor scenarios

From review-1 design doc and spec-research Q1:
- Fixed block name: `wp-skill/testing-block`. Cannot be changed.
- `block.json` contents and `render.php` are agent-editable.
- PHP-only Block Editor APIs (`register_block_style`, `register_block_bindings_source`, etc.) go in `index.php`.
- Second block type: not possible with the fixed scaffold.
- Plugin slug: `plugin-<scenario.name>-<agentId>`.
- `get_block_wrapper_attributes()` is mandated in `testing-agent.md` — it processes stored attributes (color, className, etc.) and emits the appropriate classes on the wrapper element.
- The e2e lifecycle: `wp-scripts build` → `wp-env` boot → spec activates plugin → seeds post with `<!-- wp:wp-skill/testing-block … -->` → `page.goto` post URL → asserts on `.wp-block-wp-skill-testing-block`.

Source: eval/utils/scaffold-plugin.ts; eval/prompts/testing-agent.md; eval/utils/verify-e2e.ts; review-1 design-doc.md.

### Dynamic / server-rendered block — sub-area distinctness confirmed

From researcher (Q2a):
- `render.php` is used by iAPI scenarios as a **vehicle for iAPI directives** (`data-wp-*` attributes, store context). A dynamic block scenario where `render.php` outputs PHP-computed HTML with no iAPI directives covers a genuinely distinct concept: server-side rendering as the block's front-end output mechanism, not as an iAPI wrapper.
- Sub-area is uncovered and genuinely distinct from all 11 iAPI scenarios.
- Canonical URL: https://developer.wordpress.org/block-editor/how-to-guides/block-tutorial/creating-dynamic-blocks/
- **E2e feasible:** render.php output is directly assertable in the rendered `.wp-block-wp-skill-testing-block` DOM. The existing `fruit-list-each` scenario proves the pattern (post-seed + render-assert). No iAPI directives needed.

### Block styles — e2e mechanism confirmed

From researcher (Q2b):
- `register_block_style()` is **PHP-only**, goes in `index.php`, hooked on `init`.
- When the seeded block comment includes `{"className":"is-style-<slug>"}` (e.g. `<!-- wp:wp-skill/testing-block {"className":"is-style-custom"} /-->`), the front-end rendered wrapper includes `is-style-custom` as a CSS class — assertable by Playwright.
- `className` is a **built-in block attribute** — no custom attribute registration needed.
- `register_block_style()` registers the style for the editor's Styles panel; the class in rendered HTML comes from `get_block_wrapper_attributes()` processing the stored `className` attribute.
- Canonical URL: https://developer.wordpress.org/block-editor/reference-guides/block-api/block-styles/

### Block supports — seeding dependency confirmed

From researcher (Q1 block supports answer):
- Enabling `supports.color.background: true` in block.json ALONE produces **no CSS class** on the front-end wrapper.
- The class (`has-background has-vivid-red-background-color`) appears only when the seeded post comment includes the attribute: `<!-- wp:wp-skill/testing-block {"backgroundColor":"vivid-red"} /-->`.
- `get_block_wrapper_attributes()` emits the class from the stored attribute value. No stored value → no class.
- **E2e approach:** seed post with `{"backgroundColor":"vivid-red"}` in block comment; assert `has-background` on rendered wrapper. Prompt must pin `vivid-red` so assertion and prompt stay in lockstep.
- Canonical URL: https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/

### Block bindings — e2e feasibility and complexity assessment

From researcher (Q2c):
- `register_block_bindings_source()` is **PHP-only**, goes in `index.php`, hooked on `init`.
- Front-end visibility: **conditionally yes** — the bound value appears in rendered output only if the block comment includes binding metadata: `<!-- wp:wp-skill/testing-block {"metadata":{"bindings":{"content":{"source":"my-plugin/my-source"}}}} /-->`.
- Minimum WordPress version: **6.5** (introduced WP 6.5, 2024). Risk: if wp-env uses a pinned older WP version, binding registration silently does nothing.
- **Complexity flag:** e2e requires seeding complex binding metadata in the block comment. This is a harness concern, not agent-authoring concern, but the prompt must explain the binding setup. Researcher flagged as "arguably multi-concept."
- **Decision:** classify as **judge-only**. The binding registration acceptance (PHP registration, source name, return value) is fully judge-checkable. E2e would require seeding complex block comment metadata that goes beyond what a "simple scenario" warrants. Judge-only is first-class per the spec.
- Canonical URL: https://developer.wordpress.org/block-editor/reference-guides/block-api/block-bindings/

### Block variations — JavaScript-only, no PHP registration path

From researcher (Q2d-1):
- `registerBlockVariation()` is **JavaScript-only** (editor-only, no front-end footprint).
- There is NO PHP `register_block_variation()` function. Variations are registered client-side via `@wordpress/blocks` JS package.
- A variation scenario would require enqueueing a JS file + writing JS — a two-file edit exceeding the simple `index.php`-only pattern of review-1's judge-only scenarios.
- Canonical URL: https://developer.wordpress.org/block-editor/reference-guides/block-api/block-variations/
- **Decision:** defer to catalog stub. The JS requirement makes it more complex than the "simple single-block-scaffold edit" standard. Recorded reason: requires JavaScript file + enqueue, cannot be scoped to a simple index.php edit.

### Block filters — `render_block` PHP hook is e2e-feasible

From researcher (Q2d-2):
- `addFilter('blocks.registerBlockType', …)` is JavaScript-only; PHP side is just enqueueing a JS file. The existing stub `block-filter-add-custom-attribute` targets this JS approach.
- `register_block_type_args` is PHP-only but fires at registration time (not render time), so its effect is editor/metadata-only, not front-end-visible.
- **`render_block` / `render_block_{namespace/block}` filter** — a PHP filter that runs at block render time on front-end output. `add_filter('render_block_wp-skill/testing-block', function($html) { … })` in `index.php` modifies the rendered HTML — e.g., appending text, wrapping output. This IS front-end-visible and Playwright-assertable. It requires only `index.php` (no JS file needed).
- **Decision:** implement as an **e2e** scenario `block-editor-block-filters` using the `render_block` PHP filter (or its block-specific variant). This is a single `index.php` edit, front-end-visible, and simpler than JS addFilter. The existing stub `block-filter-add-custom-attribute` remains for the JS-side addFilter approach (distinct mechanism).
- Canonical URLs: https://developer.wordpress.org/block-editor/reference-guides/filters/block-filters/ (covers both PHP `render_block` and JS `blocks.registerBlockType` filters)

### Block bindings — `core/paragraph` target, not `wp-skill/testing-block`

From researcher (Q2c additional detail):
- Block bindings supported blocks are: `core/image`, `core/heading`, `core/paragraph`, `core/button`, `core/navigation-link`. The testing-block (`wp-skill/testing-block`) is NOT in the supported list.
- Seeded binding post comment uses `core/paragraph`, not the testing-block:
  ```
  <!-- wp:paragraph {"metadata":{"bindings":{"content":{"source":"my-plugin/source-name"}}}} -->
  <p>Fallback</p>
  <!-- /wp:paragraph -->
  ```
- The bound value appears as paragraph text content; e2e would assert on `<p>` text, NOT on `.wp-block-wp-skill-testing-block`.
- This is a deviation from the standard suite lifecycle (which asserts on `.wp-block-wp-skill-testing-block`). Using a core block in the seeded post is technically feasible but creates a non-standard assertion pattern.
- WP 6.5+ required, but wp-env uses `@wordpress/env@11.x` with no pinned WP version (fetches latest at env-start time), so WP 6.8+ is current — block bindings are safe.
- **Decision:** classify as **judge-only** (not e2e). The non-standard assertion pattern (core/paragraph, not the testing-block wrapper) and the complex binding seeding metadata make this a poor fit for a "simple" e2e scenario. The PHP registration acceptance is fully judge-checkable. Existing decision confirmed.

### Block variations — editor-only confirmed

From researcher (Q2d-1):
- Variations are "purely editor-side constructs" — they apply initial attributes at insertion time but add no automatic front-end markup or styling.
- No PHP `register_block_variation()` function exists (only `get_block_type_variations` PHP filter hook, and the primary registration is JS `registerBlockVariation()`).
- **Decision confirmed:** defer to catalog stub. Reason: editor-only (no front-end footprint), JS-only registration path, cannot be scoped to a simple index.php edit.

## Topics

### Topic: Approach

- **Spec link:** All requirements; Acceptance Criteria 1–19
- **Decision:** The end-to-end mental model for this review:
  1. **Naming convention adopted:** all new Block Editor scenarios use `block-editor-<concept>` as their directory name (flat immediate child of `eval/scenarios/`), their `scenario.yaml` `name`, and their catalog record name. This is the "pseudo-folder" organization.
  2. **Sub-areas implemented:** dynamic block (e2e), block supports (e2e), block styles (e2e), block filters via `render_block` PHP hook (e2e), block bindings (judge-only). Five scenarios total — within the 4–6 batch-size target.
  3. **Sub-areas deferred to catalog stubs:** block variations (JS-only, too complex for simple scaffold edit), InnerBlocks (multi-block/parent-child), block patterns (multi-block composition), block-api-static-block and block-filter-add-custom-attribute existing stubs retained as-is for still-unimplemented sub-areas.
  4. **Existing 21 scenarios:** untouched. No reorganization.
  5. **Catalog:** `_wp-dev-candidates.yaml` Block Editor section updated — five new full records for implemented scenarios, existing stubs retained for unimplemented sub-areas, new lighter stubs added for variations/InnerBlocks/patterns. iAPI `_candidates.yaml` untouched.
  6. **No changes to:** skill, scaffold, harness, Skillsmith, existing scenarios.
- **Rationale:** Mirrors review-1's approach. Prefix convention is the new element.
- **Traces to:** Requirements A.1–A.5, B.7–B.10, C.11–C.13, D.14–D.16, E.17–E.19.

---

### Topic: Folders — three options explored (key deliverable)

- **Spec link:** Requirements D.14, D.15; Acceptance Criteria 13, 14, 15

- **Options:**
  1. **Real subdirectories** (e.g. `eval/scenarios/block-editor/<name>/`) — group by area in real filesystem directories.
  2. **Naming-convention pseudo-folders** (e.g. `block-editor-<concept>` as flat immediate children) — visual grouping via uniform prefix, no structural change.
  3. **Stay flat** (current descriptive-name convention, e.g. `taxonomy-register`, `settings-register`; no prefix).

- **Concrete breakage for Option 1 (real subdirectories):**
  - **Skillsmith discovery — BREAKS:** `enumerate.ts` reads only immediate children of `eval/scenarios/`; a nested `eval/scenarios/block-editor/<name>/scenario.yaml` is invisible. Skillsmith silently skips all nested scenarios. (enumerate.ts:33-37)
  - **e2e relative imports — BREAK:** specs import `../../utils/wp-cli.mjs` (two `../` levels). A spec at `eval/scenarios/block-editor/<name>/e2e.spec.mjs` would need `../../../utils/wp-cli.mjs` — import fails at Playwright collection time.
  - **Playwright still collects nested specs:** `testMatch: "**/e2e.spec.mjs"` is recursive — Playwright finds and runs nested specs that Skillsmith never graded → **discover-vs-grade mismatch** (Playwright runs, Skillsmith grades zero).
  - **verify-e2e.ts spec-location and failure attribution — BREAK:** `verify-e2e.ts:71-75` builds spec path from flat dirName; `scenarioDirOf` (lines 225-228) takes `segments[length-2]` as scenario key — nesting mis-attributes failures.
  - **What enabling real subdirectories requires:** fork or repinning external Skillsmith (`enumerate.ts` in gitignored `node_modules`) + fix `../../utils` import depth in every nested spec + update `verify-e2e.ts` spec-location and attribution logic. Multi-point in-repo + external-dependency change — **NOT low-risk**.

- **Option 2 cost/risk (pseudo-folder naming `block-editor-*`):**
  - Zero harness change. All scenarios remain flat immediate children of `eval/scenarios/`.
  - Skillsmith discovery unchanged — names match `/^[a-z0-9-]+$/`, direct children.
  - `../../utils/wp-cli.mjs` imports resolve correctly.
  - `verify-e2e.ts` spec-location and attribution unchanged.
  - Playwright collection unchanged.
  - Visual grouping: `ls eval/scenarios/ | sort` clusters all `block-editor-*` entries together.
  - Mild forward inconsistency: existing 21 scenarios use non-prefixed names (`taxonomy-register`, etc.); applying a `plugins-` prefix to them is a future decision, explicitly out of scope here.
  - Existing 21 scenarios NOT renamed.

- **Option 3 cost/risk (stay flat, no prefix):**
  - Zero change anywhere.
  - No visual grouping beyond catalog `# === Area: … ===` headers.
  - Consistent with current conventions.
  - No future migration cost or inconsistency.

- **Decision:** Adopt **Option 2 — naming-convention pseudo-folders with `block-editor-` prefix for all new Block Editor scenarios.**
- **Rationale:** Option 1 (real subdirectories) is classified as NOT low-risk per the spec — it requires changing an external pinned dependency plus three in-repo coupling points. Option 2 is zero-risk: every scenario remains a flat immediate child, discovery/e2e/harness are fully unchanged. Option 3 is equally safe but forfeits the grouping clarity the owner asked to explore. The `block-editor-` prefix is the natural convention (matches the `# === Area: Block Editor ===` catalog header, mirrors what a folder name would be). Real subdirectories are surfaced as a **future recommendation** contingent on an upstream Skillsmith change that adds recursive or configurable discovery.

---

### Topic: Block Editor sub-area selection

- **Spec link:** Requirements A.1–A.5, B.7; Acceptance Criteria 1–5, 6, 7

| Sub-area | Existing stub | e2e? | Single index.php/block.json edit? | Decision |
|---|---|---|---|---|
| Dynamic/server-rendered block | None | YES — render.php output assertable in DOM | Yes — edit render.php | IMPLEMENT e2e (`block-editor-dynamic-block`) |
| Block supports | None | YES — `{"backgroundColor":"vivid-red"}` in seeded comment → `has-background` class | Yes — block.json `supports` field | IMPLEMENT e2e (`block-editor-block-supports`) |
| Block styles | None | YES — `{"className":"is-style-custom"}` in seeded comment → class in wrapper | Yes — `register_block_style()` in index.php | IMPLEMENT e2e (`block-editor-block-styles`) |
| Block bindings | None | Feasible but non-standard (core/paragraph, not testing-block wrapper) | Yes — `register_block_bindings_source()` in index.php | IMPLEMENT judge-only (`block-editor-block-bindings`) — non-standard assertion pattern; judge-only is simpler and equally valid |
| Block filters (PHP render_block) | `block-filter-add-custom-attribute` (JS addFilter stub — distinct) | YES — `render_block` filter modifies rendered HTML; assertable on front end | Yes — `add_filter('render_block_wp-skill/testing-block', …)` in index.php | IMPLEMENT e2e (`block-editor-block-filters`) — clean front-end surface, index.php only, distinct from JS addFilter stub |
| Block variations | None | No — editor-only, no front-end footprint | No — JS-only registration path | DEFER to catalog stub (reason: editor-only, JS-only registration, no PHP equivalent, cannot be scoped to simple index.php edit) |
| Block registration / static block | `block-api-static-block` | No — save.js output, no dynamic PHP | Awkward — scaffold has no compiled JS `save()` | DEFER — existing stub retained (reason: requires compiled JS save function not provided by scaffold) |
| InnerBlocks | None | No — parent/child two-block setup | No — multi-block, exceeds scaffold | DEFER to catalog stub (reason: parent/child multi-block setup, cannot be scoped to single-block edit) |
| Block patterns | None | Partial (editor inserter only) | No — multi-block composition | DEFER to catalog stub (reason: multi-block composition, no clean single-block-scaffold surface) |

- **Final scenario list (5 scenarios — 4 e2e + 1 judge-only):**
  1. `block-editor-dynamic-block` — **e2e**
  2. `block-editor-block-supports` — **e2e**
  3. `block-editor-block-styles` — **e2e**
  4. `block-editor-block-filters` — **e2e** (render_block PHP filter; index.php only)
  5. `block-editor-block-bindings` — **judge-only**

- **Decision rationale:** Five scenarios (within the 4–6 target). Four e2e where the front-end DOM surface is clean and deterministic — dynamic block text output, color class from seeded backgroundColor attribute, style class from seeded className attribute, and modified rendered HTML from a `render_block` PHP filter. One judge-only for block bindings, where the e2e would require a non-standard assertion on a `core/paragraph` block (not the testing-block wrapper), making it a poor fit for the standard lifecycle. Block variations deferred (editor-only, JS-only). InnerBlocks/patterns deferred for multi-block complexity. Existing stubs (`block-api-static-block`, `block-filter-add-custom-attribute`) retained for still-unimplemented sub-areas with no name mismatch or orphan. The `block-editor-block-filters` scenario using `render_block` is distinct from the existing `block-filter-add-custom-attribute` stub (which targets the JS-side `addFilter` mechanism).
- **Traces to:** Requirements A.2, A.3, A.4, A.5, B.7; Acceptance Criteria 2, 3, 4, 5, 7.

---

### Topic: Per-scenario design (dir name, sub-area, source URLs, prompt shape, acceptance shape, e2e/judge split)

- **Spec link:** Requirements B.7–B.10; Acceptance Criteria 6–9

#### Scenario 1 — `block-editor-dynamic-block` (Dynamic/server-rendered block) — **e2e**

- **Sub-area:** Dynamic / server-rendered blocks.
- **Source URLs:** https://developer.wordpress.org/block-editor/how-to-guides/block-tutorial/creating-dynamic-blocks/
- **Mechanism:** Agent edits `render.php` to output PHP-computed HTML (no iAPI directives). No `edit.js` save function needed — the block is `"apiVersion": 3` with `"render": "file:./render.php"` (already the scaffold's pattern). The agent adds PHP logic that computes and returns HTML.
- **Prompt shape (user-voice, tool-agnostic, must pin a literal the e2e can assert):** Request a block whose front-end output is generated dynamically in PHP at render time — e.g. showing the current server date, or a simple PHP-computed string. Pin a specific output string or identifiable substring the e2e can assert.
  - Example pin: the block should output a wrapper containing the text `Dynamic output` (or a specific computed value).
- **Acceptance shape (judge-checked, clean checks, no URLs):** render.php exists and returns HTML; output is PHP-computed (not static); uses `$attributes` and/or `$content` from render callback args; `get_block_wrapper_attributes()` is called on the wrapper element; no JavaScript `save()` function returns non-null content (block is dynamic).
- **e2e:** seed a post with `<!-- wp:wp-skill/testing-block /-->`, assert the rendered `.wp-block-wp-skill-testing-block` wrapper contains the pinned text. Proves front-end server render.
- **Prompt literal to pin:** e.g. "the block should display the text `Hello from PHP`" — this is what the e2e asserts on the rendered wrapper.

#### Scenario 2 — `block-editor-block-supports` (Block supports) — **e2e**

- **Sub-area:** Block supports.
- **Source URLs:** https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/
- **Mechanism:** Agent adds `"supports": {"color": {"background": true, "text": true}}` (or similar) to `block.json`. The block must call `get_block_wrapper_attributes()` on its wrapper (mandated by scaffold) so the wrapper receives the color classes from stored attributes.
- **Prompt shape:** Request enabling background and text color controls on the block (user wants to be able to style the block's background color from the editor). Pin the seeded attribute the e2e will use: `vivid-red`.
  - Example: "...I want to be able to set a `vivid-red` background color on my block..."
- **Acceptance shape:** `block.json` declares at least one support under `"supports"` (e.g. color background or text); `get_block_wrapper_attributes()` is called in render.php on the wrapper element; no custom attribute registration needed for built-in supports.
- **e2e:** seed a post with `<!-- wp:wp-skill/testing-block {"backgroundColor":"vivid-red"} /-->`, assert the rendered `.wp-block-wp-skill-testing-block` wrapper has class `has-background` (and/or `has-vivid-red-background-color`). Proves the support is wired through `get_block_wrapper_attributes()`.

#### Scenario 3 — `block-editor-block-styles` (Block styles) — **e2e**

- **Sub-area:** Block styles.
- **Source URLs:** https://developer.wordpress.org/block-editor/reference-guides/block-api/block-styles/
- **Mechanism:** Agent calls `register_block_style('wp-skill/testing-block', ['name' => 'custom', 'label' => '...'])` in `index.php` on `init`. The style registers as an editor option; when the block comment includes `{"className":"is-style-custom"}`, `get_block_wrapper_attributes()` emits `is-style-custom` on the wrapper.
- **Prompt shape:** Request a named visual style for the block that can be selected from the editor. Pin the style slug `custom` (the e2e asserts `is-style-custom`).
  - Example: "...register a block style called `custom` for my block..."
- **Acceptance shape:** `register_block_style()` called for `wp-skill/testing-block` on `init`; style has a `name` (slug) and a `label`; no CSS file required (CSS is optional, the class alone is the acceptance point).
- **e2e:** seed a post with `<!-- wp:wp-skill/testing-block {"className":"is-style-custom"} /-->`, assert the rendered `.wp-block-wp-skill-testing-block` wrapper has class `is-style-custom`. Proves style registration and class emission.

#### Scenario 4 — `block-editor-block-bindings` (Block bindings) — **judge-only**

- **Sub-area:** Block bindings.
- **Source URLs:** https://developer.wordpress.org/block-editor/reference-guides/block-api/block-bindings/
- **Mechanism:** Agent calls `register_block_bindings_source('my-plugin/greeting', [...])` in `index.php` on `init`, providing a `get_value_callback` that returns a string. No e2e: seeding the block comment with binding metadata (`{"metadata":{"bindings":{"content":{"source":"my-plugin/greeting"}}}}`) is disproportionately complex for a simple scenario.
- **Prompt shape:** Request a custom data source that can supply a value to a block attribute from PHP. Pin the source name so the acceptance can check it: e.g. source namespace `my-plugin/greeting`.
  - Example: "...register a custom block binding source under the name `my-plugin/greeting` that returns a greeting string..."
- **Acceptance shape:** `register_block_bindings_source()` called on `init`; source name matches `/^[a-z0-9-]+\/[a-z0-9-]+$/`; `get_value_callback` returns a non-empty string; source namespace matches the plugin's namespace.
- **No e2e:** binding output requires complex block comment metadata injection; judge checks the PHP registration is correct.
- **WP version risk:** WP 6.5+ required. Flag in design: if wp-env uses an older pinned WP, registration silently does nothing. A failing grade is acceptable per the spec.

#### Scenario 5 — `block-editor-block-filters` (Block filters / PHP render_block) — **e2e**

- **Sub-area:** Block filters (PHP-side, `render_block` / `render_block_{namespace/block}` filter).
- **Source URLs:** https://developer.wordpress.org/block-editor/reference-guides/filters/block-filters/ (covers both PHP and JS block filters, including `render_block`)
- **Mechanism:** Agent adds a `render_block_wp-skill/testing-block` (or `render_block`) PHP filter in `index.php` that modifies the block's rendered HTML — e.g. appending a string to the output, wrapping it, or adding an attribute to the wrapper. This is a pure PHP hook, no JavaScript needed, runs at request time on the front-end output.
- **Prompt shape:** Request adding a PHP-side modification to the block's rendered output — e.g. appending a short string after the block's output. Pin a specific string the e2e can assert.
  - Example: "...I want my block's output to always include the text `Powered by my plugin` appended after the block's HTML..."
- **Acceptance shape:** A `render_block` or `render_block_wp-skill/testing-block` filter is registered in `index.php`; the callback receives and returns the block HTML; the modification (append/prepend/wrap) is applied to the returned HTML; the filter targets only `wp-skill/testing-block` (either via the block-specific hook or a name check in the callback).
- **e2e:** seed a post with `<!-- wp:wp-skill/testing-block /-->`, assert the rendered page contains the pinned appended string (e.g. `Powered by my plugin`) within or adjacent to the `.wp-block-wp-skill-testing-block` wrapper. The `render_block` filter output is fully front-end-visible. `afterAll`: `deactivateAllPlugins()` + `deleteAllPosts()`.
- **Prompt literal to pin:** the exact string appended to the block output (e.g. `Powered by my plugin`) — this is what the e2e asserts.

---

### Topic: Components

- **Spec link:** Requirements B.8, B.9, E.17, E.18, E.19; Acceptance Criteria 8, 16, 17, 18

**New components (this review):**
- `eval/scenarios/block-editor-dynamic-block/` — scenario.yaml + e2e.spec.mjs (e2e)
- `eval/scenarios/block-editor-block-supports/` — scenario.yaml + e2e.spec.mjs (e2e)
- `eval/scenarios/block-editor-block-styles/` — scenario.yaml + e2e.spec.mjs (e2e)
- `eval/scenarios/block-editor-block-filters/` — scenario.yaml + e2e.spec.mjs (e2e)
- `eval/scenarios/block-editor-block-bindings/` — scenario.yaml only (judge-only)

All five directory names:
- Match `/^[a-z0-9-]+$/` ✓
- Equal their `scenario.yaml` `name` ✓
- Are flat immediate children of `eval/scenarios/` ✓
- Do not collide with any existing scenario name ✓ (verified: existing names are counter, config-fetch, async-fetch, derived-double, focus-trap-menu, fruit-list-each, independent-counters, minimal-scaffold, paginated-list, shared-state, toggle-visibility, cpt-register, filter-body-class, rest-custom-endpoint, shortcode-with-attr, taxonomy-register, post-meta-rest, settings-register, cron-event, i18n-textdomain, admin-menu-page)

**Untouched-but-relevant components:**
- `eval/utils/scaffold-plugin.ts` — scaffolds per-(scenario, agent) plugin; block name fixed.
- `eval/utils/verify-e2e.ts` — locates e2e spec at `eval/scenarios/<dirName>/e2e.spec.mjs`, runs build, boots wp-env, runs specs.
- `eval/utils/wp-cli.mjs` — exports `deactivateAllPlugins()` used by all specs.
- `eval/scenarios/_wp-dev-candidates.yaml` — catalog; Block Editor section updated with 5 new full records + new stubs.
- `playwright.config.ts` — `testMatch: "**/e2e.spec.mjs"`, `testDir: eval/scenarios`.
- `node_modules/@automattic/skillsmith` — external pinned dependency; NOT modified.

**Explicitly NOT modified:**
- Any existing scenario directory.
- `eval/scenarios/_candidates.yaml` (iAPI catalog).
- `eval/rubrics/` (no new shared rubric).
- Anything under `skills/wordpress-development/`.

---

### Topic: Interfaces and data flow

- **Spec link:** Requirements B.7–B.10; Acceptance Criteria 6–9, 16

**scenario.yaml schema** (same as review-1):
```yaml
name: block-editor-dynamic-block   # matches /^[a-z0-9-]+$/, equals dir name
description: <one line>
skills:
  - wordpress-development
prompt: |
  <user-voice, outcome-phrased, does not name register_block_type/render_callback/etc.>
acceptance:
  - <clean human-readable check, no embedded URL>
rubrics: []
```

**e2e.spec.mjs interface** (four e2e scenarios; same lifecycle as review-1):
```js
import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../utils/wp-cli.mjs";

test.describe("block-editor-<concept> scenario", () => {
  test.beforeAll(async ({ requestUtils }, workerInfo) => {
    deactivateAllPlugins();
    await requestUtils.activatePlugin(`plugin-block-editor-<concept>-${workerInfo.project.metadata.agentId}`);
    // seed post with <!-- wp:wp-skill/testing-block {<seeded-attrs>} /-->
    await requestUtils.createPost({ status: "publish", content: "<!-- wp:wp-skill/testing-block {\"<key>\":\"<pinned-value>\"} /-->" });
  });
  test.afterAll(async ({ requestUtils }) => {
    deactivateAllPlugins();
    await requestUtils.deleteAllPosts();
  });
  test("block renders expected output", async ({ page }) => {
    await page.goto(/* post url */);
    await expect(page.locator(".wp-block-wp-skill-testing-block")).toHaveClass(/has-background|is-style-custom|…/);
    // OR: toContainText for dynamic block
  });
});
```

**Catalog record shape** (same as review-1 full records, Block Editor area):
```yaml
- name: block-editor-dynamic-block
  description: <one line>
  difficulty: simple
  concepts: [render.php, dynamic-block, server-side-render]
  source: dev.wordpress.org
  source_files:
    - https://developer.wordpress.org/block-editor/how-to-guides/block-tutorial/creating-dynamic-blocks/
  prompt: |
    <exact same text as scenario.yaml prompt>
  acceptance:
    - <exact same items as scenario.yaml acceptance>
```

No `source_files` in `scenario.yaml`. No catalog-only fields in `scenario.yaml`.

---

### Topic: Catalog reconciliation

- **Spec link:** Requirements C.11, C.12, C.13; Acceptance Criteria 10, 11, 12

**Existing Block Editor stubs — disposition:**

| Existing stub | Sub-area covered | Implemented scenario? | Action |
|---|---|---|---|
| `block-api-static-block` | Static block (edit.js + save.js) | No — distinct from dynamic block | Retain as lighter stub; add `# reason: requires compiled JS save() function, not provided by scaffold` comment |
| `block-filter-add-custom-attribute` | JS-side addFilter (blocks.registerBlockType) | No — the implemented `block-editor-block-filters` uses PHP register_block_type_args, a distinct mechanism | Retain as lighter stub for JS addFilter approach; no name mismatch with implemented scenario |

**No orphan/mismatch:** neither existing stub covers a sub-area implemented by the five new scenarios. Both stay as stubs for still-unimplemented sub-areas.

**New stubs to add** (deferred sub-areas without catalog representation yet):
- `block-editor-block-variations` — stub (reason: JS-only, requires JavaScript file + enqueue beyond simple index.php edit)
- `block-editor-inner-blocks` — stub (reason: parent/child multi-block setup, cannot be scoped to single-block-scaffold edit)
- `block-editor-block-patterns` — stub (reason: multi-block composition, no clean single-block-scaffold surface)

**Full records for implemented scenarios (5):**
Each gets a full record in `_wp-dev-candidates.yaml` under `# === Area: Block Editor ===` with:
- `name` == directory name == `scenario.yaml` `name`
- `prompt` and `acceptance` text identical to the shipped `scenario.yaml`
- `source_files` listing the developer.wordpress.org URL(s) grounding its acceptance points
- `difficulty: simple`, `concepts: [...]`, `source: dev.wordpress.org`

**iAPI catalog:** `eval/scenarios/_candidates.yaml` — NOT touched.

**Non-Block-Editor records in `_wp-dev-candidates.yaml`:** NOT modified (Themes, Plugins, Common APIs, Advanced Admin, Coding Standards, Playground, Code Reference, REST API, WP-CLI sections unchanged).

---

### Topic: Dependencies

- **Spec link:** Requirement E.17; Acceptance Criterion 17

No new dependencies. All dependencies already present:
- `@automattic/skillsmith` — external pinned SHA; not modified.
- `@wordpress/e2e-test-utils-playwright` — `test`, `expect`, `requestUtils`.
- `@wordpress/env` — `wp-env` runtime.
- `@wordpress/scripts` — `wp-scripts build`.
- Playwright.
- `eval/utils/wp-cli.mjs` — `deactivateAllPlugins()`.
- developer.wordpress.org — documentation grounding (not a runtime dependency).

WP 6.5+ is needed for the block bindings scenario to function at runtime; the scaffold's `wp-env` should use a current WP version. A failing grade is acceptable per the spec.

---

### Topic: Failure modes and observability

- **Spec link:** Requirements E.16, E.17, E.18; Acceptance Criteria 16, 17, 18

- **Scenario not discovered:** any new scenario not placed as a flat immediate child of `eval/scenarios/`, or missing `scenario.yaml`, is silently skipped. Mitigation: all five use the flat layout.
- **Malformed scenario.yaml:** `isScenarioShape` requires `rubrics` as a present array (`rubrics: []`). An omitted key (`undefined`) or valueless `rubrics:` (`null`) fails shape check and scenario is skipped silently. Mitigation: every scenario declares `rubrics: []` explicitly.
- **Invalid name:** `scaffold-plugin.ts` throws if `name` does not match `/^[a-z0-9-]+$/`. All five names conform.
- **Wrong plugin slug in e2e:** spec must activate `plugin-<scenario.name>-${workerInfo.project.metadata.agentId}`. Names contain hyphens only (no underscores), which is valid.
- **Block color class not present:** if agent does not call `get_block_wrapper_attributes()` on the wrapper, the `has-background` class will not appear. This is the scenario-level acceptance point, not a harness error; a failing grade is expected against current skill.
- **Block style class not present:** same — if agent calls `register_block_style` but doesn't use `get_block_wrapper_attributes()`, the class won't appear in rendered output. Expected failing grade.
- **Block bindings WP version:** if wp-env uses WP < 6.5, `register_block_bindings_source` function does not exist → PHP fatal error or silent no-op. The scenario is judge-only so no e2e fails; the PHP fatal would be visible in build/activation logs. Risk accepted; failing grade is acceptable.
- **block-editor-block-filters filter targeting:** if the agent uses a generic `render_block` filter (not the block-specific `render_block_wp-skill/testing-block` variant) and does not check the block name, it modifies ALL blocks' rendered output. This is a correctness acceptance point, not a harness error.
- **Observability:** e2e failures via Playwright JSON report → `verify-e2e.ts` → per-(scenario, agent) failure records. Judge results via Skillsmith grading output.

---

## Open Questions

1. **Exact prompt literal for `block-editor-dynamic-block`:** which specific PHP-computed string should be pinned in the prompt for the e2e assertion? Phase 4 decides; the design requires the literal to be pinned in the prompt (not left to the agent). Suggested: `Hello from PHP` or a date-stamp wrapper with a predictable prefix.
2. **Exact prompt literal for `block-editor-block-filters`:** which specific string should the `render_block` filter append, pinned in the prompt? Phase 4 decides. Suggested: `Powered by my plugin` or similar.
3. **`wp-env` WP version confirmation:** researcher confirmed `@wordpress/env@11.x` fetches latest WP at env-start (no pinned version) — so WP 6.8+ is in effect and block bindings (WP 6.5+) are safe. Phase 4 should confirm the `wp-env.json` or equivalent config has no explicit version pin that would contradict this.

## Risks

- **Block supports e2e depends on `get_block_wrapper_attributes()` being called:** testing-agent.md mandates it, but if an agent omits it, the color class won't appear and the e2e fails. This is intentional — the scenario tests that the agent wires supports correctly through the wrapper attributes function. Not a harness risk.
- **Block styles class emission:** the `is-style-custom` class comes from the stored `className` attribute processed by `get_block_wrapper_attributes()`. If an agent calls `register_block_style()` but omits `get_block_wrapper_attributes()` in render.php, the class won't appear in rendered output. Same mechanism as block supports — intentional acceptance point.
- **Block filters prompt tool-agnosticism:** the `render_block` hook is a specific PHP API, but the prompt can be phrased as an outcome ("I want text appended to my block's output on every page load") without naming the hook — the testing agent figures out the mechanism. Low risk.
- **Block bindings WP 6.5+ requirement:** researcher confirmed wp-env fetches latest WP, so WP 6.8+ is in effect. Risk is low. Noted for phase 4 verification.
- **Static block sub-area not covered:** the `block-api-static-block` stub stays a stub. The dynamic block scenario covers server-rendered output but not the static JS `save()` mechanism. Intentional; future reviews can address when scaffold is extended with a JS build step.
- **Naming forward inconsistency:** new `block-editor-*` scenarios sit alongside existing non-prefixed `taxonomy-register`, `settings-register`, etc. Future reviews face the same naming choice for other areas. A suite-wide rename to area-prefixed names is a future recommendation (surfaced in the design doc), not in scope here.
