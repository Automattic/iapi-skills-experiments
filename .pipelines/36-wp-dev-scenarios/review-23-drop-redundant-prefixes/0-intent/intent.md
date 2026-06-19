# Review: drop redundant folder-name prefixes from scenario names

## Origin

Owner: *"Many of the subfolders have the name of the parent folder. Let's remove that (e.g. abilities, block-editor, coding-standards). Review all the folders to avoid redundancy."* This is the prefix-drop rename pass flagged as deferred in review-10 (prefixes were kept then for slug stability; "a future review can drop them in a dedicated rename pass").

## Goal

Rename scenarios whose name redundantly repeats their topic folder, so e.g. `block-editor/block-editor-block-patterns` → `block-editor/block-patterns`. Mechanical, value-preserving (prompts/acceptance unchanged).

## Rule applied

- **Strip the exact `<folder>-` prefix** where the scenario name starts with it (32 scenarios).
- **Partial-overlap calls (5):** rename the abilities-api + rest-api ones whose leading token duplicates the folder's distinctive root (for within-folder consistency); KEEP the two block-editor ones whose redundant token would be `block-editor-` (absent — `block-api`/`block-filter` are meaningful and the renamed siblings also become `block-*`).
- Scenarios with no overlap are untouched (e.g. `plugins/cpt-register`, `interactivity-api/counter`, `plugins/ajax-handler`).
- **No name collisions** result (verified).

## The authoritative rename map (35 renames; `[e2e]` = also update the hardcoded `plugin-<name>-` slug)

abilities-api: `abilities-api-register`→`register` [e2e], `abilities-audit-rest-surface`→`audit-rest-surface`, `abilities-verify-callbacks`→`verify-callbacks`
block-editor: `block-editor-block-bindings`→`block-bindings`, `block-editor-block-filters`→`block-filters` [e2e], `block-editor-block-patterns`→`block-patterns` [e2e], `block-editor-block-styles`→`block-styles` [e2e], `block-editor-block-supports`→`block-supports` [e2e], `block-editor-block-variations`→`block-variations`, `block-editor-dynamic-block`→`dynamic-block` [e2e], `block-editor-inner-blocks`→`inner-blocks`
code-reference: `code-reference-hook-lookup`→`hook-lookup`
coding-standards: `coding-standards-inline-docs`→`inline-docs`, `coding-standards-php`→`php`
common-apis: `common-apis-http-request`→`http-request`, `common-apis-options`→`options`, `common-apis-rewrite-rule`→`rewrite-rule` [e2e], `common-apis-transients`→`transients`
performance: `performance-autoloaded-options`→`autoloaded-options`, `performance-object-cache`→`object-cache`
phpstan: `phpstan-baseline`→`baseline`
playground: `playground-blueprint-plugin-load`→`blueprint-plugin-load`
plugin-directory: `plugin-directory-review`→`review`
project-triage: `project-triage-report`→`report`
rest-api: `rest-api-authentication-nonce`→`authentication-nonce`, `rest-api-custom-field-on-post`→`custom-field-on-post` [e2e], `rest-api-permission-check`→`permission-check` [e2e], `rest-api-route-validation`→`route-validation` [e2e], `rest-custom-endpoint`→`custom-endpoint` [e2e]
themes: `themes-enqueue-assets`→`enqueue-assets` [e2e], `themes-nav-menu-location`→`nav-menu-location`, `themes-sidebar-widget-area`→`sidebar-widget-area`
wordpress-router: `wordpress-router-classify`→`classify`
wp-cli: `wp-cli-custom-command`→`custom-command` [e2e]
wpds: `wpds-component-ui`→`component-ui`

**KEEP (no rename):** `block-editor/block-api-static-block`, `block-editor/block-filter-add-custom-attribute`, and the 25 no-overlap scenarios.

## Per-rename update checklist

For each rename: (1) `git mv` the directory; (2) update `scenario.yaml` `name:`; (3) update the catalog record's `- name:` in `_wp-dev-candidates.yaml`; (4) for `[e2e]` ones, update the hardcoded plugin slug `plugin-<old>-` → `plugin-<new>-` in `e2e.spec.mjs`. Prompts/acceptance are **value-unchanged** (so catalog↔scenario verbatim match still holds).

## Constraints / verification

- Skill untouched; iAPI `_candidates.yaml` untouched; prompts/acceptance/descriptions unchanged. Do NOT edit `.pipelines/**` historical artifacts.
- Verify: no leftover old dir names; every `scenario.yaml` `name` == its dir name and matches `/^[a-z0-9-]+$/`; catalog has no old names, no duplicates, and each record's prompt/acceptance still matches its scenario.yaml; every renamed `[e2e]` spec's `plugin-<new>-` slug matches its new name (no stale `plugin-<old>-`); all 62 scenario.yaml pass strict `yaml` parse + `Array.isArray(rubrics)`; Playwright `--list` still collects all 31 e2e specs; README needs no change (its examples use non-renamed scenarios — confirm).
