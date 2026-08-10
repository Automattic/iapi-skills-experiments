# Code Summary: Exhaustive WordPress-development scenario taxonomy + first-area (Plugins) scenarios

## What

Seven new files were added to `eval/scenarios/` — six scenario directories for the Plugins area and one candidate catalog — without touching the existing skill, rubrics, or any prior scenario:

- `eval/scenarios/taxonomy-register/` — `scenario.yaml` + `e2e.spec.mjs` (Taxonomies; asserts anon REST 200 at `/wp-json/wp/v2/genre`)
- `eval/scenarios/post-meta-rest/` — `scenario.yaml` + `e2e.spec.mjs` (Metadata; seeds a post and asserts `.meta.subtitle` present via REST)
- `eval/scenarios/settings-register/` — `scenario.yaml` + `e2e.spec.mjs` (Settings; asserts `my_plugin_tagline` equals `Hello world` via authenticated `getSiteSettings()`)
- `eval/scenarios/cron-event/` — `scenario.yaml` only (Cron; judge-only)
- `eval/scenarios/i18n-textdomain/` — `scenario.yaml` only (Internationalization; judge-only)
- `eval/scenarios/admin-menu-page/` — `scenario.yaml` only (Administration Menus; judge-only)
- `eval/scenarios/_wp-dev-candidates.yaml` — committed candidate catalog covering all 10 top-level developer.wordpress.org areas

## Why

The `wordpress-development` skill evaluation suite previously covered only a small slice of the WordPress-development domain (4 v1 scenarios + the iAPI suite) with no organizing map of coverage. This run establishes that backbone by delivering (1) an exhaustive 10-area reference taxonomy, reproduced as a dated point-in-time snapshot in the design doc; (2) the candidate catalog at `_wp-dev-candidates.yaml` as a committed planning artifact for all areas; and (3) six concrete scenario definitions for the Plugins area — the first foundational area picked against the spec's six selection criteria.

## How

Each scenario follows the exact pattern set by the `counter` and v1 scenarios. The three e2e scenarios (taxonomy-register, post-meta-rest, settings-register) ship a `e2e.spec.mjs` that hooks into the existing `verify-e2e.ts` harness: `beforeAll` deactivates all plugins and activates the scaffolded plugin for the current agent, the single test asserts one runtime-observable outcome via the REST API, and `afterAll` cleans up. The three judge-only scenarios (cron-event, i18n-textdomain, admin-menu-page) ship only `scenario.yaml`; they are graded by the LLM judge against their acceptance lists. The catalog is a leading-underscore non-directory file beside `_candidates.yaml`; Skillsmith's flat discovery guard skips it before the YAML-existence check. Every asserted literal (`genre`, `subtitle`, `my_plugin_tagline`/`Hello world`) is pinned in the corresponding prompt so the prompt and e2e assertion stay in lockstep.

## Key decisions

- **First area: Plugins** — selected over Common APIs and all weak picks because it simultaneously satisfies the spec's six criteria: non-saturated (15+ uncovered chapters), foundational (Metadata/Taxonomies/Settings underpin many other areas), simple-scaffoldable (all six are single `index.php` edits), e2e-feasible (three clean REST assertions), documentation-grounded (stable handbook), and tool-agnostic-promptable.
- **3 e2e + 3 judge-only** — Taxonomies/Metadata/Settings have clean, deterministic REST assertions using v1-proven anon/authenticated channels; Cron (async/time-dependent), i18n (nothing observable in en_US), and Administration Menus (admin-only DOM) are kept judge-only per the spec's "where impractical" allowance.
- **Taxonomy key cap at 32, not 20** — explicitly corrected relative to `cpt-register`'s CPT-key limit.
- **`load_plugin_textdomain` omitted from i18n acceptance** — since WP 4.6, WP.org-hosted plugins auto-load translations; the function is optional and must not be a hard check.
- **Settings must hook on `init` or `rest_api_init`** — registering only on `admin_init` would prevent the setting from surfacing in the REST API; acceptance point 2 makes this a hard check.
- **Zero new rubrics** — no check recurs in the same form across all six scenarios; every scenario carries its checks in `acceptance` with `rubrics: []` as the explicit empty array required by Skillsmith's `isScenarioShape`.
- **Documentation provenance in catalog, not in scenario.yaml** — `source`/`source_files` live in `_wp-dev-candidates.yaml`; acceptance strings in `scenario.yaml` are clean, human-readable, URL-free.

## Known limitations

- **Static/structural verification only.** Scenarios were verified for Skillsmith discoverability (schema validity) and e2e spec parseability (`node --check`). No agent booted `wp-env`, ran the full `scenarios × testing-agents` matrix, or generated plugin code. A failing grade against the current skill is expected and acceptable per spec Requirement 12.
- **Catalog stubs for nine areas.** Only the six Plugins scenarios carry full `prompt`+`acceptance`; the other nine areas (and four deferred Plugins sub-areas — Users, HTTP API, JavaScript/Ajax, Privacy) are lighter stubs without authored prompts. Full authoring is deferred to follow-up reviews.
- **Common APIs reorg drift.** Several Common APIs sub-area URLs in the taxonomy and catalog are legacy `/apis/handbook/` paths confirmed live as of the 2026-06-18 snapshot; this area is mid-migration and the leaf-layer URLs may need refresh in a future run.
- **WordPress Playground collapsed to one row.** The entire `/playground/*` path space on developer.wordpress.org redirects off-site; there are no individually-addressable sub-area pages, so the taxonomy records it as a single collapsed entry.
