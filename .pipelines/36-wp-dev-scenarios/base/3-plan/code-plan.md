# Code Plan: Initial simple WordPress development scenarios

## Overview

This batch adds **four new Skillsmith eval scenarios** under `eval/scenarios/` that broaden the suite beyond the Interactivity API, across four distinct WordPress development topic areas: **Hooks/Filters** (`filter-body-class`), **Shortcodes** (`shortcode-with-attr`), **Custom Post Types** (`cpt-register`), and **REST API custom endpoints** (`rest-custom-endpoint`). The "code" produced here is **scenario definition files**, not WordPress plugin code — the plugin under test is authored at run time by the Skillsmith testing agent against a scaffold the harness provides. Each scenario directory contains exactly two files mirroring `eval/scenarios/counter/`: a `scenario.yaml` (discovery + judge input) and an `e2e.spec.mjs` (the automated Playwright end-to-end test run under `wp-env`). The plan is one task per scenario (four tasks total), each independently verifiable. Tasks have no ordering dependencies on each other; they are numbered for reference only and may be executed in any order or in parallel. The batch adds **zero** new rubrics, reorganizes no existing scenario, and modifies no file under `skills/wordpress-development/`.

## Guardrail scopes

No project guardrails. This project defines no scoped gates, so there is no guardrail scope to fill.

## E2E test plan

The four scenarios' `e2e.spec.mjs` files **are** the automated end-to-end tests. Each is a Playwright spec run by `eval/utils/verify-e2e.ts` inside a `wp-env` runtime; each activates exactly its own scaffolded plugin (`plugin-<scenario.name>-<agentId>`) and asserts the one runtime-visible outcome that proves the feature works. The remaining per-scenario acceptance points are judge-checked against the produced PHP, not asserted by the e2e spec. The lifecycle pattern is fixed by the existing `counter` and `config-fetch` specs: `beforeAll` calls `deactivateAllPlugins()` then `requestUtils.activatePlugin(...)`; `afterAll` calls `deactivateAllPlugins()` and (when posts were seeded) `requestUtils.deleteAllPosts()`. The plugin slug is always derived as `` `plugin-<name>-${workerInfo.project.metadata.agentId}` `` — never hard-coded.

### Flow 1: Front-end body class added via a filter

- **Steps:** Deactivate all plugins; activate `plugin-filter-body-class-<agentId>`. Navigate to the front-end home page (`page.goto('/')`).
- **Expected:** The `<body>` element's `class` attribute contains `my-custom-class` (e.g. `await expect(page.locator('body')).toHaveClass(/my-custom-class/)`).
- **Traces to:** Acceptance criterion 6 (mixed verification — e2e where feasible); `filter-body-class` acceptance point 4 (custom class appears in the front-end `<body>`).

### Flow 2: Shortcode renders its attribute on the front end

- **Steps:** Deactivate all plugins; activate `plugin-shortcode-with-attr-<agentId>`. Seed a published post whose content is `[greeting name="Alice"]` via `requestUtils.createPost({ content: '[greeting name="Alice"]', status: 'publish' })`. Navigate to the post (`page.goto('/?p=<post.id>')`). Clean up posts in `afterAll`.
- **Expected:** The rendered page contains the text `Alice` (e.g. `await expect(page.locator('body')).toContainText('Alice')`). The spec asserts only that the text appears — it does **not** pin the surrounding HTML structure.
- **Traces to:** Acceptance criterion 6; `shortcode-with-attr` acceptance point 5 (rendered page contains a greeting including "Alice").

### Flow 3: Custom post type exposed via the REST collection route

- **Steps:** Deactivate all plugins; activate `plugin-cpt-register-<agentId>`. Issue an authenticated GET to the CPT collection route: `const resp = await page.request.get('/wp-json/wp/v2/books')`. No DOM, no post seeding.
- **Expected:** `resp.status() === 200` (a registered, REST-exposed CPT's collection route returns 200 even when empty; an empty array is a valid body).
- **Traces to:** Acceptance criterion 6; `cpt-register` acceptance point 5 (GET `/wp-json/wp/v2/books` returns HTTP 200 when the plugin is active). CPT slug pinned to `books` per the design's anti-drift decision.

### Flow 4: Custom REST endpoint returns a JSON message

- **Steps:** Deactivate all plugins; activate `plugin-rest-custom-endpoint-<agentId>`. Issue an authenticated GET to the pinned route: `const resp = await page.request.get('/wp-json/myplugin/v1/hello')`. No DOM, no post seeding.
- **Expected:** `resp.status() === 200` and the parsed JSON body has a `message` field (e.g. `expect(await resp.json()).toHaveProperty('message')`).
- **Traces to:** Acceptance criterion 6; `rest-custom-endpoint` acceptance point 5 (GET the registered route returns 200 + JSON with a `message` field). Route pinned to `/wp-json/myplugin/v1/hello` per the design's anti-drift decision.

## Tasks

> Shared conventions for **all four** tasks (transcribe faithfully — these are design-doc obligations, not new decisions):
> - Each task creates exactly one directory `eval/scenarios/<dir>/` with two files: `scenario.yaml` and `e2e.spec.mjs`.
> - `scenario.yaml` keys, in this order: `name`, `description`, `skills: [wordpress-development]` (as a list item `- wordpress-development`), `prompt` (block scalar `|`), `acceptance` (list), `rubrics: []`. **`rubrics: []` must be present as an explicit empty array** — an omitted key or a valueless `rubrics:` fails Skillsmith discovery (`isScenarioShape` checks `Array.isArray(r.rubrics)`) and the scenario is silently skipped. Do not add any rubric file.
> - `name` equals the directory name for every scenario in this batch, so the scaffolded plugin slug is `plugin-<dir>-<agentId>`.
> - `prompt` is the exact user-voice string given per task below — copy it verbatim. It must remain tool-agnostic (no API/function names). Where a slug or route is pinned (`books`, `/wp-json/myplugin/v1/hello`), keep the prompt string and the e2e assertion target in lockstep.
> - `acceptance` is the exact list given per task below — copy verbatim; these points are what the LLM judge grades and include the "return, don't echo" / escaping obligations.
> - `e2e.spec.mjs` follows the existing spec pattern: `import { expect, test } from "@wordpress/e2e-test-utils-playwright";` and `import { deactivateAllPlugins } from "../../utils/wp-cli.mjs";`, a `test.describe(...)` block, `beforeAll`/`afterAll` lifecycle as above, slug derived from `` `plugin-<dir>-${workerInfo.project.metadata.agentId}` ``.
> - These are **Type `e2e`** tasks: the deliverable is scenario definitions whose automated test is the Playwright `e2e.spec.mjs`. No WordPress plugin PHP/JS is written here (the testing agent authors that at run time against the harness scaffold). No `tdd` task is warranted — there is no unit-testable production module in this batch; the only executable artifact is the e2e spec itself.

---

### Task 1: Create the `filter-body-class` (Hooks/Filters) scenario

- **Goal:** Add a scenario that asks for a custom CSS class on every front-end `<body>`, exercising the Hooks/Filters topic area, with an e2e spec that asserts the class appears.
- **Type:** e2e
- **Files to change:**
  - `eval/scenarios/filter-body-class/scenario.yaml` (new)
  - `eval/scenarios/filter-body-class/e2e.spec.mjs` (new)
- **Changes:**
  - `scenario.yaml`:
    - `name: filter-body-class`
    - `description:` a one-line summary (e.g. "Add a custom CSS class to the front-end body via a filter.").
    - `skills: [wordpress-development]`
    - `prompt` (verbatim, block scalar):
      > I want my WordPress plugin to add a custom CSS class called `my-custom-class` to every page's `<body>` element on the front end, so I can target the whole site with a single CSS rule.
    - `acceptance` (verbatim list):
      1. Plugin registers a callback via `add_filter('body_class', ...)` that appends a custom CSS class to the array.
      2. The filter callback receives the `$classes` array, appends the custom class, and **returns** the modified array (does not echo or produce direct output).
      3. The callback guards against admin pages — the custom class appears only on front-end pages (not in the WordPress admin).
      4. The custom CSS class appears in the `<body>` element's `class` attribute on the front end.
    - `rubrics: []`
  - `e2e.spec.mjs`: Implement **Flow 1**. `beforeAll`: `deactivateAllPlugins()`, then `await requestUtils.activatePlugin(`plugin-filter-body-class-${workerInfo.project.metadata.agentId}`)`. One test: `await page.goto('/')`, then `await expect(page.locator('body')).toHaveClass(/my-custom-class/)`. `afterAll`: `deactivateAllPlugins()` (no posts seeded, so `deleteAllPosts()` is optional). No post seeding needed.
- **Depends on:** none
- **Traces to:** Spec requirements 1, 2, 3, 5, 6, 7; Spec acceptance criteria 1, 2, 3, 6, 7; Design doc "Scenario 1 — `filter-body-class`"; Design decision "Four topic areas, one scenario each"; Design decision "All four scenarios include an `e2e.spec.mjs`".
- **Acceptance:**
  - `eval/scenarios/filter-body-class/scenario.yaml` exists with keys `name`, `description`, `skills`, `prompt`, `acceptance`, and `rubrics`, where `name` is `filter-body-class`, `skills` is exactly `[wordpress-development]`, and `rubrics` is an explicit empty array `[]`.
  - The `prompt` reads as a user-voice request by outcome and names no API/tool/function (no "filter", "add_filter", "hook").
  - The `acceptance` list contains exactly the four points above, including the "returns the modified array (does not echo)" and admin-guard points.
  - `eval/scenarios/filter-body-class/e2e.spec.mjs` activates `plugin-filter-body-class-<agentId>` (slug derived from `workerInfo.project.metadata.agentId`, not hard-coded), navigates to `/`, and asserts the `<body>` carries class `my-custom-class`.
  - The spec imports `deactivateAllPlugins` from `../../utils/wp-cli.mjs` and `expect`/`test` from `@wordpress/e2e-test-utils-playwright`, and resets plugin state in `beforeAll`.
  - Running `npx skillsmith eval/scenarios/filter-body-class` executes to a graded result without harness/configuration errors (a failing grade against the current skill is acceptable).
  - No file under `skills/wordpress-development/` and no file under `eval/rubrics/` is added or modified by this task.

---

### Task 2: Create the `shortcode-with-attr` (Shortcodes) scenario

- **Goal:** Add a scenario that asks for a `[greeting name="…"]` shortcode with an attribute and a default fallback, exercising the Shortcodes topic area, with an e2e spec that seeds a post containing the shortcode and asserts the attribute renders.
- **Type:** e2e
- **Files to change:**
  - `eval/scenarios/shortcode-with-attr/scenario.yaml` (new)
  - `eval/scenarios/shortcode-with-attr/e2e.spec.mjs` (new)
- **Changes:**
  - `scenario.yaml`:
    - `name: shortcode-with-attr`
    - `description:` a one-line summary (e.g. "Register a `greeting` shortcode that renders a name attribute with a default.").
    - `skills: [wordpress-development]`
    - `prompt` (verbatim, block scalar):
      > I want to create a WordPress shortcode called `greeting` that I can drop into any post or page. When I write `[greeting name="Alice"]` in the editor, I want it to display a greeting message to Alice on the front end. The shortcode should fall back to a default name if none is provided.
    - `acceptance` (verbatim list):
      1. Plugin registers a shortcode via `add_shortcode()` (hooked on `init` or called after theme setup).
      2. The shortcode callback accepts `$atts` and uses `shortcode_atts()` to merge user-supplied attributes with defaults (so omitting the `name` attribute falls back to the default).
      3. The callback **returns** an HTML string — it does not echo or print directly.
      4. The output escapes the attribute value before rendering it (e.g. `esc_html()` or `esc_attr()`).
      5. Placing `[greeting name="Alice"]` in a post causes the rendered page to contain a greeting message including "Alice".
    - `rubrics: []`
  - `e2e.spec.mjs`: Implement **Flow 2**. `beforeAll`: `deactivateAllPlugins()`, `await requestUtils.activatePlugin(`plugin-shortcode-with-attr-${workerInfo.project.metadata.agentId}`)`, then seed `post = await requestUtils.createPost({ content: '[greeting name="Alice"]', status: 'publish' })`. One test: `await page.goto(`/?p=${post.id}`)`, then assert the rendered content contains "Alice" (e.g. `await expect(page.locator('body')).toContainText('Alice')`). `afterAll`: `deactivateAllPlugins()` and `await requestUtils.deleteAllPosts()`. Assert only the text "Alice" — do not pin the surrounding HTML element/structure.
- **Depends on:** none
- **Traces to:** Spec requirements 1, 2, 3, 5, 6, 7; Spec acceptance criteria 1, 2, 3, 6, 7; Design doc "Scenario 2 — `shortcode-with-attr`"; Design decision "Four topic areas, one scenario each"; Design "Shortcode output shape is intentionally unconstrained".
- **Acceptance:**
  - `eval/scenarios/shortcode-with-attr/scenario.yaml` exists with `name: shortcode-with-attr`, `skills: [wordpress-development]`, and `rubrics: []` (explicit empty array).
  - The `prompt` reads as a user-voice request by outcome and names no API/tool/function (no "shortcode_atts", "add_shortcode"); it may name the literal shortcode tag `greeting` and the example usage, which are user-facing.
  - The `acceptance` list contains exactly the five points above, including the `shortcode_atts()` default-merge, "returns an HTML string (does not echo)", and escaping points.
  - `eval/scenarios/shortcode-with-attr/e2e.spec.mjs` activates `plugin-shortcode-with-attr-<agentId>` (slug derived from `agentId`), seeds a published post with content `[greeting name="Alice"]`, navigates to that post, and asserts the rendered page contains the text "Alice" without pinning a specific HTML element.
  - The spec cleans up with `deactivateAllPlugins()` and `requestUtils.deleteAllPosts()` in `afterAll`.
  - Running `npx skillsmith eval/scenarios/shortcode-with-attr` executes to a graded result without harness/configuration errors.
  - No file under `skills/wordpress-development/` and no file under `eval/rubrics/` is added or modified by this task.

---

### Task 3: Create the `cpt-register` (Custom Post Types) scenario

- **Goal:** Add a scenario that asks for a `books` content type accessible in the admin and via REST, exercising the Custom Post Types topic area, with an e2e spec that asserts the CPT's REST collection route returns 200.
- **Type:** e2e
- **Files to change:**
  - `eval/scenarios/cpt-register/scenario.yaml` (new)
  - `eval/scenarios/cpt-register/e2e.spec.mjs` (new)
- **Changes:**
  - `scenario.yaml`:
    - `name: cpt-register`
    - `description:` a one-line summary (e.g. "Register a `books` custom post type exposed in the admin and the REST API.").
    - `skills: [wordpress-development]`
    - `prompt` (verbatim, block scalar — slug `books` pinned to remove e2e drift):
      > I want my WordPress plugin to add a new content type for storing book entries, using the identifier `books`. Editors should be able to create and manage these book entries from the WordPress admin, and the entries should be accessible via the WordPress REST API.
    - `acceptance` (verbatim list):
      1. `register_post_type()` is called on the `init` action hook.
      2. The post-type identifier does not begin with `wp_` and does not exceed 20 characters.
      3. The `labels` array includes at least `name` and `singular_name`, with strings wrapped in `__()` for translation.
      4. `public => true` and `show_in_rest => true` are both set so the CPT is publicly accessible and exposed via the REST API.
      5. A GET request to `/wp-json/wp/v2/books` returns HTTP 200 when the plugin is active.
    - `rubrics: []`
  - `e2e.spec.mjs`: Implement **Flow 3**. `beforeAll`: `deactivateAllPlugins()`, `await requestUtils.activatePlugin(`plugin-cpt-register-${workerInfo.project.metadata.agentId}`)`. One test: `const resp = await page.request.get('/wp-json/wp/v2/books')`, then `expect(resp.status()).toBe(200)`. No DOM, no post seeding. `afterAll`: `deactivateAllPlugins()` (no posts seeded). Keep the asserted route `/wp-json/wp/v2/books` in lockstep with the prompt's pinned `books` identifier.
- **Depends on:** none
- **Traces to:** Spec requirements 1, 2, 3, 5, 6, 7; Spec acceptance criteria 1, 2, 3, 6, 7; Design doc "Scenario 3 — `cpt-register`"; Design decision "Pin the CPT identifier and the REST route in the prompts".
- **Acceptance:**
  - `eval/scenarios/cpt-register/scenario.yaml` exists with `name: cpt-register`, `skills: [wordpress-development]`, and `rubrics: []` (explicit empty array).
  - The `prompt` reads as a user-voice request by outcome and names no API/tool/function (no "register_post_type", "custom post type API"); it may name the literal identifier `books` and "REST API", which are user-facing.
  - The `acceptance` list contains exactly the five points above, including the `init` hook, the identifier constraints (`< 20` chars, not `wp_`-prefixed), the `name`/`singular_name`/`__()` labels point, and the `public => true` + `show_in_rest => true` point.
  - `eval/scenarios/cpt-register/e2e.spec.mjs` activates `plugin-cpt-register-<agentId>` (slug derived from `agentId`), issues `page.request.get('/wp-json/wp/v2/books')`, and asserts the response status is 200.
  - The asserted REST route is exactly `/wp-json/wp/v2/books`, matching the prompt's pinned `books` identifier.
  - Running `npx skillsmith eval/scenarios/cpt-register` executes to a graded result without harness/configuration errors.
  - No file under `skills/wordpress-development/` and no file under `eval/rubrics/` is added or modified by this task.

---

### Task 4: Create the `rest-custom-endpoint` (REST API custom endpoints) scenario

- **Goal:** Add a scenario that asks for a custom JSON endpoint at `/wp-json/myplugin/v1/hello` returning a `message` field, exercising the REST API custom-endpoint topic area, with an e2e spec that asserts the route returns 200 and a `message` field.
- **Type:** e2e
- **Files to change:**
  - `eval/scenarios/rest-custom-endpoint/scenario.yaml` (new)
  - `eval/scenarios/rest-custom-endpoint/e2e.spec.mjs` (new)
- **Changes:**
  - `scenario.yaml`:
    - `name: rest-custom-endpoint`
    - `description:` a one-line summary (e.g. "Register a custom REST endpoint returning a JSON greeting message.").
    - `skills: [wordpress-development]`
    - `prompt` (verbatim, block scalar — path pinned so the e2e can assert it directly):
      > I want my WordPress plugin to expose a simple JSON endpoint that returns a greeting message. When someone sends a GET request to `/wp-json/myplugin/v1/hello`, they should get back a JSON response with a `message` field.
    - `acceptance` (verbatim list):
      1. Route is registered via `register_rest_route()` inside an `add_action('rest_api_init', ...)` callback.
      2. The namespace follows the `vendor/v1` pattern (a plugin-scoped prefix, not a bare generic name).
      3. A `permission_callback` is explicitly set on the route — a public endpoint uses `'__return_true'` (not omitted, which would trigger a `_doing_it_wrong` notice as of WP 5.5).
      4. The callback **returns** data (a plain array or `WP_REST_Response`) rather than echoing JSON or calling `wp_send_json()` / `die()`.
      5. A GET request to the registered route returns HTTP 200 and a JSON body containing a `message` field.
    - `rubrics: []`
  - `e2e.spec.mjs`: Implement **Flow 4**. `beforeAll`: `deactivateAllPlugins()`, `await requestUtils.activatePlugin(`plugin-rest-custom-endpoint-${workerInfo.project.metadata.agentId}`)`. One test: `const resp = await page.request.get('/wp-json/myplugin/v1/hello')`, then `expect(resp.status()).toBe(200)` and `expect(await resp.json()).toHaveProperty('message')`. No DOM, no post seeding. `afterAll`: `deactivateAllPlugins()`. Keep the asserted route `/wp-json/myplugin/v1/hello` in lockstep with the prompt's pinned path.
- **Depends on:** none
- **Traces to:** Spec requirements 1, 2, 3, 5, 6, 7; Spec acceptance criteria 1, 2, 3, 6, 7; Design doc "Scenario 4 — `rest-custom-endpoint`"; Design decision "Pin the CPT identifier and the REST route in the prompts".
- **Acceptance:**
  - `eval/scenarios/rest-custom-endpoint/scenario.yaml` exists with `name: rest-custom-endpoint`, `skills: [wordpress-development]`, and `rubrics: []` (explicit empty array).
  - The `prompt` reads as a user-voice request by outcome and names no API/tool/function (no "register_rest_route", "rest_api_init"); it may name the literal path `/wp-json/myplugin/v1/hello` and the `message` field, which are user-facing.
  - The `acceptance` list contains exactly the five points above, including the `rest_api_init` registration, the `vendor/v1` namespace, the explicit `permission_callback` (`'__return_true'`) point, and the "returns data (does not echo / no `wp_send_json()`/`die()`)" point.
  - `eval/scenarios/rest-custom-endpoint/e2e.spec.mjs` activates `plugin-rest-custom-endpoint-<agentId>` (slug derived from `agentId`), issues `page.request.get('/wp-json/myplugin/v1/hello')`, and asserts the response status is 200 and the JSON body has a `message` property.
  - The asserted route is exactly `/wp-json/myplugin/v1/hello`, matching the prompt's pinned path.
  - Running `npx skillsmith eval/scenarios/rest-custom-endpoint` executes to a graded result without harness/configuration errors.
  - No file under `skills/wordpress-development/` and no file under `eval/rubrics/` is added or modified by this task.
