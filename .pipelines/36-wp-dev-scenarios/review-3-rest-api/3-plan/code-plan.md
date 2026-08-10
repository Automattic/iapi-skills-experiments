# Code Plan: REST API scenarios

## Overview

This batch ships **four artifacts** under `eval/` (the Skillsmith eval suite), all without touching the `wordpress-development` skill: **three new REST API scenario directories** under `eval/scenarios/` using the adopted `rest-api-*` pseudo-folder naming convention (all flat immediate children of `eval/scenarios/`), each shipping a `scenario.yaml` + an `e2e.spec.mjs`, plus an **in-place edit of the existing catalog** `eval/scenarios/_wp-dev-candidates.yaml`. The three scenarios are `rest-api-custom-field-on-post` (modifying responses — a top-level field on the post resource), `rest-api-route-validation` (route-argument validation — good→200 / bad→400), and `rest-api-permission-check` (a permission-gated route — anon→401 / authed→body). The "code" produced here is **scenario-definition and catalog data**, not WordPress plugin code — the plugin under test is authored at run time by the Skillsmith testing agent as a single `index.php` edit on `rest_api_init`. The plan is **one task per scenario (3) plus one task for the catalog edit (4 total)**; all tasks are **independent with no cross-task ordering dependencies** (numbered for reference only, executable in any order or in parallel). The batch adds **zero** new rubrics, reorganizes/renames none of the existing scenarios, leaves the iAPI `_candidates.yaml` and all non-REST-API records in `_wp-dev-candidates.yaml` untouched, and modifies no file under `skills/wordpress-development/`. The e2e lifecycle mirrors `eval/scenarios/rest-custom-endpoint/` (and `post-meta-rest/` for the post-seeding scenario) verbatim — no new `eval/utils/` helper is added.

### The `rest-api-` naming convention (the structural element)

All three new scenarios use the prefix `rest-api-<concept>` as their **directory name**, their `scenario.yaml` `name`, and their **catalog record `name`** — identical in all three places. This is the adopted "pseudo-folder" organization carried over from review-2: it visually clusters REST API scenarios when `eval/scenarios/` is listed and sorted, while every scenario remains a **flat immediate child** of `eval/scenarios/` whose name matches `/^[a-z0-9-]+$/`. No filesystem nesting is introduced, so Skillsmith discovery, the e2e lifecycle, `verify-e2e.ts` spec-location/attribution, Playwright collection, and the scaffold are all unchanged. The existing scenarios are **NOT** renamed. The folders question is not re-litigated here — review-2 classified real subdirectories as not low-risk and adopted this convention; this review applies it.

### Type field — why all three scenario tasks (and the catalog task) are Type `e2e`

There is **no unit-testable production module** in this batch. The plugin PHP (the `rest_api_init` registration in `index.php`) that would be unit-tested is authored by the testing agent at run time, not by this phase; the catalog is a config/data file. The only writer suited to producing scenario definitions and their Playwright specs is **`code-writer-e2e`**, so every scenario task is **Type `e2e`** (there is no meaningful `tdd` RED/GREEN unit cycle — a `tdd` task would have no production module to test). The **catalog-edit task (Task 4)** is also Type `e2e` (writer `code-writer-e2e`) but produces **no `e2e.spec.mjs` and no scenario directory** — its deliverable is the single catalog file edited in place. Each task's Changes and Acceptance state this explicitly so the writer does not author a spec where none is wanted.

### Verification bar (static/structural only)

Per the spec (AC 16) and design ("Static / structural verification only"), verification is **static/structural only**. The bar per artifact:
- Each `scenario.yaml` is **discoverable** — passes Skillsmith's scenario-shape check (`name`/`description`/`skills`/`prompt`/`acceptance` present and well-typed; `rubrics` present as an array). Running Skillsmith on the scenario directory would execute to a graded result without harness/configuration errors. A **failing grade against the current skill is acceptable** and does not violate the bar.
- Each `e2e.spec.mjs` is **loadable/collectable by the test runner** — it parses and its imports resolve (verifiable with `node --check` and Playwright collection). Its `../../utils/wp-cli.mjs` import (two-level depth) resolves precisely because the scenario directory is a flat immediate child of `eval/scenarios/`.
- The edited catalog `_wp-dev-candidates.yaml` **parses as valid YAML** and is **NOT discovered as a scenario** (it is a non-directory leading-underscore file, skipped by Skillsmith's non-directory guard before the YAML-existence guard).

Agents do **NOT** run the full `npx skillsmith` / `scenarios × testing-agents` matrix, do **NOT** boot `wp-env`, and do **NOT** generate the plugin code.

## Guardrail scopes

**No project guardrails.** This project defines no scoped gates, so there is no guardrail scope to fill.

| Gate | Scope |
| ---- | ----- |
| None | None |

## E2E test plan

The three scenarios' `e2e.spec.mjs` files **are** the automated end-to-end tests; the catalog edit ships **no** spec. Each e2e spec is a Playwright spec run by `eval/utils/verify-e2e.ts` inside a `wp-env` runtime; each **deactivates all plugins, then activates exactly its own scaffolded plugin** (`plugin-<scenario.name>-${workerInfo.project.metadata.agentId}` — derived, never hard-coded) in `beforeAll`, and **deactivates all plugins** in `afterAll`. The lifecycle is fixed by the existing `rest-custom-endpoint` spec (and `post-meta-rest` for the post-seeding scenario): `beforeAll` calls `deactivateAllPlugins()` then `await requestUtils.activatePlugin(...)`; `afterAll` calls `deactivateAllPlugins()`. Only Flow 1 seeds a published post (`requestUtils.createPost({ status: "publish" })`) in `beforeAll` and cleans it up with `await requestUtils.deleteAllPosts()` in `afterAll`. Every literal each spec asserts (field name `reading_time`, value `5 min`; route `/wp-json/example/v1/color`, param `filter`, `blue`/`purple`, statuses 200/400; route `/wp-json/example/v1/private`, status 401, body `This is private data.`) is **pinned in that scenario's prompt**, keeping prompt and assertion in lockstep.

Two REST verification channels are used inline (no new `eval/utils/` helper):
- **Anonymous** — `page.request.get(path)` carries no admin cookie; exposes `.status()` (HTTP status) and `await resp.json()` (parsed body). Used by Flows 1, 2, and the anonymous half of Flow 3.
- **Authenticated-as-admin** — `requestUtils.rest({ path })` returns the parsed JSON body, exposes **no** `.status()`, and **throws on a non-2xx response**. Used by the authenticated half of Flow 3 (the suite's first use of this channel). Its assertion must check the **returned body**, never a status number — `expect(...).toBe(200)` on a `rest()` result is a coding error (there is no `.status()`).

### Flow 1: A top-level field appears on a published post's REST resource (modifying responses)

- **Steps:** Deactivate all plugins; activate `plugin-rest-api-custom-field-on-post-<agentId>`; seed a published post via `const post = await requestUtils.createPost({ status: "publish" })`. Anonymously GET that post's REST resource: `const resp = await page.request.get("/wp-json/wp/v2/posts/" + post.id)`.
- **Expected:** The added top-level field is present with the pinned value — `expect((await resp.json()).reading_time).toBe("5 min")`. This proves a `reading_time` field was added at the **top level** of the post JSON (not under `.meta`), registered for the post resource on `rest_api_init`, returning the constant `"5 min"`. (Anonymous readability of a published post is proven in-repo by `post-meta-rest`, which seeds a published post and reads it anonymously.) Cleanup: `await requestUtils.deleteAllPosts()` in `afterAll`.
- **Traces to:** Acceptance criteria 3 (sub-area i), 5, 7, 8, 16; Design "Scenario 1 — `rest-api-custom-field-on-post`". Pinned literals: field `reading_time`, value `5 min`, resource `/wp-json/wp/v2/posts/<id>`.

### Flow 2: A route accepts a valid argument (200) and rejects an invalid one (400) (argument validation)

- **Steps:** Deactivate all plugins; activate `plugin-rest-api-route-validation-<agentId>`. No post seeding. Anonymously GET the route twice: `const ok = await page.request.get("/wp-json/example/v1/color?filter=blue")` and `const bad = await page.request.get("/wp-json/example/v1/color?filter=purple")`.
- **Expected:** The valid value succeeds and the invalid value is rejected — `expect(ok.status()).toBe(200)` and `expect(bad.status()).toBe(400)`. This proves the `filter` argument is constrained server-side (a value outside the allowed set is rejected before the handler runs). The spec asserts the **observable accept/reject behavior**, not a specific mechanism (an `enum`, a `validate_callback`, or both all yield this behavior).
- **Traces to:** Acceptance criteria 3 (sub-area ii), 5, 7, 8, 16; Design "Scenario 2 — `rest-api-route-validation`". Pinned literals: route `/wp-json/example/v1/color`, param `filter`, good `blue`, bad `purple`, statuses 200 / 400.

### Flow 3: A gated route denies anonymous (401) and serves the body to an authenticated admin (permission check)

- **Steps:** Deactivate all plugins; activate `plugin-rest-api-permission-check-<agentId>`. No post seeding. **Anonymous half:** `const denied = await page.request.get("/wp-json/example/v1/private")`. **Authenticated half:** `const body = await requestUtils.rest({ path: "/example/v1/private" })`.
- **Expected:** The anonymous (logged-out) request is denied — `expect(denied.status()).toBe(401)` (401, not 403: core's `rest_authorization_required_code()` returns 401 for logged-out callers). The authenticated admin request returns the pinned success body — `expect(body).toBe("This is private data.")`. Because `requestUtils.rest` returns the parsed body and throws on non-2xx, a returned matching body **is** success; assert the **body**, never a status number.
- **Traces to:** Acceptance criteria 3 (sub-area iii), 5, 7, 8, 16; Design "Scenario 3 — `rest-api-permission-check`". Pinned literals: route `/wp-json/example/v1/private`, anonymous status 401, success body `This is private data.`.

## Tasks

> **Shared conventions for ALL four tasks** (transcribe faithfully — these are design-doc obligations, not new decisions):
>
> **Scenario tasks (1–3):**
> - Each task creates exactly one directory `eval/scenarios/<dir>/` that is a **flat immediate child** of `eval/scenarios/` (no nesting), containing **two** files: `scenario.yaml` + `e2e.spec.mjs`.
> - `scenario.yaml` keys, in this order: `name`, `description`, `skills` (as a list item `- wordpress-development`), `prompt` (block scalar `|`), `acceptance` (list), `rubrics: []`. **`rubrics: []` must be present as an explicit empty array** — an omitted key (`undefined`) or a valueless `rubrics:` (parsed as `null`) fails Skillsmith's shape-check (`Array.isArray(...)` is `false` for both) and the scenario is silently skipped and never graded. Do **not** add any file under `eval/rubrics/`.
> - **No catalog-only fields** (`difficulty`, `concepts`, `source`, `source_files`) appear in any `scenario.yaml`, and **no source URL** appears anywhere in a `scenario.yaml` — those live only in the catalog record (Task 4).
> - `name` equals the directory name for every scenario in this batch (e.g. `rest-api-route-validation` → slug `plugin-rest-api-route-validation-<agentId>`). Names contain hyphens only (no underscores) and match `/^[a-z0-9-]+$/`.
> - The `prompt` is **user-voice, outcome-phrased, and tool-agnostic**: it must **NOT** name the tool/API/function/framework (no `register_rest_field`, `register_rest_route`, `register_meta`, `permission_callback`, `validate_callback`, `sanitize_callback`, `enum`, `rest_api_init`, `WP_Error`, `rest_ensure_response`, `index.php`, etc.). It **MAY** name a user-facing pinned literal (the field name, route path in backticks, param name, the `blue`/`purple` values, the status codes, the body string). The route-pinning convention follows `rest-custom-endpoint`: hard-pin the full literal path in backticks inside a user-voice sentence (e.g. "When someone sends a GET request to `/wp-json/example/v1/color?filter=blue` …"). Keep the pinned literal and the e2e assertion target in **lockstep** — if any literal is reworded, the prompt and the spec assertion change together.
> - The `acceptance` strings are **clean, human-readable check statements with NO embedded source URLs**. Provenance (developer.wordpress.org URLs) lives only in the catalog record's `source_files` (Task 4).
> - `e2e.spec.mjs` follows the existing `rest-custom-endpoint` spec pattern exactly: `import { expect, test } from "@wordpress/e2e-test-utils-playwright";` and `import { deactivateAllPlugins } from "../../utils/wp-cli.mjs";`, a single `test.describe(...)` block, `beforeAll` calling `deactivateAllPlugins()` then `await requestUtils.activatePlugin(`plugin-<dir>-${workerInfo.project.metadata.agentId}`)` (slug derived from `workerInfo.project.metadata.agentId`, never hard-coded), `afterAll` calling `deactivateAllPlugins()`, and inline assertions on the REST response per the relevant Flow. `page` and `requestUtils` are destructured fixtures (no local import). No new REST helper is added to `eval/utils/`.
> - These are **Type `e2e`** tasks (see "Type field" in Overview): the writer is `code-writer-e2e`.
>
> **Catalog task (4):** **edits the existing file** `eval/scenarios/_wp-dev-candidates.yaml` in place (it already exists — MODIFY, do not recreate), and produces **no `e2e.spec.mjs`** and **no scenario directory**. Only the REST API section (and the one stale header line) is touched. See Task 4 for its structure.
>
> **No-disruption obligation (all tasks):** do not modify, move, or rename any existing scenario directory, the existing `eval/scenarios/_candidates.yaml` (iAPI catalog), any non-REST-API record in `_wp-dev-candidates.yaml`, any file under `eval/rubrics/`, or any file under `skills/wordpress-development/`.
>
> **Pinned literals (fixed by the design — not open choices; use verbatim in prompt, e2e assertion, and catalog record):**
> - Scenario 1: field name `reading_time`, value `5 min`, resource path `/wp-json/wp/v2/posts/<id>`.
> - Scenario 2: route `/wp-json/example/v1/color`, param `filter`, good value `blue`, bad value `purple`, statuses `200` / `400`.
> - Scenario 3: route `/wp-json/example/v1/private`, anonymous status `401` (not 403), success body string `This is private data.`.

---

### Task 1: Create the `rest-api-custom-field-on-post` (modifying responses — top-level field) scenario — **e2e**

- **Goal:** Add a scenario that asks for an extra read-only piece of information to appear directly on each post when read through the site's data API, exercising the REST API → Modifying-responses sub-area by adding a **top-level** field (distinct from `post-meta-rest`, which surfaces values under the resource's `.meta` object), with an e2e spec that seeds a published post, anonymously GETs its REST resource, and asserts the added top-level field has the pinned value.
- **Type:** e2e
- **Files to change:**
  - `eval/scenarios/rest-api-custom-field-on-post/scenario.yaml` (new)
  - `eval/scenarios/rest-api-custom-field-on-post/e2e.spec.mjs` (new)
- **Changes:**
  - `scenario.yaml`:
    - `name: rest-api-custom-field-on-post`
    - `description:` a one-line summary (e.g. "Add a top-level `reading_time` field to the Posts REST response.").
    - `skills:` list item `- wordpress-development`
    - `prompt` (block scalar `|`, user-voice, tool-agnostic): request that each post, when read back through the site's data API, include an extra read-only piece of information shown directly on the post — a field named **`reading_time`** that always reads **`5 min`** — appearing alongside the post's other fields (not buried inside the post's custom-fields/meta section). Do **NOT** name `register_rest_field`, `register_meta`, `rest_api_init`, or any function/API.
    - `acceptance` (verbatim from design "Scenario 1", clean checks, no URLs):
      1. A new top-level field named `reading_time` is added to the post resource's REST response (not nested under the resource's meta).
      2. The field is registered for the post resource on the REST initialization hook.
      3. Reading a published post through the site's data API returns `reading_time` with the value `5 min`.
      4. The field is exposed on the existing post resource without registering a new route or post meta.
    - `rubrics: []`
  - `e2e.spec.mjs`: Implement **Flow 1**, mirroring `post-meta-rest/e2e.spec.mjs`. `test.describe("rest-api-custom-field-on-post scenario", …)` with a module-scoped `let post;`. `beforeAll(async ({ requestUtils }, workerInfo) => { deactivateAllPlugins(); await requestUtils.activatePlugin(`plugin-rest-api-custom-field-on-post-${workerInfo.project.metadata.agentId}`); post = await requestUtils.createPost({ status: "publish" }); })`. `afterAll(async ({ requestUtils }) => { deactivateAllPlugins(); await requestUtils.deleteAllPosts(); })`. One test (`async ({ page })`): `const resp = await page.request.get("/wp-json/wp/v2/posts/" + post.id); expect((await resp.json()).reading_time).toBe("5 min");`. Keep the asserted field/value in lockstep with the prompt's pinned `reading_time` / `5 min`.
- **Depends on:** none
- **Traces to:** Spec requirements A.1, A.2, A.3, A.4, A.5, B.7, B.8, B.9, B.10, C.11, E.16, E.17, E.18; Acceptance criteria 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 16, 17, 18; Design "Scenario 1 — `rest-api-custom-field-on-post`"; Design decisions "Implement three e2e scenarios…", "Modifying-responses scenario adds a top-level field via `register_rest_field` (distinct from `post-meta-rest`)", "Reuse the `rest-custom-endpoint` e2e lifecycle verbatim", "Pin every e2e-asserted literal in the prompt", "Add zero new shared rubrics", "Apply `rest-api-*` pseudo-folder naming".
- **Acceptance:**
  - `eval/scenarios/rest-api-custom-field-on-post/scenario.yaml` exists with keys `name`, `description`, `skills`, `prompt`, `acceptance`, `rubrics` (in that order), where `name` is `rest-api-custom-field-on-post` (equal to the directory name, matching `/^[a-z0-9-]+$/`), `skills` is exactly `[wordpress-development]`, and `rubrics` is an explicit empty array `[]`.
  - The `scenario.yaml` contains **no** catalog-only fields (`difficulty`, `concepts`, `source`, `source_files`) and **no** embedded source URL anywhere.
  - The `prompt` reads as a user-voice, outcome-phrased request and names no API/tool/function (no `register_rest_field`, `register_meta`, `rest_api_init`); it pins the user-facing literals `reading_time` and `5 min` and conveys "top-level / not under meta".
  - The `acceptance` list contains exactly the four points above; no acceptance string contains a URL; the points distinguish a top-level field from `.meta` and require the value `5 min`.
  - `eval/scenarios/rest-api-custom-field-on-post/e2e.spec.mjs` activates `plugin-rest-api-custom-field-on-post-<agentId>` (slug derived from `workerInfo.project.metadata.agentId`, not hard-coded), seeds a published post via `requestUtils.createPost({ status: "publish" })`, anonymously GETs `/wp-json/wp/v2/posts/<post.id>`, and asserts the response body's `reading_time` is `5 min`.
  - The spec imports `deactivateAllPlugins` from `../../utils/wp-cli.mjs` and `expect`/`test` from `@wordpress/e2e-test-utils-playwright`, resets plugin state in `beforeAll`, and cleans up with `deactivateAllPlugins()` + `requestUtils.deleteAllPosts()` in `afterAll`.
  - `node --check eval/scenarios/rest-api-custom-field-on-post/e2e.spec.mjs` succeeds (spec parses) and Playwright would collect it without errors.
  - Running Skillsmith on `eval/scenarios/rest-api-custom-field-on-post` would execute to a graded result without harness/configuration errors (failing grade acceptable). [Not run by this phase; structural verification only.]
  - No file under `skills/wordpress-development/`, `eval/rubrics/`, the iAPI `_candidates.yaml`, or any existing scenario directory is added or modified by this task.

---

### Task 2: Create the `rest-api-route-validation` (schema / argument validation) scenario — **e2e**

- **Goal:** Add a scenario that asks for a route which accepts a query argument constrained to an allowed set of values — accepting a valid value and rejecting a disallowed one — exercising the REST API → Schema/argument-validation sub-area (distinct from `rest-custom-endpoint`: the prompt centers the accept/reject validation concept, not route registration), with an e2e spec that anonymously GETs the route with a good value (asserting 200) and a bad value (asserting 400).
- **Type:** e2e
- **Files to change:**
  - `eval/scenarios/rest-api-route-validation/scenario.yaml` (new)
  - `eval/scenarios/rest-api-route-validation/e2e.spec.mjs` (new)
- **Changes:**
  - `scenario.yaml`:
    - `name: rest-api-route-validation`
    - `description:` a one-line summary (e.g. "Validate a route's `filter` argument so disallowed values are rejected.").
    - `skills:` list item `- wordpress-development`
    - `prompt` (block scalar `|`, user-voice, tool-agnostic): request a route at **`/wp-json/example/v1/color`** that accepts a **`filter`** query argument restricted to a fixed set of allowed colors, so that a request with an allowed value (e.g. **`/wp-json/example/v1/color?filter=blue`**) succeeds with HTTP status **`200`**, while a request with a disallowed value (e.g. **`/wp-json/example/v1/color?filter=purple`**) is rejected with HTTP status **`400`**. Do **NOT** name `register_rest_route`, `validate_callback`, `sanitize_callback`, `enum`, `WP_Error`, or any function/API.
    - `acceptance` (verbatim from design "Scenario 2", clean checks, no URLs):
      1. A route at `example/v1/color` accepts a `filter` query argument.
      2. A request with `filter=blue` (an allowed value) succeeds with HTTP status 200.
      3. A request with `filter=purple` (a disallowed value) is rejected with HTTP status 400.
      4. The accepted set of values is constrained server-side (a value outside the allowed set is rejected before the handler runs).
    - `rubrics: []`
  - `e2e.spec.mjs`: Implement **Flow 2**, mirroring `rest-custom-endpoint/e2e.spec.mjs` (anonymous channel only, no post seeding). `test.describe("rest-api-route-validation scenario", …)`. `beforeAll(async ({ requestUtils }, workerInfo) => { deactivateAllPlugins(); await requestUtils.activatePlugin(`plugin-rest-api-route-validation-${workerInfo.project.metadata.agentId}`); })`. `afterAll(() => { deactivateAllPlugins(); })`. One test (`async ({ page })`): `const ok = await page.request.get("/wp-json/example/v1/color?filter=blue"); expect(ok.status()).toBe(200); const bad = await page.request.get("/wp-json/example/v1/color?filter=purple"); expect(bad.status()).toBe(400);`. Keep the asserted route/param/values/statuses in lockstep with the prompt's pinned literals.
- **Depends on:** none
- **Traces to:** Spec requirements A.1, A.2, A.3, A.4, A.5, B.7, B.8, B.9, B.10, C.11, E.16, E.17, E.18; Acceptance criteria 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 16, 17, 18; Design "Scenario 2 — `rest-api-route-validation`"; Design decisions "Implement three e2e scenarios…", "Validation scenario uses the enum-string `filter` example and asserts behavior, not mechanism", "Reuse the `rest-custom-endpoint` e2e lifecycle verbatim", "Pin every e2e-asserted literal in the prompt", "Add zero new shared rubrics", "Apply `rest-api-*` pseudo-folder naming".
- **Acceptance:**
  - `eval/scenarios/rest-api-route-validation/scenario.yaml` exists with `name: rest-api-route-validation` (== directory name, matching `/^[a-z0-9-]+$/`), `skills: [wordpress-development]`, and `rubrics: []` (explicit empty array); no catalog-only fields and no embedded URL.
  - The `prompt` reads as a user-voice, outcome-phrased request and names no API/tool/function (no `register_rest_route`, `validate_callback`, `enum`); it pins the route `/wp-json/example/v1/color`, param `filter`, values `blue`/`purple`, and statuses `200`/`400`, and centers the accept/reject (validation) concept.
  - The `acceptance` list contains exactly the four points above, including the server-side-constraint / rejected-before-the-handler-runs point; no acceptance string contains a URL.
  - `eval/scenarios/rest-api-route-validation/e2e.spec.mjs` activates `plugin-rest-api-route-validation-<agentId>` (slug derived from `agentId`), does **no** post seeding, anonymously GETs `/wp-json/example/v1/color?filter=blue` asserting status `200`, and `/wp-json/example/v1/color?filter=purple` asserting status `400`.
  - The spec imports `deactivateAllPlugins` from `../../utils/wp-cli.mjs` and `expect`/`test` from `@wordpress/e2e-test-utils-playwright`, resets plugin state in `beforeAll`, and cleans up with `deactivateAllPlugins()` in `afterAll`.
  - `node --check eval/scenarios/rest-api-route-validation/e2e.spec.mjs` succeeds and Playwright would collect it without errors.
  - Running Skillsmith on `eval/scenarios/rest-api-route-validation` would execute to a graded result without harness/configuration errors (failing grade acceptable). [Not run by this phase.]
  - No file under `skills/wordpress-development/`, `eval/rubrics/`, the iAPI `_candidates.yaml`, or any existing scenario directory is added or modified by this task.

---

### Task 3: Create the `rest-api-permission-check` (authentication / permissions) scenario — **e2e**

- **Goal:** Add a scenario that asks for a route gated so that anonymous callers are denied while a logged-in administrator gets the data, exercising the REST API → Authentication/permissions sub-area (distinct from `rest-custom-endpoint`: the prompt centers the auth-gating concept, not route registration), with an e2e spec that anonymously GETs the gated route (asserting status 401) and calls it as authenticated admin (asserting the expected body is returned without throwing).
- **Type:** e2e
- **Files to change:**
  - `eval/scenarios/rest-api-permission-check/scenario.yaml` (new)
  - `eval/scenarios/rest-api-permission-check/e2e.spec.mjs` (new)
- **Changes:**
  - `scenario.yaml`:
    - `name: rest-api-permission-check`
    - `description:` a one-line summary (e.g. "Gate a route so anonymous callers get 401 and admins get the data.").
    - `skills:` list item `- wordpress-development`
    - `prompt` (block scalar `|`, user-voice, tool-agnostic): request a route at **`/wp-json/example/v1/private`** that returns private data only to logged-in administrators: an anonymous (logged-out) request must be denied with HTTP status **`401`**, while a logged-in administrator request must succeed and return the body **`This is private data.`**. Do **NOT** name `register_rest_route`, `permission_callback`, `current_user_can`, `rest_authorization_required_code`, `WP_Error`, `rest_ensure_response`, or any function/API.
    - `acceptance` (verbatim from design "Scenario 3", clean checks, no URLs):
      1. A route at `example/v1/private` is gated by a permission check.
      2. An anonymous (logged-out) request to the route is denied with HTTP status 401.
      3. An authenticated administrator request to the route succeeds and returns the body `This is private data.`.
      4. The gate is enforced by the route's permission check (not by the main handler).
    - `rubrics: []`
  - `e2e.spec.mjs`: Implement **Flow 3**, mirroring `rest-custom-endpoint/e2e.spec.mjs` lifecycle (no post seeding) and using **both** REST channels. `test.describe("rest-api-permission-check scenario", …)`. `beforeAll(async ({ requestUtils }, workerInfo) => { deactivateAllPlugins(); await requestUtils.activatePlugin(`plugin-rest-api-permission-check-${workerInfo.project.metadata.agentId}`); })`. `afterAll(() => { deactivateAllPlugins(); })`. One test (`async ({ page, requestUtils })`): anonymous half — `const denied = await page.request.get("/wp-json/example/v1/private"); expect(denied.status()).toBe(401);`; authenticated half — `const body = await requestUtils.rest({ path: "/example/v1/private" }); expect(body).toBe("This is private data.");`. **The authenticated half asserts the returned BODY, never a status number** — `requestUtils.rest` exposes no `.status()` and throws on non-2xx, so a returned matching body is success; writing `expect(...).toBe(200)` on the `rest()` result would be a coding error. Keep the asserted route/status/body in lockstep with the prompt's pinned literals.
- **Depends on:** none
- **Traces to:** Spec requirements A.1, A.2, A.3, A.4, A.5, B.7, B.8, B.9, B.10, C.11, E.16, E.17, E.18; Acceptance criteria 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 16, 17, 18; Design "Scenario 3 — `rest-api-permission-check`"; Design decisions "Implement three e2e scenarios…", "Permission scenario pins 401 (not 403) for the anonymous case and asserts the authed body (not a status)", "Reuse the `rest-custom-endpoint` e2e lifecycle verbatim", "Pin every e2e-asserted literal in the prompt", "Add zero new shared rubrics", "Apply `rest-api-*` pseudo-folder naming".
- **Acceptance:**
  - `eval/scenarios/rest-api-permission-check/scenario.yaml` exists with `name: rest-api-permission-check` (== directory name, matching `/^[a-z0-9-]+$/`), `skills: [wordpress-development]`, and `rubrics: []` (explicit empty array); no catalog-only fields and no embedded URL.
  - The `prompt` reads as a user-voice, outcome-phrased request and names no API/tool/function (no `register_rest_route`, `permission_callback`, `current_user_can`); it pins the route `/wp-json/example/v1/private`, the anonymous status `401` (not 403), and the success body `This is private data.`, and centers the auth-gating concept.
  - The `acceptance` list contains exactly the four points above, including the anonymous-401 point, the authed-admin-returns-`This is private data.` point, and the "gate enforced by the permission check, not the main handler" point; no acceptance string contains a URL.
  - `eval/scenarios/rest-api-permission-check/e2e.spec.mjs` activates `plugin-rest-api-permission-check-<agentId>` (slug derived from `agentId`), does **no** post seeding, anonymously GETs `/wp-json/example/v1/private` asserting status `401`, and calls `requestUtils.rest({ path: "/example/v1/private" })` asserting the returned body equals `This is private data.` (asserting the **body**, never a status).
  - The spec imports `deactivateAllPlugins` from `../../utils/wp-cli.mjs` and `expect`/`test` from `@wordpress/e2e-test-utils-playwright`, resets plugin state in `beforeAll`, and cleans up with `deactivateAllPlugins()` in `afterAll`.
  - `node --check eval/scenarios/rest-api-permission-check/e2e.spec.mjs` succeeds and Playwright would collect it without errors.
  - Running Skillsmith on `eval/scenarios/rest-api-permission-check` would execute to a graded result without harness/configuration errors (failing grade acceptable). [Not run by this phase.]
  - No file under `skills/wordpress-development/`, `eval/rubrics/`, the iAPI `_candidates.yaml`, or any existing scenario directory is added or modified by this task.

---

### Task 4: Update the REST API section of the existing catalog `_wp-dev-candidates.yaml`

- **Goal:** Edit the existing catalog `eval/scenarios/_wp-dev-candidates.yaml` **in place** so its `# === Area: REST API ===` section **promotes** the `rest-api-custom-field-on-post` stub to a full record, **adds two new full records** (`rest-api-route-validation`, `rest-api-permission-check`) with `prompt`/`acceptance` matching the shipped `scenario.yaml` files verbatim and `source_files` provenance, **annotates** the `rest-api-authentication-nonce` stub as deferred, creates **no** `_fields`/`_embed` stub, and **fixes the one stale header line** — while leaving every non-REST-API record and the iAPI `_candidates.yaml` untouched. This is where documentation provenance for the three scenarios lives.
- **Type:** e2e (writer: `code-writer-e2e`; **catalog-data deliverable** — edits the single catalog file only, **no** `e2e.spec.mjs` and **no** scenario directory)
- **Files to change:**
  - `eval/scenarios/_wp-dev-candidates.yaml` (MODIFY existing — leading-underscore **non-directory** file; edit only the REST API section + the one stale header line)
- **Changes:**
  - **Fix the stale header line.** The top-of-file comment currently reads (around line 28–29): "Full prompt + acceptance are included for the implemented Plugins and Block Editor scenarios; all other records are lighter stubs." Update it to also list REST API — e.g. "Full prompt + acceptance are included for the implemented Plugins, Block Editor, and REST API scenarios; all other records are lighter stubs." This is the **only** header change.
  - **Locate the existing `# === Area: REST API ===` section** (currently two stubs: `rest-api-custom-field-on-post` and `rest-api-authentication-nonce`, between `# === Area: Code Reference ===` and `# === Area: WP-CLI Commands ===`). Edit only within this section (plus the header line above). Do not touch any other area's records or the iAPI `_candidates.yaml`.
  - **Promote `rest-api-custom-field-on-post` from stub to full record.** Remove its `# TODO: prompt + acceptance` comment. Keep/extend `name`, `description`, `difficulty: simple`, `concepts`, `source: dev.wordpress.org`, and `source_files` (the modifying-responses handbook + the `register_rest_field` reference, per the table below). Add `prompt` and `acceptance` whose strings match the shipped `eval/scenarios/rest-api-custom-field-on-post/scenario.yaml` (Task 1) **verbatim** — same text, same order, same quoting.
  - **Add two brand-new full records** under an `# Implemented REST API scenarios — full records` sub-header (mirroring the Block Editor pattern at line 52): `rest-api-route-validation` and `rest-api-permission-check`. Each mirrors the established catalog-record shape — `name` (== the scenario's directory name and `scenario.yaml` `name`), `description`, `difficulty: simple`, `concepts` (short descriptive list, not asserted), `source: dev.wordpress.org`, `source_files` (per the table below), `prompt`, `acceptance` — where `prompt` and `acceptance` are the **exact same verbatim strings** as the shipped `scenario.yaml` from Tasks 2 and 3 (1:1 identity — same pinned literals, same order, same quoting).

    | Record `name` | `source_files` | Suggested `concepts` |
    |---|---|---|
    | `rest-api-custom-field-on-post` | `https://developer.wordpress.org/rest-api/extending-the-rest-api/modifying-responses/` and `https://developer.wordpress.org/reference/functions/register_rest_field/` | `[register_rest_field, rest_api_init, modifying-responses, get_callback]` |
    | `rest-api-route-validation` | `https://developer.wordpress.org/rest-api/extending-the-rest-api/routes-and-endpoints/` | `[register_rest_route, route-arguments, validation, enum]` |
    | `rest-api-permission-check` | `https://developer.wordpress.org/rest-api/extending-the-rest-api/routes-and-endpoints/` and `https://developer.wordpress.org/reference/functions/rest_authorization_required_code/` | `[register_rest_route, permission_callback, authentication, rest_authorization_required_code]` |
  - **Annotate `rest-api-authentication-nonce` as a lighter stub.** Replace its `# TODO: prompt + acceptance` comment with a `# Deferred: <reason>` comment recording: intermediate difficulty; needs a JS toolchain; not cleanly REST-assertable; the server-side authentication sub-area is covered by the new `rest-api-permission-check` scenario; not yet implemented. Keep it a stub (no `prompt`/`acceptance` added); leave its `name`/`description`/`difficulty`/`concepts`/`source`/`source_files` unchanged.
  - **Create NO `_fields`/`_embed` stub.** Global parameters need zero server-side registration, so there is no plugin code to author or grade; the exclusion is recorded solely in the spec's Out of Scope section (item 7), never as a catalog entry. Add no such record.
  - **Do NOT** create a directory or any `scenario.yaml`/`e2e.spec.mjs` for this task — the catalog is a single flat file edited in place. **Do NOT** modify the existing `eval/scenarios/_candidates.yaml` (iAPI catalog). **Do NOT** add or alter any non-REST-API record.
- **Depends on:** none (the three full records reuse the verbatim prompt/acceptance fixed in Tasks 1–3 by this plan; the writer copies the same pinned strings — Task 4 needs no prior task to complete first)
- **Traces to:** Spec requirements A.6, D.12, D.13, D.14, D.15, E.17, E.18; Acceptance criteria 6, 12, 13, 14, 15, 17, 18; Design "Catalog promotion + reconciliation"; Design decision "Promote one stub to full, add two full records, annotate one stub as deferred; confine all edits to the REST API section".
- **Acceptance:**
  - `eval/scenarios/_wp-dev-candidates.yaml` still exists as a **non-directory** leading-underscore file and **parses as valid YAML**; it is still **NOT enumerated as a scenario** by Skillsmith discovery.
  - The top-of-file header comment listing which areas have full prompt+acceptance now lists **REST API** alongside Plugins and Block Editor; this is the **only** header change.
  - Under `# === Area: REST API ===`, `rest-api-custom-field-on-post` is a **full record** with its `# TODO: prompt + acceptance` comment **removed**, carrying `prompt` + `acceptance` whose strings match `eval/scenarios/rest-api-custom-field-on-post/scenario.yaml` **verbatim**, plus `source_files` citing the modifying-responses handbook and the `register_rest_field` reference.
  - Two **new full records** `rest-api-route-validation` and `rest-api-permission-check` exist under the REST API area, each carrying `prompt` + `acceptance` matching the corresponding `scenario.yaml` (Tasks 2, 3) **verbatim**, plus `source_files` per the table above (the routes-and-endpoints handbook for both; the permission record additionally cites `rest_authorization_required_code`).
  - `rest-api-authentication-nonce` remains a **lighter stub** (no `prompt`/`acceptance`) whose `# TODO` comment has been **replaced** by a `# Deferred: <reason>` comment recording the defer reason (intermediate; JS toolchain; not cleanly REST-assertable; server-side auth covered by `rest-api-permission-check`; not yet implemented); its other fields are unchanged.
  - **No** `_fields`/`_embed` catalog stub or record is added.
  - Every implemented REST API sub-area is represented by exactly one full record under its final scenario name (`rest-api-custom-field-on-post`, `rest-api-route-validation`, `rest-api-permission-check`); there is **no orphaned stub duplicating an implemented sub-area and no name mismatch** between a catalog record and a scenario directory.
  - The existing `eval/scenarios/_candidates.yaml` (iAPI catalog) is **not** modified, and **no non-REST-API record** in `_wp-dev-candidates.yaml` is added, removed, or altered (only REST records and the one header line change).
  - No file under `skills/wordpress-development/`, `eval/rubrics/`, or any existing scenario directory is added or modified by this task.

## Coverage check (acceptance criteria → tasks)

- **AC 1 (one area: REST API):** Tasks 1–3 all implement REST API scenarios only; no existing scenario is re-scoped or renamed.
- **AC 2 (one simple scenario per major uncovered sub-area, custom-endpoint excluded):** Tasks 1–3 cover modifying responses, argument validation, and permission-gating — one simple single-concept scenario each; none re-covers custom-endpoint registration.
- **AC 3 (adopted batch of three, all e2e):** three implemented scenarios (Tasks 1–3), each shipping an `e2e.spec.mjs`, on the scale of prior reviews.
- **AC 4 (each scenario one concept, one plugin edit):** each scenario is a single `index.php` edit on `rest_api_init`, with a handful of acceptance points, no second route/block/theme, no JS toolchain, no multi-step task (stated per task and in shared conventions).
- **AC 5 (no duplication with covered sub-areas):** Task 1 is a top-level field (distinct from `post-meta-rest`'s `.meta`); Tasks 2–3 center validation and auth-gating (distinct from `rest-custom-endpoint`'s registration concept).
- **AC 6 (defer-with-reason recorded):** Task 4 annotates `rest-api-authentication-nonce` as a `# Deferred` stub and creates no `_fields`/`_embed` stub.
- **AC 7 (all three ship an `e2e.spec.mjs` with the right channels and lifecycle):** Tasks 1–3 ship specs following the `rest-custom-endpoint` lifecycle — anon GET of a seeded post (1), anon good→200 / bad→400 (2), anon→401 + authed body (3).
- **AC 8 (asserted literals pinned in prompt; permission status is 401):** every literal each spec asserts is pinned in the scenario's prompt (Tasks 1–3); the permission scenario pins 401 (not 403) in prompt, spec, and acceptance.
- **AC 9 (schema conformance, tool-agnostic, doc-grounded):** Tasks 1–3 (`name`==dir, required keys, `rubrics: []`, no catalog-only fields, tool-agnostic prompts, URL-free acceptance) + Task 4 (provenance in `source_files`).
- **AC 10 (default zero rubrics):** every scenario task declares `rubrics: []`; no `eval/rubrics/` file added in any task.
- **AC 11 (`rest-api-*` naming applied uniformly; existing scenarios not renamed):** each new scenario's directory name == `scenario.yaml` `name` == catalog record `name`, all carrying the `rest-api-` prefix; the no-disruption obligation forbids renaming existing scenarios.
- **AC 12 (full catalog record per implemented scenario, 1:1 identity, verbatim):** Task 4 promotes one and adds two full records with verbatim prompt/acceptance and `source_files`; no source URL in any `scenario.yaml`.
- **AC 13 (stubs reconciled; no stale or mismatched records):** Task 4 promotes `rest-api-custom-field-on-post` (drops `# TODO`), adds the two full records, and annotates `rest-api-authentication-nonce` as `# Deferred`; each implemented sub-area maps to exactly one full record.
- **AC 14 (stale header line kept accurate):** Task 4 updates the one header line to list REST API alongside Plugins and Block Editor — the only header change.
- **AC 15 (iAPI catalog and other records untouched):** Task 4 edits only the REST API section + the one header line; the no-disruption obligation forbids touching `_candidates.yaml` and non-REST records.
- **AC 16 (discoverable + e2e-collectable, pass not required):** every task's Acceptance includes the structural bar (scenario-shape discoverable; `node --check` / Playwright collection for specs; catalog parses and is not enumerated); failing grade acceptable; no full matrix / wp-env / plugin code.
- **AC 17 (skill unchanged):** every task forbids changes under `skills/wordpress-development/`.
- **AC 18 (existing suite intact; flat discovery preserved):** every task forbids modifying existing scenarios, the iAPI `_candidates.yaml`, and `eval/rubrics/`; new directories are flat immediate children of `eval/scenarios/`.
