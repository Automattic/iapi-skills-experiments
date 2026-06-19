# Code Review

## Verdict: approved

## Batch scope

Tasks reviewed (commits `8f7d835..HEAD`, `.pipelines/**` ignored):

- Task 1 — Move all 38 scenarios into 7 topic folders (`git mv`) — commit `2191977`
- Task 2 — Fix e2e import depth (27 specs) — commit `ad5bc90`
- Task 3 — Update `verify-e2e.ts` `scenarioDirOf` for nested dirNames — commit `bd235f9`
- Task 4 — Catalog: light header cross-refs + 9 agent-skills gap stubs — commit `f848f23`

## Summary

The batch is a clean, faithful execution of the approved design. Task 1 relocates all 38 scenarios into exactly the seven specified topic folders with pure `git mv` renames — every one of the 66 moved files is detected as `R100`, `git show 2191977 -- '*/scenario.yaml'` shows zero content (+/-) lines, and the per-folder counts match the design exactly (iAPI 11 / Plugins 9 / Block Editor 5 / REST API 4 / Themes 3 / Common APIs 4 / Coding Standards 2 = 38). Task 2 changes only the single `wp-cli.mjs` import line in all 27 e2e specs (`../../` → `../../../`), uniformly, with none left at depth-2; `node --check` passes on all 27 and Playwright `--list` collects all 27 from their nested paths with zero errors. Task 3 rewrites `scenarioDirOf` exactly per the design to return the full relative path from the `scenarios` anchor, correct for all four flat/nested × relative/absolute forms while preserving the flat case; it introduces no tsc errors (all 43 remaining tsc errors are confined to `node_modules`/Skillsmith, as the launch prompt anticipated). Task 4 appends exactly 9 `source: agent-skills` gap stubs (the 9 expected names, each with `# agent-skills:` and `# Gap (...)` markers, no `prompt`/`acceptance`) under a new `# === Agent-Skills Gaps ===` section plus light `# folder:` cross-refs on area headers; the file parses as valid YAML and no existing record's name/prompt/acceptance changed. Every invariant holds: `skills/`, `playwright.config.ts`, `README.md`, `skillsmith.config.ts`, `scaffold-plugin.ts`, `wp-cli.mjs` untouched; the iAPI `_candidates.yaml` is byte-untouched; no files added or deleted (no new scenarios). There are no project guardrails.

## Checks

No project guardrails exist (no lint config, no `.github/workflows`, no typecheck/unit-test gate script; `package.json` scripts are `postinstall`, `skillsmith`, `test:e2e`, `env:start`, `env:stop`). The verification commands run as part of the review (all passed) are recorded below.

| Check | Command | Result |
| ----- | ------- | ------ |
| Moves are pure renames, no scenario.yaml content change | `git show 2191977 -- '*/scenario.yaml'` (0 +/- content lines; all R100) | pass |
| Folder counts + total + nesting depth | `git ls-tree -r HEAD eval/scenarios` (11/9/5/4/3/4/2 = 38, all depth-2, catalogs at root) | pass |
| e2e import depth uniform, none at depth-2 | `git show ad5bc90` + `git grep '"../../utils/'` (27→27, 0 remaining) | pass |
| e2e specs syntactically valid | `node --check` on all 27 specs | pass |
| Playwright collects nested specs (no boot) | `npx playwright test --list` (27 specs, 0 errors) | pass |
| `scenarioDirOf` correct for all 4 path forms + flat preserved | traced flat/nested × relative/absolute | pass |
| `verify-e2e.ts` introduces no tsc errors outside node_modules | `npx tsc --noEmit` (43 errors, all in node_modules) | pass |
| Catalog parses as YAML; 9 gap stubs; markers present; no prompt/acceptance | yaml parse + marker grep (9/9/9/1) | pass |
| No existing catalog record name/prompt/acceptance changed | base-vs-HEAD record diff (0 changed) | pass |
| iAPI `_candidates.yaml` byte-untouched | `git diff 8f7d835..HEAD -- _candidates.yaml` (empty) | pass |
| Invariants: skills/, playwright.config.ts, README, scaffold, wp-cli untouched | `git diff 8f7d835..HEAD --name-only` per path (empty) | pass |
| No files added/deleted (no new scenarios) | `git diff --name-status -M` (65 R, 2 M, 0 A, 0 D) | pass |

## Behavior verification

This is a structural reorganization; the user-observable behavior is (a) the e2e suite remains collectable after the move and (b) the harness attributes nested-scenario e2e failures to the correct `(scenario, agent)` pair via `scenarioDirOf` → `dirToName`.

- **Collection (E2E test plan flow, re-driven):** Ran `npx playwright test --list` (no wp-env boot). It collected exactly **27** specs, all from nested `<topic>/<scenario>/e2e.spec.mjs` paths, `"errors": []`, exit 0. `node --check` passed on all 27. Expected outcome (all 27 specs collectable post-move) confirmed.
- **Failure attribution (load-bearing correctness fix):** Fed the **actual** spec file paths Playwright reports through the shipped `scenarioDirOf`. All 27 resolve to the `<topic>/<scenario>` relative form (e.g. `block-editor/block-editor-block-filters/e2e.spec.mjs` → `block-editor/block-editor-block-filters`; `interactivity-api/async-fetch/e2e.spec.mjs` → `interactivity-api/async-fetch`) — 0 results not in `<topic>/<scenario>` form. This is the exact relative `dirName` form Skillsmith will supply after the documented upstream change, so the `dirToName` lookup resolves and failures are no longer silently dropped.
- **Move integrity:** `git show 2191977 -- '*/scenario.yaml'` shows only rename headers with `similarity index 100%` and **zero** content (+/-) lines across all 38 scenario.yaml files; the prompt/acceptance text is preserved verbatim.

## Notes (non-blocking)

- The pre-existing strict-YAML quirk in the iAPI `_candidates.yaml` is unrelated to this review and the review correctly did not touch that file (byte-untouched), as instructed.
- Nested scenarios remain invisible to the pinned Skillsmith until the documented upstream changes (recursive discovery + relative `dirName`) land — the accepted temporary state. README + the Skillsmith dependency note are phase-5 (docs) scope and correctly were not touched here.
