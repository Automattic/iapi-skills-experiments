# Code Review

## Verdict: approved

## Batch scope

Tasks reviewed: All 5 Block Editor sub-area scenarios promoted from stubs to full records:
- `block-editor-block-patterns` (e2e)
- `block-api-static-block` (judge-only)
- `block-filter-add-custom-attribute` (judge-only)
- `block-editor-block-variations` (judge-only)
- `block-editor-inner-blocks` (judge-only)

## Summary

All five Block Editor sub-area scenarios are correctly shipped. Each `scenario.yaml` is schema-conformant (exactly the required keys, `rubrics: []`, no catalog-only fields, no URLs in acceptance). The four judge-only scenarios have no `e2e.spec.mjs` and carry `# Harness dependency:` notes in the catalog. The `block-editor-block-patterns` e2e spec uses the correct 3-level import path, sync `deactivateAllPlugins()`, the pinned slug `plugin-block-editor-block-patterns-${agentId}`, and `requestUtils.rest({path: "/wp/v2/block-patterns/patterns"})` with an assertion on `p.name === "my-plugin/hero"`. The use of `requestUtils.rest()` rather than `page.request.get()` is a deliberate upgrade — the patterns endpoint requires `edit_posts` capability, and `requestUtils.rest()` is the established authed channel in this codebase (matching `abilities-api-register`), while `page.request.get()` relies on storageState cookies; the implicit 200 assertion (throws on non-200) satisfies the spec intent. Playwright `--list` collects exactly 1 test from the spec without booting wp-env. The catalog promotes all five stubs in-place: record count stays at 48, no duplicates, the "Deferred Block Editor sub-areas" sub-header is removed, `my-plugin/hero` appears in lockstep between the prompt and the acceptance of the e2e scenario, prompt/acceptance text matches verbatim between each `scenario.yaml` and its catalog record, and grounding URLs match the spec. No files outside the five new scenario directories and `_wp-dev-candidates.yaml` were changed. The skill and iAPI `_candidates.yaml` are untouched.

## Checks

No project guardrails convention exists. Structural and syntax checks were run manually.

| Check | Command | Result |
| ----- | ------- | ------ |
| Node syntax check (e2e spec) | `node --check eval/scenarios/block-editor/block-editor-block-patterns/e2e.spec.mjs` | pass |
| Playwright list (1 test collected, no wp-env boot) | `npx playwright test --list --config playwright.config.ts eval/scenarios/block-editor/block-editor-block-patterns/e2e.spec.mjs` | pass |
| YAML parse (catalog) | `python3 -c "import yaml; data = yaml.safe_load(open('eval/scenarios/_wp-dev-candidates.yaml')); print(len(data))"` | pass (48 records) |
| No duplicate catalog names | `grep "^- name:" _wp-dev-candidates.yaml \| sort \| uniq -d` | pass (no output) |
| Catalog record count unchanged | base: 48, HEAD: 48 | pass |
| Diff confined to 5 dirs + catalog | `git diff 47baab3..HEAD --name-only \| grep -v block-editor/ \| grep -v _wp-dev-candidates.yaml \| grep -v .pipelines/` | pass (no output) |
| No e2e.spec.mjs in judge-only dirs | `ls eval/scenarios/block-editor/{block-api-static-block,block-filter-add-custom-attribute,block-editor-block-variations,block-editor-inner-blocks}/` | pass (only scenario.yaml) |
| Skills/ untouched | `git diff 47baab3..HEAD --name-only \| grep "^skills/"` | pass (no output) |
| iAPI _candidates.yaml untouched | `git diff 47baab3..HEAD --name-only \| grep "_candidates.yaml"` | pass (only _wp-dev-candidates.yaml) |

## Behavior verification

This batch adds scenario YAML and one e2e spec — no user-observable behavior changes to the harness runtime itself. The static verification above (Playwright `--list`, YAML parse, node `--check`, diff scope) constitutes the appropriate evidence for this type of artifact.

The e2e spec for `block-editor-block-patterns` collects as 1 test:

```
[haiku] › block-editor/block-editor-block-patterns/e2e.spec.mjs:29:2
  › block editor block patterns scenario
  › registered pattern my-plugin/hero is listed at the patterns REST endpoint
Total: 1 test in 1 file
```

The `my-plugin/hero` slug appears in lockstep in the scenario `prompt`, the `acceptance` list, and the `e2e.spec.mjs` assertion (`p.name === "my-plugin/hero"`).
