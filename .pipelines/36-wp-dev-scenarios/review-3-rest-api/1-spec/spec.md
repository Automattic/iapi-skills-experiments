# Spec: REST API scenarios

## Overview

The `wordpress-development` skill is evaluated by a Skillsmith-based suite under `eval/`. Prior reviews established a broad area → sub-area taxonomy of developer.wordpress.org, a committed candidate catalog (`eval/scenarios/_wp-dev-candidates.yaml`), and implemented scenarios for the Interactivity API, a v1 set (Hooks/Filters, Shortcodes, Custom Post Types, custom REST endpoints), the Plugins area, and the Block Editor area. The **REST API** area is still largely uncovered as a topic: the only REST-area scenario is v1's `rest-custom-endpoint`, which covers custom-endpoint *registration* (a public route via `register_rest_route`). The other major REST API sub-areas — modifying existing responses, schema/argument validation, and authentication/permissions — have no scenarios.

This review extends coverage to the **REST API** area with a small batch of simple, documentation-grounded scenarios — roughly one per major uncovered sub-area — reusing (not rebuilding) the existing taxonomy and catalog. The catalog already carries two REST API stubs (`rest-api-custom-field-on-post`, `rest-api-authentication-nonce`); this review promotes one to a full record, adds full records for the two new scenarios, and annotates the other as deferred. As in prior reviews, the skill itself is not modified — the scenarios lead and the skill catches up in later work; verification is **static/structural only** (each scenario discoverable by Skillsmith and its `e2e.spec.mjs` loadable/collectable by the test runner), and scenarios are not required to pass against the current skill. The folders question is already resolved (review-2): real subdirectories are not low-risk, so the adopted convention is the `rest-api-*` pseudo-folder naming (area-prefixed flat scenario names), which this review simply applies.

The exact prompt and acceptance wording of each scenario, the final `rest-api-*` directory names for the two new scenarios, and the exact catalog-record text are **design/plan/code decisions**. This spec sets the selection criteria, the per-scenario shape, the verification expectations, the catalog-consistency rules, and the "done" bar — not the answers.

For context, each implemented scenario follows the established Skillsmith conventions already used by the existing scenarios:
- A directory `eval/scenarios/<name>/` that is a flat immediate child of `eval/scenarios/`, containing a `scenario.yaml` and (for this batch) an `e2e.spec.mjs`.
- `scenario.yaml` keys: `name`, `description`, `skills: [wordpress-development]`, `prompt`, `acceptance` (scenario-specific success points), and `rubrics` (a list, `[]` when none).
- Skillsmith discovers only immediate children of `eval/scenarios/` that contain a `scenario.yaml`; nested directories and non-directory / leading-underscore files are skipped. This is why a catalog file (`_wp-dev-candidates.yaml`) sits safely among real scenario directories.
- The scaffolded plugin hosts PHP-only REST registrations in its `index.php` (`rest_api_init`, `register_rest_route`, `register_rest_field`) — no block or theme artifact is needed for these scenarios.
- The suite exposes two REST verification channels used inline in e2e specs: an **anonymous** browser request context, `page.request.get(path)`, which carries no admin cookie and exposes both an HTTP status and the parsed JSON body; and an **authenticated-as-admin** helper, `requestUtils.rest({ path })`, which returns the parsed JSON body, exposes no HTTP status, and throws on a non-2xx response.

## Requirements

### A. REST API scenario selection and scope

1. **One area only: REST API.** Every newly implemented scenario belongs to the REST API area (the "Extending the REST API" handbook). No newly implemented scenario targets any other top-level area, and the existing Interactivity API, v1, Plugins, and Block Editor scenarios are not re-scoped or renamed.

2. **Roughly one simple scenario per major uncovered REST API sub-area.** The batch implements approximately one simple scenario per major uncovered REST API sub-area, where the candidate uncovered sub-areas are: modifying responses (adding a field to an existing resource), schema/argument validation (route arguments with validation/sanitization), and authentication/permissions (gating a route so anonymous and authenticated callers are treated differently). The custom-endpoint registration sub-area is excluded as already covered by v1's `rest-custom-endpoint`.

3. **Adopted batch: three scenarios, all end-to-end verified.** The implemented batch is three scenarios — (i) adding a top-level field to an existing resource's REST response; (ii) route-argument validation/sanitization; (iii) a route gated by a permission check. Batch size (3) is on the scale of prior reviews (v1 = 4, Plugins = 6, Block Editor = 5). Not every candidate sub-area is implemented.

4. **Each scenario is one concept, one small feature, one plugin edit.** Each implemented scenario is a single one-concept / one-small-feature task realizable as a single edit to the scaffolded plugin's `index.php` (a REST registration on `rest_api_init`), with a handful of acceptance points. No second block type, no theme artifact, no JS toolchain (no enqueued/localized client script), and no multi-feature / multi-step task.

5. **No duplication with already-covered sub-areas.** No newly implemented scenario duplicates a sub-area already covered by the Interactivity API suite, the v1 four (including `rest-custom-endpoint`'s custom-endpoint registration), the Plugins scenarios, or the Block Editor scenarios — judged at the sub-area level. In particular, the modifying-responses scenario is distinct from `post-meta-rest` (which registers post meta surfacing under the resource's `.meta` object): it adds a *top-level* field to the resource. The validation and permission scenarios are distinct from `rest-custom-endpoint`: their prompts center the validation concept and the auth-gating concept respectively, not route registration.

6. **Defer-with-reason for sub-areas not implemented.** Each uncovered REST API sub-area that is NOT implemented as a scenario but ALREADY has a catalog stub keeps that stub as a lighter stub carrying a brief recorded defer reason; no NEW catalog stub is created for an uncovered sub-area that has none. Specifically: the existing `rest-api-authentication-nonce` stub stays a stub, carrying a recorded defer reason (intermediate difficulty; needs a JS toolchain; not cleanly REST-assertable; and the server-side authentication sub-area is covered by the new permission scenario). The global-parameters sub-area (client-side query parameters such as `_fields`/`_embed`) has no catalog stub today and gets none: it is out of scope because such parameters need zero server-side registration, leaving no plugin code to author or grade, and that exclusion is recorded solely in this spec's Out of Scope section (item 7), not as a catalog entry.

### B. Per-scenario shape and verification

7. **All three scenarios ship an `e2e.spec.mjs` following the established lifecycle.** Each scenario's directory includes an `e2e.spec.mjs` that imports from `@wordpress/e2e-test-utils-playwright`, activates `plugin-<name>-${agentId}` in `beforeAll` via `requestUtils.activatePlugin`, deactivates all plugins in before/after teardown, and asserts on REST responses inline (no new REST helper is added to `eval/utils/`). The observable behavior each spec verifies:
   - **Modifying responses:** seed a published post (via `requestUtils.createPost`), anonymously GET that post's REST resource, and assert the added top-level field is present with the expected value.
   - **Validation:** anonymously GET the route with valid input and assert HTTP status 200; anonymously GET the route with invalid input and assert HTTP status 400.
   - **Permission:** anonymously GET the gated route and assert HTTP status 401; call the route as authenticated admin (via `requestUtils.rest({ path })`) and assert it returns the expected body without throwing. Because `requestUtils.rest` exposes no HTTP status and throws on non-2xx, the authenticated half is asserted by the returned body / absence of a throw, not by an explicit status number.

8. **Every literal an e2e asserts is pinned in that scenario's `prompt`.** Each field name, route path, slug, status code, or response value that an `e2e.spec.mjs` asserts is stated in that scenario's `prompt`, so prompt and assertion stay in lockstep. For the permission scenario specifically, the anonymous (logged-out) case targets HTTP status **401** (not 403), and that status is the one stated in the prompt, asserted in the spec, and recorded in the acceptance.

9. **Schema-conformant, tool-agnostic, doc-grounded scenarios.** Each implemented scenario is a directory that is a flat immediate child of `eval/scenarios/`, containing a `scenario.yaml` with exactly `name` (lowercase-kebab matching `/^[a-z0-9-]+$/`, equal to the directory name), `description`, `skills: [wordpress-development]`, `prompt`, `acceptance` (scenario-unique check statements), and `rubrics` (present as an array). The `prompt` reads as a user-voice, outcome-phrased request that does NOT name the tool, API, function, framework, or technology to use; the `acceptance` strings are clean human-readable check statements with no embedded source URLs; and no catalog-only fields (`difficulty`, `concepts`, `source`, `source_files`) appear in any `scenario.yaml`.

10. **Default zero shared rubrics.** Each new scenario declares `rubrics: []`. No new shared rubric under `eval/rubrics/` is added unless a genuinely cross-cutting check is shared across multiple of this batch's scenarios; if one is added, it is simple and general and is not duplicated in any scenario's `acceptance`. The `rubrics:` key is always present, even when empty.

### C. Naming

11. **`rest-api-*` pseudo-folder naming, applied uniformly to the new scenarios.** Each implemented scenario uses the adopted `rest-api-*` prefix, with the directory name == the `scenario.yaml` `name` == the catalog record `name`, all identical, each a flat immediate child of `eval/scenarios/` matching `/^[a-z0-9-]+$/`. The modifying-responses scenario keeps the existing catalog stub's name `rest-api-custom-field-on-post`; the two new scenarios use `rest-api-*` names that name their concept (validation and permission). Existing scenarios are NOT renamed.

### D. Catalog update

12. **Full catalog record per implemented scenario (1:1 identity, verbatim prompt+acceptance).** For each implemented scenario, `_wp-dev-candidates.yaml` contains a full record under the REST API area whose `name` equals the scenario's directory name and its `scenario.yaml` `name`, carrying the same `prompt` and `acceptance` text as the shipped `scenario.yaml` verbatim (same text, same order, same quoting), plus `description`, `difficulty`, `concepts`, `source`, and `source_files` citing the developer.wordpress.org page(s) that ground its acceptance points. Provenance (source URLs) lives only in the catalog record, never in the `scenario.yaml`.

13. **Stubs reconciled; no stale or mismatched records.** `rest-api-custom-field-on-post` is promoted from stub to full record and its `# TODO: prompt + acceptance` comment is removed. The two new scenarios get brand-new full records added under the REST API area (ideally under an "Implemented REST API scenarios — full records" sub-header mirroring the Block Editor pattern). `rest-api-authentication-nonce` stays a lighter stub, but its `# TODO` comment is replaced by a `# Deferred: <reason>` comment recording the defer reason (intermediate; JS toolchain; not cleanly REST-assertable; server-side auth sub-area covered by the new permission scenario; not yet implemented). After the update, every implemented REST API sub-area is represented by exactly one full record under its final scenario name, with no orphaned stub duplicating an implemented sub-area and no name mismatch between any record and its scenario directory.

14. **Stale header line kept accurate.** The catalog's header comment listing which areas have full prompt+acceptance ("Full prompt + acceptance are included for the implemented Plugins and Block Editor scenarios…") is updated to also list REST API (e.g. "Plugins, Block Editor, and REST API scenarios…"). This is the only header change.

15. **iAPI catalog and non-REST-API records untouched.** The Interactivity-API catalog `_candidates.yaml` is not modified. Within `_wp-dev-candidates.yaml`, only REST API records (and the REST API stubs) are added, promoted, or annotated; no other area's records are rebuilt, re-derived, moved, or renamed.

### E. Done-criteria and non-disruption

16. **Well-formed and runnable, not required to pass.** Each implemented scenario is statically/structurally verified to be discoverable by Skillsmith (passes its scenario-shape check) and, since each ships an `e2e.spec.mjs`, that spec parses and resolves its imports under test-runner collection — such that running Skillsmith on the scenario directory would execute to a graded result without harness or configuration errors. A failing grade against the current skill is acceptable and does not violate this bar. No agent runs the full `scenarios × testing-agents` matrix, boots `wp-env` for a real pass, or generates the plugin code.

17. **Skill untouched.** No file under `skills/wordpress-development/` is modified by this review.

18. **Existing suite intact; flat discovery preserved.** The existing Interactivity API suite, the v1, Plugins, and Block Editor scenarios, and the existing `_candidates.yaml` are not moved, renamed, reorganized, or broken; Skillsmith's flat discovery under `eval/scenarios/` continues to enumerate them; and the new scenario directories are flat immediate children of `eval/scenarios/`.

## Out of Scope

1. **Implementing other top-level areas**, or rebuilding / re-deriving the taxonomy or the whole catalog — prior reviews' artifacts are reused, not rebuilt.
2. **Any change to the skill** (`skills/wordpress-development/`).
3. **Re-exploring or re-litigating the folders question** (resolved in review-2; the `rest-api-*` pseudo-folder naming is simply applied here).
4. **Renaming or reorganizing the existing scenarios**, or any change to the iAPI `_candidates.yaml`.
5. **Requiring scenarios to pass against the current skill, running the full `scenarios × testing-agents` matrix, or booting `wp-env` for a live pass.** Well-formedness / runnability (discoverable + e2e-collectable) is the bar.
6. **Generating the plugin code for any scenario.**
7. **A global-parameters (`_fields`/`_embed`) scenario** — no server-side surface to author or grade. This sub-area is excluded here and gets NO catalog stub or record (it has none today and none is added); its exclusion is recorded only in this Out of Scope section. Separately, **a nonce-from-JS scenario** — intermediate, JS-toolchain, not cleanly REST-assertable — is also not implemented, but it already has the `rest-api-authentication-nonce` catalog stub, which is kept as a lighter stub with a recorded defer reason (see Requirement 6 and Requirement 13).
8. **An optional fourth (schema) scenario** — flagged as the next candidate but not adopted (more abstract, overlaps the validation scenario).
9. **Adding shared rubrics by default.**

## Acceptance Criteria

1. **One area: REST API**
   Given the newly implemented scenarios, When mapping each to a top-level area, Then every one belongs to the REST API area, and the existing Interactivity API, v1, Plugins, and Block Editor scenarios are unchanged in scope and unrenamed.

2. **One simple scenario per major uncovered sub-area, custom-endpoint excluded**
   Given the uncovered REST API sub-areas (modifying responses, schema/argument validation, authentication/permissions; custom-endpoint registration excluded as already covered by `rest-custom-endpoint`), When counting the newly implemented scenarios, Then there is roughly one simple scenario per implemented uncovered sub-area, and none re-covers custom-endpoint registration.

3. **Adopted batch of three, all e2e**
   Given the newly implemented scenarios, When counting them, Then there are exactly three — (i) adding a top-level field to an existing resource, (ii) route-argument validation, (iii) a permission-gated route — each shipping an `e2e.spec.mjs`, and the count is on the scale of prior reviews.

4. **Each scenario is one concept, one plugin edit**
   Given each newly implemented scenario, When inspecting what it asks for, Then it is realizable as a single edit to the scaffolded plugin's `index.php` registering on `rest_api_init`, with a handful of acceptance points, and it requires no second block type, no theme artifact, no JS toolchain, and no multi-step task.

5. **No duplication with covered sub-areas**
   Given each newly implemented scenario, When identifying its sub-area, Then it is none of the Interactivity API sub-area, the v1 four (Hooks/Filters, Shortcodes, Custom Post Types, custom-endpoint registration), the Plugins sub-areas, or the Block Editor sub-areas; And the modifying-responses scenario is distinct from `post-meta-rest` in that it adds a top-level field rather than data under the resource's `.meta`; And the validation and permission scenarios are distinct from `rest-custom-endpoint` in that their prompts center validation and auth-gating rather than route registration.

6. **Defer-with-reason recorded for sub-areas not implemented**
   Given the global-parameters (`_fields`/`_embed`) sub-area, When inspecting `_wp-dev-candidates.yaml`, Then no catalog stub or record exists for it (it is neither an implemented scenario nor a catalog entry), and its exclusion is recorded only in this spec's Out of Scope section (item 7) with the reason that such parameters need zero server-side registration; And given the `rest-api-authentication-nonce` stub, When inspecting `_wp-dev-candidates.yaml`, Then it stays a lighter stub carrying a recorded defer reason (intermediate; JS toolchain; not cleanly REST-assertable; server-side auth sub-area covered by the new permission scenario).

7. **All three ship an `e2e.spec.mjs` with the right channels and lifecycle**
   Given each newly implemented scenario, Then its directory includes an `e2e.spec.mjs` that imports from `@wordpress/e2e-test-utils-playwright`, activates `plugin-<name>-${agentId}` in `beforeAll`, and deactivates all plugins in teardown; And the modifying-responses spec seeds a published post and anonymously GETs that resource and asserts the added top-level field has the expected value; And the validation spec anonymously GETs the route with valid input asserting status 200 and with invalid input asserting status 400; And the permission spec anonymously GETs the gated route asserting status 401 and calls it as authenticated admin asserting the expected body is returned without throwing.

8. **Asserted literals pinned in the prompt; permission status is 401**
   Given each newly implemented scenario's `e2e.spec.mjs`, When listing every field name, route path, slug, status code, or response value it asserts, Then each appears in that scenario's `prompt`; And given the permission scenario, Then its anonymous (logged-out) case targets status 401 (not 403) in the prompt, the spec assertion, and the acceptance alike.

9. **Schema conformance, tool-agnostic, doc-grounded**
   Given any newly implemented scenario's `scenario.yaml`, When reading it, Then it has exactly `name` (lowercase-kebab matching `/^[a-z0-9-]+$/` and equal to the directory name), `description`, `skills: [wordpress-development]`, `prompt`, `acceptance`, and `rubrics` present as an array, with no catalog-only fields (`difficulty`, `concepts`, `source`, `source_files`); And When reading its `prompt`, Then it is a user-voice, outcome-phrased request that does not name the tool / API / function / technology; And When reading its `acceptance` strings, Then they are clean human-readable checks with no embedded URLs; And the developer.wordpress.org page(s) grounding its acceptance points are cited in its catalog entry, not its `scenario.yaml`.

10. **Default zero rubrics**
    Given each newly implemented scenario, When reading its `rubrics` key, Then it is present as `[]` by default; And given any new shared rubric added under `eval/rubrics/`, Then a genuinely cross-cutting check is shared across multiple of this batch's scenarios, the rubric is simple and general, and the check is not duplicated in any scenario's `acceptance`.

11. **`rest-api-*` naming applied uniformly; existing scenarios not renamed**
    Given each newly implemented scenario, When inspecting its directory name, its `scenario.yaml` `name`, and its catalog record `name`, Then all three are identical, carry the `rest-api-` prefix, and match `/^[a-z0-9-]+$/`; And the modifying-responses scenario's name is `rest-api-custom-field-on-post`; And no existing scenario is renamed.

12. **Full catalog record per implemented scenario (1:1 identity, verbatim)**
    Given each newly implemented scenario, When inspecting `_wp-dev-candidates.yaml`, Then there is exactly one full REST API record whose `name` equals the scenario's directory name and its `scenario.yaml` `name`, whose `prompt` and `acceptance` text match the shipped `scenario.yaml` verbatim (same text, order, and quoting), and which carries `description`, `difficulty`, `concepts`, `source`, and `source_files` citing the developer.wordpress.org page(s) grounding its acceptance points; And no source URL appears in the `scenario.yaml`.

13. **Stubs reconciled; no stale or mismatched records**
    Given the updated catalog, When inspecting the REST API records, Then `rest-api-custom-field-on-post` is a full record with its `# TODO: prompt + acceptance` comment removed, the two new scenarios are full records under the REST API area, and `rest-api-authentication-nonce` remains a lighter stub whose `# TODO` comment has been replaced by a `# Deferred: <reason>` comment recording the defer reason; And every implemented REST API sub-area is represented by exactly one full record under its final scenario name, with no orphaned stub duplicating an implemented sub-area and no name mismatch between a record and its scenario directory.

14. **Stale header line kept accurate**
    Given the catalog's header comment listing which areas have full prompt+acceptance, When reading it after the update, Then it lists REST API alongside Plugins and Block Editor, and that header line is the only header change.

15. **iAPI catalog and other records untouched**
    Given the review's diff, When inspecting `eval/scenarios/_candidates.yaml` and the non-REST-API records in `_wp-dev-candidates.yaml`, Then `_candidates.yaml` is unmodified and only REST API records (added, promoted, or annotated) change in `_wp-dev-candidates.yaml`.

16. **Discoverable and e2e-collectable, pass not required**
    Given any newly implemented scenario, When it is statically/structurally verified, Then it passes Skillsmith's scenario-shape check (so it is discoverable) and its `e2e.spec.mjs` parses and resolves its imports under test-runner collection — such that running Skillsmith on the scenario directory would execute to a graded result without harness or configuration errors; And a failing grade against the current skill does not violate this criterion; And no agent runs the full `scenarios × testing-agents` matrix, boots `wp-env` for a real pass, or generates the plugin code.

17. **Skill unchanged**
    Given the review's diff, When inspecting paths under `skills/wordpress-development/`, Then no file there is modified.

18. **Existing suite intact; flat discovery preserved**
    Given the review's diff, When inspecting the existing Interactivity API suite, the v1, Plugins, and Block Editor scenarios, and the existing `_candidates.yaml`, Then none are moved, renamed, reorganized, or broken, Skillsmith's flat discovery still enumerates them, and the new scenario directories are flat immediate children of `eval/scenarios/`.
