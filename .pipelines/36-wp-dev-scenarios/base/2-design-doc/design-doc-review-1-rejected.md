# Design Doc Review

## Verdict: rejected

## Summary

The design is well-structured, thorough, and correctly grounded in the codebase for the vast majority of its claims. Topic selection, e2e plans, key decisions, and traceability to spec requirements are all sound. However, there is one concrete, codebase-verified defect: the `scenario.yaml` schema example instructs implementers to **omit** the `rubrics` key entirely for scenarios with no rubrics, but the real Skillsmith `enumerate.ts` validator requires `rubrics` to be a present, non-null array (`Array.isArray(r.rubrics)` must be `true`). Omitting the key — or emitting `rubrics:` with no value — causes `isScenarioShape` to return `false`, which makes `enumerate.ts` reject the scenario with `"scenario.yaml malformed: expected name/description/skills/prompt/acceptance/rubrics"`. All four scenarios would fail discovery at runtime and never be graded, directly violating Acceptance Criterion 7. The fix is a one-line change to the schema example and the per-scenario YAML snippets: use `rubrics: []` instead of omitting the key.

## Issues

### Issue 1: `rubrics` key omitted in schema example — all four scenarios fail Skillsmith discovery

**What's wrong:**

The design's `scenario.yaml` schema example (Interfaces and Data Flow section) shows:

```yaml
# rubrics:              # OMITTED for all four — present only when a scenario references one
```

This instructs the phase-3/4 implementer to omit the `rubrics` key from every new `scenario.yaml`. However, the actual Skillsmith validator in `node_modules/@automattic/skillsmith/src/scenarios/enumerate.ts` (lines 111–113) checks:

```ts
Array.isArray(r.rubrics) &&
r.rubrics.every((s) => typeof s === "string")
```

When `rubrics` is omitted, `r.rubrics` is `undefined` and `Array.isArray(undefined)` returns `false`, so `isScenarioShape` returns `false`. When `rubrics:` is present with no value, the `yaml` library parses it as `null`, and `Array.isArray(null)` is also `false`. In both cases `enumerate.ts` emits the error `"scenario.yaml malformed: expected name/description/skills/prompt/acceptance/rubrics"` and the scenario is skipped.

The only form that passes validation for a no-rubrics scenario is `rubrics: []`.

Verified empirically:
- `Array.isArray(undefined)` → `false`
- `Array.isArray(null)` → `false`
- `Array.isArray([])` → `true`
- Every existing scenario in `eval/scenarios/` has `rubrics:` followed by at least one item; none omits the key or uses an empty value.

**Where in design doc:** "Interfaces and Data Flow" → `scenario.yaml` schema (the commented-out `# rubrics:` line), and the implication carries through the "Explicitly NOT modified" and "Key Decisions — Add zero new shared rubrics" sections.

**Suggestion:** Replace the schema example comment with the explicit empty-array form:

```yaml
rubrics: []             # empty — no shared rubric referenced for any of the four scenarios
```

Apply the same correction to every per-scenario YAML snippet or implementation note that implies the key should be omitted.

**Why it matters:** All four new scenarios would be silently rejected at discovery time with a schema error. They would never appear in Skillsmith's run output, never be graded, and their e2e specs would never execute. This directly violates Acceptance Criterion 7 ("runs to a graded result without harness/configuration errors") and effectively makes the entire batch a no-op.
