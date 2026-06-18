# Spec Research

## Rough Idea

Extend the `wordpress-development` eval suite's coverage to the **Themes** area with simple, documentation-driven scenarios (~1 per major uncovered sub-area), building on the reference taxonomy and the `eval/scenarios/_wp-dev-candidates.yaml` candidate catalog established in review-1 (promoting the Themes records, not rebuilding the taxonomy). New scenarios use the adopted `themes-*` pseudo-folder naming.

Key constraints:
- Build on prior artifacts; promote this area's catalog stubs to full records; do not rebuild the taxonomy.
- Scenarios stay simple (one concept, one small feature) following existing conventions.
- The skill (`skills/wordpress-development/`) is not modified.
- Apply `themes-*` pseudo-folder naming (dir == scenario.yaml name == catalog record name; flat).
- Static/structural verification only; existing scenarios and non-Themes catalog records untouched.

Key open question: The scaffold builds a **plugin**, not a theme. The design must assess, per Themes sub-area, which are plugin-expressible and e2e-feasible vs. theme-artifact-bound (needs a theme the harness can't scaffold). Theme-artifact-bound sub-areas are deferred with recorded reasons.

Likely e2e-feasible from a plugin:
- Enqueueing a stylesheet/script (assert `<link>`/`<script>` for the registered handle appears in page HTML)
- Registering a block pattern
- Adding a theme support (where it produces a front-end-visible effect)

Likely theme-artifact-bound (defer):
- theme.json settings/styles
- Block templates / template parts
- Template hierarchy

## Q&A

### Q1: What Themes sub-areas currently exist as catalog stubs in `_wp-dev-candidates.yaml`?

**A:** Two stubs exist (lines 156–174), both lighter stubs with name/description/difficulty/concepts/source/source_files only — no prompt, no acceptance, no TODO/Deferred comments:

1. `theme-json-custom-color-palette` — "Define a custom color palette for a block theme via theme.json." Concepts: [theme.json, color, palette, block themes]. Sub-area: theme.json global settings/styles (Block Themes). **Theme-artifact-bound** (needs a theme.json file in an actual theme).

2. `classic-theme-enqueue-scripts` — "Enqueue a front-end stylesheet and script from a classic theme using wp_enqueue_scripts." Concepts: [wp_enqueue_scripts, wp_enqueue_style, wp_enqueue_script]. Sub-area: including-assets (Core Concepts). **Plugin-expressible** (wp_enqueue_scripts is a hook, works from a plugin, front-end visible).

**Reasoning:** Researcher read the catalog directly; no other Themes records present; no deferred/TODO markers on either stub.

**Sources:** `eval/scenarios/_wp-dev-candidates.yaml` lines 156–174

### Q2: What does the full Themes taxonomy look like from review-1 — what are all the major Themes sub-areas listed?

**A:** The review-1 design-doc lists 6 Themes top chapters: Getting Started, Core Concepts, Block Themes, Classic Themes, Advanced Topics, Releasing. Core Concepts subpages include: theme-structure, main-stylesheet, custom-functionality, templates, including-assets, global-settings-and-styles. Many more sub-areas than the 2 stubs — only including-assets and theme.json were stubbed; the rest are gaps.

**Reasoning:** Researcher loaded the review-1 taxonomy/design-doc directly.

**Sources:** review-1 design-doc / taxonomy; `eval/scenarios/_wp-dev-candidates.yaml`

### Q3: For each of the three plugin-expressible sub-areas named in the intent (enqueueing assets, registering a block pattern, adding a theme support), confirm: (a) is there a developer.wordpress.org Themes handbook page grounding it, (b) what is the clean front-end assertion (what appears in page HTML that the e2e spec can check), and (c) does the harness have any existing precedent or helper for that assertion pattern?

**A:** Of the three, only ONE (enqueueing assets) is cleanly e2e-feasible. Detail:

**(1) Enqueueing assets — E2E-FEASIBLE, strongest pick.**
- Page: https://developer.wordpress.org/themes/core-concepts/including-assets/ (and classic-themes/). Hook `wp_enqueue_scripts`; functions `wp_enqueue_style()` / `wp_enqueue_script()`. [VERIFIED via WebFetch]
- Front-end HTML: `wp_enqueue_style('my-handle', $src)` emits in `<head>`: `<link rel="stylesheet" id="my-handle-css" href="...">` (id = `{handle}-css`). Script emits `<script src="..." id="{handle}-js"></script>`. [VERIFIED via WP core WP_Styles/WP_Scripts naming + corroborating sources]
- E2e assertion: `page.goto("/")`; assert `page.locator('link#my-handle-css')` exists / check href. Deterministic, no seeding. `wp_enqueue_scripts` is the front-end enqueue hook and runs identically from a plugin (global action, not theme-bound). Handle must be PINNED in the prompt.
- Precedent: no existing spec asserts a `<link>`/`<script>` tag, but `filter-body-class` uses the identical mechanism (`page.goto("/")` + locator). New assertion shape, low risk.

**(2) Registering a block pattern — NOT front-end-feasible (revises intent assumption).**
- `register_block_pattern` is grounded in the Block Editor handbook, not the Themes handbook (Themes handbook covers patterns only via the `/patterns` theme folder = theme-artifact-bound).
- A registered pattern produces ZERO front-end HTML by itself [VERIFIED via WebFetch]. It only appears in the editor inserter; it must be manually inserted into content to render. Asserting "pattern in inserter" is an admin/editor DOM test, heavier than the clean anon front-end pattern. Already a DEFERRED stub in the Block Editor catalog (`block-editor-block-patterns`, "Deferred: multi-block composition"). VERDICT: not a clean Themes e2e — defer/judge-only.

**(3) Adding a theme support — E2E-feasible only in theory; WEAK in practice.**
- Page: https://developer.wordpress.org/themes/functionality/. Function `add_theme_support()` on `after_setup_theme`.
- Front-end-visible features [VERIFIED via WebFetch]: `title-tag` (emits `<title>`), `automatic-feed-links` (emits `<link rel="alternate" type="application/rss+xml">`) — but BOTH are already enabled by default themes, so a plugin re-adding them is an indistinguishable no-op. Other features (`post-thumbnails`, `custom-logo`, etc.) need theme TEMPLATE code to surface = theme-bound. HONEST CAVEAT: `add_theme_support` is designed to be called by a theme; from a plugin it runs but most assertable features are default-on (effect invisible) or need template support. VERDICT: judge-only-leaning.

**filter-body-class confirmation:** Closest precedent for front-end HTML assertion. Pure-PHP, no-block. `eval/scenarios/filter-body-class/e2e.spec.mjs:21-26`: `page.goto("/")` then `expect(page.locator("body")).toHaveClass(/my-custom-class/)`. `beforeAll` deactivates all + activates `plugin-filter-body-class-${agentId}`; no post seeding. Exactly the template an enqueue scenario follows.

**Reasoning:** Researcher verified each via WebFetch of dev.wordpress.org + WP core source + the existing spec file.

**Sources:** https://developer.wordpress.org/themes/core-concepts/including-assets/ ; https://developer.wordpress.org/themes/functionality/ ; block-patterns block-api ref; `eval/scenarios/filter-body-class/e2e.spec.mjs`; `eval/scenarios/_wp-dev-candidates.yaml`

### Q4: The intent's three plugin-expressible candidates collapsed to one clean e2e (enqueue). Beyond those three, is there any OTHER Themes-handbook sub-area that is plugin-expressible AND produces a clean, distinguishable front-end assertion (not default-on, not template-bound)? Candidates to check: registering nav menu locations (register_nav_menus + wp_nav_menu), the custom-header/custom-background image features, registering sidebars/widget areas, custom-functionality hooks (wp_head/wp_footer output), the main stylesheet. For each, say plugin-expressible? front-end-assertable? distinguishable from default?

**A:** A clean SECOND e2e candidate exists: direct output on the `wp_head`/`wp_footer` action (custom-functionality). Verdict per candidate:

1. **register_nav_menus + wp_nav_menu** — THEME-BOUND. `register_nav_menus()` outputs nothing by itself (registers a menu location in admin); front-end menu HTML needs a theme template calling `wp_nav_menu()`. Defer. [VERIFIED: reference/functions/register_nav_menus/]
2. **register_sidebar / dynamic_sidebar** — THEME-BOUND. Same shape: registering a widget area produces no front-end output without a theme template calling `dynamic_sidebar()`. Defer. [model knowledge, same mechanism]
3. **custom-header / custom-background** — THEME-BOUND + default-masked. Needs theme template support to surface and default themes already configure their own. Defer. [VERIFIED]
4. **custom-functionality: direct output on `wp_head`/`wp_footer`** — **FEASIBLE, the clean #2.** `wp_head()`/`wp_footer()` are called by EVERY standard theme (block + classic). A plugin doing `add_action('wp_head', fn() => echo '<meta name="x" ...>')` appears in front-end `<head>` regardless of active theme. Plugin-expressible (global action), front-end-assertable (`page.goto("/")` + `locator('meta[name="my-pinned-name"]')`), distinguishable (pin a UNIQUE literal no theme emits). Precedent: filter-body-class. Grounds to a DIFFERENT handbook chapter (core-concepts/custom-functionality/) and a DIFFERENT API (`add_action`+`echo` vs `wp_enqueue_*`) than enqueue. [VERIFIED: reference/hooks/wp_head/]
5. **main stylesheet (style.css)** — THEME-BOUND. style.css is the theme identity file; a plugin can't supply the active theme's style.css and WP doesn't auto-enqueue a plugin's. Subsumed by the enqueue scenario. Defer.

**Two genuinely-clean front-end-assertable plugin-expressible Themes mechanisms exist:**
- (A) **Enqueue assets** → `<link id="{handle}-css">` / `<script id="{handle}-js">` (handbook: core-concepts/including-assets/)
- (B) **wp_head/wp_footer action output** → pinned `<meta>`/comment in head/footer (handbook: core-concepts/custom-functionality/)

Both via `page.goto("/")` + locator, theme-independent, distinguishable. They are somewhat similar (both "hook a front-end action") but ground to different handbook chapters and exercise different APIs — a defensible 2-scenario batch. For maximum differentiation: (A) enqueue a stylesheet (assert `<link id={handle}-css>`), (B) custom-functionality marker (assert `<meta>`).

**Bottom line:** the batch is NOT forced to 1. It is a credible **2 clean e2e** + N judge-only/deferred stubs — matching the intent's "smaller batch acceptable" fallback.

**Reasoning:** Researcher checked each mechanism against dev.wordpress.org reference + the theme-independence of `wp_head`/`wp_footer`.

**Sources:** https://developer.wordpress.org/reference/functions/register_nav_menus/ ; https://developer.wordpress.org/reference/hooks/wp_head/ ; https://developer.wordpress.org/themes/core-concepts/custom-functionality/ ; https://developer.wordpress.org/themes/core-concepts/including-assets/

### Q5: Are there defensible JUDGE-ONLY Themes scenarios (correct-registration on a hook, no front-end render needed — the cron-event/admin-menu/i18n pattern from Plugins) that are distinct sub-areas from the two e2e picks?

**A:** Yes — two clean judge-only candidates, both register-on-a-hook with no front-end render by nature:

- **register_nav_menus** (nav menu location) — JUDGE-ONLY VIABLE. Grounds to the Themes handbook nav-menus chapter. Acceptance: registers a menu location on `after_setup_theme`, translatable label, pinned location slug. No e2e (front-end render needs a theme template). Clean, simple, one-concept; DISTINCT sub-area from enqueue/custom-functionality.
- **register_sidebar** (widget area) — JUDGE-ONLY VIABLE, same shape. Acceptance: `register_sidebar` on `widgets_init` with pinned id/name (and before/after markup). Distinct concept.
- **add_theme_support(...) generic** — judge-only viable but thin/overlapping; weaker pick.

**Full menu of defensible Themes scenarios:**
- e2e: (1) enqueue assets, (2) wp_head/footer custom-functionality marker
- judge-only: (3) register_nav_menus, (4) register_sidebar (register-on-hook, distinct sub-areas, no e2e by nature — the cron-event/admin-menu pattern from Plugins)
- defer/stub: theme.json-as-file, block templates, template parts, template hierarchy, custom-header/bg, style.css, block patterns (theme-artifact-bound or default-masked; record with reasons + harness-limitation note)

Honest answer to "is the batch forced to 1?": NO. 2 clean e2e + 2 clean judge-only is defensible, rest deferred. This mirrors the Plugins-area mix of e2e + judge-only scenarios.

**Reasoning:** Researcher applied the "registration-only, judge-graded" pattern already used by Plugins scenarios (cron-event, admin-menu-page, i18n-textdomain) to the Themes registration sub-areas.

**Sources:** Themes handbook nav-menus + sidebars/widgets chapters; existing Plugins judge-only scenarios (`cron-event`, `admin-menu-page`, `i18n-textdomain`)

### Q6: No-duplication check. (a) Does the wp_head/wp_footer custom-functionality marker scenario duplicate the sub-area of `filter-body-class` (Plugins area — "hook a front-end action to modify the page")? (b) Does the enqueue scenario duplicate any existing asset-loading or Plugins/v1/Block-Editor sub-area? (c) Do register_nav_menus/register_sidebar duplicate existing register-* scenarios? Judge at the sub-area level, since the intent forbids duplication with covered areas.

**A:** Blunt dedup verdict, judged at sub-area level against the real 30 existing scenarios:

**(a) wp_head/wp_footer MARKER vs filter-body-class — DUPLICATIVE RISK; drop/demote.** `filter-body-class` is a `body_class` FILTER ("receives the `$classes` array, appends, and RETURNS it — does not echo"). The marker is an ACTION hook that ECHOes new markup. At the FINE sub-area level they're distinct (action+echo vs filter+return). BUT at the COARSE "register a callback on a front-end hook to change the page" level they rhyme hard, and a reviewer could call it thin/duplicative of the Hooks concept already in v1. RECOMMENDATION: DROP it (weakest pick); do not lean on it as a flagship.

**(b) ENQUEUE assets — GENUINELY NON-DUPLICATIVE. Clean.** Grepped all 30 scenarios: ZERO use `wp_enqueue_*`/`enqueue`/`<link>`/`<script>` assertions. "enqueue" appears ONLY in the catalog stub. No existing scenario loads a stylesheet/script. Sub-area = Themes Core Concepts: including-assets — uncovered everywhere (the iAPI suite loads `view.js` via `block.json` build, a different scaffold mechanism, not `wp_enqueue_*`). VERDICT: ship it — strongest, cleanest, non-dup Themes e2e. [VERIFIED via grep]

**(c) register_nav_menus / register_sidebar vs existing register-* scenarios — NON-DUPLICATIVE at sub-area level.** Existing register-* scenarios use DISTINCT functions/sub-areas: `cpt-register`→`register_post_type` (Plugins: CPTs), `taxonomy-register`→`register_taxonomy` (Plugins: Taxonomies), `settings-register`→`register_setting` (Plugins: Settings), `admin-menu-page`→`add_menu_page` (Plugins: Admin Menus), `cron-event`→`wp_schedule_event` (Plugins: Cron). `register_nav_menus`→Themes "Navigation Menus" chapter, hook `after_setup_theme` — distinct function + chapter + concept (menu LOCATIONS). `register_sidebar`→Themes "Widgets/Sidebars" chapter, hook `widgets_init` — distinct function + chapter. The review-1 dedup test is sub-area-level (distinct handbook chapter + distinct registration function = non-dup; that's how `taxonomy-register` was cleared vs `cpt-register`). By that same test, both PASS. Shape-similarity ("register-a-thing-on-a-hook") was never the bar. [VERIFIED via reference docs]

**NET — which of the 4 are genuinely non-duplicative Themes sub-areas:**
1. ENQUEUE assets — NON-DUP, clean e2e. KEEP (flagship).
2. wp_head/wp_footer marker — borderline/thin vs v1 Hooks (body_class). DROP/demote (weakest).
3. register_nav_menus — NON-DUP, judge-only. KEEP.
4. register_sidebar — NON-DUP, judge-only. KEEP.

**Revised honest batch: 1 clean e2e (enqueue) + 2 clean judge-only (nav-menus, sidebars)** — all 3 distinct Themes sub-areas, none duplicating iAPI/v1/Plugins/Block Editor/REST. No clean theme-independent, non-dup, front-end-visible SECOND e2e exists beyond enqueue. This is the defensible, fully-non-dup core; the intent explicitly allows a smaller batch + deferred stubs.

**Reasoning:** Researcher grepped all 30 scenarios for enqueue/asset markers, read `filter-body-class/scenario.yaml` to compare mechanisms, and applied the review-1 sub-area-level dedup test (distinct chapter + distinct function).

**Sources:** `grep -rni enqueue eval/scenarios/*` (only the catalog); `eval/scenarios/filter-body-class/scenario.yaml`; review-1 design-doc dedup rule; reference/functions/register_nav_menus/ + register_sidebar/

### Q7: Naming + catalog reconciliation. The enqueue stub is named `classic-theme-enqueue-scripts` (no `themes-*` prefix); the intent mandates `themes-*` naming for new scenarios. (a) For the promoted enqueue scenario, is the right move to give it a `themes-*` name (e.g. `themes-enqueue-assets`) and replace the old stub record, or to keep the legacy stub name? (b) The two judge-only scenarios (nav-menus, sidebars) have NO existing stub — does the intent's "no NEW catalog stub for an uncovered sub-area that has none" rule (from review-3) apply, or do implemented scenarios always get full records regardless? (c) Does `theme-json-custom-color-palette` (deferred, theme-artifact-bound) get a `# Deferred:` comment even though it currently has no `# TODO`?

**A:** Traced the review-3 spec + the actual catalog diff (commit `0b40d8e`):

**(a) Rename the stub record to `themes-*` (e.g. `themes-enqueue-assets`).** Review-3's promoted stub `rest-api-custom-field-on-post` ALREADY carried the `rest-api-` prefix, so it never faced this conflict — it was promoted in place with its name untouched (review-3 spec Req 11, AC 11; diff shows the `name:` line unchanged). That gives NO precedent for renaming on promotion because review-3 never had to. The Themes enqueue stub `classic-theme-enqueue-scripts` does NOT match `themes-*`, so keeping it would violate the intent's mandate ("New scenarios use the adopted `themes-*` pseudo-folder naming"; dir == name == catalog name all `themes-*`). Renaming the catalog RECORD is NOT a scenario rename — no shipped scenario directory exists for it yet (it's only a stub), so it breaks no "existing scenarios not renamed" rule (that rule protects shipped scenario dirs). RECOMMENDATION: rename to `themes-enqueue-assets` (final concept name is a design/plan decision). [VERIFIED via review-3 spec wording + diff]

**(b) Every implemented scenario ALWAYS gets a full catalog record, prior stub or not. CONFIRMED.** Review-3 implemented three: one (`rest-api-custom-field-on-post`) had a prior stub → promoted in place; two (`rest-api-route-validation`, `rest-api-permission-check`) had NO prior stub → added as brand-new full records under a `# Implemented REST API scenarios — full records` sub-header (review-3 spec Req 13; diff 0b40d8e). For the two judge-only Themes scenarios (nav-menus, sidebars) with no existing stub: add brand-new full records (prompt + acceptance) under a `# Implemented Themes scenarios — full records` sub-header. Judge-only means no e2e spec, but still FULL records — exactly as `cron-event`/`i18n-textdomain`/`admin-menu-page` got in review-1. [VERIFIED]

**(c) ADD a `# Deferred: <reason>` comment to `theme-json-custom-color-palette`.** Review-3's precedent was REPLACE: `rest-api-authentication-nonce` had `# TODO: prompt + acceptance` which was replaced by `# Deferred: <reason>` (review-3 spec Req 13; diff). The Themes theme.json stub currently has NO comment at all (bare lighter stub, catalog lines 158-165), so the analogous move is to ADD a `# Deferred: <reason>` (nothing to replace). This mirrors the SPIRIT of review-3 (every deferred-but-relevant stub carries an explicit defer reason). CAVEAT: there is no exact precedent for "stub with no comment" — ADD-a-Deferred-comment is the consistent extension, not a verbatim precedent. [Reasoning grounded in review-3 spec + diff; flagged as an extension]

**NET catalog mechanics:**
- enqueue stub → RENAME record to a `themes-*` name (e.g. `themes-enqueue-assets`), promote to full record.
- nav-menus + sidebars → ADD brand-new full records (judge-only, full prompt+acceptance) under `# Implemented Themes scenarios — full records`.
- theme-json-custom-color-palette → ADD a `# Deferred: <reason>` comment (theme-artifact-bound).
- header line → add Themes to "Full prompt + acceptance are included for the implemented Plugins, Block Editor, [REST API] scenarios..." (review-3 did the analogous header fix).
- Only Themes records change; iAPI `_candidates.yaml` + non-Themes records untouched.

**Reasoning:** Researcher traced review-3 spec.md (Req 11, 13, 15; AC 11) and the actual promotion diff `git show 0b40d8e`.

**Sources:** review-3 spec.md (Req 11/13/15, AC 11); `git show 0b40d8e -- eval/scenarios/_wp-dev-candidates.yaml`; `eval/scenarios/_wp-dev-candidates.yaml` lines 158-174

## Research

### Full Themes feasibility map (per sub-area)

Researcher's verified feasibility assessment across all major Themes sub-areas:

**PLUGIN-EXPRESSIBLE + clean front-end e2e (the pick):**
- **Enqueue assets** — `wp_enqueue_scripts` hook (global, fires from a plugin) + `wp_enqueue_style`/`wp_enqueue_script`. Emits `<link rel="stylesheet" id="{handle}-css">` / `<script id="{handle}-js">` in front-end HTML. Assert via `page.goto("/")` + `locator('link#{handle}-css')`. Theme-agnostic, deterministic, no seeding. STRONG. [VERIFIED]

**PLUGIN-EXPRESSIBLE but WEAK e2e (judge-lean / careful):**
- **Theme support** — `add_theme_support()` on `after_setup_theme`. Front-end-visible features (`title-tag`, `automatic-feed-links`) are ALREADY enabled by the default block theme → a plugin re-adding them is an indistinguishable no-op. Non-default features need theme template code to surface (theme-bound). WEAK. [VERIFIED]
- **theme.json color palette** — the theme.json FILE must live in the active theme root (plugin can't ship one), BUT the data is injectable via the server-side filter `wp_theme_json_data_theme` (WP 6.1+). A palette emits CSS custom props `--wp--preset--color--{slug}` in `<style id="global-styles-inline-css">`. E2e assertion would be on inline CSS text (brittle) and DEPENDS on the active theme being a block theme that emits global styles. PARTIAL/RISKY. [palette→CSS-vars VERIFIED; preset class names from model knowledge, not re-verified]

**THEME-ARTIFACT-BOUND (defer with recorded reason; surface harness-limitation note):**
- **theme.json as a FILE** — WP only loads theme.json from the active theme root; the scaffold can't ship a theme. [VERIFIED]
- **Block templates / template parts** — primary home is the theme's `/templates` + `/parts` HTML files; `index.html` presence is how WP detects a block theme. Plugins CAN register templates dynamically (a valid template source), but it's an advanced, multi-concept API far from "one small feature," and asserting front-end needs the template to win the hierarchy for a route. Defer. [VERIFIED]
- **Template hierarchy** — pure theme-file-resolution concept (404.html, archive.html, etc.); no meaningful plugin surface for a simple scenario. Defer. [VERIFIED]
- **Classic template files** — `functions.php`'s hooks (`wp_enqueue_scripts`, `after_setup_theme`) fire from a plugin (that's why enqueue works), but template-tag/template-file slices (`get_header`, the loop, `index.php`) are theme-bound. Defer those slices. [VERIFIED]

**NOT FRONT-END-VISIBLE (defer/judge-only):**
- **Block pattern** — `register_block_pattern` produces zero front-end HTML; pattern only appears in the editor inserter and must be manually inserted to render. Already a deferred Block Editor stub. Not a clean Themes e2e. [VERIFIED]

### wp-env default-theme caveat (load-bearing)

`verify-e2e.ts` writes `.wp-env.json` with NO `themes` key and NO core pin → wp-env uses its bundled WP core default, which activates the latest bundled Twenty Twenty-* block theme (emits inline global styles). [INFERRED from wp-env defaults + WP installer behavior; NOT verified by booting — `@wordpress/env` not installed in this worktree; this review is static-only.] Implications:
- **Enqueue e2e:** theme-agnostic — works regardless of active theme. SAFE.
- **theme.json-palette e2e:** depends on a block theme being active (true for default) — a hidden dependency.
- **theme-support title-tag/feed-links e2e:** default block theme already enables these → plugin re-adding = indistinguishable. WEAK.

## Consolidated Requirements

### A. Themes scenario selection and scope

1. **One area only: Themes.** Every newly implemented scenario belongs to the Themes area (the Theme Handbook). No newly implemented scenario targets any other top-level area, and the existing Interactivity API, v1, Plugins, Block Editor, and REST API scenarios are not re-scoped or renamed.

2. **Harness-feasibility drives selection: plugin-expressible and front-end-feasible.** Because the scaffold builds a plugin (`plugin-<scenario>-<agentId>`), not a theme, only Themes sub-areas that are plugin-expressible (achievable via global hooks from a plugin, no theme artifact required) are candidates. Among those, a sub-area gets an e2e scenario only when it produces a clean, theme-independent, front-end-visible assertion; a plugin-expressible sub-area that lacks a clean front-end assertion gets a judge-only scenario; theme-artifact-bound sub-areas are deferred (see Requirement 8).

3. **Adopted batch: three scenarios — one e2e + two judge-only.** The implemented batch is (i) **enqueueing a front-end stylesheet and script** (Core Concepts → including-assets), shipped with an `e2e.spec.mjs`; (ii) **registering a navigation-menu location** (`register_nav_menus`), judge-only; (iii) **registering a sidebar / widget area** (`register_sidebar`), judge-only. This is a smaller batch than some prior reviews, which the intent explicitly permits because much of Themes is theme-artifact-bound. No clean, theme-independent, non-duplicative second e2e Themes sub-area exists beyond enqueue, so the batch is deliberately one e2e plus two judge-only.

4. **Each scenario is one concept, one small feature, one plugin edit.** Each implemented scenario is a single one-concept / one-small-feature task realizable as a single edit to the scaffolded plugin's `index.php` (a registration on a global hook: `wp_enqueue_scripts`, `after_setup_theme`, or `widgets_init`), with a handful of acceptance points. No theme artifact (theme.json, block templates/parts, template files, style.css), no second block type, no JS toolchain, and no multi-feature / multi-step task.

5. **No duplication with already-covered sub-areas, judged at the sub-area level.** No newly implemented scenario duplicates a sub-area already covered by the Interactivity API suite, the v1 four, the Plugins scenarios, the Block Editor scenarios, or the REST API scenarios — judged at the sub-area level (distinct handbook chapter + distinct registration function). In particular: the enqueue scenario is distinct from the iAPI suite's block `view.js` loading (which is a `block.json` build mechanism, not `wp_enqueue_*`); and the nav-menu-location and sidebar scenarios are distinct from the existing `register_*` scenarios (`cpt-register`, `taxonomy-register`, `settings-register`, `admin-menu-page`, `cron-event`) because each targets a different Themes handbook chapter and a different registration function. A `wp_head`/`wp_footer` direct-output "marker" scenario is intentionally NOT adopted because at the coarse "register a callback on a front-end hook to change the page" level it rhymes with the v1 `body_class` Hooks concept (`filter-body-class`).

### B. Per-scenario shape and verification

6. **The enqueue scenario ships an `e2e.spec.mjs` following the established lifecycle and asserts on front-end HTML.** Its directory includes an `e2e.spec.mjs` that imports from `@wordpress/e2e-test-utils-playwright` and `deactivateAllPlugins` from `../../utils/wp-cli.mjs`, activates `plugin-<name>-${agentId}` in `beforeAll` via `requestUtils.activatePlugin`, deactivates all plugins in before/after teardown, and asserts inline (no new helper added to `eval/utils/`). The observable behavior it verifies: navigate to the front-end home page (`page.goto("/")`) and assert that the enqueued stylesheet's `<link>` (id `{handle}-css`) and the enqueued script's `<script>` (id `{handle}-js`) are present in the page HTML for the pinned, plugin-defined handle(s). No post seeding is required; the assertion is theme-independent.

7. **The two judge-only scenarios ship no `e2e.spec.mjs`.** Each judge-only scenario (`register_nav_menus`, `register_sidebar`) is a `scenario.yaml`-only directory whose `acceptance` points are graded by the judge against the produced PHP code — mirroring the existing judge-only Plugins scenarios (`cron-event`, `admin-menu-page`, `i18n-textdomain`). They register on a global hook (`after_setup_theme` for nav-menu locations, `widgets_init` for sidebars) and need no front-end render.

8. **Every literal the enqueue e2e asserts is pinned in that scenario's `prompt`.** Each asset handle (and any other field name, path, slug, or value) that the `e2e.spec.mjs` asserts is stated in that scenario's `prompt`, so prompt and assertion stay in lockstep.

9. **Schema-conformant, tool-agnostic, doc-grounded scenarios.** Each implemented scenario is a directory that is a flat immediate child of `eval/scenarios/`, containing a `scenario.yaml` with exactly `name` (lowercase-kebab matching `/^[a-z0-9-]+$/`, equal to the directory name), `description`, `skills: [wordpress-development]`, `prompt`, `acceptance` (scenario-unique check statements), and `rubrics` (present as an array). The `prompt` reads as a user-voice, outcome-phrased request that does NOT name the tool, API, function, framework, or technology to use; the `acceptance` strings are clean human-readable check statements with no embedded source URLs; and no catalog-only fields (`difficulty`, `concepts`, `source`, `source_files`) appear in any `scenario.yaml`.

10. **Default zero shared rubrics.** Each new scenario declares `rubrics: []`. No new shared rubric under `eval/rubrics/` is added unless a genuinely cross-cutting check is shared across multiple of this batch's scenarios; if one is added, it is simple and general and is not duplicated in any scenario's `acceptance`. The `rubrics:` key is always present, even when empty.

### C. Naming

11. **`themes-*` pseudo-folder naming, applied uniformly to the new scenarios.** Each implemented scenario uses the adopted `themes-*` prefix, with the directory name == the `scenario.yaml` `name` == the catalog record `name`, all identical, each a flat immediate child of `eval/scenarios/` matching `/^[a-z0-9-]+$/`. The enqueue scenario does NOT keep the legacy stub name `classic-theme-enqueue-scripts`; its catalog record is renamed to a `themes-*` name (e.g. `themes-enqueue-assets`) so all three identities carry the prefix. Renaming the stub RECORD is not a scenario rename (no shipped scenario directory exists for it yet). The two judge-only scenarios use `themes-*` names that name their concept (nav-menu location, sidebar/widget area). Existing scenarios are NOT renamed. (Exact final `themes-*` names are a design/plan/code decision.)

### D. Catalog update

12. **Full catalog record per implemented scenario (1:1 identity, verbatim prompt+acceptance).** For each implemented scenario — including the two judge-only ones — `_wp-dev-candidates.yaml` contains a full record under the Themes area whose `name` equals the scenario's directory name and its `scenario.yaml` `name`, carrying the same `prompt` and `acceptance` text as the shipped `scenario.yaml` verbatim (same text, order, quoting), plus `description`, `difficulty`, `concepts`, `source`, and `source_files` citing the developer.wordpress.org page(s) that ground its acceptance points. Provenance (source URLs) lives only in the catalog record, never in the `scenario.yaml`.

13. **Stubs reconciled; no stale or mismatched records.** The `classic-theme-enqueue-scripts` stub is promoted to a full record renamed to the enqueue scenario's `themes-*` name. The two judge-only scenarios get brand-new full records added under the Themes area (under an `# Implemented Themes scenarios — full records` sub-header, mirroring the Block Editor / REST API pattern). The `theme-json-custom-color-palette` stub stays a lighter stub and gets a `# Deferred: <reason>` comment ADDED (it currently has no comment), recording that theme.json is a theme-root artifact the plugin scaffold cannot ship (reachable only via the `wp_theme_json_data_theme` filter, with a block-theme-dependent inline-CSS assertion) — theme-artifact-bound, not feasible without a theme-scaffold harness change. After the update, every implemented Themes sub-area is represented by exactly one full record under its final scenario name, with no orphaned stub duplicating an implemented sub-area and no name mismatch between any record and its scenario directory.

14. **Stale header line kept accurate.** The catalog's header comment listing which areas have full prompt+acceptance ("Full prompt + acceptance are included for the implemented Plugins, Block Editor, and REST API scenarios…") is updated to also list Themes (e.g. "Plugins, Block Editor, REST API, and Themes scenarios…"). This is the only header change.

15. **iAPI catalog and non-Themes records untouched.** The Interactivity-API catalog `eval/scenarios/_candidates.yaml` is not modified. Within `_wp-dev-candidates.yaml`, only Themes records (and the Themes stubs) are added, promoted, renamed, or annotated; no other area's records are rebuilt, re-derived, moved, or renamed.

### E. Done-criteria and non-disruption

16. **Well-formed and runnable, not required to pass.** Each implemented scenario is statically/structurally verified to be discoverable by Skillsmith (passes its scenario-shape check); and for the enqueue scenario, its `e2e.spec.mjs` parses and resolves its imports under test-runner collection — such that running Skillsmith on the scenario directory would execute to a graded result without harness or configuration errors. A failing grade against the current skill is acceptable and does not violate this bar. No agent runs the full `scenarios × testing-agents` matrix, boots `wp-env` for a real pass, or generates the plugin code.

17. **Skill untouched.** No file under `skills/wordpress-development/` is modified by this review.

18. **Existing suite intact; flat discovery preserved.** The existing Interactivity API suite, the v1, Plugins, Block Editor, and REST API scenarios, and the existing `_candidates.yaml` are not moved, renamed, reorganized, or broken; Skillsmith's flat discovery under `eval/scenarios/` continues to enumerate them; and the new scenario directories are flat immediate children of `eval/scenarios/`.

### F. Out of scope (recorded exclusions)

19. **Theme-artifact-bound sub-areas are deferred, not implemented** — theme.json (settings/styles as a file), block templates, template parts, the template hierarchy, classic theme template files (`index.php`/`get_header`/the loop), custom-header/custom-background, and `style.css` — because the scaffold cannot ship a theme. Of these, only the pre-existing `theme-json-custom-color-palette` stub is annotated with a `# Deferred:` reason (it has a catalog stub today); the others, having no stub, get no new catalog entry — their exclusion is recorded only in the spec. A **theme-scaffold harness change** that would unblock these is surfaced as a **future out-of-scope recommendation**, not implemented here.

20. **Block-pattern registration is not implemented** (`register_block_pattern` produces no front-end HTML; it is editor-inserter-only and already a deferred Block Editor stub). **Adding a theme support** (`add_theme_support`) is not implemented as a Themes scenario (front-end-visible features are default-on in the default block theme → indistinguishable, or need template support → theme-bound). A **`wp_head`/`wp_footer` direct-output marker** is not implemented (borderline-duplicative of the v1 `body_class` Hooks concept).

21. **Other top-level areas, rebuilding the taxonomy/catalog, re-litigating the folders question, modifying the skill, renaming existing scenarios, adding shared rubrics by default, requiring scenarios to pass, running the full matrix, booting `wp-env` for a live pass, and generating plugin code** are all out of scope (consistent with prior reviews).
