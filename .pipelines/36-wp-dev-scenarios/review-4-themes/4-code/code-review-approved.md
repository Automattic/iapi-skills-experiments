# Code Review

## Verdict: approved

## Batch scope

Tasks reviewed:
- Task 1: `themes-enqueue-assets` — front-end asset enqueue, e2e scenario (commit 5fb794e)
- Task 2: `themes-nav-menu-location` — navigation-menu location, judge-only scenario (commit 5b4c54b)
- Task 3: `themes-sidebar-widget-area` — sidebar / widget area, judge-only scenario (commit 9f86a46)
- Task 4: catalog edit `eval/scenarios/_wp-dev-candidates.yaml` (commit d758663)

## Summary

All four tasks deliver exactly what the plan specifies. The three scenario directories are flat immediate children of `eval/scenarios/`, each carrying a schema-conformant `scenario.yaml` (correct key order, `rubrics: []` as an explicit array, no catalog-only fields, no URLs, tool-agnostic prompts). The e2e scenario (`themes-enqueue-assets`) ships an `e2e.spec.mjs` that mirrors the `filter-body-class` lifecycle verbatim: synchronous `deactivateAllPlugins()` (correct — the function is `execFileSync`-based), `await requestUtils.activatePlugin(...)` with the slug derived from `workerInfo.project.metadata.agentId`, `page.goto("/")`, and `toBeAttached()` assertions on `link#themes-frontend-assets-css` and `script#themes-frontend-assets-js`. `node --check` passes. The two judge-only scenarios contain only `scenario.yaml`. The catalog edit is surgically confined to the Themes section plus the one stale header line: `classic-theme-enqueue-scripts` is renamed and promoted to `themes-enqueue-assets`, two new full records are added under the `# Implemented Themes scenarios — full records` sub-header, `theme-json-custom-color-palette` receives its `# Deferred:` annotation, and the header comment now lists Themes. Prompt and acceptance strings are verbatim-identical between each `scenario.yaml` and its catalog record. The iAPI `_candidates.yaml`, all non-Themes records, `eval/utils/`, `eval/rubrics/`, and `skills/wordpress-development/` are untouched.

## Checks

No project guardrails are defined. The static/structural gates from the plan are exercised below.

| Check | Command | Result |
| ----- | ------- | ------ |
| e2e spec parses (node --check) | `node --check eval/scenarios/themes-enqueue-assets/e2e.spec.mjs` | pass |
| catalog YAML parses | `python3 -c "import yaml; yaml.safe_load(open('eval/scenarios/_wp-dev-candidates.yaml').read())"` | pass |
| scenario.yaml keys / rubrics / no catalog-only fields / no URLs | structural inspection via yaml.safe_load | pass |
| iAPI _candidates.yaml unmodified | `git diff e912d80..HEAD -- eval/scenarios/_candidates.yaml` | pass (zero diff) |
| skills/ unmodified | `git diff e912d80..HEAD -- skills/` | pass (zero diff) |
| eval/utils/ and eval/rubrics/ unmodified | `git diff e912d80..HEAD -- eval/utils/ eval/rubrics/` | pass (zero diff) |
| judge-only dirs contain only scenario.yaml | `find themes-nav-menu-location/ themes-sidebar-widget-area/ -type f` | pass |
| prompt verbatim match in catalog | python3 string comparison | pass (all three) |
| acceptance verbatim match in catalog | python3 list comparison | pass (all three) |
| classic-theme-enqueue-scripts stub removed | python3 record scan | pass |
| # Deferred comment added to theme-json stub | raw content grep | pass |
| header line updated to include Themes | raw content grep | pass |
| non-Themes catalog records untouched | full diff inspection | pass |

## Behavior verification

This batch ships scenario-definition and catalog data only — no user-observable runtime behavior (no UI, no CLI output, no generated files consumed at review time). The verification bar is static/structural per AC 16 and the plan's "Verification bar" section. All structural checks above were executed and passed.

The `deactivateAllPlugins()` call in `beforeAll` and `afterAll` is intentionally not awaited: `wp-cli.mjs` exports it as a synchronous function (`execFileSync`-based), matching the `filter-body-class` reference pattern exactly.
