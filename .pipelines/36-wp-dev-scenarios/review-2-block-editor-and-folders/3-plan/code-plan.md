# Code Plan: Block Editor scenarios + scenario-folder organization

## Overview

This batch ships **six artifacts** under `eval/` (the Skillsmith eval suite), all without touching the `wordpress-development` skill: **five new Block Editor scenario directories** under `eval/scenarios/` using the adopted `block-editor-` pseudo-folder naming convention (all flat immediate children of `eval/scenarios/`), plus an **in-place edit of the existing catalog** `eval/scenarios/_wp-dev-candidates.yaml`. Of the five scenarios, **four ship an `e2e.spec.mjs`** (`block-editor-dynamic-block`, `block-editor-block-supports`, `block-editor-block-styles`, `block-editor-block-filters`) following the established block post-seed + render-assert lifecycle (mirroring `eval/scenarios/counter/` and `eval/scenarios/fruit-list-each/`), and **one is judge-only** with a `scenario.yaml` only (`block-editor-block-bindings`). The "code" produced here is **scenario-definition and catalog data**, not WordPress plugin code — the plugin under test is authored at run time by the Skillsmith testing agent against the fixed block scaffold. The plan is **one task per scenario (5) plus one task for the catalog edit (6 total)**; all tasks are independent with **no cross-task ordering dependencies** (numbered for reference only, executable in any order or in parallel). The batch adds **zero** new rubrics, reorganizes/renames none of the existing 21 scenarios, leaves the iAPI `_candidates.yaml` and all non-Block-Editor records in `_wp-dev-candidates.yaml` untouched, and modifies no file under `skills/wordpress-development/`.

### The `block-editor-` naming convention (the new structural element)

All five new scenarios use the prefix `block-editor-<concept>` as their **directory name**, their `scenario.yaml` `name`, and their **catalog record `name`** — identical in all three places. This is the adopted "pseudo-folder" organization (design "Folders recommendation", Option 2): it visually clusters Block Editor scenarios when `eval/scenarios/` is listed and sorted, while every scenario remains a **flat immediate child** of `eval/scenarios/` whose name matches `/^[a-z0-9-]+$/`. No filesystem nesting is introduced, so Skillsmith discovery, the e2e lifecycle, `verify-e2e.ts` spec-location/attribution, Playwright collection, and the scaffold are all unchanged. The existing 21 scenarios are **NOT** renamed. Real nested subdirectories are NOT adopted (they require an uncommittable change to the external pinned Skillsmith dependency plus in-repo coupling fixes) and are surfaced only as a future recommendation in the design doc — there is no task for them here.

### Type field — why all six tasks are Type `e2e`

There is **no unit-testable production module** in this batch. The plugin PHP/JSON that would be unit-tested (`block.json`, `render.php`, `index.php`) is authored by the testing agent at run time, not by this phase; the judge-only scenario and the catalog are config/data files. The only writer suited to producing scenario definitions and their Playwright specs is **`code-writer-e2e`**, so every task is **Type `e2e`** (there is no meaningful `tdd` RED/GREEN unit cycle to drive — a `tdd` task would have no production module to test). For the **judge-only scenario (Task 5)** and the **catalog-edit task (Task 6)**, **no `e2e.spec.mjs` is produced** — the deliverable is a `scenario.yaml`-only directory (judge-only) or the catalog file edit alone. Each such task's Changes and Acceptance state this explicitly so the writer does not author a spec where none is wanted.

### Verification bar (static/structural only)

Per the spec (AC 16) and design ("Static / structural verification only"), verification is **static/structural only**. The bar per artifact:
- Each `scenario.yaml` is **discoverable** — passes Skillsmith's `isScenarioShape` (`name`/`description`/`skills`/`prompt`/`acceptance` present and well-typed; `rubrics` present as an array). Running Skillsmith on the scenario directory would execute to a graded result without harness/configuration errors. A **failing grade against the current skill is acceptable** and does not violate the bar.
- Each present `e2e.spec.mjs` is **loadable/collectable by the test runner** — it parses and its imports resolve (verifiable with `node --check` and Playwright collection). Its `../../utils/wp-cli.mjs` import (two-level depth) resolves precisely because the scenario directory is a flat immediate child of `eval/scenarios/`.
- The edited catalog `_wp-dev-candidates.yaml` **parses as valid YAML** and is **NOT discovered as a scenario** (it is a non-directory leading-underscore file, skipped by `enumerate.ts`'s non-directory guard before the YAML-existence guard).

Agents do **NOT** run the full `npx skillsmith`/`scenarios × testing-agents` matrix, do **NOT** boot `wp-env`, and do **NOT** generate the plugin code.

## Guardrail scopes

**No project guardrails.** This project defines no scoped gates, so there is no guardrail scope to fill. (Section retained per the required document structure; intentionally empty.)

| Gate | Scope |
| ---- | ----- |
| None | None |

## E2E test plan

The four e2e scenarios' `e2e.spec.mjs` files **are** the automated end-to-end tests; the judge-only scenario (`block-editor-block-bindings`) and the catalog edit ship **no** spec. Each e2e spec is a Playwright spec run by `eval/utils/verify-e2e.ts` inside a `wp-env` runtime; each **deactivates all plugins, activates exactly its own scaffolded plugin** (`plugin-<scenario.name>-${workerInfo.project.metadata.agentId}` — derived, never hard-coded), **seeds a post** containing `<!-- wp:wp-skill/testing-block … /-->`, navigates to the rendered post, and **asserts on the `.wp-block-wp-skill-testing-block` output** — the single runtime-visible outcome that proves the feature works. Remaining per-scenario acceptance points are judge-checked against the produced code, not asserted by the e2e spec. The lifecycle is fixed by the existing `counter`/`fruit-list-each` specs: `beforeAll` calls `deactivateAllPlugins()` then `await requestUtils.activatePlugin(...)` and seeds the post via `requestUtils.createPost(...)`; `beforeEach` navigates via `page.goto('/?p=' + post.id)`; `afterAll` calls `deactivateAllPlugins()` and `await requestUtils.deleteAllPosts()`. Every literal each spec asserts (the dynamic-block text, `vivid-red`/`has-background`, `is-style-custom`, the appended filter string) is **pinned in that scenario's prompt**, keeping prompt and assertion in lockstep.

### Flow 1: Dynamic / server-rendered block emits PHP-computed text on the front end

- **Steps:** Deactivate all plugins; activate `plugin-block-editor-dynamic-block-<agentId>`. Seed a published post whose content is the **bare** block comment: `content: "<!-- wp:wp-skill/testing-block /-->"`. Navigate to `/?p=<post.id>`.
- **Expected:** The rendered `.wp-block-wp-skill-testing-block` element contains the pinned dynamic text — `await expect(page.locator(".wp-block-wp-skill-testing-block")).toContainText("Hello from PHP")`. This proves the block's front-end output is produced server-side at render time (via `render.php`, computed in PHP), not from a static JS `save()`.
- **Traces to:** Acceptance criteria 6, 7, 16; Design "Scenario 1 — `block-editor-dynamic-block`". Pinned literal: `Hello from PHP`.

### Flow 2: Block support emits a wrapper class from a seeded attribute

- **Steps:** Deactivate all plugins; activate `plugin-block-editor-block-supports-<agentId>`. Seed a published post whose content carries the support attribute in the block comment: `content: '<!-- wp:wp-skill/testing-block {"backgroundColor":"vivid-red"} /-->'`. Navigate to `/?p=<post.id>`.
- **Expected:** The rendered `.wp-block-wp-skill-testing-block` element carries the support-derived class — `await expect(page.locator(".wp-block-wp-skill-testing-block")).toHaveClass(/has-background/)`. This proves the color support is declared in `block.json` AND the wrapper is emitted via `get_block_wrapper_attributes()` so the stored `vivid-red` value becomes a CSS class. (Enabling the support alone produces no class — the class appears only because the seeded comment carries the value; this is the load-bearing seeding dependency from design "Scenario 2".)
- **Traces to:** Acceptance criteria 6, 7, 16; Design "Scenario 2 — `block-editor-block-supports`". Pinned literals: `vivid-red` (seeded value, in prompt) → asserted class `has-background`.

### Flow 3: Registered block style emits its `is-style-<slug>` class from a seeded className

- **Steps:** Deactivate all plugins; activate `plugin-block-editor-block-styles-<agentId>`. Seed a published post whose content carries the style className in the block comment: `content: '<!-- wp:wp-skill/testing-block {"className":"is-style-custom"} /-->'`. Navigate to `/?p=<post.id>`.
- **Expected:** The rendered `.wp-block-wp-skill-testing-block` element carries the style class — `await expect(page.locator(".wp-block-wp-skill-testing-block")).toHaveClass(/is-style-custom/)`. This proves a block style registered under slug `custom` (via `register_block_style()` on `init` in `index.php`) plus class emission through `get_block_wrapper_attributes()` processing the built-in `className` attribute. (No custom attribute registration is needed; `className` is built-in.)
- **Traces to:** Acceptance criteria 6, 7, 16; Design "Scenario 3 — `block-editor-block-styles`". Pinned literal: style slug `custom` (in prompt) → asserted class `is-style-custom`.

### Flow 4: PHP render-time filter appends a pinned string to the block's output

- **Steps:** Deactivate all plugins; activate `plugin-block-editor-block-filters-<agentId>`. Seed a published post whose content is the **bare** block comment: `content: "<!-- wp:wp-skill/testing-block /-->"`. Navigate to `/?p=<post.id>`.
- **Expected:** The rendered page contains the pinned appended string within or adjacent to the `.wp-block-wp-skill-testing-block` wrapper — `await expect(page.locator(".wp-block-wp-skill-testing-block")).toContainText("Powered by my plugin")`. This proves a render-time PHP filter (the `render_block` / `render_block_wp-skill/testing-block` hook in `index.php`) modifying the block's rendered HTML, targeting only `wp-skill/testing-block`. `render_block` output is fully front-end-visible.
- **Traces to:** Acceptance criteria 6, 7, 16; Design "Scenario 4 — `block-editor-block-filters`". Pinned literal: `Powered by my plugin`.

### Judge-only scenario — no e2e flow

`block-editor-block-bindings` ships **no `e2e.spec.mjs`** and is graded by the LLM judge against its `acceptance` list alone. Block bindings are supported only on a fixed set of **core** blocks (`core/image`, `core/heading`, `core/paragraph`, `core/button`, `core/navigation-link`); the testing-block (`wp-skill/testing-block`) is **not** in that list, so the bound value could only be observed by seeding a `core/paragraph` block with binding metadata and asserting on `<p>` text — a deviation from the standard `.wp-block-wp-skill-testing-block` lifecycle, requiring complex seeded binding metadata that exceeds a "simple" scenario. The PHP registration (registration on `init`, source name, value callback, namespace) is fully judge-checkable, so judge-only is the correct, first-class verification channel (design "Scenario 5", Acceptance criterion 6).

## Tasks

> **Shared conventions for ALL six tasks** (transcribe faithfully — these are design-doc obligations, not new decisions):
>
> **Scenario tasks (1–5):**
> - Each task creates exactly one directory `eval/scenarios/<dir>/` that is a **flat immediate child** of `eval/scenarios/` (no nesting). The four e2e tasks (1–4) add **two** files (`scenario.yaml` + `e2e.spec.mjs`); the judge-only task (5) adds **only** `scenario.yaml` (no `e2e.spec.mjs`).
> - `scenario.yaml` keys, in this order: `name`, `description`, `skills` (as a list item `- wordpress-development`), `prompt` (block scalar `|`), `acceptance` (list), `rubrics: []`. **`rubrics: []` must be present as an explicit empty array** — an omitted key or a valueless `rubrics:` fails Skillsmith discovery (`isScenarioShape` checks `Array.isArray(r.rubrics)`, which is `false` for `undefined`/`null`) and the scenario is silently skipped. Do **not** add any file under `eval/rubrics/`.
> - **No catalog-only fields** (`difficulty`, `concepts`, `source`, `source_files`) appear in any `scenario.yaml` — those live only in the catalog (Task 6).
> - `name` equals the directory name for every scenario in this batch (e.g. `block-editor-dynamic-block` → slug `plugin-block-editor-dynamic-block-<agentId>`). Names contain hyphens only (no underscores) and match `/^[a-z0-9-]+$/`.
> - The `prompt` is **user-voice, outcome-phrased, and tool-agnostic**: it must **NOT** name the tool/API/function/framework (no `render.php`, `register_block_type`, `register_block_style`, `register_block_bindings_source`, `render_block`, `get_block_wrapper_attributes`, `block.json`, `supports`, `addFilter`, etc.). It **MAY** name a user-facing pinned literal (the dynamic text, `vivid-red`, the style slug `custom`, the appended filter string, the binding source name) — keep the pinned literal and the e2e assertion target in **lockstep**.
> - The `acceptance` strings are **clean, human-readable check statements with NO embedded source URLs**. Provenance (developer.wordpress.org URLs) lives only in the catalog record's `source_files` (Task 6).
> - `e2e.spec.mjs` (e2e tasks 1–4 only) follows the existing spec pattern exactly: `import { expect, test } from "@wordpress/e2e-test-utils-playwright";` and `import { deactivateAllPlugins } from "../../utils/wp-cli.mjs";`, a `test.describe(...)` block, `beforeAll`/`beforeEach`/`afterAll` lifecycle as in the E2E test plan, slug derived from `` `plugin-<dir>-${workerInfo.project.metadata.agentId}` `` (never hard-coded), seeded post via `requestUtils.createPost({ content: …, status: "publish" })`, navigation via `page.goto('/?p=' + post.id)`, assertion on `page.locator(".wp-block-wp-skill-testing-block")`, and `afterAll` cleanup `deactivateAllPlugins()` + `await requestUtils.deleteAllPosts()`.
> - These are **Type `e2e`** tasks (see "Type field" in Overview): the writer is `code-writer-e2e`. For the judge-only task (5), **no `e2e.spec.mjs` is produced**.
>
> **Catalog task (6):** **edits the existing file** `eval/scenarios/_wp-dev-candidates.yaml` in place (it already exists from review-1 — MODIFY, do not recreate), and produces **no `e2e.spec.mjs`** and **no scenario directory**. Only the Block Editor section is touched. See Task 6 for its structure.
>
> **No-disruption obligation (all tasks):** do not modify, move, or rename any existing scenario directory (the 21), the existing `eval/scenarios/_candidates.yaml` (iAPI catalog), any non-Block-Editor record in `_wp-dev-candidates.yaml`, any file under `eval/rubrics/`, or any file under `skills/wordpress-development/`.
>
> **Suggested pinned literals (design "Risks", phase-4 choices — use these unless a clash is found):** dynamic-block text `Hello from PHP`; filter appended string `Powered by my plugin`; binding source name `my-plugin/greeting`. The supports value (`vivid-red`) and style slug (`custom` → class `is-style-custom`) are fixed by the design and not open choices. Whatever literal is chosen for a scenario MUST appear verbatim in both that scenario's `prompt` and its e2e assertion (and its catalog record).

---

### Task 1: Create the `block-editor-dynamic-block` (Dynamic / server-rendered block) scenario — **e2e**

- **Goal:** Add a scenario that asks for a block whose front-end output is generated dynamically in PHP at render time and displays a specific pinned string, exercising the Block Editor → Dynamic/server-rendered block sub-area, with an e2e spec asserting the pinned text appears in the rendered `.wp-block-wp-skill-testing-block` output.
- **Type:** e2e
- **Files to change:**
  - `eval/scenarios/block-editor-dynamic-block/scenario.yaml` (new)
  - `eval/scenarios/block-editor-dynamic-block/e2e.spec.mjs` (new)
- **Changes:**
  - `scenario.yaml`:
    - `name: block-editor-dynamic-block`
    - `description:` a one-line summary (e.g. "Render a block's front-end output dynamically in PHP at render time.").
    - `skills:` list item `- wordpress-development`
    - `prompt` (block scalar `|`, user-voice, tool-agnostic, pinning the literal the e2e asserts): request a block whose front-end output is generated dynamically on the server each time the page loads — not baked into saved content — and that displays the exact text **`Hello from PHP`**. Do **not** name `render.php`, `register_block_type`, `render_callback`, or any function.
    - `acceptance` (verbatim from design "Scenario 1", clean checks, no URLs):
      1. The block's front-end output is generated dynamically in PHP at render time (not from a static JS `save()`).
      2. The render template produces and returns HTML output.
      3. `get_block_wrapper_attributes()` is called on the block's wrapper element.
      4. The output includes the pinned text (`Hello from PHP`).
      5. No JavaScript `save()` function returns non-null content — the block is dynamic.
    - `rubrics: []`
  - `e2e.spec.mjs`: Implement **Flow 1**. `beforeAll`: `deactivateAllPlugins()`, then `await requestUtils.activatePlugin(`plugin-block-editor-dynamic-block-${workerInfo.project.metadata.agentId}`)`, then `post = await requestUtils.createPost({ content: "<!-- wp:wp-skill/testing-block /-->", status: "publish" })`. `beforeEach`: `await page.goto('/?p=' + post.id)`. One test: `await expect(page.locator(".wp-block-wp-skill-testing-block")).toContainText("Hello from PHP")`. `afterAll`: `deactivateAllPlugins()` + `await requestUtils.deleteAllPosts()`. Keep the asserted text in lockstep with the prompt's pinned `Hello from PHP`.
- **Depends on:** none
- **Traces to:** Spec requirements A.2, A.3, B.7, B.8, B.9, E.17, E.19; Acceptance criteria 2, 6, 7, 8, 16, 17, 18; Design "Scenario 1 — `block-editor-dynamic-block`"; Design decisions "Implement five scenarios", "Dynamic block uses `block.json` `render` → `render.php`, not a `render_callback`", "Adopt `block-editor-*` pseudo-folder naming".
- **Acceptance:**
  - `eval/scenarios/block-editor-dynamic-block/scenario.yaml` exists with keys `name`, `description`, `skills`, `prompt`, `acceptance`, `rubrics`, where `name` is `block-editor-dynamic-block` (equal to the directory name, matching `/^[a-z0-9-]+$/`), `skills` is exactly `[wordpress-development]`, and `rubrics` is an explicit empty array `[]`.
  - The `scenario.yaml` contains **no** catalog-only fields (`difficulty`, `concepts`, `source`, `source_files`) and no embedded source URL anywhere.
  - The `prompt` reads as a user-voice, outcome-phrased request and names no API/tool/function (no "render.php", "render_callback", "dynamic block" API terms); it pins the user-facing literal `Hello from PHP`.
  - The `acceptance` list contains exactly the five points above; no acceptance string contains a URL.
  - `eval/scenarios/block-editor-dynamic-block/e2e.spec.mjs` activates `plugin-block-editor-dynamic-block-<agentId>` (slug derived from `workerInfo.project.metadata.agentId`, not hard-coded), seeds a published post containing `<!-- wp:wp-skill/testing-block /-->`, navigates to `/?p=<id>`, and asserts `.wp-block-wp-skill-testing-block` contains `Hello from PHP`.
  - The spec imports `deactivateAllPlugins` from `../../utils/wp-cli.mjs` and `expect`/`test` from `@wordpress/e2e-test-utils-playwright`, resets plugin state in `beforeAll`, and cleans up with `deactivateAllPlugins()` + `requestUtils.deleteAllPosts()` in `afterAll`.
  - `node --check eval/scenarios/block-editor-dynamic-block/e2e.spec.mjs` succeeds (spec parses) and Playwright would collect it without errors.
  - Running Skillsmith on `eval/scenarios/block-editor-dynamic-block` would execute to a graded result without harness/configuration errors (failing grade acceptable). [Not run by this phase; structural verification only.]
  - No file under `skills/wordpress-development/`, `eval/rubrics/`, the iAPI `_candidates.yaml`, or any existing scenario directory is added or modified by this task.

---

### Task 2: Create the `block-editor-block-supports` (Block supports) scenario — **e2e**

- **Goal:** Add a scenario that asks the block to expose a background (and/or text) color control so a `vivid-red` background can be set, exercising the Block Editor → Block supports sub-area, with an e2e spec asserting the support-derived `has-background` class reaches the rendered wrapper from a seeded attribute.
- **Type:** e2e
- **Files to change:**
  - `eval/scenarios/block-editor-block-supports/scenario.yaml` (new)
  - `eval/scenarios/block-editor-block-supports/e2e.spec.mjs` (new)
- **Changes:**
  - `scenario.yaml`:
    - `name: block-editor-block-supports`
    - `description:` a one-line summary (e.g. "Expose a built-in color control on the block so a background color reaches the rendered output.").
    - `skills:` list item `- wordpress-development`
    - `prompt` (block scalar `|`, user-voice, tool-agnostic, pinning `vivid-red`): request that the block expose a background (and/or text) color control in the editor so that a **`vivid-red`** background can be set on the block and shows on the front end. Do **not** name `block.json`, `supports`, or `get_block_wrapper_attributes()`.
    - `acceptance` (verbatim from design "Scenario 2", clean checks, no URLs):
      1. The block declares at least one block support (e.g. color background and/or text) so the corresponding editor control appears.
      2. `get_block_wrapper_attributes()` is called on the wrapper element so support-derived classes reach the rendered output.
      3. No custom attribute registration is used — the support relies on the built-in attribute the support provides.
    - `rubrics: []`
  - `e2e.spec.mjs`: Implement **Flow 2**. `beforeAll`: `deactivateAllPlugins()`, `await requestUtils.activatePlugin(`plugin-block-editor-block-supports-${workerInfo.project.metadata.agentId}`)`, then `post = await requestUtils.createPost({ content: '<!-- wp:wp-skill/testing-block {"backgroundColor":"vivid-red"} /-->', status: "publish" })`. `beforeEach`: `await page.goto('/?p=' + post.id)`. One test: `await expect(page.locator(".wp-block-wp-skill-testing-block")).toHaveClass(/has-background/)`. `afterAll`: `deactivateAllPlugins()` + `await requestUtils.deleteAllPosts()`. Keep the seeded `vivid-red` value in lockstep with the prompt's pinned literal.
- **Depends on:** none
- **Traces to:** Spec requirements A.2, A.3, B.7, B.8, B.9, E.17, E.19; Acceptance criteria 2, 6, 7, 8, 16, 17, 18; Design "Scenario 2 — `block-editor-block-supports`"; Design decisions "Implement five scenarios", "Supports/styles assert wrapper classes derived from seeded block-comment attributes", "Adopt `block-editor-*` pseudo-folder naming".
- **Acceptance:**
  - `eval/scenarios/block-editor-block-supports/scenario.yaml` exists with `name: block-editor-block-supports` (== directory name), `skills: [wordpress-development]`, and `rubrics: []` (explicit empty array); no catalog-only fields and no embedded URL.
  - The `prompt` reads as a user-voice, outcome-phrased request and names no API/tool/function (no "block.json", "supports", "get_block_wrapper_attributes"); it pins the user-facing literal `vivid-red`.
  - The `acceptance` list contains exactly the three points above, including the `get_block_wrapper_attributes()` wrapper-emission point and the "no custom attribute registration" point; no acceptance string contains a URL.
  - `eval/scenarios/block-editor-block-supports/e2e.spec.mjs` activates `plugin-block-editor-block-supports-<agentId>` (slug derived from `agentId`), seeds a published post containing `<!-- wp:wp-skill/testing-block {"backgroundColor":"vivid-red"} /-->`, navigates to `/?p=<id>`, and asserts `.wp-block-wp-skill-testing-block` has class matching `/has-background/`.
  - The spec imports `deactivateAllPlugins` from `../../utils/wp-cli.mjs` and `expect`/`test` from `@wordpress/e2e-test-utils-playwright`, and cleans up with `deactivateAllPlugins()` + `requestUtils.deleteAllPosts()` in `afterAll`.
  - `node --check eval/scenarios/block-editor-block-supports/e2e.spec.mjs` succeeds and Playwright would collect it without errors.
  - Running Skillsmith on `eval/scenarios/block-editor-block-supports` would execute to a graded result without harness/configuration errors (failing grade acceptable). [Not run by this phase.]
  - No file under `skills/wordpress-development/`, `eval/rubrics/`, the iAPI `_candidates.yaml`, or any existing scenario directory is added or modified by this task.

---

### Task 3: Create the `block-editor-block-styles` (Block styles) scenario — **e2e**

- **Goal:** Add a scenario that asks for a named, selectable visual style registered under the slug `custom`, exercising the Block Editor → Block styles sub-area, with an e2e spec asserting the `is-style-custom` class reaches the rendered wrapper from a seeded `className`.
- **Type:** e2e
- **Files to change:**
  - `eval/scenarios/block-editor-block-styles/scenario.yaml` (new)
  - `eval/scenarios/block-editor-block-styles/e2e.spec.mjs` (new)
- **Changes:**
  - `scenario.yaml`:
    - `name: block-editor-block-styles`
    - `description:` a one-line summary (e.g. "Register a named, selectable visual style for the block under the slug `custom`.").
    - `skills:` list item `- wordpress-development`
    - `prompt` (block scalar `|`, user-voice, tool-agnostic, pinning the style slug `custom`): request a named, selectable visual style for the block, registered under the style slug **`custom`**, that editors can pick from the block's style options. Do **not** name `register_block_style()` or `index.php`.
    - `acceptance` (verbatim from design "Scenario 3", clean checks, no URLs):
      1. A block style named `custom` is registered for `wp-skill/testing-block` on the `init` hook.
      2. The registered style has a `name` (slug `custom`) and a human-readable `label`.
      3. No CSS file is required — registering the style and emitting the class is the acceptance bar (CSS is optional).
    - `rubrics: []`
  - `e2e.spec.mjs`: Implement **Flow 3**. `beforeAll`: `deactivateAllPlugins()`, `await requestUtils.activatePlugin(`plugin-block-editor-block-styles-${workerInfo.project.metadata.agentId}`)`, then `post = await requestUtils.createPost({ content: '<!-- wp:wp-skill/testing-block {"className":"is-style-custom"} /-->', status: "publish" })`. `beforeEach`: `await page.goto('/?p=' + post.id)`. One test: `await expect(page.locator(".wp-block-wp-skill-testing-block")).toHaveClass(/is-style-custom/)`. `afterAll`: `deactivateAllPlugins()` + `await requestUtils.deleteAllPosts()`. Keep the asserted `is-style-custom` (slug `custom`) in lockstep with the prompt's pinned slug.
- **Depends on:** none
- **Traces to:** Spec requirements A.2, A.3, B.7, B.8, B.9, E.17, E.19; Acceptance criteria 2, 6, 7, 8, 16, 17, 18; Design "Scenario 3 — `block-editor-block-styles`"; Design decisions "Implement five scenarios", "Supports/styles assert wrapper classes derived from seeded block-comment attributes", "Adopt `block-editor-*` pseudo-folder naming".
- **Acceptance:**
  - `eval/scenarios/block-editor-block-styles/scenario.yaml` exists with `name: block-editor-block-styles` (== directory name), `skills: [wordpress-development]`, and `rubrics: []` (explicit empty array); no catalog-only fields and no embedded URL.
  - The `prompt` reads as a user-voice, outcome-phrased request and names no API/tool/function (no "register_block_style", "index.php"); it pins the user-facing style slug `custom`.
  - The `acceptance` list contains exactly the three points above, including registration on the `init` hook, the `name` (slug `custom`) + `label` point, and the "CSS optional" point; no acceptance string contains a URL.
  - `eval/scenarios/block-editor-block-styles/e2e.spec.mjs` activates `plugin-block-editor-block-styles-<agentId>` (slug derived from `agentId`), seeds a published post containing `<!-- wp:wp-skill/testing-block {"className":"is-style-custom"} /-->`, navigates to `/?p=<id>`, and asserts `.wp-block-wp-skill-testing-block` has class matching `/is-style-custom/`.
  - The spec imports `deactivateAllPlugins` from `../../utils/wp-cli.mjs` and `expect`/`test` from `@wordpress/e2e-test-utils-playwright`, and cleans up with `deactivateAllPlugins()` + `requestUtils.deleteAllPosts()` in `afterAll`.
  - `node --check eval/scenarios/block-editor-block-styles/e2e.spec.mjs` succeeds and Playwright would collect it without errors.
  - Running Skillsmith on `eval/scenarios/block-editor-block-styles` would execute to a graded result without harness/configuration errors (failing grade acceptable). [Not run by this phase.]
  - No file under `skills/wordpress-development/`, `eval/rubrics/`, the iAPI `_candidates.yaml`, or any existing scenario directory is added or modified by this task.

---

### Task 4: Create the `block-editor-block-filters` (Block filters — PHP `render_block`) scenario — **e2e**

- **Goal:** Add a scenario that asks for a specific short string to always appear in the block's rendered output on every page load, exercising the Block Editor → Block filters (PHP `render_block`) sub-area, with an e2e spec asserting the pinned appended string appears in/adjacent to the rendered `.wp-block-wp-skill-testing-block` output.
- **Type:** e2e
- **Files to change:**
  - `eval/scenarios/block-editor-block-filters/scenario.yaml` (new)
  - `eval/scenarios/block-editor-block-filters/e2e.spec.mjs` (new)
- **Changes:**
  - `scenario.yaml`:
    - `name: block-editor-block-filters`
    - `description:` a one-line summary (e.g. "Append a fixed string to this block's rendered output on every page load via a render-time filter.").
    - `skills:` list item `- wordpress-development`
    - `prompt` (block scalar `|`, user-voice, tool-agnostic, pinning the appended string): request that **this** block's rendered output always include the exact short string **`Powered by my plugin`** (e.g. appended after the block's HTML on every page load), affecting only this block and not other blocks. Do **not** name `render_block`, the hook, `add_filter`, or `index.php`.
    - `acceptance` (verbatim from design "Scenario 4", clean checks, no URLs):
      1. A render-time filter on the block's output is registered in `index.php`.
      2. The filter callback receives the block's rendered HTML and returns modified HTML (the pinned string appended/prepended/wrapped).
      3. The modification targets only `wp-skill/testing-block` — via the block-specific hook variant or a block-name check in a generic callback (it must not modify all blocks).
    - `rubrics: []`
  - `e2e.spec.mjs`: Implement **Flow 4**. `beforeAll`: `deactivateAllPlugins()`, `await requestUtils.activatePlugin(`plugin-block-editor-block-filters-${workerInfo.project.metadata.agentId}`)`, then `post = await requestUtils.createPost({ content: "<!-- wp:wp-skill/testing-block /-->", status: "publish" })`. `beforeEach`: `await page.goto('/?p=' + post.id)`. One test: `await expect(page.locator(".wp-block-wp-skill-testing-block")).toContainText("Powered by my plugin")`. `afterAll`: `deactivateAllPlugins()` + `await requestUtils.deleteAllPosts()`. Keep the asserted appended string in lockstep with the prompt's pinned `Powered by my plugin`.
- **Depends on:** none
- **Traces to:** Spec requirements A.2, A.3, B.7, B.8, B.9, C.12, E.17, E.19; Acceptance criteria 2, 6, 7, 8, 11, 16, 17, 18; Design "Scenario 4 — `block-editor-block-filters`"; Design decisions "Implement five scenarios", "`block-editor-block-filters` uses the PHP `render_block` hook (distinct from the existing JS `addFilter` stub)", "Adopt `block-editor-*` pseudo-folder naming".
- **Acceptance:**
  - `eval/scenarios/block-editor-block-filters/scenario.yaml` exists with `name: block-editor-block-filters` (== directory name), `skills: [wordpress-development]`, and `rubrics: []` (explicit empty array); no catalog-only fields and no embedded URL.
  - The `prompt` reads as a user-voice, outcome-phrased request and names no API/tool/function (no "render_block", "add_filter", "filter hook"); it pins the user-facing literal `Powered by my plugin` and conveys that only this block is affected.
  - The `acceptance` list contains exactly the three points above, including the render-time-filter-in-`index.php` point, the receives-and-returns-modified-HTML point, and the **targets-only-`wp-skill/testing-block`** correctness point (must not modify all blocks); no acceptance string contains a URL.
  - `eval/scenarios/block-editor-block-filters/e2e.spec.mjs` activates `plugin-block-editor-block-filters-<agentId>` (slug derived from `agentId`), seeds a published post containing `<!-- wp:wp-skill/testing-block /-->`, navigates to `/?p=<id>`, and asserts `.wp-block-wp-skill-testing-block` contains `Powered by my plugin`.
  - The spec imports `deactivateAllPlugins` from `../../utils/wp-cli.mjs` and `expect`/`test` from `@wordpress/e2e-test-utils-playwright`, and cleans up with `deactivateAllPlugins()` + `requestUtils.deleteAllPosts()` in `afterAll`.
  - `node --check eval/scenarios/block-editor-block-filters/e2e.spec.mjs` succeeds and Playwright would collect it without errors.
  - Running Skillsmith on `eval/scenarios/block-editor-block-filters` would execute to a graded result without harness/configuration errors (failing grade acceptable). [Not run by this phase.]
  - No file under `skills/wordpress-development/`, `eval/rubrics/`, the iAPI `_candidates.yaml`, or any existing scenario directory is added or modified by this task.

---

### Task 5: Create the `block-editor-block-bindings` (Block bindings) scenario — **judge-only**

- **Goal:** Add a scenario that asks for a custom data source, registered under a specific name, that supplies a value to a block from PHP, exercising the Block Editor → Block bindings sub-area, as a **judge-only** scenario (no `e2e.spec.mjs`).
- **Type:** e2e (writer: `code-writer-e2e`; **judge-only deliverable** — produces `scenario.yaml` only, **no** `e2e.spec.mjs`)
- **Files to change:**
  - `eval/scenarios/block-editor-block-bindings/scenario.yaml` (new)
  - **No** `e2e.spec.mjs` is produced for this scenario.
- **Changes:**
  - `scenario.yaml`:
    - `name: block-editor-block-bindings`
    - `description:` a one-line summary (e.g. "Register a custom PHP data source that supplies a value to a block, under a pinned source name.").
    - `skills:` list item `- wordpress-development`
    - `prompt` (block scalar `|`, user-voice, tool-agnostic, pinning the source name): request a custom data source, registered under the specific name **`my-plugin/greeting`**, that supplies a value to a block from the server (PHP). Do **not** name `register_block_bindings_source()` or `index.php`.
    - `acceptance` (verbatim from design "Scenario 5", clean checks, no URLs):
      1. A custom block binding source is registered on the `init` hook.
      2. The source name matches `/^[a-z0-9-]+\/[a-z0-9-]+$/` and equals the pinned name (`my-plugin/greeting`).
      3. A value callback (`get_value_callback`) is provided that returns a non-empty string.
      4. The source namespace matches the plugin's namespace.
    - `rubrics: []`
  - Do **not** create `eval/scenarios/block-editor-block-bindings/e2e.spec.mjs` — block bindings are observable only on core blocks (e.g. `core/paragraph`), not on the `.wp-block-wp-skill-testing-block` wrapper, and would require complex seeded binding metadata exceeding a simple scenario; this scenario is graded by the judge against `acceptance` only. (The PHP registration is fully judge-checkable; judge-only is a first-class deliverable.)
- **Depends on:** none
- **Traces to:** Spec requirements A.2, A.3, B.7, B.8, B.9, E.17, E.19; Acceptance criteria 2, 6, 7, 8, 16, 17, 18; Design "Scenario 5 — `block-editor-block-bindings`"; Design decisions "Implement five scenarios", "e2e for dynamic block, supports, styles, and filters; judge-only for block bindings", "Adopt `block-editor-*` pseudo-folder naming".
- **Acceptance:**
  - `eval/scenarios/block-editor-block-bindings/scenario.yaml` exists with `name: block-editor-block-bindings` (== directory name), `skills: [wordpress-development]`, and `rubrics: []` (explicit empty array); no catalog-only fields and no embedded URL.
  - The directory contains **only** `scenario.yaml` — **no** `e2e.spec.mjs` exists in it.
  - The `prompt` reads as a user-voice, outcome-phrased request and names no API/tool/function (no "register_block_bindings_source", "binding source" API terms, "index.php"); it pins the source name `my-plugin/greeting`.
  - The `acceptance` list contains exactly the four points above, including registration on the `init` hook, the source-name pattern + equals-pinned-name point, the `get_value_callback` returning a non-empty string point, and the namespace-matches-plugin point; no acceptance string contains a URL.
  - Running Skillsmith on `eval/scenarios/block-editor-block-bindings` would execute to a **judge-graded** result without harness/configuration errors (failing grade acceptable). [Not run by this phase.]
  - No file under `skills/wordpress-development/`, `eval/rubrics/`, the iAPI `_candidates.yaml`, or any existing scenario directory is added or modified by this task.

---

### Task 6: Update the Block Editor section of the existing catalog `_wp-dev-candidates.yaml`

- **Goal:** Edit the existing catalog `eval/scenarios/_wp-dev-candidates.yaml` **in place** so its `# === Area: Block Editor ===` section gains **five new full records** (one per implemented scenario, with `prompt`/`acceptance` matching the shipped `scenario.yaml` files and `source_files` provenance) and **three new lighter deferral stubs**, while **retaining the two pre-existing stubs unchanged** and leaving every non-Block-Editor record and the iAPI `_candidates.yaml` untouched. This is where documentation provenance for the five scenarios lives.
- **Type:** e2e (writer: `code-writer-e2e`; **catalog-data deliverable** — edits the single catalog file only, **no** `e2e.spec.mjs` and **no** scenario directory)
- **Files to change:**
  - `eval/scenarios/_wp-dev-candidates.yaml` (MODIFY existing — leading-underscore **non-directory** file; edit only the Block Editor section)
- **Changes:**
  - **Locate the existing `# === Area: Block Editor ===` section** (currently containing two stubs, `block-api-static-block` and `block-filter-add-custom-attribute`, immediately before `# === Area: Themes ===`). Edit only within this section; do not touch any other area's records, the iAPI `_candidates.yaml`, or the file's top-of-file comment block (other than, optionally, a one-line note that the five Block Editor records are now implemented — not required).
  - **Retain the two pre-existing stubs unchanged** (`block-api-static-block`, `block-filter-add-custom-attribute`) — same `name`/`description`/`difficulty`/`concepts`/`source`/`source_files`. They remain lighter stubs for still-unimplemented sub-areas (static block: requires a compiled JS `save()` the scaffold has no path for; JS-side `addFilter('blocks.registerBlockType', …)`: a distinct mechanism from the PHP `render_block` filter implemented by `block-editor-block-filters`). Neither overlaps an implemented sub-area, so neither is orphaned and neither is renamed. Optionally append a brief one-line recorded-reason comment to each, but do not alter their fields.
  - **Add five new full records** under the Block Editor section, each mirroring the established catalog-record shape — `name`, `description`, `difficulty: simple`, `concepts`, `source: dev.wordpress.org`, `source_files`, `prompt`, `acceptance` — where:
    - `name` equals the scenario's directory name and its `scenario.yaml` `name`.
    - `prompt` and `acceptance` are the **exact same verbatim strings** as the shipped `scenario.yaml` from Tasks 1–5 (1:1 identity — same pinned literals).
    - `source_files` carries the developer.wordpress.org URL(s) below (provenance lives ONLY here, never in `scenario.yaml`).
    - `concepts` is a short descriptive list (e.g. as suggested below); descriptive only, not asserted.

    | Record `name` | `source_files` | Suggested `concepts` |
    |---|---|---|
    | `block-editor-dynamic-block` | `https://developer.wordpress.org/block-editor/how-to-guides/block-tutorial/creating-dynamic-blocks/` | `[render.php, dynamic-block, server-side-render]` |
    | `block-editor-block-supports` | `https://developer.wordpress.org/block-editor/reference-guides/block-api/block-supports/` | `[block.json, supports, get_block_wrapper_attributes]` |
    | `block-editor-block-styles` | `https://developer.wordpress.org/block-editor/reference-guides/block-api/block-styles/` | `[register_block_style, block-styles, className]` |
    | `block-editor-block-filters` | `https://developer.wordpress.org/block-editor/reference-guides/filters/block-filters/` | `[render_block, block-filters, add_filter]` |
    | `block-editor-block-bindings` | `https://developer.wordpress.org/block-editor/reference-guides/block-api/block-bindings/` | `[register_block_bindings_source, block-bindings, get_value_callback]` |
  - **Add three new lighter deferral stubs** under the Block Editor section (lighter shape — `name`/`description`/`difficulty`/`concepts`/`source`/`source_files`, **no `prompt`/`acceptance`**, with the recorded deferral reason as a comment, mirroring the existing stub shape):
    - `block-editor-block-variations` — Block variations. Recorded reason: editor-only (no front-end footprint), JS-only registration path (no PHP `register_block_variation()`); requires a JavaScript file + enqueue, cannot be scoped to a simple `index.php` edit. `source_files:` `https://developer.wordpress.org/block-editor/reference-guides/block-api/block-variations/`.
    - `block-editor-inner-blocks` — InnerBlocks. Recorded reason: parent/child multi-block setup; cannot be scoped to a single-block-scaffold edit. `source_files:` `https://developer.wordpress.org/block-editor/reference-guides/block-api/block-edit-save/` (or the InnerBlocks reference page).
    - `block-editor-block-patterns` — Block patterns. Recorded reason: multi-block composition; no clean single-block-scaffold surface. `source_files:` `https://developer.wordpress.org/block-editor/reference-guides/block-api/block-patterns/`.
  - **Do NOT** create a directory or any `scenario.yaml`/`e2e.spec.mjs` for this task — the catalog is a single flat file edited in place. **Do NOT** modify the existing `eval/scenarios/_candidates.yaml` (iAPI catalog). **Do NOT** add or alter any non-Block-Editor record.
- **Depends on:** none (the five full records reuse the verbatim prompt/acceptance fixed in Tasks 1–5 by this plan, so Task 6 needs no prior task to complete first; the writer copies the same pinned strings)
- **Traces to:** Spec requirements C.11, C.12, C.13, A.4, A.5; Acceptance criteria 4, 10, 11, 12; Design "Catalog promotion + reconciliation"; Design decision "Promote five full catalog records, retain two stubs, add three deferral stubs; leave iAPI and other records untouched".
- **Acceptance:**
  - `eval/scenarios/_wp-dev-candidates.yaml` still exists as a **non-directory** leading-underscore file and **parses as valid YAML**; it is still **NOT enumerated as a scenario** by Skillsmith discovery.
  - Under `# === Area: Block Editor ===`, there are exactly **five new full records** named `block-editor-dynamic-block`, `block-editor-block-supports`, `block-editor-block-styles`, `block-editor-block-filters`, `block-editor-block-bindings`, each carrying `prompt` + `acceptance` whose strings match the corresponding `scenario.yaml` from Tasks 1–5 **verbatim**, plus `source_files` with the developer.wordpress.org URL(s) listed above.
  - The two pre-existing stubs (`block-api-static-block`, `block-filter-add-custom-attribute`) are **retained with their fields unchanged** (no rename, no field edit beyond an optional recorded-reason comment), and neither duplicates an implemented sub-area.
  - There are **three new deferral stubs** (`block-editor-block-variations`, `block-editor-inner-blocks`, `block-editor-block-patterns`), each a lighter stub (no `prompt`/`acceptance`) carrying a recorded deferral reason and a `source_files` URL.
  - Every Block Editor record `name` either equals an implemented scenario's directory name (the five full records) or is a deferral/retained stub for a still-unimplemented sub-area — there is **no orphaned stub duplicating an implemented sub-area and no name mismatch** between a catalog record and a scenario directory.
  - The existing `eval/scenarios/_candidates.yaml` (iAPI catalog) is **not** modified, and **no non-Block-Editor record** in `_wp-dev-candidates.yaml` is added, removed, or altered.
  - No file under `skills/wordpress-development/`, `eval/rubrics/`, or any existing scenario directory is added or modified by this task.

## Coverage check (acceptance criteria → tasks)

- **AC 1 (one area: Block Editor):** Tasks 1–5 all implement Block Editor scenarios only; no existing scenario is re-scoped.
- **AC 2 (one simple scenario per major uncovered sub-area):** Tasks 1–5 cover Dynamic block, Block supports, Block styles, Block filters, Block bindings — one simple single-concept scenario each.
- **AC 3 (batch size 4–6):** five implemented scenarios (Tasks 1–5), within the target.
- **AC 4 (defer-with-reason recorded):** Task 6 adds three deferral stubs (variations, InnerBlocks, patterns) with recorded reasons and retains the two pre-existing stubs.
- **AC 5 (no duplication with covered sub-areas):** Tasks 1–5 cover Block Editor sub-areas disjoint from iAPI / v1 / Plugins; `block-editor-block-filters` (PHP `render_block`) is mechanism-distinct from the JS `addFilter` stub (Task 6 retains the stub).
- **AC 6 (mixed verification present and correct):** Tasks 1–4 ship e2e specs with literals pinned in the prompt; Task 5 is judge-only with rationale.
- **AC 7 (realizable within the fixed block scaffold):** every scenario is a single `block.json`/`render.php`/`index.php` edit on the fixed `wp-skill/testing-block`, no second block, no rename (stated per task and in shared conventions).
- **AC 8 (schema conformance, tool-agnostic, doc-grounded):** Tasks 1–5 (`name`==dir, required keys, `rubrics: []`, no catalog-only fields, tool-agnostic prompts, URL-free acceptance) + Task 6 (provenance in `source_files`).
- **AC 9 (default zero rubrics):** every scenario task declares `rubrics: []`; no `eval/rubrics/` file added in any task.
- **AC 10 (full catalog record per implemented scenario, 1:1 identity):** Task 6 adds five full records with verbatim prompt/acceptance and `source_files`.
- **AC 11 (no stale or mismatched stubs; naming reconciled):** Task 6 retains the two pre-existing stubs (no orphan, no mismatch) and reconciles names so each Block Editor record maps to its scenario directory or a still-unimplemented sub-area.
- **AC 12 (iAPI catalog and other records untouched):** Task 6 edits only the Block Editor section; the no-disruption obligation forbids touching `_candidates.yaml` and non-Block-Editor records.
- **AC 13 (folders exploration recorded):** delivered by the design artifact's "Folders recommendation" (a design-phase prose deliverable); no code task — recorded here for completeness.
- **AC 14 (recommendation adopts only the low-risk path):** the design adopts `block-editor-*` pseudo-folders; this plan executes that convention (all five scenarios flat immediate children with the prefix). No real-subdirectory task exists.
- **AC 15 (existing scenarios not reorganized; naming consistent):** the no-disruption obligation forbids renaming/moving the 21 existing scenarios; each new scenario's directory name == `scenario.yaml` `name` == catalog record `name` (Tasks 1–6).
- **AC 16 (discoverable + e2e-loadable, pass not required):** every task's Acceptance includes the structural bar (`isScenarioShape` discoverable; `node --check`/Playwright collection for present specs; catalog parses and is not enumerated); failing grade acceptable; no full matrix / wp-env / plugin code.
- **AC 17 (skill unchanged):** every task forbids changes under `skills/wordpress-development/`.
- **AC 18 (existing suite intact; flat discovery preserved):** every task forbids modifying existing scenarios, the iAPI `_candidates.yaml`, and `eval/rubrics/`; new directories are flat immediate children of `eval/scenarios/`.
