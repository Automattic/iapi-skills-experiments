# Code Plan: Themes scenarios

## Overview

This batch ships **four artifacts** under `eval/` (the Skillsmith eval suite), none of them touching the `wordpress-development` skill: **three new Themes scenario directories** under `eval/scenarios/` using the adopted `themes-*` pseudo-folder naming convention (all flat immediate children of `eval/scenarios/`), plus an **in-place edit of the existing catalog** `eval/scenarios/_wp-dev-candidates.yaml`. The three scenarios are `themes-enqueue-assets` (front-end asset enqueue — ships a `scenario.yaml` **and** an `e2e.spec.mjs`), `themes-nav-menu-location` (navigation-menu location — `scenario.yaml` only, judge-only), and `themes-sidebar-widget-area` (sidebar / widget area — `scenario.yaml` only, judge-only). The "code" produced here is **scenario-definition and catalog data**, not WordPress plugin code — the plugin under test is authored at run time by the Skillsmith testing agent as a single `index.php` edit on a global hook (`wp_enqueue_scripts`, `after_setup_theme`, or `widgets_init`). The plan is **one task per scenario (3) plus one task for the catalog edit (4 total)**; all tasks are **independent with no cross-task ordering dependencies** (numbered for reference only, executable in any order or in parallel). The batch adds **zero** new rubrics, reorganizes/renames none of the existing scenarios, leaves the iAPI `eval/scenarios/_candidates.yaml` and all non-Themes records in `_wp-dev-candidates.yaml` untouched, and modifies no file under `skills/wordpress-development/`. The one e2e lifecycle mirrors `eval/scenarios/filter-body-class/e2e.spec.mjs` verbatim — no new `eval/utils/` helper is added.

### The `themes-` naming convention (the structural element)

All three new scenarios use the prefix `themes-<concept>` as their **directory name**, their `scenario.yaml` `name`, and their **catalog record `name`** — identical in all three places, each matching `/^[a-z0-9-]+$/`. This is the adopted "pseudo-folder" organization carried over from review-2: it visually clusters Themes scenarios when `eval/scenarios/` is listed and sorted, while every scenario remains a **flat immediate child** of `eval/scenarios/`. No filesystem nesting is introduced, so Skillsmith discovery, the e2e lifecycle, `verify-e2e.ts` spec-location/attribution, Playwright collection, and the scaffold are all unchanged. The three names are `themes-enqueue-assets`, `themes-nav-menu-location`, and `themes-sidebar-widget-area`; none collides with an existing scenario directory (the existing 30 entries include no `themes-` prefix). The existing scenarios are **NOT** renamed. The folders question is not re-litigated here — review-2 classified real subdirectories as not low-risk and adopted this convention; this review applies it.

### Type field — why all four tasks are Type `e2e`

There is **no unit-testable production module** in this batch. The plugin PHP (the global-hook registration in `index.php`) that would be unit-tested is authored by the testing agent at run time, not by this phase; the catalog is a config/data file. The only writer suited to producing scenario definitions and the one Playwright spec is **`code-writer-e2e`**, so every task is **Type `e2e`** (there is no meaningful `tdd` RED/GREEN unit cycle — a `tdd` task would have no production module to test). Of the four tasks, **only Task 1 (`themes-enqueue-assets`) produces an `e2e.spec.mjs`**; **Tasks 2 and 3 are judge-only (`scenario.yaml` only, no spec)**, and **Task 4 (catalog edit) produces no `e2e.spec.mjs` and no scenario directory** (its deliverable is the single catalog file edited in place). Each task's Changes and Acceptance state this explicitly so the writer does not author a spec where none is wanted.

### Verification bar (static/structural only)

Per the spec (AC 16) and design ("Static / structural verification only"), verification is **static/structural only**. The bar per artifact:
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

Only **`themes-enqueue-assets`** ships an `e2e.spec.mjs`; the two judge-only scenarios (`themes-nav-menu-location`, `themes-sidebar-widget-area`) and the catalog edit ship **no** spec — their `acceptance` points are graded by the judge against the produced PHP. The single e2e spec is a Playwright spec run by `eval/utils/verify-e2e.ts` inside a `wp-env` runtime; it **deactivates all plugins, then activates exactly its own scaffolded plugin** (`plugin-themes-enqueue-assets-${workerInfo.project.metadata.agentId}` — derived, never hard-coded) in `beforeAll`, and **deactivates all plugins** in `afterAll`. The lifecycle is fixed by the existing `filter-body-class` spec: `beforeAll` calls `deactivateAllPlugins()` then `await requestUtils.activatePlugin(...)`; `afterAll` calls `deactivateAllPlugins()`; **no content is seeded**. The only literal the spec asserts is the pinned handle `themes-frontend-assets` (which drives both the `-css` and `-js` ids), and it is **pinned in that scenario's prompt**, keeping prompt and assertion in lockstep.

The assertion shape is a **DOM presence** check (`toBeAttached()`) on the WordPress-emitted `<link>` and `<script>` elements — a new shape for this suite (`filter-body-class` asserts `toHaveClass` on `body`), but the same lifecycle, fixtures (`requestUtils`, `page`), imports, and `page.goto("/")` flow. `toBeAttached()` is the correct check because a `<link>`/`<script>` has no visible render. The emitted `id` attributes (`{handle}-css` / `{handle}-js`) are produced by WordPress core and depend **only** on the pinned handle, so the assertion is **theme-independent** — it does not depend on which theme `wp-env` activates.

### Flow 1: An enqueued stylesheet and script appear on the front-end home page (asset enqueue)

- **Steps:** Deactivate all plugins; activate `plugin-themes-enqueue-assets-<agentId>` (slug derived from `workerInfo.project.metadata.agentId`). **No content seeding.** Navigate to the front-end home page: `await page.goto("/")`.
- **Expected:** WordPress has emitted both the stylesheet `<link>` and the script `<script>` for the pinned handle — `await expect(page.locator("link#themes-frontend-assets-css")).toBeAttached()` and `await expect(page.locator("script#themes-frontend-assets-js")).toBeAttached()`. This proves a stylesheet and a script were **enqueued with a real source** (not merely registered, not an empty alias) from a callback on the front-end asset-enqueueing hook, against whatever theme `wp-env` activated. (Per the `$src` gotcha, a register-only or empty-`$src` implementation would emit no tag and fail this assertion — which is acceptable per the spec, as the scenario is not required to pass against the current skill.) Cleanup: `deactivateAllPlugins()` in `afterAll`.
- **Traces to:** Acceptance criteria 3 (sub-area i), 6, 8, 16; Design "Scenario 1 — `themes-enqueue-assets`". Pinned literal: handle `themes-frontend-assets` (→ ids `themes-frontend-assets-css` / `themes-frontend-assets-js`).

The two judge-only scenarios contribute **no** Flow: `themes-nav-menu-location` (`register_nav_menus` on `after_setup_theme`) and `themes-sidebar-widget-area` (`register_sidebar` on `widgets_init`) produce no theme-independent front-end output on their own (they need a theme template calling `wp_nav_menu()` / `dynamic_sidebar()`), so they are graded solely by the judge against the produced PHP — mirroring the existing judge-only Plugins scenarios (`cron-event`, `admin-menu-page`, `i18n-textdomain`).

## Tasks

> **Shared conventions for ALL four tasks** (transcribe faithfully — these are design-doc obligations, not new decisions):
>
> **Scenario tasks (1–3):**
> - Each task creates exactly one directory `eval/scenarios/<dir>/` that is a **flat immediate child** of `eval/scenarios/` (no nesting). Task 1 contains **two** files (`scenario.yaml` + `e2e.spec.mjs`); Tasks 2 and 3 contain **one** file (`scenario.yaml` only — they are judge-only and ship **no** `e2e.spec.mjs`).
> - `scenario.yaml` keys, in this order: `name`, `description`, `skills` (as a list item `- wordpress-development`), `prompt` (block scalar `|`), `acceptance` (list), `rubrics: []`. **`rubrics: []` must be present as an explicit empty array** — an omitted key (`undefined`) or a valueless `rubrics:` (parsed as `null`) fails Skillsmith's shape-check (`Array.isArray(...)` is `false` for both) and the scenario is silently skipped and never graded. Do **not** add any file under `eval/rubrics/`.
> - **No catalog-only fields** (`difficulty`, `concepts`, `source`, `source_files`) appear in any `scenario.yaml`, and **no source URL** appears anywhere in a `scenario.yaml` — those live only in the catalog record (Task 4).
> - `name` equals the directory name for every scenario in this batch (e.g. `themes-enqueue-assets` → slug `plugin-themes-enqueue-assets-<agentId>`). Names contain hyphens only (no underscores) and match `/^[a-z0-9-]+$/`.
> - The `prompt` is **user-voice, outcome-phrased, and tool-agnostic**: it must **NOT** name the tool/API/function/hook/framework (no `wp_enqueue_scripts`, `wp_enqueue_style`, `wp_enqueue_script`, `register_nav_menus`, `register_sidebar`, `after_setup_theme`, `widgets_init`, `wp_nav_menu`, `dynamic_sidebar`, `__()`, `index.php`, etc.). It **MAY** name a user-facing pinned literal (the asset handle, the menu-location slug, the sidebar id/name, the human-readable labels). The handle-pinning convention follows `filter-body-class`: hard-pin the literal in backticks inside a user-voice sentence (e.g. "Load a stylesheet and a script on the site's front end under the shared handle `themes-frontend-assets`"). Keep each pinned literal and its assertion/acceptance target in **lockstep** — if any literal is reworded, the prompt, the e2e assertion (Task 1), and the catalog record (Task 4) change together.
> - The `acceptance` strings are **clean, human-readable check statements with NO embedded source URLs**. Provenance (developer.wordpress.org URLs) lives only in the catalog record's `source_files` (Task 4).
> - These are **Type `e2e`** tasks (see "Type field" in Overview): the writer is `code-writer-e2e`.
>
> **Catalog task (4):** **edits the existing file** `eval/scenarios/_wp-dev-candidates.yaml` in place (it already exists — MODIFY, do not recreate), and produces **no `e2e.spec.mjs`** and **no scenario directory**. Only the Themes section (and the one stale header line) is touched. See Task 4 for its structure.
>
> **No-disruption obligation (all tasks):** do not modify, move, or rename any existing scenario directory, the existing `eval/scenarios/_candidates.yaml` (iAPI catalog), any non-Themes record in `_wp-dev-candidates.yaml`, any file under `eval/rubrics/`, any file under `eval/utils/`, or any file under `skills/wordpress-development/`.
>
> **Pinned literals (fixed by the design — recommended values; if Task 1's handle is changed it MUST be pinned in the prompt and matched verbatim in the e2e `#{handle}-css` / `#{handle}-js`, and the same literal MUST appear in the catalog record). Use the chosen values verbatim in prompt, e2e assertion (Task 1), acceptance, and catalog record:**
> - Scenario 1 (`themes-enqueue-assets`): shared handle `themes-frontend-assets` → WordPress-emitted ids `themes-frontend-assets-css` and `themes-frontend-assets-js`. This is the **only** literal the e2e asserts.
> - Scenario 2 (`themes-nav-menu-location`): the menu-location slug (recommended `primary`). Pinned in the prompt, graded in acceptance (judge-only — no e2e).
> - Scenario 3 (`themes-sidebar-widget-area`): the sidebar `id` and human-readable `name` (e.g. id `themes-sidebar-1`, name `Theme Sidebar`). Pinned in the prompt, graded in acceptance (judge-only — no e2e).

---

### Task 1: Create the `themes-enqueue-assets` (front-end asset enqueue) scenario — **e2e**

- **Goal:** Add a scenario that asks for a stylesheet **and** a script to be **loaded** (with a real, non-empty source — not merely registered) on the site's front-end pages under a single shared handle, exercising the Themes → Core Concepts → Including-Assets sub-area via a front-end asset-enqueue hook from a plain plugin (distinct from the iAPI block `view.js` `block.json` build mechanism), with an e2e spec that navigates to the home page and asserts the WordPress-emitted `<link>` and `<script>` elements for the pinned handle are attached.
- **Type:** e2e (writer: `code-writer-e2e`; ships `scenario.yaml` **and** `e2e.spec.mjs`)
- **Files to change:**
  - `eval/scenarios/themes-enqueue-assets/scenario.yaml` (new)
  - `eval/scenarios/themes-enqueue-assets/e2e.spec.mjs` (new)
- **Changes:**
  - `scenario.yaml`:
    - `name: themes-enqueue-assets`
    - `description:` a one-line summary (e.g. "Load a front-end stylesheet and script under a shared handle so WordPress emits their tags.").
    - `skills:` list item `- wordpress-development`
    - `prompt` (block scalar `|`, user-voice, tool-agnostic): request that on the site's **front-end** pages an **actual stylesheet file** and an **actual script file** are **loaded** (a real file/source — not merely declared/registered) under the shared handle **`themes-frontend-assets`**, so the stylesheet and script appear in the page. The prompt MUST make clear the assets are **loaded** (so the agent does not merely register a handle — the `$src` gotcha) and MUST pin the handle `themes-frontend-assets` in backticks. Do **NOT** name `wp_enqueue_scripts`, `wp_enqueue_style`, `wp_enqueue_script`, the hook, or any function/API.
    - `acceptance` (verbatim from design "Scenario 1", clean checks, no URLs):
      1. On the front end, a stylesheet is enqueued (not merely registered) under the handle `themes-frontend-assets`, with a real source, so WordPress emits its `<link>` element.
      2. On the front end, a script is enqueued (not merely registered) under the handle `themes-frontend-assets`, with a real source, so WordPress emits its `<script>` element.
      3. Both assets are enqueued from a callback attached to the front-end asset-enqueueing hook (not the admin or login screens).
      4. The enqueues require no theme artifact — they work from the plugin against whatever theme is active.
    - `rubrics: []`
  - `e2e.spec.mjs`: Implement **Flow 1**, mirroring `eval/scenarios/filter-body-class/e2e.spec.mjs` verbatim in lifecycle. `import { expect, test } from "@wordpress/e2e-test-utils-playwright";` and `import { deactivateAllPlugins } from "../../utils/wp-cli.mjs";`. One `test.describe("themes-enqueue-assets scenario", …)` block. `test.beforeAll(async ({ requestUtils }, workerInfo) => { deactivateAllPlugins(); await requestUtils.activatePlugin(`plugin-themes-enqueue-assets-${workerInfo.project.metadata.agentId}`); });` (slug derived from `workerInfo.project.metadata.agentId`, **never** hard-coded). `test.afterAll(() => { deactivateAllPlugins(); });`. One test (`async ({ page })`, **no** `requestUtils` in the test args, **no** post seeding): `await page.goto("/"); await expect(page.locator("link#themes-frontend-assets-css")).toBeAttached(); await expect(page.locator("script#themes-frontend-assets-js")).toBeAttached();`. `page` is a destructured fixture (no local import). Keep the asserted ids in lockstep with the prompt's pinned handle (`#{handle}-css` / `#{handle}-js`). Add **no** new helper to `eval/utils/`.
- **Depends on:** none
- **Traces to:** Spec requirements A.1, A.2, A.3, A.4, A.5, B.6, B.8, B.9, B.10, C.11, E.16, E.17, E.18; Acceptance criteria 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 16, 17, 18; Design "Scenario 1 — `themes-enqueue-assets`"; Design decisions "Split the batch by harness feasibility — one e2e (enqueue) + two judge-only", "Enqueue scenario asserts WordPress-emitted `<link id="{handle}-css">` and `<script id="{handle}-js">` via a single shared handle", "Bake the non-empty `$src` requirement into the enqueue prompt and acceptance", "Each new scenario is distinct from every covered sub-area at the sub-area level", "Pin every e2e-asserted literal in the prompt; keep prompts tool-agnostic; provenance only in the catalog", "Add zero new shared rubrics", "Apply `themes-*` pseudo-folder naming".
- **Acceptance:**
  - `eval/scenarios/themes-enqueue-assets/scenario.yaml` exists with keys `name`, `description`, `skills`, `prompt`, `acceptance`, `rubrics` (in that order), where `name` is `themes-enqueue-assets` (equal to the directory name, matching `/^[a-z0-9-]+$/`), `skills` is exactly `[wordpress-development]`, and `rubrics` is an explicit empty array `[]`.
  - The `scenario.yaml` contains **no** catalog-only fields (`difficulty`, `concepts`, `source`, `source_files`) and **no** embedded source URL anywhere.
  - The `prompt` reads as a user-voice, outcome-phrased request and names no API/tool/function/hook (no `wp_enqueue_scripts`, `wp_enqueue_style`, `wp_enqueue_script`); it pins the handle `themes-frontend-assets` and makes clear the assets are **loaded** (a real file/source), targeting the front end.
  - The `acceptance` list contains exactly the four points above; no acceptance string contains a URL; the points require the stylesheet and the script to be **enqueued with a source** (not merely registered) under the handle `themes-frontend-assets`, from the front-end asset-enqueueing hook, with no theme artifact required.
  - `eval/scenarios/themes-enqueue-assets/e2e.spec.mjs` activates `plugin-themes-enqueue-assets-<agentId>` (slug derived from `workerInfo.project.metadata.agentId`, not hard-coded), does **no** post seeding, navigates to `page.goto("/")`, and asserts `page.locator("link#themes-frontend-assets-css")` and `page.locator("script#themes-frontend-assets-js")` are each `toBeAttached()`.
  - The spec imports `deactivateAllPlugins` from `../../utils/wp-cli.mjs` and `expect`/`test` from `@wordpress/e2e-test-utils-playwright`, resets plugin state in `beforeAll`, and cleans up with `deactivateAllPlugins()` in `afterAll`; it adds no new helper under `eval/utils/`.
  - The two asserted ids (`themes-frontend-assets-css` / `themes-frontend-assets-js`) are derived verbatim from the handle pinned in the prompt (lockstep).
  - `node --check eval/scenarios/themes-enqueue-assets/e2e.spec.mjs` succeeds (spec parses) and Playwright would collect it without errors.
  - Running Skillsmith on `eval/scenarios/themes-enqueue-assets` would execute to a graded result without harness/configuration errors (failing grade acceptable). [Not run by this phase; structural verification only.]
  - No file under `skills/wordpress-development/`, `eval/rubrics/`, `eval/utils/`, the iAPI `_candidates.yaml`, or any existing scenario directory is added or modified by this task.

---

### Task 2: Create the `themes-nav-menu-location` (navigation-menu location) scenario — **e2e (judge-only, no spec)**

- **Goal:** Add a scenario that asks for a named navigation-menu **location** (a slot a theme can render a menu into) to be registered with a translatable human-readable label, exercising the Themes → Navigation Menus sub-area via a registration on the theme-setup hook (distinct from every existing `register_*` scenario and from the sidebar scenario by a different registration function and a different Themes handbook chapter). This is **judge-only**: it ships **no** `e2e.spec.mjs` because the registration produces no theme-independent front-end output on its own (rendering needs a theme template), so it is graded by the judge against the produced PHP.
- **Type:** e2e (writer: `code-writer-e2e`; ships `scenario.yaml` **only** — **no** `e2e.spec.mjs`)
- **Files to change:**
  - `eval/scenarios/themes-nav-menu-location/scenario.yaml` (new)
- **Changes:**
  - `scenario.yaml`:
    - `name: themes-nav-menu-location`
    - `description:` a one-line summary (e.g. "Register a navigation-menu location with a translatable label on theme setup.").
    - `skills:` list item `- wordpress-development`
    - `prompt` (block scalar `|`, user-voice, tool-agnostic): request that the plugin make available a named navigation-menu **location** — a slot a theme can assign a menu to — identified by the pinned slug (recommended **`primary`**), with a human-readable, **translatable** label, set up so it is in place before the theme renders. Do **NOT** name `register_nav_menus`, `after_setup_theme`, `wp_nav_menu`, `__()`, the hook, or any function/API. Pin the location slug in backticks.
    - `acceptance` (verbatim from design "Scenario 2", clean checks, no URLs):
      1. A navigation-menu location with the pinned slug is registered.
      2. The registration runs on the theme-setup hook (so it is in place before templates render).
      3. The location's label is wrapped for translation.
      4. No theme template or menu-rendering call is required for the registration to be in effect.
    - `rubrics: []`
  - Do **NOT** create an `e2e.spec.mjs` for this scenario (judge-only — mirrors `cron-event`, `admin-menu-page`, `i18n-textdomain`).
- **Depends on:** none
- **Traces to:** Spec requirements A.1, A.2, A.3, A.4, A.5, B.7, B.9, B.10, C.11, E.16, E.17, E.18; Acceptance criteria 1, 2, 3, 4, 5, 7, 9, 10, 11, 16, 17, 18; Design "Scenario 2 — `themes-nav-menu-location`"; Design decisions "Split the batch by harness feasibility — one e2e (enqueue) + two judge-only", "Nav-menu and sidebar scenarios are judge-only, graded against the produced PHP", "Each new scenario is distinct from every covered sub-area at the sub-area level", "Pin every e2e-asserted literal in the prompt; keep prompts tool-agnostic; provenance only in the catalog", "Add zero new shared rubrics", "Apply `themes-*` pseudo-folder naming".
- **Acceptance:**
  - `eval/scenarios/themes-nav-menu-location/scenario.yaml` exists with keys `name`, `description`, `skills`, `prompt`, `acceptance`, `rubrics` (in that order), where `name` is `themes-nav-menu-location` (== directory name, matching `/^[a-z0-9-]+$/`), `skills` is exactly `[wordpress-development]`, and `rubrics` is an explicit empty array `[]`.
  - The `scenario.yaml` contains **no** catalog-only fields (`difficulty`, `concepts`, `source`, `source_files`) and **no** embedded source URL anywhere.
  - The `prompt` reads as a user-voice, outcome-phrased request and names no API/tool/function/hook (no `register_nav_menus`, `after_setup_theme`, `__()`); it pins the location slug and conveys a translatable human-readable label.
  - The `acceptance` list contains exactly the four points above; no acceptance string contains a URL; the points require the pinned slug, registration on the theme-setup hook, a translation-wrapped label, and that no theme template / menu-rendering call is needed.
  - The directory `eval/scenarios/themes-nav-menu-location/` contains **only** `scenario.yaml` — **no** `e2e.spec.mjs`.
  - Running Skillsmith on `eval/scenarios/themes-nav-menu-location` would execute to a judge-graded result without harness/configuration errors (failing grade acceptable). [Not run by this phase; structural verification only.]
  - No file under `skills/wordpress-development/`, `eval/rubrics/`, `eval/utils/`, the iAPI `_candidates.yaml`, or any existing scenario directory is added or modified by this task.

---

### Task 3: Create the `themes-sidebar-widget-area` (sidebar / widget area) scenario — **e2e (judge-only, no spec)**

- **Goal:** Add a scenario that asks for a sidebar / widget area (a region into which widgets can be placed) to be registered with a pinned id, a translatable human-readable name, and before/after markup wrappers for each widget and its title, exercising the Themes → Widgets sub-area via a registration on the widgets-initialization hook (distinct from every existing `register_*` scenario and from the nav-menu scenario by a different registration function and a different Themes handbook chapter). This is **judge-only**: it ships **no** `e2e.spec.mjs` because the registration produces no theme-independent front-end output on its own (rendering needs a theme template), so it is graded by the judge against the produced PHP.
- **Type:** e2e (writer: `code-writer-e2e`; ships `scenario.yaml` **only** — **no** `e2e.spec.mjs`)
- **Files to change:**
  - `eval/scenarios/themes-sidebar-widget-area/scenario.yaml` (new)
- **Changes:**
  - `scenario.yaml`:
    - `name: themes-sidebar-widget-area`
    - `description:` a one-line summary (e.g. "Register a sidebar / widget area with an id, translatable name, and widget/title wrappers.").
    - `skills:` list item `- wordpress-development`
    - `prompt` (block scalar `|`, user-voice, tool-agnostic): request that the plugin make available a sidebar / widget area — a region where widgets can be placed — identified by the pinned **id** (e.g. **`themes-sidebar-1`**) with a human-readable, **translatable** **name** (e.g. **`Theme Sidebar`**), and providing markup that wraps each widget and each widget title. Do **NOT** name `register_sidebar`, `widgets_init`, `dynamic_sidebar`, `__()`, the hook, or any function/API. Pin the sidebar id and name in backticks.
    - `acceptance` (verbatim from design "Scenario 3", clean checks, no URLs):
      1. A sidebar / widget area with the pinned id and human-readable name is registered.
      2. The registration runs on the widgets-initialization hook.
      3. The registration supplies before/after wrappers for each widget and its title.
      4. The widget area's name is wrapped for translation.
    - `rubrics: []`
  - Do **NOT** create an `e2e.spec.mjs` for this scenario (judge-only — mirrors `cron-event`, `admin-menu-page`, `i18n-textdomain`).
- **Depends on:** none
- **Traces to:** Spec requirements A.1, A.2, A.3, A.4, A.5, B.7, B.9, B.10, C.11, E.16, E.17, E.18; Acceptance criteria 1, 2, 3, 4, 5, 7, 9, 10, 11, 16, 17, 18; Design "Scenario 3 — `themes-sidebar-widget-area`"; Design decisions "Split the batch by harness feasibility — one e2e (enqueue) + two judge-only", "Nav-menu and sidebar scenarios are judge-only, graded against the produced PHP", "Each new scenario is distinct from every covered sub-area at the sub-area level", "Pin every e2e-asserted literal in the prompt; keep prompts tool-agnostic; provenance only in the catalog", "Add zero new shared rubrics", "Apply `themes-*` pseudo-folder naming".
- **Acceptance:**
  - `eval/scenarios/themes-sidebar-widget-area/scenario.yaml` exists with keys `name`, `description`, `skills`, `prompt`, `acceptance`, `rubrics` (in that order), where `name` is `themes-sidebar-widget-area` (== directory name, matching `/^[a-z0-9-]+$/`), `skills` is exactly `[wordpress-development]`, and `rubrics` is an explicit empty array `[]`.
  - The `scenario.yaml` contains **no** catalog-only fields (`difficulty`, `concepts`, `source`, `source_files`) and **no** embedded source URL anywhere.
  - The `prompt` reads as a user-voice, outcome-phrased request and names no API/tool/function/hook (no `register_sidebar`, `widgets_init`, `__()`); it pins the sidebar id and name and conveys a translatable name plus widget/title wrappers.
  - The `acceptance` list contains exactly the four points above; no acceptance string contains a URL; the points require the pinned id and name, registration on the widgets-initialization hook, before/after wrappers for each widget and its title, and a translation-wrapped name.
  - The directory `eval/scenarios/themes-sidebar-widget-area/` contains **only** `scenario.yaml` — **no** `e2e.spec.mjs`.
  - Running Skillsmith on `eval/scenarios/themes-sidebar-widget-area` would execute to a judge-graded result without harness/configuration errors (failing grade acceptable). [Not run by this phase; structural verification only.]
  - No file under `skills/wordpress-development/`, `eval/rubrics/`, `eval/utils/`, the iAPI `_candidates.yaml`, or any existing scenario directory is added or modified by this task.

---

### Task 4: Update the Themes section of the existing catalog `_wp-dev-candidates.yaml`

- **Goal:** Edit the existing catalog `eval/scenarios/_wp-dev-candidates.yaml` **in place** so its `# === Area: Themes ===` section (currently the two stubs `theme-json-custom-color-palette` and `classic-theme-enqueue-scripts`, between `# === Area: Block Editor ===` and `# === Area: Plugins ===`) **renames + promotes** the `classic-theme-enqueue-scripts` stub to a full record named `themes-enqueue-assets`, **adds two new full records** (`themes-nav-menu-location`, `themes-sidebar-widget-area`) under an `# Implemented Themes scenarios — full records` sub-header with `prompt`/`acceptance` matching the shipped `scenario.yaml` files (Tasks 1–3) verbatim and `source_files` provenance, **annotates** the `theme-json-custom-color-palette` stub with a `# Deferred:` comment, creates **no** new stub for any other uncovered Themes sub-area, and **fixes the one stale header line** — while leaving every non-Themes record and the iAPI `_candidates.yaml` untouched. This is where documentation provenance for the three scenarios lives.
- **Type:** e2e (writer: `code-writer-e2e`; **catalog-data deliverable** — edits the single catalog file only, **no** `e2e.spec.mjs` and **no** scenario directory)
- **Files to change:**
  - `eval/scenarios/_wp-dev-candidates.yaml` (MODIFY existing — leading-underscore **non-directory** file; edit only the Themes section + the one stale header line)
- **Changes:**
  - **Fix the stale header line.** The top-of-file comment currently reads (lines 28–29): "Full prompt + acceptance are included for the implemented Plugins, Block / Editor, and REST API scenarios; all other records are lighter stubs." Update it to also list **Themes** — e.g. "Full prompt + acceptance are included for the implemented Plugins, Block Editor, REST API, and Themes scenarios; all other records are lighter stubs." This is the **only** header change.
  - **Locate the existing `# === Area: Themes ===` section** (header at line 156; `theme-json-custom-color-palette` stub at line 158; `classic-theme-enqueue-scripts` stub at line 167). Edit only within this section (plus the one header line above). Do not touch any other area's records or the iAPI `_candidates.yaml`.
  - **Rename + promote `classic-theme-enqueue-scripts` → full record `themes-enqueue-assets`.** Change the record's `name` from `classic-theme-enqueue-scripts` to `themes-enqueue-assets` (a **record** rename — no shipped scenario directory exists for the legacy name, so this is not a scenario rename). Keep/extend `description`, `difficulty: simple`, `concepts`, `source: dev.wordpress.org`, and `source_files` (the including-assets handbook as **primary**, classic-themes as **secondary**, per the table below). Add `prompt` and `acceptance` whose strings match the shipped `eval/scenarios/themes-enqueue-assets/scenario.yaml` (Task 1) **verbatim** — same text, same order, same quoting (block-scalar `prompt`, list `acceptance`).
  - **Add two brand-new full records** under a new `# Implemented Themes scenarios — full records` sub-header (mirroring the Block Editor pattern at line 52 and the REST API pattern at line 422): `themes-nav-menu-location` and `themes-sidebar-widget-area`. Each mirrors the established catalog-record shape — `name` (== the scenario's directory name and `scenario.yaml` `name`), `description`, `difficulty: simple`, `concepts` (short descriptive list, not asserted), `source: dev.wordpress.org`, `source_files` (per the table below), `prompt`, `acceptance` — where `prompt` and `acceptance` are the **exact same verbatim strings** as the shipped `scenario.yaml` from Tasks 2 and 3 (1:1 identity — same pinned literals, same order, same quoting). Judge-only scenarios still get full records (exactly as `cron-event` / `admin-menu-page` do).

    | Record `name` | `source_files` | Suggested `concepts` |
    |---|---|---|
    | `themes-enqueue-assets` | `https://developer.wordpress.org/themes/core-concepts/including-assets/` (primary) and `https://developer.wordpress.org/themes/classic-themes/` (secondary) | `[wp_enqueue_scripts, wp_enqueue_style, wp_enqueue_script]` |
    | `themes-nav-menu-location` | `https://developer.wordpress.org/reference/functions/register_nav_menus/` | `[register_nav_menus, after_setup_theme, nav-menu-location]` |
    | `themes-sidebar-widget-area` | `https://developer.wordpress.org/reference/functions/register_sidebar/` | `[register_sidebar, widgets_init, widget-area]` |
  - **Annotate `theme-json-custom-color-palette` as a deferred stub.** ADD a `# Deferred: <reason>` comment (it currently has none) recording that `theme.json` is a theme-root artifact the plugin scaffold cannot ship — theme-artifact-bound, not feasible without a theme-scaffold harness change. Keep it a **lighter stub** (no `prompt`/`acceptance` added); leave its `name`/`description`/`difficulty`/`concepts`/`source`/`source_files` unchanged.
  - **Create NO new stub** for any other uncovered Themes sub-area (block templates, template parts, template hierarchy, classic template files, custom-header/background, `style.css`, `wp_head`/`wp_footer` marker, `add_theme_support`, block-pattern registration). Their exclusion is recorded **only** in the spec's Out of Scope section. The defer-with-comment rule applies **solely** to `theme-json-custom-color-palette`, which already has a stub.
  - **Do NOT** create a directory or any `scenario.yaml`/`e2e.spec.mjs` for this task — the catalog is a single flat file edited in place. **Do NOT** modify the existing `eval/scenarios/_candidates.yaml` (iAPI catalog). **Do NOT** add or alter any non-Themes record.
- **Depends on:** none (the three full records reuse the verbatim prompt/acceptance fixed in Tasks 1–3 by this plan; the writer copies the same pinned strings — Task 4 needs no prior task to complete first)
- **Traces to:** Spec requirements D.12, D.13, D.14, D.15, E.17, E.18, F.19, F.20; Acceptance criteria 12, 13, 14, 15, 17, 18, 19, 20; Design "Catalog promotion + reconciliation"; Design decision "Rename+promote one stub, add two full records, annotate one stub as deferred; confine all edits to the Themes section".
- **Acceptance:**
  - `eval/scenarios/_wp-dev-candidates.yaml` still exists as a **non-directory** leading-underscore file and **parses as valid YAML**; it is still **NOT enumerated as a scenario** by Skillsmith discovery.
  - The top-of-file header comment listing which areas have full prompt+acceptance now lists **Themes** alongside Plugins, Block Editor, and REST API; this is the **only** header change.
  - Under `# === Area: Themes ===`, the legacy `classic-theme-enqueue-scripts` stub is **renamed to `themes-enqueue-assets` and promoted to a full record**, carrying `prompt` + `acceptance` whose strings match `eval/scenarios/themes-enqueue-assets/scenario.yaml` (Task 1) **verbatim**, plus `source_files` citing the including-assets handbook (primary) and classic-themes (secondary). No record named `classic-theme-enqueue-scripts` remains.
  - Two **new full records** `themes-nav-menu-location` and `themes-sidebar-widget-area` exist under the Themes area, under an `# Implemented Themes scenarios — full records` sub-header, each carrying `prompt` + `acceptance` matching the corresponding `scenario.yaml` (Tasks 2, 3) **verbatim**, plus `source_files` per the table above (the `register_nav_menus` reference and the `register_sidebar` reference respectively).
  - `theme-json-custom-color-palette` remains a **lighter stub** (no `prompt`/`acceptance`) and now carries an ADDED `# Deferred: <reason>` comment recording that `theme.json` is a theme-root artifact the plugin scaffold cannot ship (theme-artifact-bound, not feasible without a theme-scaffold harness change); its other fields are unchanged.
  - **No** new catalog stub is created for any other uncovered Themes sub-area (block templates, template parts, template hierarchy, classic template files, custom-header/background, `style.css`, `wp_head`/`wp_footer` marker, `add_theme_support`, block-pattern).
  - Every implemented Themes sub-area is represented by exactly one full record under its final scenario name (`themes-enqueue-assets`, `themes-nav-menu-location`, `themes-sidebar-widget-area`); there is **no orphaned stub duplicating an implemented sub-area and no name mismatch** between a catalog record and a scenario directory.
  - The existing `eval/scenarios/_candidates.yaml` (iAPI catalog) is **not** modified, and **no non-Themes record** in `_wp-dev-candidates.yaml` is added, removed, or altered (only Themes records and the one header line change).
  - No file under `skills/wordpress-development/`, `eval/rubrics/`, `eval/utils/`, or any existing scenario directory is added or modified by this task.

## Coverage check (acceptance criteria → tasks)

- **AC 1 (one area: Themes):** Tasks 1–3 all implement Themes scenarios only; the no-disruption obligation forbids re-scoping or renaming any existing Interactivity API / v1 / Plugins / Block Editor / REST API scenario.
- **AC 2 (selection follows harness feasibility):** all three scenarios are plugin-expressible via a global hook (Task 1 `wp_enqueue_scripts`, Task 2 `after_setup_theme`, Task 3 `widgets_init`); Task 1 ships an e2e with a clean theme-independent front-end assertion, Tasks 2–3 are judge-only; theme-artifact-bound sub-areas are deferred (Task 4).
- **AC 3 (adopted batch of three — one e2e, two judge-only):** Task 1 ships an `e2e.spec.mjs`; Tasks 2 and 3 are judge-only (`scenario.yaml` only). Exactly three implemented scenarios.
- **AC 4 (each scenario one concept, one plugin edit):** each scenario is a single `index.php` edit on a single global hook, with a handful of acceptance points, no theme artifact, no second block, no JS toolchain, no multi-step task (stated per task and in shared conventions).
- **AC 5 (no duplication with covered sub-areas):** Task 1 (front-end asset-enqueue hook) is distinct from the iAPI block `view.js` `block.json` build mechanism; Tasks 2–3 (`register_nav_menus` / `register_sidebar`, distinct Themes handbook chapters and registration functions) are distinct from every existing `register_*` scenario and from each other.
- **AC 6 (enqueue ships an `e2e.spec.mjs` with the right lifecycle and front-end assertion):** Task 1's spec imports from `@wordpress/e2e-test-utils-playwright` + `deactivateAllPlugins` from `../../utils/wp-cli.mjs`, activates the derived slug in `beforeAll`, deactivates all in teardown, navigates `page.goto("/")`, asserts `link#themes-frontend-assets-css` and `script#themes-frontend-assets-js` are attached, seeds no content, adds no helper, and is theme-independent.
- **AC 7 (the two judge-only scenarios ship no `e2e.spec.mjs`):** Tasks 2 and 3 each ship `scenario.yaml` only (no spec), each registering on a single global hook, graded against the produced PHP.
- **AC 8 (asserted literals pinned in the prompt):** the only literal Task 1's spec asserts — the handle `themes-frontend-assets` (driving both ids) — is pinned in its prompt; lockstep enforced in shared conventions and per-task acceptance.
- **AC 9 (schema conformance, tool-agnostic, doc-grounded):** Tasks 1–3 (`name`==dir, required keys in order, `rubrics: []`, no catalog-only fields, tool-agnostic prompts, URL-free acceptance) + Task 4 (provenance only in `source_files`).
- **AC 10 (default zero rubrics):** every scenario task declares `rubrics: []`; no `eval/rubrics/` file is added in any task.
- **AC 11 (`themes-*` naming applied uniformly; existing scenarios not renamed):** each new scenario's directory name == `scenario.yaml` `name` == catalog record `name`, all carrying the `themes-` prefix and matching `/^[a-z0-9-]+$/`; the enqueue scenario does not use the legacy `classic-theme-enqueue-scripts` name; the no-disruption obligation forbids renaming existing scenarios.
- **AC 12 (full catalog record per implemented scenario, 1:1 identity, verbatim):** Task 4 renames+promotes one and adds two full records with verbatim prompt/acceptance and `source_files`; no source URL appears in any `scenario.yaml`.
- **AC 13 (stubs reconciled; no stale or mismatched records):** Task 4 renames+promotes `classic-theme-enqueue-scripts` → `themes-enqueue-assets`, adds the two full records under the sub-header, and annotates `theme-json-custom-color-palette` as `# Deferred`; each implemented sub-area maps to exactly one full record with no orphaned stub and no name mismatch.
- **AC 14 (stale header line kept accurate):** Task 4 updates the one header line to list Themes alongside Plugins, Block Editor, and REST API — the only header change.
- **AC 15 (iAPI catalog and other records untouched):** Task 4 edits only the Themes section + the one header line; the no-disruption obligation forbids touching `_candidates.yaml` and non-Themes records.
- **AC 16 (discoverable + e2e-collectable, pass not required):** every task's Acceptance includes the structural bar (scenario-shape discoverable; `node --check` / Playwright collection for the one spec; catalog parses and is not enumerated); failing grade acceptable; no full matrix / wp-env / plugin code.
- **AC 17 (skill unchanged):** every task forbids changes under `skills/wordpress-development/`.
- **AC 18 (existing suite intact; flat discovery preserved):** every task forbids modifying existing scenarios, the iAPI `_candidates.yaml`, `eval/rubrics/`, and `eval/utils/`; new directories are flat immediate children of `eval/scenarios/`.
- **AC 19 (theme-artifact-bound sub-areas deferred with the right footprint):** Task 4 implements none of them, annotates only `theme-json-custom-color-palette` with `# Deferred`, creates no new stub for the others; the theme-scaffold harness change is recorded as a future out-of-scope recommendation (spec, not catalog).
- **AC 20 (excluded candidate scenarios not implemented and not stubbed):** Task 4 adds no `wp_head`/`wp_footer` marker, no `add_theme_support`, and no block-pattern stub; none is implemented as a Themes scenario.
