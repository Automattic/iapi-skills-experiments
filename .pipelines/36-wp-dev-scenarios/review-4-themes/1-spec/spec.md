# Spec: Themes scenarios

## Overview

The `wordpress-development` skill is evaluated by a Skillsmith-based suite under `eval/`. Prior reviews established a broad area → sub-area taxonomy of developer.wordpress.org, a committed candidate catalog (`eval/scenarios/_wp-dev-candidates.yaml`), and implemented scenarios for the Interactivity API, a v1 set (Hooks/Filters, Shortcodes, Custom Post Types, custom REST endpoints), the Plugins area, the Block Editor area, and the REST API area. The **Themes** area (the Theme Handbook) is still uncovered: the catalog carries only two Themes stubs (`theme-json-custom-color-palette` and `classic-theme-enqueue-scripts`), and no Themes scenario is implemented.

This review extends coverage to the **Themes** area with a small batch of simple, documentation-grounded scenarios — reusing (not rebuilding) the existing taxonomy and catalog. The defining constraint for Themes is **harness feasibility**: the Skillsmith scaffold builds a *plugin* (`plugin-<scenario>-<agentId>`), not a theme, so any Themes concept that requires a theme artifact (theme.json file, block templates, template parts, template hierarchy, classic template files, custom-header/background, `style.css`) cannot be scaffolded and is deferred. Only Themes sub-areas that are *plugin-expressible* (reachable via global hooks from a plugin) are candidates. Of those, only one — enqueuing front-end assets — produces a clean, theme-independent, front-end-visible assertion, so the batch is deliberately **one end-to-end scenario plus two judge-only scenarios**: enqueue assets (e2e), register a navigation-menu location (judge-only), and register a sidebar / widget area (judge-only). The intent explicitly permits this smaller batch because much of Themes is theme-artifact-bound.

As in prior reviews, the skill itself is not modified — the scenarios lead and the skill catches up in later work; verification is **static/structural only** (each scenario discoverable by Skillsmith and, where it ships one, its `e2e.spec.mjs` loadable/collectable by the test runner), and scenarios are not required to pass against the current skill. The folders question is already resolved (review-2): the adopted convention is the `themes-*` pseudo-folder naming (area-prefixed flat scenario names), which this review simply applies.

The exact prompt and acceptance wording of each scenario, the final `themes-*` directory names, and the exact catalog-record text are **design/plan/code decisions**. This spec sets the selection criteria, the per-scenario shape, the verification expectations, the catalog-consistency rules, and the "done" bar — not the answers.

For context, each implemented scenario follows the established Skillsmith conventions already used by the existing scenarios:
- A directory `eval/scenarios/<name>/` that is a flat immediate child of `eval/scenarios/`, containing a `scenario.yaml` and (for the e2e scenario) an `e2e.spec.mjs`.
- `scenario.yaml` keys: `name`, `description`, `skills: [wordpress-development]`, `prompt`, `acceptance` (scenario-specific success points), and `rubrics` (a list, `[]` when none).
- Skillsmith discovers only immediate children of `eval/scenarios/` that contain a `scenario.yaml`; nested directories and non-directory / leading-underscore files are skipped. This is why a catalog file (`_wp-dev-candidates.yaml`) sits safely among real scenario directories.
- The scaffolded plugin hosts PHP-only registrations in its `index.php` (here, registrations on global hooks `wp_enqueue_scripts`, `after_setup_theme`, or `widgets_init`) — no block or theme artifact is needed for these scenarios.
- Front-end e2e specs follow the `filter-body-class` precedent: navigate to the home page (`page.goto("/")`) and assert against the resulting page HTML, with no content seeding required.

## Requirements

### A. Themes scenario selection and scope

1. **One area only: Themes.** Every newly implemented scenario belongs to the Themes area (the Theme Handbook). No newly implemented scenario targets any other top-level area, and the existing Interactivity API, v1, Plugins, Block Editor, and REST API scenarios are not re-scoped or renamed.

2. **Harness-feasibility drives selection: plugin-expressible and front-end-feasible.** Because the scaffold builds a plugin (`plugin-<scenario>-<agentId>`), not a theme, only Themes sub-areas that are plugin-expressible (achievable via global hooks from a plugin, no theme artifact required) are candidates. Among those, a sub-area gets an e2e scenario only when it produces a clean, theme-independent, front-end-visible assertion; a plugin-expressible sub-area that lacks a clean front-end assertion gets a judge-only scenario; theme-artifact-bound sub-areas are deferred (see Requirement 19).

3. **Adopted batch: three scenarios — one e2e + two judge-only.** The implemented batch is (i) **enqueuing a front-end stylesheet and script** (Core Concepts → including-assets), shipped with an `e2e.spec.mjs`; (ii) **registering a navigation-menu location**, judge-only; (iii) **registering a sidebar / widget area**, judge-only. This is a smaller batch than some prior reviews, which the intent explicitly permits because much of Themes is theme-artifact-bound. No clean, theme-independent, non-duplicative second e2e Themes sub-area exists beyond enqueue, so the batch is deliberately one e2e plus two judge-only.

4. **Each scenario is one concept, one small feature, one plugin edit.** Each implemented scenario is a single one-concept / one-small-feature task realizable as a single edit to the scaffolded plugin's `index.php` (a registration on a global hook: front-end asset enqueue, theme setup, or widgets init), with a handful of acceptance points. No theme artifact (theme.json, block templates/parts, template files, `style.css`), no second block type, no JS toolchain, and no multi-feature / multi-step task.

5. **No duplication with already-covered sub-areas, judged at the sub-area level.** No newly implemented scenario duplicates a sub-area already covered by the Interactivity API suite, the v1 four, the Plugins scenarios, the Block Editor scenarios, or the REST API scenarios — judged at the sub-area level (distinct handbook chapter + distinct registration function). In particular: the enqueue scenario is distinct from the iAPI suite's block `view.js` loading (which is a `block.json` build mechanism, not a front-end asset-enqueue hook); and the nav-menu-location and sidebar scenarios are distinct from the existing `register_*` scenarios (`cpt-register`, `taxonomy-register`, `settings-register`, `admin-menu-page`, `cron-event`) because each targets a different Themes handbook chapter and a different registration function. A `wp_head`/`wp_footer` direct-output "marker" scenario is intentionally NOT adopted because at the coarse "register a callback on a front-end hook to change the page" level it rhymes with the v1 `body_class` Hooks concept (`filter-body-class`).

### B. Per-scenario shape and verification

6. **The enqueue scenario ships an `e2e.spec.mjs` following the established lifecycle and asserts on front-end HTML.** Its directory includes an `e2e.spec.mjs` that imports from `@wordpress/e2e-test-utils-playwright` and `deactivateAllPlugins` from `../../utils/wp-cli.mjs`, activates `plugin-<name>-${agentId}` in `beforeAll` via `requestUtils.activatePlugin`, deactivates all plugins in before/after teardown, and asserts inline (no new helper added to `eval/utils/`). The observable behavior it verifies: navigate to the front-end home page (`page.goto("/")`) and assert that the enqueued stylesheet and the enqueued script for the pinned, plugin-defined handle(s) are present in the page HTML (the stylesheet as the `<link>` element WordPress emits with id `{handle}-css`, the script as the `<script>` element WordPress emits with id `{handle}-js`). No content seeding is required; the assertion is theme-independent (it does not depend on which theme wp-env activates).

7. **The two judge-only scenarios ship no `e2e.spec.mjs`.** Each judge-only scenario (nav-menu location, sidebar / widget area) is a `scenario.yaml`-only directory whose `acceptance` points are graded by the judge against the produced PHP code — mirroring the existing judge-only Plugins scenarios (`cron-event`, `admin-menu-page`, `i18n-textdomain`). Each registers on a global hook (theme setup for the nav-menu location, widgets init for the sidebar) and needs no front-end render to be graded.

8. **Every literal the enqueue e2e asserts is pinned in that scenario's `prompt`.** Each asset handle (and any other field name, path, slug, or value) that the `e2e.spec.mjs` asserts is stated in that scenario's `prompt`, so prompt and assertion stay in lockstep.

9. **Schema-conformant, tool-agnostic, doc-grounded scenarios.** Each implemented scenario is a directory that is a flat immediate child of `eval/scenarios/`, containing a `scenario.yaml` with exactly `name` (lowercase-kebab matching `/^[a-z0-9-]+$/`, equal to the directory name), `description`, `skills: [wordpress-development]`, `prompt`, `acceptance` (scenario-unique check statements), and `rubrics` (present as an array). The `prompt` reads as a user-voice, outcome-phrased request that does NOT name the tool, API, function, framework, or technology to use; the `acceptance` strings are clean human-readable check statements with no embedded source URLs; and no catalog-only fields (`difficulty`, `concepts`, `source`, `source_files`) appear in any `scenario.yaml`.

10. **Default zero shared rubrics.** Each new scenario declares `rubrics: []`. No new shared rubric under `eval/rubrics/` is added unless a genuinely cross-cutting check is shared across multiple of this batch's scenarios; if one is added, it is simple and general and is not duplicated in any scenario's `acceptance`. The `rubrics:` key is always present, even when empty.

### C. Naming

11. **`themes-*` pseudo-folder naming, applied uniformly to the new scenarios.** Each implemented scenario uses the adopted `themes-*` prefix, with the directory name == the `scenario.yaml` `name` == the catalog record `name`, all identical, each a flat immediate child of `eval/scenarios/` matching `/^[a-z0-9-]+$/`. The enqueue scenario does NOT keep the legacy stub name `classic-theme-enqueue-scripts`; its catalog record is renamed to a `themes-*` name so all three identities carry the prefix. Renaming the stub RECORD is not a scenario rename (no shipped scenario directory exists for it yet). The two judge-only scenarios use `themes-*` names that name their concept (nav-menu location, sidebar / widget area). Existing scenarios are NOT renamed. (Exact final `themes-*` names are a design/plan/code decision.)

### D. Catalog update

12. **Full catalog record per implemented scenario (1:1 identity, verbatim prompt+acceptance).** For each implemented scenario — including the two judge-only ones — `_wp-dev-candidates.yaml` contains a full record under the Themes area whose `name` equals the scenario's directory name and its `scenario.yaml` `name`, carrying the same `prompt` and `acceptance` text as the shipped `scenario.yaml` verbatim (same text, order, quoting), plus `description`, `difficulty`, `concepts`, `source`, and `source_files` citing the developer.wordpress.org page(s) that ground its acceptance points. Provenance (source URLs) lives only in the catalog record, never in the `scenario.yaml`.

13. **Stubs reconciled; no stale or mismatched records.** The `classic-theme-enqueue-scripts` stub is promoted to a full record renamed to the enqueue scenario's `themes-*` name. The two judge-only scenarios get brand-new full records added under the Themes area, under an `# Implemented Themes scenarios — full records` sub-header (mirroring the Block Editor / REST API pattern). The `theme-json-custom-color-palette` stub stays a lighter stub and gets a `# Deferred: <reason>` comment ADDED (it currently has no comment), recording that theme.json is a theme-root artifact the plugin scaffold cannot ship — theme-artifact-bound, not feasible without a theme-scaffold harness change. No NEW catalog stub is created for any uncovered Themes sub-area that has no stub today; the defer-with-comment rule applies only to the one sub-area (theme.json) that already has a stub. After the update, every implemented Themes sub-area is represented by exactly one full record under its final scenario name, with no orphaned stub duplicating an implemented sub-area and no name mismatch between any record and its scenario directory.

14. **Stale header line kept accurate.** The catalog's header comment listing which areas have full prompt+acceptance ("Full prompt + acceptance are included for the implemented Plugins, Block Editor, and REST API scenarios…") is updated to also list Themes (e.g. "Plugins, Block Editor, REST API, and Themes scenarios…"). This is the only header change.

15. **iAPI catalog and non-Themes records untouched.** The Interactivity-API catalog `eval/scenarios/_candidates.yaml` is not modified. Within `_wp-dev-candidates.yaml`, only Themes records (and the Themes stubs) are added, promoted, renamed, or annotated; no other area's records are rebuilt, re-derived, moved, or renamed.

### E. Done-criteria and non-disruption

16. **Well-formed and runnable, not required to pass.** Each implemented scenario is statically/structurally verified to be discoverable by Skillsmith (passes its scenario-shape check); and for the enqueue scenario, its `e2e.spec.mjs` parses and resolves its imports under test-runner collection — such that running Skillsmith on the scenario directory would execute to a graded result without harness or configuration errors. A failing grade against the current skill is acceptable and does not violate this bar. No agent runs the full `scenarios × testing-agents` matrix, boots `wp-env` for a real pass, or generates the plugin code.

17. **Skill untouched.** No file under `skills/wordpress-development/` is modified by this review.

18. **Existing suite intact; flat discovery preserved.** The existing Interactivity API suite, the v1, Plugins, Block Editor, and REST API scenarios, and the existing `_candidates.yaml` are not moved, renamed, reorganized, or broken; Skillsmith's flat discovery under `eval/scenarios/` continues to enumerate them; and the new scenario directories are flat immediate children of `eval/scenarios/`.

### F. Out of scope (recorded exclusions)

19. **Theme-artifact-bound sub-areas are deferred, not implemented** — theme.json (settings/styles as a file), block templates, template parts, the template hierarchy, classic theme template files (`index.php` / `get_header` / the loop), custom-header/custom-background, and `style.css` — because the scaffold cannot ship a theme. Of these, only the pre-existing `theme-json-custom-color-palette` stub is annotated with a `# Deferred:` reason (it has a catalog stub today); the others, having no stub, get no new catalog entry — their exclusion is recorded only in this spec. A **theme-scaffold harness change** that would unblock these is surfaced as a **future out-of-scope recommendation**, not implemented here.

20. **Block-pattern registration is not implemented** (it produces no front-end HTML by itself; it is editor-inserter-only and already a deferred Block Editor stub). **Adding a theme support** is not implemented as a Themes scenario (front-end-visible features are default-on in the default block theme → indistinguishable, or need template support → theme-bound). A **`wp_head`/`wp_footer` direct-output marker** is not implemented (borderline-duplicative of the v1 `body_class` Hooks concept).

21. **Other top-level areas, rebuilding the taxonomy/catalog, re-litigating the folders question, modifying the skill, renaming existing scenarios, adding shared rubrics by default, requiring scenarios to pass, running the full matrix, booting `wp-env` for a live pass, and generating plugin code** are all out of scope (consistent with prior reviews).

## Out of Scope

1. **Implementing other top-level areas**, or rebuilding / re-deriving the taxonomy or the whole catalog — prior reviews' artifacts are reused, not rebuilt.
2. **Any change to the skill** (`skills/wordpress-development/`).
3. **Re-exploring or re-litigating the folders question** (resolved in review-2; the `themes-*` pseudo-folder naming is simply applied here).
4. **Renaming or reorganizing the existing scenarios**, or any change to the iAPI `_candidates.yaml`.
5. **Requiring scenarios to pass against the current skill, running the full `scenarios × testing-agents` matrix, or booting `wp-env` for a live pass.** Well-formedness / runnability (discoverable + e2e-collectable) is the bar.
6. **Generating the plugin code for any scenario.**
7. **Theme-artifact-bound Themes sub-areas** — theme.json (as a file), block templates, template parts, the template hierarchy, classic theme template files, custom-header/custom-background, and `style.css` — are not implemented, because the plugin scaffold cannot ship a theme. Only the pre-existing `theme-json-custom-color-palette` stub records this with a `# Deferred:` comment; the others get no catalog entry and are recorded only here.
8. **A theme-scaffold harness change** (the capability that would let the harness scaffold a theme and thereby unblock the deferred sub-areas) — surfaced as a future recommendation, not implemented in this review.
9. **A block-pattern registration scenario, an `add_theme_support` scenario, and a `wp_head`/`wp_footer` direct-output marker scenario** — excluded for the reasons in Requirement 20; none is added as a new catalog stub.
10. **Adding shared rubrics by default.**

## Acceptance Criteria

1. **One area: Themes**
   Given the newly implemented scenarios, When mapping each to a top-level area, Then every one belongs to the Themes area, and the existing Interactivity API, v1, Plugins, Block Editor, and REST API scenarios are unchanged in scope and unrenamed.

2. **Selection follows harness feasibility**
   Given each newly implemented scenario, When inspecting how it is realized, Then it is plugin-expressible (achieved via a global hook from the scaffolded plugin with no theme artifact); And the scenario that ships an `e2e.spec.mjs` produces a clean, theme-independent, front-end-visible assertion, while each scenario that lacks such an assertion is judge-only; And every theme-artifact-bound sub-area is deferred rather than implemented.

3. **Adopted batch of three — one e2e, two judge-only**
   Given the newly implemented scenarios, When counting them, Then there are exactly three — (i) enqueuing a front-end stylesheet and script, shipping an `e2e.spec.mjs`; (ii) registering a navigation-menu location, judge-only; (iii) registering a sidebar / widget area, judge-only.

4. **Each scenario is one concept, one plugin edit**
   Given each newly implemented scenario, When inspecting what it asks for, Then it is realizable as a single edit to the scaffolded plugin's `index.php` registering on a single global hook (front-end asset enqueue, theme setup, or widgets init), with a handful of acceptance points, and it requires no theme artifact, no second block type, no JS toolchain, and no multi-step task.

5. **No duplication with covered sub-areas**
   Given each newly implemented scenario, When identifying its sub-area, Then it is none of the Interactivity API sub-area, the v1 four, the Plugins sub-areas, the Block Editor sub-areas, or the REST API sub-areas; And the enqueue scenario is distinct from the iAPI block `view.js` loading mechanism in that it loads a front-end stylesheet and script via a front-end asset-enqueue hook rather than via a `block.json` build; And the nav-menu-location and sidebar scenarios are each distinct from every existing `register_*` scenario (`cpt-register`, `taxonomy-register`, `settings-register`, `admin-menu-page`, `cron-event`) by targeting a different Themes handbook chapter and a different registration function.

6. **The enqueue scenario ships an `e2e.spec.mjs` with the right lifecycle and front-end assertion**
   Given the enqueue scenario, Then its directory includes an `e2e.spec.mjs` that imports from `@wordpress/e2e-test-utils-playwright` and `deactivateAllPlugins` from `../../utils/wp-cli.mjs`, activates `plugin-<name>-${agentId}` in `beforeAll` via `requestUtils.activatePlugin`, and deactivates all plugins in teardown; And it navigates to `page.goto("/")` and asserts, for the pinned plugin-defined handle(s), that the enqueued stylesheet's `<link>` (id `{handle}-css`) and the enqueued script's `<script>` (id `{handle}-js`) are present in the page HTML; And it seeds no content and adds no new helper to `eval/utils/`; And the assertion does not depend on which theme is active.

7. **The two judge-only scenarios ship no `e2e.spec.mjs`**
   Given the nav-menu-location scenario and the sidebar / widget-area scenario, When inspecting each directory, Then neither contains an `e2e.spec.mjs`, each is a `scenario.yaml`-only directory whose `acceptance` points are graded against the produced PHP code, and each registers on a single global hook (theme setup for the nav-menu location, widgets init for the sidebar) without requiring any front-end render.

8. **Asserted literals pinned in the prompt**
   Given the enqueue scenario's `e2e.spec.mjs`, When listing every handle, field name, path, slug, or value it asserts, Then each appears in that scenario's `prompt`.

9. **Schema conformance, tool-agnostic, doc-grounded**
   Given any newly implemented scenario's `scenario.yaml`, When reading it, Then it has exactly `name` (lowercase-kebab matching `/^[a-z0-9-]+$/` and equal to the directory name), `description`, `skills: [wordpress-development]`, `prompt`, `acceptance`, and `rubrics` present as an array, with no catalog-only fields (`difficulty`, `concepts`, `source`, `source_files`); And When reading its `prompt`, Then it is a user-voice, outcome-phrased request that does not name the tool / API / function / technology; And When reading its `acceptance` strings, Then they are clean human-readable checks with no embedded URLs; And the developer.wordpress.org page(s) grounding its acceptance points are cited in its catalog entry, not its `scenario.yaml`.

10. **Default zero rubrics**
    Given each newly implemented scenario, When reading its `rubrics` key, Then it is present as `[]` by default; And given any new shared rubric added under `eval/rubrics/`, Then a genuinely cross-cutting check is shared across multiple of this batch's scenarios, the rubric is simple and general, and the check is not duplicated in any scenario's `acceptance`.

11. **`themes-*` naming applied uniformly; existing scenarios not renamed**
    Given each newly implemented scenario, When inspecting its directory name, its `scenario.yaml` `name`, and its catalog record `name`, Then all three are identical, carry the `themes-` prefix, and match `/^[a-z0-9-]+$/`; And the enqueue scenario does not use the legacy stub name `classic-theme-enqueue-scripts`; And no existing scenario is renamed.

12. **Full catalog record per implemented scenario (1:1 identity, verbatim)**
    Given each newly implemented scenario — including the two judge-only ones — When inspecting `_wp-dev-candidates.yaml`, Then there is exactly one full Themes record whose `name` equals the scenario's directory name and its `scenario.yaml` `name`, whose `prompt` and `acceptance` text match the shipped `scenario.yaml` verbatim (same text, order, and quoting), and which carries `description`, `difficulty`, `concepts`, `source`, and `source_files` citing the developer.wordpress.org page(s) grounding its acceptance points; And no source URL appears in the `scenario.yaml`.

13. **Stubs reconciled; no stale or mismatched records**
    Given the updated catalog, When inspecting the Themes records, Then the `classic-theme-enqueue-scripts` stub is promoted to a full record renamed to the enqueue scenario's `themes-*` name; And the two judge-only scenarios are full records under the Themes area under an `# Implemented Themes scenarios — full records` sub-header; And `theme-json-custom-color-palette` remains a lighter stub with a `# Deferred: <reason>` comment ADDED recording that theme.json is a theme-root artifact the plugin scaffold cannot ship; And no new catalog stub is created for any uncovered Themes sub-area that has no stub today; And every implemented Themes sub-area is represented by exactly one full record under its final scenario name, with no orphaned stub duplicating an implemented sub-area and no name mismatch between a record and its scenario directory.

14. **Stale header line kept accurate**
    Given the catalog's header comment listing which areas have full prompt+acceptance, When reading it after the update, Then it lists Themes alongside Plugins, Block Editor, and REST API, and that header line is the only header change.

15. **iAPI catalog and other records untouched**
    Given the review's diff, When inspecting `eval/scenarios/_candidates.yaml` and the non-Themes records in `_wp-dev-candidates.yaml`, Then `_candidates.yaml` is unmodified and only Themes records (added, promoted, renamed, or annotated) change in `_wp-dev-candidates.yaml`.

16. **Discoverable and e2e-collectable, pass not required**
    Given any newly implemented scenario, When it is statically/structurally verified, Then it passes Skillsmith's scenario-shape check (so it is discoverable); And the enqueue scenario's `e2e.spec.mjs` parses and resolves its imports under test-runner collection — such that running Skillsmith on the scenario directory would execute to a graded result without harness or configuration errors; And a failing grade against the current skill does not violate this criterion; And no agent runs the full `scenarios × testing-agents` matrix, boots `wp-env` for a real pass, or generates the plugin code.

17. **Skill unchanged**
    Given the review's diff, When inspecting paths under `skills/wordpress-development/`, Then no file there is modified.

18. **Existing suite intact; flat discovery preserved**
    Given the review's diff, When inspecting the existing Interactivity API suite, the v1, Plugins, Block Editor, and REST API scenarios, and the existing `_candidates.yaml`, Then none are moved, renamed, reorganized, or broken, Skillsmith's flat discovery still enumerates them, and the new scenario directories are flat immediate children of `eval/scenarios/`.

19. **Theme-artifact-bound sub-areas deferred with the right footprint**
    Given the theme-artifact-bound Themes sub-areas (theme.json as a file, block templates, template parts, the template hierarchy, classic theme template files, custom-header/custom-background, `style.css`), When inspecting `_wp-dev-candidates.yaml`, Then none is implemented as a scenario; And only `theme-json-custom-color-palette` carries a `# Deferred:` reason (the others, having no stub, get no new catalog entry); And the theme-scaffold harness change that would unblock these is recorded as a future out-of-scope recommendation rather than implemented.

20. **Excluded candidate scenarios not implemented and not stubbed**
    Given a block-pattern registration scenario, an `add_theme_support` scenario, and a `wp_head`/`wp_footer` direct-output marker scenario, When inspecting the review's output, Then none is implemented as a Themes scenario and none is added as a new catalog stub.
