# Code Plan: Common APIs scenarios

## Overview

This batch ships **five artifacts** under `eval/` (the Skillsmith eval suite), none of them touching the `wordpress-development` skill: **four new Common APIs scenario directories** under `eval/scenarios/` using the adopted `common-apis-*` pseudo-folder naming convention (all flat immediate children of `eval/scenarios/`), plus an **in-place edit of the existing catalog** `eval/scenarios/_wp-dev-candidates.yaml`. The four scenarios are `common-apis-rewrite-rule` (a custom pretty URL via the Rewrite API — ships a `scenario.yaml` **and** an `e2e.spec.mjs`), `common-apis-options` (store-and-retrieve a value via the Options API — `scenario.yaml` only, judge-only), `common-apis-transients` (cache a value with an expiry via the Transients API — `scenario.yaml` only, judge-only), and `common-apis-http-request` (fetch data from an external web service via the HTTP API — `scenario.yaml` only, judge-only). The "code" produced here is **scenario-definition and catalog data**, not WordPress plugin code — the plugin under test is authored at run time by the Skillsmith testing agent as a single `index.php` edit on global hooks (`init`, `template_redirect`, and for the Rewrite scenario `register_activation_hook`). The plan is **one task per scenario (4) plus one task for the catalog edit (5 total)**; all tasks are **independent with no cross-task ordering dependencies** (numbered for reference only, executable in any order or in parallel). The batch adds **zero** new rubrics, reorganizes/renames none of the existing scenarios, leaves the iAPI `eval/scenarios/_candidates.yaml` and all non-Common-APIs records in `_wp-dev-candidates.yaml` (including the Plugins `http-api-remote-get` stub) untouched, and modifies no file under `skills/wordpress-development/`. The one e2e lifecycle mirrors `eval/scenarios/cpt-register/e2e.spec.mjs` (no-seeding, raw-HTTP `page.request.get` + status + body) — no new `eval/utils/` helper is added.

### The `common-apis-` naming convention (the structural element)

All four new scenarios use the prefix `common-apis-<concept>` as their **directory name**, their `scenario.yaml` `name`, and their **catalog record `name`** — identical in all three places, each matching `/^[a-z0-9-]+$/`. This is the adopted "pseudo-folder" organization carried over from review-2: it visually clusters Common APIs scenarios when `eval/scenarios/` is listed and sorted, while every scenario remains a **flat immediate child** of `eval/scenarios/`. No filesystem nesting is introduced, so Skillsmith discovery, the e2e lifecycle, `verify-e2e.ts` spec-location/attribution, Playwright collection, and the scaffold are all unchanged. The four names are `common-apis-rewrite-rule`, `common-apis-options`, `common-apis-transients`, and `common-apis-http-request`; none collides with an existing scenario directory (no existing dir carries a `common-apis-` prefix — verified). The existing scenarios are **NOT** renamed. The legacy stub names `options-api-store-retrieve` and `transient-cache-remote-data` are **NOT** carried forward — they are renamed (a **catalog-record** rename only; no shipped scenario directory exists for them yet) to `common-apis-options` and `common-apis-transients`. The folders question is not re-litigated here — review-2 adopted this convention; this review applies it.

### Type field — why all five tasks are Type `e2e`

There is **no unit-testable production module** in this batch. The plugin PHP (the global-hook registrations/calls in `index.php`) that would be unit-tested is authored by the testing agent at run time, not by this phase; the catalog is a config/data file. The only writer suited to producing scenario definitions and the one Playwright spec is **`code-writer-e2e`**, so every task is **Type `e2e`** (there is no meaningful `tdd` RED/GREEN unit cycle — a `tdd` task would have no production module to test). Of the five tasks, **only Task 1 (`common-apis-rewrite-rule`) produces an `e2e.spec.mjs`**; **Tasks 2, 3, and 4 are judge-only (`scenario.yaml` only, no spec)**, and **Task 5 (catalog edit) produces no `e2e.spec.mjs` and no scenario directory** (its deliverable is the single catalog file edited in place). Each task's Changes and Acceptance state this explicitly so the writer does not author a spec where none is wanted.

### Verification bar (static/structural only)

Per the spec (Acceptance Criterion 19) and the design ("Static / structural verification only"), verification is **static/structural only**. The bar per artifact:
- Each `scenario.yaml` is **discoverable** — passes Skillsmith's scenario-shape check (`name`/`description`/`skills`/`prompt`/`acceptance` present and well-typed; `rubrics` present as an array). Running Skillsmith on the scenario directory would execute to a graded result without harness/configuration errors. A **failing grade against the current skill is acceptable** and does not violate the bar.
- The one `e2e.spec.mjs` (Task 1) is **loadable/collectable by the test runner** — it parses and its imports resolve (verifiable with `node --check` and Playwright collection). Its `../../utils/wp-cli.mjs` import (two-level depth) resolves precisely because the scenario directory is a flat immediate child of `eval/scenarios/`.
- The edited catalog `_wp-dev-candidates.yaml` **parses as valid YAML** and is **NOT discovered as a scenario** (it is a non-directory leading-underscore file, skipped by Skillsmith's non-directory guard).

Agents do **NOT** run the full `npx skillsmith` / `scenarios × testing-agents` matrix, do **NOT** boot `wp-env`, and do **NOT** generate the plugin code.

## Guardrail scopes

**No project guardrails.** This project defines no scoped gates, so there is no guardrail scope to fill.

| Gate | Scope |
| ---- | ----- |
| None | None |

## E2E test plan

Only **`common-apis-rewrite-rule`** ships an `e2e.spec.mjs`; the three judge-only scenarios (`common-apis-options`, `common-apis-transients`, `common-apis-http-request`) and the catalog edit ship **no** spec — their `acceptance` points are graded by the judge against the produced PHP. The single e2e spec is a Playwright spec run by `eval/utils/verify-e2e.ts` inside a `wp-env` runtime; it **deactivates all plugins, then activates exactly its own scaffolded plugin** (`plugin-common-apis-rewrite-rule-${workerInfo.project.metadata.agentId}` — derived, never hard-coded) in `beforeAll`, and **deactivates all plugins** in `afterAll`. The lifecycle is fixed by the existing `cpt-register` spec: `beforeAll` calls `deactivateAllPlugins()` (sync, **no** `await`) then `await requestUtils.activatePlugin(...)`; `afterAll` calls `deactivateAllPlugins()` (sync, **no** `await`); **no content is seeded**.

The assertion shape is a **raw HTTP response** check (`page.request.get(url)` + `status()` + `text()`) — the canonical `cpt-register` / `rest-api-route-validation` shape, **not** `page.goto` + DOM. The reason is load-bearing and specific to rewrite rules: a custom rewrite rule that maps a pretty URL to a **custom query var** produces a **404 by default** unless the plugin (a) registers the custom query var so the rule's target var survives parsing, and (b) hooks `template_redirect` to detect the var, send `status_header(200)`, echo a deterministic body token, and `exit` before any theme template renders. With that handler the response body is **entirely the plugin's output** — theme-independent and deterministic. The **body token is the primary success signal** (it appears only if the URL routed AND the handler ran); the **200 status is secondary defense-in-depth** (it confirms no 404 fallthrough). `page.goto` + DOM would couple the assertion to the theme's 404/template pipeline and is the wrong shape; `page.request.get` reads the plugin's raw output directly. The two asserted literals — the URL path (recommended `/my-custom-page`) and the body token (recommended `Hello from my plugin`) — are **both pinned in that scenario's prompt**, keeping prompt and assertion in lockstep.

### Flow 1: A custom pretty URL returns the plugin's pinned response (Rewrite API)

- **Steps:** Deactivate all plugins (sync); activate `plugin-common-apis-rewrite-rule-<agentId>` (slug derived from `workerInfo.project.metadata.agentId`) in `beforeAll` — its activation hook flushes rewrite rules so the custom URL routes the first time. **No content seeding.** Issue a raw HTTP GET to the pinned URL path: `const resp = await page.request.get("/my-custom-page");`.
- **Expected:** The custom URL routes to the plugin's handler, which emits a 200 with the pinned token as its body — `expect(resp.status()).toBe(200);` and `expect(await resp.text()).toContain("Hello from my plugin");`. This proves the rule matched (URL routed), the custom query var was registered (the var survived parsing instead of being stripped to a 404), and the `template_redirect` handler ran (emitted the token before any theme template). The body-token `toContain` is the primary signal; the `status() === 200` check guards against a 404 fallthrough. (Per the query-var/handler gotcha, a bare `add_rewrite_rule()` without the query var and without the handler 404s and never emits the token — failing this flow for the right reason, which is acceptable per the spec, as the scenario is not required to pass against the current skill.) Cleanup: `deactivateAllPlugins()` (sync) in `afterAll`.
- **Traces to:** Acceptance criteria 3 (the only e2e sub-area), 4 (i), 6, 7, 9; Design "Scenario 1 — `common-apis-rewrite-rule`". Pinned literals: URL path `/my-custom-page` and body token `Hello from my plugin` (both also stated verbatim in the prompt).

The three judge-only scenarios contribute **no** Flow: `common-apis-options` (Options store/retrieve on `init`), `common-apis-transients` (cache-with-expiry on `init`), and `common-apis-http-request` (outbound request + error handling on a load-time hook) have no front-end-observable surface (the data lives in the options/transient store; the HTTP scenario performs no live call by design), so they are graded solely by the judge against the produced PHP — mirroring the existing judge-only Plugins scenarios (`cron-event`, `admin-menu-page`, `i18n-textdomain`).

## Tasks

> **Shared conventions for ALL five tasks** (transcribe faithfully — these are design-doc obligations, not new decisions):
>
> **Scenario tasks (1–4):**
> - Each task creates exactly one directory `eval/scenarios/<dir>/` that is a **flat immediate child** of `eval/scenarios/` (no nesting). Task 1 contains **two** files (`scenario.yaml` + `e2e.spec.mjs`); Tasks 2, 3, and 4 contain **one** file (`scenario.yaml` only — they are judge-only and ship **no** `e2e.spec.mjs`).
> - `scenario.yaml` keys, in this order: `name`, `description`, `skills` (as a list item `- wordpress-development`), `prompt` (block scalar `|`), `acceptance` (list), `rubrics: []`. **`rubrics: []` must be present as an explicit empty array** — an omitted key (`undefined`) or a valueless `rubrics:` (parsed as `null`) fails Skillsmith's shape-check (`Array.isArray(...)` is `false` for both) and the scenario is silently skipped and never graded. Do **not** add any file under `eval/rubrics/`.
> - **No catalog-only fields** (`difficulty`, `concepts`, `source`, `source_files`) appear in any `scenario.yaml`, and **no source URL** appears anywhere in a `scenario.yaml` — those live only in the catalog record (Task 5).
> - `name` equals the directory name for every scenario in this batch (e.g. `common-apis-rewrite-rule` → slug `plugin-common-apis-rewrite-rule-<agentId>`). Names contain hyphens only (no underscores) and match `/^[a-z0-9-]+$/`.
> - The `prompt` is **user-voice, outcome-phrased, and tool-agnostic**: it must **NOT** name the tool/API/function/hook/framework. Specifically it must NOT mention `add_rewrite_rule`, `flush_rewrite_rules`, `register_activation_hook`, `template_redirect`, `query_vars`, `add_rewrite_tag`, `add_option`, `update_option`, `get_option`, `set_transient`, `get_transient`, `wp_remote_get`, `is_wp_error`, `wp_remote_retrieve_body`, "Rewrite API", "Options API", "Transients API", "HTTP API", `index.php`, or any function/hook/API name. It **MAY** name a user-facing pinned literal (the URL path, the body token, the option key, the transient key). The literal-pinning convention follows `cpt-register` / `themes-enqueue-assets`: hard-pin the literal in backticks inside a user-voice sentence (e.g. "Serve the exact text `Hello from my plugin` at the URL `/my-custom-page`"). Keep each pinned literal and its assertion/acceptance target in **lockstep** — if any literal is reworded, the prompt, the e2e assertion (Task 1), the acceptance, and the catalog record (Task 5) change together.
> - The `acceptance` strings are **clean, human-readable check statements with NO embedded source URLs**. Provenance (developer.wordpress.org URLs) lives only in the catalog record's `source_files` (Task 5).
> - These are **Type `e2e`** tasks (see "Type field" in Overview): the writer is `code-writer-e2e`.
>
> **Catalog task (5):** **edits the existing file** `eval/scenarios/_wp-dev-candidates.yaml` in place (it already exists — MODIFY, do not recreate), and produces **no `e2e.spec.mjs`** and **no scenario directory**. Only the Common APIs section (and the one stale header line) is touched. See Task 5 for its structure.
>
> **No-disruption obligation (all tasks):** do not modify, move, or rename any existing scenario directory, the existing `eval/scenarios/_candidates.yaml` (iAPI catalog), any non-Common-APIs record in `_wp-dev-candidates.yaml` (including the Plugins `http-api-remote-get` stub), any file under `eval/rubrics/`, any file under `eval/utils/`, or any file under `skills/wordpress-development/`.
>
> **Pinned literals (fixed by the design — recommended values; if a literal is changed it MUST be pinned in the prompt and matched verbatim in the e2e (Task 1, where applicable) and appear identically in the catalog record (Task 5)). Use the chosen values verbatim in prompt, e2e assertion (Task 1), acceptance, and catalog record:**
> - Scenario 1 (`common-apis-rewrite-rule`): URL path `/my-custom-page` and body token `Hello from my plugin`. These are the **only** two literals the e2e asserts (`page.request.get("/my-custom-page")` and `toContain("Hello from my plugin")`).
> - Scenario 2 (`common-apis-options`): a namespaced option key (recommended `my_plugin_setting`, NOT a bare WP core key) and a value/default (recommended `enabled`). Pinned in the prompt, graded in acceptance (judge-only — no e2e).
> - Scenario 3 (`common-apis-transients`): a namespaced transient key (recommended `my_plugin_data`). Pinned in the prompt, graded in acceptance (judge-only — no e2e).
> - Scenario 4 (`common-apis-http-request`): **no** pinned literal — the prompt is endpoint-agnostic and pins **no** external host. Graded in acceptance (judge-only — no e2e, no live request, no live-200).

---

### Task 1: Create the `common-apis-rewrite-rule` (custom pretty URL via the Rewrite API) scenario — **e2e**

- **Goal:** Add a scenario that asks for a custom front-end URL (the pinned path) that returns a specific plugin-controlled response (the pinned body token), exercising the Common APIs → Rewrite API sub-area — the only genuinely uncovered Common APIs sub-area with a clean, theme-independent, front-end-observable assertion — realizable as a single `index.php` edit on `init` (rule + custom query var) + `template_redirect` (handler that emits 200 + token + exits) + `register_activation_hook` (one-time flush), with an e2e spec that issues a raw HTTP GET to the pinned URL and asserts status 200 + body contains the pinned token.
- **Type:** e2e (writer: `code-writer-e2e`; ships `scenario.yaml` **and** `e2e.spec.mjs`)
- **Files to change:**
  - `eval/scenarios/common-apis-rewrite-rule/scenario.yaml` (new)
  - `eval/scenarios/common-apis-rewrite-rule/e2e.spec.mjs` (new)
- **Changes:**
  - `scenario.yaml`:
    - `name: common-apis-rewrite-rule`
    - `description:` a one-line summary (e.g. "Register a custom URL rewrite rule that routes a pretty URL to a plugin-controlled response.").
    - `skills:` list item `- wordpress-development`
    - `prompt` (block scalar `|`, user-voice, tool-agnostic): request that visiting a specific custom front-end URL returns a specific response. The prompt MUST pin the URL path `/my-custom-page` in backticks and the exact body text `Hello from my plugin` in backticks (e.g. "When someone visits `/my-custom-page` on my site, I want my plugin to respond with the exact text `Hello from my plugin` — not a 404 and not a themed page, just that response served directly by my plugin."). It MUST steer toward serving the response directly (so the agent registers the query var and a handler that intercepts and outputs the response, not a bare URL pattern that 404s — the query-var/handler gotcha). Do **NOT** name `add_rewrite_rule`, `flush_rewrite_rules`, `register_activation_hook`, `template_redirect`, `query_vars`, `add_rewrite_tag`, "Rewrite API", any hook, function, or API.
    - `acceptance` (verbatim from design "Scenario 1", clean checks, no URLs):
      1. A custom URL path (the pinned path) is handled by a registered rewrite rule.
      2. Navigating to the pinned path returns HTTP status 200 (not a 404).
      3. The response body contains the pinned text token.
      4. The plugin intercepts the request before any theme template loads, outputs its response, and stops further rendering.
      5. The rewrite rules are flushed once when the plugin is activated so the URL is live immediately.
    - `rubrics: []`
  - `e2e.spec.mjs`: Implement **Flow 1**, mirroring `eval/scenarios/cpt-register/e2e.spec.mjs` in lifecycle. `import { expect, test } from "@wordpress/e2e-test-utils-playwright";` and `import { deactivateAllPlugins } from "../../utils/wp-cli.mjs";`. One `test.describe("common-apis-rewrite-rule scenario", …)` block. `test.beforeAll(async ({ requestUtils }, workerInfo) => { deactivateAllPlugins(); await requestUtils.activatePlugin(`plugin-common-apis-rewrite-rule-${workerInfo.project.metadata.agentId}`); });` (slug derived from `workerInfo.project.metadata.agentId`, **never** hard-coded; `deactivateAllPlugins()` called **sync**, no `await`). `test.afterAll(() => { deactivateAllPlugins(); });` (sync, no `await`). One test (`async ({ page })`, **no** `requestUtils` in the test args, **no** content seeding): `const resp = await page.request.get("/my-custom-page"); expect(resp.status()).toBe(200); expect(await resp.text()).toContain("Hello from my plugin");`. `page` is a destructured fixture (no local import). Keep the asserted URL path and body token in lockstep with the prompt's pinned literals. Add **no** new helper to `eval/utils/`.
- **Depends on:** none
- **Traces to:** Spec Requirements 4, 5, 6, 7, 8, 10, 11, 13 (record), 20; Acceptance Criteria 3, 4 (i), 5, 6, 7, 9, 10, 19; Design "Scenario 1 — `common-apis-rewrite-rule`", "Decision: The Rewrite e2e asserts the raw HTTP response", "Decision: Bake the query-var-registration + handler requirement into the Rewrite prompt and acceptance", "Decision: The Rewrite scenario is self-contained via an activation-hook flush".
- **Acceptance:**
  - The directory `eval/scenarios/common-apis-rewrite-rule/` exists as a flat immediate child of `eval/scenarios/` and contains exactly two files: `scenario.yaml` and `e2e.spec.mjs`.
  - `scenario.yaml` has exactly the keys `name`, `description`, `skills`, `prompt`, `acceptance`, `rubrics`, in that order; `name` is `common-apis-rewrite-rule` (== directory name, matches `/^[a-z0-9-]+$/`); `skills` is the single list item `wordpress-development`; `rubrics` is an explicit empty array `[]`; no catalog-only field (`difficulty`/`concepts`/`source`/`source_files`) and no source URL appear anywhere in the file.
  - The `prompt` is user-voice and outcome-phrased, names no function/hook/API/framework, and contains both pinned literals verbatim: the URL path `/my-custom-page` and the body text `Hello from my plugin`.
  - The `acceptance` list contains the five clean, URL-free checks above, in order, and collectively requires: a registered rewrite rule for the pinned path, a 200 response, the body containing the pinned token, an intercept-before-template that outputs and stops rendering, and a one-time activation-hook flush.
  - `e2e.spec.mjs` parses under `node --check` and is collectable by Playwright; it imports `expect`/`test` from `@wordpress/e2e-test-utils-playwright` and `deactivateAllPlugins` from `../../utils/wp-cli.mjs`; it activates `plugin-common-apis-rewrite-rule-${workerInfo.project.metadata.agentId}` (slug derived, not hard-coded) in `beforeAll` and calls `deactivateAllPlugins()` sync in both `beforeAll` and `afterAll`.
  - The single test issues `page.request.get("/my-custom-page")` and asserts `resp.status()` is `200` and `(await resp.text())` contains `Hello from my plugin`; it seeds no content, adds no `eval/utils/` helper, and its assertion does not depend on which theme is active.

---

### Task 2: Create the `common-apis-options` (imperative store-and-retrieve via the Options API) scenario — **e2e (judge-only, no spec)**

- **Goal:** Add a judge-only scenario that asks the plugin to imperatively store a value under a namespaced key and read it back (supplying a default when unset), exercising the Common APIs → Options API sub-area — **distinct from `settings-register`** (different handbook chapter, zero function overlap, different mental model: imperatively store/read a value vs. declare a setting's schema for admin/REST to manage) — realizable as a single `index.php` edit on a load-time hook (`init`). Ships a `scenario.yaml` only (no `e2e.spec.mjs`); graded by the judge against the produced PHP because the value lives in the options table with no front-end-observable surface.
- **Type:** e2e (writer: `code-writer-e2e`; ships `scenario.yaml` **only** — judge-only, **no** `e2e.spec.mjs`)
- **Files to change:**
  - `eval/scenarios/common-apis-options/scenario.yaml` (new)
- **Changes:**
  - `scenario.yaml`:
    - `name: common-apis-options`
    - `description:` a one-line summary (e.g. "Imperatively store and retrieve a value via the Options API, with a default when unset.").
    - `skills:` list item `- wordpress-development`
    - `prompt` (block scalar `|`, user-voice, tool-agnostic): request that the plugin saves a piece of its own configuration so it persists across requests and reads it back later, falling back to a sensible default when it has not been saved yet. The prompt MUST pin the namespaced storage key `my_plugin_setting` in backticks and the value/default `enabled` in backticks, and MUST frame it as **imperatively storing and reading a value** (NOT "register a setting for the admin UI" — to keep it crisply distinct from `settings-register`). Do **NOT** name `add_option`, `update_option`, `get_option`, "Options API", or any function/hook/API.
    - `acceptance` (verbatim from design "Scenario 2", clean checks, no URLs):
      1. A value is stored under the pinned namespaced key.
      2. The stored value is retrieved by reading it back from the same key.
      3. A default value is provided for when the key has not yet been set.
      4. The store and retrieve operations run from a load-time hook.
    - `rubrics: []`
  - **No `e2e.spec.mjs`** is created for this scenario.
- **Depends on:** none
- **Traces to:** Spec Requirements 2, 3, 4 (ii), 5, 6, 9, 11, 13 (record), 20; Acceptance Criteria 2, 4 (ii), 5, 8, 10, 19; Design "Scenario 2 — `common-apis-options`", "Decision: The Options API scenario is distinct from `settings-register`".
- **Acceptance:**
  - The directory `eval/scenarios/common-apis-options/` exists as a flat immediate child of `eval/scenarios/` and contains exactly one file: `scenario.yaml` (no `e2e.spec.mjs`).
  - `scenario.yaml` has exactly the keys `name`, `description`, `skills`, `prompt`, `acceptance`, `rubrics`, in that order; `name` is `common-apis-options` (== directory name, matches `/^[a-z0-9-]+$/`, NOT the legacy `options-api-store-retrieve`); `rubrics` is `[]`; no catalog-only field and no source URL appear anywhere in the file.
  - The `prompt` is user-voice and tool-agnostic, names no function/hook/API, frames the task as imperatively storing and reading a value (not registering a setting for the admin UI), and contains the pinned namespaced key `my_plugin_setting` and the value/default `enabled` verbatim.
  - The `acceptance` list contains the four clean, URL-free checks above, in order, and collectively requires: storing under the pinned namespaced key, reading it back from the same key, providing a default when unset, and running from a load-time hook.

---

### Task 3: Create the `common-apis-transients` (cache a value with an expiry via the Transients API) scenario — **e2e (judge-only, no spec)**

- **Goal:** Add a judge-only scenario that asks the plugin to cache a computed value with an expiry and recompute it only after it expires, exercising the Common APIs → Transients API sub-area — **reframed to a standalone cache-with-expiry concept, fully decoupled from any HTTP call** (the cache holds an arbitrary computed value — a processed string, a count — NOT remote data) so it stays distinct from `common-apis-http-request` — realizable as a single `index.php` edit on a load-time hook (`init`). Ships a `scenario.yaml` only (no `e2e.spec.mjs`); graded by the judge against the produced PHP because the value lives in the transient store with no front-end-observable surface.
- **Type:** e2e (writer: `code-writer-e2e`; ships `scenario.yaml` **only** — judge-only, **no** `e2e.spec.mjs`)
- **Files to change:**
  - `eval/scenarios/common-apis-transients/scenario.yaml` (new)
- **Changes:**
  - `scenario.yaml`:
    - `name: common-apis-transients`
    - `description:` a one-line summary (e.g. "Cache a computed value with an expiry and recompute it only after it expires, via the Transients API.").
    - `skills:` list item `- wordpress-development`
    - `prompt` (block scalar `|`, user-voice, tool-agnostic): request that the plugin caches the result of an expensive computation so it isn't recomputed on every request, and recomputes it after the cache expires. The prompt MUST pin the namespaced cache key `my_plugin_data` in backticks. The prompt MUST NOT mention fetching from a URL, an external service, or remote data (keeping it decoupled from the HTTP scenario) — the cached value is an arbitrary computed value. Do **NOT** name `set_transient`, `get_transient`, `delete_transient`, "Transients API", or any function/hook/API.
    - `acceptance` (verbatim from design "Scenario 3", clean checks, no URLs):
      1. The transient is checked first; if it has expired or is not yet set, the value is (re)computed.
      2. The computed value is stored with an expiration time.
      3. On subsequent loads before expiry, the cached value is returned without recomputation.
      4. The transient key is a namespaced string literal.
    - `rubrics: []`
  - **No `e2e.spec.mjs`** is created for this scenario.
- **Depends on:** none
- **Traces to:** Spec Requirements 4 (iii), 5, 6, 9, 11, 13 (record), 14, 20; Acceptance Criteria 4 (iii), 5, 8, 10, 14, 19; Design "Scenario 3 — `common-apis-transients`", "Decision: Reframe the Transients scenario as a standalone cache-with-expiry, decoupled from any HTTP call".
- **Acceptance:**
  - The directory `eval/scenarios/common-apis-transients/` exists as a flat immediate child of `eval/scenarios/` and contains exactly one file: `scenario.yaml` (no `e2e.spec.mjs`).
  - `scenario.yaml` has exactly the keys `name`, `description`, `skills`, `prompt`, `acceptance`, `rubrics`, in that order; `name` is `common-apis-transients` (== directory name, matches `/^[a-z0-9-]+$/`, NOT the legacy `transient-cache-remote-data`); `rubrics` is `[]`; no catalog-only field and no source URL appear anywhere in the file.
  - The `prompt` is user-voice and tool-agnostic, names no function/hook/API, contains the pinned namespaced key `my_plugin_data` verbatim, and makes **no** mention of fetching from a URL / an external service / remote data (decoupled from the HTTP scenario).
  - The `acceptance` list contains the four clean, URL-free checks above, in order, and collectively requires: check-first-then-recompute-if-missing/expired, store-with-expiration, return-cached-without-recompute-before-expiry, and a namespaced string-literal key.

---

### Task 4: Create the `common-apis-http-request` (fetch from an external web service via the HTTP API) scenario — **e2e (judge-only, no spec)**

- **Goal:** Add a judge-only scenario that asks the plugin to fetch data from an external web service and handle errors before using the response, exercising the Common APIs → HTTP API sub-area — graded **statically on the PHP pattern** (makes the outbound request → checks for an error before using the response → reads the response body) with **NO live external call, NO live-200 acceptance, and NO specific external host pinned in the prompt**, so the scenario does not depend on outbound network — realizable as a single `index.php` edit on a load-time hook (`init`). Ships a `scenario.yaml` only (no `e2e.spec.mjs`).
- **Type:** e2e (writer: `code-writer-e2e`; ships `scenario.yaml` **only** — judge-only, **no** `e2e.spec.mjs`)
- **Files to change:**
  - `eval/scenarios/common-apis-http-request/scenario.yaml` (new)
- **Changes:**
  - `scenario.yaml`:
    - `name: common-apis-http-request`
    - `description:` a one-line summary (e.g. "Make an outbound HTTP request to an external web service and handle errors before using the response.").
    - `skills:` list item `- wordpress-development`
    - `prompt` (block scalar `|`, user-voice, tool-agnostic, **endpoint-agnostic**): request that the plugin fetches some data from an external web service and uses it, handling the case where the request fails so the plugin doesn't break. The prompt MUST be endpoint-agnostic — it pins **no** specific external host/URL. Do **NOT** name `wp_remote_get`, `is_wp_error`, `wp_remote_retrieve_body`, "HTTP API", or any function/hook/API.
    - `acceptance` (verbatim from design "Scenario 4", clean checks, no URLs):
      1. An outbound HTTP GET request is made to an external URL.
      2. The response is checked for an error before its content is used.
      3. The response body is extracted using the WordPress HTTP response-body helper.
      4. The request is made from a hook callback, not at file-load time.
    - `rubrics: []`
  - **No `e2e.spec.mjs`** is created for this scenario.
- **Depends on:** none
- **Traces to:** Spec Requirements 4 (iv), 5, 6, 9, 11, 13 (record, two `source_files`), 20; Out of Scope 10; Acceptance Criteria 4 (iv), 5, 8, 10, 13, 19; Design "Scenario 4 — `common-apis-http-request`", "Decision: The HTTP scenario grades the PHP pattern statically — no live call, no live-200 criterion, endpoint-agnostic prompt".
- **Acceptance:**
  - The directory `eval/scenarios/common-apis-http-request/` exists as a flat immediate child of `eval/scenarios/` and contains exactly one file: `scenario.yaml` (no `e2e.spec.mjs`).
  - `scenario.yaml` has exactly the keys `name`, `description`, `skills`, `prompt`, `acceptance`, `rubrics`, in that order; `name` is `common-apis-http-request` (== directory name, matches `/^[a-z0-9-]+$/`); `rubrics` is `[]`; no catalog-only field and no source URL appear anywhere in the file.
  - The `prompt` is user-voice and tool-agnostic, names no function/hook/API, frames the task as fetching data from an external web service with failure handling, and pins **no** specific external host/URL (endpoint-agnostic).
  - The `acceptance` list contains the four clean, URL-free checks above, in order, and collectively requires: an outbound GET to an external URL, an error check before the content is used, body extraction via the WordPress response-body helper, and the request being made from a hook callback (not at file-load time) — graded statically against the PHP, with no live-request / no live-200 criterion.

---

### Task 5: Update the Common APIs section of the catalog `_wp-dev-candidates.yaml` (promote 2 stubs, add 2 full records, fix header line) — **e2e (catalog data, no spec)**

- **Goal:** Edit the existing catalog `eval/scenarios/_wp-dev-candidates.yaml` **in place** so the Common APIs area carries exactly four full records (1:1 with the four implemented scenarios) under an `# Implemented Common APIs scenarios — full records` sub-header, and the stale header line lists Common APIs. This rename+promotes the two existing Common APIs stubs and adds two new full records, with each record's `prompt` and `acceptance` matching its shipped `scenario.yaml` (Tasks 1–4) verbatim. No `e2e.spec.mjs` and no scenario directory are produced; only the Common APIs section and the one header line change. The iAPI `_candidates.yaml`, the Plugins `http-api-remote-get` stub, and all other non-Common-APIs records are byte-untouched.
- **Type:** e2e (writer: `code-writer-e2e`; **edits one existing file**, produces **no** `e2e.spec.mjs` and **no** scenario directory)
- **Files to change:**
  - `eval/scenarios/_wp-dev-candidates.yaml` (MODIFY in place — it already exists; do **not** recreate)
- **Changes:**
  - **Header line fix (the only header change):** in the top comment block, change the line `# Editor, REST API, and Themes scenarios; all other records are lighter stubs.` (currently "…the implemented Plugins, Block Editor, REST API, and Themes scenarios…") so it **also lists Common APIs** — e.g. "…Plugins, Block Editor, REST API, Themes, and Common APIs scenarios…". This is the **only** header change; do not edit the area→URL map or any other header line.
  - **Common APIs section rebuild (the `# === Area: Common APIs ===` block, currently lines 364–384):** Replace the two existing stub records (`transient-cache-remote-data` at lines 366–374 and `options-api-store-retrieve` at lines 376–384, each ending in `# TODO: prompt + acceptance`) with **four full records under a new `# Implemented Common APIs scenarios — full records` sub-header** (mirroring the Themes/REST API pattern at e.g. line 168). Keep the `# === Area: Common APIs ===` area header. Recommended order within the sub-header: Options, Transients, Rewrite Rule, HTTP Request (any consistent order is acceptable). Each full record carries the catalog full-record fields in order: `name`, `description`, `difficulty`, `concepts`, `source` (`dev.wordpress.org`), `source_files`, `prompt: |`, `acceptance:`. There is **no `rubrics` field** in catalog records. The four records:
    1. `common-apis-options` — **rename+promote** of the legacy `options-api-store-retrieve`. `difficulty: simple`; `concepts: [add_option, update_option, get_option]`; `source_files`: `https://developer.wordpress.org/apis/options/` and `https://developer.wordpress.org/reference/functions/get_option/`. `prompt` and `acceptance` **verbatim** from `eval/scenarios/common-apis-options/scenario.yaml` (Task 2).
    2. `common-apis-transients` — **rename+promote+reframe** of the legacy `transient-cache-remote-data` (reframed to standalone cache-with-expiry, decoupled from HTTP). `difficulty: simple`; `concepts: [set_transient, get_transient, delete_transient]`; `source_files`: `https://developer.wordpress.org/apis/transients/` and `https://developer.wordpress.org/reference/functions/set_transient/`. `prompt` and `acceptance` **verbatim** from `eval/scenarios/common-apis-transients/scenario.yaml` (Task 3).
    3. `common-apis-rewrite-rule` — **new** full record. `difficulty: simple`; `concepts: [add_rewrite_rule, register_activation_hook, template_redirect]`; `source_files`: `https://developer.wordpress.org/apis/rewrite/`. `prompt` and `acceptance` **verbatim** from `eval/scenarios/common-apis-rewrite-rule/scenario.yaml` (Task 1).
    4. `common-apis-http-request` — **new** full record. `difficulty: simple`; `concepts: [wp_remote_get, wp_remote_retrieve_body, is_wp_error]`; `source_files` (**two** entries, both required): `https://developer.wordpress.org/apis/making-http-requests/` and `https://developer.wordpress.org/reference/functions/wp_remote_get/` (the second grounds the `is_wp_error` error-handling acceptance point, which the overview page does not show). `prompt` and `acceptance` **verbatim** from `eval/scenarios/common-apis-http-request/scenario.yaml` (Task 4).
  - **Do NOT** add any Common APIs stub, any `# Deferred:` comment in the Common APIs area, or any new stub for Database (`$wpdb`) or Filesystem (`WP_Filesystem`) — both implemented stubs are now promoted, and the two deferred sub-areas have no stub today and get none. **Do NOT** touch the Plugins `http-api-remote-get` stub (lines 334–342) — it stays byte-identical. **Do NOT** modify `eval/scenarios/_candidates.yaml` or any non-Common-APIs record in `_wp-dev-candidates.yaml`.
- **Depends on:** none for ordering, but its `prompt`/`acceptance` text MUST match the four scenario.yaml files (Tasks 1–4) verbatim — whichever is written last is the source of truth; the executor should reconcile so the catalog text is identical to the shipped `scenario.yaml` files (same text, order, and quoting).
- **Traces to:** Spec Requirements 13, 14, 15, 16, 17, 18, 19; Acceptance Criteria 12, 13, 14, 15, 16, 17, 18, 22; Design "Catalog", "Decision: Promote+rename two stubs, add two full records, leave the Plugins `http-api-remote-get` stub untouched", "Catalog record shape" and the per-record `source_files` table.
- **Acceptance:**
  - `eval/scenarios/_wp-dev-candidates.yaml` still parses as valid YAML and remains a leading-underscore non-directory file (not discovered as a scenario by Skillsmith).
  - The header comment listing which areas carry full prompt+acceptance now lists **Common APIs** alongside Plugins, Block Editor, REST API, and Themes; that header line is the **only** header change.
  - The Common APIs area contains exactly **four** full records — `common-apis-options`, `common-apis-transients`, `common-apis-rewrite-rule`, `common-apis-http-request` — all under an `# Implemented Common APIs scenarios — full records` sub-header; the legacy stub names `options-api-store-retrieve` and `transient-cache-remote-data` no longer appear, and **no** Common APIs stub or `# Deferred:` comment remains.
  - Each of the four records carries `name`, `description`, `difficulty`, `concepts`, `source`, `source_files`, `prompt`, `acceptance` (no `rubrics` field); each `name` equals the corresponding scenario's directory name and `scenario.yaml` `name`; each record's `prompt` and `acceptance` text matches its shipped `scenario.yaml` verbatim (same text, order, quoting).
  - The `common-apis-http-request` record's `source_files` lists exactly the two URLs `https://developer.wordpress.org/apis/making-http-requests/` and `https://developer.wordpress.org/reference/functions/wp_remote_get/`.
  - No new stub is added for Database (`$wpdb`) or Filesystem; the Plugins `http-api-remote-get` stub is byte-identical to before; `eval/scenarios/_candidates.yaml` and every non-Common-APIs record in `_wp-dev-candidates.yaml` are byte-unchanged.
