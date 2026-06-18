# Code Plan: Exhaustive WordPress-development scenario taxonomy + first-area (Plugins) scenarios

## Overview

This batch ships three kinds of artifact under `eval/` (the Skillsmith eval suite), all without touching the `wordpress-development` skill: (1) **a candidate catalog file** `eval/scenarios/_wp-dev-candidates.yaml` — a committed, leading-underscore non-directory YAML file that mirrors the existing `eval/scenarios/_candidates.yaml` record shape, covers every one of the 10 top-level developer.wordpress.org areas with full `prompt`+`acceptance` only for the six first-area (Plugins) scenarios and lighter stubs elsewhere; and (2) **six new scenario directories** for the Plugins area — three with an `e2e.spec.mjs` (`taxonomy-register`, `post-meta-rest`, `settings-register`) and three judge-only with `scenario.yaml` only (`cron-event`, `i18n-textdomain`, `admin-menu-page`). The "code" produced here is **scenario-definition and catalog data**, not WordPress plugin code — the plugin under test is authored at run time by the Skillsmith testing agent against a harness scaffold. The plan is **one task per scenario (6) plus one task for the catalog (7 total)**; all tasks are independent with **no cross-task ordering dependencies** (numbered for reference only, executable in any order or in parallel). The batch adds **zero** new rubrics, reorganizes no existing scenario, leaves `_candidates.yaml` untouched, and modifies no file under `skills/wordpress-development/`. The reference taxonomy itself is a prose planning artifact reproduced in full in the design doc; it is not a code deliverable and is not planned here (it is delivered by the design/doc phases, not the code phase).

### Type field — why all tasks are Type `e2e`

There is **no unit-testable production module** in this batch. The plugin PHP that would be unit-tested is authored by the testing agent at run time, not by this phase; the judge-only scenarios and the catalog are config/data files. The only writer suited to producing scenario definitions and their Playwright specs is **`code-writer-e2e`**, so every task is **Type `e2e`** (there is no meaningful `tdd` RED/GREEN unit cycle to drive here — a `tdd` task would have no production module to test). For the three judge-only scenarios and the catalog task, **no `e2e.spec.mjs` is produced** — the deliverable is a `scenario.yaml`-only directory (judge-only) or the catalog file alone. Each such task's Changes and Acceptance state this explicitly so the writer does not author a spec where none is wanted.

### Verification bar (static/structural only)

Per the spec and design, verification is **static/structural only**. The bar per artifact:
- Each `scenario.yaml` is **discoverable** — passes Skillsmith's `isScenarioShape` (`name`/`description`/`skills`/`prompt`/`acceptance` present and well-typed; `rubrics` present as an array). `npx skillsmith <scenario-dir>` would execute to a graded result without harness/configuration errors. A **failing grade against the current skill is acceptable** and does not violate the bar.
- Each present `e2e.spec.mjs` is **loadable/collectable by Playwright** — it parses and its imports resolve (verifiable with `node --check` and Playwright collection).
- The catalog file **parses as YAML** and is **NOT discovered as a scenario** (it is a non-directory leading-underscore file, skipped by `enumerate.ts`'s non-directory guard before the YAML-existence guard).

Agents do **NOT** run the full `npx skillsmith` matrix, do **NOT** boot `wp-env`, and do **NOT** generate the plugin code.

## Guardrail scopes

**No project guardrails.** This project defines no scoped gates, so there is no guardrail scope to fill. (Section retained per the required document structure; intentionally empty.)

| Gate | Scope |
| ---- | ----- |
| None | None |

## E2E test plan

The three e2e scenarios' `e2e.spec.mjs` files **are** the automated end-to-end tests; the three judge-only scenarios and the catalog ship **no** spec. Each e2e spec is a Playwright spec run by `eval/utils/verify-e2e.ts` inside a `wp-env` runtime; each activates exactly its own scaffolded plugin (`plugin-<scenario.name>-<agentId>`) and asserts the one runtime-visible outcome that proves the feature works. Remaining per-scenario acceptance points are judge-checked against the produced PHP, not asserted by the e2e spec. The lifecycle is fixed by the existing `counter`/`cpt-register`/`rest-custom-endpoint` specs: `beforeAll` calls `deactivateAllPlugins()` then `await requestUtils.activatePlugin(...)` (optionally seeding a post); `afterAll` calls `deactivateAllPlugins()` (and `requestUtils.deleteAllPosts()` when a post was seeded). The plugin slug is always derived as `` `plugin-<name>-${workerInfo.project.metadata.agentId}` `` — never hard-coded. Every literal each spec asserts (`genre`, `subtitle`, `my_plugin_tagline`/`Hello world`) is pinned in that scenario's prompt, keeping prompt and assertion in lockstep.

### Flow 1: Custom taxonomy exposed via its REST collection route

- **Steps:** Deactivate all plugins; activate `plugin-taxonomy-register-<agentId>`. Issue an anonymous GET to the taxonomy collection route: `const resp = await page.request.get('/wp-json/wp/v2/genre')`. No DOM, no term seeding (there is no `createTerm` helper, and the route returns 200 with zero terms).
- **Expected:** `resp.status() === 200` — a registered, `show_in_rest` taxonomy whose default `rest_base` equals its name `genre` returns 200 even when empty (an empty array `[]` is a valid body).
- **Traces to:** Acceptance criterion 11 (mixed verification — e2e where feasible) and 12 (e2e loadable); Design "Scenario 1 — `taxonomy-register`"; `taxonomy-register` acceptance point 3 (`show_in_rest => true`). Taxonomy slug pinned to `genre`.

### Flow 2: Registered post meta surfaces under a post's REST `.meta`

- **Steps:** Deactivate all plugins; activate `plugin-post-meta-rest-<agentId>`. Seed a published post via `const post = await requestUtils.createPost({ status: 'publish' })` (a title may be supplied; content is not load-bearing). Issue a GET to the single-post REST route: `const resp = await page.request.get(`/wp-json/wp/v2/posts/${post.id}`)`, parse the JSON body. Clean up posts in `afterAll`.
- **Expected:** The parsed JSON has a `meta` object that contains the key `subtitle` (e.g. `expect(body.meta).toHaveProperty('subtitle')`). A registered `show_in_rest` single meta is always present under `.meta` (with its registered default) once registered, so the assertion is deterministic without writing a value.
- **Traces to:** Acceptance criterion 11, 12; Design "Scenario 2 — `post-meta-rest`"; `post-meta-rest` acceptance point 4 (`show_in_rest => true` so the value surfaces). Meta key pinned to `subtitle`.

### Flow 3: Registered setting surfaces in the site-settings REST payload with its default

- **Steps:** Deactivate all plugins; activate `plugin-settings-register-<agentId>`. Read site settings through the **authenticated** channel: `const settings = await requestUtils.getSiteSettings()` (equivalently `requestUtils.rest({ path: '/wp/v2/settings' })`) — `/wp/v2/settings` is admin-gated, so the authenticated `requestUtils` channel is required, not anon `page.request.get`. No DOM, no post seeding.
- **Expected:** The settings payload contains the key `my_plugin_tagline` and its value equals the registered default `Hello world` (e.g. `expect(settings.my_plugin_tagline).toBe('Hello world')`). A `show_in_rest` setting with a `default` returns that default even before any save, so the assertion is deterministic.
- **Traces to:** Acceptance criterion 11, 12; Design "Scenario 3 — `settings-register`"; `settings-register` acceptance point 1 (`show_in_rest => true` so it is exposed in REST). Option name pinned to `my_plugin_tagline`, default pinned to `Hello world`.

### Judge-only scenarios — no e2e flow

`cron-event`, `i18n-textdomain`, and `admin-menu-page` ship **no `e2e.spec.mjs`** and are graded by the LLM judge against their `acceptance` lists alone:
- **`cron-event`** — cron is asynchronous and time-dependent (flaky for e2e) with no clean REST/DOM surface. Judge-only deliberately.
- **`i18n-textdomain`** — the default `en_US` locale renders source strings unchanged, so nothing is observable without a shipped `.mo` file. Judge-only.
- **`admin-menu-page`** — the menu renders only inside wp-admin on a logged-in session; an admin-DOM e2e is heavier/flakier than the clean three. Judge-only per Requirement 11's "where impractical" allowance.

## Tasks

> **Shared conventions for ALL seven tasks** (transcribe faithfully — these are design-doc obligations, not new decisions):
>
> **Scenario tasks (1–6):**
> - Each task creates exactly one directory `eval/scenarios/<dir>/`. The three e2e tasks add **two** files (`scenario.yaml` + `e2e.spec.mjs`); the three judge-only tasks add **only** `scenario.yaml` (no `e2e.spec.mjs`).
> - `scenario.yaml` keys, in this order: `name`, `description`, `skills` (as a list item `- wordpress-development`), `prompt` (block scalar `|`), `acceptance` (list), `rubrics: []`. **`rubrics: []` must be present as an explicit empty array** — an omitted key or a valueless `rubrics:` fails Skillsmith discovery (`isScenarioShape` checks `Array.isArray(r.rubrics)`) and the scenario is silently skipped. Do **not** add any file under `eval/rubrics/`.
> - **No catalog-only fields** (`difficulty`, `concepts`, `source`, `source_files`) appear in any `scenario.yaml` — those live only in the catalog (Task 7).
> - `name` equals the directory name for every scenario in this batch (e.g. `taxonomy-register` → slug `plugin-taxonomy-register-<agentId>`).
> - `prompt` and `acceptance` are the **exact** strings given per task below — copy verbatim. The prompt must remain tool-agnostic (no API/function names like `register_taxonomy`/`register_post_meta`/`register_setting`/`wp_schedule_event`/`add_menu_page`/`__()`). Where a literal is pinned (`genre`, `subtitle`, `my_plugin_tagline`/`Hello world`), keep the prompt string and the e2e assertion target in lockstep.
> - `e2e.spec.mjs` (e2e tasks only) follows the existing spec pattern: `import { expect, test } from "@wordpress/e2e-test-utils-playwright";` and `import { deactivateAllPlugins } from "../../utils/wp-cli.mjs";`, a `test.describe(...)` block, `beforeAll`/`afterAll` lifecycle as in the E2E test plan, slug derived from `` `plugin-<dir>-${workerInfo.project.metadata.agentId}` ``.
> - These are **Type `e2e`** tasks (see "Type field" in Overview): the writer is `code-writer-e2e`. For judge-only tasks, **no `e2e.spec.mjs` is produced**.
>
> **Catalog task (7):** creates the single file `eval/scenarios/_wp-dev-candidates.yaml` and **no `e2e.spec.mjs`** and **no scenario directory** — it is a leading-underscore non-directory YAML file. See Task 7 for its structure.
>
> **No-disruption obligation (all tasks):** do not modify, move, or rename any existing scenario directory, the existing `eval/scenarios/_candidates.yaml`, any file under `eval/rubrics/`, or any file under `skills/wordpress-development/`.

---

### Task 1: Create the `taxonomy-register` (Taxonomies) scenario — **e2e**

- **Goal:** Add a scenario that asks for a `genre` taxonomy attached to posts and reachable through the site's data API, exercising the Plugins → Taxonomies sub-area, with an e2e spec asserting the taxonomy's REST collection route returns 200.
- **Type:** e2e
- **Files to change:**
  - `eval/scenarios/taxonomy-register/scenario.yaml` (new)
  - `eval/scenarios/taxonomy-register/e2e.spec.mjs` (new)
- **Changes:**
  - `scenario.yaml`:
    - `name: taxonomy-register`
    - `description:` a one-line summary (e.g. "Register a `genre` taxonomy on posts, exposed via the REST API.").
    - `skills: [wordpress-development]` (list item form)
    - `prompt` (verbatim, block scalar):
      > I want editors to be able to group and label my posts into a named set of terms — a "genre" classification (use the identifier `genre`) — and I want those genres reachable through my site's data API so other tools can read them.
    - `acceptance` (verbatim list — these are the judge checks; do NOT embed URLs):
      1. Registers the taxonomy on the `init` action hook (not before it).
      2. The taxonomy is attached to the `post` object type.
      3. `public => true` and `show_in_rest => true` are both set.
      4. The taxonomy identifier does not exceed 32 characters and uses only lowercase letters, dashes, and underscores.
      5. Labels (`name` / `singular_name`) are wrapped in `__()` for translation.
    - `rubrics: []`
  - `e2e.spec.mjs`: Implement **Flow 1**. `beforeAll`: `deactivateAllPlugins()`, then `await requestUtils.activatePlugin(`plugin-taxonomy-register-${workerInfo.project.metadata.agentId}`)`. One test: `const resp = await page.request.get('/wp-json/wp/v2/genre')`, then `expect(resp.status()).toBe(200)`. No DOM, no term/post seeding. `afterAll`: `deactivateAllPlugins()`. Keep the asserted route `/wp-json/wp/v2/genre` in lockstep with the prompt's pinned `genre` identifier.
- **Depends on:** none
- **Traces to:** Spec requirements 5, 6, 7, 8, 9, 11, 12; Acceptance criteria 5, 6, 7, 8, 9, 11, 12; Design "Scenario 1 — `taxonomy-register`"; Design decisions "Six scenarios (3 e2e + 3 judge-only)", "Mixed verification", "Pin every e2e-asserted literal".
- **Acceptance:**
  - `eval/scenarios/taxonomy-register/scenario.yaml` exists with keys `name`, `description`, `skills`, `prompt`, `acceptance`, `rubrics`, where `name` is `taxonomy-register`, `skills` is exactly `[wordpress-development]`, and `rubrics` is an explicit empty array `[]`.
  - The `scenario.yaml` contains **no** catalog-only fields (`difficulty`, `concepts`, `source`, `source_files`).
  - The `prompt` reads as a user-voice request by outcome and names no API/tool/function (no "taxonomy", "register_taxonomy", "init"); it may name the literal identifier `genre`, which is user-facing.
  - The `acceptance` list contains exactly the five points above; point 4 states the **32**-character maximum (NOT 20 — do not copy `cpt-register`'s CPT-key limit), and no acceptance string contains a URL.
  - `eval/scenarios/taxonomy-register/e2e.spec.mjs` activates `plugin-taxonomy-register-<agentId>` (slug derived from `workerInfo.project.metadata.agentId`, not hard-coded), issues `page.request.get('/wp-json/wp/v2/genre')`, and asserts the response status is 200.
  - The spec imports `deactivateAllPlugins` from `../../utils/wp-cli.mjs` and `expect`/`test` from `@wordpress/e2e-test-utils-playwright`, and resets plugin state in `beforeAll`.
  - `node --check eval/scenarios/taxonomy-register/e2e.spec.mjs` succeeds (spec parses), and Playwright would collect it without errors.
  - `npx skillsmith eval/scenarios/taxonomy-register` would execute to a graded result without harness/configuration errors (failing grade acceptable). [Not run by this phase; structural verification only.]
  - No file under `skills/wordpress-development/`, `eval/rubrics/`, or any existing scenario directory is added or modified by this task.

---

### Task 2: Create the `post-meta-rest` (Metadata) scenario — **e2e**

- **Goal:** Add a scenario that asks for an extra `subtitle` field stored on each post and readable through the site's data API, exercising the Plugins → Metadata sub-area, with an e2e spec asserting the meta surfaces under a post's REST `.meta`.
- **Type:** e2e
- **Files to change:**
  - `eval/scenarios/post-meta-rest/scenario.yaml` (new)
  - `eval/scenarios/post-meta-rest/e2e.spec.mjs` (new)
- **Changes:**
  - `scenario.yaml`:
    - `name: post-meta-rest`
    - `description:` a one-line summary (e.g. "Register a `subtitle` post meta exposed in the REST API.").
    - `skills: [wordpress-development]`
    - `prompt` (verbatim, block scalar):
      > I want to store an extra piece of information on each of my posts — a short subtitle, saved under the key `subtitle` — and have it available through my site's data API so other tools can read it back.
    - `acceptance` (verbatim list):
      1. Registers the post meta on the `init` action hook, targeting the core `post` type.
      2. `single => true` is set (the value is a single scalar, not an array).
      3. `type` is set (e.g. `string`).
      4. `show_in_rest => true` is set so the value surfaces in the REST API.
      5. The meta key is public (no leading underscore), so it is exposed rather than protected.
    - `rubrics: []`
  - `e2e.spec.mjs`: Implement **Flow 2**. `beforeAll`: `deactivateAllPlugins()`, `await requestUtils.activatePlugin(`plugin-post-meta-rest-${workerInfo.project.metadata.agentId}`)`, then seed `const post = await requestUtils.createPost({ status: 'publish' })`. One test: `const resp = await page.request.get(`/wp-json/wp/v2/posts/${post.id}`)`, parse JSON, and assert the `meta` object contains the `subtitle` key (e.g. `expect((await resp.json()).meta).toHaveProperty('subtitle')`). `afterAll`: `deactivateAllPlugins()` and `await requestUtils.deleteAllPosts()`. Keep the asserted key `subtitle` in lockstep with the prompt's pinned key.
- **Depends on:** none
- **Traces to:** Spec requirements 5, 6, 7, 8, 9, 11, 12; Acceptance criteria 5, 6, 7, 8, 9, 11, 12; Design "Scenario 2 — `post-meta-rest`"; Design decisions "Six scenarios (3 e2e + 3 judge-only)", "Mixed verification", "Pin every e2e-asserted literal".
- **Acceptance:**
  - `eval/scenarios/post-meta-rest/scenario.yaml` exists with `name: post-meta-rest`, `skills: [wordpress-development]`, and `rubrics: []` (explicit empty array); no catalog-only fields present.
  - The `prompt` reads as a user-voice request by outcome and names no API/tool/function (no "post meta", "register_post_meta", "REST"); it may name the literal key `subtitle`, which is user-facing.
  - The `acceptance` list contains exactly the five points above, including the `init`-hook/`post`-type point, `single => true`, `type`, `show_in_rest => true`, and the public-key (no leading underscore) point; no acceptance string contains a URL.
  - `eval/scenarios/post-meta-rest/e2e.spec.mjs` activates `plugin-post-meta-rest-<agentId>` (slug derived from `agentId`), seeds a published post via `requestUtils.createPost`, GETs `/wp-json/wp/v2/posts/<id>`, and asserts the response JSON's `meta` object contains a `subtitle` property.
  - The spec cleans up with `deactivateAllPlugins()` and `requestUtils.deleteAllPosts()` in `afterAll`.
  - `node --check eval/scenarios/post-meta-rest/e2e.spec.mjs` succeeds, and Playwright would collect it without errors.
  - `npx skillsmith eval/scenarios/post-meta-rest` would execute to a graded result without harness/configuration errors (failing grade acceptable). [Not run by this phase.]
  - No file under `skills/wordpress-development/`, `eval/rubrics/`, or any existing scenario directory is added or modified by this task.

---

### Task 3: Create the `settings-register` (Settings) scenario — **e2e**

- **Goal:** Add a scenario that asks for a site-wide `my_plugin_tagline` option (default `Hello world`) available through the site's data API, exercising the Plugins → Settings sub-area, with an e2e spec asserting the setting surfaces in the site-settings REST payload with its default.
- **Type:** e2e
- **Files to change:**
  - `eval/scenarios/settings-register/scenario.yaml` (new)
  - `eval/scenarios/settings-register/e2e.spec.mjs` (new)
- **Changes:**
  - `scenario.yaml`:
    - `name: settings-register`
    - `description:` a one-line summary (e.g. "Register a `my_plugin_tagline` setting exposed in the REST API with a default.").
    - `skills: [wordpress-development]`
    - `prompt` (verbatim, block scalar):
      > I want a site-wide configurable option my editors can set — a tagline override stored under `my_plugin_tagline`, defaulting to `Hello world` — and I want it available through my site's data API.
    - `acceptance` (verbatim list):
      1. Registers the setting with `show_in_rest => true` so it is exposed in the REST API.
      2. The setting is registered so that it surfaces in REST — on `init` or `rest_api_init` (NOT only on `admin_init`).
      3. `type` is set (e.g. `string`).
      4. A `default` is provided.
      5. A `sanitize_callback` is provided.
    - `rubrics: []`
  - `e2e.spec.mjs`: Implement **Flow 3**. `beforeAll`: `deactivateAllPlugins()`, `await requestUtils.activatePlugin(`plugin-settings-register-${workerInfo.project.metadata.agentId}`)`. One test: read settings via the **authenticated** channel — `const settings = await requestUtils.getSiteSettings()` (or `requestUtils.rest({ path: '/wp/v2/settings' })`) — and assert `settings.my_plugin_tagline === 'Hello world'` (key present and equal to its pinned default). No anon `page.request.get` (the route is admin-gated). No DOM, no post seeding. `afterAll`: `deactivateAllPlugins()`. Keep the asserted option name `my_plugin_tagline` and default `Hello world` in lockstep with the prompt.
- **Depends on:** none
- **Traces to:** Spec requirements 5, 6, 7, 8, 9, 11, 12; Acceptance criteria 5, 6, 7, 8, 9, 11, 12; Design "Scenario 3 — `settings-register`"; Design decisions "Six scenarios (3 e2e + 3 judge-only)", "Mixed verification", "Pin every e2e-asserted literal".
- **Acceptance:**
  - `eval/scenarios/settings-register/scenario.yaml` exists with `name: settings-register`, `skills: [wordpress-development]`, and `rubrics: []` (explicit empty array); no catalog-only fields present.
  - The `prompt` reads as a user-voice request by outcome and names no API/tool/function (no "setting", "register_setting", "REST"); it may name the literal option name `my_plugin_tagline` and default `Hello world`, which are user-facing.
  - The `acceptance` list contains exactly the five points above; point 2 explicitly requires registration on `init` or `rest_api_init` and rules out `admin_init`-only (the most-likely-mis-authored case); no acceptance string contains a URL.
  - `eval/scenarios/settings-register/e2e.spec.mjs` activates `plugin-settings-register-<agentId>` (slug derived from `agentId`), reads settings via the authenticated `requestUtils.getSiteSettings()` (or `requestUtils.rest({ path: '/wp/v2/settings' })`) channel, and asserts `my_plugin_tagline` is present and equals `Hello world`.
  - The spec resets plugin state in `beforeAll` and `afterAll` with `deactivateAllPlugins()`; no anon `page.request.get` is used for the settings read.
  - `node --check eval/scenarios/settings-register/e2e.spec.mjs` succeeds, and Playwright would collect it without errors.
  - `npx skillsmith eval/scenarios/settings-register` would execute to a graded result without harness/configuration errors (failing grade acceptable). [Not run by this phase.]
  - No file under `skills/wordpress-development/`, `eval/rubrics/`, or any existing scenario directory is added or modified by this task.

---

### Task 4: Create the `cron-event` (Cron) scenario — **judge-only**

- **Goal:** Add a scenario that asks for a recurring background task on a regular schedule, exercising the Plugins → Cron sub-area, as a **judge-only** scenario (no `e2e.spec.mjs`).
- **Type:** e2e (writer: `code-writer-e2e`; judge-only deliverable — produces `scenario.yaml` only, **no** `e2e.spec.mjs`)
- **Files to change:**
  - `eval/scenarios/cron-event/scenario.yaml` (new)
  - **No** `e2e.spec.mjs` is produced for this scenario.
- **Changes:**
  - `scenario.yaml`:
    - `name: cron-event`
    - `description:` a one-line summary (e.g. "Schedule a recurring background task via WP-Cron, cleaned up on deactivation.").
    - `skills: [wordpress-development]`
    - `prompt` (verbatim, block scalar):
      > I want my plugin to run a recurring background task automatically — say a periodic cleanup that runs on a regular schedule — without me having to trigger it manually.
    - `acceptance` (verbatim list):
      1. Schedules the event via `wp_schedule_event()`, guarded by a `wp_next_scheduled()` check so it is not scheduled more than once.
      2. The event is hooked to a named action with a callback that performs the task.
      3. Uses a valid built-in recurrence (`hourly`) — no custom interval (which would require the `cron_schedules` filter).
      4. Unschedules the event on plugin deactivation (`register_deactivation_hook` + `wp_unschedule_event()`, or `wp_clear_scheduled_hook()`).
    - `rubrics: []`
  - Do **not** create `eval/scenarios/cron-event/e2e.spec.mjs` — cron is async/time-dependent with no clean REST/DOM surface; this scenario is graded by judge against `acceptance` only.
- **Depends on:** none
- **Traces to:** Spec requirements 5, 6, 7, 8, 9, 11, 12; Acceptance criteria 5, 6, 7, 8, 9, 11, 12; Design "Scenario 4 — `cron-event`"; Design decisions "Six scenarios (3 e2e + 3 judge-only)", "Mixed verification — e2e only where a clean v1-grade runtime check exists".
- **Acceptance:**
  - `eval/scenarios/cron-event/scenario.yaml` exists with `name: cron-event`, `skills: [wordpress-development]`, and `rubrics: []` (explicit empty array); no catalog-only fields present.
  - The directory contains **only** `scenario.yaml` — **no** `e2e.spec.mjs` exists in it.
  - The `prompt` reads as a user-voice request by outcome and names no API/tool/function (no "cron", "wp_schedule_event").
  - The `acceptance` list contains exactly the four points above: point 1 requires the `wp_next_scheduled()` guard before `wp_schedule_event()`; point 4 accepts **either** `wp_unschedule_event()` (inside `register_deactivation_hook`) **or** `wp_clear_scheduled_hook()`; no acceptance string contains a URL.
  - `npx skillsmith eval/scenarios/cron-event` would execute to a judge-graded result without harness/configuration errors (failing grade acceptable). [Not run by this phase.]
  - No file under `skills/wordpress-development/`, `eval/rubrics/`, or any existing scenario directory is added or modified by this task.

---

### Task 5: Create the `i18n-textdomain` (Internationalization) scenario — **judge-only**

- **Goal:** Add a scenario that asks for all user-facing plugin text to be translation-ready, exercising the Plugins → Internationalization sub-area, as a **judge-only** scenario (no `e2e.spec.mjs`).
- **Type:** e2e (writer: `code-writer-e2e`; judge-only deliverable — produces `scenario.yaml` only, **no** `e2e.spec.mjs`)
- **Files to change:**
  - `eval/scenarios/i18n-textdomain/scenario.yaml` (new)
  - **No** `e2e.spec.mjs` is produced for this scenario.
- **Changes:**
  - `scenario.yaml`:
    - `name: i18n-textdomain`
    - `description:` a one-line summary (e.g. "Make all user-facing plugin strings translation-ready with a consistent text domain.").
    - `skills: [wordpress-development]`
    - `prompt` (verbatim, block scalar):
      > I want all of my plugin's user-facing text to be ready to translate into other languages, so translators can localize it later.
    - `acceptance` (verbatim list):
      1. User-facing strings are wrapped in a gettext function (`__()` / `_e()` / `esc_html__()`).
      2. The text domain is a literal string equal to the plugin slug.
      3. A `Text Domain:` header is present in the plugin header.
      4. No variable or constant is used as the text-domain argument, and no variable is used as the translatable-string argument (both must be literals).
    - `rubrics: []`
  - Do **not** create `eval/scenarios/i18n-textdomain/e2e.spec.mjs` — `en_US` renders source strings unchanged, so nothing is observable without a shipped `.mo` file; this scenario is graded by judge against `acceptance` only.
- **Depends on:** none
- **Traces to:** Spec requirements 5, 6, 7, 8, 9, 11, 12; Acceptance criteria 5, 6, 7, 8, 9, 11, 12; Design "Scenario 5 — `i18n-textdomain`"; Design decisions "Six scenarios (3 e2e + 3 judge-only)", "Mixed verification".
- **Acceptance:**
  - `eval/scenarios/i18n-textdomain/scenario.yaml` exists with `name: i18n-textdomain`, `skills: [wordpress-development]`, and `rubrics: []` (explicit empty array); no catalog-only fields present.
  - The directory contains **only** `scenario.yaml` — **no** `e2e.spec.mjs` exists in it.
  - The `prompt` reads as a user-voice request by outcome and names no API/tool/function (no "gettext", "text domain", "`__()`").
  - The `acceptance` list contains exactly the four points above. **`load_plugin_textdomain()` is NOT a hard acceptance check** — it is optional since WP 4.6 and must not appear as a required point (points 1–4 are the hard checks); no acceptance string contains a URL.
  - `npx skillsmith eval/scenarios/i18n-textdomain` would execute to a judge-graded result without harness/configuration errors (failing grade acceptable). [Not run by this phase.]
  - No file under `skills/wordpress-development/`, `eval/rubrics/`, or any existing scenario directory is added or modified by this task.

---

### Task 6: Create the `admin-menu-page` (Administration Menus) scenario — **judge-only**

- **Goal:** Add a scenario that asks for a plugin settings screen reachable from the WordPress dashboard, exercising the Plugins → Administration Menus sub-area, as a **judge-only** scenario (no `e2e.spec.mjs`).
- **Type:** e2e (writer: `code-writer-e2e`; judge-only deliverable — produces `scenario.yaml` only, **no** `e2e.spec.mjs`)
- **Files to change:**
  - `eval/scenarios/admin-menu-page/scenario.yaml` (new)
  - **No** `e2e.spec.mjs` is produced for this scenario.
- **Changes:**
  - `scenario.yaml`:
    - `name: admin-menu-page`
    - `description:` a one-line summary (e.g. "Add a capability-gated admin settings page reachable from the dashboard.").
    - `skills: [wordpress-development]`
    - `prompt` (verbatim, block scalar):
      > I want my plugin to add its own settings screen reachable from the WordPress dashboard, so administrators have a place to manage it.
    - `acceptance` (verbatim list):
      1. Registers the page via `add_menu_page()` (or `add_submenu_page()` / `add_options_page()`) on the `admin_menu` action hook.
      2. A `capability` (e.g. `manage_options`) is set to gate access.
      3. A `menu_slug` and a render callback are provided.
      4. The render callback outputs escaped markup, and no output is produced outside the callback.
    - `rubrics: []`
  - Do **not** create `eval/scenarios/admin-menu-page/e2e.spec.mjs` — the menu renders only inside wp-admin on a logged-in session; an admin-DOM e2e is heavier/flakier than the clean three, so this scenario is judge-only per Requirement 11's "where impractical" allowance.
- **Depends on:** none
- **Traces to:** Spec requirements 5, 6, 7, 8, 9, 11, 12; Acceptance criteria 5, 6, 7, 8, 9, 11, 12; Design "Scenario 6 — `admin-menu-page`"; Design decisions "Six scenarios (3 e2e + 3 judge-only)", "Mixed verification".
- **Acceptance:**
  - `eval/scenarios/admin-menu-page/scenario.yaml` exists with `name: admin-menu-page`, `skills: [wordpress-development]`, and `rubrics: []` (explicit empty array); no catalog-only fields present.
  - The directory contains **only** `scenario.yaml` — **no** `e2e.spec.mjs` exists in it.
  - The `prompt` reads as a user-voice request by outcome and names no API/tool/function (no "admin menu", "add_menu_page", "admin_menu").
  - The `acceptance` list contains exactly the four points above, including the `admin_menu`-hook registration, the `capability` gate, the `menu_slug`+render-callback point, and the escaped-output/no-output-outside-callback point; no acceptance string contains a URL.
  - `npx skillsmith eval/scenarios/admin-menu-page` would execute to a judge-graded result without harness/configuration errors (failing grade acceptable). [Not run by this phase.]
  - No file under `skills/wordpress-development/`, `eval/rubrics/`, or any existing scenario directory is added or modified by this task.

---

### Task 7: Create the candidate catalog `_wp-dev-candidates.yaml`

- **Goal:** Add the committed candidate catalog `eval/scenarios/_wp-dev-candidates.yaml` — a leading-underscore non-directory YAML file mirroring `_candidates.yaml`'s record shape, covering all 10 top-level developer.wordpress.org areas, with full `prompt`+`acceptance` only for the six Plugins scenarios and lighter stubs elsewhere. This is where documentation provenance for the six scenarios lives.
- **Type:** e2e (writer: `code-writer-e2e`; catalog-data deliverable — produces the single catalog file only, **no** `e2e.spec.mjs` and **no** scenario directory)
- **Files to change:**
  - `eval/scenarios/_wp-dev-candidates.yaml` (new; leading-underscore **non-directory** file)
- **Changes:**
  - **Top-of-file comment block** recording: the dated snapshot (`2026-06-18`); that this is the WordPress-development candidate catalog (distinct from the Interactivity-API `_candidates.yaml`); and the area → landing-URL map for the 10 top-level areas (the seven Documentation areas: Block Editor, Themes, Plugins, Common APIs, Advanced Administration, Coding Standards, WordPress Playground; and the three API Reference areas: Code Reference, REST API, WP-CLI Commands), each with its developer.wordpress.org landing URL (URLs as given in the design's "Reference taxonomy").
  - **Body:** a flat YAML list of candidate records grouped by taxonomy area via `# === Area: <name> ===` comment headers (one header per top-level area; every one of the 10 areas represented by at least one record).
  - **Per-record keys** mirror `_candidates.yaml`: `name`, `description`, `difficulty`, `concepts`, `source`, `source_files` (and, for the six Plugins scenarios only, `prompt` + `acceptance`). Use `source: dev.wordpress.org` as the source-type marker (distinguishing from the iAPI catalog's `source: docs`); `source_files` carries developer.wordpress.org **URLs** (not local checkout paths).
  - **Six full Plugins records** (`difficulty: simple`), with `prompt` and `acceptance` **identical to the corresponding scenario.yaml** authored in Tasks 1–6 (same verbatim strings), plus `concepts` and `source_files` URLs from the design:
    - `taxonomy-register` — `concepts: [register_taxonomy, show_in_rest, init-hook]`; `source_files:` `https://developer.wordpress.org/plugins/taxonomies/working-with-custom-taxonomies/`, `https://developer.wordpress.org/reference/functions/register_taxonomy/`.
    - `post-meta-rest` — `concepts:` (e.g. `[register_post_meta, show_in_rest, init-hook]`); `source_files:` `https://developer.wordpress.org/plugins/metadata/managing-post-metadata/`, `https://developer.wordpress.org/reference/functions/register_post_meta/`, `https://developer.wordpress.org/rest-api/extending-the-rest-api/modifying-responses/`.
    - `settings-register` — `concepts:` (e.g. `[register_setting, show_in_rest, sanitize_callback]`); `source_files:` `https://developer.wordpress.org/plugins/settings/settings-api/`, `https://developer.wordpress.org/plugins/settings/options-api/`, `https://developer.wordpress.org/reference/functions/register_setting/`.
    - `cron-event` — `concepts:` (e.g. `[wp_schedule_event, wp_next_scheduled, register_deactivation_hook]`); `source_files:` `https://developer.wordpress.org/plugins/cron/`, `https://developer.wordpress.org/plugins/cron/scheduling-wp-cron-events/`, `https://developer.wordpress.org/plugins/cron/understanding-wp-cron-scheduling/`.
    - `i18n-textdomain` — `concepts:` (e.g. `[gettext, text-domain, i18n]`); `source_files:` `https://developer.wordpress.org/plugins/internationalization/`, `https://developer.wordpress.org/plugins/internationalization/how-to-internationalize-your-plugin/`, `https://developer.wordpress.org/plugins/internationalization/localization/`.
    - `admin-menu-page` — `concepts:` (e.g. `[add_menu_page, admin_menu, capability]`); `source_files:` `https://developer.wordpress.org/plugins/administration-menus/`, `https://developer.wordpress.org/plugins/administration-menus/top-level-menus/`, `https://developer.wordpress.org/plugins/administration-menus/sub-menus/`.
  - **Lighter stub records** (`name`/`description`/`difficulty`/`concepts`/`source`/`source_files`, with `prompt`+`acceptance` omitted or marked TODO) for: the deferred Plugins sub-areas (at least Users, HTTP API, JavaScript/jQuery/Ajax, Privacy), and at least one representative candidate per remaining top-level area (Block Editor, Themes, Common APIs, Advanced Administration, Coding Standards, WordPress Playground, Code Reference, REST API, WP-CLI Commands), each with a developer.wordpress.org URL in `source_files` drawn from the design's "Reference taxonomy" tables.
  - **Do NOT** create a directory or any `scenario.yaml`/`e2e.spec.mjs` for this task — the catalog is a single flat file. **Do NOT** modify the existing `eval/scenarios/_candidates.yaml`.
- **Depends on:** none (records for the six scenarios reuse the verbatim prompt/acceptance defined in Tasks 1–6; these are fixed in this plan, so Task 7 needs no prior task to complete first)
- **Traces to:** Spec requirements 3, 4, 8, 14; Acceptance criteria 3, 4, 8, 14; Design "Candidate catalog: `eval/scenarios/_wp-dev-candidates.yaml`"; Design decisions "Catalog at `eval/scenarios/_wp-dev-candidates.yaml`", "Catalog discovery safety relies on non-directory-ness", "Documentation traceability lives in catalog provenance, not in `scenario.yaml`".
- **Acceptance:**
  - `eval/scenarios/_wp-dev-candidates.yaml` exists as a **non-directory** file with a leading underscore, and **parses as valid YAML**.
  - It is **NOT enumerated as a scenario** by Skillsmith discovery (it is a non-directory file, skipped by `enumerate.ts`'s non-directory guard before the YAML-existence guard).
  - Its top-of-file comment block records the snapshot date `2026-06-18`, identifies it as the WordPress-development catalog distinct from the iAPI `_candidates.yaml`, and maps every one of the 10 top-level areas to a developer.wordpress.org landing URL.
  - Records are grouped by area via `# === Area: <name> ===` headers, and **every one of the 10 top-level areas is represented** by at least one record.
  - Each record mirrors the `_candidates.yaml` shape with at least `name`, `description`, `concepts`, and source provenance (`source` + `source_files` carrying developer.wordpress.org URLs).
  - The six Plugins records (`taxonomy-register`, `post-meta-rest`, `settings-register`, `cron-event`, `i18n-textdomain`, `admin-menu-page`) each carry a fully-authored `prompt` + `acceptance` whose strings match the corresponding `scenario.yaml` from Tasks 1–6 verbatim, plus the `source_files` URLs listed above.
  - The existing `eval/scenarios/_candidates.yaml` is **not** modified.
  - No file under `skills/wordpress-development/`, `eval/rubrics/`, or any existing scenario directory is added or modified by this task.

## Coverage check (acceptance criteria → tasks)

- **AC 1, 2 (exhaustive, dated, traceable taxonomy):** delivered by the design's "Reference taxonomy" prose artifact (not a code deliverable); the catalog (Task 7) header reproduces the dated snapshot + area→URL map, reinforcing traceability.
- **AC 3 (catalog present and broad):** Task 7.
- **AC 4 (catalog does not break discovery; distinct from iAPI):** Task 7 (non-directory leading-underscore file; distinct name/header).
- **AC 5 (exactly one area, justified):** all six scenario tasks (Tasks 1–6) implement only the Plugins area; the (a)–(f) justification lives in the design's "First area: Plugins".
- **AC 6 (one simple scenario per un-covered sub-area):** Tasks 1–6 (Taxonomies, Metadata, Settings, Cron, Internationalization, Administration Menus — one each, single-concept).
- **AC 7 (no v1 sub-area duplication):** Tasks 1–6 cover sub-areas disjoint from Hooks/Shortcodes/CPT/REST-endpoints.
- **AC 8 (doc-traceable, user-voice, tool-agnostic):** Tasks 1–6 (clean URL-free acceptance, tool-agnostic prompts) + Task 7 (provenance in `source_files`).
- **AC 9 (schema conformance):** Tasks 1–6 (`name`==dir, required keys, `rubrics: []`, no catalog-only fields).
- **AC 10 (default zero rubrics):** every scenario task declares `rubrics: []`; no `eval/rubrics/` file added in any task.
- **AC 11 (mixed verification):** Tasks 1–3 ship e2e specs (v1 lifecycle, pinned literals); Tasks 4–6 are judge-only with reasons.
- **AC 12 (discoverable + e2e-loadable, pass not required):** every task's Acceptance includes the structural bar (`isScenarioShape` discoverable; `node --check`/Playwright collection for present specs; catalog parses and is not enumerated).
- **AC 13 (skill unchanged):** every task forbids changes under `skills/wordpress-development/`.
- **AC 14 (existing suite intact):** every task forbids modifying existing scenarios, `_candidates.yaml`, and `eval/rubrics/`; new directories are flat children of `eval/scenarios/`.
