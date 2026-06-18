# Code Review

## Verdict: approved

## Batch scope

Tasks reviewed (commits `699e369..HEAD`, `eval/scenarios/` only):

- Task 1 — `common-apis-rewrite-rule` (e2e: `scenario.yaml` + `e2e.spec.mjs`) — commit `bb3a416`
- Task 2 — `common-apis-options` (judge-only: `scenario.yaml`) — commit `239afe1`
- Task 3 — `common-apis-transients` (judge-only: `scenario.yaml`) — commit `2a4afae`
- Task 4 — `common-apis-http-request` (judge-only: `scenario.yaml`) — commit `2308894`
- Task 5 — catalog edit of `eval/scenarios/_wp-dev-candidates.yaml` — commit `2d4d6d3`

## Summary

The batch delivers exactly the four Common APIs scenarios and the in-place catalog reconciliation the plan, design, and spec call for, with no scope creep. The non-planning diff is confined to precisely six files (the four new scenario dirs + the catalog), each a flat immediate child of `eval/scenarios/`. All four `scenario.yaml` files pass the discovery shape-check (exactly `name, description, skills, prompt, acceptance, rubrics` in order; `rubrics: []`; `name` matching `/^[a-z0-9-]+$/` and equal to the directory name; no catalog-only fields and no source URLs leaked). The one e2e spec (`common-apis-rewrite-rule`) is a faithful mirror of the canonical `cpt-register` lifecycle — sync `deactivateAllPlugins()` in `beforeAll`/`afterAll`, derived plugin slug, `page.request.get` + status 200 + body-token `toContain`, no seeding, no new `eval/utils/` helper — and its two pinned literals (`/my-custom-page`, `Hello from my plugin`) are in exact lockstep between prompt and assertion. It passes `node --check` and Playwright collects it (1 test, 1 file) without booting wp-env. The catalog promotes+renames the two legacy stubs, adds the two new full records under an `# Implemented Common APIs scenarios — full records` sub-header, fixes the single header line, and is verbatim-identical to the shipped `scenario.yaml` prompts and acceptance for all four records; the Plugins `http-api-remote-get` stub is JSON-identical to base, the iAPI `_candidates.yaml` has a zero-byte diff, and every non-Common-APIs record shows zero drift. No skill file, no `eval/utils/`, no `eval/rubrics/` touched. Verification is static/structural only, as the spec, design, and plan require; a passing grade against the current skill is not required.

## Checks

The code plan declares "No project guardrails" — this project defines no scoped gates, so there are no gate commands to run. The rows below record the static/structural verifications performed (the bar set by Acceptance Criterion 19).

| Check | Command | Result |
| ----- | ------- | ------ |
| Project guardrails | (none declared) | n/a |
| e2e spec parses | `node --check eval/scenarios/common-apis-rewrite-rule/e2e.spec.mjs` | pass |
| e2e spec collectable | `npx playwright test --list eval/scenarios/common-apis-rewrite-rule/e2e.spec.mjs` (1 test, 1 file; no wp-env) | pass |
| Catalog parses as YAML | `js-yaml load` of `_wp-dev-candidates.yaml` (single doc, 37 records) | pass |
| Catalog ↔ scenario verbatim | prompt + acceptance match for all 4 records | pass |
| scenario.yaml shape-check | 6 keys in order, `rubrics` array, name regex, no catalog-field/URL leak (x4) | pass |
| Plugins `http-api-remote-get` untouched | JSON-identical to base `699e369` | pass |
| iAPI `_candidates.yaml` untouched | `git diff 699e369..HEAD` empty | pass |
| Non-Common-APIs records untouched | structural diff vs base: zero drift | pass |
| Diff confinement | non-planning diff = the 6 expected files only | pass |
| `wp-cli.mjs` import resolves | `import('../../utils/wp-cli.mjs')` exports `deactivateAllPlugins` (function) | pass |

## Behavior verification

This batch ships scenario-definition + catalog data, not runnable plugin code; the only user/runner-observable artifact is the e2e spec's collectability and the catalog's parseability, both exercised above without booting wp-env (per the spec's static/structural-only bar).

- Playwright collection of `common-apis-rewrite-rule/e2e.spec.mjs`: `Listing tests: [haiku] › common-apis-rewrite-rule/e2e.spec.mjs:23:2 › common-apis-rewrite-rule scenario › GET /my-custom-page returns HTTP 200 with the plugin's body token — Total: 1 test in 1 file`.
- `node --check` on the spec: clean exit.
- Lockstep evidence: the prompt and the e2e assertions both contain exactly `/my-custom-page` and `Hello from my plugin`, and nothing else asserted.
- Catalog: `js-yaml` loads it as a single document of 37 records (35 base − 2 legacy stubs + 4 new); `http-api-remote-get` JSON-identical to base; non-Common-APIs drift NONE.
