# Code Review

## Verdict: approved

## Batch scope

Tasks reviewed:
- abilities-api-register (e2e scenario + catalog full record)
- abilities-audit-rest-surface (judge-only scenario + catalog full record)
- abilities-verify-callbacks (judge-only scenario + catalog full record)
- _wp-dev-candidates.yaml catalog (stub removal + full-record promotion, orchestrator dedup fix)

## Summary

All three Abilities API scenarios are correctly structured and internally consistent. The `abilities-api-register` e2e spec mirrors the `rest-api-permission-check` pattern exactly: sync `deactivateAllPlugins()`, agentId-scoped plugin slug, 3-level `../../../utils/wp-cli.mjs` import, anonymous `page.request.get` → 401 assertion, authenticated `requestUtils.rest` → array containing `my-plugin/greeting`. JavaScript syntax is clean (`node --check` passes). The two judge-only scenarios (`abilities-audit-rest-surface`, `abilities-verify-callbacks`) ship `scenario.yaml` only — no `e2e.spec.mjs` — with `rubrics: []` and four well-formed acceptance criteria each. All three `scenario.yaml` files are tool-agnostic (no `wp_register_ability` / `wp-abilities` / API function names appear in the prompts), pin `my-plugin/greeting` where required, contain no URLs in acceptance, and carry only the allowed keys (`name`, `description`, `skills`, `prompt`, `acceptance`, `rubrics`). The catalog parses cleanly with 47 records and zero duplicate `name` values; the three abilities full records appear exactly once each, with prompt/acceptance verbatim-matching their scenario.yaml counterparts; `source: dev.wordpress.org` for register and `source: agent-skills` for audit/verify; `# Harness dependency:` comments are present on the two judge-only catalog records. The gaps section retains exactly 6 stubs (performance-object-cache, phpstan-baseline, wordpress-router-classify, project-triage-report, plugin-directory-review, wpds-component-ui) with no abilities stubs remaining. The diff is confined to 3 new scenario directories and the catalog file; no other scenarios, the skill file, or the iAPI candidates file were touched.

## Checks

No project guardrails are configured for this repository. No gates to run.

| Check | Command | Result |
| ----- | ------- | ------ |
| JS syntax | `node --check eval/scenarios/abilities-api/abilities-api-register/e2e.spec.mjs` | pass |
| YAML parse (catalog) | `python3 -c "import yaml; list(yaml.safe_load_all(open('eval/scenarios/_wp-dev-candidates.yaml')))"` | pass |
| Catalog record count | 47 total records | pass |
| Catalog no duplicates | Counter check — zero duplicates | pass |
| Abilities records × 3 exactly | abilities-api-register, abilities-audit-rest-surface, abilities-verify-callbacks | pass |
| Prompt/acceptance verbatim match (catalog ↔ scenario.yaml) | python3 verbatim diff | pass |
| No abilities stubs in gaps section | 6 gap stubs, none named abilities-* | pass |
| No catalog-only keys in scenario.yaml | keys = name/description/skills/prompt/acceptance/rubrics | pass |
| No URLs in acceptance criteria | grep check | pass |
| Diff scope confined | no changes outside 3 scenario dirs + catalog | pass |
| iAPI candidates untouched | git diff on _iapi-candidates.yaml | pass |
| No e2e.spec.mjs for judge-only scenarios | ls audit/verify dirs | pass |

## Behavior verification

No user-observable runtime behavior changes — these are scenario definition files (YAML + a Playwright spec that exercises a not-yet-running environment). Structural verification was performed by direct inspection and the checks above.
