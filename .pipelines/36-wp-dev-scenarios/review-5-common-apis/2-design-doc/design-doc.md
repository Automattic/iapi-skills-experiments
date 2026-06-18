# Design Doc: Common APIs scenarios

## Overview

The `wordpress-development` skill is evaluated by a Skillsmith-based suite under `eval/`. Prior reviews established a broad area → sub-area taxonomy of developer.wordpress.org, committed a candidate catalog at `eval/scenarios/_wp-dev-candidates.yaml`, and implemented scenarios for the Interactivity API, a v1 set (Hooks/Filters, Shortcodes, Custom Post Types, custom REST endpoints), the Plugins area, the Block Editor area, the REST API area, and the Themes area. The **Common APIs** area (the Common APIs Handbook, `https://developer.wordpress.org/apis/`) is still uncovered: the catalog carries only two Common APIs stubs (`transient-cache-remote-data`, `options-api-store-retrieve`), and no Common APIs scenario is implemented.

This review extends coverage to the **Common APIs** area with a deliberately small batch — **one end-to-end scenario plus three judge-only scenarios** — reusing (not rebuilding) the existing taxonomy and catalog. The defining constraint for Common APIs is **avoiding duplication**: the Common APIs Handbook overlaps heavily with the Plugin Handbook, so several Common APIs sub-areas (Metadata, Shortcode, Settings, Cron, Internationalization) are already covered by existing Plugins/v1 scenarios and must not be re-done. Targeting only genuinely uncovered sub-areas, and observing that of those only the Rewrite API has a clean front-end-observable surface while the rest are data-oriented, the batch is: a custom pretty URL via the Rewrite API (e2e), store-and-retrieve a value via the Options API (judge-only), cache a value with an expiry via the Transients API (judge-only), and fetch data from an external web service via the HTTP API (judge-only). The intent explicitly permits this smaller batch given the Common APIs / Plugin Handbook overlap.

As in prior reviews, the **skill itself is not modified** — the scenarios lead and the skill catches up in later work; verification is **static/structural only** (each scenario discoverable by Skillsmith and, where it ships one, its `e2e.spec.mjs` parseable/collectable by the test runner), and scenarios are not required to pass against the current skill. The folders question is already resolved (review-2): the adopted convention is the **`common-apis-*` pseudo-folder naming** (area-prefixed flat scenario names), which this review applies. The deliverables are: (1) **four Common APIs scenarios** — `common-apis-rewrite-rule` (e2e), `common-apis-options` (judge-only), `common-apis-transients` (judge-only), and `common-apis-http-request` (judge-only); and (2) a **catalog promotion + reconciliation** of the Common APIs section of `_wp-dev-candidates.yaml` (two stubs renamed+promoted to full, two new full records, one header-line fix). Two Common APIs sub-areas — Database (`$wpdb`) and Filesystem (`WP_Filesystem`) — are **deferred**, with their defer reasons recorded only in the spec and this design doc; neither gets a new catalog stub. The existing scenarios, the scaffold, the harness, Skillsmith, the iAPI `_candidates.yaml`, the Plugins `http-api-remote-get` stub, and the skill are all untouched.

## Approach

The end-to-end mental model the implementer works from:

**Naming convention (the structural element).** All four new scenarios use the prefix `common-apis-<concept>` as their directory name, their `scenario.yaml` `name`, and their catalog record `name` — identical in all three places, each matching `/^[a-z0-9-]+$/`. This is the adopted "pseudo-folder" organization carried over from review-2: it visually clusters Common APIs scenarios when `eval/scenarios/` is listed and sorted, while every scenario remains a **flat immediate child** of `eval/scenarios/`. No filesystem nesting is introduced, so Skillsmith discovery, the e2e lifecycle, the `verify-e2e.ts` spec-location/attribution logic, the test runner's collection, and the scaffold are all unchanged. The existing scenarios are NOT renamed. The legacy stub names `options-api-store-retrieve` and `transient-cache-remote-data` are NOT carried forward — they are renamed (a catalog-record rename only; no shipped scenario directory exists for them yet) to `common-apis-options` and `common-apis-transients`. The four names are: `common-apis-rewrite-rule`, `common-apis-options`, `common-apis-transients`, `common-apis-http-request`. None collides with any existing scenario directory (no existing dir carries a `common-apis-` prefix).

**Scenarios (the implemented work).** Each scenario is a self-contained directory `eval/scenarios/<name>/` containing a `scenario.yaml`; the e2e scenario additionally contains an `e2e.spec.mjs`. The established runtime lifecycle is reused unchanged:

1. **Skillsmith discovers the scenario** by reading the immediate children of `eval/scenarios/` and loading each child's `scenario.yaml`. The directory name is the discovery identity; the `name` field inside the YAML is the plugin-slug fragment used downstream. For every scenario here, `name` equals the directory name.
2. **Skillsmith scaffolds a plugin** per (scenario, testing-agent). The plugin slug is `plugin-<scenario.name>-<agentId>`. The scaffold provides an `index.php` (plugin header + hooks) that hosts all PHP. **No block or theme artifact is needed** — every registration/call in this batch goes on a global hook in `index.php`: `init` (rewrite-rule registration + query-var registration; the Options/Transients/HTTP calls), `template_redirect` (the rewrite handler), plus a `register_activation_hook` flush for the Rewrite scenario. These are global hooks that fire regardless of registrant, so the plugin registers exactly where core expects, with no theme involvement.
3. **The testing agent implements the requested feature** as a single edit to `index.php`. One concept, one small feature, one plugin edit each. No theme artifact, no second block type, no JS toolchain, no custom database table, no multi-step task.
4. **An LLM judge grades the produced code** against the scenario's `acceptance` list. Every scenario declares `rubrics: []`, so only `acceptance` is used. The three judge-only scenarios (Options, Transients, HTTP) are graded **solely** by the judge against the produced PHP — they ship no `e2e.spec.mjs`, mirroring the existing judge-only Plugins scenarios (`cron-event`, `admin-menu-page`, `i18n-textdomain`).
5. **The e2e harness (`eval/utils/verify-e2e.ts`) runs the one e2e spec** in a `wp-env` runtime: it boots `wp-env` with every produced plugin registered but deactivated, then runs `common-apis-rewrite-rule/e2e.spec.mjs`. The spec deactivates all plugins, activates exactly its own plugin (whose activation hook flushes rewrite rules), issues an HTTP request to the pinned custom URL, and asserts against the raw response. No content seeding; no new `eval/utils/` helper.

**The single front-end e2e assertion (load-bearing).** The Rewrite scenario follows the `cpt-register` / `rest-api-route-validation` precedent — `page.request.get(url)` + status + body, NOT `page.goto(url)` + DOM. The reason is specific to rewrite rules and is the core feasibility property of this scenario: a custom rewrite rule that maps a pretty URL to a **custom query var** produces a **404 by default**. WordPress only exposes public query vars; an unregistered var is stripped from the parsed query, no post is found, and core sets `is_404()` and sends a 404 header — possibly rendering a themed 404 page. For the URL to return a deterministic 200 with a known body, the plugin must (a) register the custom query var (via the `query_vars` filter or `add_rewrite_tag`) so the rule's target var survives, and (b) hook `template_redirect` to detect the var (`get_query_var()`), call `status_header(200)`, echo a deterministic body token, and `exit` before any theme template loads. With that handler, the response body is **entirely the plugin's output** — theme-independent and deterministic. The e2e therefore asserts on the raw HTTP bytes: the **body token is the primary success signal** (only present if the rule matched AND the handler ran), and the **200 status is secondary defense-in-depth** (confirms no 404 fallthrough). `page.goto` + DOM would couple the assertion to the theme's 404/template pipeline and is the wrong shape; `page.request.get` reads the plugin's raw output directly.

**The query-var / handler gotcha (must be baked into prompt + acceptance).** The most likely failure mode is an agent that calls `add_rewrite_rule()` alone — registering the rule but not the query var and not the `template_redirect` handler. That implementation 404s. The design's mitigation is in the acceptance: it requires the URL to return 200, requires the response body to contain the pinned token, and requires the plugin to intercept the request and output its response before any theme template renders. An implementation missing the query-var registration or the handler will not produce the token, so the e2e fails for the right reason. The prompt steers toward the complete pattern (a custom URL that returns a specific response) without naming the functions.

**The activation-flush requirement (self-contained, no harness change).** A newly added rewrite rule only takes effect after `flush_rewrite_rules()` writes it to the rewrite store. The plugin registers the rule on `init` and flushes once from `register_activation_hook`. Because `requestUtils.activatePlugin` fires the activation hook, the rule is live the first time the test navigates to the URL — requiring no new harness infrastructure and no permalink-structure setup step. Pretty permalinks are ON by default in this harness (`@wordpress/env` ≥ 11.0.0, pinned `^11.4.0`), so the custom pretty URL routes without any additional setup.

**Catalog.** The Common APIs section of `eval/scenarios/_wp-dev-candidates.yaml` is updated: `options-api-store-retrieve` is **renamed and promoted** to a full record named `common-apis-options`; `transient-cache-remote-data` is **renamed, promoted, and reframed** to a full record named `common-apis-transients` (standalone cache-with-expiry, decoupled from any HTTP call); two new full records (`common-apis-rewrite-rule`, `common-apis-http-request`) are added; all four sit under an `# Implemented Common APIs scenarios — full records` sub-header mirroring the Block Editor / REST API / Themes pattern; and the stale header line is corrected to list Common APIs. The Plugins `http-api-remote-get` stub is **left untouched**. No Common APIs stub remains, so no Common APIs stub carries a `# Deferred:` comment. No new stub is created for the deferred Database / Filesystem sub-areas. The iAPI `_candidates.yaml` and all non-Common-APIs records are untouched.

**No change is made** to the scaffold, the e2e harness, the Skillsmith package, the skill, the existing scenarios, `eval/utils/`, `eval/rubrics/`, or `_candidates.yaml`.

## The four Common APIs scenarios

Dedup drives selection: a Common APIs sub-area is a candidate only if it is *not already covered* by an existing scenario at the handbook-chapter + distinct-function level. The already-covered sub-areas — Metadata (`post-meta-rest`), Shortcode (`shortcode-with-attr`), Settings (`settings-register`, via `register_setting`), Cron (`cron-event`), and Internationalization (`i18n-textdomain`) — are NOT re-done. Of the genuinely uncovered sub-areas, only one (Rewrite) produces a clean, theme-independent, front-end-observable assertion, so it gets an **e2e** scenario; the data-oriented ones (Options, Transients, HTTP API) get **judge-only** scenarios. The Options API is treated as distinct from the Settings API: different handbook chapter, zero function overlap (`settings-register` registers a setting's schema and never reads or writes the value; the Options API imperatively stores and retrieves a value), different mental model. Each scenario is fully specified below so phase 3/4 build it without re-deciding. Every literal the e2e asserts is pinned in that scenario's prompt, keeping prompt and assertion in lockstep.

### Sub-area selection

| Sub-area | Implemented? | Kind / e2e channel | Single `index.php` edit? | Scenario |
|---|---|---|---|---|
| Rewrite API (custom pretty URL) | YES | e2e — `page.request.get(url)` + status 200 + body-token assertion | Yes — `init` (rule + query var) + `template_redirect` (handler) + `register_activation_hook` (flush) | `common-apis-rewrite-rule` |
| Options API (imperative store/retrieve) | YES | judge-only (no front-end observable surface — data is in the options table) | Yes — `add_option`/`update_option`/`get_option` on `init` | `common-apis-options` |
| Transients API (cache with expiry) | YES | judge-only (no front-end observable surface — data is in the transient store) | Yes — `get_transient`/`set_transient` on `init` | `common-apis-transients` |
| HTTP API (outbound request + error handling) | YES | judge-only (no live external call; PHP pattern graded statically) | Yes — `wp_remote_get`/`is_wp_error`/`wp_remote_retrieve_body` on a load-time hook | `common-apis-http-request` |
| Metadata / Shortcode / Settings / Cron / i18n | NO — already covered by existing scenarios | n/a | n/a | excluded (no new entry) |
| Database (`$wpdb`) | NO — deferred, no catalog stub today → no new entry | n/a — non-idiomatic for a simple task; needs a custom table (multi-concept); cannot be expressed tool-agnostically without naming the database | n/a | deferred (reason recorded here + in spec only) |
| Filesystem (`WP_Filesystem`) | NO — deferred, no catalog stub today → no new entry | n/a — needs multi-step credential bootstrapping tied to an admin/credentials-prompt context; fails the "simple, one concept" bar; awkward to express tool-agnostically | n/a | deferred (reason recorded here + in spec only) |
| Hooks / standalone Security-escaping / Plugins meta-area | NO — excluded | n/a — foundational/implicit, or overlaps `shortcode-with-attr` / `settings-register`, or is the Plugins meta-area | n/a | excluded (no new stub) |

### Scenario 1 — `common-apis-rewrite-rule` (custom pretty URL via the Rewrite API) — e2e

- **Sub-area:** Common APIs → Rewrite API — register a custom pretty URL and serve a plugin-controlled response at it. The only genuinely uncovered Common APIs sub-area with a clean front-end-observable assertion.
- **Source URL(s):** primary `https://developer.wordpress.org/apis/rewrite/`. (Lives in the catalog `source_files`, never in the `scenario.yaml`.)
- **Kind:** e2e — ships an `e2e.spec.mjs`.
- **Mechanism (single logical `index.php` edit, three hooks):**
  - **`init` callback:** `add_rewrite_rule('^<slug>/?$', 'index.php?<var>=1', 'top')` to map the pretty URL to a custom query var, **and** register that query var — either `add_filter('query_vars', fn($vars){ $vars[] = '<var>'; return $vars; })` or `add_rewrite_tag('%<var>%', '([^&]+)')`. Registering the var is mandatory; without it the var is stripped and the URL 404s.
  - **`template_redirect` callback:** if `get_query_var('<var>')` is set → `status_header(200); echo '<body-token>'; exit;`. The `exit` stops further (theme) rendering so the response body is exactly the token.
  - **`register_activation_hook(__FILE__, 'flush_rewrite_rules')`** (or an inline callback calling it) so the rule is live on first navigation.
- **Pinned literals (prompt ↔ assertion lockstep):**
  - URL path — recommended `/my-custom-page` (phase 4 may pick any clean slug unlikely to collide with a fresh `wp-env` page; it MUST be pinned verbatim in the prompt and matched exactly in the e2e `page.request.get(...)`).
  - Body token — recommended `Hello from my plugin` (phase 4 may reword; it MUST be pinned verbatim in the prompt and matched with `toContain(token)` in the e2e). The body token is the **only** literal that proves both halves (URL routed + handler ran).
- **e2e flow (cpt-register lifecycle; illustrative — exact prose is phase 4):**
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
  - `page` and `requestUtils` are injected fixtures (destructured from the test args). `agentId` is read from `workerInfo.project.metadata.agentId` (the second arg of the `beforeAll` callback).
  - `deactivateAllPlugins()` is called **sync** (no `await`) in both `beforeAll` and `afterAll` — matching every existing e2e spec.
  - The `../../utils/wp-cli.mjs` import (two-level depth) resolves correctly precisely because the scenario directory is a flat immediate child of `eval/scenarios/`. **No new `eval/utils/` helper is added.**
- **`acceptance` (scenario-unique, clean checks, no URLs) — draft for phase 4:**
  1. A custom URL path (the pinned path) is handled by a registered rewrite rule.
  2. Navigating to the pinned path returns HTTP status 200 (not a 404).
  3. The response body contains the pinned text token.
  4. The plugin intercepts the request before any theme template loads, outputs its response, and stops further rendering.
  5. The rewrite rules are flushed once when the plugin is activated so the URL is live immediately.

### Scenario 2 — `common-apis-options` (imperative store-and-retrieve via the Options API) — judge-only

- **Sub-area:** Common APIs → Options API — imperatively store and retrieve a value via `add_option`/`update_option`/`get_option`. **Distinct from `settings-register`** (Settings API): different handbook chapter, zero function overlap, different mental model (declare a setting's schema for admin/REST to manage vs. imperatively store and read a value).
- **Source URL(s):** primary `https://developer.wordpress.org/apis/options/`; secondary `https://developer.wordpress.org/reference/functions/get_option/`. (Catalog `source_files` only.)
- **Kind:** judge-only — `scenario.yaml` only, no `e2e.spec.mjs`. No front-end observable surface (the value lives in the options table).
- **Mechanism:** single `index.php` edit — a callback on a load-time hook (`init`) that stores a value under a namespaced key and reads it back, supplying a default for when the option is not yet set.
- **Pinned literals:** the option key (recommended `my_plugin_setting`, a namespaced key — not a bare WP core key) pinned in the prompt; a default/value (e.g. `enabled`) pinned in the prompt. These are graded in acceptance, not asserted by an e2e (there is none).
- **`acceptance` (scenario-unique) — draft for phase 4:**
  1. A value is stored under the pinned namespaced key.
  2. The stored value is retrieved by reading it back from the same key.
  3. A default value is provided for when the key has not yet been set.
  4. The store and retrieve operations run from a load-time hook.

### Scenario 3 — `common-apis-transients` (cache a value with an expiry via the Transients API) — judge-only

- **Sub-area:** Common APIs → Transients API — cache a computed value with an expiry and recompute it after it expires, via `set_transient`/`get_transient`. **Reframed** from the legacy `transient-cache-remote-data` stub to a **standalone cache-with-expiry concept, decoupled from any HTTP call** (the legacy stub over-coupled caching with a remote request). The cache holds any computed value (a processed string, a count, etc.) — no remote data.
- **Source URL(s):** primary `https://developer.wordpress.org/apis/transients/`; secondary `https://developer.wordpress.org/reference/functions/set_transient/`. (Catalog `source_files` only.)
- **Kind:** judge-only — `scenario.yaml` only, no `e2e.spec.mjs`. No front-end observable surface (the value lives in the transient store).
- **Mechanism:** single `index.php` edit — a callback on a load-time hook that reads the transient first; if it is missing/expired (`false`), computes the value and stores it with an expiration; otherwise returns the cached value without recomputing.
- **Pinned literals:** the transient key (recommended `my_plugin_data`, a namespaced string literal) pinned in the prompt; graded in acceptance.
- **`acceptance` (scenario-unique) — draft for phase 4:**
  1. The transient is checked first; if it has expired or is not yet set, the value is (re)computed.
  2. The computed value is stored with an expiration time.
  3. On subsequent loads before expiry, the cached value is returned without recomputation.
  4. The transient key is a namespaced string literal.

### Scenario 4 — `common-apis-http-request` (fetch from an external web service via the HTTP API) — judge-only

- **Sub-area:** Common APIs → HTTP API — make an outbound request and handle errors, via `wp_remote_get` → `is_wp_error()` → `wp_remote_retrieve_body()`.
- **Source URL(s):** primary `https://developer.wordpress.org/apis/making-http-requests/` (grounds `wp_remote_get` / `wp_remote_retrieve_body`); secondary `https://developer.wordpress.org/reference/functions/wp_remote_get/` (grounds the `is_wp_error` error-handling acceptance point — the overview page does NOT show `is_wp_error()` handling, so this second citation is required). (Catalog `source_files` only.)
- **Kind:** judge-only — `scenario.yaml` only, no `e2e.spec.mjs`. **No live external call, no live-200 acceptance criterion, no specific external host pinned.** The acceptance grades the PHP pattern statically.
- **Mechanism:** single `index.php` edit — a callback on a load-time hook that makes an outbound GET request, checks for an error (`is_wp_error()`) before using the response, and reads the body (`wp_remote_retrieve_body()`).
- **Prompt framing:** endpoint-agnostic — "fetch data from an external web service" / "make an outbound HTTP request." No specific host pinned. Because there is no e2e and no live request, the scenario does not depend on a live external call succeeding or on the eval environment having outbound network.
- **`acceptance` (scenario-unique) — draft for phase 4:**
  1. An outbound HTTP GET request is made to an external URL.
  2. The response is checked for an error before its content is used.
  3. The response body is extracted using the WordPress HTTP response-body helper.
  4. The request is made from a hook callback, not at file-load time.

### Summary

| # | Scenario (= dir = `name`) | Sub-area | Hook(s) | Kind | Pinned literals |
|---|---|---|---|---|---|
| 1 | `common-apis-rewrite-rule` | Rewrite API | `init` + `template_redirect` + `register_activation_hook` | e2e (raw HTTP — `page.request.get` + 200 + body token) | URL path + body token |
| 2 | `common-apis-options` | Options API | `init` | judge-only | option key + default/value |
| 3 | `common-apis-transients` | Transients API | `init` | judge-only | transient key |
| 4 | `common-apis-http-request` | HTTP API | load-time hook (`init`) | judge-only | none (endpoint-agnostic) |

All four declare `rubrics: []`. Each is one `index.php` edit. Only scenario 1 ships an `e2e.spec.mjs` (cpt-register lifecycle); scenarios 2–4 are `scenario.yaml`-only.

## Components

### New components (this review)

- `eval/scenarios/common-apis-rewrite-rule/` — `scenario.yaml` + `e2e.spec.mjs` (e2e).
- `eval/scenarios/common-apis-options/` — `scenario.yaml` only (judge-only).
- `eval/scenarios/common-apis-transients/` — `scenario.yaml` only (judge-only).
- `eval/scenarios/common-apis-http-request/` — `scenario.yaml` only (judge-only).
- `eval/scenarios/_wp-dev-candidates.yaml` — Common APIs section updated in place (2 stubs renamed+promoted to full, 2 new full records under an `# Implemented Common APIs scenarios — full records` sub-header, 1 header-line fix).

All four directory names match `/^[a-z0-9-]+$/`, equal their `scenario.yaml` `name` and their catalog record `name`, are flat immediate children of `eval/scenarios/`, and carry the `common-apis-` prefix. None collides with an existing scenario directory (no existing dir carries a `common-apis-` prefix).

### Untouched-but-relevant components (consumed, not modified)

- `eval/utils/scaffold-plugin.ts` — scaffolds the per-(scenario, agent) plugin. Fixed facts the scenarios depend on: slug `plugin-<scenario.name>-<agentId>`; `index.php` hosts the PHP (registrations/calls on `init`, `template_redirect`, and `register_activation_hook` for the Rewrite scenario). Throws if `name` (or `agentId`) does not match `/^[a-z0-9-]+$/`. No block or theme artifact is needed for this batch.
- `eval/utils/verify-e2e.ts` — locates each ran scenario's spec at the flat path `eval/scenarios/<dirName>/e2e.spec.mjs` (assumes flat immediate child), boots `wp-env`, runs the specs, and maps failures back per (scenario, agent). Only `common-apis-rewrite-rule` plugs into this flow (the three judge-only scenarios ship no spec).
- `eval/utils/wp-cli.mjs` — exports `deactivateAllPlugins()` (a wp-cli wrapper), used by the e2e spec's `beforeAll`/`afterAll`. Imported as `../../utils/wp-cli.mjs` — a two-level depth that resolves correctly only because the scenario directory is a flat immediate child. **No new helper is added here.**
- `@wordpress/e2e-test-utils-playwright` — provides `test`, `expect`, and the `requestUtils` / `page` fixtures: `requestUtils.activatePlugin` and `page.request.get`. The Rewrite spec uses exactly these — the same set `cpt-register` / `rest-api-route-validation` use; no new fixture or method is introduced (no `createPost`, no `requestUtils.rest`).
- `@automattic/skillsmith` — discovers scenarios by reading only the immediate children of `eval/scenarios/` (non-recursive); skips nested directories and leading-underscore / non-directory entries (which is why `_wp-dev-candidates.yaml` sits safely among real scenario dirs). NOT modified.
- `playwright.config.ts` — test-runner configuration (`testMatch` for `e2e.spec.mjs`, `testDir: eval/scenarios`). The three judge-only scenarios contribute no spec, so they add nothing to the test-runner collection.
- The scaffolded plugin's `index.php` — hosts the global-hook registrations/calls for all four scenarios. No block/theme artifact is touched.
- `eval/scenarios/cpt-register/e2e.spec.mjs` — the canonical no-seeding, raw-HTTP (`page.request.get` + status) lifecycle the Rewrite spec follows (imports, `beforeAll`/`afterAll`, sync `deactivateAllPlugins()`, `requestUtils.activatePlugin` slug pattern).

### Explicitly NOT modified

- Any existing scenario directory (the existing Interactivity API, v1, Plugins, Block Editor, REST API, and Themes scenarios are not moved, renamed, or reorganized).
- `eval/scenarios/_candidates.yaml` (the iAPI catalog) — byte-untouched.
- The Plugins-area `http-api-remote-get` stub and all other non-Common-APIs records in `_wp-dev-candidates.yaml` — byte-untouched.
- `eval/rubrics/` (no new shared rubric — each scenario carries `rubrics: []`).
- `eval/utils/` (no new helper).
- Anything under `skills/wordpress-development/`.

## Interfaces and Data Flow

### `scenario.yaml` schema (the existing shape)

```yaml
name: common-apis-rewrite-rule       # matches /^[a-z0-9-]+$/, equals the directory name; plugin-slug fragment
description: <one line>
skills:
  - wordpress-development
prompt: |
  <user-voice, outcome-phrased; for the Rewrite scenario pins every e2e-asserted literal
   (the URL path and the body token) in backticks; does NOT name add_rewrite_rule /
   flush_rewrite_rules / template_redirect / query_vars / add_option / get_option /
   set_transient / get_transient / wp_remote_get / is_wp_error / wp_remote_retrieve_body /
   any function, hook, API, or framework>
acceptance:
  - <scenario-unique, clean, human-readable check; NO embedded source URL>
rubrics: []                          # explicit empty array — REQUIRED for discovery
```

**The `rubrics` key must be present as an explicit empty array (`rubrics: []`).** Skillsmith's discovery shape-check requires `rubrics` to be an array; an omitted key (`undefined`) or a valueless `rubrics:` (parsed as `null`) silently fails discovery and the scenario is never graded. The same check requires `name`, `description`, `skills`, `prompt`, and `acceptance` to be present and well-typed. **Catalog-only fields (`difficulty`, `concepts`, `source`, `source_files`) and source URLs never appear in a `scenario.yaml`** — provenance lives only in the catalog record.

`name` is the plugin-slug fragment; the scaffolded plugin slug is `plugin-<name>-<agentId>`, and (for the e2e scenario) the spec must activate that exact slug. For all four scenarios `name` equals the directory name. The three judge-only `scenario.yaml` files are identical in shape to the e2e one (same keys), just without an accompanying `e2e.spec.mjs` — mirroring the existing judge-only Plugins scenarios.

**Literal-pinning convention (how a tool-agnostic prompt names a specific asserted literal).** The Rewrite prompt hard-pins the URL path and body token literals in backticks inside a user-voice sentence (e.g. "Serve the exact text `Hello from my plugin` at the URL `/my-custom-page`"), and the e2e asserts the exact URL with `page.request.get("/my-custom-page")` and the exact token with `toContain("Hello from my plugin")`. The prompt names the **outcome** (a custom URL returning a specific response), never the functions or hooks. The judge-only prompts pin their option/transient keys (and, for HTTP, name no host) but assert nothing via e2e — those literals are graded in acceptance.

### `e2e.spec.mjs` interface (the cpt-register lifecycle — `common-apis-rewrite-rule` only)

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

- `page` and `requestUtils` are injected fixtures (destructured from the test args); there is no local import for them. `agentId` is read from `workerInfo.project.metadata.agentId` (the second arg of the `beforeAll` callback).
- The `../../utils/wp-cli.mjs` import (two-level depth) resolves correctly precisely because the scenario directory is a flat immediate child of `eval/scenarios/`.
- The assertion is on the **raw HTTP response** (`page.request.get` + `status()` + `text()`), reusing the `cpt-register` / `rest-api-route-validation` shape exactly — not a new shape for this suite. The body-token `toContain` is the primary success signal; the `status() === 200` check is defense-in-depth. No DOM interaction, no content seeding, no new `eval/utils/` helper.

### Catalog record shape (Common APIs area, in `_wp-dev-candidates.yaml`)

Full records (all four implemented scenarios, including the three judge-only ones — judge-only scenarios still get full records, exactly as `cron-event` / `admin-menu-page` do). The catalog full-record fields are `name`, `description`, `difficulty`, `concepts`, `source`, `source_files`, `prompt |`, `acceptance:`. There is **no `rubrics` field in catalog records** — `rubrics` is `scenario.yaml`-only.

```yaml
- name: common-apis-rewrite-rule            # == directory name == scenario.yaml name
  description: Register a custom URL rewrite rule that routes a pretty URL to a plugin-controlled response
  difficulty: simple
  concepts: [add_rewrite_rule, register_activation_hook, template_redirect]
  source: dev.wordpress.org
  source_files:
    - https://developer.wordpress.org/apis/rewrite/
  prompt: |
    <exact same text as the shipped scenario.yaml prompt>
  acceptance:
    - <exact same items as the shipped scenario.yaml acceptance>
```

Per-record `source_files` (provenance, catalog-only):

| Record `name` | `concepts` (illustrative) | `source_files` |
|---|---|---|
| `common-apis-rewrite-rule` | `add_rewrite_rule`, `register_activation_hook`, `template_redirect` | `/apis/rewrite/` |
| `common-apis-options` | `add_option`, `update_option`, `get_option` | `/apis/options/`, `/reference/functions/get_option/` |
| `common-apis-transients` | `set_transient`, `get_transient`, `delete_transient` | `/apis/transients/`, `/reference/functions/set_transient/` |
| `common-apis-http-request` | `wp_remote_get`, `wp_remote_retrieve_body`, `is_wp_error` | `/apis/making-http-requests/`, `/reference/functions/wp_remote_get/` |

The HTTP record carries **two** `source_files` entries: the spec mandates the `wp_remote_get` reference page citation to ground the `is_wp_error` error-handling acceptance point (the overview page does not show it).

### Data flow

`scenario.yaml` (discovery + judge input) → scaffold writes plugin `plugin-<name>-<agentId>` → testing agent edits `index.php` (registrations/calls on `init` / `template_redirect` / `register_activation_hook`) → judge grades code against `acceptance` → for `common-apis-rewrite-rule` only: `verify-e2e.ts` boots `wp-env` → `e2e.spec.mjs` activates the plugin (its activation hook flushes rewrite rules), issues `page.request.get(pinned-url)`, and asserts status 200 + body contains the pinned token → the test-runner JSON report → harness maps failures back per (scenario, agent). The three judge-only scenarios stop at the judge step (no e2e). The catalog file feeds nothing in this flow; it is a committed planning artifact read by humans and future reviews.

## Key Decisions

### Decision: Adopt a four-scenario batch — one e2e (Rewrite) + three judge-only (Options, Transients, HTTP); dedup is the governing selection criterion

- **Choice:** Implement `common-apis-rewrite-rule` (e2e, raw-HTTP assertion), `common-apis-options` (judge-only), `common-apis-transients` (judge-only), and `common-apis-http-request` (judge-only). Select only genuinely uncovered Common APIs sub-areas; do not re-do Metadata / Shortcode / Settings / Cron / i18n (already covered).
- **Alternatives:** A larger batch including already-covered sub-areas (rejected — duplicates existing scenarios at the chapter+function level); a larger e2e-only batch (no second uncovered Common APIs sub-area yields a clean, theme-independent front-end assertion — Options/Transients/HTTP are data-oriented with no front-end surface); skip the judge-only scenarios (would under-cover the area's three uncovered data-oriented sub-areas).
- **Trade-offs:** The Common APIs Handbook overlaps heavily with the Plugin Handbook, so the candidate set after dedup is small, and only the Rewrite API is cleanly front-end-assertable. One e2e + three judge-only covers the four uncovered sub-areas at the right verification fidelity for each. A smaller batch than some prior reviews is explicitly permitted by the intent given the overlap. The judge-only pattern is already established (`cron-event`, `admin-menu-page`, `i18n-textdomain`).
- **Traces to:** Requirements 1, 2, 4, 5; Acceptance Criteria 1, 2, 4, 5.

### Decision: The Options API scenario is distinct from `settings-register`

- **Choice:** Ship `common-apis-options` as a direct imperative store-and-retrieve via `add_option`/`update_option`/`get_option`, treated as a separate sub-area from `settings-register`.
- **Alternatives:** Treat Options and Settings as one sub-area and skip Options as a duplicate (rejected — they are different handbook chapters with zero function overlap and different mental models).
- **Trade-offs:** `settings-register` registers a setting's schema for admin/REST to manage and never reads or writes the option value; the Options API imperatively stores and retrieves a value. The distinction is real at the chapter + distinct-function level, so the scenario is non-duplicative. The prompt must be framed as "store and read a value imperatively," not "register a setting for the admin UI," to keep the distinction crisp.
- **Traces to:** Requirements 2, 3; Acceptance Criterion 2.

### Decision: The Rewrite e2e asserts the raw HTTP response (`page.request.get` + status 200 + body token), not `page.goto` + DOM

- **Choice:** The Rewrite spec uses `page.request.get(pinned-url)` with two assertions — `expect(await resp.text()).toContain(pinned-token)` (primary) and `expect(resp.status()).toBe(200)` (secondary) — following the `cpt-register` / `rest-api-route-validation` lifecycle. The plugin registers the rule + a custom query var on `init`, hooks `template_redirect` to `status_header(200)` + echo the token + `exit`, and flushes on activation.
- **Alternatives:** `page.goto(url)` + `page.locator("body").toContainText(token)` (couples the assertion to the theme's 404/template pipeline; an unregistered query var or missing handler 404s into a themed page — wrong shape, theme-dependent); assert status alone (a routed-but-wrong response could still 200 without the token — the token is the true signal); register the rule without a query var / without a `template_redirect` handler (404s by default — see the gotcha below).
- **Trade-offs:** A custom rewrite rule mapping to a custom query var 404s by default unless the var is registered and a `template_redirect` handler explicitly emits a 200 + body + exit. `page.request.get` reads the plugin's raw output directly and is theme-independent; the body token is the only assertion that proves both the URL routed AND the handler ran; the 200 check guards against a 404 fallthrough. This reuses an existing assertion shape (no new helper, no new pattern). Without `exit` the response would also include theme output, but the assertion is a `toContain` (not equality), so a correct token still passes — low residual risk.
- **Traces to:** Requirements 4, 8; Acceptance Criteria 3, 4, 7.

### Decision: Bake the query-var-registration + handler requirement into the Rewrite prompt and acceptance

- **Choice:** The prompt steers the agent to a custom URL that **returns a specific response** (the pinned token at the pinned path); the acceptance requires the URL to return 200, requires the body to contain the pinned token, and requires the plugin to intercept the request and output its response before any theme template renders.
- **Alternatives:** A prompt that asks only to "register a custom URL" (verified to 404 — a bare `add_rewrite_rule()` without registering the query var strips the var, finds no post, and core sets `is_404()`); asserting only the status (a routed-but-empty or themed response can still 200 without the plugin's token).
- **Trade-offs:** Without this, a reasonable agent could call `add_rewrite_rule()` alone and the URL would 404, making the e2e a false negative on partially-correct intent — but for the *right* reason (the implementation is incomplete). Pinning "returns this exact text at this exact URL" + requiring the intercept steers the agent to the complete pattern (rule + query var + handler + flush) without naming the functions. A failing grade against the current skill is still acceptable per the spec; a well-formed agent following the prompt produces a routable, 200-returning URL.
- **Traces to:** Requirements 7, 8, 10; Acceptance Criteria 6, 7, 9.

### Decision: The Rewrite scenario is self-contained via an activation-hook flush (no new harness infrastructure)

- **Choice:** Register the rewrite rule on `init` and flush once via `register_activation_hook(__FILE__, 'flush_rewrite_rules')`, so the URL routes the first time the test navigates to it. No permalink-structure setup step; pretty permalinks are on by default in this harness.
- **Alternatives:** Flush on every `init` load (wasteful and discouraged by the docs); add a harness step to set the permalink structure or flush externally (unnecessary — pretty permalinks are on by default in `@wordpress/env` ≥ 11.0.0, pinned `^11.4.0`, and `requestUtils.activatePlugin` fires the activation hook).
- **Trade-offs:** The one-time activation flush is the documented idiom and is exactly what `activatePlugin` triggers, so the rule is live on first navigation with zero new harness infrastructure and no new `eval/utils/` helper. The scenario stays one plugin edit on a load-time hook plus the activation flush.
- **Traces to:** Requirements 5, 6; Acceptance Criteria 5, 6.

### Decision: Reframe the Transients scenario as a standalone cache-with-expiry, decoupled from any HTTP call

- **Choice:** `common-apis-transients` caches an arbitrary computed value with an expiry (check transient → recompute if missing/expired → store with TTL), with **no HTTP call** in the prompt, acceptance, or mechanism. The legacy `transient-cache-remote-data` stub is renamed and reframed on promotion.
- **Alternatives:** Keep the legacy stub's framing (cache a remote API response) — rejected, because it over-couples the Transients sub-area to the HTTP API sub-area and would make the Transients and HTTP scenarios overlap.
- **Trade-offs:** The canonical Transients doc example is a standalone cache (e.g. a `WP_Query` result cached for `12 * HOUR_IN_SECONDS`), not a remote fetch. Decoupling keeps the Transients scenario a clean single concept and keeps it distinct from `common-apis-http-request`. The prompt must NOT mention fetching from a URL or remote data.
- **Traces to:** Requirements 5, 13, 14; Acceptance Criteria 4, 14.

### Decision: The HTTP scenario grades the PHP pattern statically — no live call, no live-200 criterion, endpoint-agnostic prompt

- **Choice:** `common-apis-http-request` is judge-only and grades the three-part pattern from the produced PHP — makes the outbound request, checks `is_wp_error()` before using the response, reads the body with `wp_remote_retrieve_body()`. No `e2e.spec.mjs`, no live external request, no live-200 acceptance, no specific host pinned in the prompt.
- **Alternatives:** Ship an e2e that performs a live request and asserts a 200 (rejected — depends on outbound network and a live external service, which the eval environment may not have, and the spec forbids it); pin a specific external host (rejected — the prompt must be endpoint-agnostic).
- **Trade-offs:** Grading the pattern statically makes the scenario deterministic and independent of network availability; the three-part pattern is readable from the produced code without running it. The `is_wp_error()` acceptance point is grounded to the `wp_remote_get` reference page (which documents the `WP_Error` return type), since the overview page does not show error handling.
- **Traces to:** Requirements 4, 9, 13; Acceptance Criteria 4, 8, 13; Out of Scope 10.

### Decision: Pin every e2e-asserted literal in the prompt; keep prompts tool-agnostic; provenance only in the catalog

- **Choice:** The Rewrite scenario's two asserted literals — the URL path and the body token — are stated in its `prompt`. The judge-only scenarios pin their option/transient keys in their prompts (HTTP names no host). Prompts are user-voice, outcome-phrased, and never name the tool/API/function/hook/framework. `acceptance` strings are clean checks with no embedded URLs. Source URLs live only in the catalog record's `source_files`.
- **Alternatives:** Embed source URLs in the `scenario.yaml`; name the API/function/hook in the prompt; let the agent choose the asserted URL or token.
- **Trade-offs:** The spec bars catalog-only fields and URLs from `scenario.yaml` and requires tool-agnostic prompts; pinning the asserted URL and token keeps the e2e deterministic without naming the mechanism, and keeping prompt and assertion in lockstep means any phase-4 rewording must change both together. Phase 4 may choose a different clean slug/token but must pin it in the prompt and match it verbatim in the e2e.
- **Traces to:** Requirements 8, 10, 11; Acceptance Criteria 9, 10.

### Decision: Add zero new shared rubrics; every scenario declares `rubrics: []`

- **Choice:** Add no files under `eval/rubrics/`; each scenario carries its checks in `acceptance` and declares the explicit empty array `rubrics: []`.
- **Alternatives:** A shared "registers/calls on a load-time hook" rubric across the batch.
- **Trade-offs:** No single check recurs uniformly across all four in a form general enough to share without duplicating per-scenario acceptance points (which the spec forbids): the exercised surface differs per scenario (a routed URL vs an option store/retrieve vs a cache-with-expiry vs an outbound request with error handling). The spec permits zero rubrics when no genuinely cross-cutting check emerges; this mirrors prior reviews' outcome. The `rubrics:` key is always present as an array (required for discovery).
- **Traces to:** Requirement 12; Acceptance Criterion 11.

### Decision: Apply `common-apis-*` pseudo-folder naming; rename the two stub records; do not re-litigate the folders question or rename existing scenarios

- **Choice:** All four new scenarios use the `common-apis-<concept>` prefix as flat immediate children (directory name == `scenario.yaml` `name` == catalog record `name`). The Options and Transients records are renamed off the legacy `options-api-store-retrieve` / `transient-cache-remote-data` names to `common-apis-options` / `common-apis-transients`. The Rewrite and HTTP scenarios use brand-new `common-apis-*` names. Existing scenarios are not renamed.
- **Alternatives:** Real subdirectories (`eval/scenarios/common-apis/<name>/`) — review-2 classified these as not low-risk (require an uncommittable change to Skillsmith's non-recursive discovery, plus fixing the `../../utils` import depth and `verify-e2e.ts` attribution); keep the legacy stub names — would leave two identities without the prefix and is a stale legacy framing (especially for Transients, which is reframed).
- **Trade-offs:** The prefix delivers visual grouping at zero harness risk, every scenario remaining a flat immediate child whose name matches `/^[a-z0-9-]+$/`. Renaming the two stub **records** (not scenarios — no shipped directory exists for them yet) brings all four identities under the `common-apis-` prefix. The forward inconsistency (prefixed Common APIs scenarios beside non-prefixed older scenarios) is accepted and out of scope.
- **Traces to:** Requirements 13, 19; Acceptance Criteria 12, 18.

### Decision: Promote+rename two stubs, add two full records, leave the Plugins `http-api-remote-get` stub untouched; confine all edits to the Common APIs section + one header line

- **Choice:** Rename+promote `options-api-store-retrieve` → full `common-apis-options` and `transient-cache-remote-data` → full `common-apis-transients` (reframed); add `common-apis-rewrite-rule` and `common-apis-http-request` full records; place all four under an `# Implemented Common APIs scenarios — full records` sub-header; fix the one stale header line. Leave the Plugins `http-api-remote-get` stub byte-untouched. Create no Common APIs `# Deferred:` comment (both stubs are now promoted) and no new stub for Database/Filesystem. `_candidates.yaml` and all non-Common-APIs records are byte-untouched.
- **Alternatives:** Re-home the Plugins `http-api-remote-get` stub into the Common APIs area (rejected — the spec forbids moving/renaming/promoting/annotating it; non-Common-APIs records are a hard untouched constraint); add a deferred Common APIs stub for the promoted concepts (rejected — both stubs are implemented, so none should carry a `# Deferred:` comment); add new stubs for Database/Filesystem (rejected — the stub rule is scoped to sub-areas that already have a stub; neither does).
- **Trade-offs:** Mirrors the Themes/Block Editor/REST API reconciliation precedent: full records 1:1 with implemented scenarios, no orphaned stub duplicating an implemented sub-area, no name mismatch between any record and its scenario directory. The resulting **near-duplicate** — an un-promoted Plugins `http-api-remote-get` stub (grounded to `/plugins/http-api/`) plus a new Common APIs `common-apis-http-request` record (grounded to `/apis/making-http-requests/`) — is **accepted**, because the HTTP API is legitimately documented in both handbooks and "non-Common-APIs catalog records untouched" is a hard constraint; the duplication is the lesser cost. Confining edits to the Common APIs section + one header line keeps the iAPI catalog and all other areas intact — a correctness invariant phase 4/5 must diff-check.
- **Traces to:** Requirements 13, 14, 15, 16, 17, 18, 19; Acceptance Criteria 12, 13, 14, 15, 16, 17, 18.

### Decision: Defer the Database (`$wpdb`) and Filesystem (`WP_Filesystem`) sub-areas — record the reasons here only, add no catalog entry

- **Choice:** Do not implement Database or Filesystem; add no new catalog stub for either; record their defer reasons only in the spec and this design doc.
- **Alternatives:** Implement one of them (neither fits the "simple, one concept, tool-agnostic" bar); add a deferred stub (rejected — the stub rule is scoped to sub-areas that already have a stub; neither has one today).
- **Trade-offs:** **Database (`$wpdb`):** raw `$wpdb` is non-idiomatic for simple tasks (the docs steer to the higher-level Options/Transients/Metadata APIs), a realistic custom-data scenario needs a custom table (multi-concept), and a tool-agnostic user-voice prompt cannot express it without naming the database. **Filesystem (`WP_Filesystem`):** requires multi-step credential bootstrapping tied to an admin/credentials-prompt context, which fails the "simple, one concept" bar and is awkward to express tool-agnostically. Both lack a catalog stub today, so per the intent's stub rule they receive no new entry; their defer reasons live in the spec and this design doc only.
- **Traces to:** Requirements 17; Acceptance Criteria 16, 22; Out of Scope 1, 2.

### Decision: Static / structural verification only; scenarios not required to pass; skill untouched

- **Choice:** Verify the four scenarios are Skillsmith-discoverable (scenario-shape check) and that `common-apis-rewrite-rule/e2e.spec.mjs` is test-runner-collectable (parses + imports resolve) such that running Skillsmith on the scenario directory would execute to a graded result without harness/configuration errors. Do not boot `wp-env` for a real pass, run the full `scenarios × testing-agents` matrix, or generate plugin code. Modify nothing under `skills/wordpress-development/`.
- **Alternatives:** Run the scenarios against the current skill and require passing grades.
- **Trade-offs:** The scenarios lead and the skill catches up later; a failing grade against the current skill is acceptable per the spec. The bar is well-formedness / runnability, matching prior reviews.
- **Traces to:** Requirements 20, 21, 22; Acceptance Criteria 19, 20, 21.

## Dependencies

All dependencies already exist in the repo; this review introduces **no new** dependency and adds **no new** `eval/utils/` helper.

- **Internal:** `eval/utils/scaffold-plugin.ts`, `eval/utils/verify-e2e.ts`, `eval/utils/wp-cli.mjs` (`deactivateAllPlugins`), `playwright.config.ts`, the `eval/scenarios/cpt-register/` reference pattern (the no-seeding raw-HTTP front-end e2e lifecycle), the existing judge-only Plugins scenarios (`cron-event`, `admin-menu-page`, `i18n-textdomain`) as the judge-only precedent, and the existing `eval/scenarios/_wp-dev-candidates.yaml` (catalog precedent shape; Common APIs section edited, rest untouched).
- **External (already present):** `@automattic/skillsmith` (discovery, scaffold orchestration, judge); `@wordpress/e2e-test-utils-playwright` (`test`, `expect`, `requestUtils.activatePlugin`, `page.request.get` — exactly the set `cpt-register` uses; no `createPost` / `rest` here); `@wordpress/scripts`; `@wordpress/env` (`wp-env` runtime, pretty permalinks on by default at the pinned `^11.4.0`); the test runner (Playwright).
- **Runtime version note (not a new dependency):** the scaffolded plugin hosts PHP-only registrations/calls in `index.php` — `add_rewrite_rule` + a `query_vars` filter (or `add_rewrite_tag`) on `init`, a `template_redirect` handler, `register_activation_hook(__FILE__, 'flush_rewrite_rules')`; `add_option`/`update_option`/`get_option`; `set_transient`/`get_transient`; `wp_remote_get`/`is_wp_error`/`wp_remote_retrieve_body`. All are long-standing core APIs. `wp-env` fetches a recent WordPress at env-start, so every API used is present. No theme/block artifact is needed.
- **Documentation (selection/acceptance grounding, not a runtime dependency):** the developer.wordpress.org pages cited per scenario and in the catalog `source_files` — `/apis/rewrite/`; `/apis/options/` + `/reference/functions/get_option/`; `/apis/transients/` + `/reference/functions/set_transient/`; `/apis/making-http-requests/` + `/reference/functions/wp_remote_get/`. All were verified live during research.

## Failure Modes and Observability

- **Scenario not discovered:** a directory not placed as a flat immediate child of `eval/scenarios/`, or missing `scenario.yaml`, is silently skipped by Skillsmith's non-recursive discovery. Mitigation: all four use the flat `common-apis-*` layout, each with a `scenario.yaml`.
- **Malformed `scenario.yaml`:** Skillsmith's shape check requires `rubrics` present as an array; an omitted key (`undefined`) or a valueless `rubrics:` (`null`) silently fails discovery and the scenario is never graded. Mitigation: every scenario declares `rubrics: []` explicitly; `name`/`description`/`skills`/`prompt`/`acceptance` are all present and well-typed.
- **Invalid `name`:** `scaffold-plugin.ts` throws if `name` (or `agentId`) does not match `/^[a-z0-9-]+$/`. All four `common-apis-*` names conform (hyphens only, no underscores).
- **Wrong plugin slug in the e2e:** the Rewrite spec must activate `plugin-common-apis-rewrite-rule-${workerInfo.project.metadata.agentId}`; activating any other slug errors. Mitigation: the spec derives the slug from `name` (== directory name) exactly as `cpt-register` does.
- **Spec import depth:** `../../utils/wp-cli.mjs` resolves only because the scenario directory is a flat immediate child — the reason the flat `common-apis-*` layout is required (nesting would resolve `../../utils` to a nonexistent path and break collection).
- **`deactivateAllPlugins()` call style:** it is called **sync** (no `await`) in both `beforeAll` and `afterAll` in every existing spec. The Rewrite spec must follow the same style; an erroneous `await` is a deviation phase 4 must avoid.
- **Rewrite query-var / handler gotcha (the primary Rewrite failure mode):** an `add_rewrite_rule()` call alone — without registering the custom query var and without a `template_redirect` handler — 404s by default (the var is stripped, no post is found, core sets `is_404()`). The body token then never appears and the e2e fails. Mitigation baked into the design: the acceptance requires a 200, requires the body to contain the pinned token, and requires the plugin to intercept the request and output its response before any theme template renders.
- **Missing `status_header(200)` / `exit`:** without `status_header(200)`, core may have already set a 404 header in the main query before `template_redirect` fires, so the status assertion fails. Without `exit`, WordPress continues rendering theme output after the token; the `toContain` body assertion still passes (it is not an equality check), but the response is larger than intended — low residual risk. Mitigation: the acceptance includes "returns HTTP status 200" and "stops further rendering."
- **Activation flush missing:** if the agent registers the rule on `init` but never flushes on activation, the rule may not be live on first navigation and the URL 404s. Mitigation: the acceptance requires flushing once on plugin activation.
- **Judge-only grading depends on the produced PHP, not a render (intentional):** the Options, Transients, and HTTP scenarios have no front-end observable surface (Options/Transients) or no live call by design (HTTP), so they are judge-only — mirrors the existing judge-only Plugins scenarios. Not a defect.
- **HTTP scenario has no live dependency (intentional):** the HTTP scenario does not perform a live request, asserts no live-200, and pins no host, so it does not depend on outbound network or an external service being up. The graded signal is the `is_wp_error()` error-check pattern, not response content.
- **Expected non-failure:** per the spec, a *failing grade against the current skill* is acceptable and is not a harness error. The bar (Acceptance Criterion 19) is that each scenario runs to a graded result and the Rewrite e2e parses, resolves imports, and executes without harness/configuration errors.
- **Catalog edits confined to the Common APIs section (correctness invariant):** only Common APIs records and the one header line may change; the iAPI `_candidates.yaml`, the Plugins `http-api-remote-get` stub, and all other non-Common-APIs records in `_wp-dev-candidates.yaml` must be byte-untouched. Phase 4/5 must diff-check this.
- **Observability:** e2e failures surface through the test runner's JSON report, which `verify-e2e.ts` parses into per-(scenario, agent) failure records; judge results (including the three judge-only scenarios) surface through Skillsmith's grading output; `wp-env` start/stop and build steps log to stdout/stderr.

## Risks and Open Questions

These are phase-4 confirmations (latitude, not blockers) and recorded risks; all design-blocking questions are resolved.

- **Rewrite custom query var must be registered + the handler must emit and exit (RESOLVED into the design).** A bare `add_rewrite_rule()` 404s; the prompt steers to "a custom URL that returns this exact text," and the acceptance requires 200 + the token + an intercept-before-template. Flagged for phase 4 so the prompt cannot read as "register a URL pattern" alone.
- **Exact pinned URL slug for `common-apis-rewrite-rule` (phase-4 latitude, NOT blocking).** Recommended `/my-custom-page`. Phase 4 may choose any clean slug unlikely to collide with a fresh `wp-env` page, but MUST pin it verbatim in the prompt and match it exactly in the e2e `page.request.get(...)`.
- **Exact pinned body token for `common-apis-rewrite-rule` (phase-4 latitude).** Recommended `Hello from my plugin`. MUST be pinned in the prompt and matched with `toContain(token)` in the e2e. Prompt ↔ assertion lockstep (Requirement 10).
- **Exact pinned option key for `common-apis-options` (phase-4 latitude).** Recommended `my_plugin_setting` — must be namespaced (not a bare WP core key). Pinned in the prompt, graded in acceptance.
- **Exact pinned transient key for `common-apis-transients` (phase-4 latitude).** Recommended `my_plugin_data` — a namespaced string literal. Pinned in the prompt, graded in acceptance.
- **Transients scenario must stay decoupled from HTTP (RESOLVED into the design).** The prompt must NOT mention fetching from a URL or remote data; the cache holds any computed value. This keeps it distinct from `common-apis-http-request`.
- **HTTP scenario must have no live-200 criterion and pin no host (RESOLVED into the design).** The graded signal is the make-request → check-error → read-body pattern, readable from the PHP. No live request, no live 200, no specific host.
- **Exact wording of prompts / acceptance (phase-4 task).** Phase 4 writes the final user-voice, tool-agnostic text (no function/hook names, no URLs in `scenario.yaml`). The design fixes the mechanism, the hooks, and the pinned literals; the prose is a phase-4 task. The acceptance drafts above are guidance, not final copy.
- **Catalog full-record order within the sub-header (phase-4 latitude).** Any consistent order within `# Implemented Common APIs scenarios — full records`; recommended Options, Transients, Rewrite Rule, HTTP Request (matching the promotion + addition order).
- **Accepted near-duplicate HTTP records (recorded, intentional).** An un-promoted Plugins `http-api-remote-get` stub (`/plugins/http-api/`) coexists with the new `common-apis-http-request` record (`/apis/making-http-requests/`). Accepted because the HTTP API is documented in both handbooks and the Plugins stub is a hard untouched constraint. Phase 4/5 must NOT touch the Plugins stub.
- **Catalog edits confined to the Common APIs section (correctness, must-hold).** Only Common APIs records + the one header line may change; the iAPI `_candidates.yaml`, the Plugins `http-api-remote-get` stub, and all other non-Common-APIs records must be byte-untouched (Requirements 16, 18, 19 / Acceptance Criteria 15, 18). Phase 4/5 must diff-check this.
- **Database (`$wpdb`) and Filesystem (`WP_Filesystem`) deferred (per spec).** Neither is implemented; neither gets a new catalog stub (neither has a stub today); their defer reasons live in the spec and this design doc only. See the deferral decision above for the reasons.
- **Naming forward inconsistency (recorded, out of scope).** The new `common-apis-*` scenarios sit beside non-prefixed older scenarios and the already-prefixed `themes-*` / `block-editor-*` / `rest-api-*` sets. A suite-wide rename is out of scope; existing scenarios are NOT renamed.
- **Static / structural verification only (intentional).** No agent boots `wp-env` for a real pass, runs the full `scenarios × testing-agents` matrix, or generates plugin code; the skill is untouched. The bar is discoverable + e2e-collectable.
