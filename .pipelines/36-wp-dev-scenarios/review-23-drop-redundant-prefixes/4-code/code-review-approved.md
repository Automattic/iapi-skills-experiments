# Code Review

## Verdict: approved

## Batch scope

Tasks reviewed: review-23-drop-redundant-prefixes — mechanical rename of 35 scenarios to strip redundant `<folder>-` prefix from scenario names/dirs/slugs/catalog records.

## Summary

The rename batch is correct and complete. All 35 renames from the intent map were applied: 32 full-prefix strips and 3 partial-overlap strips (abilities-api and rest-api). Every scenario's `name` field now matches its directory name and passes `/^[a-z0-9-]+$/`. The two KEPT block-editor scenarios (`block-api-static-block`, `block-filter-add-custom-attribute`) are correctly untouched. The pre-existing `interactivity-api/counter` → `counter-block` exception is unmodified. All 62 `scenario.yaml` files parse as strict YAML with `Array.isArray(rubrics)`. The catalog (`_wp-dev-candidates.yaml`) parses cleanly, contains no stale old names, no duplicates, and every record maps to an existing scenario directory; `rest-custom-endpoint` has no catalog record by design. All 13 `[e2e]`-tagged specs carry updated `plugin-<new-name>-` slugs with no stale old slugs anywhere. Playwright `--list` exits 0 and collects all 31 specs at their new paths. The diff is strictly confined to `eval/scenarios/` (renames + name/slug/catalog-name edits); no prompt, acceptance, or description text was altered; no `.pipelines/**` artifacts were touched; the README references no renamed scenarios.

Note (pre-existing, out of scope for this review): `project-triage/report`'s catalog `prompt` field diverges from its `scenario.yaml` prompt — this drift was introduced in review-18 and is not attributable to this rename pass.

## Checks

| Check | Command | Result |
| ----- | ------- | ------ |
| Every scenario `name` == its dir name, matches `/^[a-z0-9-]+$/` | `node -e "... findFiles + yaml.load + regex test"` | pass |
| Pre-existing `counter`/`counter-block` exception unchanged | `grep "^name:" eval/scenarios/interactivity-api/counter/scenario.yaml` | pass |
| No old prefixed directory remains | `for dir in <35 old paths>; do test -d eval/scenarios/$dir; done` | pass |
| KEPT block-editor scenarios untouched | `grep "^name:" eval/scenarios/block-editor/block-api-static-block/scenario.yaml` | pass |
| No name collisions in any folder | Enumeration of all 62 `dir\|name` pairs | pass |
| e2e slugs match new directory names (no stale old slugs) | `grep -r "plugin-" eval/scenarios/...e2e.spec.mjs` | pass |
| Catalog YAML parses (strict) | `yaml.load(_wp-dev-candidates.yaml)` | pass |
| Catalog: no stale old names | `names.filter(n => oldNames.includes(n))` | pass |
| Catalog: no duplicates | `names.filter((n,i) => names.indexOf(n) !== i)` | pass |
| Catalog: every record maps to existing scenario dir | `catalog.filter(r => !scenarioDirNames.includes(r.name))` | pass |
| `rest-custom-endpoint` has no catalog record | `catalog.some(r => r.name === 'custom-endpoint')` | pass (false) |
| All 62 scenario.yaml: valid YAML + `Array.isArray(rubrics)` | `node -e "... findFiles + yaml.load + Array.isArray check"` | pass |
| Playwright collects all 31 e2e specs (exit 0) | `npx playwright test --list` | pass |
| Diff confined to `eval/scenarios/` only | `git diff 5015ee2..HEAD --name-only \| grep -v "^eval/scenarios/"` | pass |
| README does not reference any renamed scenario | `grep -r "<old names>" README.md` | pass |
| No `.pipelines/**` artifacts touched | `git diff 5015ee2..HEAD --name-only \| grep "^.pipelines/"` | pass |
| Prompts/acceptance text unchanged in catalog | `git diff 5015ee2..HEAD -- eval/scenarios/_wp-dev-candidates.yaml` (only `name:` lines changed) | pass |
| No project guardrails | N/A — no guardrails convention defined | N/A |
