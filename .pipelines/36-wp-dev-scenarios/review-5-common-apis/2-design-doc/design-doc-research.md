# Design Research: Common APIs scenarios

## Research

### Existing e2e lifecycle (established suite precedent)

Two assertion shapes are both proven in the existing suite:

1. **`page.goto(url)` + DOM assert** — `filter-body-class/e2e.spec.mjs`: navigates to `/`, asserts `page.locator("body").toHaveClass(/my-custom-class/)`. Used for front-end DOM surface.
2. **`page.request.get(url)` + status + body** — `cpt-register/e2e.spec.mjs`, `rest-api-route-validation/e2e.spec.mjs`, `rest-api-permission-check/e2e.spec.mjs`, `rest-custom-endpoint/e2e.spec.mjs`: assert HTTP status codes and/or body content via `page.request.get(...)`. Used for data/API surface.

All specs share the same lifecycle skeleton (confirmed by direct file reads):
- Import `{ expect, test }` from `@wordpress/e2e-test-utils-playwright`
- Import `{ deactivateAllPlugins }` from `../../utils/wp-cli.mjs`
- `beforeAll(async ({ requestUtils }, workerInfo) => { deactivateAllPlugins(); await requestUtils.activatePlugin(\`plugin-<name>-${workerInfo.project.metadata.agentId}\`); })` — `agentId` read as `workerInfo.project.metadata.agentId` (second arg to `beforeAll`)
- `afterAll(() => { deactivateAllPlugins(); })` — sync, no `async`, no `await`
- `deactivateAllPlugins()` is always called **sync** (no `await`) in both `beforeAll` and `afterAll`
- The `../../utils/wp-cli.mjs` import depth resolves correctly because scenario directories are flat immediate children of `eval/scenarios/`

Sources: `eval/scenarios/filter-body-class/e2e.spec.mjs`, `eval/scenarios/themes-enqueue-assets/e2e.spec.mjs`, `eval/scenarios/cpt-register/e2e.spec.mjs`, `eval/scenarios/rest-api-route-validation/e2e.spec.mjs`, `eval/scenarios/rest-api-permission-check/e2e.spec.mjs`.

### Rewrite API: WordPress behavior and flush mechanism

- `add_rewrite_rule` registers a custom URL pattern. The pattern needs `flush_rewrite_rules()` once to take effect (written to DB/`.htaccess`).
- Pretty permalinks are ON by default in `@wordpress/env` ≥ 11.0.0 (pinned `^11.4.0` in `package.json`). No harness change needed.
- Flush-on-activation pattern: register rule on `init` hook + call `flush_rewrite_rules()` from `register_activation_hook`. Since `requestUtils.activatePlugin` fires the activation hook, the URL is live when the test first navigates to it.

**Critical routing subtlety:** A custom rewrite rule mapping to a custom query var (e.g. `index.php?my_endpoint=1`) produces a **404 by default** unless:
1. The query var is registered via the `query_vars` filter (or `add_rewrite_tag`). WordPress only exposes public query vars; an unregistered var is stripped from the query, leaving no post found → WP sets `is_404()` and sends a 404 header.
2. The plugin hooks `template_redirect` to detect the query var (via `get_query_var()`), call `status_header(200)`, echo a deterministic body string, and `exit`.

Without the `template_redirect` handler, WordPress renders a themed 404 page (or a 200 home page depending on timing/flush). With the handler, the response body is entirely the plugin's output — theme-independent and deterministic.

The full single-`index.php` plugin edit is:
- `init` callback: `add_rewrite_rule(...)` + `add_filter('query_vars', ...)` or `add_rewrite_tag()` to register the custom var.
- `template_redirect` callback: `get_query_var()` check, `status_header(200)`, `echo $pinned_token`, `exit`.
- `register_activation_hook`: `flush_rewrite_rules()`.

The body-token assertion is the **primary success signal** (only present if rule matched + handler ran). Status 200 is secondary defense-in-depth.

Sources: https://developer.wordpress.org/apis/rewrite/ (live; lists `add_rewrite_rule`, `flush_rewrite_rules`; notes "one-time use of flush_rules() to take effect"), https://developer.wordpress.org/reference/functions/add_rewrite_rule/ (live; shows `query_vars` filter pattern), https://developer.wordpress.org/reference/functions/get_query_var/ (live; "only retrieves public query variables ... must add them via query_vars filter"), https://developer.wordpress.org/reference/functions/template_redirect/ (live; "executes just before WordPress determines which template page to load" — correct moment to emit+exit).

### Options API: add_option / get_option / update_option vs register_setting

- Grounding doc: https://developer.wordpress.org/apis/options/ — live, title "Options", documents `add_option`, `update_option`, `get_option`, `delete_option`.
- Secondary: https://developer.wordpress.org/reference/functions/get_option/ — live, function reference.
- **Distinct from `settings-register`:** The Settings API (`register_setting`) registers a setting's schema for admin/REST management and never reads or writes the value. The Options API (`add_option`/`update_option`/`get_option`) imperatively stores and retrieves values. Different handbook chapters, zero function overlap — exactly the distinction Spec Requirement A.3 establishes.
- No front-end observable surface — judge-only (graded against produced PHP).
- Existing stub `options-api-store-retrieve` at catalog line 376 — to be renamed+promoted to `common-apis-options`.

### Transients API: set_transient / get_transient

- Grounding doc: https://developer.wordpress.org/apis/transients/ — live, title "Transients", documents `set_transient($key, $value, $expiration)` / `get_transient($key)`.
- Secondary: https://developer.wordpress.org/reference/functions/set_transient/ — live, function reference.
- **Reframe required:** The canonical doc example is a standalone WP_Query cache with `12 * HOUR_IN_SECONDS` — NOT coupled to an HTTP call. The legacy stub `transient-cache-remote-data` over-coupled caching with remote data. Spec Requirement E.15 explicitly requires reframing to a standalone cache-with-expiry concept, decoupled from any HTTP call.
- No front-end observable surface — judge-only.
- Existing stub `transient-cache-remote-data` at catalog line 366 — to be renamed+promoted to `common-apis-transients`.

### HTTP API: wp_remote_get + is_wp_error pattern

- Grounding doc primary: https://developer.wordpress.org/apis/making-http-requests/ — live, title "Making HTTP requests", documents `wp_remote_get`, `wp_remote_post`, `wp_remote_retrieve_body`.
- Secondary: https://developer.wordpress.org/reference/functions/wp_remote_get/ — live, documents return type "array|WP_Error ... or WP_Error on failure". **The overview page does NOT show `is_wp_error()` handling** — this secondary citation is required to ground the error-handling acceptance point.
- The Plugins area stub `http-api-remote-get` (catalog line 334) cites `/plugins/http-api/` — this stays untouched per Spec Requirement E.16.
- The Common APIs HTTP record is a brand-new record grounded to `/apis/making-http-requests/`.
- Acceptance grades the PHP pattern **statically** (no live call): makes the request, checks `is_wp_error()` before using the response, reads body with `wp_remote_retrieve_body()`.
- Judge-only.

### Catalog mechanics (existing structure)

- Header comment at lines 28-29 (current): "…the implemented Plugins, Block Editor, REST API, and Themes scenarios…" — must add "Common APIs".
- `# === Area: Common APIs ===` header at line 364 in current catalog.
- Two existing stubs: `transient-cache-remote-data` (line 366) and `options-api-store-retrieve` (line 376).
- `# Implemented <Area> scenarios — full records` sub-header precedent: Themes (line 168), Block Editor (line 52).
- Full record fields in catalog (confirmed from Themes/Block Editor examples): `name`, `description`, `difficulty`, `concepts`, `source`, `source_files`, `prompt |`, `acceptance:`. No `rubrics` field in catalog records — `rubrics` is `scenario.yaml`-only.
- Brand-new full record (no prior stub) precedent: `themes-nav-menu-location` (line 186), `themes-sidebar-widget-area` (line 201).
- No prior Common APIs Rewrite stub exists. `wp-cli-eval-flush-rewrite` (line 497) is in the WP-CLI area — unrelated, not touched.

## Topics

### Topic: Directory names (`common-apis-*` naming)

- **Spec link:** Requirements D.13, D.14; Acceptance Criterion 12
- **Decision:** Four scenario directories, all flat immediate children of `eval/scenarios/`, all matching `/^[a-z0-9-]+$/`, all carrying the `common-apis-` prefix:
  1. `common-apis-rewrite-rule` — Rewrite API (e2e)
  2. `common-apis-options` — Options API (judge-only)
  3. `common-apis-transients` — Transients API (judge-only)
  4. `common-apis-http-request` — HTTP API (judge-only)
- **Rationale:** The `common-apis-` prefix visually clusters these scenarios under the Common APIs area while remaining flat (no filesystem nesting). Names are short, concept-level, and distinct. The legacy stub names `options-api-store-retrieve` and `transient-cache-remote-data` are NOT carried forward (spec requires renaming to `common-apis-*`). No existing scenario directory carries a `common-apis-` prefix — no collision. Each name: `name` field in `scenario.yaml` == directory name == catalog record `name`, all identical. The names match `/^[a-z0-9-]+$/` (hyphens only, all lowercase).

### Topic: Rewrite API scenario — e2e assertion approach

- **Spec link:** Requirements B.7, B.8, B.9; Acceptance Criteria 6, 7, 9
- **Options:**
  1. `page.goto(pinned-url)` + `page.locator("body").toContainText(token)` — navigates and asserts text in theme-rendered DOM
  2. `page.request.get(pinned-url)` + `expect(resp.status()).toBe(200)` + `expect(await resp.text()).toContain(token)` — asserts raw HTTP response
- **Trade-offs:**
  - Option 1: Functional if the plugin exits before theme loads, but depends on the DOM/theme pipeline; `page.goto` triggers full page load including any theme scaffold. Slightly less precise about what was tested.
  - Option 2: Theme-independent — the assertion is on the raw HTTP bytes. If `template_redirect` echoes the token and exits, the body is only the plugin's output. Directly precedented by `rest-api-route-validation/e2e.spec.mjs` and `rest-custom-endpoint/e2e.spec.mjs`. The body-token check is the **primary/true success signal** (only present if rule matched AND handler ran). Status 200 check is defense-in-depth against a routed-but-wrong response.
- **Decision:** Use `page.request.get(pinned-url)` with two assertions: (1) body text `.toContain(pinned-token)` (primary), and (2) `status() === 200` (secondary). No DOM interaction, no content seeding, no new `eval/utils/` helper.
- **Plugin mechanism (single logical `index.php` edit, three hooks):**
  - `init` callback: `add_rewrite_rule('^my-custom-page/?$', 'index.php?my_endpoint=1', 'top')` + `add_filter('query_vars', fn($vars){ $vars[] = 'my_endpoint'; return $vars; })` (or `add_rewrite_tag('%my_endpoint%', '([^&]+)')`)
  - `template_redirect` callback: if `get_query_var('my_endpoint')` → `status_header(200); echo 'Hello from my plugin'; exit;`
  - `register_activation_hook(__FILE__, 'flush_rewrite_rules')` (or inline callback)
- **Pinned literals (must appear verbatim in prompt; matched verbatim in e2e):**
  - URL path: `/my-custom-page` (phase 4 picks exact slug; must be pinned in prompt)
  - Body token: `Hello from my plugin` (phase 4 picks exact phrasing; must be pinned in prompt)
- **e2e spec (illustrative — exact prose is phase 4):**
  ```js
  import { expect, test } from "@wordpress/e2e-test-utils-playwright";
  import { deactivateAllPlugins } from "../../utils/wp-cli.mjs";

  test.describe("common-apis-rewrite-rule scenario", () => {
    test.beforeAll(async ({ requestUtils }, workerInfo) => {
      deactivateAllPlugins();
      await requestUtils.activatePlugin(
        `plugin-common-apis-rewrite-rule-${workerInfo.project.metadata.agentId}`,
      );
    });
    test.afterAll(() => {
      deactivateAllPlugins();
    });
    test("custom URL returns the pinned response", async ({ page }) => {
      const resp = await page.request.get("/my-custom-page");
      expect(resp.status()).toBe(200);
      expect(await resp.text()).toContain("Hello from my plugin");
    });
  });
  ```
- **Acceptance (draft for phase 4 — scenario-unique, clean, no URLs):**
  1. A custom URL path (`/my-custom-page`) is handled by a registered rewrite rule.
  2. Navigating to `/my-custom-page` returns HTTP status 200 (not a 404).
  3. The response body contains the pinned text `Hello from my plugin`.
  4. The plugin intercepts the request before any theme template loads, outputs its response, and stops further rendering.
  5. The rewrite rules are flushed once when the plugin is activated so the URL is live immediately.
- **Rationale:** `page.request.get` + body-token is the most robust and theme-independent assertion shape for this scenario. The body token is the only assertion that proves both halves (URL routed correctly + handler executed). Status 200 confirms no 404 fallthrough. This approach reuses the identical lifecycle (imports, beforeAll/afterAll, sync `deactivateAllPlugins()`, `requestUtils.activatePlugin` slug pattern) as all established e2e precedents, requires no new helper in `eval/utils/`, and keeps every asserted literal pinnable in the prompt for prompt/assertion lockstep (Spec Requirement B.9).

### Topic: Options API scenario

- **Spec link:** Requirements A.3, B.5, B.6, C.11; Acceptance Criteria 2, 4, 5, 8, 10
- **Sub-area:** Common APIs → Options API (direct `add_option`/`update_option`/`get_option`). Distinct from `settings-register` (Settings API, different chapter, zero function overlap).
- **Kind:** Judge-only — `scenario.yaml` only, no `e2e.spec.mjs`. No front-end observable surface.
- **Name:** `common-apis-options`
- **Hook:** `init` (standard for Options API calls on load)
- **Plugin mechanism:** single `index.php` edit — `add_action('init', fn() { update_option('my_plugin_setting', 'enabled'); $val = get_option('my_plugin_setting', 'default'); })` (or similar; the agent implements; acceptance grades the pattern).
- **Pinned literals:** option key (e.g. `my_plugin_setting`) pinned in prompt; a default value (e.g. `enabled`) pinned in prompt.
- **Acceptance (draft):**
  1. An option is stored under a namespaced key (the pinned key).
  2. The stored value is retrieved using the Options API retrieval function.
  3. A default value is provided for when the option does not yet exist.
  4. The store and retrieve operations are performed on a load-time hook.
- **Rationale:** Direct imperative store-and-retrieve pattern from the Options handbook chapter. Tool-agnostic prompt: "store a value under a named key and read it back, providing a fallback if it hasn't been set yet." Acceptance does not name `add_option`/`update_option`/`get_option` — it describes the operations. This is distinct from `settings-register` at the sub-area level (different chapter, different functions, different mental model).

### Topic: Transients API scenario

- **Spec link:** Requirements B.5, B.6, C.11, E.15; Acceptance Criteria 4, 5, 8, 10, 14
- **Sub-area:** Common APIs → Transients API (cache with expiry). Reframed from legacy stub (standalone, decoupled from HTTP).
- **Kind:** Judge-only — `scenario.yaml` only, no `e2e.spec.mjs`.
- **Name:** `common-apis-transients`
- **Hook:** `init` (or any appropriate hook; the agent decides; acceptance grades the pattern).
- **Plugin mechanism:** single `index.php` edit — `add_action('init', fn() { $val = get_transient('my_plugin_data'); if (false === $val) { $val = compute_value(); set_transient('my_plugin_data', $val, HOUR_IN_SECONDS); } })` (or similar pattern).
- **Pinned literals:** transient key (e.g. `my_plugin_data`) pinned in prompt.
- **Acceptance (draft):**
  1. A transient is checked first; if it has expired or is not yet set, the value is (re)computed.
  2. The computed value is stored with an expiration time.
  3. On subsequent loads before expiry, the cached value is returned without recomputation.
  4. The transient key is a namespaced string literal.
- **Rationale:** Standalone cache-with-expiry concept, decoupled from HTTP (per spec). Tool-agnostic prompt: "cache a value so it is not recomputed on every request; recompute it after it expires." No HTTP call mentioned in the prompt or acceptance — this avoids coupling the Transients scenario to the HTTP API scenario. The stub `transient-cache-remote-data` is renamed (record rename, not scenario rename) to `common-apis-transients` and reframed.

### Topic: HTTP API scenario

- **Spec link:** Requirements B.5, B.6, B.9 (B.10), C.11; Acceptance Criteria 4, 5, 8, 10, 13; Out of Scope 10
- **Sub-area:** Common APIs → HTTP API (`wp_remote_get` / `wp_remote_retrieve_body` / `is_wp_error`).
- **Kind:** Judge-only — `scenario.yaml` only, no `e2e.spec.mjs`. No live external call, no live-200 criterion.
- **Name:** `common-apis-http-request`
- **Hook:** `init` (or `wp` or any load-time hook; the agent decides; acceptance grades the pattern).
- **Plugin mechanism:** single `index.php` edit — `add_action('init', fn() { $response = wp_remote_get('https://example.com/api'); if (is_wp_error($response)) { return; } $body = wp_remote_retrieve_body($response); })` (or similar).
- **Prompt framing:** endpoint-agnostic — "fetch data from an external URL" or "make an outbound HTTP request." No specific host pinned.
- **Acceptance (draft):**
  1. An outbound HTTP GET request is made to an external URL.
  2. The response is checked for an error before its content is used (using the WordPress error-check mechanism).
  3. The response body is extracted using the WordPress HTTP response body helper.
  4. The request is made from a hook callback, not at file-load time.
- **Rationale:** The acceptance grades the PHP pattern statically: the three-part pattern (make request → check error → read body) is readable from the produced code without running it. No live-200 criterion appears. The `is_wp_error()` acceptance point is grounded to the `wp_remote_get` function reference page (which documents the `WP_Error` return type) — required per Spec Requirement E.14 (HTTP record must cite `/reference/functions/wp_remote_get/` for this point).

### Topic: Catalog promotion plan

- **Spec link:** Requirements E.14–E.19; Acceptance Criteria 13–18
- **Decision:** The following changes to `eval/scenarios/_wp-dev-candidates.yaml` (all other records untouched):

  1. **Fix header lines 28-29** (the only header change): "…REST API, and Themes scenarios…" → "…REST API, Themes, and Common APIs scenarios…"

  2. **Rename + promote `options-api-store-retrieve`** → full record named `common-apis-options` placed under a new `# Implemented Common APIs scenarios — full records` sub-header within `# === Area: Common APIs ===`. Add `prompt` and `acceptance` matching the shipped `scenario.yaml` verbatim. Fields: `name: common-apis-options`, `description` (updated), `difficulty: simple`, `concepts: [add_option, update_option, get_option]`, `source: dev.wordpress.org`, `source_files: [https://developer.wordpress.org/apis/options/, https://developer.wordpress.org/reference/functions/get_option/]`, `prompt |`, `acceptance:`.

  3. **Rename + promote `transient-cache-remote-data`** → full record named `common-apis-transients` under the same sub-header. Reframe description to standalone cache-with-expiry (no HTTP coupling). Fields: `name: common-apis-transients`, `description` (updated — "Cache a computed value with an expiry so it is not recomputed on every request"), `difficulty: simple`, `concepts: [set_transient, get_transient, delete_transient]`, `source: dev.wordpress.org`, `source_files: [https://developer.wordpress.org/apis/transients/, https://developer.wordpress.org/reference/functions/set_transient/]`, `prompt |`, `acceptance:`.

  4. **Add brand-new full record `common-apis-rewrite-rule`** under the sub-header (no prior Common APIs stub for this). Fields: `name: common-apis-rewrite-rule`, `description: "Register a custom URL rewrite rule that routes a pretty URL to a plugin-controlled response"`, `difficulty: simple`, `concepts: [add_rewrite_rule, register_activation_hook, template_redirect]`, `source: dev.wordpress.org`, `source_files: [https://developer.wordpress.org/apis/rewrite/]`, `prompt |`, `acceptance:`. Prompt and acceptance verbatim from the shipped `scenario.yaml`.

  5. **Add brand-new full record `common-apis-http-request`** under the sub-header (no prior Common APIs HTTP stub). Fields: `name: common-apis-http-request`, `description: "Fetch data from an external URL with error handling using the WordPress HTTP API"`, `difficulty: simple`, `concepts: [wp_remote_get, wp_remote_retrieve_body, is_wp_error]`, `source: dev.wordpress.org`, `source_files: [https://developer.wordpress.org/apis/making-http-requests/, https://developer.wordpress.org/reference/functions/wp_remote_get/]`, `prompt |`, `acceptance:`. Two `source_files` entries required (spec mandates the reference page citation for the `is_wp_error` acceptance point).

  6. **Leave `http-api-remote-get` Plugins stub untouched** (lines ~334-342) — not moved, renamed, promoted, or annotated.

  7. **No deferred comments on Common APIs stubs** — both existing stubs are promoted, so no Common APIs stub carries a `# Deferred:` comment after the update.

  8. **No new catalog entries for Database/Filesystem** — their deferral is recorded only in the spec and design doc.

  9. **Sub-header order of full records** (within the `# Implemented Common APIs scenarios — full records` sub-header): Options, Transients, Rewrite Rule, HTTP Request (matching implementation concept order — phase 4 latitude).

  10. **`_candidates.yaml` (iAPI catalog) byte-untouched.**

- **Rationale:** Mirrors the Themes review precedent exactly: stubs promoted+renamed (record rename only — no shipped scenario directory exists yet for the legacy names), new full records added, sub-header created, no stub duplication, no name mismatch between any record and its scenario directory. Every implemented Common APIs sub-area maps to exactly one full record under its final `common-apis-*` name. Provenance (source URLs) lives only in catalog records, never in `scenario.yaml` files.

## Open Questions

- **Exact pinned URL slug for `common-apis-rewrite-rule`** (phase-4 latitude, NOT blocking): Recommended `/my-custom-page`. Phase 4 may choose any clean slug unlikely to collide with a fresh `wp-env` page, but must pin it verbatim in the prompt and match it exactly in the e2e `page.request.get(...)` call.
- **Exact pinned body token for `common-apis-rewrite-rule`** (phase-4 latitude): Recommended `Hello from my plugin`. Must be pinned in prompt and matched with `toContain(token)` in the e2e.
- **Exact pinned option key for `common-apis-options`** (phase-4 latitude): e.g. `my_plugin_setting`. Must be namespaced (not a bare WP core key).
- **Exact pinned transient key for `common-apis-transients`** (phase-4 latitude): e.g. `my_plugin_data`.
- **Final prompt + acceptance prose** (phase-4 task): the design fixes mechanism, hooks, and pinned literals; the exact user-voice, tool-agnostic wording is a phase-4 task.
- **Sub-area ordering of full records in the catalog** (phase-4 latitude): any consistent order within the sub-header.

## Risks

- **Rewrite rule custom query var must be registered.** If the agent calls only `add_rewrite_rule()` without registering the query var (`query_vars` filter or `add_rewrite_tag`), WordPress strips the unrecognized var, finds no post, and 404s. The prompt must steer the agent to the complete pattern (rule + query var + handler), even without naming the specific functions. Mitigation: the acceptance explicitly requires a `template_redirect` intercept that outputs the body token — if the agent omits the query var or the intercept, the token won't appear and the e2e fails for the right reason.
- **`template_redirect` handler must call `status_header(200)` and `exit`.** Without `exit`, WordPress continues rendering (theme output follows the plugin output; the `toContain` assertion still passes, but the response is much larger than expected — low risk since the assertion is a `toContain`, not an equality check). Without `status_header(200)`, WordPress may have already set a 404 header in the main query before `template_redirect` fires — the status assertion would fail. Mitigation: the acceptance includes "returns HTTP status 200" so the agent is graded on this.
- **Options scenario must not duplicate `settings-register`.** Resolved by spec Requirement A.3. Phase 4 must frame the prompt as "store and retrieve a value imperatively" (not "register a setting for the admin UI").
- **Transients scenario must be decoupled from HTTP.** The prompt must NOT mention fetching from a URL or remote data. The cache holds any computed value (a processed string, a count, etc.).
- **HTTP scenario acceptance must have no live-200 criterion.** The prompt names no specific external host. The `is_wp_error()` check is the graded pattern, not the response content from a live URL.
- **Catalog edits confined to Common APIs records + one header line.** The iAPI `_candidates.yaml` and all non-Common-APIs records in `_wp-dev-candidates.yaml` must be byte-untouched. Phase 4/5 must diff-check this (correctness invariant).
- **`deactivateAllPlugins()` is sync (no `await`).** All existing e2e specs confirm this. Phase 4 must follow the same call style in the Rewrite scenario.
- **Database (`$wpdb`) deferred:** raw `$wpdb` is non-idiomatic for simple tasks (docs steer to higher-level Options/Transients/Metadata APIs); a realistic scenario needs a custom table (multi-concept); a tool-agnostic prompt cannot express it without naming the database. No catalog stub today; no new catalog entry.
- **Filesystem (`WP_Filesystem`) deferred:** requires multi-step credential bootstrapping in an admin/credentials-prompt context, which fails the "simple, one concept" bar and is awkward to express tool-agnostically. No catalog stub today; no new catalog entry.
