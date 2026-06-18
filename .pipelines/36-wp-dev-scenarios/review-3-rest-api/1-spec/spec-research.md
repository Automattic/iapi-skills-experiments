# Spec Research

## Rough Idea

Extend the `wordpress-development` eval suite's coverage to the **REST API** area with simple, documentation-driven scenarios (~1 per major uncovered sub-area). Build on the existing taxonomy and candidate catalog established in review-1, promoting the REST API stubs in `_wp-dev-candidates.yaml` to full records. New scenarios use the adopted `rest-api-*` pseudo-folder naming (flat directories with `rest-api-` prefix, matching `/^[a-z0-9-]+$/`).

**Already covered (do not duplicate):**
- `rest-custom-endpoint` (v1): custom REST endpoint registration via `register_rest_route`, `permission_callback`, `rest_api_init`.

**Existing REST API stubs in catalog (to promote):**
- `rest-api-custom-field-on-post`: `register_rest_field` adding a field to Posts endpoint.
- `rest-api-authentication-nonce`: WP REST API nonce for authenticated JS requests (intermediate difficulty).

**Candidate uncovered sub-areas (from intent):**
- Modifying responses (`register_rest_field` adding a field to an existing resource)
- Schema / argument validation (route `args` with `validate_callback` / `sanitize_callback`)
- Authentication / permissions (`permission_callback` gating so anon → 401, authenticated → 200)
- Possibly global parameters (`_fields` / `_embed`)

**Naming:** `rest-api-*` prefix. Existing scenarios NOT renamed.

**Verification:** e2e via direct REST assertions (`page.request.get` for anon, `requestUtils` for authenticated) where clean; judge-only otherwise.

**Done bar:** well-formed and runnable (discoverable by Skillsmith, e2e specs loadable by Playwright); pass against current skill not required.

## Q&A

### Q1: What does the existing `rest-custom-endpoint` e2e spec assert, and what patterns does the `cpt-register` or other e2e specs use for REST assertions — specifically the anon `page.request.get` and authenticated `requestUtils` channel?

**A:** `rest-custom-endpoint` HAS an `e2e.spec.mjs`. Three distinct verification channels exist in the suite today:

- **Anon REST**: `page.request.get(path)` → `.status()`, `await resp.json()`. `page.request` is an anonymous browser request context (no admin cookie). Used by `rest-custom-endpoint`, `cpt-register`.
  ```js
  const resp = await page.request.get("/wp-json/myplugin/v1/hello");
  expect(resp.status()).toBe(200);
  expect(await resp.json()).toHaveProperty("message");
  ```
- **Authenticated REST via `requestUtils`**: authenticated as admin. So far only the typed helper `requestUtils.getSiteSettings()` is used (in `settings-register`):
  ```js
  const settings = await requestUtils.getSiteSettings();
  expect(settings.my_plugin_tagline).toBe("Hello world");
  ```
- **Plugin lifecycle**: `requestUtils.activatePlugin(slug)` in `beforeAll`; `deactivateAllPlugins()` (wp-cli) in before/afterAll.

Standard spec preamble: `import { expect, test } from "@wordpress/e2e-test-utils-playwright";` — `requestUtils` and `page` are injected fixtures (no local import path). Plugin activation: `requestUtils.activatePlugin(plugin-<scenario>-${workerInfo.project.metadata.agentId})`.

**No REST-specific helpers exist in `eval/utils/`.** Contents: `wp-cli.mjs` (`wpCli`, `deactivateAllPlugins`), `scaffold-plugin.ts`, `verify-e2e.ts` (harness), `global-setup.mjs`. REST assertions are written **inline** with raw Playwright primitives + `requestUtils` fixture methods. Each new REST scenario writes assertions inline, copying the `rest-custom-endpoint` shape.

**Open flag (→ Q2):** `requestUtils` is authenticated-as-admin, but the only authenticated REST call used so far is the typed `getSiteSettings()`. Whether `requestUtils` exposes a *generic* authenticated GET (e.g. `.rest({ path })`) determines whether an auth-gating scenario can assert both channels (anon 401 / authed 200) in e2e, or must be judge-only.

**Reasoning:** Verified by reading the e2e spec files directly.

**Sources:** `eval/scenarios/rest-custom-endpoint/e2e.spec.mjs`, `eval/scenarios/cpt-register/e2e.spec.mjs`, `eval/scenarios/settings-register/e2e.spec.mjs`, `eval/utils/` (wp-cli.mjs, scaffold-plugin.ts, verify-e2e.ts, global-setup.mjs).

### Q2: Does `requestUtils` (from `@wordpress/e2e-test-utils-playwright`) expose a generic authenticated REST method (e.g. `.rest({ path, method })`), or only typed helpers like `getSiteSettings()`? This determines whether an auth/permissions scenario can do a clean two-channel e2e (anon → 401, authenticated-admin → 200).

**A:** YES — `requestUtils.rest()` is a generic authenticated REST method. Signature (from upstream Gutenberg `packages/e2e-test-utils-playwright/src/request-utils/rest.ts`):
```ts
async function rest<RestResponse = any>(this: RequestUtils, options: RestOptions): Promise<RestResponse>
// RestOptions extends RequestFetchOptions: { path: string, method?, data?, headers?, params? }
```
- Authenticated as admin (sets `X-WP-Nonce`, auto-refreshes on invalid nonce).
- Returns the **parsed JSON body**, NOT a Playwright `APIResponse` — so NO `.status()`. On non-2xx it **throws**. A successful authed call returning the expected body IS effectively the 200 assertion; an explicit authed status code is awkward via `rest()`.
- Full RequestUtils methods include: `rest`, `batchRest`, `getSiteSettings`, `updateSiteSettings`, `activatePlugin`, `deactivatePlugin`, `createPost`, `createUser`, etc.

**Implication — auth/permissions sub-area is e2e-feasible (not judge-only):**
- **Anon (expect 401):** `page.request.get('/wp-json/<ns>/<route>')` → `expect(resp.status()).toBe(401)`. `.status()` directly assertable. Clean.
- **Authenticated (expect 200/value):** `requestUtils.rest({ path: '/<ns>/<route>' })` → returns JSON body; assert on it. Success = the 200 assertion.

**Refinement — verified against the ACTUALLY INSTALLED package (v1.44.0).** The main repo has it installed at `node_modules/@wordpress/e2e-test-utils-playwright` (worktree's own node_modules is empty). Read `build-types/request-utils/rest.d.ts` + `build/request-utils/rest.js`. Behavior (exact): resolves `path` against the discovered REST root, fetches with `failOnStatusCode: false`, then `const json = await response.json(); if (!response.ok()) throw json; return json;`. So returns parsed JSON body on 2xx, **throws the parsed error JSON on non-2xx** (no `.status()` surfaced). Auto-renews on `rest_cookie_invalid_nonce`. `method` defaults to GET.

**Caveats to bake into the spec (so code-phase doesn't trip):**
1. `rest()` returns the **body, not a status code**. Assert authed success by returned data (or "did not throw"), NOT `.toBe(200)`. An explicit authed status number would require dropping to `page.request` with a manual nonce header — more fragile; not recommended.
2. The **anon-401 assertion is the cleaner, more robust half**; it alone is solid e2e. The authed-returns-data half is a clean complement.
3. **Status nuance:** a bare `false`/`WP_Error` from `permission_callback` yields **401 when logged-out, 403 when logged-in-but-unauthorized**. The anon `page.request` case is logged-out → **401** is the natural target. Pin the expected status (401 for the anon/logged-out case) in acceptance.

**Reasoning:** Verified against the actually installed v1.44.0 (matches the `^1.44.0` pin), not just upstream.

**Sources:** `node_modules/@wordpress/e2e-test-utils-playwright/build-types/request-utils/rest.d.ts` and `build/request-utils/rest.js` (installed v1.44.0).

### Q3: For scenario selection — given the candidate uncovered sub-areas (modifying responses via `register_rest_field`; schema/argument validation via route `args` + `validate_callback`/`sanitize_callback`; authentication/permissions via `permission_callback`; possibly global parameters `_fields`/`_embed`) and given that `rest-custom-endpoint` already covers custom-endpoint registration — which of these are (a) distinct sub-areas in the review-1 taxonomy, (b) each scopeable to ONE simple concept / one small scaffolded-plugin edit, and (c) cleanly e2e-verifiable or judge-only? I want to land on the actual batch (~3-4 scenarios) and which sub-areas, if any, should be deferred to lighter stubs.

**A:** Recommended batch: **3 scenarios, all e2e, each one `index.php` edit (no block, no theme)**. Taxonomy frame (review-1 design doc + "Extending the REST API" handbook): extending sub-pages = Modifying Responses, Adding Endpoints [v1-COVERED], Custom Content Types, Schema, Routes & Endpoints, Controller Classes. Global Parameters lives under "Using" not "Extending."

**(1) Modifying responses — `register_rest_field` → promote stub `rest-api-custom-field-on-post`.**
- DISTINCT: yes. No scenario uses `register_rest_field`. Crucial distinction from `post-meta-rest` (which uses `register_post_meta(... show_in_rest)` surfacing under the resource's **`.meta`** object): `register_rest_field` adds a **top-level field** with explicit `get_callback`/`update_callback`/`schema`. Different function, different sub-area.
- One concept / single edit: yes. `add_action('rest_api_init', fn => register_rest_field('post', 'my_field', ['get_callback'=>…, 'schema'=>…]))`.
- e2e: yes, cleanly. Seed published post via `requestUtils.createPost({status:'publish'})` (proven in post-meta-rest), then anon `page.request.get('/wp-json/wp/v2/posts/<id>')`, assert `body` has the top-level field with expected value (constant `get_callback` is deterministic).

**(2) Schema / argument validation — `args` + `validate_callback`/`sanitize_callback` → NEW (e.g. `rest-api-route-validation`).**
- DISTINCT: yes. No scenario exercises route `args` validation. Maps to "Routes & Endpoints." Mild overlap risk with rest-custom-endpoint (both register a route) — prompt must center the *validation* concept (good vs bad input), not registration.
- One concept / single edit: yes (slightly heavier — route + `args` with `validate_callback` + main callback). One `index.php`.
- e2e: **strongest of the four.** Anon `page.request.get('…/echo?value=abc')` → `.status() === 200`; anon `…/echo?value=` (or type-violating) → `.status() === 400`. `validate_callback` returning `WP_Error(..., ['status'=>400])` → HTTP 400. Two assertions, anon channel only, no auth.

**(3) Authentication / permissions — `permission_callback` gating → NEW (e.g. `rest-api-permission-callback`).**
- DISTINCT: yes. No scenario asserts auth gating; rest-custom-endpoint deliberately uses `__return_true` (public). "Routes & Endpoints / permission_callback."
- One concept / single edit: yes. Route whose `permission_callback` returns `current_user_can('edit_posts')` (or a `WP_Error`). One `index.php`.
- e2e: yes. Anon `page.request.get(route)` → `expect(resp.status()).toBe(401)` (logged-out → 401, per A2 nuance); authed `requestUtils.rest({path})` returns body without throwing (= success). Pin **401** for the anon/logged-out case.

**(4) Global parameters — `_fields`/`_embed` → DROP.**
- DISQUALIFIER: `_fields`/`_embed` are **purely client-side query-string params available on all endpoints by default; zero server-side/PHP registration.** No plugin edit to author or grade — it's a "how to call the API" skill, not a "build something" skill. Not a fit for the scaffold-plugin-edit harness. Drop (would be a usage scenario, out of scope).

**Existing catalog stubs:**
- `rest-api-custom-field-on-post` (= candidate 1): **good fit → promote to full record.**
- `rest-api-authentication-nonce` (nonce-from-JS, `wp_create_nonce`/`X-WP-Nonce`/`wp_localize_script`, intermediate): **POOR fit → defer as lighter stub.** Reasons: (a) about authenticated requests *from front-end JS* — needs an enqueued/localized script + JS file, a second artifact beyond one `index.php` edit, breaking the simplicity bar; (b) marked intermediate; (c) not cleanly e2e via REST channels (tests client JS in the DOM, not a REST status/body). The server-side permission concept it gestures at is better captured by candidate (3). Keep as stub noting intermediate + JS-toolchain + judge-only.

**Optional 4th (schema sub-area):** attach a `schema` callback to a route, assert via `requestUtils.rest({path:'/<ns>/v1', method:'OPTIONS'})`. Feasible but more abstract and conceptually overlaps validation (which already carries arg schema). Researcher leans **3 strong e2e over a weaker 4th**; flags schema as the next candidate if one more is wanted.

**Reasoning:** Per-candidate against the taxonomy, existing scenarios, simplicity bar, and the e2e channels confirmed in Q1–Q2.

**Sources:** Extending sub-pages — https://developer.wordpress.org/rest-api/extending-the-rest-api/ ; register_rest_field — https://developer.wordpress.org/rest-api/extending-the-rest-api/modifying-responses/ ; validate_callback→400, permission_callback→401 — https://developer.wordpress.org/rest-api/extending-the-rest-api/routes-and-endpoints/ ; `_fields`/`_embed` client-side — https://developer.wordpress.org/rest-api/using-the-rest-api/global-parameters/ ; channels proven in `eval/scenarios/post-meta-rest`, `cpt-register`, `rest-custom-endpoint`, review-1 `design-doc.md` lines 367-394.

### Q4: For the catalog promotion mechanics in `_wp-dev-candidates.yaml` — (a) what exactly is the "stale header line" that must be kept accurate, and what does it currently say vs. what it should say after this batch; (b) when promoting `rest-api-custom-field-on-post` and adding two new full records, what is the exact field shape of a "full record" vs. a "lighter stub" (which catalog-only fields: `difficulty`, `concepts`, `source`, `source_files`, `prompt`, `acceptance`); and (c) must the two NEW scenario names (validation, permission) also have catalog records, and does the deferred `rest-api-authentication-nonce` stub stay as-is or get an added defer-reason note?

**A:** All confirmed from review-2 commit `2137750` (only touched `_wp-dev-candidates.yaml`, +107/-2).

**(a) Stale header line — confirmed.** Currently (lines 28-29):
```
# Full prompt + acceptance are included for the implemented Plugins and Block
# Editor scenarios; all other records are lighter stubs.
```
Review-2 edited it in place (it had said "only for the six implemented Plugins"). The minimal edit for this run, mirroring that pattern, is to extend the area list to include REST API:
```
# Full prompt + acceptance are included for the implemented Plugins, Block
# Editor, and REST API scenarios; all other records are lighter stubs.
```
One comment line; nothing else in the header changes.

**(b) Full record vs lighter stub — confirmed.**
- **Full record** = `name`, `description`, `difficulty`, `concepts`, `source`, `source_files`, **plus** `prompt: |` (literal block) and `acceptance:` (list). Keeps all metadata; NOT name-only.
- **Lighter stub** = the same metadata **minus** prompt+acceptance, with a trailing comment — either `# TODO: prompt + acceptance` or `# Deferred: <reason>`.
- **prompt+acceptance must match the shipped `scenario.yaml` VERBATIM** (same text, same order). YAML-shape note: preserve the existing quoting style for acceptance items that wrap a leading-backtick string in quotes (e.g. `"`public => true`…"`).

**(c) Stub fate — confirmed.**
- Two new scenarios (validation, permission-callback) have no existing stub → **brand-new full records added under `# === Area: REST API ===`**, ideally grouped under a `# Implemented REST API scenarios — full records` sub-header (mirroring review-2's Block Editor sub-header).
- `rest-api-custom-field-on-post` (existing stub, currently `# TODO: prompt + acceptance`) → **promoted to a full record; the `# TODO` comment is removed** (promoted records carry no TODO).
- `rest-api-authentication-nonce` (existing stub) → **stays a stub, and gains a `# Deferred: <reason>` comment** mirroring review-2's `block-filter-add-custom-attribute` deferral (reason + cross-reference to the scenario covering the sub-area + "Not yet implemented."), e.g.: "intermediate, JS-toolchain (wp_localize_script + JS file), not cleanly REST-assertable; the server-side auth sub-area is covered by rest-api-permission-callback. Not yet implemented."

**Catalog delta for this run:** 1 header line edited; 1 stub promoted to full (TODO removed); 1 stub annotated `# Deferred`; 2 brand-new full records added — all inside the `# === Area: REST API ===` block (plus the one header line).

**Reasoning:** Diffed the review-2 commit and the current file; confirmed full records keep all metadata and copy prompt+acceptance verbatim, and confirmed the deferral-comment precedent.

**Sources:** git commit `2137750` diff of `eval/scenarios/_wp-dev-candidates.yaml`; current file lines 26-29 (header), 42-50 (block-filter deferral precedent), 52 (full-records sub-header), 396-414 (the two REST stubs).

## Research

### Existing REST API state (verified by direct inspection)

- **Already covered (do not duplicate):** `rest-custom-endpoint` (v1) — custom-endpoint registration via `register_rest_route` inside `rest_api_init`, with explicit `permission_callback: '__return_true'` (public). HAS an `e2e.spec.mjs` asserting anon `page.request.get` → 200 + JSON `message` field. Also adjacent: `post-meta-rest` (`register_post_meta(... show_in_rest)` → surfaces under resource `.meta`), `settings-register` (`register_setting(... show_in_rest)` → asserted via `requestUtils.getSiteSettings()`), `cpt-register` (anon REST channel).
- **Existing REST API catalog stubs (`_wp-dev-candidates.yaml`, lines 396-414):** `rest-api-custom-field-on-post` (`register_rest_field`, simple, `# TODO`), `rest-api-authentication-nonce` (nonce-from-JS, intermediate, `# TODO`).
- **e2e channels available:** anon `page.request.get(path)` (carries no auth; exposes `.status()` and `.json()`); authenticated-as-admin `requestUtils.rest({ path, method? })` (returns parsed JSON body, NO `.status()`, throws on non-2xx); plugin lifecycle via `requestUtils.activatePlugin(...)` + `deactivateAllPlugins()` (wp-cli). No REST-specific helpers in `eval/utils/` — assertions are inline.

## Consolidated Requirements

### A. REST API scenario selection and scope

1. **One area only: REST API.** Every newly implemented scenario belongs to the REST API area (the "Extending the REST API" handbook). No newly implemented scenario targets any other top-level area, and the existing Interactivity API, v1, Plugins, and Block Editor scenarios are not re-scoped or renamed.

2. **Roughly one simple scenario per major uncovered REST API sub-area.** The batch implements approximately one simple scenario per major uncovered REST API sub-area, where the candidate sub-areas are: modifying responses (`register_rest_field`), schema/argument validation (route `args` + `validate_callback`/`sanitize_callback`), and authentication/permissions (`permission_callback` gating). The custom-endpoint registration sub-area is excluded (already covered by v1's `rest-custom-endpoint`).

3. **Adopted batch: three scenarios, all e2e.** The implemented batch is three scenarios — (i) `register_rest_field` adding a top-level field to an existing resource; (ii) route `args` validation via `validate_callback`/`sanitize_callback`; (iii) a route gated by `permission_callback`. Batch size (3) is on the scale of prior reviews (v1 = 4, Plugins = 6, Block Editor = 5). Not every candidate sub-area is implemented.

4. **Each scenario is one concept, one small feature, one plugin edit.** Each implemented scenario is a single one-concept / one-small-feature task realizable as a single edit to the scaffolded plugin's `index.php` (REST registration on `rest_api_init` / `register_rest_route` / `register_rest_field`), with a handful of acceptance points. No second block type, no theme artifact, no JS toolchain, no multi-feature/multi-step task.

5. **No duplication with already-covered sub-areas.** No newly implemented scenario duplicates a sub-area already covered by the Interactivity API suite, the v1 four (including `rest-custom-endpoint` custom-endpoint registration), the Plugins scenarios, or the Block Editor scenarios — judged at the sub-area level. In particular, the `register_rest_field` scenario is distinct from `post-meta-rest` (which uses `register_post_meta` surfacing under `.meta`); the validation and permission scenarios are distinct from `rest-custom-endpoint` (their prompts center the validation / auth-gating concept, not route registration).

6. **Defer-with-reason for sub-areas not implemented.** Each major uncovered REST API sub-area NOT implemented as a scenario is recorded in the catalog as a lighter stub carrying a brief recorded reason. Specifically: global parameters (`_fields`/`_embed`) are out of scope because they are client-side query parameters needing zero server-side registration (no plugin code to author or grade); and the existing `rest-api-authentication-nonce` stub stays a stub with a recorded defer reason (intermediate, JS-toolchain, not cleanly REST-assertable, server-side auth sub-area covered by the new permission-callback scenario).

### B. Per-scenario shape and verification

7. **All three scenarios ship an `e2e.spec.mjs` following the established lifecycle.** Each scenario's directory includes an `e2e.spec.mjs` that imports from `@wordpress/e2e-test-utils-playwright`, activates `plugin-<name>-${agentId}` in `beforeAll` via `requestUtils.activatePlugin`, deactivates all plugins via `deactivateAllPlugins()` in before/after, and asserts on REST responses inline. Concretely: the `register_rest_field` scenario seeds a published post via `requestUtils.createPost` then anon-GETs `/wp-json/wp/v2/posts/<id>` and asserts the top-level field is present with the expected value; the validation scenario anon-GETs the route with valid input (asserting status 200) and with invalid input (asserting status 400); the permission scenario anon-GETs the route (asserting status 401) and calls `requestUtils.rest({ path })` as admin (asserting it returns the expected body without throwing).

8. **Every literal an e2e asserts is pinned in that scenario's `prompt`.** Each CSS class, slug, field name, route path, status code, or rendered value that the `e2e.spec.mjs` asserts is stated in the scenario's `prompt`, so prompt and assertion stay in lockstep. For the permission scenario, the anon/logged-out case targets status 401 (not 403), and that is reflected in the assertion and acceptance.

9. **Schema-conformant, tool-agnostic, doc-grounded scenarios.** Each implemented scenario is a directory that is a flat immediate child of `eval/scenarios/`, containing a `scenario.yaml` with exactly `name` (lowercase-kebab matching `/^[a-z0-9-]+$/`, equal to the directory name), `description`, `skills: [wordpress-development]`, `prompt`, `acceptance` (scenario-unique check statements), and `rubrics` (present as an array). The `prompt` reads as a user-voice, outcome-phrased request that does NOT name the tool, API, function, framework, or technology to use; the `acceptance` strings are clean human-readable check statements with no embedded source URLs; no catalog-only fields (`difficulty`, `concepts`, `source`, `source_files`) appear in any `scenario.yaml`.

10. **Default zero shared rubrics.** Each new scenario declares `rubrics: []`. No new shared rubric under `eval/rubrics/` is added unless a genuinely cross-cutting check is shared across multiple of this batch's scenarios; the `rubrics:` key is always present, even when empty.

### C. Naming

11. **`rest-api-*` pseudo-folder naming, applied uniformly to the new scenarios.** Each new scenario uses the adopted `rest-api-*` prefix, with the directory name == the `scenario.yaml` `name` == the catalog record `name`, all identical, flat immediate children of `eval/scenarios/`, each matching `/^[a-z0-9-]+$/`. The promoted modifying-responses scenario keeps the catalog stub's name `rest-api-custom-field-on-post`; the two new scenarios use `rest-api-*` names that name their concept (e.g. validation, permission-callback). Existing scenarios are NOT renamed.

### D. Catalog update

12. **Full catalog record per implemented scenario (1:1 identity, verbatim prompt+acceptance).** For each implemented scenario, `_wp-dev-candidates.yaml` contains a full record under the REST API area whose `name` equals the scenario's directory name and its `scenario.yaml` `name`, carrying the same `prompt` and `acceptance` text as the shipped `scenario.yaml` verbatim (same text, same order, same quoting), plus `description`, `difficulty`, `concepts`, `source`, and `source_files` citing the developer.wordpress.org page(s) that ground its acceptance points. Provenance (source URLs) lives only in the catalog record, never in the `scenario.yaml`.

13. **Stubs reconciled; no stale or mismatched records.** `rest-api-custom-field-on-post` is promoted from stub to full record and its `# TODO: prompt + acceptance` comment is removed. The two new scenarios get brand-new full records added under the REST API area (ideally under an "Implemented REST API scenarios — full records" sub-header mirroring the Block Editor pattern). `rest-api-authentication-nonce` stays a lighter stub but its `# TODO` comment is replaced by a `# Deferred: <reason>` comment (recording: intermediate + JS-toolchain + not cleanly REST-assertable + auth sub-area covered by the new permission-callback scenario + "Not yet implemented."). After the update, every implemented REST API sub-area is represented by exactly one full record under its final scenario name, with no orphaned stub duplicating an implemented sub-area and no name mismatch.

14. **Stale header line kept accurate.** The catalog's header comment listing which areas have full prompt+acceptance ("Full prompt + acceptance are included for the implemented Plugins and Block Editor scenarios…") is updated to also list REST API (e.g. "Plugins, Block Editor, and REST API scenarios…"). This is the only header change.

15. **iAPI catalog and non-REST-API records untouched.** The Interactivity-API catalog `_candidates.yaml` is not modified. Within `_wp-dev-candidates.yaml`, only REST API records (and the REST API stubs) are added, promoted, or annotated; no other area's records are rebuilt, re-derived, or moved.

### E. Done-criteria and non-disruption

16. **Well-formed and runnable, not required to pass.** Each implemented scenario is statically/structurally verified to be discoverable by Skillsmith (passes its scenario-shape check) and, since each ships an `e2e.spec.mjs`, that spec parses and resolves its imports under test-runner collection — such that running Skillsmith on the scenario directory would execute to a graded result without harness or configuration errors. A failing grade against the current skill is acceptable. No agent runs the full `scenarios × testing-agents` matrix, boots `wp-env` for a real pass, or generates the plugin code.

17. **Skill untouched.** No file under `skills/wordpress-development/` is modified.

18. **Existing suite intact; flat discovery preserved.** The existing Interactivity API suite, the v1, Plugins, and Block Editor scenarios, and the existing `_candidates.yaml` are not moved, renamed, reorganized, or broken; Skillsmith's flat discovery under `eval/scenarios/` continues to enumerate them; and the new scenario directories are flat immediate children of `eval/scenarios/`.

### Out of scope

- Implementing other top-level areas, or rebuilding/re-deriving the taxonomy or the whole catalog.
- Any change to the skill (`skills/wordpress-development/`).
- Re-exploring or re-litigating the folders question (resolved in review-2; `rest-api-*` pseudo-folder naming is simply applied).
- Renaming or reorganizing the existing scenarios, or any change to the iAPI `_candidates.yaml`.
- Requiring scenarios to pass against the current skill, running the full matrix, or booting `wp-env` for a live pass.
- Generating the plugin code for any scenario.
- A global-parameters (`_fields`/`_embed`) scenario (no server-side surface to author/grade) and a nonce-from-JS scenario (intermediate, JS-toolchain, not cleanly REST-assertable) — both deferred to lighter catalog stubs.
- An optional fourth (schema) scenario — flagged as the next candidate but not adopted (more abstract, overlaps the validation scenario).
- Adding shared rubrics by default.

## Consolidated Requirements
