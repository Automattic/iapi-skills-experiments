# Design Doc: Exhaustive WordPress-development scenario taxonomy + first-area scenarios

_Taxonomy snapshot date: 2026-06-18 (point-in-time; see "Reference taxonomy")._

## Overview

The `wordpress-development` skill is evaluated by a Skillsmith-based suite under `eval/`. Today that suite holds the Interactivity-API scenarios plus four v1 scenarios (`filter-body-class`, `shortcode-with-attr`, `cpt-register`, `rest-custom-endpoint`) — a small slice of the WordPress-development domain documented at developer.wordpress.org. There is no organizing map of what the full domain contains, so coverage cannot be planned or measured and follow-up work has nothing to draw from.

This review establishes that organizing backbone and begins filling it in, batched by area. It produces three deliverables, all without touching the skill itself:

1. **An exhaustive reference taxonomy** — a dated, source-URL-bearing point-in-time snapshot mapping every one of the 10 top-level developer.wordpress.org areas (7 Documentation handbooks + 3 API Reference areas) to its major sub-areas. This document is the taxonomy artifact; it is reproduced in full below ("Reference taxonomy") so the deliverable is self-contained.
2. **A committed candidate catalog** at `eval/scenarios/_wp-dev-candidates.yaml`, mirroring the shape of the existing `eval/scenarios/_candidates.yaml`, covering the taxonomy broadly (every area represented), with full `prompt` + `acceptance` only for the six first-area scenarios and lighter stubs elsewhere.
3. **Six implemented scenarios for one foundational area — Plugins** — `taxonomy-register`, `post-meta-rest`, `settings-register` (each shipping an `e2e.spec.mjs`), and `cron-event`, `i18n-textdomain`, `admin-menu-page` (judge-only), one per major Plugins sub-area not already covered by v1.

The taxonomy and catalog are broad (all areas); only Plugins is implemented now. The remaining ~9 areas are explicit follow-up reviews recorded as catalog stubs. The skill is unchanged: these are planning artifacts and the scenarios lead, with the skill catching up later. Verification is static/structural only — scenarios must be Skillsmith-discoverable and their e2e specs Playwright-loadable; they are not required to pass against the current skill, and no agent boots `wp-env` or runs the full matrix.

These deliverables slot into the existing `eval/` suite without disruption: each scenario is a flat immediate child of `eval/scenarios/` following the exact `counter`/v1 conventions (a `scenario.yaml`, and where applicable an `e2e.spec.mjs`), and the catalog is a leading-underscore non-directory file that Skillsmith's flat discovery skips — the same mechanism that lets `_candidates.yaml` coexist with real scenarios today.

## Approach

The end-to-end mental model for how the spec is realized:

**Taxonomy (planning artifact).** The reference taxonomy is delivered as the prose document below. Its area layer (the 10 top-level areas) is treated as the stable contract; its sub-area leaf layer is the drift-refreshable layer. Every area and major sub-area carries a developer.wordpress.org URL, and the document is stamped with a snapshot date so future reviews can detect and refresh drift. It is not executable and feeds nothing in the harness — it exists to be read, audited, and extended.

**Catalog (planning artifact, committed repo file).** `eval/scenarios/_wp-dev-candidates.yaml` is a single committed YAML file mirroring `_candidates.yaml`'s record shape, grouped by taxonomy area via `# === Area: <name> ===` comment headers. Its header records the snapshot date and the area→URL map. Each entry carries provenance (`source` + `source_files`) pointing at developer.wordpress.org URLs. The six first-area scenarios get fully-authored `prompt` + `acceptance`; every other area and the un-implemented Plugins sub-areas get lighter stubs. Because it is a non-directory file with a leading underscore, Skillsmith's discovery skips it (see Interfaces and Data Flow); it carries documentation traceability for the implemented scenarios so that traceability lives in the catalog, never in any `scenario.yaml`.

**Scenarios (the implemented work).** Each of the six Plugins scenarios is a self-contained directory `eval/scenarios/<name>/` containing a `scenario.yaml` (and, for the three e2e scenarios, an `e2e.spec.mjs`), exactly mirroring `eval/scenarios/counter/` and the v1 scenarios. The runtime lifecycle is the established one:

1. **Skillsmith discovers the scenario** by reading the immediate children of `eval/scenarios/` and loading each child's `scenario.yaml`. The directory name is the scenario's discovery identity; the `name` field inside the YAML is the plugin-slug fragment used downstream. For every scenario here, `name` equals the directory name.
2. **Skillsmith scaffolds a plugin** per (scenario, testing-agent) via `eval/utils/scaffold-plugin.ts` into the agent's workspace. The scaffold is block-centric: `index.php` (plugin header + an `init` hook that registers any block found under `src/blocks`/`build/blocks`), a `package.json`, and a fixed `src/blocks/testing-block/block.json` named `wp-skill/testing-block`. The plugin slug is `plugin-<scenario.name>-<agentId>`.
3. **The testing agent implements the requested feature** by adding ordinary PHP to `index.php` (e.g. `register_taxonomy`, `register_post_meta`, `register_setting`, a cron schedule, `__()` wrapping, `add_menu_page`). This coexists harmlessly with the scaffold's block-registration `init` hook — none of the six scenarios requires building a block. (This is the inherited v1 block-scaffold caveat; see Risks and Open Questions.)
4. **An LLM judge grades the produced code** against the scenario's `acceptance` list and any referenced `rubrics`. Every scenario here declares `rubrics: []`, so only `acceptance` is used.
5. **The e2e harness (`eval/utils/verify-e2e.ts`) runs the Playwright spec** in a `wp-env` runtime for the three e2e scenarios: it builds plugins that have a `src/blocks` directory (all do, from the scaffold), boots `wp-env` with every produced plugin registered but deactivated, then runs each scenario's `e2e.spec.mjs`, which activates exactly its own plugin and asserts runtime behavior (REST status/JSON here). The three judge-only scenarios ship no spec and are graded by judge alone.

Each prompt is phrased by desired outcome in a real user's voice and never names the API/function/tool — deciding the approach is the skill's job. The `acceptance` points describe observable properties of the produced code (judge-verified); each e2e spec asserts the one runtime-visible outcome that proves the feature works, with every asserted literal pinned in the prompt.

No change is made to the scaffold, the e2e harness, the Skillsmith package, the skill, the existing scenarios, or `_candidates.yaml`.

## Reference taxonomy

This is the committed reference taxonomy — a **dated point-in-time snapshot (2026-06-18)**, not a frozen contract. The **area layer (10 top-level areas) is the stable contract**; the **sub-area leaf layer is drift-refreshable** and expected to need periodic refresh. Every area and sub-area below carries a developer.wordpress.org source URL (Acceptance Criteria 1, 2).

**Snapshot caveats (recorded for drift auditing):**
- developer.wordpress.org sidebars are JS-rendered and not present in fetched markdown; chapter lists were reconstructed from in-body links and site-scoped search, with landing pages confirmed live.
- The **Common APIs** handbook is mid-reorganization: some chapters now live at `/apis/<x>/` while a few remain at legacy `/apis/handbook/<x>/` paths. Legacy paths marked below were confirmed live (HTTP 200) as of this snapshot. The Code Reference "grouped API reference" index also uses these legacy paths, corroborating that the legacy structure persists.
- The **WordPress Playground** handbook is not authored on developer.wordpress.org: the whole `/playground/*` path space 301-redirects to the off-site docs host `https://wordpress.github.io/wordpress-playground/`, with no individually-addressable developer.wordpress.org sub-area pages. It is therefore recorded as a single collapsed row at its landing URL — see the Playground area note below for the verification.

### Documentation areas (7)

#### Area: Block Editor — https://developer.wordpress.org/block-editor/

Big, multi-level, block-/JS-centric. The Interactivity-API portion is **SATURATED** by the existing iAPI suite (11 scenarios + `_candidates.yaml`).

Top sections:

| Sub-area | URL |
|---|---|
| Getting Started | https://developer.wordpress.org/block-editor/getting-started/ |
| How-to Guides | https://developer.wordpress.org/block-editor/how-to-guides/ |
| Reference Guides | https://developer.wordpress.org/block-editor/reference-guides/ |
| Explanations | https://developer.wordpress.org/block-editor/explanations/ |
| Contributor Guide | https://developer.wordpress.org/block-editor/contributors/ |

Reference Guides fan-out (each a major sub-area):

| Sub-area | URL | Note |
|---|---|---|
| Block API | https://developer.wordpress.org/block-editor/reference-guides/block-api/ | |
| Hooks/Filters (editor) | https://developer.wordpress.org/block-editor/reference-guides/filters/ | |
| Components | https://developer.wordpress.org/block-editor/reference-guides/components/ | |
| Packages | https://developer.wordpress.org/block-editor/reference-guides/packages/ | |
| Data Module Reference | https://developer.wordpress.org/block-editor/reference-guides/data/ | |
| SlotFills | https://developer.wordpress.org/block-editor/reference-guides/slotfills/ | |
| theme.json Reference | https://developer.wordpress.org/block-editor/reference-guides/theme-json-reference/ | |
| Interactivity API | https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/ | **SATURATED** — existing iAPI suite |
| RichText | https://developer.wordpress.org/block-editor/reference-guides/richtext/ | |

#### Area: Themes — https://developer.wordpress.org/themes/

6 top chapters.

| Sub-area | URL |
|---|---|
| Getting Started | https://developer.wordpress.org/themes/getting-started/ |
| Core Concepts | https://developer.wordpress.org/themes/core-concepts/ |
| Block Themes | https://developer.wordpress.org/themes/block-themes/ |
| Classic Themes | https://developer.wordpress.org/themes/classic-themes/ |
| Advanced Topics | https://developer.wordpress.org/themes/advanced-topics/ |
| Releasing Your Theme | https://developer.wordpress.org/themes/releasing-your-theme/ |

Core Concepts subpages: theme-structure, main-stylesheet, custom-functionality, templates, including-assets, global-settings-and-styles.

#### Area: Plugins — https://developer.wordpress.org/plugins/

18 canonical chapters. This is the **first implemented area** (see "First area: Plugins"). v1-touched at the sub-area level by 3 of its chapters (Hooks, Shortcodes, Custom Post Types).

| Sub-area | URL | v1? |
|---|---|---|
| Introduction to Plugin Development | https://developer.wordpress.org/plugins/intro/ | |
| Plugin Basics | https://developer.wordpress.org/plugins/plugin-basics/ | |
| Plugin Security | https://developer.wordpress.org/plugins/security/ | |
| Hooks | https://developer.wordpress.org/plugins/hooks/ | **v1: filter-body-class** |
| Privacy | https://developer.wordpress.org/plugins/privacy/ | |
| Administration Menus | https://developer.wordpress.org/plugins/administration-menus/ | **NEW: admin-menu-page** |
| Shortcodes | https://developer.wordpress.org/plugins/shortcodes/ | **v1: shortcode-with-attr** |
| Settings | https://developer.wordpress.org/plugins/settings/ | **NEW: settings-register** |
| Metadata | https://developer.wordpress.org/plugins/metadata/ | **NEW: post-meta-rest** |
| Custom Post Types | https://developer.wordpress.org/plugins/post-types/ | **v1: cpt-register** |
| Taxonomies | https://developer.wordpress.org/plugins/taxonomies/ | **NEW: taxonomy-register** |
| Users | https://developer.wordpress.org/plugins/users/ | |
| HTTP API | https://developer.wordpress.org/plugins/http-api/ | |
| JavaScript, jQuery or Ajax | https://developer.wordpress.org/plugins/javascript/ | |
| Cron | https://developer.wordpress.org/plugins/cron/ | **NEW: cron-event** |
| Internationalization | https://developer.wordpress.org/plugins/internationalization/ | **NEW: i18n-textdomain** |
| Plugin Directory (wordpress.org) | https://developer.wordpress.org/plugins/wordpress-org/ | |
| Developer Tools | https://developer.wordpress.org/plugins/developer-tools/ | |

#### Area: Common APIs — https://developer.wordpress.org/apis/

**REORG FLAG:** handbook mid-migration (see snapshot caveats). Overlaps Plugins heavily (Hooks, Shortcode, Metadata, Settings, Options are dual-documented).

| Sub-area | URL | v1 sub-area? |
|---|---|---|
| Abilities API (new) | https://developer.wordpress.org/apis/abilities-api/ | |
| Hooks | https://developer.wordpress.org/apis/hooks/ | **Hooks/Filters** |
| Settings | https://developer.wordpress.org/apis/settings/ | |
| Options | https://developer.wordpress.org/apis/options/ | |
| Metadata | https://developer.wordpress.org/apis/metadata/ | |
| Transients | https://developer.wordpress.org/apis/transients/ | |
| Database | https://developer.wordpress.org/apis/database/ | |
| HTTP (Making HTTP Requests) | https://developer.wordpress.org/apis/handbook/making-http-requests/ (legacy path) | |
| Filesystem | https://developer.wordpress.org/apis/filesystem/ | |
| Rewrite | https://developer.wordpress.org/apis/handbook/rewrite/ (legacy path) | |
| Shortcode | https://developer.wordpress.org/apis/shortcode/ | **Shortcodes** |
| Plugin | https://developer.wordpress.org/apis/plugin/ | |
| Theme | https://developer.wordpress.org/apis/theme/ | |
| Quicktags | https://developer.wordpress.org/apis/quicktags/ (also live at `/apis/handbook/quicktags/`) | |
| XML-RPC | https://developer.wordpress.org/apis/handbook/xml-rpc/ (legacy path) | |
| wp-config.php | https://developer.wordpress.org/apis/wp-config-php/ | |
| Security | https://developer.wordpress.org/apis/security/ | |

#### Area: Advanced Administration — https://developer.wordpress.org/advanced-administration/

Server/ops-oriented. A **weak first-area pick** per spec (niche, hard to e2e as a simple plugin edit).

| Sub-area | URL |
|---|---|
| Before You Install | https://developer.wordpress.org/advanced-administration/before-install/ |
| WordPress (config) | https://developer.wordpress.org/advanced-administration/wordpress/ |
| Security | https://developer.wordpress.org/advanced-administration/security/ |
| Performance | https://developer.wordpress.org/advanced-administration/performance/ |
| Upgrade / Migration | https://developer.wordpress.org/advanced-administration/upgrade/ |

(Additional Server / Multisite / Plugins chapters exist under this landing; the leaf set above is the confirmed-live subset and is drift-refreshable.)

#### Area: Coding Standards — https://developer.wordpress.org/coding-standards/

Small and complete (9 leaves). 100% advice/prose → **judge-only by nature**, a **weak first-area pick** (cannot exercise the mixed e2e bar).

| Sub-area | URL |
|---|---|
| WordPress Coding Standards (index) | https://developer.wordpress.org/coding-standards/wordpress-coding-standards/ |
| — Accessibility | https://developer.wordpress.org/coding-standards/wordpress-coding-standards/accessibility/ |
| — CSS | https://developer.wordpress.org/coding-standards/wordpress-coding-standards/css/ |
| — HTML | https://developer.wordpress.org/coding-standards/wordpress-coding-standards/html/ |
| — JavaScript | https://developer.wordpress.org/coding-standards/wordpress-coding-standards/javascript/ |
| — PHP | https://developer.wordpress.org/coding-standards/wordpress-coding-standards/php/ |
| Inline Documentation Standards | https://developer.wordpress.org/coding-standards/inline-documentation-standards/ |
| — JavaScript | https://developer.wordpress.org/coding-standards/inline-documentation-standards/javascript/ |
| — PHP | https://developer.wordpress.org/coding-standards/inline-documentation-standards/php/ |

#### Area: WordPress Playground — https://developer.wordpress.org/playground/wordpress-playground-resources/

Niche tooling / browser-runtime. A **weak first-area pick** (not a plugin-feature domain).

| Sub-area | URL | Note |
|---|---|---|
| WordPress Playground (Quick Start, Blueprints, Developers, API Reference) | https://developer.wordpress.org/playground/wordpress-playground-resources/ | Single collapsed entry — see note below. |

**Why this area is a single collapsed row (verified this snapshot):** Unlike every other area, the WordPress Playground handbook is not authored on developer.wordpress.org. The entire `/playground/*` path space is a **redirect shim**: the landing URL `https://developer.wordpress.org/playground/wordpress-playground-resources/` returns HTTP 301 to the off-site docs host `https://wordpress.github.io/wordpress-playground/` (the full chain resolves HTTP 200). There are **no individually-addressable developer.wordpress.org sub-area pages** — the sub-topics that the off-site docs organize into separate sub-sites (Quick Start, Blueprints (JSON), Developers (programmatic API), and the API Reference for the Query / Blueprints / JS APIs) all live only on the off-site host, not at distinct developer.wordpress.org URLs. Probing the obvious candidates confirms this: `/playground/blueprints/`, `/playground/developers/`, and `/playground/api-reference/` each 301 back to the same single off-site landing page (dropping the sub-path), while `/playground/api/` and `/playground/quick-start-guide/` 301 to unrelated developer.wordpress.org areas (Secure Custom Fields and Themes, respectively). Because the spec requires a developer.wordpress.org URL on every row (Acceptance Criterion 2) and the only addressable developer.wordpress.org Playground page is the landing URL, this area is recorded as **one collapsed sub-area row at the landing URL**, with the off-site sub-topics named in the row for completeness. This collapse is a documented drift caveat: if developer.wordpress.org later hosts the Playground sub-topics at their own URLs, a future refresh should expand this row. (As a weak first-area pick, this area is not implemented, so the collapse has no downstream scenario impact.)

### API Reference areas (3)

#### Area: Code Reference — https://developer.wordpress.org/reference/

Auto-generated symbol database (thousands of pages). Not itself a scenario-authoring source (it is reference, not how-to), but it **grounds acceptance lists** (e.g. the `register_post_type` reference page backed v1's `cpt-register`).

| Sub-area | URL |
|---|---|
| Functions | https://developer.wordpress.org/reference/functions/ |
| Hooks (Actions + Filters) | https://developer.wordpress.org/reference/hooks/ |
| Classes | https://developer.wordpress.org/reference/classes/ |
| Methods | https://developer.wordpress.org/reference/methods/ |

Curated grouped "API reference" index (legacy `/apis/handbook/` paths): Dashboard Widgets, Database, HTTP API, Filesystem, Global Variables, Metadata, Options, Plugins, Quicktags, REST API, Rewrite, Settings, Shortcode, Theme Modification, Transients, XML-RPC.

#### Area: REST API — https://developer.wordpress.org/rest-api/

The custom-endpoint sub-area is **v1-saturated**, making this a weak first-area pick.

| Sub-area | URL | v1? |
|---|---|---|
| Key Concepts | https://developer.wordpress.org/rest-api/key-concepts/ | |
| Using the REST API | https://developer.wordpress.org/rest-api/using-the-rest-api/ | |
| Extending the REST API | https://developer.wordpress.org/rest-api/extending-the-rest-api/ | **v1: rest-custom-endpoint** (adding-custom-endpoints) |
| Reference (endpoints) | https://developer.wordpress.org/rest-api/reference/ | |

#### Area: WP-CLI Commands — https://developer.wordpress.org/cli/commands/

Flat alphabetical listing of all WP-CLI commands, each its own page (`wp ability`, `admin`, `block`, `cache`, `cap`, `cli`, `comment`, `config`, `core`, `cron`, `db`, `embed`, `eval`, `export`, `i18n`, `import`, `language`, `media`, `menu`, `network`, `option`, `package`, `plugin`, `post`, `rewrite`, `role`, `scaffold`, `search-replace`, `server`, `shell`, `site`, `super-admin`, `taxonomy`, `term`, `theme`, `transient`, `user`, `widget`, …). Server/CLI tooling. A **weak first-area pick**.

### Taxonomy summary

**Documentation (7):** Block Editor, Themes, Plugins, Common APIs, Advanced Administration, Coding Standards, WordPress Playground.
**API Reference (3):** Code Reference, REST API, WP-CLI Commands.

## Components

### New components (this review)

- **`eval/scenarios/_wp-dev-candidates.yaml`** — the committed candidate catalog (non-directory, leading-underscore file). See "Candidate catalog".
- **`eval/scenarios/taxonomy-register/`** — Taxonomies scenario (`scenario.yaml` + `e2e.spec.mjs`).
- **`eval/scenarios/post-meta-rest/`** — Metadata scenario (`scenario.yaml` + `e2e.spec.mjs`).
- **`eval/scenarios/settings-register/`** — Settings scenario (`scenario.yaml` + `e2e.spec.mjs`).
- **`eval/scenarios/cron-event/`** — Cron scenario (judge-only; `scenario.yaml` only).
- **`eval/scenarios/i18n-textdomain/`** — Internationalization scenario (judge-only; `scenario.yaml` only).
- **`eval/scenarios/admin-menu-page/`** — Administration Menus scenario (judge-only; `scenario.yaml` only).

All six directory names match `/^[a-z0-9-]+$/`, are equal to each scenario's `name`, follow the existing descriptive-name convention, and were verified free of collision with existing `eval/scenarios/` entries.

### Untouched-but-relevant components (consumed, not modified)

- **`eval/utils/scaffold-plugin.ts`** — scaffolds the per-(scenario, agent) plugin. Fixed facts the scenarios depend on: slug is `plugin-<scenario.name>-<agentId>`; block name is hardcoded `wp-skill/testing-block`; the `init` hook registers blocks under `src/blocks`/`build/blocks` and returns harmlessly if none build. Agents add arbitrary PHP to `index.php`. Throws if `name` (or `agentId`) does not match `/^[a-z0-9-]+$/`.
- **`eval/utils/verify-e2e.ts`** — locates each ran scenario's spec at `eval/scenarios/<dirName>/e2e.spec.mjs`, runs `wp-scripts build` for plugins with `src/blocks` (always present), boots `wp-env` (config written to a transient `.wp-env.json` with all plugins deactivated `afterStart`), and runs the specs. New specs plug in by existing at that path. Judge-only scenarios contribute no spec — `verify-e2e.ts` simply finds none for them.
- **`eval/utils/wp-cli.mjs`** — exports `deactivateAllPlugins()` used by every existing spec's `beforeAll`; also exports `wpCli(args)` (WP-CLI shell-out), which is available but intentionally not used here. New specs reuse `deactivateAllPlugins()` identically.
- **`@wordpress/e2e-test-utils-playwright` (`requestUtils`)** — provides `activatePlugin`, `createPost`, `deleteAllPosts`, `getSiteSettings`, `rest({path,method,data})`, plus `page.request.get` (anon front-end/REST requests). These are the e2e channels the three e2e scenarios use.
- **`@automattic/skillsmith` (`enumerate.ts`)** — discovers scenarios by reading **only the immediate children** of `eval/scenarios/` (no recursion). Constrains the catalog and scenario layout (see Key Decisions). Pinned at SHA `6bd90c34d88b815fdf4fd661dc8c51288111444c` (matches the `package.json` dep pin); discovery-guard predicate verified verbatim at that SHA.
- **`playwright.config.ts`** — `testMatch: "**/e2e.spec.mjs"`, `testDir: eval/scenarios`; Playwright projects named after testing-agent ids.

### Explicitly NOT modified

- The existing Interactivity API scenario directories and the four v1 scenario directories (no reorganization).
- The existing `eval/scenarios/_candidates.yaml` (the iAPI catalog — untouched, distinct from the new catalog).
- `eval/rubrics/` (no new rubric added).
- Anything under `skills/wordpress-development/`.

## Interfaces and Data Flow

### Candidate catalog: `eval/scenarios/_wp-dev-candidates.yaml`

A single committed YAML file mirroring `_candidates.yaml`. Top-of-file comment block (recording the dated snapshot and the area→landing-URL map), then a flat YAML list of candidate records grouped by taxonomy area via `# === Area: <name> ===` comment headers (the iAPI file groups by concept; this file groups by area, the natural axis here).

Per-record keys (mirroring `_candidates.yaml`):

```yaml
- name: taxonomy-register
  description: <one line>
  difficulty: simple
  concepts: [register_taxonomy, show_in_rest, init-hook]
  source: dev.wordpress.org            # source-TYPE marker; distinguishes from the iAPI catalog's `source: docs`
  source_files:                        # developer.wordpress.org URLs (not local checkout paths)
    - https://developer.wordpress.org/plugins/taxonomies/working-with-custom-taxonomies/
    - https://developer.wordpress.org/reference/functions/register_taxonomy/
  prompt: |
    <user-voice, tool-agnostic>        # full prompt+acceptance ONLY for the six first-area scenarios
  acceptance:
    - <check>
```

- **Provenance adaptation:** the iAPI catalog uses `source: docs` with `source_files` as paths relative to a local Gutenberg checkout (those scenarios were mined from a local clone). The new scenarios are grounded in developer.wordpress.org URLs, so `source: dev.wordpress.org` with `source_files` carrying URLs is the natural fit. This is where documentation traceability lives (Requirement 8 / Acceptance Criterion 8): the catalog entry's `source`/`source_files` cite the official page(s) that ground a scenario's acceptance points; **no source URL appears in any `scenario.yaml`**.
- **Depth rule:** the six Plugins scenarios carry fully-authored `prompt` + `acceptance`. Every other area, and the un-implemented Plugins sub-areas (Users, HTTP API, JavaScript/jQuery/Ajax, Privacy, plus the non-feature chapters), get lighter stubs — `name`/`description`/`difficulty`/`concepts`/`source`/`source_files`, with `prompt`+`acceptance` omitted or marked TODO.
- **Coverage:** at minimum every one of the 10 top-level areas is represented (Requirement 3 / Acceptance Criterion 3).
- **Discovery safety:** because it is a non-directory file with a leading underscore, Skillsmith's `enumerate.ts` skips it (see below). Its distinct filename and header separate it from the iAPI `_candidates.yaml` (Requirement 4 / Acceptance Criterion 4).

### `scenario.yaml` schema (per `counter` and the v1 scenarios)

```yaml
name: <slug>            # must match /^[a-z0-9-]+$/ and equal the directory name; becomes the plugin-slug fragment
description: <one line>
skills:
  - wordpress-development
prompt: |
  <user-voice, tool-agnostic request>
acceptance:
  - <scenario-unique success point>   # clean human-readable checks; NO embedded source URLs
  - ...
rubrics: []             # explicit empty array — REQUIRED for discovery
```

**The `rubrics` key must be present as an explicit empty array (`rubrics: []`).** Skillsmith's discovery validator (`enumerate.ts`'s `isScenarioShape`) checks `Array.isArray(r.rubrics)`, which is `false` for both an omitted key (`undefined`) and a valueless `rubrics:` (parsed as `null`). Either form makes the scenario fail discovery with `"scenario.yaml malformed: expected name/description/skills/prompt/acceptance/rubrics"`, so the scenario is silently skipped and never graded. Only `rubrics: []` passes (`Array.isArray([])` is `true`). The same `isScenarioShape` check also requires `name`, `description`, `skills`, `prompt`, and `acceptance` to be present and well-typed. **Catalog-only fields (`difficulty`, `concepts`, `source`, `source_files`) never appear in a `scenario.yaml`** (Requirement 9 / Acceptance Criterion 9).

`name` is the plugin-slug fragment; the scaffolded plugin directory/slug is `plugin-<name>-<agentId>`, and an e2e spec must activate that exact slug. For all six scenarios `name` equals the directory name (e.g. `taxonomy-register` → slug `plugin-taxonomy-register-<agentId>`).

### `e2e.spec.mjs` interface (per existing specs — the three e2e scenarios only)

```js
import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../utils/wp-cli.mjs";

test.describe("<name> scenario", () => {
  test.beforeAll(async ({ requestUtils }, workerInfo) => {
    deactivateAllPlugins();
    await requestUtils.activatePlugin(`plugin-<name>-${workerInfo.project.metadata.agentId}`);
    // (optional scenario-specific seeding, e.g. requestUtils.createPost)
  });
  test.afterAll(() => {
    deactivateAllPlugins();
    // (optional cleanup, e.g. requestUtils.deleteAllPosts)
  });
  // test(...) — scenario-specific assertion (REST status/JSON here)
});
```

Available e2e mechanisms proven by existing specs: `requestUtils.activatePlugin`, `requestUtils.createPost`, `requestUtils.deleteAllPosts`, `requestUtils.getSiteSettings`, `requestUtils.rest({path,...})`, `page.request.get` (anon REST/front-end), `page.goto`, `page.locator`/`getByRole`. **There is no `createTerm` helper** — which is why the Taxonomies e2e asserts an empty collection route rather than seeding a term.

### Data flow

`scenario.yaml` (discovery + judge input) → scaffold writes plugin `plugin-<name>-<agentId>` → testing agent edits `index.php` → judge grades code against `acceptance` → for e2e scenarios: `verify-e2e.ts` builds + boots `wp-env` → `e2e.spec.mjs` activates the plugin and asserts runtime behavior → Playwright JSON report → harness maps failures back to (scenario, agent). The catalog file feeds nothing in this flow; it is a committed planning artifact read by humans and future reviews. The taxonomy document likewise feeds nothing in the harness.

## First area: Plugins

The single implemented area is **Plugins (Documentation)** — https://developer.wordpress.org/plugins/. The selection was made against the spec's six checkable criteria (Requirement 5 (a)–(f)), with cited sub-area URLs.

### Justification against criteria (a)–(f)

- **(a) Non-saturation.** The Plugins handbook has 18 chapters; only 3 sub-areas are v1-covered — Hooks (https://developer.wordpress.org/plugins/hooks/), Shortcodes (https://developer.wordpress.org/plugins/shortcodes/), and Custom Post Types (https://developer.wordpress.org/plugins/post-types/). (REST custom endpoints, the 4th v1 sub-area, lives under the REST API area, not Plugins.) That leaves ~15 uncovered chapters — far more than enough to host ~1 scenario each.
- **(b) Foundational / broad applicability.** At least two chosen sub-areas are prerequisites reused across other areas: **Metadata** (https://developer.wordpress.org/plugins/metadata/) underpins CPTs, REST responses, Block-Editor post meta, and Settings; **Taxonomies** (https://developer.wordpress.org/plugins/taxonomies/) underpin content modeling reused by Themes (template hierarchy), REST (taxonomy routes), and the Block Editor (query/term selectors). **Settings/Options** (https://developer.wordpress.org/plugins/settings/) is a primitive reused by virtually every plugin and surfaced through REST.
- **(c) Simple-scaffoldable.** Each chosen sub-area is a one-concept / one-small-feature `index.php` edit on the existing block scaffold (register a taxonomy; register a post meta; register a setting; schedule a cron event; add an admin menu page; wrap strings in `__()`). No block build required — the same model as the v1 non-block scenarios.
- **(d) E2e-feasible.** At least three sub-areas have clean, v1-grade e2e: **Taxonomies** (anon REST 200 at `/wp-json/wp/v2/<rest_base>`), **Metadata** (post `.meta` via REST), **Settings** (authenticated `/wp/v2/settings`). This comfortably satisfies "at least some sub-areas observable in a booted `wp-env` site."
- **(e) Documentation-grounded and drift-stable.** Every chosen sub-area traces to a stable `developer.wordpress.org/plugins/<chapter>/` handbook page. The Plugins handbook is a long-stable structure, unlike Common APIs (mid-reorg with legacy `/apis/handbook/` paths).
- **(f) Tool-agnostic-promptable.** Each sub-area is expressible as a user-voice, outcome-phrased request (e.g. "let editors group my posts into named collections" for taxonomies; "store and expose an extra field on my posts" for metadata) without naming the API/function.

Plugins was chosen over the runner-up **Common APIs** (strong on foundational grounds but heavily overlapping Plugins and mid-reorg, weakening criterion (e)) and over the weak picks the spec calls out: Block Editor (block builds fail criterion (c); iAPI saturated), REST API (custom-endpoints v1-saturated), Coding Standards (100% prose → fails (d)), and Advanced Administration / WP-CLI / Playground (niche server-ops/tooling; weak on (c), (d), (f)). Themes was eliminated because its work is mostly file-convention / `theme.json` / template work, not a single scaffolded-*plugin* edit (weak on (c)).

### No-duplication boundary against the v1 four sub-areas

No newly implemented scenario duplicates a v1 sub-area (Requirement 7 / Acceptance Criterion 7), evaluated at the sub-area level:

| New scenario | Sub-area | Distinct from v1 because |
|---|---|---|
| `taxonomy-register` | Taxonomies | Taxonomies ≠ Custom Post Types — distinct handbook chapters and distinct registration functions (`register_taxonomy` vs `register_post_type`). Checked explicitly. |
| `post-meta-rest` | Metadata | Not Hooks/Shortcodes/CPT/REST-endpoints. |
| `settings-register` | Settings | Not Hooks/Shortcodes/CPT/REST-endpoints. |
| `cron-event` | Cron | Not Hooks/Shortcodes/CPT/REST-endpoints. |
| `i18n-textdomain` | Internationalization | Not Hooks/Shortcodes/CPT/REST-endpoints. |
| `admin-menu-page` | Administration Menus | Not Hooks/Shortcodes/CPT/REST-endpoints. |

## The six first-area scenarios

The Plugins handbook's 18 chapters, minus the 3 v1-covered (Hooks, Shortcodes, Custom Post Types) and the 5 non-feature/meta chapters that are not "one small feature" tasks (Introduction, Plugin Basics, Plugin Directory submission, Developer Tools, Plugin Security), leave these major implementable feature sub-areas: Settings, Metadata, Taxonomies, Users, HTTP API, Cron, Internationalization, Privacy, Administration Menus, JavaScript/jQuery/Ajax. Six are implemented (one simple scenario each), balanced across the e2e/judge mix; the rest are deliberately deferred to catalog stubs (see Key Decisions). Each scenario below is fully specified so phase 3/4 builds it without re-deciding.

### Scenario 1 — `taxonomy-register` (Taxonomies) — **e2e**

- **Sub-area:** Taxonomies.
- **Source URL(s):** https://developer.wordpress.org/plugins/taxonomies/working-with-custom-taxonomies/ ; https://developer.wordpress.org/reference/functions/register_taxonomy/
- **Prompt (user-voice, tool-agnostic) — pin the public route segment the e2e asserts:**
  > I want editors to be able to group and label my posts into a named set of terms — a "genre" classification (use the identifier `genre`) — and I want those genres reachable through my site's data API so other tools can read them.
- **`acceptance` (scenario-unique; clean checks, no URLs):**
  1. Registers the taxonomy on the `init` action hook (not before it).
  2. The taxonomy is attached to the `post` object type.
  3. `public => true` and `show_in_rest => true` are both set.
  4. The taxonomy identifier does not exceed **32 characters** and uses only lowercase letters, dashes, and underscores.
  5. Labels (`name` / `singular_name`) are wrapped in `__()` for translation.
- **e2e (`e2e.spec.mjs`):** `beforeAll`: `deactivateAllPlugins()`, then `activatePlugin('plugin-taxonomy-register-${agentId}')`. Test: `const resp = await page.request.get('/wp-json/wp/v2/genre')` (anon channel; default `rest_base` equals the taxonomy name `genre`), assert `resp.status() === 200`. The route returns 200 even with **zero terms** (an empty `[]` is valid), so no term seeding is needed (there is no `createTerm` helper). `afterAll`: `deactivateAllPlugins()`. Proves acceptance 3; acceptance 1, 2, 4, 5 are judge-checked.
- **Correctness note (most likely mis-authored):** the taxonomy key max is **32 characters, NOT 20** — do not copy `cpt-register`'s 20-char limit (a CPT key is 20; a taxonomy key is 32).

### Scenario 2 — `post-meta-rest` (Metadata) — **e2e**

- **Sub-area:** Metadata.
- **Source URL(s):** https://developer.wordpress.org/plugins/metadata/managing-post-metadata/ ; https://developer.wordpress.org/reference/functions/register_post_meta/ ; https://developer.wordpress.org/rest-api/extending-the-rest-api/modifying-responses/
- **Prompt (user-voice, tool-agnostic) — pin the meta key:**
  > I want to store an extra piece of information on each of my posts — a short subtitle, saved under the key `subtitle` — and have it available through my site's data API so other tools can read it back.
- **`acceptance` (scenario-unique):**
  1. Registers the post meta on the `init` action hook, targeting the core `post` type.
  2. `single => true` is set (the value is a single scalar, not an array).
  3. `type` is set (e.g. `string`).
  4. `show_in_rest => true` is set so the value surfaces in the REST API.
  5. The meta key is public (no leading underscore), so it is exposed rather than protected.
- **e2e (`e2e.spec.mjs`):** `beforeAll`: `deactivateAllPlugins()`, `activatePlugin('plugin-post-meta-rest-${agentId}')`, then seed a published post via `requestUtils.createPost({ status: 'publish', ... })`. Test: `const resp = await page.request.get('/wp-json/wp/v2/posts/<id>')`, parse JSON, assert `.meta.subtitle` is present. A registered `show_in_rest` single meta is **always present under `.meta`** (with its default) once registered, so this is deterministic without writing a value. `afterAll`: `deactivateAllPlugins()` + `requestUtils.deleteAllPosts()`. Proves acceptance 4; acceptance 1, 2, 3, 5 are judge-checked.

### Scenario 3 — `settings-register` (Settings) — **e2e**

- **Sub-area:** Settings.
- **Source URL(s):** https://developer.wordpress.org/plugins/settings/settings-api/ ; https://developer.wordpress.org/plugins/settings/options-api/ ; https://developer.wordpress.org/reference/functions/register_setting/
- **Prompt (user-voice, tool-agnostic) — pin the option name and its default:**
  > I want a site-wide configurable option my editors can set — a tagline override stored under `my_plugin_tagline`, defaulting to `Hello world` — and I want it available through my site's data API.
- **`acceptance` (scenario-unique):**
  1. Registers the setting with `show_in_rest => true` so it is exposed in the REST API.
  2. The setting is registered so that it surfaces in REST — on `init` or `rest_api_init` (NOT only on `admin_init`).
  3. `type` is set (e.g. `string`).
  4. A `default` is provided.
  5. A `sanitize_callback` is provided.
- **e2e (`e2e.spec.mjs`):** authenticated channel only (`/wp/v2/settings` is admin-gated; anon returns a filtered/empty payload). `beforeAll`: `deactivateAllPlugins()`, `activatePlugin('plugin-settings-register-${agentId}')`. Test: `const settings = await requestUtils.getSiteSettings()` (or `requestUtils.rest({ path: '/wp/v2/settings' })`), assert the `my_plugin_tagline` key is present and equals its default `Hello world`. A `show_in_rest` setting with a `default` returns that default even before any save, so this is deterministic. `afterAll`: `deactivateAllPlugins()`. Proves acceptance 1; acceptance 2–5 are judge-checked.
- **Correctness note (most likely mis-authored):** `register_setting` is commonly hooked on `admin_init`, but to surface in REST it must ALSO be registered at `rest_api_init`. The robust pattern is to register on **`init`** (fires before both) or on both `admin_init` + `rest_api_init`. Registering only on `admin_init` means it will NOT appear at `/wp/v2/settings` — this is a real acceptance point (acceptance 2).

### Scenario 4 — `cron-event` (Cron) — **judge-only**

- **Sub-area:** Cron.
- **Source URL(s):** https://developer.wordpress.org/plugins/cron/ ; https://developer.wordpress.org/plugins/cron/scheduling-wp-cron-events/ ; https://developer.wordpress.org/plugins/cron/understanding-wp-cron-scheduling/
- **Prompt (user-voice, tool-agnostic):**
  > I want my plugin to run a recurring background task automatically — say a periodic cleanup that runs on a regular schedule — without me having to trigger it manually.
- **`acceptance` (scenario-unique):**
  1. Schedules the event via `wp_schedule_event()`, guarded by a `wp_next_scheduled()` check so it is not scheduled more than once.
  2. The event is hooked to a named action with a callback that performs the task.
  3. Uses a valid built-in recurrence (`hourly`) — no custom interval (which would require the `cron_schedules` filter).
  4. Unschedules the event on plugin deactivation (`register_deactivation_hook` + `wp_unschedule_event()`, or `wp_clear_scheduled_hook()`).
- **No e2e:** cron is asynchronous and time-dependent (flaky for e2e); there is no clean REST/DOM surface. A WP-CLI shell-out (`wpCli(['cron','event','list'])`) exists but would add an unused channel — kept judge-only deliberately.
- **Correctness notes:** calling `wp_schedule_event()` without the `wp_next_scheduled()` guard schedules the event repeatedly — the guard is mandatory. The documented cleanup is `wp_unschedule_event()` inside `register_deactivation_hook()`; `wp_clear_scheduled_hook()` is also acceptable. Acceptance 4 should accept either.

### Scenario 5 — `i18n-textdomain` (Internationalization) — **judge-only**

- **Sub-area:** Internationalization.
- **Source URL(s):** https://developer.wordpress.org/plugins/internationalization/ ; https://developer.wordpress.org/plugins/internationalization/how-to-internationalize-your-plugin/ ; https://developer.wordpress.org/plugins/internationalization/localization/
- **Prompt (user-voice, tool-agnostic):**
  > I want all of my plugin's user-facing text to be ready to translate into other languages, so translators can localize it later.
- **`acceptance` (scenario-unique):**
  1. User-facing strings are wrapped in a gettext function (`__()` / `_e()` / `esc_html__()`).
  2. The text domain is a literal string equal to the plugin slug.
  3. A `Text Domain:` header is present in the plugin header.
  4. No variable or constant is used as the text-domain argument, and no variable is used as the translatable-string argument (both must be literals).
- **No e2e:** the default `en_US` locale renders source strings unchanged, so nothing is observable without a shipped `.mo` translation file.
- **Correctness note (most likely mis-authored):** since WordPress 4.6, plugins hosted on WordPress.org auto-load their translations and `load_plugin_textdomain()` is **NOT required**. Do **not** make `load_plugin_textdomain()` a hard acceptance check — it is optional/best-practice only. (A soft mention may appear, but acceptance 1–4 are the hard checks.)

### Scenario 6 — `admin-menu-page` (Administration Menus) — **judge-only**

- **Sub-area:** Administration Menus.
- **Source URL(s):** https://developer.wordpress.org/plugins/administration-menus/ ; https://developer.wordpress.org/plugins/administration-menus/top-level-menus/ ; https://developer.wordpress.org/plugins/administration-menus/sub-menus/
- **Prompt (user-voice, tool-agnostic):**
  > I want my plugin to add its own settings screen reachable from the WordPress dashboard, so administrators have a place to manage it.
- **`acceptance` (scenario-unique):**
  1. Registers the page via `add_menu_page()` (or `add_submenu_page()` / `add_options_page()`) on the `admin_menu` action hook.
  2. A `capability` (e.g. `manage_options`) is set to gate access.
  3. A `menu_slug` and a render callback are provided.
  4. The render callback outputs escaped markup, and no output is produced outside the callback.
- **No e2e (deliberate, per Requirement 11 "where impractical"):** the menu renders only inside wp-admin on a logged-in session; an admin-DOM e2e is doable via `page.goto('/wp-admin/admin.php?page=<slug>')` + a heading locator but is heavier and flakier than the clean v1 anon pattern. To keep the e2e set the clean three, this is judge-only. If phase 4 elects to add e2e anyway, it must pin the `menu_slug` and a heading literal in the prompt and assert the absence of an "insufficient permissions" message.

### Summary table

| # | Scenario (= dir = `name`) | Sub-area | Verify | e2e channel / why judge-only |
|---|---|---|---|---|
| 1 | `taxonomy-register` | Taxonomies | e2e | anon REST 200 at `/wp-json/wp/v2/genre` |
| 2 | `post-meta-rest` | Metadata | e2e | seed post + read `.meta.subtitle` via authed REST |
| 3 | `settings-register` | Settings | e2e | authed `getSiteSettings()` → assert `my_plugin_tagline` default |
| 4 | `cron-event` | Cron | judge-only | async + time-based; no clean REST/DOM |
| 5 | `i18n-textdomain` | Internationalization | judge-only | en_US renders source strings; nothing observable |
| 6 | `admin-menu-page` | Administration Menus | judge-only | admin-only UI; admin-DOM nav too heavy for a "simple" e2e |

All six declare `rubrics: []`. Every literal an e2e asserts (taxonomy slug `genre`, meta key `subtitle`, option name `my_plugin_tagline` + default `Hello world`) is pinned in that scenario's prompt, keeping prompt and assertion in lockstep (Requirement 11 / Acceptance Criterion 11).

## Key Decisions

### Decision: Reference taxonomy as a dated point-in-time snapshot, area layer stable / leaf layer drift-refreshable

- **Choice:** Deliver the 10-area taxonomy reproduced above as a committed, dated (2026-06-18), source-URL-bearing snapshot. Treat the area layer (10 top-level areas) as the stable contract and the sub-area leaves as the drift-refreshable layer; record reorg/legacy-path caveats inline.
- **Alternatives:** (a) A frozen taxonomy contract with no snapshot framing; (b) area-only coverage with no sub-area enumeration.
- **Trade-offs:** A frozen contract would rot silently as developer.wordpress.org evolves (the Common APIs handbook is already mid-reorg); the snapshot framing lets future reviews detect and refresh drift without renegotiating the stable area layer. Area-only coverage would fail "each lists its major sub-areas." The chosen approach covers every area, enumerates sub-areas, and is auditable.
- **Traces to:** Requirements 1, 2; Acceptance Criteria 1, 2.

### Decision: Catalog at `eval/scenarios/_wp-dev-candidates.yaml`, mirroring `_candidates.yaml`, grouped by area

- **Choice:** A single committed YAML file at `eval/scenarios/_wp-dev-candidates.yaml` — a leading-underscore non-directory file beside `_candidates.yaml` — mirroring the `_candidates.yaml` record shape, grouped by taxonomy area via `# === Area: <name> ===` headers, with full `prompt`+`acceptance` only for the six first-area scenarios and lighter stubs elsewhere. Provenance via `source: dev.wordpress.org` + `source_files` URLs.
- **Alternatives:** (a) A path outside `eval/scenarios/` (e.g. `eval/wp-dev-candidates.yaml`) — maximally safe but diverges from the established precedent that the iAPI catalog lives inside `eval/scenarios/`; (b) reuse/extend the existing `_candidates.yaml` — rejected: the spec requires the new artifact be clearly distinct from the iAPI catalog and the existing file not be reorganized.
- **Trade-offs:** Option 1 keeps the catalog co-located with scenarios (matching precedent) and is provably skipped by the same `enumerate.ts` guard that already skips `_candidates.yaml`; the only requirement is a distinct name + header, satisfied by `_wp-dev-candidates.yaml`. The out-of-`eval/scenarios/` option is safe but loses the precedent the spec explicitly contemplates. Reusing the iAPI file is forbidden.
- **Traces to:** Requirements 3, 4, 14; Acceptance Criteria 3, 4, 14.

### Decision: Catalog discovery safety relies on non-directory-ness, not the underscore alone

- **Choice:** Make the catalog a flat FILE (never a directory). Discovery skips it because `enumerate.ts`'s loop runs `if (!isDirectorySafe(dir)) continue;` (guard A, skip non-directories) BEFORE `if (!existsSync(yamlPath)) continue;` (guard B). A leading-underscore non-directory file is skipped by guard A.
- **Alternatives:** Rely on the leading underscore as the guard (a directory named `_foo` containing a `scenario.yaml`).
- **Trade-offs:** The load-bearing nuance (verified verbatim at the pinned skillsmith SHA `6bd90c34d88b815fdf4fd661dc8c51288111444c`) is that it is the *non-directory-ness* that saves the file — a *directory* named `_foo` WITH a `scenario.yaml` WOULD be discovered. A flat file is unambiguously safe.
- **Traces to:** Requirement 4; Acceptance Criterion 4.

### Decision: First area = Plugins

- **Choice:** Implement scenarios for exactly one top-level area — Plugins.
- **Alternatives:** Common APIs (runner-up), Themes, Block Editor, REST API, Advanced Administration, WP-CLI, Playground, Coding Standards, Code Reference.
- **Trade-offs:** Plugins is the only area that simultaneously passes all six criteria (non-saturated; foundational; every chosen sub-area a single `index.php` edit; ≥3 sub-areas cleanly e2e-able; stable handbook; outcome-promptable). Common APIs scores well on foundational grounds but overlaps Plugins heavily and is mid-reorg (weakening drift-stability). The other areas fail (c)/(d)/(f) or are v1-saturated/judge-only-by-nature. Full justification with cited sub-area URLs is in "First area: Plugins."
- **Traces to:** Requirement 5 (criteria a–f); Acceptance Criterion 5.

### Decision: Six scenarios (3 e2e + 3 judge-only), one per major un-covered sub-area; defer four sub-areas to catalog stubs

- **Choice:** Implement `taxonomy-register`, `post-meta-rest`, `settings-register` (e2e) and `cron-event`, `i18n-textdomain`, `admin-menu-page` (judge-only). Record Users, HTTP API, JavaScript/jQuery/Ajax, and Privacy as lighter catalog stubs, not implemented this review.
- **Alternatives:** (a) Implement all ten major feature sub-areas; (b) implement only the three e2e-feasible ones.
- **Trade-offs:** The six chosen cover the major implementable sub-areas with a clean e2e/judge split (satisfying the mixed-verification preference: e2e where feasible, judge-only where impractical) at a batch size (6) comparable to v1 (4). The deferred four are deliberately excluded with reasons recorded so phase 4 does not second-guess: **Users** — a *simple* one-concept slice is fuzzy to scope (roles/caps/meta sprawl); **HTTP API** — judge-only AND inherently outbound, so a testable inbound surface would be contrived/multi-concept; **JavaScript/jQuery/Ajax** — overlaps Block-Editor/iAPI territory, awkward as a non-block `index.php` edit, and admin-ajax patterns are dated; **Privacy** — admin-Tools-only surface, niche, heavy. Implementing all ten would breach "keep scenarios simple" and the v1-scale batch size; implementing only three would forfeit coverage of judge-checkable sub-areas the spec wants represented.
- **Traces to:** Requirements 6, 11; Acceptance Criteria 6, 11.

### Decision: Add zero new shared rubrics; every scenario declares `rubrics: []`

- **Choice:** Add no files under `eval/rubrics/`; each scenario carries its checks in `acceptance` and declares the explicit empty array `rubrics: []`.
- **Alternatives:** (a) A "register on the right hook" rubric; (b) a "show_in_rest" rubric; (c) an escaping/i18n rubric.
- **Trade-offs:** No single check recurs in the *same form* across all (or even most) of the six scenarios the way the iAPI best-practices rubric uniformly applies to all 11 iAPI scenarios. "Register on the right hook" fragments per scenario (taxonomy/meta → `init`; settings → `init`+`rest_api_init`; cron → a named custom action; admin menu → `admin_menu`). `show_in_rest` recurs in only 3 of 6 and in a scenario-specific role each time. i18n is the *whole point* of `i18n-textdomain` (so it belongs in that scenario's acceptance, not a shared rubric that R10/AC10 would then forbid duplicating there), and escaping is only incidental to `admin-menu-page`. A catch-all rubric would risk duplicating per-scenario acceptance points (forbidden) or being too vague to help the judge. The spec explicitly permits zero rubrics when no genuinely cross-cutting check emerges; this mirrors the v1 outcome.
- **Traces to:** Requirement 10; Acceptance Criterion 10.

### Decision: Mixed verification — e2e only where a clean v1-grade runtime check exists

- **Choice:** Ship `e2e.spec.mjs` for the three sub-areas with a clean, low-flake runtime surface (Taxonomies, Metadata, Settings) and keep the other three judge-only.
- **Alternatives:** (a) e2e for all six; (b) judge-only for all six.
- **Trade-offs:** Taxonomies/Metadata/Settings each yield a deterministic REST assertion using v1-proven channels (anon route 200; post `.meta` present; setting default in `/wp/v2/settings`). Cron is async/time-flaky, i18n produces nothing observable in `en_US`, and Administration Menus needs admin-DOM nav heavier than a "simple" e2e — forcing e2e there would add flake/complexity disproportionate to a simple scenario. Judge-only-for-all forfeits the runtime signal the spec prefers where e2e is feasible.
- **Traces to:** Requirement 11; Acceptance Criterion 11.

### Decision: Pin every e2e-asserted literal in the corresponding prompt

- **Choice:** Name the concrete identifiers the e2e asserts in the prompt — taxonomy slug `genre`, meta key `subtitle`, option name `my_plugin_tagline` + default `Hello world`.
- **Alternatives:** Leave slug/key/option name to the agent and have the e2e discover it.
- **Trade-offs:** Without pinning, the e2e assertion target drifts with the agent's naming choice, making the spec flaky or forcing discovery logic disproportionate to a simple scenario. Naming a concrete identifier keeps the prompt user-voiced (a user can legitimately ask for a specific slug or option) and tool-agnostic (it still does not name `register_taxonomy`/`register_post_meta`/`register_setting`), while making the e2e deterministic — exactly the v1 approach for `cpt-register` (`books`) and `rest-custom-endpoint` (`/wp-json/myplugin/v1/hello`). Prompt string and e2e assertion must stay in lockstep if reworded.
- **Traces to:** Requirements 8, 11; Acceptance Criteria 8, 11.

### Decision: Documentation traceability lives in catalog provenance, not in `scenario.yaml`

- **Choice:** Record each implemented scenario's documentation grounding in its `_wp-dev-candidates.yaml` entry's `source`/`source_files` (developer.wordpress.org URLs). Keep `scenario.yaml` `acceptance` strings clean, human-readable checks with no embedded URLs.
- **Alternatives:** Embed source URLs in the `scenario.yaml` acceptance strings or add catalog-only fields to `scenario.yaml`.
- **Trade-offs:** The spec bars catalog-only fields (`difficulty`, `concepts`, `source`, `source_files`) from `scenario.yaml` and requires acceptance strings to stay clean (consistent with v1). The catalog's provenance field is the designated home for traceability, keeping the two artifacts cleanly separated.
- **Traces to:** Requirements 8, 9; Acceptance Criteria 8, 9.

## Dependencies

All dependencies already exist in the repo; this review introduces **no new** dependency.

- **Internal:** `eval/utils/scaffold-plugin.ts`, `eval/utils/verify-e2e.ts`, `eval/utils/wp-cli.mjs` (`deactivateAllPlugins`), `playwright.config.ts`, the `eval/scenarios/counter/` reference pattern, the existing `eval/scenarios/_candidates.yaml` (precedent shape, untouched), and the v1 scenario specs (lifecycle precedent).
- **External (already present):** `@automattic/skillsmith` (discovery, scaffold orchestration, judge) pinned at SHA `6bd90c34d88b815fdf4fd661dc8c51288111444c`; `@wordpress/e2e-test-utils-playwright` (`test`, `expect`, `requestUtils`); `@wordpress/scripts` (`wp-scripts build`); `@wordpress/env` (`wp-env` runtime, `wp-cli`); Playwright.
- **Documentation (selection/acceptance grounding, not a runtime dependency):** the developer.wordpress.org pages cited per scenario above and in the catalog provenance.

## Failure Modes and Observability

- **Scenario not discovered:** a directory not placed as an immediate child of `eval/scenarios/`, or missing `scenario.yaml`, is silently skipped by `enumerate.ts`. Mitigation: flat layout with the required file(s). Observable as the scenario simply not appearing in run output.
- **Catalog accidentally enumerated:** would happen only if the catalog were a *directory* containing a `scenario.yaml`. Mitigation: the catalog is a flat non-directory file, skipped by guard A before the YAML-existence guard. Observable by running discovery and confirming `_wp-dev-candidates.yaml` is not listed as a scenario (Acceptance Criterion 4).
- **Malformed `scenario.yaml` (schema validation):** `isScenarioShape` requires `rubrics` to be a present array; an omitted key (`undefined`) or valueless `rubrics:` (`null`) fails with `"scenario.yaml malformed: expected name/description/skills/prompt/acceptance/rubrics"`, and the scenario is silently skipped and never graded. Mitigation: every scenario declares `rubrics: []`. The same check requires `name`/`description`/`skills`/`prompt`/`acceptance` present and well-typed.
- **Invalid `name`:** `scaffold-plugin.ts` throws if `name` (or `agentId`) does not match `/^[a-z0-9-]+$/`. All six names conform and equal their directory names.
- **e2e cannot activate the plugin / wrong slug:** if a spec activates a slug other than `plugin-<scenario.name>-<agentId>`, activation fails and the spec errors. Mitigation: specs derive the slug from `name` (equal to the directory name) and `workerInfo.project.metadata.agentId`, exactly as existing specs do.
- **e2e assertion drift:** mitigated by pinning the asserted literal in the prompt (`genre`, `subtitle`, `my_plugin_tagline`/`Hello world`); the spec asserts the pinned string.
- **Settings not surfacing in REST (scenario-specific):** if the agent registers the setting only on `admin_init`, it will be absent from `/wp/v2/settings` and the `settings-register` e2e will fail. This is expected behavior the scenario is designed to exercise (acceptance 2), not a harness error.
- **Build step:** `verify-e2e.ts` runs `wp-scripts build` only for plugins with `src/blocks` (always present from the scaffold) and logs but does not abort on build failure. For these non-block scenarios the build is incidental; the feature under test lives in `index.php`.
- **Observability:** e2e failures surface through Playwright's JSON report, which `verify-e2e.ts` parses into per-(scenario, agent) failure records; judge results surface through Skillsmith's normal grading output; `wp-env` start/stop and build steps log to stdout/stderr.
- **Expected non-failure:** per the spec, a *failing grade against the current skill* is acceptable and is not a harness error. The bar is that each scenario runs to a graded result and any e2e executes; it need not pass against today's skill (Acceptance Criterion 12).

## Risks and Open Questions

- **Catalog `source:` token (cosmetic, phase-4 detail, NOT blocking).** The iAPI catalog uses `source: docs`. This design proposes `source: dev.wordpress.org` to signal official-site grounding and distinguish it from the iAPI catalog. The exact token is a cosmetic phase-4 choice; the load-bearing constraint is that `source_files` carry developer.wordpress.org URLs (Requirement 8 / Acceptance Criterion 8). Phase 4 may pick a different token provided it still reads as an official-site marker and the URLs remain in `source_files`.
- **Block-scaffold nudges block work (INHERITED from v1).** The scaffold writes a block; these six non-block scenarios add PHP to `index.php`, and the extra `wp-skill/testing-block` registration is inert. The agent could be distracted toward block-based work. Same mitigation as v1: outcome-focused, unambiguous prompts that describe the feature, not a block. Known harness limitation, not a defect introduced here. Phase 4 should keep the prompts crisp about the desired non-block outcome.
- **Common APIs reorg drift (LOW).** Several Common APIs sub-area URLs are legacy `/apis/handbook/` paths confirmed live as of this snapshot; the handbook is mid-migration. Recorded as a snapshot caveat in the taxonomy (the leaf layer is explicitly drift-refreshable). Does not affect the first-area pick, since the first area is Plugins, not Common APIs.
- **i18n `load_plugin_textdomain` must not become a hard check (phase-4 transcription note).** Since WP 4.6, WordPress.org-hosted plugins auto-load translations, so `load_plugin_textdomain()` is optional. Phase 4 must keep it out of the `i18n-textdomain` hard acceptance checks (acceptance 1–4), or mark it explicitly soft/optional.
- **Cron cleanup wording (phase-4 transcription note).** The documented cleanup is `wp_unschedule_event()` inside `register_deactivation_hook()`; `wp_clear_scheduled_hook()` is also acceptable. Phase 4 should phrase acceptance 4 to accept either, and require the `wp_next_scheduled()` guard before `wp_schedule_event()`.
- **Taxonomy key length (phase-4 transcription note).** The taxonomy key max is 32 characters, NOT the 20 used for CPT keys. Phase 4 must not copy `cpt-register`'s 20-char limit into `taxonomy-register`.
- **`admin-menu-page` e2e is intentionally omitted (resolved).** An admin-DOM e2e is feasible but heavier/flakier than the clean three; this design keeps it judge-only. If phase 4 elects e2e anyway, it must pin the `menu_slug` and a heading literal in the prompt and assert the absence of an "insufficient permissions" message.
