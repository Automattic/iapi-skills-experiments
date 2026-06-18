# Design Doc: Themes scenarios

## Overview

The `wordpress-development` skill is evaluated by a Skillsmith-based suite under `eval/`. Prior reviews established a dated reference taxonomy of developer.wordpress.org, committed a candidate catalog at `eval/scenarios/_wp-dev-candidates.yaml`, and implemented scenarios for the Interactivity API, a v1 set (Hooks/Filters, Shortcodes, Custom Post Types, custom REST endpoints), the Plugins area, the Block Editor area, and the REST API area. The **Themes** area (the Theme Handbook) is still uncovered: the catalog carries only two Themes stubs (`theme-json-custom-color-palette` and `classic-theme-enqueue-scripts`), and no Themes scenario is implemented.

This review extends coverage to the **Themes** area with a deliberately small batch — **one end-to-end scenario plus two judge-only scenarios** — reusing (not rebuilding) the existing taxonomy and catalog. The defining constraint for Themes is **harness feasibility**: the Skillsmith scaffold builds a *plugin* (`plugin-<scenario>-<agentId>`), not a theme, so any Themes concept that requires a theme artifact (`theme.json` file, block templates, template parts, the template hierarchy, classic template files, custom-header/background, `style.css`) cannot be scaffolded and is **deferred**. Only Themes sub-areas that are *plugin-expressible* (reachable via global hooks from a plugin, with no theme artifact) are candidates. Of those, only one — enqueuing front-end assets — produces a clean, theme-independent, front-end-visible assertion, so the batch is one e2e scenario (enqueue assets) plus two judge-only scenarios (register a navigation-menu location, register a sidebar / widget area). The intent explicitly permits this smaller batch because much of Themes is theme-artifact-bound.

As in prior reviews, the **skill itself is not modified** — the scenarios lead and the skill catches up in later work; verification is **static/structural only** (each scenario discoverable by Skillsmith and, where it ships one, its `e2e.spec.mjs` parseable/collectable by the test runner), and scenarios are not required to pass against the current skill. The folders question is already resolved (review-2): the adopted convention is the **`themes-*` pseudo-folder naming** (area-prefixed flat scenario names), which this review applies. The deliverables are: (1) **three Themes scenarios** — `themes-enqueue-assets` (e2e), `themes-nav-menu-location` (judge-only), and `themes-sidebar-widget-area` (judge-only); and (2) a **catalog promotion + reconciliation** of the Themes section of `_wp-dev-candidates.yaml` (one stub renamed+promoted to full, two new full records, one stub annotated as deferred, one header-line fix). The existing scenarios, the scaffold, the harness, Skillsmith, the iAPI `_candidates.yaml`, and the skill are all untouched.

## Approach

The end-to-end mental model the implementer works from:

**Naming convention (the structural element).** All three new scenarios use the prefix `themes-<concept>` as their directory name, their `scenario.yaml` `name`, and their catalog record `name` — identical in all three places, each matching `/^[a-z0-9-]+$/`. This is the adopted "pseudo-folder" organization carried over from review-2: it visually clusters Themes scenarios when `eval/scenarios/` is listed and sorted, while every scenario remains a **flat immediate child** of `eval/scenarios/`. No filesystem nesting is introduced, so Skillsmith discovery, the e2e lifecycle, the `verify-e2e.ts` spec-location/attribution logic, the test runner's collection, and the scaffold are all unchanged. The existing scenarios are NOT renamed. The folders question itself is not re-litigated — review-2 already classified real subdirectories as not low-risk and adopted this convention; this review applies it. The three names are: `themes-enqueue-assets`, `themes-nav-menu-location`, `themes-sidebar-widget-area`. None collides with any existing scenario directory (the review-3 enumeration found 24 existing dirs, none carrying a `themes-` prefix).

**Scenarios (the implemented work).** Each scenario is a self-contained directory `eval/scenarios/<name>/` containing a `scenario.yaml`; the e2e scenario additionally contains an `e2e.spec.mjs`. The established runtime lifecycle is reused unchanged:

1. **Skillsmith discovers the scenario** by reading the immediate children of `eval/scenarios/` and loading each child's `scenario.yaml`. The directory name is the discovery identity; the `name` field inside the YAML is the plugin-slug fragment used downstream. For every scenario here, `name` equals the directory name.
2. **Skillsmith scaffolds a plugin** per (scenario, testing-agent). The plugin slug is `plugin-<scenario.name>-<agentId>`. The scaffold provides an `index.php` (plugin header + hooks) that hosts all PHP. **No block or theme artifact is needed** — every registration in this batch goes on a global hook in `index.php`: `wp_enqueue_scripts` (enqueue assets), `after_setup_theme` (nav-menu location), or `widgets_init` (sidebar / widget area). This is the same mechanism that lets `filter-body-class` work from a plugin: these are global hooks that fire regardless of registrant, so the plugin registers exactly where a theme would, with no theme involvement.
3. **The testing agent implements the requested feature** as a single registration in `index.php`: a `wp_enqueue_scripts` callback enqueuing a stylesheet and a script (enqueue), a `register_nav_menus` call on `after_setup_theme` (nav-menu location), or a `register_sidebar` call on `widgets_init` (sidebar). One concept, one small feature, one plugin edit each. No theme artifact, no second block type, no JS toolchain, no multi-step task.
4. **An LLM judge grades the produced code** against the scenario's `acceptance` list. Every scenario declares `rubrics: []`, so only `acceptance` is used. The two judge-only scenarios are graded **solely** by the judge against the produced PHP — they ship no `e2e.spec.mjs`, mirroring the existing judge-only Plugins scenarios (`cron-event`, `admin-menu-page`, `i18n-textdomain`).
5. **The e2e harness (`eval/utils/verify-e2e.ts`) runs the one e2e spec** in a `wp-env` runtime: it boots `wp-env` with every produced plugin registered but deactivated, then runs `themes-enqueue-assets/e2e.spec.mjs`. The spec deactivates all plugins, activates exactly its own plugin, navigates to the front-end home page (`page.goto("/")`), and asserts against the resulting page HTML. No content seeding; no new `eval/utils/` helper.

**The single front-end e2e assertion (load-bearing).** The enqueue scenario's observable behavior is verified entirely through WordPress-emitted markup. When a plugin enqueues a stylesheet and a script on `wp_enqueue_scripts` for a pinned handle `H`, WordPress prints `<link ... id='H-css' ...>` (stylesheet) and `<script ... id='H-js'></script>` (script) into the page that `wp_head()` / `wp_footer()` render. The `id` attribute depends **only on the handle name** (which the plugin pins), so the assertion is **theme-independent** — it does not depend on which theme `wp-env` activates. The spec asserts both elements are attached to the DOM after `page.goto("/")`.

**The `$src` gotcha (must be baked into prompt + acceptance).** A WordPress style/script tag only renders if the enqueue has a **non-empty source**. Both `WP_Styles::do_item()` and `WP_Scripts::do_item()` begin with an early return when `! $src` (inline-only path), so an empty/falsy `$src` — or a `wp_register_*` call **without** a following `wp_enqueue_*` — prints **no** `<link>`/`<script>` tag and the id assertion would fail. Core does **no** filesystem/HTTP existence check on the URL, so any non-empty source emits the tag; the asset URL need not resolve to HTTP 200. The design's mitigation: the prompt asks the agent to **load an actual stylesheet file and an actual script file** on the front end (implying a real, non-empty source, e.g. a plugin-relative path), and the acceptance requires the stylesheet and script to be **enqueued with a source** (not merely registered, not an empty alias). Phase 4 must word the prompt so it cannot read as "register a handle".

**Catalog.** The Themes section of `eval/scenarios/_wp-dev-candidates.yaml` is updated: `classic-theme-enqueue-scripts` is **renamed and promoted** to a full record named `themes-enqueue-assets`; two new full records (`themes-nav-menu-location`, `themes-sidebar-widget-area`) are added under an `# Implemented Themes scenarios — full records` sub-header mirroring the Block Editor / REST API pattern; `theme-json-custom-color-palette` stays a lighter stub and gets a `# Deferred: <reason>` comment ADDED; and the stale header line is corrected to list Themes. No new stub is created for any other uncovered Themes sub-area. The iAPI `_candidates.yaml` and all non-Themes records are untouched.

**No change is made** to the scaffold, the e2e harness, the Skillsmith package, the skill, the existing scenarios, `eval/utils/`, `eval/rubrics/`, or `_candidates.yaml`.

## The three Themes scenarios

The Themes area's plugin-expressible sub-areas yield the candidate set. Harness feasibility drives selection: a sub-area gets an **e2e** scenario only when it produces a clean, theme-independent, front-end-visible assertion; a plugin-expressible sub-area lacking such an assertion gets a **judge-only** scenario; theme-artifact-bound sub-areas are **deferred**. The batch is deliberately one e2e plus two judge-only — no clean, theme-independent, non-duplicative second e2e Themes sub-area exists beyond enqueue. Each scenario is fully specified below so phase 3/4 build it without re-deciding. Every literal the e2e asserts is pinned in that scenario's prompt, keeping prompt and assertion in lockstep.

### Sub-area selection

| Sub-area | Implemented? | Kind / e2e channel | Single `index.php` edit? | Scenario |
|---|---|---|---|---|
| Front-end asset enqueue (Core Concepts → Including Assets) | YES | e2e — front-end `page.goto("/")` DOM presence of `<link id=...-css>` + `<script id=...-js>` | Yes — `wp_enqueue_scripts` callback | `themes-enqueue-assets` |
| Navigation-menu location (Navigation Menus) | YES | judge-only (no clean front-end assertion — needs `wp_nav_menu()` in a theme template) | Yes — `register_nav_menus` on `after_setup_theme` | `themes-nav-menu-location` |
| Sidebar / widget area (Widgets) | YES | judge-only (no clean front-end assertion — needs `dynamic_sidebar()` in a theme template) | Yes — `register_sidebar` on `widgets_init` | `themes-sidebar-widget-area` |
| `theme.json` settings/styles (as a file) | NO — deferred, kept as a lighter stub | n/a — theme-root artifact the plugin scaffold cannot ship | n/a | `theme-json-custom-color-palette` stub (`# Deferred:`) |
| Block templates / template parts / template hierarchy / classic template files / custom-header-background / `style.css` | NO — deferred, no catalog entry | n/a — theme-artifact-bound | n/a | excluded (Out-of-Scope only; no stub) |
| `wp_head`/`wp_footer` direct-output marker | NO — excluded (borderline-duplicative of v1 `body_class` / `filter-body-class`) | n/a | n/a | excluded (Out-of-Scope only; no stub) |
| `add_theme_support` | NO — excluded (default-on in the default block theme → indistinguishable, or template-bound) | n/a | n/a | excluded (Out-of-Scope only; no stub) |
| Block-pattern registration | NO — excluded (no front-end HTML by itself; already a deferred Block Editor stub) | n/a | n/a | excluded (Block Editor area; no new Themes stub) |

### Scenario 1 — `themes-enqueue-assets` (front-end asset enqueue) — e2e

- **Sub-area:** Themes → Core Concepts → Including Assets — enqueue a front-end stylesheet **and** a front-end script. **Distinct from the iAPI block `view.js` loading mechanism:** that is a `block.json` build-tooling mechanism; this is a front-end asset-enqueue hook (`wp_enqueue_scripts`) from a plain plugin, in a different handbook chapter (Themes → Including Assets). Renames/promotes the legacy `classic-theme-enqueue-scripts` stub.
- **Source URL(s):** primary https://developer.wordpress.org/themes/core-concepts/including-assets/ ; secondary https://developer.wordpress.org/themes/classic-themes/ . (These live in the catalog `source_files`, never in the `scenario.yaml`.)
- **Mechanism:** Agent edits the scaffolded plugin's `index.php` to add **one** callback on `wp_enqueue_scripts` that calls `wp_enqueue_style($handle, $src, ...)` and `wp_enqueue_script($handle, $src, ...)`. A **single shared handle** is used for both the style and the script (verified safe — `WP_Styles` and `WP_Scripts` are separate registries, so the same handle string does not collide; both tags emit with distinct suffixes `-css` / `-js`). The recommended handle is **`themes-frontend-assets`** (clean lowercase-kebab → round-trips through `esc_attr()` into the id verbatim → ids `themes-frontend-assets-css` and `themes-frontend-assets-js`). Each enqueue must carry a **real, non-empty `$src`** (the `$src` gotcha above); a plugin-relative path such as `plugins_url('assets/style.css', __FILE__)` is the realistic form. The id attributes are produced by WP core (`{handle}-css` / `{handle}-js`), not by the agent.
- **Pinned literals (prompt ↔ assertion lockstep):** the handle **`themes-frontend-assets`** — the only literal the e2e asserts, and it drives **both** the `-css` and `-js` ids. Stated in the prompt. (Phase 4 may choose a different clean lowercase-kebab handle, but it MUST be pinned in the prompt and matched verbatim in the e2e as `#{handle}-css` / `#{handle}-js`.)
- **e2e flow (filter-body-class lifecycle, verbatim):**
  - imports `{ expect, test }` from `@wordpress/e2e-test-utils-playwright` and `{ deactivateAllPlugins }` from `../../utils/wp-cli.mjs`.
  - `beforeAll`: `deactivateAllPlugins()`; `await requestUtils.activatePlugin(\`plugin-themes-enqueue-assets-${workerInfo.project.metadata.agentId}\`)`. **No content seeding.**
  - test: `await page.goto("/")`; then `await expect(page.locator("link#themes-frontend-assets-css")).toBeAttached()` and `await expect(page.locator("script#themes-frontend-assets-js")).toBeAttached()`.
  - `afterAll`: `deactivateAllPlugins()`.
  - `toBeAttached()` checks presence in the DOM regardless of visibility — correct for a `<link>` in `<head>` and a `<script>` that may sit in head or footer. No new `eval/utils/` helper is added.
- **`acceptance` (scenario-unique, clean checks, no URLs) — draft for phase 4:**
  1. On the front end, a stylesheet is enqueued (not merely registered) under the handle `themes-frontend-assets`, with a real source, so WordPress emits its `<link>` element.
  2. On the front end, a script is enqueued (not merely registered) under the handle `themes-frontend-assets`, with a real source, so WordPress emits its `<script>` element.
  3. Both assets are enqueued from a callback attached to the front-end asset-enqueueing hook (not the admin or login screens).
  4. The enqueues require no theme artifact — they work from the plugin against whatever theme is active.

### Scenario 2 — `themes-nav-menu-location` (navigation-menu location) — judge-only

- **Sub-area:** Themes → Navigation Menus — register a navigation-menu **location** (a named slot a theme can render a menu into). **Distinct from every existing `register_*` scenario** (`cpt-register`, `taxonomy-register`, `settings-register`, `admin-menu-page`, `cron-event`) and from the sidebar scenario: a different registration function (`register_nav_menus`) in a different Themes handbook chapter.
- **Source URL(s):** https://developer.wordpress.org/reference/functions/register_nav_menus/ (catalog `source_files` only).
- **Mechanism:** single `index.php` edit — a callback on `after_setup_theme` calling `register_nav_menus( array( '<slug>' => '<Human Label>' ) )`, where the array key is the location slug and the value is a **translatable** human-readable label (wrapped in `__()`).
- **Why judge-only:** `register_nav_menus` produces **no front-end output by itself**; rendering a menu at the location requires a **theme template** calling `wp_nav_menu()` — theme-artifact-bound, which the plugin scaffold cannot ship. There is therefore no clean, theme-independent front-end assertion, so the scenario ships **no `e2e.spec.mjs`** and is graded by the judge against the produced PHP. This mirrors the existing judge-only Plugins scenarios.
- **Pinned literal:** the location slug (e.g. `primary`, or a themes-specific slug — exact value a phase-4 call; a menu-location slug). Pinned in the prompt, graded in acceptance.
- **`acceptance` (scenario-unique) — draft for phase 4:**
  1. A navigation-menu location with the pinned slug is registered.
  2. The registration runs on the theme-setup hook (so it is in place before templates render).
  3. The location's label is wrapped for translation.
  4. No theme template or menu-rendering call is required for the registration to be in effect.

### Scenario 3 — `themes-sidebar-widget-area` (sidebar / widget area) — judge-only

- **Sub-area:** Themes → Widgets — register a sidebar / widget area (a region into which widgets can be placed). **Distinct from every existing `register_*` scenario and from the nav-menu scenario:** a different registration function (`register_sidebar`) in a different Themes handbook chapter.
- **Source URL(s):** https://developer.wordpress.org/reference/functions/register_sidebar/ (catalog `source_files` only).
- **Mechanism:** single `index.php` edit — a callback on `widgets_init` calling `register_sidebar( array( 'name' => __('<Name>','<textdomain>'), 'id' => '<id>', 'before_widget' => ..., 'after_widget' => ..., 'before_title' => ..., 'after_title' => ... ) )` with the before/after markup wrappers and a translatable `name`.
- **Why judge-only:** `register_sidebar` produces **no front-end output** without a theme template calling `dynamic_sidebar()` — theme-bound. No clean, theme-independent front-end assertion exists, so the scenario ships **no `e2e.spec.mjs`** and is graded by the judge against the produced PHP. Mirrors the existing judge-only Plugins scenarios.
- **Pinned literals:** the sidebar `id` and `name` (exact values a phase-4 call). Pinned in the prompt, graded in acceptance.
- **`acceptance` (scenario-unique) — draft for phase 4:**
  1. A sidebar / widget area with the pinned id and human-readable name is registered.
  2. The registration runs on the widgets-initialization hook.
  3. The registration supplies before/after wrappers for each widget and its title.
  4. The widget area's name is wrapped for translation.

### Summary

| # | Scenario (= dir = `name`) | Sub-area | Hook | Kind | Pinned literals |
|---|---|---|---|---|---|
| 1 | `themes-enqueue-assets` | Front-end asset enqueue | `wp_enqueue_scripts` | e2e (front-end DOM) | handle `themes-frontend-assets` (→ ids `themes-frontend-assets-css` / `-js`) |
| 2 | `themes-nav-menu-location` | Navigation-menu location | `after_setup_theme` | judge-only | location slug |
| 3 | `themes-sidebar-widget-area` | Sidebar / widget area | `widgets_init` | judge-only | sidebar `id` + `name` |

All three declare `rubrics: []`. Each is one `index.php` edit on a single global hook. Only scenario 1 ships an `e2e.spec.mjs` (filter-body-class lifecycle); scenarios 2 and 3 are `scenario.yaml`-only.

## Components

### New components (this review)

- `eval/scenarios/themes-enqueue-assets/` — `scenario.yaml` + `e2e.spec.mjs` (e2e).
- `eval/scenarios/themes-nav-menu-location/` — `scenario.yaml` only (judge-only).
- `eval/scenarios/themes-sidebar-widget-area/` — `scenario.yaml` only (judge-only).
- `eval/scenarios/_wp-dev-candidates.yaml` — Themes section updated in place (1 stub renamed+promoted to full, 2 new full records under an `# Implemented Themes scenarios — full records` sub-header, 1 stub annotated `# Deferred:`, 1 header-line fix).

All three directory names match `/^[a-z0-9-]+$/`, equal their `scenario.yaml` `name` and their catalog record `name`, are flat immediate children of `eval/scenarios/`, and carry the `themes-` prefix. None collides with an existing scenario directory (no existing dir carries a `themes-` prefix).

### Untouched-but-relevant components (consumed, not modified)

- `eval/utils/scaffold-plugin.ts` — scaffolds the per-(scenario, agent) plugin. Fixed facts the scenarios depend on: slug `plugin-<scenario.name>-<agentId>`; `index.php` hosts the PHP (the registration goes on `wp_enqueue_scripts`, `after_setup_theme`, or `widgets_init`). Throws if `name` (or `agentId`) does not match `/^[a-z0-9-]+$/`. No block or theme artifact is needed for this batch.
- `eval/utils/verify-e2e.ts` — locates each ran scenario's spec at the flat path `eval/scenarios/<dirName>/e2e.spec.mjs` (assumes flat immediate child), boots `wp-env`, runs the specs, and maps failures back per (scenario, agent). Only `themes-enqueue-assets` plugs into this flow (the two judge-only scenarios ship no spec).
- `eval/utils/wp-cli.mjs` — exports `deactivateAllPlugins()` (a wp-cli wrapper), used by the e2e spec's `beforeAll`/`afterAll`. Imported as `../../utils/wp-cli.mjs` — a two-level depth that resolves correctly only because the scenario directory is a flat immediate child. **No new helper is added here.**
- `@wordpress/e2e-test-utils-playwright` (v1.44.0) — provides `test`, `expect`, and the `requestUtils` / `page` fixtures: `requestUtils.activatePlugin` and `page.goto` / `page.locator`. The enqueue spec uses exactly these — the same set `filter-body-class` uses; no new fixture or method is introduced (no `createPost`, no `requestUtils.rest`).
- `@automattic/skillsmith` — discovers scenarios by reading only the immediate children of `eval/scenarios/` (non-recursive); skips nested directories and leading-underscore / non-directory entries (which is why `_wp-dev-candidates.yaml` sits safely among real scenario dirs). NOT modified.
- `playwright.config.ts` — test-runner configuration (`testMatch` for `e2e.spec.mjs`, `testDir: eval/scenarios`). The two judge-only scenarios contribute no spec, so they add nothing to the test-runner collection.
- The scaffolded plugin's `index.php` — hosts the global-hook registration for all three scenarios. No block/theme artifact is touched.
- `eval/scenarios/filter-body-class/e2e.spec.mjs` — the canonical no-seeding, front-end-only lifecycle the enqueue spec follows (imports, `beforeAll`/`afterAll`, `page.goto("/")`, DOM assertion).

### Explicitly NOT modified

- Any existing scenario directory (the existing Interactivity API, v1, Plugins, Block Editor, and REST API scenarios are not moved, renamed, or reorganized).
- `eval/scenarios/_candidates.yaml` (the iAPI catalog) — byte-untouched.
- Non-Themes records in `_wp-dev-candidates.yaml` — byte-untouched.
- `eval/rubrics/` (no new shared rubric — each scenario carries `rubrics: []`).
- `eval/utils/` (no new helper).
- Anything under `skills/wordpress-development/`.

## Interfaces and Data Flow

### `scenario.yaml` schema (the existing shape)

```yaml
name: themes-enqueue-assets          # matches /^[a-z0-9-]+$/, equals the directory name; plugin-slug fragment
description: <one line>
skills:
  - wordpress-development
prompt: |
  <user-voice, outcome-phrased; pins every e2e-asserted literal (the handle) in backticks;
   does NOT name wp_enqueue_scripts / wp_enqueue_style / wp_enqueue_script / register_nav_menus /
   register_sidebar / any function, hook, API, or framework>
acceptance:
  - <scenario-unique, clean, human-readable check; NO embedded source URL>
rubrics: []                          # explicit empty array — REQUIRED for discovery
```

**The `rubrics` key must be present as an explicit empty array (`rubrics: []`).** Skillsmith's discovery shape-check requires `rubrics` to be an array; an omitted key (`undefined`) or a valueless `rubrics:` (parsed as `null`) silently fails discovery and the scenario is never graded. The same check requires `name`, `description`, `skills`, `prompt`, and `acceptance` to be present and well-typed. **Catalog-only fields (`difficulty`, `concepts`, `source`, `source_files`) and source URLs never appear in a `scenario.yaml`** — provenance lives only in the catalog record.

`name` is the plugin-slug fragment; the scaffolded plugin slug is `plugin-<name>-<agentId>`, and (for the e2e scenario) the spec must activate that exact slug. For all three scenarios `name` equals the directory name. The two judge-only `scenario.yaml` files are identical in shape to the e2e one (same keys), just without an accompanying `e2e.spec.mjs` — mirroring the existing judge-only Plugins scenarios.

**Handle-pinning convention (how a tool-agnostic prompt names a specific asserted literal).** The enqueue prompt hard-pins the handle literal in backticks inside a user-voice sentence (e.g. "Load a stylesheet and a script on the site's front end under the shared handle `themes-frontend-assets`"), and the e2e asserts the exact ids WordPress derives from it (`#themes-frontend-assets-css` / `#themes-frontend-assets-js`). The prompt names the **handle** and the **outcome** (a stylesheet and a script loaded on the front end), never the function `wp_enqueue_style` / `wp_enqueue_script` or the hook `wp_enqueue_scripts`. The prompt must also make clear the assets are **loaded** (a real file/source), so the agent does not merely register a handle.

### `e2e.spec.mjs` interface (the filter-body-class lifecycle, verbatim — `themes-enqueue-assets` only)

```js
import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../utils/wp-cli.mjs";

test.describe("themes-enqueue-assets scenario", () => {
  test.beforeAll(async ({ requestUtils }, workerInfo) => {
    deactivateAllPlugins();
    await requestUtils.activatePlugin(
      `plugin-themes-enqueue-assets-${workerInfo.project.metadata.agentId}`,
    );
  });
  test.afterAll(() => {
    deactivateAllPlugins();
  });
  test("enqueued stylesheet and script are present on the front end", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("link#themes-frontend-assets-css")).toBeAttached();
    await expect(page.locator("script#themes-frontend-assets-js")).toBeAttached();
  });
});
```

- `page` and `requestUtils` are injected fixtures (destructured from the test args); there is no local import for them. `agentId` is read from `workerInfo.project.metadata.agentId` (the second arg of the `beforeAll` callback).
- The `../../utils/wp-cli.mjs` import (two-level depth) resolves correctly precisely because the scenario directory is a flat immediate child of `eval/scenarios/`.
- The assertion is a DOM **presence** check (`toBeAttached()`) on the WordPress-emitted `<link>` and `<script>` elements. This is a **new assertion shape** for this suite (filter-body-class asserts `toHaveClass` on `body`), but it reuses the same lifecycle, fixtures, imports, and `page.goto("/")` flow — low risk.

### Catalog record shape (Themes area, in `_wp-dev-candidates.yaml`)

Full records (all three implemented scenarios, including the two judge-only ones — judge-only scenarios still get full records, exactly as `cron-event` / `admin-menu-page` do):

```yaml
- name: themes-enqueue-assets               # == directory name == scenario.yaml name
  description: <one line>
  difficulty: simple
  concepts: [wp_enqueue_scripts, wp_enqueue_style, wp_enqueue_script]
  source: dev.wordpress.org
  source_files:
    - https://developer.wordpress.org/themes/core-concepts/including-assets/
    - https://developer.wordpress.org/themes/classic-themes/
  prompt: |
    <exact same text as the shipped scenario.yaml prompt>
  acceptance:
    - <exact same items as the shipped scenario.yaml acceptance>
```

The `themes-nav-menu-location` and `themes-sidebar-widget-area` records take the same full shape, citing the `register_nav_menus` and `register_sidebar` reference pages respectively in `source_files`. The `theme-json-custom-color-palette` deferral stub keeps its lighter shape (no `prompt`/`acceptance`) plus an ADDED `# Deferred: <reason>` comment.

### Data flow

`scenario.yaml` (discovery + judge input) → scaffold writes plugin `plugin-<name>-<agentId>` → testing agent edits `index.php` (a registration on `wp_enqueue_scripts` / `after_setup_theme` / `widgets_init`) → judge grades code against `acceptance` → for `themes-enqueue-assets` only: `verify-e2e.ts` boots `wp-env` → `e2e.spec.mjs` activates the plugin, navigates to `/`, and asserts the emitted `<link id="...-css">` and `<script id="...-js">` are attached → the test-runner JSON report → harness maps failures back per (scenario, agent). The two judge-only scenarios stop at the judge step (no e2e). The catalog file feeds nothing in this flow; it is a committed planning artifact read by humans and future reviews.

## Catalog promotion + reconciliation

The Themes section of `eval/scenarios/_wp-dev-candidates.yaml`, under `# === Area: Themes ===` (header at line 156; `theme-json-custom-color-palette` stub at line 158; `classic-theme-enqueue-scripts` stub at line 167; the header comment line at 28-29), is updated as follows. The iAPI `_candidates.yaml` and every non-Themes record are NOT modified.

### Actions

1. **Rename + promote `classic-theme-enqueue-scripts` to a full record named `themes-enqueue-assets`.** Rename the record's `name` to `themes-enqueue-assets`; add `prompt` and `acceptance` matching the shipped `scenario.yaml` **verbatim** (same text, same order, same quoting); keep/extend `description`, `difficulty: simple`, `concepts`, `source: dev.wordpress.org`, and `source_files` (the including-assets handbook as primary, classic-themes as secondary). This is a **record** rename, not a scenario rename (no shipped scenario directory exists for the legacy name yet), satisfying the "no existing scenario is renamed" rule.
2. **Add two brand-new full records** — `themes-nav-menu-location` and `themes-sidebar-widget-area` — under a new `# Implemented Themes scenarios — full records` sub-header (mirroring the Block Editor / REST API pattern). Each carries `prompt`/`acceptance` verbatim from its shipped `scenario.yaml` (judge-only scenarios get full records too), plus `description`/`difficulty`/`concepts`/`source`/`source_files` (the `register_nav_menus` and `register_sidebar` reference pages respectively).
3. **Annotate `theme-json-custom-color-palette` as a deferred stub.** ADD a `# Deferred: <reason>` comment (it currently has no comment) recording that `theme.json` is a theme-root artifact the plugin scaffold cannot ship — theme-artifact-bound, not feasible without a theme-scaffold harness change. Keep it a lighter stub (no `prompt`/`acceptance`).
4. **Create NO new stub** for any uncovered Themes sub-area that lacks one today (block templates, template parts, template hierarchy, classic template files, custom-header/background, `style.css`). Their exclusion is recorded **only** in the spec's Out of Scope section. The defer-with-comment rule applies solely to `theme-json-custom-color-palette`, which already has a stub.
5. **Fix the stale header line (28-29).** "…the implemented Plugins, Block Editor, and REST API scenarios…" → add Themes ("…Plugins, Block Editor, REST API, and Themes scenarios…"). This is the only header change.

### Catalog state after the update

| Record `name` | Kind after update | Provenance (`source_files`) |
|---|---|---|
| `themes-enqueue-assets` | full (renamed from `classic-theme-enqueue-scripts` + promoted) | including-assets handbook (primary) + classic-themes (secondary) |
| `themes-nav-menu-location` | full (new) | `register_nav_menus` reference |
| `themes-sidebar-widget-area` | full (new) | `register_sidebar` reference |
| `theme-json-custom-color-palette` | lighter stub (`# Deferred: …` added) | unchanged stub provenance |

After the update, every implemented Themes sub-area is represented by exactly one full record under its final scenario name; no orphaned stub duplicates an implemented sub-area; no name mismatch exists between any record and its scenario directory. This mirrors the review-2/3 reconciliation precedent (full records 1:1 with implemented scenarios, lighter stubs with recorded reasons for deferrals).

## Key Decisions

### Decision: Split the batch by harness feasibility — one e2e (enqueue) + two judge-only (nav-menu, sidebar); defer theme-artifact-bound sub-areas

- **Choice:** Implement three Themes scenarios: `themes-enqueue-assets` (e2e, front-end DOM assertion), `themes-nav-menu-location` (judge-only), and `themes-sidebar-widget-area` (judge-only). Defer every theme-artifact-bound sub-area (`theme.json` file, block templates, template parts, template hierarchy, classic template files, custom-header/background, `style.css`).
- **Alternatives:** A larger e2e-only batch (no plugin-expressible Themes sub-area beyond enqueue yields a clean, theme-independent front-end assertion — nav-menu and sidebar need theme templates calling `wp_nav_menu()` / `dynamic_sidebar()`, which the plugin scaffold cannot ship); force nav-menu/sidebar into e2e (would require shipping a theme artifact — infeasible); skip the judge-only scenarios entirely (would under-cover the Themes area's plugin-expressible registration sub-areas).
- **Trade-offs:** The scaffold builds a plugin, not a theme, so only plugin-expressible sub-areas are candidates, and only one (enqueue) is cleanly front-end-assertable. Splitting into one e2e + two judge-only covers the three feasible registration sub-areas at the right verification fidelity for each, while a smaller batch than prior reviews is explicitly permitted by the intent because much of Themes is theme-artifact-bound. The judge-only pattern is already established (`cron-event`, `admin-menu-page`, `i18n-textdomain`).
- **Traces to:** Requirements 1, 2, 3, 4, 19; Acceptance Criteria 1, 2, 3, 4, 19.

### Decision: Enqueue scenario asserts WordPress-emitted `<link id="{handle}-css">` and `<script id="{handle}-js">` via a single shared handle

- **Choice:** One callback on `wp_enqueue_scripts` enqueues a stylesheet and a script under a single shared handle `themes-frontend-assets`; the e2e asserts `page.locator("link#themes-frontend-assets-css")` and `page.locator("script#themes-frontend-assets-js")` are attached after `page.goto("/")`.
- **Alternatives:** Two separate handles (one for the style, one for the script) — verified unnecessary because `WP_Styles` and `WP_Scripts` are separate registries (no collision on the shared handle), and a single handle keeps the prompt to one pinned literal; assert on the asset `href`/`src` URL — fragile and theme/path-dependent (the id is derived only from the handle, so it is theme-independent); assert visible rendering — a `<link>`/`<script>` has no visible render, so `toBeAttached()` (DOM presence) is the correct check.
- **Trade-offs:** The id attribute is produced by WP core and depends only on the pinned handle, making the assertion theme-independent (it does not depend on which theme `wp-env` activates) — the core feasibility property. A single handle minimizes pinned literals while still exercising both a stylesheet and a script. The new presence-assertion shape is low-risk: same lifecycle, fixtures, and `page.goto("/")` flow as `filter-body-class`.
- **Traces to:** Requirements 3 (i), 4, 6, 8; Acceptance Criteria 3, 4, 6, 8.

### Decision: Bake the non-empty `$src` requirement into the enqueue prompt and acceptance

- **Choice:** The prompt asks the agent to **load an actual stylesheet file and an actual script file** on the front end (implying a real, non-empty source); the acceptance requires both assets to be **enqueued with a source** (not merely registered, not an empty alias), so WordPress actually emits the `<link>` / `<script>` tags.
- **Alternatives:** Leave the prompt at "register a handle" (verified to emit **no** tag — `WP_Styles::do_item()` / `WP_Scripts::do_item()` early-return on `! $src`, and a `wp_register_*` without `wp_enqueue_*` emits nothing — so the id assertion would fail for a well-formed-but-register-only implementation); require the asset URL to resolve to HTTP 200 (unnecessary — core does no existence check; any non-empty source emits the tag).
- **Trade-offs:** Without this, a reasonable agent could register-only and the tag would never render, making the e2e a false negative on otherwise-correct intent. Pinning "load an actual file" + "enqueue with a source" steers the agent to a renderable tag while the e2e only checks the id is present (not that the asset loads). A failing grade against the current skill is still acceptable per the spec, but a well-formed agent following the prompt produces renderable tags.
- **Traces to:** Requirements 3 (i), 6, 8; Acceptance Criteria 3, 6, 8.

### Decision: Nav-menu and sidebar scenarios are judge-only, graded against the produced PHP

- **Choice:** `themes-nav-menu-location` (`register_nav_menus` on `after_setup_theme`) and `themes-sidebar-widget-area` (`register_sidebar` on `widgets_init`) ship **no `e2e.spec.mjs`**; each is a `scenario.yaml`-only directory graded by the judge against the produced PHP.
- **Alternatives:** Front-end-assert each (impossible without a theme template calling `wp_nav_menu()` / `dynamic_sidebar()` — theme-artifact-bound, which the plugin scaffold cannot ship); exclude them (would under-cover two feasible plugin-expressible Themes registration sub-areas).
- **Trade-offs:** Both registrations are plugin-expressible (single `index.php` edit on a global hook) but produce no theme-independent front-end output on their own, so judge-only is the correct fidelity. This mirrors the established judge-only Plugins precedent and keeps each scenario one concept / one plugin edit. The acceptance grades the registration hook, the pinned slug/id-and-name, the translatable label/name, and the before/after wrappers (sidebar) — all readable from the PHP.
- **Traces to:** Requirements 3 (ii, iii), 4, 7; Acceptance Criteria 3, 4, 7.

### Decision: Each new scenario is distinct from every covered sub-area at the sub-area level

- **Choice:** Treat distinctness as "distinct handbook chapter + distinct registration function," the same test review-1 used. The enqueue scenario is distinct from the iAPI block `view.js` loading (a `block.json` build mechanism, not a `wp_enqueue_scripts` front-end enqueue). `register_nav_menus` (Themes Navigation Menus chapter) and `register_sidebar` (Themes Widgets chapter) are each distinct from `cpt-register`, `taxonomy-register`, `settings-register`, `admin-menu-page`, `cron-event`, and from each other.
- **Alternatives:** Judge distinctness by surface shape ("register a thing on a hook") — rejected: that was never the bar (it is how `taxonomy-register` cleared against `cpt-register`); a `wp_head`/`wp_footer` direct-output marker — excluded as borderline-duplicative of the v1 `body_class` Hooks concept (`filter-body-class`).
- **Trade-offs:** The chapter+function test cleanly separates all three new scenarios from each other and from every covered sub-area, while the borderline marker scenario is excluded to avoid rhyming with `filter-body-class`. This keeps the batch non-duplicative without inventing artificial differences.
- **Traces to:** Requirement 5; Acceptance Criterion 5.

### Decision: Pin every e2e-asserted literal in the prompt; keep prompts tool-agnostic; provenance only in the catalog

- **Choice:** The enqueue scenario's only asserted literal — the handle `themes-frontend-assets` (which drives both ids) — is stated in its `prompt`. The two judge-only scenarios pin their slug / id+name in their prompts too. Prompts are user-voice, outcome-phrased, and never name the tool/API/function/hook/framework. `acceptance` strings are clean checks with no embedded URLs. Source URLs live only in the catalog record's `source_files`.
- **Alternatives:** Embed source URLs in the `scenario.yaml`; name the API/function/hook in the prompt; let the agent choose the asserted handle.
- **Trade-offs:** The spec bars catalog-only fields and URLs from `scenario.yaml` and requires tool-agnostic prompts; pinning the asserted handle keeps the e2e deterministic without naming the mechanism, and keeping prompt and assertion in lockstep means any phase-4 rewording must change both together. Phase 4 may choose a different clean-kebab handle but must pin it in the prompt and match it verbatim in the e2e.
- **Traces to:** Requirements 8, 9, 12; Acceptance Criteria 8, 9, 12.

### Decision: Add zero new shared rubrics; every scenario declares `rubrics: []`

- **Choice:** Add no files under `eval/rubrics/`; each scenario carries its checks in `acceptance` and declares the explicit empty array `rubrics: []`.
- **Alternatives:** A shared "registers on a global hook" rubric across the batch.
- **Trade-offs:** No single check recurs uniformly across all three in a form general enough to share without duplicating per-scenario acceptance points (which the spec forbids): the registered surface differs per scenario (an enqueued asset pair vs a menu location vs a widget area), and the hook differs (`wp_enqueue_scripts` vs `after_setup_theme` vs `widgets_init`). The spec permits zero rubrics when no genuinely cross-cutting check emerges; this mirrors the prior reviews' outcome. The `rubrics:` key is always present as an array (required for discovery).
- **Traces to:** Requirement 10; Acceptance Criterion 10.

### Decision: Apply `themes-*` pseudo-folder naming; rename the stub record; do not re-litigate the folders question or rename existing scenarios

- **Choice:** All three new scenarios use the `themes-<concept>` prefix as flat immediate children (directory name == `scenario.yaml` `name` == catalog record `name`). The enqueue scenario does NOT keep the legacy stub name `classic-theme-enqueue-scripts`; its catalog record is renamed to `themes-enqueue-assets`. Existing scenarios are not renamed.
- **Alternatives:** Real subdirectories (`eval/scenarios/themes/<name>/`) — review-2 classified these as not low-risk (require an uncommittable change to Skillsmith's non-recursive discovery, plus fixing the `../../utils` import depth and `verify-e2e.ts` attribution); keep the legacy `classic-theme-enqueue-scripts` name — would leave one of the three identities without the prefix and is a stale legacy name.
- **Trade-offs:** The prefix delivers visual grouping at zero harness risk, every scenario remaining a flat immediate child whose name matches `/^[a-z0-9-]+$/`. Renaming the stub **record** (not a scenario — no shipped directory exists for it yet) brings all three identities under the `themes-` prefix. The forward inconsistency (prefixed Themes scenarios beside non-prefixed older scenarios) is accepted and out of scope.
- **Traces to:** Requirements 9, 11, 18; Acceptance Criteria 9, 11, 18.

### Decision: Rename+promote one stub, add two full records, annotate one stub as deferred; confine all edits to the Themes section

- **Choice:** Rename+promote `classic-theme-enqueue-scripts` → full `themes-enqueue-assets`; add `themes-nav-menu-location` and `themes-sidebar-widget-area` full records under an `# Implemented Themes scenarios — full records` sub-header; ADD a `# Deferred: <reason>` comment to the `theme-json-custom-color-palette` stub; create no new stub for any other uncovered Themes sub-area; fix the one stale header line. `_candidates.yaml` and non-Themes records are byte-untouched.
- **Alternatives:** Promote-and-rename `theme-json-custom-color-palette` into an implemented scenario (it covers a deferred, theme-artifact-bound sub-area — would create a name mismatch or false duplication); add new stubs for the other uncovered Themes sub-areas (the spec records those exclusions only in the spec, not as catalog entries); edit other catalog areas (out of scope).
- **Trade-offs:** Mirrors the review-2/3 reconciliation precedent: full records 1:1 with implemented scenarios, lighter stubs with recorded reasons for deferrals. After the update each implemented Themes sub-area maps to exactly one full record under its final scenario name; no orphaned stub duplicates an implemented sub-area; no name mismatch. Confining edits to the Themes section keeps the iAPI catalog and all other areas intact — a correctness invariant phase 4/5 must diff-check.
- **Traces to:** Requirements 12, 13, 14, 15; Acceptance Criteria 12, 13, 14, 15.

### Decision: Static / structural verification only; scenarios not required to pass; skill untouched

- **Choice:** Verify the three scenarios are Skillsmith-discoverable (scenario-shape check) and that `themes-enqueue-assets/e2e.spec.mjs` is test-runner-collectable (parses + imports resolve) such that running Skillsmith on the scenario directory would execute to a graded result without harness/configuration errors. Do not boot `wp-env` for a real pass, run the full `scenarios × testing-agents` matrix, or generate plugin code. Modify nothing under `skills/wordpress-development/`.
- **Alternatives:** Run the scenarios against the current skill and require passing grades.
- **Trade-offs:** The scenarios lead and the skill catches up later; a failing grade against the current skill is acceptable per the spec. The bar is well-formedness / runnability, matching prior reviews.
- **Traces to:** Requirements 16, 17, 18; Acceptance Criteria 16, 17, 18.

### Decision: Surface a theme-scaffold harness change as a future out-of-scope recommendation (not implemented)

- **Choice:** Record — not implement — a future recommendation that the Skillsmith harness gain the ability to scaffold a **theme** (not only `plugin-<scenario>-<agentId>`). This would unblock the theme-artifact-bound Themes sub-areas (`theme.json` as a file, block templates, template parts, template hierarchy, classic template files, custom-header/background, `style.css`) that are deferred this review.
- **Alternatives:** Implement the harness change now (out of scope — large, and the intent defers it); say nothing (loses the recorded path to unblock the deferred sub-areas).
- **Trade-offs:** Surfacing the recommendation records why the deferred sub-areas are deferred and what would unblock them, without expanding this review's footprint. The capability is the single lever that would convert the theme-artifact-bound deferrals into implementable scenarios in a later review.
- **Traces to:** Requirement 19 (and Out of Scope item 8); Acceptance Criterion 19.

## Dependencies

All dependencies already exist in the repo; this review introduces **no new** dependency and adds **no new** `eval/utils/` helper.

- **Internal:** `eval/utils/scaffold-plugin.ts`, `eval/utils/verify-e2e.ts`, `eval/utils/wp-cli.mjs` (`deactivateAllPlugins`), `playwright.config.ts`, the `eval/scenarios/filter-body-class/` reference pattern (the no-seeding front-end e2e lifecycle), the existing judge-only Plugins scenarios (`cron-event`, `admin-menu-page`, `i18n-textdomain`) as the judge-only precedent, and the existing `eval/scenarios/_wp-dev-candidates.yaml` (catalog precedent shape; Themes section edited, rest untouched).
- **External (already present):** `@automattic/skillsmith` (discovery, scaffold orchestration, judge); `@wordpress/e2e-test-utils-playwright` v1.44.0 (`test`, `expect`, `requestUtils.activatePlugin`, `page.goto` / `page.locator` — exactly the set `filter-body-class` uses; no `createPost` / `rest` here); `@wordpress/scripts`; `@wordpress/env` (`wp-env` runtime); the test runner (Playwright).
- **Runtime version note (not a new dependency):** the scaffolded plugin hosts PHP-only registrations in `index.php` (`wp_enqueue_scripts` + `wp_enqueue_style`/`wp_enqueue_script`; `register_nav_menus` on `after_setup_theme`; `register_sidebar` on `widgets_init`); all are long-standing core APIs. `wp-env` fetches a recent WordPress at env-start, so every API used is present. No theme/block artifact is needed. `wp_enqueue_scripts` is fired by `wp_head()` for every standard theme (block and classic), which is what makes the enqueue assertion theme-independent.
- **Documentation (selection/acceptance grounding, not a runtime dependency):** the developer.wordpress.org pages cited per scenario and in the catalog `source_files` (including-assets handbook + classic-themes; `register_nav_menus` reference; `register_sidebar` reference). All three were verified HTTP 200 during research.

## Failure Modes and Observability

- **Scenario not discovered:** a directory not placed as a flat immediate child of `eval/scenarios/`, or missing `scenario.yaml`, is silently skipped by Skillsmith's non-recursive discovery. Mitigation: all three use the flat `themes-*` layout, each with a `scenario.yaml`.
- **Malformed `scenario.yaml`:** Skillsmith's shape check requires `rubrics` present as an array; an omitted key (`undefined`) or a valueless `rubrics:` (`null`) silently fails discovery and the scenario is never graded. Mitigation: every scenario declares `rubrics: []` explicitly; `name`/`description`/`skills`/`prompt`/`acceptance` are all present and well-typed.
- **Invalid `name`:** `scaffold-plugin.ts` throws if `name` (or `agentId`) does not match `/^[a-z0-9-]+$/`. All three `themes-*` names conform (hyphens only, no underscores).
- **Wrong plugin slug in the e2e:** the enqueue spec must activate `plugin-themes-enqueue-assets-${workerInfo.project.metadata.agentId}`; activating any other slug errors. Mitigation: the spec derives the slug from `name` (== directory name) exactly as `filter-body-class` does.
- **Spec import depth:** `../../utils/wp-cli.mjs` resolves only because the scenario directory is a flat immediate child — the reason the flat `themes-*` layout is required (nesting would resolve `../../utils` to a nonexistent path and break collection).
- **`$src` gotcha (the primary enqueue failure mode):** an empty/falsy `$src`, or a `wp_register_*` without a following `wp_enqueue_*`, prints no `<link>`/`<script>` tag, so the id assertion would fail even for an otherwise-correct intent. Mitigation baked into the design: the prompt asks the agent to load an actual stylesheet file and script file, and the acceptance requires the assets to be **enqueued with a source** (not merely registered). The asset URL need not resolve to HTTP 200 — core does no existence check — so the e2e checks only id presence.
- **New e2e assertion shape (low):** the enqueue spec uses `page.locator("link#...-css")` / `page.locator("script#...-js")` with `toBeAttached()` — a new shape for this suite (filter-body-class uses `toHaveClass` on `body`), but the same lifecycle, fixtures, imports, and `page.goto("/")` flow. `toBeAttached()` is the right presence check (a `<link>`/`<script>` has no visible render).
- **Judge-only grading depends on the produced PHP, not a render (intentional):** the nav-menu and sidebar scenarios cannot be front-end-asserted (need theme templates calling `wp_nav_menu()` / `dynamic_sidebar()`), so they are judge-only by design — mirrors the existing judge-only Plugins scenarios. Not a defect.
- **Expected non-failure:** per the spec, a *failing grade against the current skill* is acceptable and is not a harness error. The bar (Acceptance Criterion 16) is that each scenario runs to a graded result and the enqueue e2e parses, resolves imports, and executes without harness/configuration errors.
- **Catalog edits confined to the Themes section (correctness invariant):** only Themes records and the one header line may change; the iAPI `_candidates.yaml` and all non-Themes records in `_wp-dev-candidates.yaml` must be byte-untouched. Phase 4/5 must diff-check this.
- **Observability:** e2e failures surface through the test runner's JSON report, which `verify-e2e.ts` parses into per-(scenario, agent) failure records; judge results (including the two judge-only scenarios) surface through Skillsmith's grading output; `wp-env` start/stop and build steps log to stdout/stderr.

## Risks and Open Questions

These are phase-4 confirmations (latitude, not blockers) and recorded risks; all design-blocking questions are resolved.

- **`$src` must be non-empty or the enqueue e2e fails (RESOLVED into the design).** An empty `$src` (or register-only without enqueue) emits no `<link>`/`<script>`, so the id assertion would fail. Mitigation baked in: the prompt asks the agent to LOAD an actual stylesheet file and script file, and the acceptance requires the assets to be ENQUEUED with a source. Flagged for phase 4 so the prompt does not accidentally read as "register a handle."
- **Plugin-expressed enqueue is theme-independent (RESOLVED).** `wp_enqueue_scripts` fires from `wp_head()` for every standard theme regardless of registrant; the emitted id depends only on the pinned handle (verified first-hand from WP core source). The key feasibility claim holds.
- **Exact pinned handle for the e2e (phase-4 latitude, NOT blocking).** Recommended `themes-frontend-assets`; phase 4 may choose any clean lowercase-kebab handle, but it MUST be pinned in the prompt and matched verbatim in the e2e (`#{handle}-css` / `#{handle}-js`). Prompt ↔ assertion lockstep (Requirement 8).
- **Exact pinned slug / name values for the two judge-only scenarios (phase-4 latitude, NOT blocking).** The nav-menu location slug and the sidebar `id`/`name`. Phase 4 picks readable values; they are pinned in the prompt and graded in acceptance. Not load-bearing for the design.
- **Exact wording of prompts / acceptance (phase-4 task).** Phase 4 writes the final user-voice, tool-agnostic text (no function/hook names, no URLs in `scenario.yaml`). The design fixes the mechanism, the hooks, and the pinned literals; the prose is a phase-4 task. The acceptance drafts above are guidance, not final copy.
- **New e2e assertion shape (LOW).** The enqueue spec uses a `page.locator(...).toBeAttached()` presence assertion — a new shape for this suite — but the same lifecycle, fixtures, imports, and `page.goto("/")` flow as `filter-body-class`. Low risk.
- **Judge-only grading depends on the produced PHP, not a render (intentional).** The nav-menu and sidebar scenarios are judge-only by design; mirrors existing judge-only Plugins scenarios. Not a defect.
- **Theme-artifact-bound sub-areas recorded as deferred (per spec).** `theme.json`, block templates, template parts, template hierarchy, classic template files, custom-header/background, `style.css` are not implemented. Only `theme-json-custom-color-palette` gets a `# Deferred:` comment (it already has a stub); the others have no catalog entry. The theme-scaffold harness change that would unblock them is surfaced as a future out-of-scope recommendation, not implemented.
- **Catalog edits confined to the Themes section (correctness, must-hold).** Only Themes records + the one header line may change; the iAPI `_candidates.yaml` and all non-Themes records in `_wp-dev-candidates.yaml` must be byte-untouched (Requirement 15 / Acceptance Criterion 15). Phase 4/5 must diff-check this.
- **Naming forward inconsistency (recorded, out of scope).** The new `themes-*` scenarios sit beside non-prefixed older scenarios and the already-prefixed `block-editor-*` / `rest-api-*` sets. A suite-wide rename is out of scope; existing scenarios are NOT renamed.
- **Static / structural verification only (intentional).** No agent boots `wp-env` for a real pass, runs the full `scenarios × testing-agents` matrix, or generates plugin code; the skill is untouched. The bar is discoverable + e2e-collectable.
