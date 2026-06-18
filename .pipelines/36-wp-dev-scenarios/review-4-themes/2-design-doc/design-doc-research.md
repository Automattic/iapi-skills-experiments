# Design Research: Themes scenarios

## Research

<!-- Non-trivial findings from the design-doc-researcher, with sources cited. -->

### WordPress asset enqueue — front-end HTML output (VERIFIED, r4dresearcher)

A plugin can enqueue front-end assets exactly as a theme does: the `wp_enqueue_scripts` action is a
**global front-end hook that fires regardless of registrant** (plugin or theme). It is fired by
`wp_head()` (`do_action('wp_enqueue_scripts')`), which every standard theme (block and classic) calls.
WP_Styles / WP_Scripts then print the same `<link>` / `<script>` markup regardless of which theme is
active. This is the same global-action mechanism that makes `filter-body-class` work from a plugin —
no theme involvement, no content seeding.

Enqueuing via `wp_enqueue_style($handle, $src, ...)` and `wp_enqueue_script($handle, $src, ...)` on
that hook produces, in the front-end page HTML, these WordPress-emitted elements (markers verified
first-hand by downloading + grepping WP core source on the GitHub mirror WordPress/WordPress master,
not from memory):

- **Stylesheet:** `<link rel='stylesheet' id='{handle}-css' href='...' media='...' />`
  - Source: `wp-includes/class-wp-styles.php` line 205: printf template
    `"<link rel='%s' id='%s-css'%s href='%s' media='%s' />\n"` — the id is `{handle}-css`.
  - (RTL variant emits `{handle}-rtl-css` at line 236 — irrelevant unless an RTL stylesheet is shipped,
    which this scenario does not.)
- **Script:** `<script src='...' id='{handle}-js'></script>`
  - Source: `wp-includes/class-wp-scripts.php` line ~456: `'id' => "{$handle}-js"` in the `do_item()`
    attribute array, emitted via `wp_get_script_tag($attr)` — the id is `{handle}-js`.

So for a pinned handle `H`, the page emits `<link id="H-css">` and `<script id="H-js">`. The id
attribute depends **only on the handle name** (which the plugin pins), making the assertion
theme-independent.

**Two nuances to pin (both verified):**
1. The handle is passed through `esc_attr()` before being printed into the id, so the handle must be a
   clean slug (lowercase-kebab) to round-trip unchanged. A normal kebab handle is safe.
2. Scripts default to wherever they are enqueued; `$in_footer` false → head, true → footer — but the
   `<script id='{handle}-js'>` tag is emitted on `page.goto("/")` either way, and a stylesheet is
   always in `<head>`. A Playwright `script#{handle}-js` locator matches wherever the tag lands.

**Grounding URL (HTTP 200, verified):** https://developer.wordpress.org/themes/core-concepts/including-assets/
— title "Including Assets"; states the `wp_enqueue_scripts` hook for both styles and scripts on the
front end; example: `add_action('wp_enqueue_scripts', 'theme_slug_enqueue_scripts')` then
`wp_enqueue_script('theme-slug-navigation', ...)`. This is THE grounding page. The legacy stub's
secondary URL https://developer.wordpress.org/themes/classic-themes/ is fine as a secondary citation.

**Shared handle is safe (VERIFIED, Q2-A):** WP_Styles and WP_Scripts are separate registries
(separate `$wp_styles` / `$wp_scripts` WP_Dependencies instances). The same handle string in both
does NOT collide — they never look each other up — and both tags emit with distinct suffixes
(`-css`, `-js`). So a single pinned handle (e.g. `themes-frontend-assets`) drives BOTH
`<link id="themes-frontend-assets-css">` and `<script id="themes-frontend-assets-js">`.

**esc_attr round-trip (VERIFIED, Q2-B):** `esc_attr` only escapes `& < > " '`; a lowercase-kebab
handle has none, so `themes-frontend-assets` is byte-for-byte unchanged → `id="themes-frontend-assets-css"`
is exact.

**CRITICAL: a non-empty `$src` is REQUIRED or the tag does not render (VERIFIED, Q2-C).** Both
`WP_Styles::do_item()` (class-wp-styles.php ~line 184) and `WP_Scripts::do_item()`
(class-wp-scripts.php ~line 403) begin with `if ( ! $src ) { ...inline only...; return true; }`:
with an empty/falsy `$src` NO `<link>` / `<script>` tag is printed. With a non-empty `$src` the tag
is printed with the id. Core does **no filesystem/HTTP existence check** on the URL (`_css_href` /
`esc_url_raw` just string-build it), so any non-empty URL emits the tag — the asset need not load 200.
Two further gotchas: (a) `wp_register_style/script` WITHOUT a following `wp_enqueue_*` emits nothing —
the asset must be ENQUEUED; (b) calling `wp_enqueue_style($handle)` with no `$src` (alias use) emits
nothing. **Implication for the scenario:** the prompt must ask the agent to load an actual stylesheet
file and an actual script file (implying a real, non-empty `$src`), and the acceptance must require
the asset to be enqueued (not merely registered) and to carry a source. A real plugin-relative path
(e.g. `plugins_url('assets/style.css', __FILE__)`) is the realistic, safe form.

**Sub-area distinctness (VERIFIED, Q2-D):** both judge-only scenarios pass the same sub-area-level
dedup test review-1 used (distinct handbook chapter + distinct registration function = non-dup; mere
shape-similarity "register a thing on a hook" was never the bar — that is how `taxonomy-register`
cleared against `cpt-register`). `register_nav_menus` (after_setup_theme, Themes nav-menus chapter)
and `register_sidebar` (widgets_init, Themes widgets chapter) are each distinct from `cpt-register`,
`taxonomy-register`, `settings-register`, `admin-menu-page`, `cron-event`, and from each other.

### Nav menu registration — hook and function (VERIFIED, r4dresearcher)

- **Function:** `register_nav_menus( array( 'slug' => 'Human Label' ) )` — an associative array whose
  key is the location slug and whose value is the human-readable label. Registering a nav-menu
  location auto-adds theme support for menus.
- **Hook:** `after_setup_theme`.
- **Why judge-only:** `register_nav_menus` produces **no front-end output by itself**; rendering a menu
  at the location requires a **theme template** calling `wp_nav_menu()` — theme-artifact-bound, which
  the plugin scaffold cannot ship. The acceptance therefore grades the produced PHP: registration on
  `after_setup_theme`, the pinned location slug, and a translatable label.
- **Grounding URL (HTTP 200, verified):** https://developer.wordpress.org/reference/functions/register_nav_menus/
  — example `register_nav_menus( array( 'pluginbuddy_mobile' => '...', 'footer_menu' => '...' ) )`.

### Sidebar / widget area registration — hook and function (VERIFIED, r4dresearcher)

- **Function:** `register_sidebar( array( 'name' => __('Main Sidebar','textdomain'), 'id' => 'sidebar-1',
  'before_widget' => ..., 'after_widget' => ..., 'before_title' => ..., 'after_title' => ... ) )`.
- **Hook:** `widgets_init`.
- **Why judge-only:** `register_sidebar` produces **no front-end output** without a theme template
  calling `dynamic_sidebar()` — theme-bound. The acceptance grades the produced PHP: registration on
  `widgets_init`, the pinned `id` and `name`, and the before/after markup wrappers.
- **Grounding URL (HTTP 200, verified):** https://developer.wordpress.org/reference/functions/register_sidebar/
  — example registers inside a function hooked via `add_action( 'widgets_init', ... )`.

### e2e lifecycle — filter-body-class precedent

The `filter-body-class` spec (at `eval/scenarios/filter-body-class/e2e.spec.mjs`) provides the
canonical no-seeding, front-end-only lifecycle:
- Imports `{ expect, test }` from `@wordpress/e2e-test-utils-playwright`
- Imports `{ deactivateAllPlugins }` from `../../utils/wp-cli.mjs`
- `beforeAll`: `deactivateAllPlugins()` + `await requestUtils.activatePlugin("plugin-<name>-${workerInfo.project.metadata.agentId}")`
- `afterAll`: `deactivateAllPlugins()`
- Test body: `await page.goto("/")` + assertion against the resulting page HTML/DOM
- No content seeding; no new `eval/utils/` helper.

The enqueue scenario follows this lifecycle exactly, substituting the DOM assertion for
checking that the WordPress-emitted `<link id="{handle}-css">` and `<script id="{handle}-js">`
elements are present in the page HTML after a front-end page load.

## Topics

### Topic: Scenario names (themes-* naming)

- **Spec link:** Requirements C-11; Acceptance Criteria 11
- **Decision:** Three scenarios with `themes-*` prefix:
  1. `themes-enqueue-assets` (e2e) — renames/promotes the `classic-theme-enqueue-scripts` stub
  2. `themes-nav-menu-location` (judge-only)
  3. `themes-sidebar-widget-area` (judge-only)
- **Rationale:** Each name is short, names the concept clearly, uses only `/^[a-z0-9-]+$/`, and
  carries the `themes-` prefix. `themes-enqueue-assets` is preferred over `themes-enqueue-scripts`
  or `themes-enqueue-stylesheet-script` because it names the outcome (assets = stylesheet + script)
  concisely. `themes-nav-menu-location` and `themes-sidebar-widget-area` name the registered
  entity directly. All three are distinct from every existing scenario name confirmed in the
  review-3 design doc's enumeration (24 existing dirs, none with `themes-` prefix).

### Topic: e2e scenario — themes-enqueue-assets

- **Spec link:** Requirements A-2, A-4, A-5, B-6, B-8; Acceptance Criteria 2, 4, 5, 6, 8
- **Sub-area:** Themes → Core Concepts → Including Assets (front-end asset enqueue). Grounding URL:
  https://developer.wordpress.org/themes/core-concepts/including-assets/ (secondary:
  https://developer.wordpress.org/themes/classic-themes/).
- **Mechanism:** Agent edits the scaffolded plugin's `index.php` to add ONE callback on
  `wp_enqueue_scripts` that calls `wp_enqueue_style($handle, $src, ...)` and
  `wp_enqueue_script($handle, $src, ...)`. Verified theme-independent and plugin-expressible (Q1).
- **Handle decision (DECIDED — single shared handle):** pin ONE handle used for both the style and the
  script. Q2-A verified the separate-registry safety, so the same handle string is legal in both and
  emits `<link id="{handle}-css">` and `<script id="{handle}-js">` with no collision. Recommended handle:
  `themes-frontend-assets` (clean lowercase-kebab → round-trips through `esc_attr()` into the id
  verbatim, Q2-B). Phase 4 may pick a different clean-kebab handle as long as it is pinned in the prompt
  and matched in the e2e. A single handle keeps the prompt to one pinned literal; two handles were the
  fallback and are not needed.
- **`$src` requirement baked into prompt + acceptance (DECIDED, from Q2-C):** because an empty `$src`
  emits no tag, the prompt asks the agent to **load an actual stylesheet file and an actual script file**
  on the front end (implying a real, non-empty source), and the acceptance requires the stylesheet and
  the script to be **enqueued** (not merely registered) with a source — so the `<link>` / `<script>`
  tags actually render. A real plugin-relative `$src` is the realistic form; the e2e only checks the id
  is present, not that the asset loads 200.
- **e2e lifecycle (filter-body-class template, verbatim):** imports `{ expect, test }` from
  `@wordpress/e2e-test-utils-playwright` and `{ deactivateAllPlugins }` from `../../utils/wp-cli.mjs`;
  `beforeAll` = `deactivateAllPlugins()` + `await requestUtils.activatePlugin(\`plugin-themes-enqueue-assets-${workerInfo.project.metadata.agentId}\`)`;
  `afterAll` = `deactivateAllPlugins()`; test body = `await page.goto("/")` then assert
  `await expect(page.locator("link#themes-frontend-assets-css")).toBeAttached()` and
  `await expect(page.locator("script#themes-frontend-assets-js")).toBeAttached()`. No seeding; no new
  `eval/utils/` helper. (`toBeAttached()` checks presence in the DOM regardless of visibility — correct
  for a `<link>` in `<head>` and a `<script>` that may sit in head or footer.)
- **Pinned literals (prompt ↔ assertion lockstep):** the handle `themes-frontend-assets` (the only
  literal the e2e asserts — it drives both the `-css` and `-js` ids). Stated in the prompt.
- **Distinctness (AC 5):** distinct from the iAPI block `view.js` loading mechanism — that is a
  `block.json` build-tooling mechanism; this is a front-end asset-enqueue hook (`wp_enqueue_scripts`)
  from a plain plugin. Distinct handbook chapter (Themes → Including Assets).
- **Decision:** Implement as the single e2e scenario, exactly as above. **Rationale:** it is the one
  Themes sub-area that yields a clean, theme-independent, front-end-visible assertion (the emitted id
  attributes), realizable as a single `index.php` edit on one global hook.

### Topic: Judge-only scenario — themes-nav-menu-location

- **Spec link:** Requirements A-3 (ii), A-4, B-7, A-5; Acceptance Criteria 3, 4, 5, 7
- **Sub-area:** Themes → Navigation Menus. Grounding URL:
  https://developer.wordpress.org/reference/functions/register_nav_menus/.
- **Mechanism:** single `index.php` edit — a callback on `after_setup_theme` calling
  `register_nav_menus( array( '<slug>' => '<Human Label>' ) )` with a translatable label.
- **Why judge-only (AC 2, 7):** produces no front-end output by itself; rendering needs a theme template
  calling `wp_nav_menu()` (theme-artifact-bound). Graded against the produced PHP; no `e2e.spec.mjs`.
- **Acceptance shape (draft for phase 4):** registers on `after_setup_theme`; registers the pinned
  location slug; the label is wrapped for translation (`__()`); no theme template / `wp_nav_menu()`
  required.
- **Pinned literal:** the location slug (e.g. `primary` or a themes-specific slug — exact value a phase-4
  call; must match `/^[a-z0-9_-]+$/`-style menu slug rules).
- **Distinctness (AC 5):** different registration function (`register_nav_menus`) and different handbook
  chapter than cpt-register / taxonomy-register / settings-register / admin-menu-page / cron-event, and
  than the sidebar scenario. Confirmed (Q2-D).
- **Decision:** Implement as judge-only `scenario.yaml`-only directory.

### Topic: Judge-only scenario — themes-sidebar-widget-area

- **Spec link:** Requirements A-3 (iii), A-4, B-7, A-5; Acceptance Criteria 3, 4, 5, 7
- **Sub-area:** Themes → Widgets (register a sidebar / widget area). Grounding URL:
  https://developer.wordpress.org/reference/functions/register_sidebar/.
- **Mechanism:** single `index.php` edit — a callback on `widgets_init` calling
  `register_sidebar( array( 'name' => __('<Name>','<td>'), 'id' => '<id>', 'before_widget' => ...,
  'after_widget' => ..., 'before_title' => ..., 'after_title' => ... ) )`.
- **Why judge-only (AC 2, 7):** produces no front-end output without a theme template calling
  `dynamic_sidebar()` (theme-bound). Graded against the produced PHP; no `e2e.spec.mjs`.
- **Acceptance shape (draft for phase 4):** registers on `widgets_init`; provides the pinned `id` and a
  human-readable `name`; provides before/after widget + title markup wrappers; name is translatable.
- **Pinned literals:** the sidebar `id` and `name` (exact values a phase-4 call).
- **Distinctness (AC 5):** different registration function (`register_sidebar`) and handbook chapter than
  every existing `register_*` scenario and than the nav-menu scenario. Confirmed (Q2-D).
- **Decision:** Implement as judge-only `scenario.yaml`-only directory.

### Topic: Catalog promotion plan

- **Spec link:** Requirements D-12, D-13, D-14, D-15; Acceptance Criteria 12, 13, 14, 15
- **Confirmed against current catalog** (`eval/scenarios/_wp-dev-candidates.yaml`): Themes area header at
  line 156; `theme-json-custom-color-palette` stub at line 158 (currently NO comment);
  `classic-theme-enqueue-scripts` stub at line 167; header line at 28-29.
- **Actions (decided):**
  1. **Rename + promote** the `classic-theme-enqueue-scripts` stub (line 167) to a full record named
     `themes-enqueue-assets`, carrying `prompt` + `acceptance` **verbatim** from the shipped
     `scenario.yaml`, plus `description` / `difficulty: simple` / `concepts` / `source: dev.wordpress.org`
     / `source_files` (the including-assets handbook page; classic-themes as secondary). This is a record
     rename, not a scenario rename (no shipped dir exists yet) — satisfies Req 11/13.
  2. **Add two brand-new full records** — `themes-nav-menu-location` and `themes-sidebar-widget-area` —
     under a new `# Implemented Themes scenarios — full records` sub-header (mirrors the Block Editor /
     REST API pattern). Each carries `prompt`/`acceptance` verbatim from its `scenario.yaml` (judge-only
     scenarios still get full records, like cron-event / admin-menu-page), plus
     `description`/`difficulty`/`concepts`/`source`/`source_files` (the `register_nav_menus` /
     `register_sidebar` reference pages respectively).
  3. **Annotate** the `theme-json-custom-color-palette` stub (line 158) by ADDING a
     `# Deferred: <reason>` comment recording that theme.json is a theme-root artifact the plugin scaffold
     cannot ship (theme-artifact-bound; not feasible without a theme-scaffold harness change). It stays a
     lighter stub (no prompt/acceptance). Satisfies Req 13 / AC 19.
  4. **Fix the header line** (28-29): "...the implemented Plugins, Block Editor, and REST API scenarios..."
     → add Themes ("...Plugins, Block Editor, REST API, and Themes scenarios..."). Only header change.
  5. **Add NO new stubs** for uncovered Themes sub-areas that lack one today (block templates, template
     parts, template hierarchy, classic template files, custom-header/background, `style.css`). Their
     exclusion is recorded only in the spec. Satisfies Req 13 / AC 19/20.
- **Scope guard (AC 15):** the iAPI `_candidates.yaml` is untouched; within `_wp-dev-candidates.yaml`
  only Themes records (and the Themes stubs) and the one header line change — phase 4/5 must diff-check.
- **Decision:** as above.

### Topic: Surfaced future recommendation — theme-scaffold harness change

- **Spec link:** Requirement F-19; Acceptance Criterion 19 ("recorded as a future out-of-scope
  recommendation rather than implemented").
- **Decision:** Record (not implement) a future recommendation that the Skillsmith harness gain the
  ability to scaffold a **theme** (not only a `plugin-<scenario>-<agentId>`). This would unblock the
  theme-artifact-bound Themes sub-areas (theme.json as a file, block templates, template parts, template
  hierarchy, classic template files, custom-header/background, `style.css`), which are deferred this
  review. This is surfaced to the design-doc-writer to carry into the design doc as an out-of-scope
  future recommendation.

## Open Questions

All design-blocking questions are resolved. The following are phase-4 confirmations (latitude, not
blockers):

- **Exact pinned handle for the e2e** — recommended `themes-frontend-assets`; phase 4 may choose any
  clean lowercase-kebab handle, but it MUST be pinned in the prompt and matched verbatim in the e2e
  (`#{handle}-css` / `#{handle}-js`). Prompt ↔ assertion lockstep (Req 8).
- **Exact pinned slug/name values for the two judge-only scenarios** — the nav-menu location slug and
  the sidebar `id`/`name`. Phase 4 picks readable values; they are pinned in the prompt and graded in
  acceptance. Not load-bearing for the design.
- **Exact wording of prompts/acceptance** — phase 4 writes the final user-voice, tool-agnostic text
  (no function names, no URLs in `scenario.yaml`). The design fixes the mechanism and the pinned
  literals; the prose is a phase-4 task.

## Risks

- **`$src` must be non-empty or the enqueue scenario's e2e fails (RESOLVED into the design).** An empty
  `$src` (or register-only without enqueue) emits no `<link>`/`<script>`, so the id assertion would
  fail. Mitigation baked into the design: the prompt asks the agent to LOAD an actual stylesheet file
  and script file, and the acceptance requires the assets to be ENQUEUED with a source (not merely
  registered). A failing grade against the current skill is acceptable per the spec, but a well-formed
  agent following the prompt produces renderable tags. Flagged for phase 4 so the prompt does not
  accidentally read as "register a handle".
- **Plugin-expressed enqueue is theme-independent (RESOLVED).** `wp_enqueue_scripts` fires from
  `wp_head()` for every standard theme regardless of registrant; the emitted id depends only on the
  pinned handle. Verified first-hand from WP core source — the key feasibility claim holds.
- **New e2e assertion SHAPE (low).** The enqueue spec uses a `page.locator("link#... ")` /
  `page.locator("script#...")` presence assertion — a new shape for this suite (filter-body-class uses
  `toHaveClass` on `body`), but the same lifecycle, fixtures, imports, and `page.goto("/")` flow.
  `toBeAttached()` is the right presence check. Low risk.
- **Judge-only grading depends on the produced PHP, not a render (intentional).** The nav-menu and
  sidebar scenarios cannot be front-end-asserted (need theme templates calling `wp_nav_menu()` /
  `dynamic_sidebar()`), so they are judge-only by design — mirrors existing judge-only Plugins
  scenarios (cron-event, admin-menu-page, i18n-textdomain). Not a defect.
- **Theme-artifact-bound sub-areas recorded as deferred (per spec).** theme.json, block templates,
  template parts, template hierarchy, classic template files, custom-header/background, `style.css` are
  not implemented. Only `theme-json-custom-color-palette` gets a `# Deferred:` comment (it already has a
  stub); the others have no catalog entry (Req 13 / AC 19/20). The theme-scaffold harness change that
  would unblock them is surfaced as a future out-of-scope recommendation (see the topic above), not
  implemented.
- **Catalog edits confined to the Themes section (correctness, must-hold).** Only Themes records + the
  one header line may change; the iAPI `_candidates.yaml` and all non-Themes records in
  `_wp-dev-candidates.yaml` must be byte-untouched (Req 15 / AC 15). Phase 4/5 must diff-check.
