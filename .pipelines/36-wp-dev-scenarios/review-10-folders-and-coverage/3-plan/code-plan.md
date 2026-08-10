# Code plan — review-10-folders-and-coverage

**Compression note:** authored inline by the orchestrator from the approved+reviewed design doc (`2-design-doc/design-doc.md`, `efb94cd`), which already holds the authoritative 38-row move map, the exact `verify-e2e.ts` change, and the concrete content of all 9 gap stubs. The independent verification gate is preserved at phase 4 (a fresh code-reviewer reviews the whole batch). The code-writer MUST take the move map / verify-e2e change / gap-stub content **verbatim** from the design doc. No project guardrails exist.

## Tasks (commit incrementally — a stall after any task leaves a clean, resumable state)

### Task 1 — Move all 38 scenarios into 7 topic folders (`git mv`)
- **Goal:** real per-topic folders under `eval/scenarios/`: `interactivity-api/`, `plugins/`, `block-editor/`, `rest-api/`, `themes/`, `common-apis/`, `coding-standards/`.
- **Changes:** `git mv eval/scenarios/<name> eval/scenarios/<topic>/<name>` for each of the 38 per the design doc's move table (names unchanged — prefixes kept). The two catalog files (`_candidates.yaml`, `_wp-dev-candidates.yaml`) stay at `eval/scenarios/` root (NOT moved).
- **Acceptance:** all 38 dirs relocated exactly once; `git status` shows renames (R) with no content change to `scenario.yaml`; the 7 folders each contain the expected count (iAPI 11, Plugins 9, Block Editor 5, REST API 4, Themes 3, Common APIs 4, Coding Standards 2); the catalogs remain at root.
- **Commit:** `Move scenarios into per-topic folders (code-writer)`.

### Task 2 — Fix e2e import depth (27 specs)
- **Goal:** the 27 moved `e2e.spec.mjs` now sit one level deeper, so their sole relative import must gain one `../`.
- **Changes:** in every `eval/scenarios/<topic>/<name>/e2e.spec.mjs`, change `from "../../utils/wp-cli.mjs"` → `from "../../../utils/wp-cli.mjs"`. (Design-confirmed: `wp-cli.mjs` is the ONLY relative import in every spec.)
- **Acceptance:** all 27 specs import `"../../../utils/wp-cli.mjs"`; `node --check` passes on each; Playwright `--list` collects them (no boot). No spec retains a `"../../utils/..."` relative import.
- **Commit:** `Fix e2e import depth for nested scenarios (code-writer)`.

### Task 3 — Update `verify-e2e.ts` `scenarioDirOf` for nested dirNames
- **Goal:** failure attribution must not silently break when `dirName` is a nested relative path (e.g. `plugins/cpt-register`).
- **Changes:** apply the design doc's exact change to `scenarioDirOf` (~lines 217-229) so it returns the full relative path from the `scenarios` anchor instead of the leaf basename, preserving the current flat case. No other behavior changes.
- **Acceptance:** the function handles all four path forms (flat/nested × relative/absolute) per the design; `tsc`/`node --check` (or the repo's typecheck) passes; flat-case behavior unchanged.
- **Commit:** `Update verify-e2e for nested scenario dirNames (code-writer)`.

### Task 4 — Catalog: light header cross-refs + the 9 agent-skills gap stubs
- **Goal:** reflect the folder layout in catalog comments and record the 9 coverage gaps as review-triggerable stubs.
- **Changes:** in `_wp-dev-candidates.yaml`: (a) light area-header/comment updates per the design (do NOT churn records, names, prompts, or acceptance); (b) add a new `# === Agent-Skills Gaps ===` section with the 9 gap stubs verbatim from the design doc — each with `name`/`description`/`difficulty`/`concepts`/`source: agent-skills`/`source_files` (GitHub URL)/`# agent-skills: <skill>` provenance/`# Gap (agent-skills/<skill>): <sub-class>` marker, NO `prompt`/`acceptance`. iAPI `_candidates.yaml` and all existing wp-dev records' prompt/acceptance untouched.
- **Acceptance:** YAML parses; both catalogs stay discovery-skipped; 9 new gap stubs present with the markers; no existing record's prompt/acceptance changed; iAPI catalog byte-untouched.
- **Commit:** `Add agent-skills coverage gap stubs to catalog (code-writer)`.

## Out of scope (this phase)
- README + Skillsmith-dependency doc + the coverage-map artifact → **phase 5 (docs)**.
- No new scenarios; no prefix-dropping rename; the `counter`/`counter-block` mismatch left as-is.

## E2E test plan
No new e2e specs authored; the 27 existing specs are verified collectable post-move (Playwright `--list`, `node --check`). No wp-env boot (and note: nested scenarios are invisible to the pinned Skillsmith until the upstream change lands — accepted).
