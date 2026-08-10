# Design Research: Exhaustive WordPress-development scenario taxonomy + first-area scenarios

_Point-in-time snapshot — 2026-06-18_

## Research

<!-- Non-trivial findings from the design-doc-researcher, with sources cited. -->

### Skillsmith flat-discovery constraint

From v1 design-doc: `@automattic/skillsmith`'s `enumerate.ts` reads **only the immediate children** of `eval/scenarios/` (no recursion). `verify-e2e.ts` derives spec paths from the immediate-child `dirName`. A leading-underscore file (e.g. `_candidates.yaml`) placed directly under `eval/scenarios/` is a non-directory entry — it passes the "not a directory" guard in Skillsmith discovery and is skipped as a scenario. This is the same mechanism that allows `_candidates.yaml` to sit next to the iAPI scenarios without being treated as a scenario.

Source: `.pipelines/36-wp-dev-scenarios/base/2-design-doc/design-doc.md` (Components, Key Decisions — flat folder layout section).

### iAPI `_candidates.yaml` precedent

The file `eval/scenarios/_candidates.yaml` is the committed candidate-catalog for the Interactivity API scenarios. Its shape (from spec): a flat list of candidate records with at least `name`, `description`, `difficulty`, `concepts`, `source`, `source_files`, `prompt`, `acceptance`. It is the precedent for the new WP-dev catalog.

### v1 covered sub-areas (must not duplicate)

- Hooks/Filters → `filter-body-class`
- Shortcodes → `shortcode-with-attr`
- Custom Post Types → `cpt-register`
- REST API custom endpoints → `rest-custom-endpoint`

### Harness e2e channels (read live from v1 specs + Gutenberg `RequestUtils`)

v1 specs use three observability channels. This determines which Plugins sub-areas are e2e-feasible:

- **[A] anon public REST/DOM** — `page.request.get(path)` is UNAUTHENTICATED (anon visitor, no admin cookie). Works only for PUBLIC routes/pages. Used by `cpt-register` (`/wp/v2/books`), `rest-custom-endpoint`, and `shortcode-with-attr` (front-end DOM). **Cleanest, v1-proven.**
- **[B] authenticated REST** — `requestUtils.rest({path,method,data})`, `getSiteSettings`, `updateSiteSettings`, `createPost`, `createUser`/`deleteAllUsers`, `createPost`, `deleteAllPosts`, `activatePlugin`. Authenticated as admin; in-harness and clean. **No `createTerm` helper exists.**
- **[C] WP-CLI shell-out** — `eval/utils/wp-cli.mjs` exports `wpCli(args)` → runs `wp-env run cli wp ...` (e.g. `wp option get`, `wp cron event list`). Available, not used by any v1 spec.
- **[D] admin-UI DOM** — `page.goto('/wp-admin/...')` + locators on a logged-in session. Heaviest; needs admin nav.
- **[E] judge-only** — no runtime surface; graded against `acceptance`.

Source: researcher read of `cpt-register/`, `rest-custom-endpoint/`, `shortcode-with-attr/` `e2e.spec.mjs`; `eval/utils/wp-cli.mjs`; Gutenberg `RequestUtils`. Legacy/quicktags URLs all resolve 200 (curl -L live): `/apis/handbook/making-http-requests/`, `/apis/handbook/rewrite/`, `/apis/handbook/xml-rpc/`, `/apis/handbook/quicktags/` AND `/apis/quicktags/`.

### Plugins sub-area e2e-feasibility flags (researcher, live-verified)

| Sub-area | Channel | Cleanest assertion | Verdict |
|---|---|---|---|
| **Taxonomies** (`register_taxonomy` + `show_in_rest`) | [A] | `page.request.get('/wp-json/wp/v2/<rest_base>')` → 200 (public route, default `rest_base` = taxonomy name) | **CLEAN — cleanest of the set; direct analog of `cpt-register` but distinct sub-area** |
| **Metadata** (`register_post_meta` + `show_in_rest`) | [A/B] | seed post via `requestUtils.createPost`, read back `/wp-json/wp/v2/posts/<id>` → assert `.meta.<key>` present | **CLEAN** |
| **Settings** (`register_setting` + `show_in_rest`) | [B] | `requestUtils.rest({path:'/wp/v2/settings'})` or `getSiteSettings()` → assert custom option key present. Caveat: `register_setting` must run on `rest_api_init` (not only `admin_init`) to surface in REST — a real acceptance point. `/wp/v2/settings` is admin-auth, so NOT anon `page.request.get`. | **CLEAN (authenticated)** |
| **Users** | [B] | `createUser`/`deleteAllUsers` + auth REST; but a simple one-concept slice is fuzzy to scope | Medium — feasible, fuzzier |
| **Administration Menus** (`add_menu_page`) | [D] | menu renders only in wp-admin; `page.goto('/wp-admin/...')` + locator on logged-in session | Medium-weak (admin nav, heavier than v1 anon pattern) |
| **HTTP API** (`wp_remote_get/post`) | [E] | outbound requests FROM WP; no inbound route/DOM to assert | **JUDGE-ONLY** |
| **Cron** (`wp_schedule_event`) | [C]/[E] | no REST/DOM; `wp cron event list` via WP-CLI, or judge. Time-dependent/flaky for e2e | **JUDGE-ONLY** (cron scheduling registration is judge-checkable) |
| **Internationalization** (`load_plugin_textdomain`/`__()`) | [E] | default en_US shows source strings → nothing observable without a loaded `.mo` | **JUDGE-ONLY** |
| **Privacy** (data exporter/eraser hooks) | [D]/[E] | surfaces in wp-admin Tools→Export Personal Data; no public route | **JUDGE-ONLY** (admin-DOM too heavy) |

**Summary:** CLEAN e2e (v1-grade): Taxonomies [A], Metadata [A/B], Settings [B]. Judge-only: i18n, HTTP API, Cron, Privacy. Admin-DOM/medium: Administration Menus, Users.

---

## Topics

### Topic 1: Exhaustive area → sub-area taxonomy

- **Spec link:** Requirements R1 (exhaustive taxonomy), R2 (traceable + dated); Acceptance Criteria 1, 2
- **Status:** In progress — 4 of ~10 areas swept (Plugins, Themes, Common APIs, Advanced Administration). Awaiting Block Editor, Coding Standards, Playground, Code Reference, REST API, WP-CLI.

**Researcher caveat:** developer.wordpress.org sidebars are JS-rendered, not present in fetched markdown. Chapter lists reconstructed from in-body links + site-scoped search. Landing pages confirmed live. Common APIs handbook is mid-reorg (some chapters at `/apis/<x>/`, a few still at `/apis/handbook/<x>/`).

#### Area: Plugins (Documentation) — landing https://developer.wordpress.org/plugins/

18 canonical chapters. Heavily v1-touched (3 of 4 v1 scenarios map here at sub-area level), but many uncovered sub-areas remain.

| Sub-area | URL | v1? |
|---|---|---|
| Introduction to Plugin Development | https://developer.wordpress.org/plugins/intro/ | |
| Plugin Basics | https://developer.wordpress.org/plugins/plugin-basics/ | |
| Plugin Security | https://developer.wordpress.org/plugins/security/ | |
| Hooks | https://developer.wordpress.org/plugins/hooks/ | **v1: filter-body-class** |
| Privacy | https://developer.wordpress.org/plugins/privacy/ | |
| Administration Menus | https://developer.wordpress.org/plugins/administration-menus/ | |
| Shortcodes | https://developer.wordpress.org/plugins/shortcodes/ | **v1: shortcode-with-attr** |
| Settings | https://developer.wordpress.org/plugins/settings/ | |
| Metadata | https://developer.wordpress.org/plugins/metadata/ | |
| Custom Post Types | https://developer.wordpress.org/plugins/post-types/ | **v1: cpt-register** |
| Taxonomies | https://developer.wordpress.org/plugins/taxonomies/ | |
| Users | https://developer.wordpress.org/plugins/users/ | |
| HTTP API | https://developer.wordpress.org/plugins/http-api/ | |
| JavaScript, jQuery or Ajax | https://developer.wordpress.org/plugins/javascript/ | |
| Cron | https://developer.wordpress.org/plugins/cron/ | |
| Internationalization | https://developer.wordpress.org/plugins/internationalization/ | |
| Plugin Directory (wordpress.org) | https://developer.wordpress.org/plugins/wordpress-org/ | |
| Developer Tools | https://developer.wordpress.org/plugins/developer-tools/ | |

#### Area: Themes (Documentation) — landing https://developer.wordpress.org/themes/

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

#### Area: Common APIs (Documentation) — landing https://developer.wordpress.org/apis/

REORG FLAG: handbook mid-migration. Overlaps Plugins heavily (Hooks, Shortcode, Metadata, Settings, Options dual-documented).

| Sub-area | URL | v1? |
|---|---|---|
| Abilities API (NEW) | https://developer.wordpress.org/apis/abilities-api/ | |
| Hooks | https://developer.wordpress.org/apis/hooks/ | **v1 (sub-area): Hooks/Filters** |
| Settings | https://developer.wordpress.org/apis/settings/ | |
| Options | https://developer.wordpress.org/apis/options/ | |
| Metadata | https://developer.wordpress.org/apis/metadata/ | |
| Transients | https://developer.wordpress.org/apis/transients/ | |
| Database | https://developer.wordpress.org/apis/database/ | |
| HTTP (Making HTTP Requests) | https://developer.wordpress.org/apis/handbook/making-http-requests/ (legacy path) | |
| Filesystem | https://developer.wordpress.org/apis/filesystem/ | |
| Rewrite | https://developer.wordpress.org/apis/handbook/rewrite/ (legacy path) | |
| Shortcode | https://developer.wordpress.org/apis/shortcode/ | **v1 (sub-area): Shortcodes** |
| Plugin | https://developer.wordpress.org/apis/plugin/ | |
| Theme | https://developer.wordpress.org/apis/theme/ | |
| Quicktags | (URL being verified) | |
| XML-RPC | https://developer.wordpress.org/apis/handbook/xml-rpc/ (legacy path) | |
| wp-config.php | https://developer.wordpress.org/apis/wp-config-php/ | |
| Security | https://developer.wordpress.org/apis/security/ | |

#### Area: Advanced Administration (Documentation) — landing https://developer.wordpress.org/advanced-administration/

Server/ops-oriented. Per spec = WEAK first-area pick (niche, hard to e2e as simple plugin).

| Sub-area | URL |
|---|---|
| Before You Install | https://developer.wordpress.org/advanced-administration/before-install/ |
| WordPress (config) | https://developer.wordpress.org/advanced-administration/wordpress/ |
| Security | https://developer.wordpress.org/advanced-administration/security/ |
| Performance | https://developer.wordpress.org/advanced-administration/performance/ |
| Upgrade / Migration | https://developer.wordpress.org/advanced-administration/upgrade/ |
| (Server, Multisite, Plugins, others — full set being verified) | |

#### Area: Block Editor (Documentation) — landing https://developer.wordpress.org/block-editor/

Big, multi-level, block-/JS-centric. Most sub-areas need a built block (heavier than a simple `index.php` edit). iAPI portion fully **SATURATED** — avoid.

5 top sections:

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
| Interactivity API | https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/ | **SATURATED — existing iAPI suite (11 scenarios + `_candidates.yaml`)** |
| RichText | https://developer.wordpress.org/block-editor/reference-guides/richtext/ | |

#### Area: Coding Standards (Documentation) — landing https://developer.wordpress.org/coding-standards/

Small, complete (9 leaves). 100% advice/prose → **JUDGE-ONLY by nature, WEAK first-area pick** (can't exercise the mixed e2e bar).

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

#### Area: WordPress Playground (Documentation) — landing https://developer.wordpress.org/playground/wordpress-playground-resources/

Niche tooling/browser-runtime. **WEAK first-area pick** (not a plugin-feature domain).

| Sub-area | URL |
|---|---|
| Quick Start Guide | https://developer.wordpress.org/playground/wordpress-playground-resources/ |
| Blueprints (JSON) | (under playground resources) |
| Developers (programmatic API) | (under playground resources) |
| API Reference (Query/Blueprints/JS API) | (under playground resources) |

#### Area: Code Reference (API Reference) — landing https://developer.wordpress.org/reference/

Auto-generated symbol DB (thousands of pages). Not a scenario-authoring source itself (reference, not how-to), but **grounds acceptance lists** (e.g. `register_post_type` ref backed `cpt-register`).

| Sub-area | URL |
|---|---|
| Functions | https://developer.wordpress.org/reference/functions/ |
| Hooks (Actions+Filters) | https://developer.wordpress.org/reference/hooks/ |
| Classes | https://developer.wordpress.org/reference/classes/ |
| Methods | https://developer.wordpress.org/reference/methods/ |

Curated grouped "API reference" index (legacy `/apis/handbook/` paths): Dashboard Widgets, Database, HTTP API, Filesystem, Global Variables, Metadata, Options, Plugins, Quicktags, REST API, Rewrite, Settings, Shortcode, Theme Modification, Transients, XML-RPC.

#### Area: REST API (API Reference) — landing https://developer.wordpress.org/rest-api/

custom-endpoint sub-area **v1-SATURATED**. Weak first-area pick.

| Sub-area | URL | v1? |
|---|---|---|
| Key Concepts | https://developer.wordpress.org/rest-api/key-concepts/ | |
| Using the REST API | https://developer.wordpress.org/rest-api/using-the-rest-api/ | |
| Extending the REST API | https://developer.wordpress.org/rest-api/extending-the-rest-api/ | **v1: rest-custom-endpoint (adding-custom-endpoints sub-area)** |
| Reference (endpoints) | https://developer.wordpress.org/rest-api/reference/ | |

#### Area: WP-CLI Commands (API Reference) — landing https://developer.wordpress.org/cli/commands/

Flat alphabetical listing of all WP-CLI commands, each its own page (`wp ability`, `admin`, `block`, `cache`, `cap`, `cli`, `comment`, `config`, `core`, `cron`, `db`, `embed`, `eval`, `export`, `i18n`, `import`, `language`, `media`, `menu`, `network`, `option`, `package`, `plugin`, `post`, `rewrite`, `role`, `scaffold`, `search-replace`, `server`, `shell`, `site`, `super-admin`, `taxonomy`, `term`, `theme`, `transient`, `user`, `widget`, …). Server/CLI tooling. **WEAK first-area pick.**

#### Taxonomy summary (10 top-level areas)

**Documentation (7):** Block Editor, Themes, Plugins, Common APIs, Advanced Administration, Coding Standards, WordPress Playground.
**API Reference (3):** Code Reference, REST API, WP-CLI Commands.

#### Decision (Topic 1)

- **Decision:** Adopt the 10-area taxonomy above as the committed, dated, source-URL-bearing point-in-time snapshot. Area layer is the stable contract; sub-area leaves are the drift-refreshable layer. Each area and major sub-area carries a developer.wordpress.org URL.
- **Rationale:** Covers every top-level area required by R1/AC1 (the 6 named Documentation areas + 3 named API Reference areas + Block Editor and Playground). Traceability and the dated-snapshot framing satisfy R2/AC2. Reorg/legacy-path flags are recorded so future reviews can detect drift.
- **Note for writer:** Common APIs is mid-reorg; some sub-area URLs are legacy `/apis/handbook/` paths confirmed live as of this snapshot. The Code Reference "grouped API reference" index also uses these legacy paths, corroborating that the legacy structure persists.

---

### Topic 2: Catalog file path and shape

- **Spec link:** Requirements R3 (catalog shape), R4 (flat discovery + distinct from iAPI); Acceptance Criteria 3, 4
- **Status:** DECIDED.

**Verified `_candidates.yaml` shape** (read live from `eval/scenarios/_candidates.yaml`): top-of-file comment block then a flat YAML list, grouped by concept via `# === Group ... ===` comment headers. Each record:

```yaml
- name: toggle-visibility-with-bind
  description: <one line>
  difficulty: simple
  concepts: [data-wp-bind, data-wp-context, data-wp-on--click]
  source: docs                       # source-TYPE marker (here: a local Gutenberg docs checkout)
  source_files:
    - docs/reference-guides/interactivity-api/iapi-about.md   # paths relative to that checkout
  prompt: |
    <user-voice, tool-agnostic>
  acceptance:
    - <check>
```

The iAPI catalog's `source: docs` + `source_files: [<relative checkout paths>]` reflects that those scenarios were mined from a local Gutenberg clone. Our scenarios are grounded in **developer.wordpress.org URLs**, so provenance must be URLs.

- **Options (file path/name):**
  1. `eval/scenarios/_wp-dev-candidates.yaml` — leading-underscore file directly under `eval/scenarios/`, beside `_candidates.yaml`. Skillsmith's discovery skips non-directory / leading-underscore entries, so it is not enumerated as a scenario. Distinct filename from the iAPI `_candidates.yaml`.
  2. A path **outside** `eval/scenarios/`, e.g. `eval/wp-dev-candidates.yaml` or `eval/taxonomy/wp-dev-candidates.yaml`. Zero discovery risk, but diverges from the established precedent (the iAPI catalog lives inside `eval/scenarios/`).
  3. Reuse/extend the existing `_candidates.yaml`. **Rejected** — R4/R14/AC4/AC14 require the new artifact be clearly distinct from the iAPI catalog and the existing file not be reorganized.
- **Trade-offs:** Option 1 keeps the catalog co-located with scenarios (matching precedent) and is provably skipped by the same guard that already skips `_candidates.yaml`; the only requirement is a distinct name + header. Option 2 is maximally safe but loses the "catalog sits among scenarios" precedent and the spec explicitly contemplates an in-`eval/scenarios/` placement. Both satisfy the spec; Option 1 is closest to precedent.
- **Decision:** **Option 1 — `eval/scenarios/_wp-dev-candidates.yaml`.** A single committed YAML file. Leading underscore + non-iAPI name satisfies flat-discovery (R4/AC4) and distinctness (R4/AC4) in one move.
- **Shape decision:** Mirror `_candidates.yaml` exactly, **grouped by taxonomy AREA** via `# === Area: <name> ===` comment headers (the iAPI file groups by concept; we group by area, the natural axis here). Per-record keys: `name`, `description`, `difficulty`, `concepts`, `source`, `source_files`, plus `prompt` + `acceptance` **only for the first area's chosen scenarios**; other areas get lighter stubs (name/description/difficulty/concepts/source, prompt+acceptance omitted or marked TODO).
  - **Provenance adaptation:** use `source: dev.wordpress.org` (type marker, distinguishing from the iAPI `source: docs`) and `source_files:` carrying the **developer.wordpress.org URLs** (R8/AC8 require the catalog entry's provenance field to cite the official page(s); URLs are the natural fit since there is no local checkout). The file header records the dated snapshot and the area→URL map.
- **Rationale:** Satisfies R3 (mirrors `_candidates.yaml` record shape; flat list; grouped; ≥ name/description/concepts/source per entry; first-area scenarios fully authored), R4/AC4 (leading-underscore non-directory file under `eval/scenarios/`, distinct name + header from iAPI catalog, skipped by discovery), R14/AC14 (existing `_candidates.yaml` untouched, new file added alongside).
- **Open sub-question logged:** exact `source:` token value — see Open Questions (Q1).

---

### Topic 3: First-area selection

- **Spec link:** Requirements R5 (selection criteria a–f), R6 (~1 scenario per sub-area), R7 (no v1 duplication); Acceptance Criteria 5, 6, 7
- **Status:** DECIDED — **first area = Plugins (Documentation).**

- **Options considered:** Plugins, Common APIs, Themes, Block Editor, REST API, Advanced Administration, WP-CLI, Playground, Coding Standards, Code Reference.
- **Eliminations:**
  - **Block Editor** — block-/JS-centric (needs built blocks, heavier than a single `index.php` edit; fails criterion c "single scaffolded-plugin edit"); iAPI portion saturated. Out.
  - **REST API** — its implementable sub-area (custom endpoints) is v1-saturated. Out (spec names it a weak pick).
  - **Coding Standards** — 100% prose/advice → judge-only by nature, can't exercise the mixed e2e bar (criterion d). Out (spec names it weak).
  - **Advanced Administration / WP-CLI / Playground** — niche server-ops/tooling, not a plugin-feature domain (criteria c, d, f weak). Out (spec names all three weak).
  - **Themes** — mostly file-convention / `theme.json` / template work, not naturally a single scaffolded-*plugin* edit (the harness scaffolds a plugin). Weak on criterion c. Out.
  - **Common APIs** — strong on foundational/data-primitive grounds BUT overlaps Plugins heavily (Hooks, Shortcode, Metadata, Settings, Options dual-documented) and is mid-reorg (legacy `/apis/handbook/` URLs → criterion e drift-stability weaker). Runner-up, not chosen.
- **Decision:** **Plugins.**
- **Justification against R5 criteria (a)–(f):**
  - **(a) Non-saturation** — 18 chapters; only 3 sub-areas are v1-covered (Hooks https://developer.wordpress.org/plugins/hooks/, Shortcodes https://developer.wordpress.org/plugins/shortcodes/, Custom Post Types https://developer.wordpress.org/plugins/post-types/). ~15 uncovered chapters remain — far more than enough to host ~1 scenario each. (REST custom endpoints, the 4th v1 sub-area, lives under the REST API area, not Plugins.)
  - **(b) Foundational / broad applicability** — at least two chosen sub-areas are prerequisites reused across other areas: **Metadata** (https://developer.wordpress.org/plugins/metadata/) underpins CPTs, REST responses, the Block Editor's post meta, and Settings; **Taxonomies** (https://developer.wordpress.org/plugins/taxonomies/) underpin content modeling reused by Themes (template hierarchy), REST (taxonomy routes), and the Block Editor (query/term selectors). **Settings/Options** (https://developer.wordpress.org/plugins/settings/) is a primitive reused by virtually every plugin and surfaced through REST.
  - **(c) Simple-scaffoldable** — each chosen sub-area is a one-concept / one-small-feature `index.php` edit on the existing block scaffold (register a taxonomy; register a post meta; register a setting; schedule a cron event; add an admin menu page; wrap strings in `__()`). No block build required. Same model as the v1 non-block scenarios.
  - **(d) E2e-feasible** — at least three sub-areas have clean v1-grade e2e: **Taxonomies** (anon REST 200 at `/wp/v2/<rest_base>`), **Metadata** (post `.meta` via REST), **Settings** (authenticated `/wp/v2/settings`). Comfortably satisfies "at least some sub-areas observable in a booted `wp-env` site."
  - **(e) Documentation-grounded and drift-stable** — every chosen sub-area traces to a stable `developer.wordpress.org/plugins/<chapter>/` handbook page (the Plugins handbook is a long-stable structure, unlike Common APIs which is mid-reorg).
  - **(f) Tool-agnostic-promptable** — each sub-area is expressible as a user-voice, outcome-phrased request (e.g. "let editors group my posts into named collections" for taxonomies; "store and expose an extra field on my posts" for metadata) without naming the API/function.
- **No v1 duplication (R7/AC7):** chosen sub-areas (Taxonomies, Metadata, Settings, Cron, i18n, Administration Menus) are each distinct at the sub-area level from Hooks/Filters, Shortcodes, Custom Post Types, REST custom endpoints. Taxonomies ≠ Custom Post Types (distinct chapters/registration functions) — checked explicitly.

---

### Topic 4: First-area scenarios (names, prompts, acceptance, e2e vs judge-only)

- **Spec link:** Requirements R6, R8, R9, R10, R11, R12; Acceptance Criteria 6, 8, 9, 10, 11, 12
- **Status:** DECIDED — 6 scenarios (3 e2e + 3 judge-only). Per-scenario grounding URLs + exact assertion strings requested from researcher to finalize prompts/acceptance for the catalog.

**Which Plugins sub-areas become scenarios (R6 "~1 per major uncovered sub-area"):**

The Plugins handbook has 18 chapters. Subtract the 3 v1-covered (Hooks, Shortcodes, Custom Post Types) and the 5 non-feature/meta chapters that are not "one small feature" tasks — Introduction, Plugin Basics, Plugin Directory (wordpress.org submission process), Developer Tools (debugging tooling), and Plugin Security (cross-cutting advice, not a single feature). That leaves these **major implementable feature sub-areas**: Settings, Metadata, Taxonomies, Users, HTTP API, Cron, Internationalization, Privacy, Administration Menus, JavaScript/jQuery/Ajax.

**Selected 6 (one simple scenario each), balanced across the e2e/judge mix (R11):**

| # | Scenario dir (= `name`) | Sub-area | Chapter URL | Verify | e2e channel |
|---|---|---|---|---|---|
| 1 | `taxonomy-register` | Taxonomies | https://developer.wordpress.org/plugins/taxonomies/ | **e2e** | [A] anon REST 200 at `/wp-json/wp/v2/<rest_base>` |
| 2 | `post-meta-rest` | Metadata | https://developer.wordpress.org/plugins/metadata/ | **e2e** | [A/B] seed post + read `.meta.<key>` via REST |
| 3 | `settings-register` | Settings | https://developer.wordpress.org/plugins/settings/ | **e2e** | [B] auth `requestUtils.getSiteSettings()` / `/wp/v2/settings` |
| 4 | `cron-event` | Cron | https://developer.wordpress.org/plugins/cron/ | judge-only | — (no clean REST/DOM; scheduling is time-flaky) |
| 5 | `i18n-textdomain` | Internationalization | https://developer.wordpress.org/plugins/internationalization/ | judge-only | — (en_US shows source strings; nothing observable) |
| 6 | `admin-menu-page` | Administration Menus | https://developer.wordpress.org/plugins/administration-menus/ | judge-only | — (admin-only UI; admin-DOM nav too heavy for a "simple" e2e) |

**Why these 6 and not more / fewer:**
- Covers the **major** implementable sub-areas with a clean e2e/judge split (3 + 3), satisfying R11's mixed-verification preference (provide e2e where feasible; judge-only where impractical) and R6 (~1 per major uncovered sub-area).
- **Deliberately excluded** (recorded so phase 4 doesn't second-guess): **Users** (a *simple* one-concept slice is fuzzy to scope — roles/caps/meta sprawl; medium feasibility), **HTTP API** (judge-only AND inherently outbound → a testable inbound surface would be contrived/multi-concept, violating "one small feature"), **JavaScript/jQuery/Ajax** (overlaps Block-Editor/iAPI territory, awkward as a non-block `index.php` edit, and admin-ajax patterns are dated), **Privacy** (admin-Tools-only surface, niche, heavy). These remain in the catalog as lighter stubs (R3 allows lighter entries for not-implemented sub-areas) but are not implemented this review. This keeps the batch simple and high-quality, consistent with the spec's "keep scenarios simple" mandate and the v1 batch size (4).
- Net: **6 implemented scenarios** — comparable to v1's 4, "roughly one per major sub-area," no multi-feature/multi-step tasks.

**Per-scenario design (prompts/acceptance to be finalized with researcher grounding):**

Each follows v1 conventions exactly: dir = `name` (kebab, `/^[a-z0-9-]+$/`); `scenario.yaml` with `name`, `description`, `skills: [wordpress-development]`, `prompt` (user-voice, tool-agnostic), `acceptance` (scenario-unique checks, NO embedded URLs), `rubrics: []`. e2e scenarios add `e2e.spec.mjs` with the v1 lifecycle (`beforeAll`: `deactivateAllPlugins()` then `activatePlugin('plugin-<name>-${agentId}')`; `afterAll`: `deactivateAllPlugins()` + cleanup). Every literal the e2e asserts (taxonomy `rest_base`, meta key, option name) is pinned in that scenario's `prompt` (R11/AC11 lockstep).

1. **`taxonomy-register`** (e2e) — Outcome prompt: let editors group/label posts into a named set of terms (e.g. a "genre" classification), reachable via the site's data API. Pin the public route segment the e2e asserts. Acceptance (judge): `register_taxonomy()` on `init`; attached to a post type; `public => true` + `show_in_rest => true`; identifier ≤ 32 chars; labels with `__()`. e2e: anon `page.request.get('/wp-json/wp/v2/<rest_base>')` → 200.
2. **`post-meta-rest`** (e2e) — Outcome prompt: store an extra piece of information on each post (e.g. a subtitle) and have it available through the site's data API. Pin the meta key. Acceptance (judge): `register_post_meta()` on `init`; `show_in_rest => true`; `single => true`; `type` set; `auth_callback` where appropriate. e2e: `requestUtils.createPost` seeding `meta`, then read `/wp-json/wp/v2/posts/<id>` → assert `.meta.<key>` present.
3. **`settings-register`** (e2e) — Outcome prompt: add a site-wide configurable option editors can set, available through the site's data API. Pin the option name. Acceptance (judge): `register_setting()` with `show_in_rest => true`; registered on `init`/`rest_api_init` (not only `admin_init`) so it surfaces in REST; `type`/`default`/`sanitize_callback` set. e2e: authenticated `requestUtils.getSiteSettings()` or `rest({path:'/wp/v2/settings'})` → assert option key present.
4. **`cron-event`** (judge-only) — Outcome prompt: run a recurring background task (e.g. daily cleanup) automatically. Acceptance (judge): schedules via `wp_schedule_event()` guarded by `wp_next_scheduled()` (no duplicate scheduling); hooked to a named action with a callback; uses a valid recurrence (`hourly`/`daily`/etc) or registers a custom schedule; clears on deactivation (`wp_clear_scheduled_hook()` in a deactivation hook). No e2e (time-dependent/flaky).
5. **`i18n-textdomain`** (judge-only) — Outcome prompt: make all of the plugin's user-facing text ready to be translated into other languages. Acceptance (judge): user-facing strings wrapped in `__()`/`_e()`/`esc_html__()` with the plugin's text domain; text domain matches the plugin slug; `load_plugin_textdomain()` called on `init` (or relies on auto-loading for WP ≥ 4.6 directory plugins, noted); no variables as the text-domain/string argument. No e2e.
6. **`admin-menu-page`** (judge-only) — Outcome prompt: add a settings/admin screen for the plugin reachable from the WordPress dashboard. Acceptance (judge): `add_menu_page()` (or `add_submenu_page`/`add_options_page`) on the `admin_menu` action; a `capability` (e.g. `manage_options`) set; a slug and a render callback that outputs escaped markup; no output produced outside the callback. Judge-only (admin-UI; admin-DOM nav too heavy for a simple e2e — recorded as deliberate per R11 "where impractical").

**Catalog depth (R3):** these 6 get fully-authored `prompt` + `acceptance` in `_wp-dev-candidates.yaml`. Every other area + the un-implemented Plugins sub-areas get lighter stubs (name/description/difficulty/concepts/source).

**Name/path collision check (verified live):** all 6 directory names and `eval/scenarios/_wp-dev-candidates.yaml` are free of collisions with existing `eval/scenarios/` entries.

#### Per-scenario doc grounding (researcher, live-verified; doc-verbatim facts)

> Provenance lives in the catalog entry's `source_files` (URLs), NOT in `scenario.yaml` acceptance strings (R8/AC8). Acceptance strings stay clean check statements.

**1. `taxonomy-register` (e2e, channel A)** — `register_taxonomy($taxonomy, $object_type, $args)` on `init`.
- URLs: https://developer.wordpress.org/plugins/taxonomies/working-with-custom-taxonomies/ ; https://developer.wordpress.org/reference/functions/register_taxonomy/
- Facts: "Do not use before the init hook"; key "Must not exceed **32 characters**" (⚠ **32, not 20** — CPT is 20, taxonomy is 32; do NOT copy `cpt-register`'s 20); `show_in_rest` "Default: false" → set true; `rest_base` "Default is $taxonomy"; 2nd arg = object type(s) to attach, e.g. `['post']`; if labels empty, `name`←label / `singular_name`←name.
- Acceptance (judge): `register_taxonomy()` on `init`; attached to `post`; `public => true` + `show_in_rest => true`; key ≤ 32 chars, lowercase/dash/underscore only; labels (`name`/`singular_name`) wrapped in `__()`.
- e2e: anon `page.request.get('/wp-json/wp/v2/<rest_base>')` → 200 even with ZERO terms (empty `[]` is valid). Pin the taxonomy slug (e.g. `genre`) in the prompt.

**2. `post-meta-rest` (e2e, channel A/B)** — `register_post_meta($post_type, $meta_key, $args)` (preferred; wraps `register_meta`) on `init`.
- URLs: https://developer.wordpress.org/plugins/metadata/managing-post-metadata/ ; https://developer.wordpress.org/reference/functions/register_post_meta/ ; https://developer.wordpress.org/rest-api/extending-the-rest-api/modifying-responses/
- Facts: signature `register_post_meta(string $post_type, string $meta_key, array $args): bool`; args defer to `register_meta` (`type`, `single`, `show_in_rest`, `default`, `sanitize_callback`, `auth_callback`); REST doc: "By setting `'show_in_rest' => true` … that key will be accessible through the REST API" and appears under the post's `.meta`; **target core `post` type** (already supports `custom-fields`); use a **public (no leading underscore) key** so it surfaces (underscore-prefixed = protected/hidden).
- Acceptance (judge): `register_post_meta()` on `init`; `single => true`; `type` set; `show_in_rest => true`; public meta key (no leading `_`).
- e2e: `beforeAll` seeds a published post via `requestUtils.createPost` (admin-auth); read `/wp-json/wp/v2/posts/<id>` and assert `.meta.<key>` present (scalar, since `single => true`). Deterministic: a registered `show_in_rest` single meta is always present under `.meta` (with its default) once registered. Pin the meta key in the prompt.

**3. `settings-register` (e2e, channel B — AUTH only)** — `register_setting($option_group, $option_name, $args)`; Options API storage.
- URLs: https://developer.wordpress.org/plugins/settings/settings-api/ ; https://developer.wordpress.org/plugins/settings/options-api/ ; https://developer.wordpress.org/reference/functions/register_setting/
- Facts: args include `sanitize_callback` and `show_in_rest`; `show_in_rest` "Whether data associated with this setting should be included in the REST API" → exposes the option at `/wp-json/wp/v2/settings`; ⚠ **timing caveat (harness-mechanics, well-established, not one verbatim sentence):** `register_setting` is usually hooked on `admin_init`, but to surface in REST it must ALSO be registered at `rest_api_init` — common pattern is to register on **`init`** (fires before both) or on both `admin_init`+`rest_api_init`. A real acceptance point.
- Acceptance (judge): `register_setting()` with `show_in_rest => true`; registered so it surfaces in REST (on `init` or `rest_api_init`, NOT only `admin_init`); `type`/`default`/`sanitize_callback` set.
- e2e: AUTH only (`/wp/v2/settings` is admin-gated; anon returns filtered/empty). Use `requestUtils.getSiteSettings()` or `requestUtils.rest({path:'/wp/v2/settings'})` and assert the registered option key present (= its `default`). Deterministic: a `show_in_rest` setting with a `default` returns that default even before any save. Pin `option_name` + default in the prompt.

**4. `cron-event` (judge-only)** — `wp_next_scheduled` (guard) + `wp_schedule_event` + cleanup on deactivation.
- URLs: https://developer.wordpress.org/plugins/cron/ ; https://developer.wordpress.org/plugins/cron/scheduling-wp-cron-events/ ; https://developer.wordpress.org/plugins/cron/understanding-wp-cron-scheduling/
- Facts: "if you call `wp_schedule_event()` multiple times … the event will be scheduled multiple times" → MUST guard with `wp_next_scheduled()` first. Canonical: `if ( ! wp_next_scheduled( 'hook' ) ) { wp_schedule_event( time(), 'hourly', 'hook' ); }`. ⚠ **CORRECTION:** doc's recommended cleanup is `wp_unschedule_event()` inside `register_deactivation_hook()`, **not** `wp_clear_scheduled_hook()` (the latter also works and is widely used). Acceptance should phrase: "unschedules on deactivation (`register_deactivation_hook` + `wp_unschedule_event` / `wp_clear_scheduled_hook`)." ⚠ Custom intervals require the `cron_schedules` filter; **use built-in `hourly`** to avoid needing it.
- Acceptance (judge): schedules via `wp_schedule_event()` guarded by `wp_next_scheduled()` (no duplicate scheduling); a named action hook with a callback; valid built-in recurrence (`hourly`); unschedules on deactivation.
- No e2e (async + time-based). Optional channel-C `wpCli(['cron','event','list'])` exists but adds an unused shell-out → keep judge-only.

**5. `i18n-textdomain` (judge-only)** — `__()`/`_e()`/`esc_html__()` + text domain = plugin slug.
- URLs: https://developer.wordpress.org/plugins/internationalization/ ; https://developer.wordpress.org/plugins/internationalization/how-to-internationalize-your-plugin/ ; https://developer.wordpress.org/plugins/internationalization/localization/
- Facts: "The text domain must match the slug of the plugin"; "Do not use variable names or constants for the text domain portion of a gettext function" → domain AND string args must be **literals**; canonical `__( 'Blog Options', 'my-plugin' )`; header `Text Domain: my-plugin`. ⚠ **CORRECTION:** "Since WordPress 4.6 … translate.wordpress.org as priority" → for plugins hosted on WordPress.org, translations auto-load and `load_plugin_textdomain()` is **NOT required**. Do NOT make `load_plugin_textdomain` a hard acceptance check — phrase as optional/best-practice.
- Acceptance (judge, HARD): user-facing strings wrapped in `__()`/`_e()`/`esc_html__()`; text-domain **literal** equal to the plugin slug; `Text Domain` header present; no variable/constant as the text-domain or string argument. (Soft/optional: `load_plugin_textdomain()` on `init`.)
- No e2e (en_US renders source strings unchanged; nothing observable without a shipped `.mo`).

**6. `admin-menu-page` (judge-only)** — `add_menu_page` (or `add_submenu_page`/`add_options_page`) on `admin_menu`.
- URLs: https://developer.wordpress.org/plugins/administration-menus/ ; https://developer.wordpress.org/plugins/administration-menus/top-level-menus/ ; https://developer.wordpress.org/plugins/administration-menus/sub-menus/
- Facts: "The registration needs to occur during the `admin_menu` action hook"; signature `add_menu_page($page_title,$menu_title,$capability,$menu_slug,$callback,$icon_url,$position)`; capability example `manage_options`; callback "output HTML wrapped in `<div class='wrap'>`"; canonical `add_action('admin_menu', 'wporg_options_page')`.
- Acceptance (judge): registers via `add_menu_page()`/`add_submenu_page()`/`add_options_page()` on `admin_menu`; a `capability` (e.g. `manage_options`) set; a `menu_slug` and a render callback that outputs escaped markup; no output produced outside the callback.
- No e2e by default (admin-only UI; e2e DOABLE via authed `page.goto('/wp-admin/admin.php?page=<slug>')` + heading locator but heavier/flakier; recommend judge-only to keep the e2e set = the clean 3). If phase 4 elects e2e: pin `menu_slug` + a heading literal in the prompt and assert no "insufficient permissions".

#### Decision (Topic 4)

- **Decision:** Implement the 6 scenarios above — `taxonomy-register`, `post-meta-rest`, `settings-register` (e2e); `cron-event`, `i18n-textdomain`, `admin-menu-page` (judge-only). All grounded, no v1 sub-area duplication, all foundational Plugins chapters, all one-concept/one-small-feature `index.php` edits.
- **Rationale:** Satisfies R6 (~1 per major uncovered sub-area), R7/AC7 (no v1 sub-area dup), R8/AC8 (doc-grounded, provenance in catalog, user-voice tool-agnostic prompts), R9 (schema-conformant), R11/AC11 (e2e where feasible w/ pinned literals + v1 lifecycle; judge-only where impractical), R12/AC12 (discoverable + e2e-loadable; not required to pass).
- **Phase-4 flags (most likely to be mis-authored):** (1) taxonomy key length = **32** not 20; (2) settings `register_setting` must run at `rest_api_init`/`init`, not only `admin_init`, to surface in REST; (3) cron cleanup = `wp_unschedule_event` via `register_deactivation_hook` (or `wp_clear_scheduled_hook`); (4) i18n `load_plugin_textdomain` is optional (auto-load since WP 4.6), so don't make it a hard check; (5) every e2e-asserted literal (taxonomy slug, meta key, option name + default) must be pinned in that scenario's prompt (R11/AC11 lockstep).

---

### Topic 5: Shared rubrics decision

- **Spec link:** Requirement R10 (zero rubrics default); Acceptance Criterion 10
- **Status:** DECIDED — **zero new shared rubrics.** Every scenario declares `rubrics: []`.

- **Analysis of cross-cutting checks across the 6 scenarios:**
  - **"Register on the right hook" (`init`/`admin_menu`/`rest_api_init`/`admin_init`)** recurs, BUT the *specific* hook differs per scenario (taxonomy/meta → `init`; settings → `init`+`rest_api_init`; cron callback → a named custom action; admin menu → `admin_menu`). A single rubric text would fragment into per-scenario phrasings — same problem the v1 design hit with "return, don't echo." Stays in each `acceptance`.
  - **`show_in_rest => true`** recurs across only 3 of 6 (taxonomy, meta, settings) and in a scenario-specific role each time (creates a public route / surfaces meta / surfaces an option). Not uniform enough; each acceptance states it precisely.
  - **Escaping / i18n (`__()`, `esc_html`)** — i18n is the *whole point* of `i18n-textdomain` (belongs in its acceptance, not a shared rubric that would then be duplicated there — which R10/AC10 forbids); escaping is only incidentally relevant to `admin-menu-page`. Not cross-cutting in the same form.
- **Decision:** Add **no** files under `eval/rubrics/`. Each scenario carries its checks in `acceptance` and declares `rubrics: []` (explicit empty array — required for discovery per `isScenarioShape`; an omitted/null `rubrics` fails discovery). Mirrors the v1 outcome exactly.
- **Rationale:** No single check recurs in the *same form* across all (or even most) scenarios the way the iAPI best-practices rubric uniformly applies to all 11 iAPI scenarios. R10 explicitly permits zero rubrics when no genuinely cross-cutting shared check emerges; adding a catch-all would risk duplicating per-scenario acceptance points (forbidden by R10/AC10) or being too vague to help the judge.
- **Skill-untouched confirmation (R13/AC13):** This review adds only scenario directories + the catalog file. No file under `skills/wordpress-development/` is touched. No rubric added. Existing scenarios + `_candidates.yaml` untouched (R14/AC14).

---

## Open Questions

- **Q1 (catalog `source:` token, phase 4 detail).** The iAPI catalog uses `source: docs`. Our catalog should use a value that signals official-site grounding (proposed `source: dev.wordpress.org`). Exact token is a phase-4 cosmetic choice; the load-bearing constraint is that `source_files` carry developer.wordpress.org URLs (R8/AC8). Not blocking.
- **Q2 (discovery-guard exact predicate) — RESOLVED.** Researcher confirmed verbatim at pinned SHA `6bd90c34d88b815fdf4fd661dc8c51288111444c` (matches the skillsmith dep pin in `package.json`). `enumerate.ts` loop: `if (!isDirectorySafe(dir)) continue;` (guard A — skip non-directories) runs BEFORE `if (!existsSync(yamlPath)) continue;` (guard B). A leading-underscore **non-directory file** `eval/scenarios/_wp-dev-candidates.yaml` is skipped by guard A — identical to how `_candidates.yaml` coexists today. **Load-bearing nuance:** it is the non-directory-ness that saves it, not the underscore (a *directory* named `_foo` WITH a `scenario.yaml` WOULD be discovered). → Catalog must be a flat FILE, never a directory. Decision in Topic 2 stands and is safe.

## Risks

- **Common APIs reorg drift (LOW).** Several Common APIs sub-area URLs are legacy `/apis/handbook/` paths; the handbook is mid-migration. Recorded as a snapshot caveat (R2 explicitly frames the leaf layer as drift-refreshable). Does not affect the first-area pick if the first area is not Common APIs.
- **Block-scaffold nudges block work (INHERITED from v1).** The scaffold writes a block; non-block scenarios add PHP to `index.php`. Same mitigation as v1 (outcome-focused prompts). Applies to any non-block first-area scenarios.
