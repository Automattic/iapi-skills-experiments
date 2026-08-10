# Code Review

## Verdict: approved

## Batch scope

Tasks reviewed:
- Task 1: Create the `rest-api-custom-field-on-post` (modifying responses) scenario (commit df54ffc)
- Task 2: Create the `rest-api-route-validation` (argument validation) scenario (commit 26b5e22)
- Task 3: Create the `rest-api-permission-check` (permission-gated route) scenario (commit b1a4eb8)
- Task 4: Update the REST API section of `eval/scenarios/_wp-dev-candidates.yaml` (commit 0b40d8e)

## Summary

All four tasks are correctly implemented and satisfy their per-task acceptance criteria and the spec's acceptance criteria in full. Each of the three scenario directories is a flat immediate child of `eval/scenarios/`, contains a well-formed `scenario.yaml` (name equals directory name, matches `/^[a-z0-9-]+$/`, `skills: [wordpress-development]`, no catalog-only fields, no embedded URLs, `rubrics: []` explicit array) and a syntactically valid `e2e.spec.mjs` whose plugin slug is derived from `workerInfo.project.metadata.agentId`. The three specs implement the correct flows verbatim — Flow 1 seeds a published post and anonymously asserts `reading_time === "5 min"` on the posts resource; Flow 2 asserts status 200 for `?filter=blue` and 400 for `?filter=purple`; Flow 3 asserts `denied.status() === 401` for the anonymous half and `body === "This is private data."` (never a status) for the authenticated half. The catalog update correctly promotes `rest-api-custom-field-on-post` from stub to full record (verbatim match confirmed), adds two new full records under the "Implemented REST API scenarios — full records" sub-header, annotates `rest-api-authentication-nonce` as `# Deferred` (no prompt/acceptance added), creates no `_fields`/`_embed` stub, fixes the one stale header line, and leaves `_candidates.yaml` and all non-REST-API records untouched. `node --check` passes on all three specs; the catalog parses as valid YAML. No skill files, no rubrics, no existing scenarios were modified.

## Checks

There are no project guardrails declared in `code-plan.md` ("No project guardrails"). The structural verification gates stated in the plan were run manually.

| Check | Command | Result |
| ----- | ------- | ------ |
| `node --check` rest-api-custom-field-on-post | `node --check eval/scenarios/rest-api-custom-field-on-post/e2e.spec.mjs` | pass |
| `node --check` rest-api-route-validation | `node --check eval/scenarios/rest-api-route-validation/e2e.spec.mjs` | pass |
| `node --check` rest-api-permission-check | `node --check eval/scenarios/rest-api-permission-check/e2e.spec.mjs` | pass |
| Catalog YAML parses | `node -e "require('js-yaml').load(require('fs').readFileSync('eval/scenarios/_wp-dev-candidates.yaml','utf8'))"` | pass |
| `_candidates.yaml` untouched | `git diff 9525344..HEAD -- eval/scenarios/_candidates.yaml` | pass (empty diff) |
| Non-REST records untouched | `git diff 9525344..HEAD -- eval/scenarios/` filtered to non-`rest-api-*` non-catalog paths | pass (empty) |
| Skills untouched | `git diff 9525344..HEAD -- skills/` | pass (empty diff) |
| Rubrics untouched | `git diff 9525344..HEAD -- eval/rubrics/` | pass (empty diff) |
| Verbatim prompt/acceptance match (catalog vs scenario.yaml) | node script comparing parsed YAML fields | pass (all 3 scenarios) |

## Behavior verification

This batch adds scenario definitions and catalog data — no user-observable runtime behavior is changed. The verification bar per the plan and spec is static/structural only: each scenario must be Skillsmith-discoverable and each `e2e.spec.mjs` must be loadable/collectable by the test runner. All three specs parse cleanly (`node --check` passes), the import paths (`../../utils/wp-cli.mjs`, `@wordpress/e2e-test-utils-playwright`) are correct for flat immediate children of `eval/scenarios/`, and the catalog parses as valid YAML and remains a non-directory leading-underscore file that Skillsmith skips during discovery. A failing grade against the current skill is explicitly acceptable per spec AC 16.
