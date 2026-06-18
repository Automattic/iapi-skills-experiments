# Design Research: REST API scenarios

## Research

<!-- Non-trivial findings from the design-doc-researcher, with sources cited. -->

### Existing REST API e2e pattern

From the existing `rest-custom-endpoint` scenario (`eval/scenarios/rest-custom-endpoint/e2e.spec.mjs`), verified by r3dresearcher. This is the exact lifecycle all three new REST scenarios copy:

- Imports (top of file):
  - `import { expect, test } from "@wordpress/e2e-test-utils-playwright";`
  - `import { deactivateAllPlugins } from "../../utils/wp-cli.mjs";`
- `test.describe("<scenario-name> scenario", () => { ... })` wraps everything.
- `test.beforeAll(async ({ requestUtils }, workerInfo) => { deactivateAllPlugins(); await requestUtils.activatePlugin(\`plugin-<name>-${workerInfo.project.metadata.agentId}\`); });`
- `test.afterAll(() => { deactivateAllPlugins(); });`
- `page` and `requestUtils` are injected fixtures (destructured from test args); no local import.

**Plugin slug pattern (exact):** `plugin-<scenario-name>-${workerInfo.project.metadata.agentId}` — template literal; `agentId` read from `workerInfo.project.metadata.agentId` (the 2nd arg of the `beforeAll`/test callback). New scenarios swap the middle to their own directory name, e.g. `plugin-rest-api-custom-field-on-post-${...agentId}`.

**deactivateAllPlugins import path:** `"../../utils/wp-cli.mjs"` (two levels up from a flat scenario dir to `eval/`, then `utils/wp-cli.mjs`). It is a wp-cli wrapper (`wp plugin deactivate --all --quiet`), NOT a fixture method. Source: `eval/utils/wp-cli.mjs` lines 15-23.

**Two REST verification channels (verified against the installed `@wordpress/e2e-test-utils-playwright` v1.44.0):**
- **Anonymous** `page.request.get(path)` → carries no admin cookie; exposes `.status()` (HTTP status) and `await resp.json()` (parsed body). Used today by `rest-custom-endpoint`, `cpt-register`, `post-meta-rest`. `rest-custom-endpoint` example: `const resp = await page.request.get("/wp-json/myplugin/v1/hello"); expect(resp.status()).toBe(200); expect(await resp.json()).toHaveProperty("message");`.
- **Authenticated-as-admin** `requestUtils.rest({ path })` → returns the parsed JSON body, exposes NO `.status()`, and throws (`throw json`) on a non-2xx response. GET by default. Path resolves against the discovered REST root, so pass `path: "/<ns>/<route>"` (leading slash stripped internally); auto-renews nonce. NOT yet used by any existing spec — ready for the permission scenario.

**Post-seeding teardown pattern:** `post-meta-rest` seeds in `beforeAll` with `requestUtils.createPost({ status: "publish" })` and adds `await requestUtils.deleteAllPosts();` in `afterAll`. Relevant for the modifying-responses scenario (which seeds a post). Source: `eval/scenarios/post-meta-rest/e2e.spec.mjs` lines 19, 24.

### register_rest_field documentation (modifying responses)

Grounding URL (verified by r3dresearcher, resolves): https://developer.wordpress.org/rest-api/extending-the-rest-api/modifying-responses/

- `register_rest_field( $object_type, $attribute, $args )`. `$attribute` is "the name of the field; this name will be used to define the key in the response object" — i.e. a **TOP-LEVEL key** in the resource JSON, NOT a key under `.meta`.
- `$args` keys: `get_callback` (retrieves the value; receives the resource array; returns the value), `update_callback`, `schema`.
- The page **explicitly contrasts** `register_rest_field` with `register_meta`: `register_meta` surfaces values under a `.meta` key, while `register_rest_field` adds a **top-level** field. This is exactly the distinction from `post-meta-rest` the spec calls out (Requirement 5 / Acceptance Criterion 5).
- The canonical example adds `karma` to comments. For Posts, register on the `'post'` object type, on `rest_api_init`.
- `get_callback` may return a fixed/constant string, making the e2e assertion deterministic without depending on stored data.
- Function reference: https://developer.wordpress.org/reference/functions/register_rest_field/

**e2e shape:** seed `requestUtils.createPost({ status: "publish" })`; anon `page.request.get("/wp-json/wp/v2/posts/" + post.id)`; assert the top-level field is present with the pinned value. `afterAll` adds `await requestUtils.deleteAllPosts()` (post-meta-rest precedent). A published post's REST resource is readable anonymously, and the registered top-level field appears in that anon response.

- **Anon readability proven in-repo:** `eval/scenarios/post-meta-rest/e2e.spec.mjs` (lines 19, 27-31) already seeds `requestUtils.createPost({ status: "publish" })` and does anon `page.request.get(\`/wp-json/wp/v2/posts/${post.id}\`)` reading the body with no auth. Published posts are publicly readable by core design; that passing spec is the existence proof.
- Posts resource route confirmed at https://developer.wordpress.org/rest-api/reference/posts/ → `GET /wp/v2/posts/<id>` (anon path `/wp-json/wp/v2/posts/<id>`).
- `get_callback` signature `function( $object, $field_name, $request, $object_type )`; returning a constant literal that ignores the args is valid and is the right call for a deterministic e2e.
- **Literal candidate (recommended):** field name `reading_time`, value `"5 min"`. User-voice friendly ("I want each post in my data API to include an estimated reading time of 5 min"), unambiguous to assert. The value is a fixed string so `get_callback` can be a constant.

### Route validation (validate_callback) documentation

Grounding URL (verified by r3dresearcher, resolves): https://developer.wordpress.org/rest-api/extending-the-rest-api/routes-and-endpoints/

- A route's `args` per-parameter config supports `validate_callback` and `sanitize_callback`. `validate_callback` fires first; on bad input it returns `new WP_Error( 'rest_invalid_param', ..., array( 'status' => 400 ) )` → HTTP **400**. Good input → **200**. The page documents this 400 pattern verbatim.

**e2e shape (anon channel only — cleanest of the three):** `page.request.get(".../<route>?<param>=<good>")` → `.status() === 200`; `page.request.get(".../<route>?<param>=<bad>")` (or a missing/type-violating value) → `.status() === 400`.

- **Doc's own worked example (strongest grounding):** a string-enum param `filter` with `enum => array('red','green','blue')` and a `validate_callback` that checks `is_string($value)` and `in_array($value, enum, true)`, returning `WP_Error('rest_invalid_param', ..., ['status'=>400])` on a non-member. Good value `blue` → 200; bad value `purple` → 400. Same page also shows `sanitize_callback => fn($v)=>sanitize_text_field($v)`.
- **Mechanism nuance (design-relevant):** the `enum` key auto-validates in core even WITHOUT a custom `validate_callback` — both an explicit `validate_callback` and a bare `enum` yield the 200/400 behavior. The scenario therefore asserts the **observable accept/reject behavior**, not a specific mechanism; the prompt is tool-agnostic and describes the behavior, leaving the agent free to use `enum`, `validate_callback`, or both.
- **Literal candidate (recommended, doc-grounded):** route `example/v1/color` (or similar), param `filter`, good `blue`, bad `purple`.

### Route-pinning convention (how `rest-custom-endpoint` reconciles tool-agnostic prompts with a specific asserted path)

Verified by r3dresearcher from `eval/scenarios/rest-custom-endpoint/scenario.yaml` (line 7) and its e2e (line 28):

- The **prompt hard-pins the full literal path in backticks** inside a user-voice sentence, e.g.: "When someone sends a GET request to `/wp-json/myplugin/v1/hello`, they should get back a JSON response with a `message` field." Namespace `myplugin/v1`, route `hello`.
- The **e2e asserts that exact literal**: `page.request.get("/wp-json/myplugin/v1/hello")`.
- This stays tool-agnostic: the prompt names the **path** (an outcome/contract the user wants) and the response **shape**, never the function `register_rest_route`. The two new route-based scenarios mirror this phrasing, pinning their own distinct literal paths.
- **Namespace choice for the new scenarios:** use a namespace distinct from `myplugin/v1` to avoid any cross-scenario confusion — recommended `example/v1`, with distinct routes per scenario (validation route e.g. `color`, permission route e.g. `private`). Each prompt pins its own full path.

### Permission success body (pinnable literal)

Verified by r3dresearcher from the routes-and-endpoints "Permissions Callback" example:

- The handbook's main callback returns `rest_ensure_response( 'This is private data.' )`, so the success body is the JSON string `"This is private data."` — a clean, pinnable literal.
- Authed e2e: `const body = await requestUtils.rest({ path: "/example/v1/private" }); expect(body).toBe("This is private data.");`. `requestUtils.rest` returns the parsed JSON body (= the string) and does not throw on success, so this asserts a SPECIFIC value (stronger than a bare no-throw) while still satisfying spec Req 7's "expected body returned without throwing."

### Directory-name collision check

r3dresearcher enumerated all of `eval/scenarios/`: 24 scenario dirs + `_candidates.yaml` + `_wp-dev-candidates.yaml`. No `rest-api-*` directory exists yet. All three proposed names are FREE and match `/^[a-z0-9-]+$/`: `rest-api-custom-field-on-post`, `rest-api-route-validation`, `rest-api-permission-check`. (Existing dirs: admin-menu-page, async-fetch, block-editor-block-bindings, block-editor-block-filters, block-editor-block-styles, block-editor-block-supports, block-editor-dynamic-block, config-fetch, counter, cpt-register, cron-event, derived-double, filter-body-class, focus-trap-menu, fruit-list-each, i18n-textdomain, independent-counters, minimal-scaffold, paginated-list, post-meta-rest, rest-custom-endpoint, settings-register, shared-state, shortcode-with-attr, taxonomy-register, toggle-visibility.)

### Permission callback (permission_callback) documentation

Grounding URL (verified by r3dresearcher, resolves): https://developer.wordpress.org/rest-api/extending-the-rest-api/routes-and-endpoints/ — section "Permissions Callback."

- The page's own example uses a `permission_callback` that returns `new WP_Error( 'rest_forbidden', ..., array( 'status' => 401 ) )` when `! current_user_can( 'edit_posts' )`. So **401 for the denied case is doc-grounded directly**.
- **401-vs-403 nuance confirmed at core source:** https://developer.wordpress.org/reference/functions/rest_authorization_required_code/ — its body is literally `return is_user_logged_in() ? 403 : 401;` ("401 if the user is not logged in, 403 if logged in"). So the **anonymous / logged-out branch is 401** regardless of whether the plugin hardcodes `'status' => 401` (per the handbook example) or returns a bare `false` / uses `rest_authorization_required_code()`. The anon `page.request.get` carries no cookie → logged-out → **401**. This satisfies spec Requirement 8 / Acceptance Criterion 8 (anon case is 401, not 403) safely under either implementation style.

**e2e shape:** anon `page.request.get(route)` → `expect(resp.status()).toBe(401)`; authed `await requestUtils.rest({ path: "/<ns>/<route>" })` returns the body without throwing (= success). Because `requestUtils.rest` exposes no `.status()` and throws on non-2xx, the authenticated half is asserted on the returned body / absence of a throw, NOT via `.toBe(200)`.

## Topics

### Topic: Overall approach — three e2e REST scenarios on the fixed plugin scaffold

- **Spec link:** Requirements 1-4, 7; Acceptance Criteria 1, 3, 4, 7.
- **Decision:** The batch is three scenarios, each a single PHP edit to the scaffolded plugin's `index.php`, registering on `rest_api_init`, each shipping an `e2e.spec.mjs` that follows the exact `rest-custom-endpoint` lifecycle (imports `@wordpress/e2e-test-utils-playwright` + `deactivateAllPlugins` from `../../utils/wp-cli.mjs`; `deactivateAllPlugins()` + `requestUtils.activatePlugin(\`plugin-<name>-${agentId}\`)` in `beforeAll`; `deactivateAllPlugins()` in `afterAll`). No new REST helper is added to `eval/utils/`; specs assert inline. The three sub-areas: (1) modify an existing response via `register_rest_field` (top-level field), (2) route-argument validation via `validate_callback` (good→200/bad→400), (3) a route gated by `permission_callback` (anon→401/authed→body).
- **Rationale:** This is the established, proven pattern; reusing it verbatim keeps each scenario well-formed and e2e-collectable (Acceptance Criterion 16) with zero harness change. The custom-endpoint registration sub-area is excluded (already covered by `rest-custom-endpoint`); each new scenario's prompt centers its own concept (modifying responses / validation / auth-gating), not route registration, keeping them distinct (Requirement 5).
- **No multi-option choice here** — the lifecycle is fixed by the existing suite; the only real decisions are per-scenario (below).

### Topic: Scenario 1 — `rest-api-custom-field-on-post` (modifying responses)

- **Spec link:** Requirements 2, 3 (sub-area i), 5, 7, 8, 11, 12; Acceptance Criteria 3, 5, 7, 8, 11, 12.
- **Sub-area:** Modifying responses — add a **top-level** field to an existing resource's REST response via `register_rest_field` on the `post` object type. Name is fixed by the existing stub (`rest-api-custom-field-on-post`, spec Req 11).
- **Mechanism:** `register_rest_field( 'post', '<field>', [ 'get_callback' => fn() => '<value>' ] )` on `rest_api_init`. The field appears at the **top level** of the post JSON (`body.<field>`), NOT under `.meta` — the documented distinction from `register_meta`, which is exactly what separates this scenario from `post-meta-rest` (spec Req 5). `get_callback` returns a fixed string so the asserted value is deterministic.
- **Pinned literals (prompt ↔ assertion lockstep, spec Req 8):** field name `reading_time`, value `"5 min"`, asserted on the posts resource `/wp-json/wp/v2/posts/<id>`.
- **e2e flow:** `beforeAll` seeds `requestUtils.createPost({ status: "publish" })`; test does anon `const resp = await page.request.get("/wp-json/wp/v2/posts/" + post.id)`, then `expect((await resp.json()).reading_time).toBe("5 min")`. `afterAll`: `deactivateAllPlugins()` + `await requestUtils.deleteAllPosts()`. Anon readability of a published post is proven in-repo by `post-meta-rest`.
- **acceptance (scenario-unique, clean checks, no URLs) — draft for phase 4:**
  1. A new top-level field named `reading_time` is added to the post resource's REST response (not nested under the resource's meta).
  2. The field is registered for the post resource on the REST initialization hook.
  3. Reading a published post through the site's data API returns `reading_time` with the value `5 min`.
  4. The field is exposed on the existing post resource without registering a new route or post meta.
- **Decision:** Implement e2e as above. Grounding URLs (catalog `source_files`): https://developer.wordpress.org/rest-api/extending-the-rest-api/modifying-responses/ and https://developer.wordpress.org/reference/functions/register_rest_field/.
- **Rationale:** Top-level `register_rest_field` is the canonical "modifying responses" mechanism and the doc page itself contrasts it with `.meta`, giving a clean distinctness story vs `post-meta-rest`. A constant `get_callback` makes the e2e deterministic. Anon GET of a published post is already proven by the suite.

### Topic: Scenario 2 — `rest-api-route-validation` (schema / argument validation)

- **Spec link:** Requirements 2, 3 (sub-area ii), 5, 7, 8, 11, 12; Acceptance Criteria 3, 5, 7, 8, 11, 12.
- **Sub-area:** Schema / argument validation — a route declares an argument with validation so a valid value is accepted (200) and an invalid value is rejected (400). Distinct from `rest-custom-endpoint`: the prompt centers the **validation/accept-reject** concept, not route registration.
- **Directory / `name`:** `rest-api-route-validation` (collision-free, matches `/^[a-z0-9-]+$/`).
- **Mechanism:** `register_rest_route( 'example/v1', '/color', [...] )` on `rest_api_init`, declaring a `filter` argument constrained to an enum (`red`/`green`/`blue`) and/or an explicit `validate_callback`. The doc's own worked example is the enum-string `filter` param. Core enforces `enum` membership even without a custom `validate_callback`, so either an `enum`, a `validate_callback`, or both yields the 200/400 behavior.
- **Options (which input contract to pin):**
  1. **Enum-string `filter`** (good `blue`, bad `purple`) — the page's literal example.
  2. Numeric-range param (good `5`, bad `abc`) — cleaner to read but NOT the doc's literal snippet (grounds only the mechanism).
- **Trade-offs:** Option 1 is the exact documented example → strongest grounding, removes any "did you invent this?" risk, and good/bad are trivially assertable on the anon channel. Option 2 reads slightly more naturally but is invented relative to the snippet. Both are defensible.
- **Decision:** Choose **Option 1** — enum-string `filter`, route `/wp-json/example/v1/color`, good value `blue` → 200, bad value `purple` → 400. The prompt describes the accept/reject behavior (validation concept) and pins the route path, the param name `filter`, and both values; it does NOT name `validate_callback`/`register_rest_route`/`enum` (tool-agnostic). The agent may implement via `enum`, `validate_callback`, or both.
- **Pinned literals (spec Req 8):** route `/wp-json/example/v1/color`, param `filter`, good `blue`, bad `purple`, statuses 200 and 400.
- **e2e flow (anon only):** `const ok = await page.request.get("/wp-json/example/v1/color?filter=blue"); expect(ok.status()).toBe(200);` and `const bad = await page.request.get("/wp-json/example/v1/color?filter=purple"); expect(bad.status()).toBe(400);`. No post seeding; `afterAll`: `deactivateAllPlugins()`.
- **acceptance (scenario-unique) — draft for phase 4:**
  1. A route at `example/v1/color` accepts a `filter` query argument.
  2. A request with `filter=blue` (an allowed value) succeeds with HTTP status 200.
  3. A request with `filter=purple` (a disallowed value) is rejected with HTTP status 400.
  4. The accepted set of values is constrained server-side (a value outside the allowed set is rejected before the handler runs).
- **Rationale:** The enum-string `filter` is the doc's own example, so acceptance points are directly grounded. Asserting observable 200/400 behavior (rather than a specific mechanism) keeps the prompt tool-agnostic and lets the agent satisfy it via the simplest valid path, while still centering the validation concept (Req 5). Grounding URL: https://developer.wordpress.org/rest-api/extending-the-rest-api/routes-and-endpoints/.

### Topic: Scenario 3 — `rest-api-permission-check` (authentication / permissions)

- **Spec link:** Requirements 2, 3 (sub-area iii), 5, 7, 8, 11, 12; Acceptance Criteria 3, 5, 7, 8, 11, 12.
- **Sub-area:** Authentication / permissions — a route gated by a `permission_callback` so an anonymous caller is denied (401) and an authenticated admin is allowed (gets the body). Distinct from `rest-custom-endpoint`: the prompt centers the **auth-gating** concept, not route registration.
- **Directory / `name`:** `rest-api-permission-check` (collision-free, matches `/^[a-z0-9-]+$/`).
- **Mechanism:** `register_rest_route( 'example/v1', '/private', [ 'permission_callback' => ... , 'callback' => fn() => rest_ensure_response('This is private data.') ] )` on `rest_api_init`. The `permission_callback` denies a logged-out caller. Per `rest_authorization_required_code()` (`return is_user_logged_in() ? 403 : 401;`), the **anonymous branch is 401** whether the plugin hardcodes `'status' => 401` (handbook example) or returns a bare `false`. So the anon `page.request.get` (no cookie) → 401 under either implementation.
- **Pinned literals (spec Req 8):** route `/wp-json/example/v1/private`, anon status **401** (not 403), success body string `"This is private data."`.
- **e2e flow:** anon `const denied = await page.request.get("/wp-json/example/v1/private"); expect(denied.status()).toBe(401);`. Authed `const body = await requestUtils.rest({ path: "/example/v1/private" }); expect(body).toBe("This is private data.");` — `requestUtils.rest` returns the parsed body and throws on non-2xx, so a returned matching body == success. `afterAll`: `deactivateAllPlugins()`.
- **acceptance (scenario-unique) — draft for phase 4:**
  1. A route at `example/v1/private` is gated by a permission check.
  2. An anonymous (logged-out) request to the route is denied with HTTP status 401.
  3. An authenticated administrator request to the route succeeds and returns the body `This is private data.`.
  4. The gate is enforced by the route's permission check (not by the main handler).
- **Decision:** Implement e2e as above. Pin 401 (not 403) in prompt, spec assertion, and acceptance per spec Req 8. Pin the success body string so the authed half asserts a specific value (stronger than bare no-throw). Grounding URL: https://developer.wordpress.org/rest-api/extending-the-rest-api/routes-and-endpoints/ (Permissions Callback section); 401-vs-403 grounded at https://developer.wordpress.org/reference/functions/rest_authorization_required_code/.
- **Rationale:** 401 for the logged-out case is doubly grounded (handbook example hardcodes it; core's `rest_authorization_required_code()` returns it for logged-out). Using the doc's literal success body `"This is private data."` gives a deterministic authed assertion. This is the first suite use of the authenticated `requestUtils.rest` channel — its behavior (returns body, no status, throws on non-2xx) was verified against the installed package.

### Topic: Catalog promotion plan (`_wp-dev-candidates.yaml`, REST API section)

- **Spec link:** Requirements 6, 12, 13, 14, 15; Acceptance Criteria 6, 12, 13, 14, 15.
- **Scope:** Only the `# === Area: REST API ===` section of `eval/scenarios/_wp-dev-candidates.yaml` changes (plus the one header line, below). The iAPI `_candidates.yaml` and every non-REST record are untouched.
- **Actions:**
  1. **Promote** `rest-api-custom-field-on-post` from stub to a **full record**: remove its `# TODO: prompt + acceptance` comment; add `prompt` and `acceptance` matching the shipped `scenario.yaml` verbatim; keep/extend `description`, `difficulty: simple`, `concepts`, `source: dev.wordpress.org`, `source_files` (the modifying-responses handbook + `register_rest_field` reference).
  2. **Add two brand-new full records** under an "Implemented REST API scenarios — full records" sub-header (mirroring the Block Editor pattern): `rest-api-route-validation` and `rest-api-permission-check`, each with `prompt`/`acceptance` verbatim from its `scenario.yaml`, plus `description`/`difficulty`/`concepts`/`source`/`source_files` (routes-and-endpoints handbook; the permission record additionally cites `rest_authorization_required_code`).
  3. **Annotate** `rest-api-authentication-nonce` as a **lighter stub**: replace its `# TODO` comment with a `# Deferred: <reason>` comment recording: intermediate difficulty; needs a JS toolchain; not cleanly REST-assertable; the server-side authentication sub-area is covered by the new `rest-api-permission-check` scenario; not yet implemented. Keep it a stub (no `prompt`/`acceptance`).
  4. **NO `_fields`/`_embed` stub** is created — global parameters need zero server-side registration, so there is no plugin code to author or grade; the exclusion is recorded solely in spec Out of Scope item 7, never as a catalog entry.
  5. **Fix the stale header line** (lines 28-29): "Full prompt + acceptance are included for the implemented Plugins and Block Editor scenarios…" → add ", and REST API" (e.g. "…Plugins, Block Editor, and REST API scenarios…"). This is the only header change.
- **Decision:** Three full REST records (1 promoted + 2 new), one annotated deferral stub, no new `_fields`/`_embed` stub, one header-line fix; `_candidates.yaml` and non-REST records untouched.
- **Rationale:** Mirrors the review-2 Block Editor catalog reconciliation precedent (full records 1:1 with implemented scenarios, lighter stubs with recorded reasons for deferrals). After the update, each implemented REST sub-area maps to exactly one full record under its final scenario name; no orphaned stub duplicates an implemented sub-area; no name mismatch.

### Topic: Components, interfaces, and data flow

- **Spec link:** Requirements 4, 7, 9, 16, 18; Acceptance Criteria 4, 7, 9, 16, 18.
- **New components:**
  - `eval/scenarios/rest-api-custom-field-on-post/` — `scenario.yaml` + `e2e.spec.mjs`.
  - `eval/scenarios/rest-api-route-validation/` — `scenario.yaml` + `e2e.spec.mjs`.
  - `eval/scenarios/rest-api-permission-check/` — `scenario.yaml` + `e2e.spec.mjs`.
  - `eval/scenarios/_wp-dev-candidates.yaml` — REST API section updated in place (per the catalog plan).
- **`scenario.yaml` interface (exactly the existing shape):** keys `name` (== dir name, `/^[a-z0-9-]+$/`), `description`, `skills: [wordpress-development]`, `prompt`, `acceptance`, `rubrics: []` (present as an array — required for discovery). NO catalog-only fields (`difficulty`/`concepts`/`source`/`source_files`) and NO source URLs in `scenario.yaml`.
- **`e2e.spec.mjs` interface (the `rest-custom-endpoint` lifecycle, verbatim):** imports `{ expect, test }` from `@wordpress/e2e-test-utils-playwright` and `{ deactivateAllPlugins }` from `../../utils/wp-cli.mjs`; `test.describe("<name> scenario", …)`; `beforeAll` → `deactivateAllPlugins()` + `requestUtils.activatePlugin(\`plugin-<name>-${workerInfo.project.metadata.agentId}\`)` (+ `createPost` for scenario 1); `afterAll` → `deactivateAllPlugins()` (+ `deleteAllPosts()` for scenario 1). No new helper added to `eval/utils/`.
- **Data flow:** `scenario.yaml` (discovery + judge input) → scaffold writes `plugin-<name>-<agentId>` → agent edits `index.php` (a `rest_api_init` registration) → judge grades against `acceptance` → `verify-e2e.ts` builds + boots `wp-env` → `e2e.spec.mjs` activates the plugin, (scenario 1 seeds a post), makes REST calls on the anon and/or authed channel, and asserts → Playwright JSON report → harness maps failures per (scenario, agent). The catalog file feeds nothing at runtime; it is a committed planning artifact.
- **Untouched-but-relevant (consumed, not modified):** `eval/utils/scaffold-plugin.ts` (slug `plugin-<name>-<agentId>`; throws if `name`/`agentId` ∉ `/^[a-z0-9-]+$/`); `eval/utils/verify-e2e.ts` (locates the spec at the flat path `eval/scenarios/<dir>/e2e.spec.mjs`); `eval/utils/wp-cli.mjs` (`deactivateAllPlugins`); `@wordpress/e2e-test-utils-playwright` (`test`, `expect`, `requestUtils` incl. `activatePlugin`/`createPost`/`deleteAllPosts`/`rest`); `@automattic/skillsmith` (flat discovery); `playwright.config.ts`. Plus the scaffolded plugin's `index.php` (hosts the `rest_api_init` registration — no block/theme artifact needed).
- **Decision:** No new dependency, no harness change, no new `eval/utils/` helper; three flat scenario dirs + the catalog edit.

### Topic: Dependencies

- **Spec link:** Requirements 16, 17, 18; Acceptance Criteria 16, 17, 18.
- **Decision / finding:** No new dependency is introduced. The scenarios reuse: internal `eval/utils/{scaffold-plugin.ts, verify-e2e.ts, wp-cli.mjs}`, `playwright.config.ts`, the `rest-custom-endpoint`/`post-meta-rest` reference patterns, and the existing `_wp-dev-candidates.yaml`; external `@automattic/skillsmith`, `@wordpress/e2e-test-utils-playwright` (v1.44.0 — `requestUtils.rest` verified present), `@wordpress/scripts`, `@wordpress/env`, Playwright. The plugin scaffold hosts PHP-only REST registrations in `index.php` (`rest_api_init`, `register_rest_route`, `register_rest_field`) — no theme/block artifact needed. The `wp-env` runtime fetches a recent WordPress, so all three APIs are present (none is newer than core long-standing support).
- **Rationale:** Each scenario is one PHP edit to a file the scaffold already provides; the only new channel use (`requestUtils.rest`) is an existing-package method, verified callable.

### Topic: Failure modes and observability

- **Spec link:** Requirements 7, 16; Acceptance Criteria 7, 16.
- **Decision / findings:**
  - **Scenario not discovered:** a dir not placed as a flat immediate child of `eval/scenarios/`, or missing `scenario.yaml`, is silently skipped by Skillsmith's non-recursive discovery. Mitigation: all three are flat `rest-api-*` dirs, each with a `scenario.yaml`.
  - **Malformed `scenario.yaml`:** Skillsmith's shape check requires `rubrics` present as an array; an omitted or valueless `rubrics:` (parsed `undefined`/`null`) silently fails discovery. Mitigation: each declares `rubrics: []`; `name`/`description`/`skills`/`prompt`/`acceptance` present and well-typed.
  - **Invalid `name`:** `scaffold-plugin.ts` throws if `name`/`agentId` ∉ `/^[a-z0-9-]+$/`. All three names conform (hyphens only).
  - **Wrong plugin slug in an e2e:** a spec must activate `plugin-<name>-${workerInfo.project.metadata.agentId}`; any other slug errors. Mitigation: derive the slug from `name` exactly as `rest-custom-endpoint` does.
  - **Spec import depth:** `../../utils/wp-cli.mjs` resolves only because the scenario dir is a flat immediate child — the same reason the flat `rest-api-*` layout is required (nesting would break collection).
  - **Authed channel semantics (`requestUtils.rest`):** it throws on non-2xx and exposes no `.status()`. The permission spec therefore asserts the authed half on the returned body (`toBe("This is private data.")`), NOT on a status number; asserting `.status()` on a `rest()` result would be a coding error to avoid in phase 4.
  - **Expected non-failure:** per the spec, a *failing grade against the current skill* is acceptable and is not a harness error. The bar (Acceptance Criterion 16) is that each scenario runs to a graded result and the e2e parses, resolves imports, and executes without harness/configuration errors.
- **Observability:** e2e failures surface through Playwright's JSON report (parsed by `verify-e2e.ts` into per-(scenario, agent) records); judge results through Skillsmith's grading output; `wp-env` start/stop and build steps log to stdout/stderr.

## Open Questions

- **Exact pinned literals are phase-4 confirmations, not blockers.** The design recommends and pins: scenario 1 → field `reading_time` = `"5 min"`; scenario 2 → route `/wp-json/example/v1/color`, param `filter`, good `blue`, bad `purple`; scenario 3 → route `/wp-json/example/v1/private`, anon 401, success body `"This is private data."`. Phase 4 may reword the user-voice prose but MUST keep prompt ↔ e2e assertion in lockstep (spec Req 8). If any literal is reworded, both the prompt and the spec assertion change together.
- **Whether to keep namespace `example/v1` for both route scenarios or differentiate per scenario.** Recommended: shared `example/v1` namespace with distinct routes (`color`, `private`) — readable and distinct from `rest-custom-endpoint`'s `myplugin/v1`. Phase 4 may pick different namespaces as long as each prompt pins its own full literal path. Not load-bearing.
- **Validation implementation latitude (recorded, intentional).** Because core auto-validates an `enum`, the agent may satisfy scenario 2 via `enum`, an explicit `validate_callback`, or both. The acceptance checks the observable 200/400 behavior, not the mechanism. This is a deliberate tool-agnostic choice, not an unresolved gap.

## Risks

- **Validation prompt could under-specify the concept (LOW).** Since `enum` alone yields 200/400, an agent might add the `enum` without engaging the broader validation idea. Mitigation: the prompt centers the accept/reject behavior and the acceptance checks server-side rejection of out-of-set values before the handler runs — still grounded in the doc's own `filter`/`enum` example, so this is acceptable and matches spec Req 5 (prompt centers the validation concept).
- **First use of the authed `requestUtils.rest` channel (LOW).** No existing spec uses `requestUtils.rest`; its behavior (returns body, no `.status()`, throws on non-2xx) was verified against installed v1.44.0. Phase 4 must assert on the body / no-throw, not on a status number. Flagged so the e2e author does not write `expect(...).toBe(200)` on a `rest()` result.
- **401 vs 403 for the anon case (LOW, resolved).** Spec Req 8 mandates 401 (not 403) for the logged-out case. Doubly grounded: the handbook example hardcodes `'status' => 401`, and core's `rest_authorization_required_code()` returns 401 for logged-out callers — so the anon `page.request.get` (no cookie) gets 401 regardless of which the agent uses. Pin 401 in prompt + spec + acceptance.
- **`get_callback` arg signature (LOW).** Scenario 1's `get_callback` should return a constant and ignore its args; an agent that tries to read a non-existent stored value could return `null`. The acceptance pins the exact value `5 min`, which steers toward a constant return. A failing grade against the current skill is acceptable per the spec.
- **Naming forward inconsistency (recorded, out of scope).** The new `rest-api-*` scenarios sit beside the non-prefixed existing scenarios (`taxonomy-register`, etc.) and the already-prefixed `block-editor-*` set. A suite-wide rename is out of scope; existing scenarios are NOT renamed (spec Req 18).
- **Catalog edits confined to the REST API section (correctness, must-hold).** Only REST records + the one header line may change; the iAPI `_candidates.yaml` and all non-REST records in `_wp-dev-candidates.yaml` must be byte-untouched (spec Req 15 / AC 15). Phase 4/5 must diff-check this.
- **Static/structural verification only (intentional).** No agent boots `wp-env` for a real pass, runs the full `scenarios × testing-agents` matrix, or generates plugin code; the skill is untouched (spec Req 16, 17). The bar is discoverable + e2e-collectable.
