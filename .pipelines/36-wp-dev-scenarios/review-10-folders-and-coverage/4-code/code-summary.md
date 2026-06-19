# Code Summary — review-10-folders-and-coverage (phase 4)

## What shipped

A structural reorganization of the `eval/` scenario suite plus an agent-skills coverage gap map, across 4 commits (`8f7d835..HEAD`).

### Task 1 — Real per-topic folders (commit `2191977`)
All 38 scenario directories moved from flat children of `eval/scenarios/` into seven topic folders via pure `git mv` renames (R100, zero content change):

- `interactivity-api/` (11), `plugins/` (9), `block-editor/` (5), `rest-api/` (4), `themes/` (3), `common-apis/` (4), `coding-standards/` (2) = 38.

Directory names unchanged (`<area>-*` prefixes kept). The two catalog files (`_candidates.yaml`, `_wp-dev-candidates.yaml`) stay at `eval/scenarios/` root. The pre-existing `counter/` ↔ `name: counter-block` mismatch is carried forward unchanged (deliberate).

### Task 2 — e2e import depth (commit `ad5bc90`)
The sole relative import in each of the 27 `e2e.spec.mjs` files updated from `"../../utils/wp-cli.mjs"` to `"../../../utils/wp-cli.mjs"` (one extra `../` for the added nesting level). No other e2e content changed.

### Task 3 — `verify-e2e.ts` `scenarioDirOf` (commit `bd235f9`)
`scenarioDirOf` now returns the full relative path from the `scenarios` anchor (e.g. `plugins/cpt-register`) instead of the leaf basename, so failure attribution matches the relative `dirName` Skillsmith will report for nested scenarios. The flat case is preserved (`counter` → `counter`). Only this function and its doc comment changed.

### Task 4 — Catalog gap stubs (commit `f848f23`)
`_wp-dev-candidates.yaml` gains: (a) light `# folder: …` cross-reference comments on area headers; (b) a new `# === Agent-Skills Gaps ===` section with 9 review-triggerable stubs (`abilities-api-register`, `performance-object-cache`, `abilities-audit-rest-surface`, `abilities-verify-callbacks`, `phpstan-baseline`, `wordpress-router-classify`, `project-triage-report`, `plugin-directory-review`, `wpds-component-ui`). Each stub carries `source: agent-skills`, a GitHub `source_files` URL, an `# agent-skills:` provenance comment, and a `# Gap (...): <sub-class>` trigger marker; no `prompt`/`acceptance`. No existing record changed; the iAPI catalog is untouched.

## Verification

- Moves: all 66 files R100, zero `scenario.yaml` content change; folder counts exact.
- e2e: `node --check` passes on all 27; `npx playwright test --list` collects all 27 from nested paths, 0 errors.
- `verify-e2e.ts`: correct for all four flat/nested × relative/absolute path forms; introduces no tsc errors (the 43 remaining are confined to `node_modules`/Skillsmith).
- Catalog: parses as valid YAML; 9 gap stubs with markers; iAPI catalog byte-untouched.
- Invariants: `skills/`, `playwright.config.ts`, `README.md`, `skillsmith.config.ts`, `scaffold-plugin.ts`, `wp-cli.mjs` all untouched. No files added or deleted (no new scenarios).
- No project guardrails exist.

## Known / accepted state

Nested scenarios are invisible to the pinned `@automattic/skillsmith` until the documented upstream changes (recursive discovery + relative `dirName`) land — accepted temporary state. README and the Skillsmith dependency note are phase-5 (docs) scope.

## Follow-on (phase 5 — docs)

README updates (nested layout, nested `npx skillsmith <topic>/<scenario>` invocation, catalogs-stay-at-root + gaps-section note) and the Skillsmith nested-discovery dependency paragraph, plus the coverage-map artifact home.
