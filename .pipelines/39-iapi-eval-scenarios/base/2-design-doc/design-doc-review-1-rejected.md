# Design Doc Review

## Verdict: rejected

## Summary

The design is architecturally sound and covers all spec requirements and acceptance criteria with correct technical decisions. The scenario taxonomy matches the proposal's bulleted lists (68 scenarios across 12 groups), the Skillsmith SHA is pinned correctly, the `scenarioDirOf()` code is correct, and the harness extension (`addLockProbe` shared, analytics inline) matches the research exactly. Three concrete issues prevent approval: the overview claims two shared e2e helpers where only one exists (a direct internal contradiction that would misdirect the plan phase); the migration count is wrong throughout the prose (8 migrate / 58 new in text, 9 migrate / 59 new in the table — inconsistent across multiple sections including the Totals summary and the task-volume planning note); and the prose description of `scenarioDirOf()`'s algorithm uses "last two path segments" when the code correctly uses the third-to-last and second-to-last segments (group and scenario, not scenario and filename). The table is the authoritative record and is correct; the prose is wrong in all three cases. These are clarity and consistency issues that a plan writer would hit when decomposing tasks.

## Issues

### Issue 1: Overview says "two new shared e2e helpers" but there is only one

**What's wrong:** The Overview section states "two new shared e2e helpers in a new `eval/utils/e2e-helpers.mjs`". The Components section (`eval/utils/e2e-helpers.mjs`) correctly says the module exports "a single shared helper, `addLockProbe(page, namespace)`". The Key Decisions section confirms: "Build `eval/utils/e2e-helpers.mjs` exporting exactly one helper." The analytics stub is explicitly described as inline per spec, not a shared helper.

**Where in design doc:** Overview paragraph 1 ("two new shared e2e helpers") vs. Components section `eval/utils/e2e-helpers.mjs` ("a single shared helper") and Key Decisions section ("One shared e2e helper (`addLockProbe`); analytics inline").

**Suggestion:** Change the Overview to "one new shared e2e helper in a new `eval/utils/e2e-helpers.mjs`".

**Why it matters:** A plan writer reading the Overview before the Components section will expect two helper exports in `e2e-helpers.mjs`. When the Components section says one, they face a contradiction with no resolution. The wrong number could also cause a code writer to add a second helper function that the design does not specify.

---

### Issue 2: Migration and new-scenario counts are wrong throughout the prose (table is correct)

**What's wrong:** The design doc states "8 of the existing flat scenarios map onto curated scenarios" (Approach section 3), "Alternatives: Delete-and-recreate the 8 migrated scenarios" (Key Decisions), and "Totals: 8 migrate (4 with rename, 3 of those reworked), 2 scenarios + 1 index deleted, 58 new = 68 scenarios". The table in the same section lists exactly 9 migrate rows:

- `minimal-scaffold` (unchanged)
- `independent-counters` (unchanged)
- `derived-double` (unchanged)
- `shared-state-tally` (rename only)
- `config-rest-nonce` (rename only)
- `joke-fetch` (rename + rework)
- `fruit-list-with-add` (rename only)
- `paginated-posts-router` (rename only)
- `side-drawer` (rename + rework)

The actual counts: 9 migrate total (3 name-unchanged, 6 with rename, 2 of those reworked), 59 new, total 68. This matches the repo: 11 flat scenarios minus 2 deleted = 9 migrated. The Key Decisions section also incorrectly says "~66 authoring tasks (58 new + 8 migrations)" — the correct figure is ~68 tasks (59 new + 9 migrations).

**Where in design doc:** Approach section point 3; Scenario directory mapping Totals line; Key Decisions "Migrate 8 scenarios" decision title, body, and planning risk note 4.

**Suggestion:** Fix all prose to read: "9 of the existing flat scenarios map onto curated scenarios", "Totals: 9 migrate (6 with rename, 2 of those reworked), 2 scenarios + 1 index deleted, 59 new = 68 scenarios", and "~68 authoring tasks (59 new + 9 migrations)". The Key Decisions section title should read "Migrate 9 scenarios with `git mv`".

**Why it matters:** A plan writer counting task volume from the prose will undercount by one migration task and overcount new-scenario tasks. The contradiction between the prose summary and the authoritative table is confusing and forces the reader to re-derive the correct numbers from the table themselves.

---

### Issue 3: `scenarioDirOf()` algorithm described as returning "last two path segments" but the code returns the third-to-last and second-to-last

**What's wrong:** The Key Decisions section for `scenarioDirOf()` says "Fix `scenarioDirOf()` to return the **last two** path segments joined with `/` when the path has ≥ 3 segments". Given `["foundations", "minimal-scaffold", "e2e.spec.mjs"]` (length 3), the last two segments are `"minimal-scaffold"` and `"e2e.spec.mjs"`, which would yield `"minimal-scaffold/e2e.spec.mjs"` — an incorrect key. The code immediately below correctly uses `segments[segments.length - 3]` and `segments[segments.length - 2]`, which yield `"foundations"` and `"minimal-scaffold"`, producing the correct `"foundations/minimal-scaffold"`.

**Where in design doc:** Key Decisions section "Patch `scenarioDirOf()` to return `<group>/<scenario>`", first bullet under Choice: "Fix `scenarioDirOf()` to return the **last two** path segments joined with `/`".

**Suggestion:** Replace "last two path segments" with "the group and scenario segments (third-to-last and second-to-last, skipping the filename)" or "the two path segments preceding the filename". The code itself is correct and does not need to change.

**Why it matters:** An implementer reading the prose description before the code sketch could implement the function incorrectly. The prose and code are in direct contradiction on what "last two segments" means when a filename is the last segment. Two implementers reading the prose independently without studying the code would implement it differently from the correct version.
