# Design Doc: REST API scenarios

## Overview

The `wordpress-development` skill is evaluated by a Skillsmith-based suite under `eval/`. Prior reviews established a dated reference taxonomy of developer.wordpress.org, committed a candidate catalog at `eval/scenarios/_wp-dev-candidates.yaml`, and implemented scenarios for the Interactivity API, a v1 set (Hooks/Filters, Shortcodes, Custom Post Types, custom REST endpoints), the Plugins area, and the Block Editor area. The **REST API** area is still largely uncovered as a topic: the only REST-area scenario is v1's `rest-custom-endpoint`, which covers custom-endpoint *registration* (a public route via `register_rest_route`). The other major REST API sub-areas — modifying existing responses, schema/argument validation, and authentication/permissions — have no scenarios.

This review extends coverage to the **REST API** area with a small batch of three simple, documentation-grounded scenarios — roughly one per major uncovered sub-area — reusing (not rebuilding) the existing taxonomy and catalog. Each scenario is a single PHP edit to the scaffolded plugin's `index.php` (a registration on `rest_api_init`) plus an `e2e.spec.mjs` that follows the exact `rest-custom-endpoint` lifecycle. The catalog already carries two REST API stubs (`rest-api-custom-field-on-post`, `rest-api-authentication-nonce`); this review promotes one to a full record, adds two new full records, and annotates the other as deferred. As in prior reviews, the skill itself is not modified — the scenarios lead and the skill catches up in later work; verification is **static/structural only** (each scenario discoverable by Skillsmith, each `e2e.spec.mjs` loadable/collectable by the test runner), and scenarios are not required to pass against the current skill. The folders question is already resolved (review-2): real subdirectories are not low-risk, so the adopted convention is the `rest-api-*` pseudo-folder naming (area-prefixed flat scenario names), which this review simply applies.

The deliverables are: (1) **three REST API scenarios** — `rest-api-custom-field-on-post` (modifying responses), `rest-api-route-validation` (argument validation), and `rest-api-permission-check` (permission-gated route), each shipping an `e2e.spec.mjs`; and (2) a **catalog promotion + reconciliation** of the REST API section of `_wp-dev-candidates.yaml` (one stub promoted to full, two new full records, one stub annotated as deferred, one header-line fix). The existing scenarios, the scaffold, the harness, Skillsmith, the iAPI `_candidates.yaml`, and the skill are all untouched.

## Approach

The end-to-end mental model the implementer works from:

**Naming convention (the structural element).** All three new scenarios use the prefix `rest-api-<concept>` as their directory name, their `scenario.yaml` `name`, and their catalog record `name` — identical in all three places. This is the adopted "pseudo-folder" organization carried over from review-2: it visually clusters REST API scenarios when `eval/scenarios/` is listed and sorted, while every scenario remains a **flat immediate child** of `eval/scenarios/` whose name matches `/^[a-z0-9-]+$/`. No filesystem nesting is introduced, so Skillsmith discovery, the e2e lifecycle, the `verify-e2e.ts` spec-location/attribution logic, the test runner's collection, and the scaffold are all unchanged. The existing scenarios are NOT renamed. The folders question itself is not re-litigated here — review-2 already classified real subdirectories as not low-risk and adopted this convention; this review applies it.

**Scenarios (the implemented work).** Each scenario is a self-contained directory `eval/scenarios/<name>/` containing a `scenario.yaml` and an `e2e.spec.mjs` — exactly mirroring `eval/scenarios/rest-custom-endpoint/` and `eval/scenarios/post-meta-rest/`. The established runtime lifecycle is reused unchanged:

1. **Skillsmith discovers the scenario** by reading the immediate children of `eval/scenarios/` and loading each child's `scenario.yaml`. The directory name is the scenario's discovery identity; the `name` field inside the YAML is the plugin-slug fragment used downstream. For every scenario here, `name` equals the directory name.
2. **Skillsmith scaffolds a plugin** per (scenario, testing-agent) via `eval/utils/scaffold-plugin.ts`. The plugin slug is `plugin-<scenario.name>-<agentId>`. The scaffold provides an `index.php` (plugin header + hooks) that hosts all PHP — for this batch, the REST registration goes on the `rest_api_init` hook in `index.php`. No block or theme artifact is needed for any of these scenarios.
3. **The testing agent implements the requested feature** as a single REST registration in `index.php`: `register_rest_field` (modifying responses), or `register_rest_route` with an argument validation contract (validation), or `register_rest_route` with a `permission_callback` (permission). No second route per scenario, no JS toolchain, no enqueued/localized client script.
4. **An LLM judge grades the produced code** against the scenario's `acceptance` list. Every scenario declares `rubrics: []`, so only `acceptance` is used.
5. **The e2e harness (`eval/utils/verify-e2e.ts`) runs the test-runner spec** in a `wp-env` runtime: it boots `wp-env` with every produced plugin registered but deactivated, then runs each scenario's `e2e.spec.mjs`. The spec deactivates all plugins, activates exactly its own plugin, optionally seeds a published post, makes REST calls on the anonymous and/or authenticated channel, and asserts on the responses.

**The two REST verification channels (load-bearing).** The suite exposes two channels, used inline in the specs (no new helper is added to `eval/utils/`):

- **Anonymous** — `page.request.get(path)` carries no admin cookie and exposes both `.status()` (HTTP status) and `await resp.json()` (parsed body). Used today by `rest-custom-endpoint`, `cpt-register`, and `post-meta-rest`. All three new scenarios use it for their anonymous assertions.
- **Authenticated-as-admin** — `requestUtils.rest({ path })` returns the parsed JSON body, exposes **no** `.status()`, and **throws on a non-2xx response**. GET by default; the `path` resolves against the discovered REST root (pass `/<ns>/<route>`), and the nonce is auto-renewed. This channel is **not yet used by any existing spec** — the permission scenario is the suite's first use of it (verified callable against the installed `@wordpress/e2e-test-utils-playwright` v1.44.0). Because it exposes no status and throws on non-2xx, its half of an assertion must check the **returned body**, never a status number.

**Catalog.** The REST API section of `eval/scenarios/_wp-dev-candidates.yaml` is updated: `rest-api-custom-field-on-post` is promoted from stub to a full record; two new full records (`rest-api-route-validation`, `rest-api-permission-check`) are added under an "Implemented REST API scenarios — full records" sub-header mirroring the Block Editor pattern; `rest-api-authentication-nonce` stays a lighter stub with its `# TODO` replaced by a `# Deferred: <reason>` comment; and the stale header line is corrected. No `_fields`/`_embed` stub is created. The iAPI `_candidates.yaml` and all non-REST-API records are untouched.

**No change is made** to the scaffold, the e2e harness, the Skillsmith package, the skill, the existing scenarios, `eval/utils/`, or `_candidates.yaml`.

## The three REST API scenarios

The REST API area's concept-level sub-areas — custom-endpoint registration, modifying responses, schema/argument validation, and authentication/permissions — yield the candidate set. Custom-endpoint registration is excluded (already covered by v1's `rest-custom-endpoint`). The remaining three are each implemented as one simple scenario, all end-to-end verified. Batch size (3) is on the scale of prior reviews (v1 = 4, Plugins = 6, Block Editor = 5). Each scenario is fully specified below so phase 3/4 build it without re-deciding. Every literal an e2e asserts is pinned in that scenario's prompt, keeping prompt and assertion in lockstep.

### Sub-area selection

| Sub-area | Implemented? | e2e channel(s) | Single `index.php` edit? | Scenario |
|---|---|---|---|---|
| Custom-endpoint registration | NO — covered by `rest-custom-endpoint` | n/a | n/a | excluded |
| Modifying responses (top-level field) | YES | anon GET of seeded post resource | Yes — `register_rest_field` on `rest_api_init` | `rest-api-custom-field-on-post` |
| Schema / argument validation | YES | anon GET, good→200 / bad→400 | Yes — `register_rest_route` with an arg contract | `rest-api-route-validation` |
| Authentication / permissions | YES | anon GET→401 + authed `rest()` → body | Yes — `register_rest_route` with `permission_callback` | `rest-api-permission-check` |
| Global parameters (`_fields`/`_embed`) | NO — out of scope, no catalog entry | n/a | No server-side surface | excluded (Out-of-Scope only) |
| Nonce-from-JS authentication | NO — deferred, kept as lighter stub | n/a | needs JS toolchain | `rest-api-authentication-nonce` stub |

### Scenario 1 — `rest-api-custom-field-on-post` (modifying responses) — e2e

- **Sub-area:** Modifying responses — add a **top-level** field to an existing resource's REST response. The name is fixed by the existing catalog stub (`rest-api-custom-field-on-post`). **Distinct from `post-meta-rest`:** that scenario registers post meta surfaced under the resource's `.meta` object; this scenario adds a field at the **top level** of the resource JSON. The `register_rest_field` documentation page explicitly contrasts the two mechanisms (`register_rest_field` adds a top-level key; `register_meta` surfaces values under `.meta`), which is exactly the distinctness the spec calls out (Requirement 5 / Acceptance Criterion 5).
- **Source URL(s):** https://developer.wordpress.org/rest-api/extending-the-rest-api/modifying-responses/ and https://developer.wordpress.org/reference/functions/register_rest_field/
- **Mechanism:** Agent calls `register_rest_field( 'post', '<field>', [ 'get_callback' => ... ] )` on `rest_api_init`. The field appears at the **top level** of the post JSON (`body.<field>`), not under `.meta`. The `get_callback` returns a fixed string so the asserted value is deterministic and does not depend on stored data (returning a constant that ignores the callback args is valid and is the right call here).
- **Pinned literals (prompt ↔ assertion lockstep):** field name `reading_time`, value `"5 min"`, asserted on the posts resource `/wp-json/wp/v2/posts/<id>`.
- **e2e flow:**
  - `beforeAll`: `deactivateAllPlugins()`; `await requestUtils.activatePlugin(\`plugin-rest-api-custom-field-on-post-${workerInfo.project.metadata.agentId}\`)`; seed `const post = await requestUtils.createPost({ status: "publish" })`.
  - test: `const resp = await page.request.get("/wp-json/wp/v2/posts/" + post.id)`; assert `(await resp.json()).reading_time === "5 min"` (e.g. `expect((await resp.json()).reading_time).toBe("5 min")`).
  - `afterAll`: `deactivateAllPlugins()`; `await requestUtils.deleteAllPosts()`.
  - Anonymous readability of a published post is proven in-repo: `post-meta-rest` already seeds `requestUtils.createPost({ status: "publish" })` and does an anonymous `page.request.get` against `/wp-json/wp/v2/posts/<id>` reading the body with no auth (published posts are publicly readable by core design).
- **`acceptance` (scenario-unique, clean checks, no URLs) — draft for phase 4:**
  1. A new top-level field named `reading_time` is added to the post resource's REST response (not nested under the resource's meta).
  2. The field is registered for the post resource on the REST initialization hook.
  3. Reading a published post through the site's data API returns `reading_time` with the value `5 min`.
  4. The field is exposed on the existing post resource without registering a new route or post meta.

### Scenario 2 — `rest-api-route-validation` (schema / argument validation) — e2e

- **Sub-area:** Schema / argument validation — a route declares an argument with validation so a valid value is accepted (HTTP 200) and an invalid value is rejected (HTTP 400). **Distinct from `rest-custom-endpoint`:** the prompt centers the **validation / accept-reject** concept, not route registration.
- **Directory / `name`:** `rest-api-route-validation` (collision-free, matches `/^[a-z0-9-]+$/`).
- **Source URL(s):** https://developer.wordpress.org/rest-api/extending-the-rest-api/routes-and-endpoints/
- **Mechanism:** Agent calls `register_rest_route( 'example/v1', '/color', [...] )` on `rest_api_init`, declaring a `filter` argument constrained to the enum `red`/`green`/`blue` (and/or an explicit `validate_callback`). This is the documentation page's own worked example. On a non-member value the route returns `WP_Error( 'rest_invalid_param', ..., [ 'status' => 400 ] )` → HTTP 400; a valid member → HTTP 200. **Mechanism latitude (intentional):** core enforces `enum` membership even without a custom `validate_callback`, so an `enum`, a `validate_callback`, or both all yield the 200/400 behavior. The scenario therefore asserts the **observable accept/reject behavior**, not a specific mechanism, and the tool-agnostic prompt leaves the agent free to choose.
- **Pinned literals (prompt ↔ assertion lockstep):** route `/wp-json/example/v1/color`, param `filter`, good value `blue`, bad value `purple`, statuses `200` and `400`.
- **e2e flow (anonymous channel only — the cleanest of the three):**
  - `beforeAll`: `deactivateAllPlugins()`; `await requestUtils.activatePlugin(\`plugin-rest-api-route-validation-${workerInfo.project.metadata.agentId}\`)`. No post seeding.
  - test: `const ok = await page.request.get("/wp-json/example/v1/color?filter=blue"); expect(ok.status()).toBe(200);` and `const bad = await page.request.get("/wp-json/example/v1/color?filter=purple"); expect(bad.status()).toBe(400);`.
  - `afterAll`: `deactivateAllPlugins()`.
- **`acceptance` (scenario-unique) — draft for phase 4:**
  1. A route at `example/v1/color` accepts a `filter` query argument.
  2. A request with `filter=blue` (an allowed value) succeeds with HTTP status 200.
  3. A request with `filter=purple` (a disallowed value) is rejected with HTTP status 400.
  4. The accepted set of values is constrained server-side (a value outside the allowed set is rejected before the handler runs).

### Scenario 3 — `rest-api-permission-check` (authentication / permissions) — e2e

- **Sub-area:** Authentication / permissions — a route gated by a `permission_callback` so an anonymous caller is denied (HTTP 401) and an authenticated admin is allowed (gets the body). **Distinct from `rest-custom-endpoint`:** the prompt centers the **auth-gating** concept, not route registration.
- **Directory / `name`:** `rest-api-permission-check` (collision-free, matches `/^[a-z0-9-]+$/`).
- **Source URL(s):** https://developer.wordpress.org/rest-api/extending-the-rest-api/routes-and-endpoints/ (Permissions Callback section); 401-vs-403 grounded at https://developer.wordpress.org/reference/functions/rest_authorization_required_code/
- **Mechanism:** Agent calls `register_rest_route( 'example/v1', '/private', [ 'permission_callback' => ..., 'callback' => fn() => rest_ensure_response( 'This is private data.' ) ] )` on `rest_api_init`. The `permission_callback` denies a logged-out caller. **401, not 403, for the anonymous case (doubly grounded):** the handbook example hardcodes `[ 'status' => 401 ]` when the user lacks the capability, and core's `rest_authorization_required_code()` is literally `return is_user_logged_in() ? 403 : 401;`. So the anonymous `page.request.get` (no cookie → logged-out) gets **401** whether the plugin hardcodes `'status' => 401` or returns a bare `false`. This satisfies spec Requirement 8 / Acceptance Criterion 8 safely under either implementation style.
- **Pinned literals (prompt ↔ assertion lockstep):** route `/wp-json/example/v1/private`, anonymous status **401** (not 403), success body string `"This is private data."`.
- **e2e flow:**
  - `beforeAll`: `deactivateAllPlugins()`; `await requestUtils.activatePlugin(\`plugin-rest-api-permission-check-${workerInfo.project.metadata.agentId}\`)`. No post seeding.
  - anonymous half: `const denied = await page.request.get("/wp-json/example/v1/private"); expect(denied.status()).toBe(401);`.
  - authenticated half: `const body = await requestUtils.rest({ path: "/example/v1/private" }); expect(body).toBe("This is private data.");`. `requestUtils.rest` returns the parsed body (= the string) and throws on a non-2xx response, so a returned matching body **is** success. Assert the **body**, never a status — asserting `.status()` on a `rest()` result would be a coding error (there is no `.status()`).
  - `afterAll`: `deactivateAllPlugins()`.
- **`acceptance` (scenario-unique) — draft for phase 4:**
  1. A route at `example/v1/private` is gated by a permission check.
  2. An anonymous (logged-out) request to the route is denied with HTTP status 401.
  3. An authenticated administrator request to the route succeeds and returns the body `This is private data.`.
  4. The gate is enforced by the route's permission check (not by the main handler).

### Summary

| # | Scenario (= dir = `name`) | Sub-area | e2e channel(s) | Pinned literals |
|---|---|---|---|---|
| 1 | `rest-api-custom-field-on-post` | Modifying responses (top-level field) | anon GET of seeded post | field `reading_time`, value `5 min`, resource `/wp-json/wp/v2/posts/<id>` |
| 2 | `rest-api-route-validation` | Argument validation | anon GET: 200 / 400 | route `/wp-json/example/v1/color`, param `filter`, good `blue`, bad `purple`, statuses 200/400 |
| 3 | `rest-api-permission-check` | Permission-gated route | anon GET→401 + authed `rest()` → body | route `/wp-json/example/v1/private`, status 401, body `This is private data.` |

All three declare `rubrics: []`. Each is one `index.php` edit on `rest_api_init`, following the `rest-custom-endpoint` lifecycle, adding no new `eval/utils/` helper.

## Catalog promotion + reconciliation

The REST API section of `eval/scenarios/_wp-dev-candidates.yaml`, under `# === Area: REST API ===`, is updated as follows. The iAPI `_candidates.yaml` and every non-REST-API record (Themes, Plugins, Common APIs, Advanced Admin, Coding Standards, Playground, Code Reference, Block Editor, WP-CLI) are NOT modified.

### Actions

1. **Promote `rest-api-custom-field-on-post` from stub to full record.** Remove its `# TODO: prompt + acceptance` comment; add `prompt` and `acceptance` matching the shipped `scenario.yaml` **verbatim** (same text, same order, same quoting); keep/extend `description`, `difficulty: simple`, `concepts`, `source: dev.wordpress.org`, and `source_files` (the modifying-responses handbook + the `register_rest_field` reference).
2. **Add two brand-new full records** under an "Implemented REST API scenarios — full records" sub-header (mirroring the Block Editor pattern): `rest-api-route-validation` and `rest-api-permission-check`, each with `prompt`/`acceptance` verbatim from its shipped `scenario.yaml`, plus `description`/`difficulty`/`concepts`/`source`/`source_files`. Provenance: the routes-and-endpoints handbook for both; the permission record additionally cites `rest_authorization_required_code`.
3. **Annotate `rest-api-authentication-nonce` as a lighter stub.** Replace its `# TODO` comment with a `# Deferred: <reason>` comment recording: intermediate difficulty; needs a JS toolchain; not cleanly REST-assertable; the server-side authentication sub-area is covered by the new `rest-api-permission-check` scenario; not yet implemented. Keep it a stub (no `prompt`/`acceptance`).
4. **Create NO `_fields`/`_embed` stub.** Global parameters need zero server-side registration, so there is no plugin code to author or grade; the exclusion is recorded solely in the spec's Out of Scope section (item 7), never as a catalog entry. This sub-area has no catalog entry today and gets none.
5. **Fix the stale header line.** The catalog's header comment listing which areas have full prompt+acceptance ("…the implemented Plugins and Block Editor scenarios…") is updated to also list REST API (e.g. "…Plugins, Block Editor, and REST API scenarios…"). This is the only header change.

### Catalog state after the update

| Record `name` | Kind after update | Provenance (`source_files`) |
|---|---|---|
| `rest-api-custom-field-on-post` | full (promoted) | modifying-responses handbook + `register_rest_field` reference |
| `rest-api-route-validation` | full (new) | routes-and-endpoints handbook |
| `rest-api-permission-check` | full (new) | routes-and-endpoints handbook + `rest_authorization_required_code` |
| `rest-api-authentication-nonce` | lighter stub (`# Deferred: …`) | unchanged stub provenance |

After the update, every implemented REST API sub-area is represented by exactly one full record under its final scenario name; no orphaned stub duplicates an implemented sub-area; no name mismatch exists between any record and its scenario directory. This mirrors the review-2 Block Editor catalog reconciliation precedent (full records 1:1 with implemented scenarios, lighter stubs with recorded reasons for deferrals).

## Components

### New components (this review)

- `eval/scenarios/rest-api-custom-field-on-post/` — `scenario.yaml` + `e2e.spec.mjs` (e2e)
- `eval/scenarios/rest-api-route-validation/` — `scenario.yaml` + `e2e.spec.mjs` (e2e)
- `eval/scenarios/rest-api-permission-check/` — `scenario.yaml` + `e2e.spec.mjs` (e2e)
- `eval/scenarios/_wp-dev-candidates.yaml` — REST API section updated in place (1 stub promoted to full, 2 new full records, 1 stub annotated as deferred, 1 header-line fix).

All three directory names match `/^[a-z0-9-]+$/`, equal their `scenario.yaml` `name` and their catalog record `name`, are flat immediate children of `eval/scenarios/`, and were verified free of collision: an enumeration of `eval/scenarios/` found 24 existing scenario dirs plus `_candidates.yaml` and `_wp-dev-candidates.yaml`, with no `rest-api-*` directory present (existing dirs: admin-menu-page, async-fetch, block-editor-block-bindings, block-editor-block-filters, block-editor-block-styles, block-editor-block-supports, block-editor-dynamic-block, config-fetch, counter, cpt-register, cron-event, derived-double, filter-body-class, focus-trap-menu, fruit-list-each, i18n-textdomain, independent-counters, minimal-scaffold, paginated-list, post-meta-rest, rest-custom-endpoint, settings-register, shared-state, shortcode-with-attr, taxonomy-register, toggle-visibility).

### Untouched-but-relevant components (consumed, not modified)

- `eval/utils/scaffold-plugin.ts` — scaffolds the per-(scenario, agent) plugin. Fixed facts the scenarios depend on: slug `plugin-<scenario.name>-<agentId>`; `index.php` hosts the PHP (the REST registration goes on `rest_api_init`). Throws if `name` (or `agentId`) does not match `/^[a-z0-9-]+$/`. No block or theme artifact is needed for this batch.
- `eval/utils/verify-e2e.ts` — locates each ran scenario's spec at the flat path `eval/scenarios/<dirName>/e2e.spec.mjs` (assumes flat immediate child), boots `wp-env`, runs the specs, and maps failures back per (scenario, agent). The three new specs plug in by existing at the flat path.
- `eval/utils/wp-cli.mjs` — exports `deactivateAllPlugins()` (a wp-cli wrapper, `wp plugin deactivate --all --quiet`, not a fixture method), used by every spec's `beforeAll`/`afterAll`. Imported as `../../utils/wp-cli.mjs` — a two-level depth that resolves correctly only because the scenario directory is a flat immediate child. The three new specs reuse it identically. **No new helper is added here.**
- `@wordpress/e2e-test-utils-playwright` (v1.44.0) — provides `test`, `expect`, and the `requestUtils` / `page` fixtures: `requestUtils.activatePlugin`, `requestUtils.createPost`, `requestUtils.deleteAllPosts`, `requestUtils.rest`, and `page.request.get`. `requestUtils.rest` was verified present and callable in v1.44.0.
- `@automattic/skillsmith` — discovers scenarios by reading only the immediate children of `eval/scenarios/` (non-recursive); skips nested directories and leading-underscore / non-directory entries (which is why `_wp-dev-candidates.yaml` sits safely among real scenario dirs). NOT modified.
- `playwright.config.ts` — test-runner configuration (`testMatch` for `e2e.spec.mjs`, `testDir: eval/scenarios`).
- The scaffolded plugin's `index.php` — hosts the `rest_api_init` registration for all three scenarios. No block/theme artifact is touched.

### Explicitly NOT modified

- Any existing scenario directory (the existing scenarios are not moved, renamed, or reorganized).
- `eval/scenarios/_candidates.yaml` (the iAPI catalog).
- Non-REST-API records in `_wp-dev-candidates.yaml`.
- `eval/rubrics/` (no new shared rubric — each scenario carries `rubrics: []`).
- `eval/utils/` (no new REST helper).
- Anything under `skills/wordpress-development/`.

## Interfaces and Data Flow

### `scenario.yaml` schema (the existing shape, per `rest-custom-endpoint`)

```yaml
name: rest-api-route-validation     # matches /^[a-z0-9-]+$/, equals the directory name; plugin-slug fragment
description: <one line>
skills:
  - wordpress-development
prompt: |
  <user-voice, outcome-phrased; pins every e2e-asserted literal (route path, param,
   values, status, field name, body string) in backticks; does NOT name register_rest_field /
   register_rest_route / permission_callback / validate_callback / enum / any function>
acceptance:
  - <scenario-unique, clean, human-readable check; NO embedded source URL>
rubrics: []                          # explicit empty array — REQUIRED for discovery
```

**The `rubrics` key must be present as an explicit empty array (`rubrics: []`).** Skillsmith's discovery shape-check requires `rubrics` to be an array; an omitted key (`undefined`) or a valueless `rubrics:` (parsed as `null`) silently fails discovery and the scenario is never graded. The same check requires `name`, `description`, `skills`, `prompt`, and `acceptance` to be present and well-typed. **Catalog-only fields (`difficulty`, `concepts`, `source`, `source_files`) and source URLs never appear in a `scenario.yaml`** — provenance lives only in the catalog record.

`name` is the plugin-slug fragment; the scaffolded plugin slug is `plugin-<name>-<agentId>`, and the e2e spec must activate that exact slug. For all three scenarios `name` equals the directory name (e.g. `rest-api-route-validation` → slug `plugin-rest-api-route-validation-<agentId>`). Names contain hyphens only (no underscores), which is valid.

**Route-pinning convention (how a tool-agnostic prompt names a specific asserted path).** `rest-custom-endpoint` reconciles a user-voice prompt with a specific asserted route by **hard-pinning the full literal path in backticks** inside a user-voice sentence (e.g. "When someone sends a GET request to `/wp-json/myplugin/v1/hello`, they should get back a JSON response with a `message` field"), and its e2e asserts that exact literal. This names the **path** (an outcome the user wants) and the response **shape**, never the function `register_rest_route`. The two new route-based scenarios mirror this phrasing, pinning their own distinct literal paths under the `example/v1` namespace (`color`, `private`) — distinct from `rest-custom-endpoint`'s `myplugin/v1` to avoid cross-scenario confusion.

### `e2e.spec.mjs` interface (the `rest-custom-endpoint` lifecycle, verbatim)

```js
import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../utils/wp-cli.mjs";

test.describe("rest-api-<concept> scenario", () => {
  // scenario 1 only: let post;
  test.beforeAll(async ({ requestUtils }, workerInfo) => {
    deactivateAllPlugins();
    await requestUtils.activatePlugin(
      `plugin-rest-api-<concept>-${workerInfo.project.metadata.agentId}`,
    );
    // scenario 1 only: post = await requestUtils.createPost({ status: "publish" });
  });
  test.afterAll(async ({ requestUtils }) => {
    deactivateAllPlugins();
    // scenario 1 only: await requestUtils.deleteAllPosts();
  });
  test("<asserts the REST behavior>", async ({ page, requestUtils }) => {
    // scenario 1 (anon, modifying responses):
    //   const resp = await page.request.get("/wp-json/wp/v2/posts/" + post.id);
    //   expect((await resp.json()).reading_time).toBe("5 min");
    // scenario 2 (anon, validation):
    //   const ok  = await page.request.get("/wp-json/example/v1/color?filter=blue");
    //   expect(ok.status()).toBe(200);
    //   const bad = await page.request.get("/wp-json/example/v1/color?filter=purple");
    //   expect(bad.status()).toBe(400);
    // scenario 3 (anon + authed, permission):
    //   const denied = await page.request.get("/wp-json/example/v1/private");
    //   expect(denied.status()).toBe(401);
    //   const body = await requestUtils.rest({ path: "/example/v1/private" });
    //   expect(body).toBe("This is private data.");
  });
});
```

- `page` and `requestUtils` are injected fixtures (destructured from the test args); there is no local import for them. `agentId` is read from `workerInfo.project.metadata.agentId` (the second arg of the `beforeAll` callback).
- The `../../utils/wp-cli.mjs` import (two-level depth) resolves correctly precisely because the scenario directory is a flat immediate child of `eval/scenarios/`.
- **Anonymous** assertions use `page.request.get(path)` and read `.status()` and/or `await resp.json()`. **Authenticated** assertions use `requestUtils.rest({ path })` and read the **returned body** only — it exposes no `.status()` and throws on non-2xx.

### Catalog record shape (REST API area, in `_wp-dev-candidates.yaml`)

```yaml
- name: rest-api-route-validation            # == directory name == scenario.yaml name
  description: <one line>
  difficulty: simple
  concepts: [rest-api, route-arguments, validation]
  source: dev.wordpress.org
  source_files:
    - https://developer.wordpress.org/rest-api/extending-the-rest-api/routes-and-endpoints/
  prompt: |
    <exact same text as the shipped scenario.yaml prompt>
  acceptance:
    - <exact same items as the shipped scenario.yaml acceptance>
```

The `rest-api-authentication-nonce` deferral stub carries the lighter shape (no `prompt`/`acceptance`) plus the `# Deferred: <reason>` comment, mirroring the review-2 stub pattern.

### Data flow

`scenario.yaml` (discovery + judge input) → scaffold writes plugin `plugin-<name>-<agentId>` → testing agent edits `index.php` (a `rest_api_init` registration) → judge grades code against `acceptance` → `verify-e2e.ts` boots `wp-env` → `e2e.spec.mjs` activates the plugin, (scenario 1 seeds and later deletes a published post), makes REST calls on the anonymous and/or authenticated channel, and asserts → the test-runner JSON report → harness maps failures back per (scenario, agent). The catalog file feeds nothing in this flow; it is a committed planning artifact read by humans and future reviews.

## Key Decisions

### Decision: Implement three e2e scenarios, one per major uncovered REST API sub-area; exclude custom-endpoint registration

- **Choice:** Implement `rest-api-custom-field-on-post` (modifying responses), `rest-api-route-validation` (argument validation), and `rest-api-permission-check` (permission-gated route), each a single `index.php` edit on `rest_api_init` shipping an `e2e.spec.mjs`. Exclude custom-endpoint registration (covered by `rest-custom-endpoint`).
- **Alternatives:** Implement every candidate sub-area (would pull in global parameters and nonce-from-JS, neither cleanly authorable/gradable as a simple `index.php` edit); add an optional fourth schema scenario (overlaps the validation scenario and is more abstract).
- **Trade-offs:** Three is on the scale of prior reviews (v1 = 4, Plugins = 6, Block Editor = 5) and covers the implementable uncovered sub-areas. Each new scenario's prompt centers its own concept (modifying responses / validation / auth-gating), keeping all three distinct from `rest-custom-endpoint`'s registration concept. Global parameters and nonce-from-JS are excluded with recorded reasons so phase 4 does not re-litigate.
- **Traces to:** Requirements 1, 2, 3, 4, 5; Acceptance Criteria 1, 2, 3, 4, 5.

### Decision: Reuse the `rest-custom-endpoint` e2e lifecycle verbatim; add no new `eval/utils/` helper

- **Choice:** Every spec imports `{ expect, test }` from `@wordpress/e2e-test-utils-playwright` and `{ deactivateAllPlugins }` from `../../utils/wp-cli.mjs`; `deactivateAllPlugins()` + `requestUtils.activatePlugin(plugin-<name>-${agentId})` in `beforeAll`; `deactivateAllPlugins()` in `afterAll`. Assertions are inline; no REST helper is added to `eval/utils/`.
- **Alternatives:** Add a shared REST helper to `eval/utils/` for the request/assert boilerplate.
- **Trade-offs:** The lifecycle is fixed by the existing suite; reusing it verbatim keeps each scenario well-formed and e2e-collectable with zero harness change. A shared helper would be a new component for three short inline assertions and is unnecessary; the spec explicitly says no new REST helper is added.
- **Traces to:** Requirements 4, 7, 16, 18; Acceptance Criteria 4, 7, 16, 18.

### Decision: Modifying-responses scenario adds a top-level field via `register_rest_field` (distinct from `post-meta-rest`)

- **Choice:** Add a **top-level** field `reading_time` = `"5 min"` to the post resource via `register_rest_field( 'post', ... )` with a constant `get_callback`. Seed a published post, anonymously GET `/wp-json/wp/v2/posts/<id>`, assert `body.reading_time === "5 min"`; clean up with `deleteAllPosts()`.
- **Alternatives:** Surface a value under the resource's `.meta` object (this is `post-meta-rest`, already covered — would duplicate a covered sub-area); have `get_callback` compute from stored data (non-deterministic for the e2e).
- **Trade-offs:** A top-level field is the canonical "modifying responses" mechanism, and the documentation page itself contrasts it with the `.meta` mechanism, giving a clean distinctness story versus `post-meta-rest` (Requirement 5). A constant `get_callback` makes the assertion deterministic. Anonymous GET of a published post is already proven by `post-meta-rest`.
- **Traces to:** Requirements 2, 3 (sub-area i), 5, 7, 8; Acceptance Criteria 3, 5, 7, 8.

### Decision: Validation scenario uses the enum-string `filter` example and asserts behavior, not mechanism

- **Choice:** Route `/wp-json/example/v1/color` with a `filter` argument constrained to `red`/`green`/`blue`; anonymously GET `?filter=blue` → 200 and `?filter=purple` → 400. The prompt describes the accept/reject behavior and pins the route, the param `filter`, both values, and both statuses; it does not name `enum` / `validate_callback` / `register_rest_route`. The agent may implement via `enum`, a `validate_callback`, or both.
- **Alternatives:** A numeric-range param (good `5`, bad `abc`) — reads slightly more naturally but is invented relative to the documentation snippet; pinning a specific mechanism in the prompt — would break tool-agnosticism.
- **Trade-offs:** The enum-string `filter` is the documentation page's own worked example → strongest grounding and removes any "did you invent this?" risk; good/bad are trivially assertable on the anonymous channel. Because core auto-validates an `enum` even without a custom `validate_callback`, asserting the observable 200/400 behavior (not a mechanism) keeps the prompt tool-agnostic while still centering the validation concept (Requirement 5). The risk that an agent adds a bare `enum` without engaging the broader validation idea is accepted: the acceptance checks server-side rejection of out-of-set values before the handler runs, and the behavior is still doc-grounded.
- **Traces to:** Requirements 2, 3 (sub-area ii), 5, 7, 8; Acceptance Criteria 3, 5, 7, 8.

### Decision: Permission scenario pins 401 (not 403) for the anonymous case and asserts the authed body (not a status)

- **Choice:** Route `/wp-json/example/v1/private` gated by a `permission_callback`. Anonymous `page.request.get` → **401**; authenticated `requestUtils.rest({ path: "/example/v1/private" })` → assert the returned body equals `"This is private data."`. 401 is pinned in the prompt, the spec assertion, and the acceptance alike.
- **Alternatives:** Pin 403 for the anonymous case (wrong: core returns 401 for logged-out callers); assert `.toBe(200)` on the `rest()` result (impossible: `rest()` exposes no `.status()`); assert only the absence of a throw (weaker than asserting a specific body value).
- **Trade-offs:** 401 for the logged-out case is doubly grounded — the handbook example hardcodes `'status' => 401`, and core's `rest_authorization_required_code()` returns 401 for logged-out callers — so the anonymous request gets 401 under either implementation style, satisfying spec Requirement 8. The authenticated channel (`requestUtils.rest`) returns the parsed body and throws on non-2xx, so asserting the **body** equals the documentation's literal success string is both correct and stronger than a bare no-throw, while still satisfying "expected body returned without throwing." This is the suite's first use of the authenticated channel; its behavior was verified against installed v1.44.0, and phase 4 must assert on the body, never a status number.
- **Traces to:** Requirements 2, 3 (sub-area iii), 5, 7, 8; Acceptance Criteria 3, 5, 7, 8.

### Decision: Pin every e2e-asserted literal in the prompt; keep prompts tool-agnostic; provenance only in the catalog

- **Choice:** Each field name, route path, param, value, status code, and response string an `e2e.spec.mjs` asserts is stated in that scenario's `prompt` (route paths in backticks per the `rest-custom-endpoint` convention). Prompts are user-voice and never name the tool/API/function. `acceptance` strings are clean checks with no embedded URLs. Source URLs live only in the catalog record's `source_files`.
- **Alternatives:** Embed source URLs in the `scenario.yaml`; name the API/function in the prompt; let the agent choose the asserted identifiers.
- **Trade-offs:** The spec bars catalog-only fields and URLs from `scenario.yaml` and requires tool-agnostic prompts; pinning the asserted literal keeps the e2e deterministic without naming the mechanism, and keeping prompt and assertion in lockstep means any phase-4 rewording must change both together.
- **Traces to:** Requirements 8, 9, 12; Acceptance Criteria 8, 9, 12.

### Decision: Add zero new shared rubrics; every scenario declares `rubrics: []`

- **Choice:** Add no files under `eval/rubrics/`; each scenario carries its checks in `acceptance` and declares the explicit empty array `rubrics: []`.
- **Alternatives:** A shared "registers on `rest_api_init`" rubric across the batch.
- **Trade-offs:** No single check recurs uniformly across all three in a form general enough to share without duplicating per-scenario acceptance points (which the spec forbids): the registered surface differs per scenario (a field vs a validated route vs a gated route). The spec permits zero rubrics when no genuinely cross-cutting check emerges; this mirrors the v1 / Plugins / Block Editor outcome. The `rubrics:` key is always present as an array (required for discovery).
- **Traces to:** Requirement 10; Acceptance Criterion 10.

### Decision: Apply `rest-api-*` pseudo-folder naming; do not re-litigate the folders question

- **Choice:** All three new scenarios use the `rest-api-<concept>` prefix as flat immediate children (directory name == `scenario.yaml` `name` == catalog record `name`). Existing scenarios are not renamed.
- **Alternatives:** Real subdirectories (`eval/scenarios/rest-api/<name>/`); stay flat with no prefix.
- **Trade-offs:** Review-2 already classified real subdirectories as not low-risk (they require an uncommittable change to Skillsmith's non-recursive discovery in gitignored `node_modules`, plus fixing the `../../utils` import depth and `verify-e2e.ts` attribution) and adopted the pseudo-folder convention; this review simply applies it. The prefix delivers visual grouping at zero harness risk, every scenario remaining a flat immediate child whose name matches `/^[a-z0-9-]+$/`. The forward inconsistency (prefixed REST scenarios beside non-prefixed older scenarios) is accepted and out of scope.
- **Traces to:** Requirements 9, 11, 18; Acceptance Criteria 9, 11, 18.

### Decision: Promote one stub to full, add two full records, annotate one stub as deferred; confine all edits to the REST API section

- **Choice:** Promote `rest-api-custom-field-on-post` to a full record (drop `# TODO`); add `rest-api-route-validation` and `rest-api-permission-check` full records under an "Implemented REST API scenarios — full records" sub-header; replace the `rest-api-authentication-nonce` `# TODO` with a `# Deferred: <reason>` comment; create no `_fields`/`_embed` stub; fix the one stale header line. `_candidates.yaml` and non-REST records are byte-untouched.
- **Alternatives:** Promote-and-rename the nonce stub into an implemented scenario name (it covers a different, deferred sub-area — would create a name mismatch or false duplication); add an `_fields`/`_embed` stub (no server-side surface to author or grade — the spec excludes it from the catalog entirely); edit other catalog areas (out of scope).
- **Trade-offs:** Mirrors the review-2 Block Editor reconciliation precedent: full records 1:1 with implemented scenarios, lighter stubs with recorded reasons for deferrals. After the update each implemented REST sub-area maps to exactly one full record under its final scenario name; no orphaned stub duplicates an implemented sub-area; no name mismatch. The server-side authentication sub-area is covered by the new permission scenario, which is the recorded defer reason for the nonce stub. Confining edits to the REST API section keeps the iAPI catalog and all other areas intact — a correctness invariant phase 4/5 must diff-check.
- **Traces to:** Requirements 6, 12, 13, 14, 15; Acceptance Criteria 6, 12, 13, 14, 15.

### Decision: Static / structural verification only; scenarios not required to pass; skill untouched

- **Choice:** Verify the three scenarios are Skillsmith-discoverable (scenario-shape check) and the three e2e specs are test-runner-collectable (parse + imports resolve) such that running Skillsmith on a scenario directory would execute to a graded result without harness/configuration errors. Do not boot `wp-env` for a real pass, run the full `scenarios × testing-agents` matrix, or generate plugin code. Modify nothing under `skills/wordpress-development/`.
- **Alternatives:** Run the scenarios against the current skill and require passing grades.
- **Trade-offs:** The scenarios lead and the skill catches up later; a failing grade against the current skill is acceptable per the spec. The bar is well-formedness / runnability, matching prior reviews.
- **Traces to:** Requirements 16, 17, 18; Acceptance Criteria 16, 17, 18.

## Dependencies

All dependencies already exist in the repo; this review introduces **no new** dependency and adds **no new** `eval/utils/` helper.

- **Internal:** `eval/utils/scaffold-plugin.ts`, `eval/utils/verify-e2e.ts`, `eval/utils/wp-cli.mjs` (`deactivateAllPlugins`), `playwright.config.ts`, the `eval/scenarios/rest-custom-endpoint/` (REST e2e lifecycle) and `eval/scenarios/post-meta-rest/` (post-seed + anon GET precedent) reference patterns, and the existing `eval/scenarios/_wp-dev-candidates.yaml` (catalog precedent shape; REST API section edited, rest untouched).
- **External (already present):** `@automattic/skillsmith` (discovery, scaffold orchestration, judge); `@wordpress/e2e-test-utils-playwright` v1.44.0 (`test`, `expect`, `requestUtils` incl. `activatePlugin`/`createPost`/`deleteAllPosts`/`rest`, and `page.request.get` — `requestUtils.rest` verified present and callable); `@wordpress/scripts`; `@wordpress/env` (`wp-env` runtime); the test runner (Playwright).
- **Runtime version note (not a new dependency):** the scaffolded plugin hosts PHP-only REST registrations in `index.php` (`rest_api_init`, `register_rest_route`, `register_rest_field`, `permission_callback`); all are long-standing core APIs, and `rest_authorization_required_code()` is core. `wp-env` fetches a recent WordPress at env-start, so every API used is present. No theme/block artifact is needed.
- **Documentation (selection/acceptance grounding, not a runtime dependency):** the developer.wordpress.org pages cited per scenario and in the catalog `source_files` (modifying-responses + `register_rest_field` reference; routes-and-endpoints handbook; `rest_authorization_required_code` reference).

## Failure Modes and Observability

- **Scenario not discovered:** a directory not placed as a flat immediate child of `eval/scenarios/`, or missing `scenario.yaml`, is silently skipped by Skillsmith's non-recursive discovery. Mitigation: all three use the flat `rest-api-*` layout, each with a `scenario.yaml`.
- **Malformed `scenario.yaml`:** Skillsmith's shape check requires `rubrics` present as an array; an omitted key (`undefined`) or a valueless `rubrics:` (`null`) silently fails discovery and the scenario is never graded. Mitigation: every scenario declares `rubrics: []` explicitly; `name`/`description`/`skills`/`prompt`/`acceptance` are all present and well-typed.
- **Invalid `name`:** `scaffold-plugin.ts` throws if `name` (or `agentId`) does not match `/^[a-z0-9-]+$/`. All three `rest-api-*` names conform (hyphens only, no underscores).
- **Wrong plugin slug in an e2e:** a spec must activate `plugin-<scenario.name>-${workerInfo.project.metadata.agentId}`; activating any other slug errors. Mitigation: each spec derives the slug from `name` (== directory name) exactly as `rest-custom-endpoint` does.
- **Spec import depth:** `../../utils/wp-cli.mjs` resolves only because the scenario directory is a flat immediate child — the same reason the flat `rest-api-*` layout is required (nesting would resolve `../../utils` to a nonexistent path and break collection).
- **Authed-channel misuse (first use of `requestUtils.rest`):** `requestUtils.rest` exposes no `.status()` and throws on a non-2xx response. The permission spec must assert the authenticated half on the **returned body** (`toBe("This is private data.")`), not a status number; writing `expect(...).toBe(200)` on a `rest()` result would be a coding error. Flagged for phase 4. A non-2xx authenticated response surfaces as a thrown value (test failure), not a status assertion.
- **Validation-mechanism latitude:** because core auto-validates an `enum`, an agent may add the `enum` without a custom `validate_callback`. The acceptance checks the observable 200/400 behavior (server-side rejection before the handler runs), not a specific mechanism — an intentional tool-agnostic choice, not a gap.
- **`get_callback` returns a non-constant:** scenario 1's `get_callback` should return the constant `"5 min"` and ignore its args; an agent reading a non-existent stored value could return `null` and fail the assertion. The acceptance pins the exact value, steering toward a constant return. A failing grade against the current skill is acceptable per the spec.
- **Expected non-failure:** per the spec, a *failing grade against the current skill* is acceptable and is not a harness error. The bar (Acceptance Criterion 16) is that each scenario runs to a graded result and its e2e parses, resolves imports, and executes without harness/configuration errors.
- **Catalog edits confined to the REST API section (correctness invariant):** only REST records and the one header line may change; the iAPI `_candidates.yaml` and all non-REST records in `_wp-dev-candidates.yaml` must be byte-untouched. Phase 4/5 must diff-check this.
- **Observability:** e2e failures surface through the test runner's JSON report, which `verify-e2e.ts` parses into per-(scenario, agent) failure records; judge results surface through Skillsmith's grading output; `wp-env` start/stop and build steps log to stdout/stderr.

## Risks and Open Questions

- **Exact pinned literals are phase-4 confirmations, not blockers.** The design recommends and pins: scenario 1 → field `reading_time` = `"5 min"`; scenario 2 → route `/wp-json/example/v1/color`, param `filter`, good `blue`, bad `purple`, statuses 200/400; scenario 3 → route `/wp-json/example/v1/private`, anonymous 401, success body `"This is private data."`. Phase 4 may reword the user-voice prose but MUST keep the prompt and the e2e assertion in lockstep (Requirement 8): if any literal is reworded, both the prompt and the spec assertion change together.
- **Namespace choice for the two route scenarios (phase-4 latitude, NOT blocking).** Recommended: a shared `example/v1` namespace with distinct routes (`color`, `private`) — readable and distinct from `rest-custom-endpoint`'s `myplugin/v1`. Phase 4 may pick different namespaces as long as each prompt pins its own full literal path. Not load-bearing.
- **Validation prompt could under-specify the concept (LOW).** Since `enum` alone yields 200/400, an agent might add the `enum` without engaging the broader validation idea. Mitigation: the prompt centers the accept/reject behavior and the acceptance checks server-side rejection of out-of-set values before the handler runs — still grounded in the documentation's own `filter`/`enum` example, matching Requirement 5 (the prompt centers the validation concept).
- **First use of the authenticated `requestUtils.rest` channel (LOW).** No existing spec uses `requestUtils.rest`; its behavior (returns body, no `.status()`, throws on non-2xx) was verified against installed v1.44.0. Phase 4 must assert on the body / no-throw, not on a status number. Flagged so the e2e author does not write `expect(...).toBe(200)` on a `rest()` result.
- **401 vs 403 for the anonymous case (LOW, resolved).** Requirement 8 mandates 401 (not 403) for the logged-out case. Doubly grounded: the handbook example hardcodes `'status' => 401`, and core's `rest_authorization_required_code()` returns 401 for logged-out callers — so the anonymous `page.request.get` (no cookie) gets 401 regardless of which the agent uses. Pin 401 in prompt + spec + acceptance.
- **`get_callback` arg signature (LOW).** Scenario 1's `get_callback` should return a constant and ignore its args; an agent that tries to read a non-existent stored value could return `null`. The acceptance pins the exact value `5 min`, steering toward a constant return. A failing grade against the current skill is acceptable per the spec.
- **Catalog edits confined to the REST API section (correctness, must-hold).** Only REST records + the one header line may change; the iAPI `_candidates.yaml` and all non-REST records in `_wp-dev-candidates.yaml` must be byte-untouched (Requirement 15 / Acceptance Criterion 15). Phase 4/5 must diff-check this.
- **Naming forward inconsistency (recorded, out of scope).** The new `rest-api-*` scenarios sit beside the non-prefixed existing scenarios (`taxonomy-register`, etc.) and the already-prefixed `block-editor-*` set. A suite-wide rename is out of scope; existing scenarios are NOT renamed (Requirement 18).
- **Static / structural verification only (intentional).** No agent boots `wp-env` for a real pass, runs the full `scenarios × testing-agents` matrix, or generates plugin code; the skill is untouched (Requirements 16, 17). The bar is discoverable + e2e-collectable.
