# Code Summary: Themes scenarios

## What

Three Themes-area evaluation scenarios added to the Skillsmith eval suite under `eval/scenarios/`, plus a catalog reconciliation:

- `eval/scenarios/themes-enqueue-assets/` — `scenario.yaml` + `e2e.spec.mjs`. Asks the agent to load a stylesheet and script on the front end under the shared handle `themes-frontend-assets`; asserts `link#themes-frontend-assets-css` and `script#themes-frontend-assets-js` are attached after `page.goto("/")`.
- `eval/scenarios/themes-nav-menu-location/` — `scenario.yaml` only (judge-only). Asks the agent to register a navigation-menu location with slug `primary` and a translatable label on the theme-setup hook.
- `eval/scenarios/themes-sidebar-widget-area/` — `scenario.yaml` only (judge-only). Asks the agent to register a sidebar / widget area with id `themes-sidebar-1`, translatable name `Theme Sidebar`, and before/after widget wrappers on the widgets-init hook.
- `eval/scenarios/_wp-dev-candidates.yaml` — Themes section promoted: `classic-theme-enqueue-scripts` stub renamed and promoted to a full `themes-enqueue-assets` record; `themes-nav-menu-location` and `themes-sidebar-widget-area` full records added under a new sub-header; `theme-json-custom-color-palette` stub annotated `# Deferred:`; header line updated to list Themes.

## Why

The `wordpress-development` skill had no Themes-area coverage. This batch adds the three plugin-expressible Themes sub-areas (front-end asset enqueue, navigation-menu location, sidebar / widget area), bringing the eval suite's Themes coverage from zero to three scenarios. The batch is deliberately small because most of the Themes handbook is theme-artifact-bound (theme.json, block templates, template hierarchy, classic template files, style.css) and the Skillsmith scaffold builds a plugin, not a theme.

## How

All three scenarios follow the established Skillsmith conventions: flat immediate child of `eval/scenarios/`, schema-conformant `scenario.yaml` (name == directory name == catalog record name, `rubrics: []`, no catalog-only fields, tool-agnostic prompt, URL-free acceptance). The e2e scenario follows the `filter-body-class` lifecycle verbatim (synchronous `deactivateAllPlugins()`, `requestUtils.activatePlugin` with slug derived from `workerInfo.project.metadata.agentId`, `page.goto("/")`, `toBeAttached()` assertion). The two judge-only scenarios mirror the existing `cron-event` / `admin-menu-page` / `i18n-textdomain` pattern.

## Key decisions

- **Feasibility-driven smaller batch (one e2e + two judge-only).** Only sub-areas that are plugin-expressible via global hooks were candidates. Of those, only front-end asset enqueue yields a clean, theme-independent, front-end-visible assertion; nav-menu location and sidebar produce no front-end output without a theme template, so they are judge-only. This is explicitly permitted by the intent.
- **Single shared handle `themes-frontend-assets` for both style and script.** `WP_Styles` and `WP_Scripts` are separate registries — the same handle string does not collide — and a single handle keeps the prompt to one pinned literal driving both the `-css` and `-js` ids.
- **`$src` gotcha baked into prompt and acceptance.** The prompt asks the agent to load actual files (not merely register handles); acceptance requires assets to be enqueued with a source. Without this, a register-only implementation would emit no `<link>`/`<script>` tag and the e2e assertion would fail.
- **Theme-scaffold harness change surfaced as a future recommendation.** The deferred sub-areas (theme.json, block templates, template hierarchy, classic template files, style.css) would be unblocked if Skillsmith could scaffold a theme in addition to a plugin. This is recorded as a future out-of-scope recommendation, not implemented.

## Known limitations

- **Most of Themes is deferred.** Theme-artifact-bound sub-areas (theme.json, block templates, template parts, template hierarchy, classic template files, custom-header/background, style.css) cannot be scaffolded by the current harness, which builds only a plugin. A theme-scaffold harness change is the single lever that would unblock them.
- **Judge-only scenarios are not front-end-verified.** `themes-nav-menu-location` and `themes-sidebar-widget-area` are graded solely by an LLM judge against the produced PHP, because rendering the registered nav-menu location or sidebar requires a theme template (`wp_nav_menu()` / `dynamic_sidebar()`), which the plugin scaffold cannot ship.
- **Scenarios are not required to pass against the current skill.** Per the spec, the bar is static/structural only (discoverable + e2e-collectable). A failing grade against the current skill is acceptable; the skill catches up in later work.
