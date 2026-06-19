# Code Review

## Verdict: changes requested

## Batch scope

Tasks reviewed: all 4 shipped scenarios — `ajax-handler` (e2e), `user-role-check` (judge-only), `privacy-data-exporter` (judge-only), `rest-api-authentication-nonce` (judge-only) — plus the `http-api-remote-get` catalog removal.

## Summary

Three of the four scenario.yaml files are correct and the catalog is in good shape (47 records, no duplicates, `http-api-remote-get` removed with a superseded comment, `Harness dependency` notes present on the three judge-only scenarios, prompt/acceptance verbatim-matching the catalog for the working entries). The `ajax-handler` e2e spec is also correct end-to-end. However, `eval/scenarios/plugins/user-role-check/scenario.yaml` has a YAML parse error that will cause the harness to reject the scenario at enumeration time: the first `acceptance` list item begins with an unquoted backtick character, which the `yaml` npm package (used by skillsmith's `enumerate.ts` → `parse as parseYaml`) rejects with `Plain value cannot start with reserved character`. The catalog entry for the same field correctly wraps it in double quotes; the scenario.yaml does not. This is a hard defect: the scenario will never be selected by the harness.

## Checks

No project guardrails are defined. The following verification steps were run in place of gates.

| Check | Command | Result |
| ----- | ------- | ------ |
| `node --check` on e2e spec | `node --check eval/scenarios/plugins/ajax-handler/e2e.spec.mjs` | pass |
| Playwright test list (no wp-env) | `npx playwright test --list` from `eval/scenarios/plugins/ajax-handler/` | pass (1 test collected) |
| Catalog YAML parse (`yaml` package) | `node -e "require('yaml').parse(fs.readFileSync('eval/scenarios/_wp-dev-candidates.yaml','utf8'))"` | pass (47 records) |
| Catalog duplicate check | `grep '^- name:' ... \| sort \| uniq -d` | pass (no duplicates) |
| `http-api-remote-get` removed | `grep 'http-api-remote-get' _wp-dev-candidates.yaml` | pass (not present as a record; superseded comment only) |
| `user-role-check/scenario.yaml` parse | `node -e "require('yaml').parse(fs.readFileSync('eval/scenarios/plugins/user-role-check/scenario.yaml','utf8'))"` | fail |
| `privacy-data-exporter/scenario.yaml` parse | `node -e "require('yaml').parse(...)"` | pass |
| `rest-api-authentication-nonce/scenario.yaml` parse | `node -e "require('yaml').parse(...)"` | pass |
| `ajax-handler/scenario.yaml` parse | `node -e "require('yaml').parse(...)"` | pass |
| Diff scope | `git diff e738f3c..HEAD --name-only` | pass (confined to 4 new dirs + catalog + spec file) |
| Skills untouched | `git diff e738f3c..HEAD -- skills/` | pass (no output) |
| iAPI `_candidates.yaml` untouched | `git diff e738f3c..HEAD -- eval/scenarios/_candidates.yaml` | pass (no output) |

## Behavior verification

The `ajax-handler` e2e spec was verified structurally: `node --check` passes; `playwright --list` collects exactly 1 test without booting wp-env; the spec uses `requestUtils.request.post("/wp-admin/admin-ajax.php?action=my_plugin_ping")`, asserts `body.success === true`, imports `deactivateAllPlugins` from `"../../../utils/wp-cli.mjs"` (3 levels up), calls `deactivateAllPlugins()` synchronously in `beforeAll`/`afterAll` matching the reference pattern in `rest-api-permission-check/e2e.spec.mjs`, and uses the slug `plugin-ajax-handler-${workerInfo.project.metadata.agentId}`. The literal `my_plugin_ping` appears in both the scenario.yaml prompt and the e2e assertion.

## Issues

### Issue 1: `user-role-check/scenario.yaml` is unparseable — backtick at start of unquoted YAML scalar

**Task:** user-role-check scenario
**What's wrong:** Line 10 of `eval/scenarios/plugins/user-role-check/scenario.yaml` begins the first `acceptance` list item with an unquoted backtick character:

```yaml
  - `current_user_can('<capability>')` is called before the sensitive operation runs …
```

The `yaml` npm package (used by `@automattic/skillsmith`'s `enumerate.ts` via `import { parse as parseYaml } from "yaml"`) raises `Plain value cannot start with reserved character \`` and marks the scenario as malformed. The harness then skips the scenario entirely — it will never be selected.

**Where:** `eval/scenarios/plugins/user-role-check/scenario.yaml:10`

**Expected:** The acceptance item must be wrapped in double quotes, exactly as the corresponding catalog entry at `eval/scenarios/_wp-dev-candidates.yaml:375` already does:

```yaml
  - "`current_user_can('<capability>')` is called before the sensitive operation runs — for example `current_user_can('manage_options')` or another named built-in capability."
```

No other change is needed to this file.
