# Docs Review

## Verdict: approved

## Batch scope

Tasks reviewed: None — this is a deliberately empty (zero-task) doc batch for run `review-5-common-apis`.

## Summary

The doc plan for run `review-5-common-apis` contains zero tasks, and this independent review confirms that no-op is correct: no live documentation surface went stale when the four `common-apis-*` scenario directories and the in-place Common APIs edit of `eval/scenarios/_wp-dev-candidates.yaml` shipped. All twelve live markdown files (`README.md`, `.rp.md`, `eval/prompts/testing-agent.md`, `eval/prompts/improver.md`, `eval/rubrics/wp-interactivity-api-best-practices.md`, and the seven `skills/wordpress-development/**` files) were swept and none references Common APIs sub-areas, scenario counts, the legacy stub names `options-api-store-retrieve` / `transient-cache-remote-data`, or a scenario-naming convention. The one genuinely stale surface — the catalog header comment listing which areas have full prompt+acceptance — was correctly updated by the code phase (code Task 5) to read "…Plugins, Block Editor, REST API, Themes, and Common APIs scenarios…" and the fix is confirmed in the shipped diff. The iAPI catalog (`_candidates.yaml`) is byte-untouched and the Plugins `http-api-remote-get` stub is byte-untouched, both confirmed via `git diff`. `README.md` retains its accurate two-catalog pointer and illustrative `(e.g. counter, cpt-register)` example, neither of which was made stale by the in-place catalog edit.

## Checks

No project guardrails are declared. There are no gates to run.

| Check | Command | Result |
| ----- | ------- | ------ |
| None declared | n/a | n/a |

## Accuracy spot-check

**Catalog header-line fix (the one stale surface, fixed by code phase):**
Confirmed via `git diff 699e369..HEAD -- eval/scenarios/_wp-dev-candidates.yaml` and direct read of `eval/scenarios/_wp-dev-candidates.yaml` lines 26-29. The header now reads: "Full prompt + acceptance are included for the implemented Plugins, Block Editor, REST API, Themes, and Common APIs scenarios; all other records are lighter stubs." This matches Spec Requirement 18 / Acceptance Criterion 17 exactly.

**Legacy stub names gone:**
`grep` for `options-api-store-retrieve` and `transient-cache-remote-data` across all non-pipeline files returns zero hits. The two records now appear only under their renamed `common-apis-options` and `common-apis-transients` names at catalog lines 368 and 384.

**Plugins `http-api-remote-get` stub untouched:**
`git diff 699e369..HEAD -- eval/scenarios/_wp-dev-candidates.yaml` shows no changes to the Plugins area. The stub remains at line 334 with its `# TODO: prompt + acceptance` comment, byte-identical to the base ref.

**iAPI catalog byte-untouched:**
`git diff 699e369..HEAD -- eval/scenarios/_candidates.yaml` produces no output — confirmed unmodified.

**Live docs byte-untouched:**
`git diff 699e369..HEAD -- README.md .rp.md eval/prompts/ eval/rubrics/ skills/` produces no output — no live prose doc was modified by the code phase.

**README two-catalog pointer still accurate:**
`README.md` lines 36-38 name both `_candidates.yaml` and `_wp-dev-candidates.yaml` with their one-line roles. The catalog was edited in-place (not renamed, not duplicated); the role description "broader WordPress-development candidates spanning the developer.wordpress.org areas" still holds. Confirmed accurate.

**Common APIs section in catalog:**
Four full records confirmed present under the `# Implemented Common APIs scenarios — full records` sub-header within `# === Area: Common APIs ===` (catalog lines 363-432): `common-apis-options`, `common-apis-transients`, `common-apis-rewrite-rule`, `common-apis-http-request` — each with `name`, `description`, `difficulty`, `concepts`, `source`, `source_files`, `prompt`, and `acceptance`. No `rubrics` field in catalog records (correct — `rubrics` is `scenario.yaml`-only).

**e2e spec pinned literals match scenario.yaml:**
`eval/scenarios/common-apis-rewrite-rule/e2e.spec.mjs` asserts `page.request.get("/my-custom-page")`, `expect(resp.status()).toBe(200)`, and `expect(await resp.text()).toContain("Hello from my plugin")`. The `scenario.yaml` prompt for `common-apis-rewrite-rule` states "When someone visits `/my-custom-page`" and "respond with the exact text `Hello from my plugin`". The two asserted literals are present verbatim in the prompt — lockstep confirmed.

## Issues

None.
