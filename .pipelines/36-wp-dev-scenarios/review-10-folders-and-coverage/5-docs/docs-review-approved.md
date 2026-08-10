# Docs Review

## Verdict: approved

## Batch scope

Tasks reviewed:
- Doc Task 1: README: nested layout + Skillsmith dependency
- Doc Task 2: Coverage map artifact (agent-skills)

## Summary

Both tasks in the batch satisfy their acceptance criteria and are accurate against the shipped code. The README no longer mentions a flat scenario layout; it correctly names all seven topic folders, gives a concrete nested `<topic>/<scenario>` invocation example (`plugins/cpt-register`), and includes a dedicated "Skillsmith nested-discovery dependency" section that specifies both upstream changes (A: recursive discovery, B: relative `dirName`), pins the exact commit hash matching `package.json`, and clearly states the temporary-invisibility caveat with its accepted rationale. The catalog note is accurate — the two leading-underscore files stay at root, and the new `# === Agent-Skills Gaps ===` section is correctly described. The Playwright no-change claim is verified against `playwright.config.ts`. The coverage map artifact classifies all 17 agent-skills topics with the correct statuses (4 Covered, 1 Covered-partial, 3 Deferred-area, 9 Gap), all nine gap stub names cross-link to stubs that actually exist in the shipped `_wp-dev-candidates.yaml`, both cross-terminology notes are present and accurate, and no `skills/` file was created. The doc commit (`ba3f919`) touched exactly two files — `README.md` and the coverage-map artifact — with no catalog, harness, or scenario drift.

## Checks

No project guardrails are declared; no gates to run.

| Check | Command | Result |
| ----- | ------- | ------ |
| (none declared) | — | — |

## Accuracy spot-check

**Task 1 — README**

- Skillsmith pin hash in README: `6bd90c34d88b815fdf4fd661dc8c51288111444c`. Verified against `package.json` line 14: `"@automattic/skillsmith": "github:Automattic/skillsmith#6bd90c34d88b815fdf4fd661dc8c51288111444c"`. Exact match.
- Nested path example `plugins/cpt-register` used in README. Verified: `eval/scenarios/plugins/cpt-register/` exists on disk.
- Nested path example `interactivity-api/counter` in layout description. Verified: `eval/scenarios/interactivity-api/counter/` exists on disk.
- Seven topic folders listed in README: `interactivity-api/`, `plugins/`, `block-editor/`, `rest-api/`, `themes/`, `common-apis/`, `coding-standards/`. Verified: `ls eval/scenarios/` returns exactly these seven directories (plus the two `_*.yaml` catalog files).
- Playwright `testDir`/`testMatch` claim: README states `testDir: "./eval/scenarios"` and `testMatch: "**/e2e.spec.mjs"`. Verified against `playwright.config.ts` lines 26-27: exact match.
- Doc commit (`ba3f919`) touched only `README.md` and `agent-skills-coverage-map.md` — no `scenario.yaml`, catalog record, or harness file changed.

**Task 2 — Coverage map**

- All 17 topics present in table (rows 1-17 in the coverage map, totals line confirms 4+1+3+9=17).
- All nine Gap stub `name`s cross-verified against `_wp-dev-candidates.yaml` (grep of `^- name:` in the `# === Agent-Skills Gaps ===` section): `abilities-api-register`, `performance-object-cache`, `abilities-audit-rest-surface`, `abilities-verify-callbacks`, `phpstan-baseline`, `wordpress-router-classify`, `project-triage-report`, `plugin-directory-review`, `wpds-component-ui` — all nine present, names match exactly.
- No `skills/` file created: `ls skills/` shows only the pre-existing `wordpress-development/` directory.
- Coverage map placed at `.pipelines/36-wp-dev-scenarios/review-10-folders-and-coverage/agent-skills-coverage-map.md` (not in `skills/`), matching the doc-plan's intent of "a durable coverage-map doc under the review's pipeline artifacts."
