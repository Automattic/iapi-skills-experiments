# Spec: Common APIs scenarios

## Overview

The `wordpress-development` skill is evaluated by a Skillsmith-based suite under `eval/`. Prior reviews established a broad area → sub-area taxonomy of developer.wordpress.org, a committed candidate catalog (`eval/scenarios/_wp-dev-candidates.yaml`), and implemented scenarios for the Interactivity API, a v1 set (Hooks/Filters, Shortcodes, Custom Post Types, custom REST endpoints), the Plugins area, the Block Editor area, the REST API area, and the Themes area. The **Common APIs** area (the Common APIs Handbook, `https://developer.wordpress.org/apis/`) is still uncovered: the catalog carries only two Common APIs stubs (`transient-cache-remote-data` and `options-api-store-retrieve`), and no Common APIs scenario is implemented.

This review extends coverage to the **Common APIs** area with a small batch of simple, documentation-grounded scenarios — reusing (not rebuilding) the existing taxonomy and catalog. The defining constraint for Common APIs is **avoiding duplication**: the Common APIs Handbook overlaps heavily with the Plugin Handbook, so several Common APIs sub-areas (Metadata, Shortcode, Settings, Cron, Internationalization) are already covered by existing Plugins scenarios and must not be re-done. Targeting only genuinely uncovered sub-areas, and observing that only one of them (the Rewrite API) has a clean front-end-observable surface while the rest are data-oriented, the batch is deliberately **one end-to-end scenario plus three judge-only scenarios**: a custom pretty URL via the Rewrite API (e2e), store-and-retrieve a value via the Options API (judge-only), cache a value with an expiry via the Transients API (judge-only), and fetch data from an external web service via the HTTP API (judge-only). The intent explicitly permits this smaller batch given the Common APIs / Plugin Handbook overlap.

As in prior reviews, the skill itself is not modified — the scenarios lead and the skill catches up in later work; verification is **static/structural only** (each scenario discoverable by Skillsmith and, where it ships one, its `e2e.spec.mjs` loadable/collectable by the test runner), and scenarios are not required to pass against the current skill. The folders question is already resolved (review-2): the adopted convention is the `common-apis-*` pseudo-folder naming (area-prefixed flat scenario names), which this review simply applies.

The exact prompt and acceptance wording of each scenario, the final `common-apis-*` directory names, and the exact catalog-record text are **design/plan/code decisions**. This spec sets the selection criteria, the per-scenario shape, the verification expectations, the catalog-consistency rules, and the "done" bar — not the answers.

For context, each implemented scenario follows the established Skillsmith conventions already used by the existing scenarios:
- A directory `eval/scenarios/<name>/` that is a flat immediate child of `eval/scenarios/`, containing a `scenario.yaml` and (for the e2e scenario) an `e2e.spec.mjs`.
- `scenario.yaml` keys: `name`, `description`, `skills: [wordpress-development]`, `prompt`, `acceptance` (scenario-specific success points), and `rubrics` (a list, `[]` when none).
- Skillsmith discovers only immediate children of `eval/scenarios/` that contain a `scenario.yaml`; nested directories and non-directory / leading-underscore files are skipped. This is why a catalog file (`_wp-dev-candidates.yaml`) sits safely among real scenario directories.
- The scaffolded plugin hosts PHP-only registrations/calls in its `index.php` (here, on global hooks such as `init`, plus for the Rewrite scenario a `register_activation_hook`) — no theme or block artifact is needed for these scenarios.
- Front-end e2e specs follow the `filter-body-class` / `themes-enqueue-assets` precedent: activate only the scenario's own plugin, navigate to a front-end URL, and assert against the resulting response, with no content seeding required.

## Requirements

### A. Area and selection

1. **One area only: Common APIs.** Every newly implemented scenario belongs to the Common APIs area (the Common APIs Handbook, `https://developer.wordpress.org/apis/`). No newly implemented scenario targets any other top-level area, and the existing Interactivity API, v1, Plugins, Block Editor, REST API, and Themes scenarios are not re-scoped or renamed.

2. **Dedup is the governing selection criterion: only genuinely uncovered sub-areas.** No newly implemented scenario duplicates a Common APIs sub-area already covered by an existing scenario, judged at the sub-area level (distinct handbook chapter + distinct API/registration function). In particular, the already-covered sub-areas — Metadata (`post-meta-rest`), Shortcode (`shortcode-with-attr`), Settings (`settings-register`, via `register_setting`), Cron (`cron-event`), and Internationalization (`i18n-textdomain`) — are NOT re-done.

3. **Options API is treated as distinct from the Settings API.** A direct Options-API scenario (imperatively storing and retrieving a value via `add_option`/`update_option`/`get_option`) is in scope and is not a duplicate of `settings-register`, because they are different handbook chapters, different function surfaces (zero overlap — `settings-register` registers a setting's schema and never reads or writes the option value), and different mental models (declare a setting for admin/REST to manage vs. imperatively store and retrieve a value).

4. **e2e where behaviorally verifiable, judge-only otherwise.** A sub-area gets an e2e scenario only when it produces a clean, observable front-end assertion in the existing harness; a sub-area whose behavior cannot be observed from the front end is judge-only (graded against the produced PHP). The Rewrite API is the e2e scenario; the data-oriented sub-areas (Options, Transients, HTTP API) are judge-only.

### B. The adopted batch

5. **Adopted batch: four scenarios — one e2e + three judge-only.** The implemented batch is: (i) **Rewrite API** — register a custom pretty URL and serve a response at it, shipped with an `e2e.spec.mjs`; (ii) **Options API** — store and retrieve a value, judge-only; (iii) **Transients API** — cache a value with an expiry and recompute it after it expires, judge-only; (iv) **HTTP API** — fetch data from an external web service with error handling, judge-only. This is a smaller batch than some prior reviews, which the intent explicitly permits given the Common APIs / Plugin Handbook overlap. The Rewrite API is the only e2e-verifiable Common API in this batch; no second clean front-end-observable, non-duplicative Common APIs sub-area exists, so the batch is deliberately one e2e plus three judge-only.

6. **Each scenario is one concept, one small feature, one plugin edit.** Each implemented scenario is a single one-concept / one-small-feature task realizable as a single edit to the scaffolded plugin's `index.php` (registrations/calls on global hooks such as `init`, plus for the Rewrite scenario a `register_activation_hook` flush), with a handful of acceptance points. No theme artifact, no second block type, no JS toolchain, no custom database table, and no multi-feature / multi-step task.

7. **The Rewrite scenario is self-contained via an activation-hook flush.** The Rewrite scenario is realizable by registering its rewrite rule on a load-time hook and flushing rewrite rules once when the plugin is activated, so that the custom URL routes correctly the first time the test navigates to it — requiring no new harness infrastructure and no permalink-structure setup step. Pretty permalinks are on by default in this harness (`@wordpress/env` ≥ 11.0.0, pinned `^11.4.0`), so the custom pretty URL routes without any additional setup.

8. **The Rewrite scenario ships an `e2e.spec.mjs` following the established lifecycle and asserts on the front-end response.** Its directory includes an `e2e.spec.mjs` that follows the existing precedent: it imports from `@wordpress/e2e-test-utils-playwright` and `deactivateAllPlugins` from the shared wp-cli util, activates `plugin-<name>-${agentId}` in `beforeAll` via `requestUtils.activatePlugin`, deactivates all plugins in teardown, asserts inline (no new helper added to `eval/utils/`), and navigates to the pinned custom URL and asserts the expected status/content. No content seeding is required, and the assertion is theme-independent.

9. **The three judge-only scenarios ship no `e2e.spec.mjs`.** Each judge-only scenario (Options, Transients, HTTP API) is a `scenario.yaml`-only directory whose `acceptance` points are graded by the judge against the produced PHP code — mirroring the existing judge-only scenarios. The HTTP API scenario is graded on the PHP pattern statically — that the produced code makes the outbound request, checks for an error before using the response, and reads the response body — with NO live external request and NO live-200 acceptance criterion, so the scenario does not depend on a live external call succeeding or on the eval environment having outbound network. Its prompt is endpoint-agnostic (no specific external host pinned).

10. **Every literal the Rewrite e2e asserts is pinned in that scenario's `prompt`.** Each URL path, slug, field name, or value that the `e2e.spec.mjs` asserts is stated in that scenario's `prompt`, so prompt and assertion stay in lockstep.

### C. Per-scenario shape

11. **Schema-conformant, tool-agnostic, doc-grounded scenarios.** Each implemented scenario is a directory that is a flat immediate child of `eval/scenarios/`, containing a `scenario.yaml` with exactly `name` (lowercase-kebab matching `/^[a-z0-9-]+$/`, equal to the directory name), `description`, `skills: [wordpress-development]`, `prompt`, `acceptance` (scenario-unique check statements), and `rubrics` (present as an array). The `prompt` reads as a user-voice, outcome-phrased request that does NOT name the tool, API, function, framework, or technology to use (e.g. Transients framed as "cache a value so it isn't recomputed on every request and recompute it after it expires", HTTP as "fetch data from an external web service"); the `acceptance` strings are clean human-readable checks with no embedded source URLs; and no catalog-only fields (`difficulty`, `concepts`, `source`, `source_files`) appear in any `scenario.yaml`.

12. **Default zero shared rubrics.** Each new scenario declares `rubrics: []`. No new shared rubric under `eval/rubrics/` is added unless a genuinely cross-cutting check is shared across multiple of this batch's scenarios; if one is added, it is simple and general and is not duplicated in any scenario's `acceptance`. The `rubrics:` key is always present, even when empty.

### D. Naming

13. **`common-apis-*` pseudo-folder naming, applied uniformly to the new scenarios.** Each implemented scenario uses the adopted `common-apis-*` prefix, with the directory name == the `scenario.yaml` `name` == the catalog record `name`, all identical, each a flat immediate child of `eval/scenarios/` matching `/^[a-z0-9-]+$/`. The promoted stubs do NOT keep their legacy names: `options-api-store-retrieve` and `transient-cache-remote-data` are renamed to `common-apis-*` names on promotion (a catalog-record rename, not a scenario rename — no shipped scenario directory exists for them yet). The Rewrite and HTTP scenarios use brand-new `common-apis-*` names. Existing scenarios are NOT renamed. (Exact final `common-apis-*` names are a design/plan/code decision.)

### E. Catalog update

14. **Full catalog record per implemented scenario (1:1 identity, verbatim prompt+acceptance).** For each of the four implemented scenarios, `_wp-dev-candidates.yaml` contains a full record under the Common APIs area whose `name` equals the scenario's directory name and its `scenario.yaml` `name`, carrying the same `prompt` and `acceptance` text as the shipped `scenario.yaml` verbatim (same text, order, and quoting), plus `description`, `difficulty`, `concepts`, `source`, and `source_files` citing the developer.wordpress.org page(s) that ground its acceptance points. Provenance (source URLs) lives only in the catalog record, never in the `scenario.yaml`. The HTTP record is grounded to the HTTP API chapter (`/apis/making-http-requests/`), plus the `wp_remote_get` reference page for the error-handling acceptance point.

15. **Stubs promoted and reconciled under the Implemented sub-header.** The two existing Common APIs stubs (`options-api-store-retrieve`, `transient-cache-remote-data`) are promoted to full records (renamed per Requirement 13), with the Transients record reframed to a standalone cache-with-expiry concept decoupled from any HTTP call (the legacy stub over-coupled caching with a remote request). The Rewrite and HTTP scenarios are added as brand-new full records (no prior Common APIs stub). All four are placed under an `# Implemented Common APIs scenarios — full records` sub-header within the Common APIs area, mirroring the Themes / Block Editor / REST API pattern. After the update, every implemented Common APIs sub-area is represented by exactly one full record under its final `common-apis-*` name, with no orphaned Common APIs stub duplicating an implemented sub-area and no name mismatch between any record and its scenario directory.

16. **The Plugins `http-api-remote-get` stub is left untouched.** The existing `http-api-remote-get` stub under the Plugins area is NOT moved, renamed, promoted, or annotated; HTTP API coverage is added as a new Common APIs record (re-grounded to the Common APIs chapter), not by re-homing the Plugins stub. The resulting near-duplicate (an un-promoted Plugins stub plus a new Common APIs record) is acceptable, because the HTTP API is legitimately documented in both the Plugin Handbook (`/plugins/http-api/`) and the Common APIs Handbook (`/apis/making-http-requests/`), and "non-Common-APIs catalog records untouched" is a hard constraint.

17. **No Common APIs stub left deferred; no new stub for stub-less deferred sub-areas.** Because both existing Common APIs stubs are implemented, no Common APIs stub carries a `# Deferred:` comment. Database (`$wpdb`) and Filesystem are deferred sub-areas that have no catalog stub today; per the intent's stub rule (scoped to sub-areas that already have a stub), they receive NO new catalog entry, and their defer reasons are recorded only in this spec and the design doc.

18. **Header line kept accurate.** The catalog's header comment listing which areas have full prompt+acceptance ("…the implemented Plugins, Block Editor, REST API, and Themes scenarios…") is updated to also list Common APIs (e.g. "…Plugins, Block Editor, REST API, Themes, and Common APIs scenarios…"). This is the only header change.

19. **iAPI catalog and non-Common-APIs records untouched.** The Interactivity-API catalog `eval/scenarios/_candidates.yaml` is not modified. Within `_wp-dev-candidates.yaml`, only Common APIs records (added, promoted, renamed) and the single shared header comment change; no other area's records — including the Plugins `http-api-remote-get` stub — are rebuilt, re-derived, moved, renamed, or annotated.

### F. Done-criteria and non-disruption

20. **Well-formed and runnable, not required to pass.** Each implemented scenario is statically/structurally verified to be discoverable by Skillsmith (passes its scenario-shape check); and for the Rewrite scenario, its `e2e.spec.mjs` parses and resolves its imports under test-runner collection — such that running Skillsmith on the scenario directory would execute to a graded result without harness or configuration errors. A failing grade against the current skill is acceptable and does not violate this bar. No agent runs the full `scenarios × testing-agents` matrix, boots `wp-env` for a real pass, or generates the plugin code.

21. **Skill untouched.** No file under `skills/wordpress-development/` is modified by this review.

22. **Existing suite intact; flat discovery preserved.** The existing Interactivity API suite, the v1, Plugins, Block Editor, REST API, and Themes scenarios, and the existing `_candidates.yaml` are not moved, renamed, reorganized, or broken; Skillsmith's flat discovery under `eval/scenarios/` continues to enumerate them; and the new scenario directories are flat immediate children of `eval/scenarios/`.

## Out of Scope

1. **Database (`$wpdb`) is deferred, not implemented** — because raw `$wpdb` is non-idiomatic for simple tasks (the docs steer to the higher-level Options/Transients/Metadata APIs), a realistic custom-data scenario needs a custom table (multi-concept), and a tool-agnostic user-voice prompt cannot express it without naming the database. Having no catalog stub today, it gets no new catalog entry; its exclusion is recorded only in this spec and the design doc.

2. **Filesystem (`WP_Filesystem`) is deferred, not implemented** — because it requires multi-step credential bootstrapping tied to an admin/credentials-prompt context, which fails the "simple, one concept" bar and is awkward to express tool-agnostically. Having no catalog stub today, it gets no new catalog entry; its exclusion is recorded only in this spec and the design doc.

3. **Other excluded Common APIs sub-areas are not implemented and not stubbed** — Hooks (foundational, exercised implicitly by nearly every scenario), a standalone Security/escaping scenario (overlaps existing `shortcode-with-attr` and `settings-register` acceptance), and the Plugins meta-area (activation/deactivation hooks). None is implemented as a Common APIs scenario and none is added as a new catalog stub.

4. **Re-homing the Plugins `http-api-remote-get` stub** — it is not moved, renamed, promoted, or annotated; HTTP API coverage is added as a new Common APIs record instead.

5. **Any change to the skill** (`skills/wordpress-development/`).

6. **Re-exploring or re-litigating the folders question** (resolved in review-2; the `common-apis-*` pseudo-folder naming is simply applied here).

7. **Renaming or reorganizing the existing scenarios**, or any change to the iAPI `_candidates.yaml` or to non-Common-APIs records in `_wp-dev-candidates.yaml`.

8. **Requiring scenarios to pass against the current skill, running the full `scenarios × testing-agents` matrix, or booting `wp-env` for a live pass.** Well-formedness / runnability (discoverable + e2e-collectable) is the bar.

9. **Generating the plugin code for any scenario.**

10. **A live external HTTP request as part of the HTTP API scenario's acceptance** — the HTTP scenario does not require a live request to succeed, a live 200 response, or a pinned external host.

11. **Adding shared rubrics by default.**

12. **Implementing other top-level areas, or rebuilding / re-deriving the taxonomy or the whole catalog** — prior reviews' artifacts are reused, not rebuilt.

## Acceptance Criteria

1. **One area: Common APIs**
   Given the newly implemented scenarios, When mapping each to a top-level area, Then every one belongs to the Common APIs area (the Common APIs Handbook), and the existing Interactivity API, v1, Plugins, Block Editor, REST API, and Themes scenarios are unchanged in scope and unrenamed.

2. **No duplication with covered sub-areas**
   Given each newly implemented scenario, When identifying its sub-area at the handbook-chapter + distinct-function level, Then it is none of the already-covered sub-areas — Metadata (`post-meta-rest`), Shortcode (`shortcode-with-attr`), Settings (`settings-register`), Cron (`cron-event`), or Internationalization (`i18n-textdomain`); And the Options scenario is distinct from `settings-register` in that it imperatively stores and retrieves a value rather than registering a setting's schema, sharing zero functions with it.

3. **Selection follows behavioral verifiability**
   Given each newly implemented scenario, When inspecting how it is verified, Then the scenario that ships an `e2e.spec.mjs` (the Rewrite API) produces a clean, theme-independent, front-end-observable assertion, while each scenario whose behavior is not front-end-observable (Options, Transients, HTTP API) is judge-only.

4. **Adopted batch of four — one e2e, three judge-only**
   Given the newly implemented scenarios, When counting them, Then there are exactly four — (i) a custom pretty URL via the Rewrite API, shipping an `e2e.spec.mjs`; (ii) store-and-retrieve a value via the Options API, judge-only; (iii) cache a value with an expiry via the Transients API, judge-only; (iv) fetch data from an external web service via the HTTP API, judge-only.

5. **Each scenario is one concept, one plugin edit**
   Given each newly implemented scenario, When inspecting what it asks for, Then it is realizable as a single edit to the scaffolded plugin's `index.php` (registrations/calls on a global hook such as `init`, plus for the Rewrite scenario a `register_activation_hook` flush), with a handful of acceptance points, and it requires no theme artifact, no second block type, no JS toolchain, no custom database table, and no multi-step task.

6. **The Rewrite scenario is self-contained and needs no new harness infrastructure**
   Given the Rewrite scenario, When inspecting what it requires to route its custom URL, Then it registers its rewrite rule on a load-time hook and flushes rewrite rules once on plugin activation so the URL routes the first time the test navigates to it; And it requires no new helper in `eval/utils/` and no permalink-structure setup step (pretty permalinks are on by default in this harness).

7. **The Rewrite scenario ships an `e2e.spec.mjs` with the right lifecycle and front-end assertion**
   Given the Rewrite scenario, Then its directory includes an `e2e.spec.mjs` that imports from `@wordpress/e2e-test-utils-playwright` and `deactivateAllPlugins` from the shared wp-cli util, activates `plugin-<name>-${agentId}` in `beforeAll` via `requestUtils.activatePlugin`, and deactivates all plugins in teardown; And it navigates to the pinned custom URL and asserts the expected status/content; And it seeds no content, adds no new helper to `eval/utils/`, and its assertion does not depend on which theme is active.

8. **The three judge-only scenarios ship no `e2e.spec.mjs`**
   Given the Options, Transients, and HTTP API scenarios, When inspecting each directory, Then none contains an `e2e.spec.mjs`, each is a `scenario.yaml`-only directory whose `acceptance` points are graded against the produced PHP code; And the HTTP API scenario's acceptance grades the PHP pattern statically (makes the outbound request, checks for an error before using the response, reads the response body) with no live external request, no live-200 criterion, and no specific external host pinned in its prompt.

9. **Asserted literals pinned in the prompt**
   Given the Rewrite scenario's `e2e.spec.mjs`, When listing every URL path, slug, field name, or value it asserts, Then each appears in that scenario's `prompt`.

10. **Schema conformance, tool-agnostic, doc-grounded**
    Given any newly implemented scenario's `scenario.yaml`, When reading it, Then it has exactly `name` (lowercase-kebab matching `/^[a-z0-9-]+$/` and equal to the directory name), `description`, `skills: [wordpress-development]`, `prompt`, `acceptance`, and `rubrics` present as an array, with no catalog-only fields (`difficulty`, `concepts`, `source`, `source_files`); And When reading its `prompt`, Then it is a user-voice, outcome-phrased request that does not name the tool / API / function / framework / technology; And When reading its `acceptance` strings, Then they are clean human-readable checks with no embedded URLs; And the developer.wordpress.org page(s) grounding its acceptance points are cited in its catalog entry, not its `scenario.yaml`.

11. **Default zero rubrics**
    Given each newly implemented scenario, When reading its `rubrics` key, Then it is present as `[]` by default; And given any new shared rubric added under `eval/rubrics/`, Then a genuinely cross-cutting check is shared across multiple of this batch's scenarios, the rubric is simple and general, and the check is not duplicated in any scenario's `acceptance`.

12. **`common-apis-*` naming applied uniformly; existing scenarios not renamed**
    Given each newly implemented scenario, When inspecting its directory name, its `scenario.yaml` `name`, and its catalog record `name`, Then all three are identical, carry the `common-apis-` prefix, and match `/^[a-z0-9-]+$/`; And the Options and Transients scenarios do not use the legacy stub names `options-api-store-retrieve` or `transient-cache-remote-data`; And no existing scenario is renamed.

13. **Full catalog record per implemented scenario (1:1 identity, verbatim)**
    Given each of the four newly implemented scenarios, When inspecting `_wp-dev-candidates.yaml`, Then there is exactly one full Common APIs record whose `name` equals the scenario's directory name and its `scenario.yaml` `name`, whose `prompt` and `acceptance` text match the shipped `scenario.yaml` verbatim (same text, order, and quoting), and which carries `description`, `difficulty`, `concepts`, `source`, and `source_files` citing the developer.wordpress.org page(s) grounding its acceptance points; And no source URL appears in the `scenario.yaml`; And the HTTP record is grounded to `/apis/making-http-requests/` plus the `wp_remote_get` reference page for its error-handling acceptance.

14. **Stubs promoted and reconciled under the Implemented sub-header**
    Given the updated catalog, When inspecting the Common APIs records, Then `options-api-store-retrieve` and `transient-cache-remote-data` are promoted to full records renamed to `common-apis-*` names, with the Transients record reframed to a standalone cache-with-expiry concept decoupled from any HTTP call; And the Rewrite and HTTP scenarios are brand-new full records (no prior Common APIs stub); And all four sit under an `# Implemented Common APIs scenarios — full records` sub-header within the Common APIs area; And every implemented Common APIs sub-area is represented by exactly one full record under its final `common-apis-*` name, with no orphaned Common APIs stub duplicating an implemented sub-area and no name mismatch between any record and its scenario directory.

15. **The Plugins `http-api-remote-get` stub is left untouched**
    Given the review's diff, When inspecting the Plugins-area `http-api-remote-get` stub, Then it is not moved, renamed, promoted, or annotated; And HTTP API coverage is added as a new Common APIs record re-grounded to the Common APIs chapter; And the resulting near-duplicate (an un-promoted Plugins stub plus a new Common APIs record) is accepted.

16. **No Common APIs stub deferred; no new stub for stub-less deferred sub-areas**
    Given the updated catalog, When inspecting the Common APIs area, Then no Common APIs stub carries a `# Deferred:` comment (both existing stubs are implemented); And Database (`$wpdb`) and Filesystem, having no catalog stub today, receive no new catalog entry, with their defer reasons recorded only in this spec and the design doc.

17. **Header line kept accurate**
    Given the catalog's header comment listing which areas have full prompt+acceptance, When reading it after the update, Then it lists Common APIs alongside Plugins, Block Editor, REST API, and Themes, and that header line is the only header change.

18. **iAPI catalog and non-Common-APIs records untouched**
    Given the review's diff, When inspecting `eval/scenarios/_candidates.yaml` and the non-Common-APIs records in `_wp-dev-candidates.yaml`, Then `_candidates.yaml` is unmodified and only Common APIs records (added, promoted, renamed) plus the single shared header comment change in `_wp-dev-candidates.yaml`.

19. **Discoverable and e2e-collectable, pass not required**
    Given any newly implemented scenario, When it is statically/structurally verified, Then it passes Skillsmith's scenario-shape check (so it is discoverable); And the Rewrite scenario's `e2e.spec.mjs` parses and resolves its imports under test-runner collection — such that running Skillsmith on the scenario directory would execute to a graded result without harness or configuration errors; And a failing grade against the current skill does not violate this criterion; And no agent runs the full `scenarios × testing-agents` matrix, boots `wp-env` for a real pass, or generates the plugin code.

20. **Skill unchanged**
    Given the review's diff, When inspecting paths under `skills/wordpress-development/`, Then no file there is modified.

21. **Existing suite intact; flat discovery preserved**
    Given the review's diff, When inspecting the existing Interactivity API suite, the v1, Plugins, Block Editor, REST API, and Themes scenarios, and the existing `_candidates.yaml`, Then none are moved, renamed, reorganized, or broken, Skillsmith's flat discovery still enumerates them, and the new scenario directories are flat immediate children of `eval/scenarios/`.

22. **Deferred and excluded sub-areas have the right footprint**
    Given the deferred Common APIs sub-areas (Database/`$wpdb` and Filesystem) and the excluded ones (Hooks, a standalone Security/escaping scenario, the Plugins meta-area), When inspecting the review's output, Then none is implemented as a Common APIs scenario and none is added as a new catalog stub; And the defer reasons for Database and Filesystem are recorded only in this spec and the design doc.
