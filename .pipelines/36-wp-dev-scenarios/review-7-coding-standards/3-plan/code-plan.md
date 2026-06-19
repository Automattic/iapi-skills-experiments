# Code plan — review-7-coding-standards

**Compression note:** review-7 is a small, judge-only, 2-scenario batch whose approved+reviewed design doc (`2-design-doc/design-doc.md`, `79920b5`) already specifies the concrete prompts, acceptance lists, and catalog reconciliation. To reduce exposure to the harness's recurring background-agent watchdog stalls, the orchestrator authored this plan (and the doc plan) inline directly from the approved design doc, rather than running the code-plan-writer/reviewer pair. The independent verification gate is preserved at phase 4 (a fresh code-reviewer reviews the whole batch against spec + design). The code-writers MUST take the **verbatim** prompt + acceptance from the design doc.

No project guardrails are declared (none exist in the repo) — no guardrail-scope section.

## Tasks (3, independent; run sequentially — shared git index + Task 3 touches a shared file)

### Task 1 — `coding-standards-php` (judge-only)
- **Goal:** ship the PHP coding-standards scenario (promote+rename of the `php-coding-standards-yoda` catalog stub).
- **Files:** `eval/scenarios/coding-standards-php/scenario.yaml` (ONLY — no `e2e.spec.mjs`).
- **Changes:** keys `name: coding-standards-php`, `description`, `skills: [wordpress-development]`, `prompt` (verbatim from design doc — user-voice, tool-agnostic, a small status-to-label helper that naturally forces a comparison/conditional; must NOT name Yoda/WPCS/a function), `acceptance` (verbatim from design doc — enumerates Yoda conditions, WordPress brace style, spacing, prefixed/snake_case naming; no URLs), `rubrics: []`.
- **Type:** e2e (writer: code-writer-e2e), but **no e2e.spec.mjs is produced** (judge-only).
- **Traces to:** spec R1/R3-R6; design §scenario `coding-standards-php`.
- **Acceptance:** dir discoverable (flat, non-underscore, `scenario.yaml` with `Array.isArray(rubrics)`); YAML parses; no `e2e.spec.mjs`; prompt tool-agnostic; acceptance enumerates the 4 WPCS rule families.

### Task 2 — `coding-standards-inline-docs` (judge-only)
- **Goal:** ship the PHPDoc inline-documentation scenario (new).
- **Files:** `eval/scenarios/coding-standards-inline-docs/scenario.yaml` (ONLY — no `e2e.spec.mjs`).
- **Changes:** keys `name: coding-standards-inline-docs`, `description`, `skills: [wordpress-development]`, `prompt` (verbatim from design doc — user-voice, tool-agnostic, asks to document a parameterized, value-returning function; must NOT name PHPDoc/the tags), `acceptance` (verbatim from design doc — enumerates summary line, `@param` per parameter, `@return`, `@since` 3-digit, alignment; no URLs), `rubrics: []`.
- **Type:** e2e (writer: code-writer-e2e), **no e2e.spec.mjs** (judge-only).
- **Traces to:** spec R2/R3-R6; design §scenario `coding-standards-inline-docs`.
- **Acceptance:** dir discoverable; YAML parses; no `e2e.spec.mjs`; prompt tool-agnostic; acceptance enumerates the PHPDoc rule families.

### Task 3 — Catalog promotion (`eval/scenarios/_wp-dev-candidates.yaml`, in place)
- **Goal:** reconcile the candidate catalog with the 2 shipped scenarios.
- **Files:** `eval/scenarios/_wp-dev-candidates.yaml` (in-place edit; Coding Standards section + the one header line only).
- **Changes:** (a) **promote+rename** the existing `php-coding-standards-yoda` stub → full record `coding-standards-php`; (b) **add** new full record `coding-standards-inline-docs` (`source_files`: the on-domain PHPDoc inline-documentation page; the design doc gives the URL); (c) place both under a new `# Implemented Coding Standards scenarios — full records` sub-header; (d) **fix the header line** (~line 29) to add **Coding Standards** to the implemented-areas list (lone header change). Each record's `name`/`prompt`/`acceptance` **match the committed `scenario.yaml` verbatim**. **NO** new stubs for the 5 deferred sub-areas (HTML/CSS/JS/JSDoc/Accessibility — none has an existing stub). The iAPI `_candidates.yaml` and ALL non-Coding-Standards records stay **byte-untouched**.
- **Type:** e2e (writer: code-writer-e2e), no spec file.
- **Traces to:** spec R9-R12; design §catalog promotion.
- **Acceptance:** file parses + stays discovery-skipped; old stub name `php-coding-standards-yoda` gone; 2 `coding-standards-*` full records present, prompt/acceptance verbatim-matching the scenario.yaml; header line lists Coding Standards; diff confined to the Coding Standards section + the header line.

## E2E test plan
None — both scenarios are judge-only; no Flow. (Type is `e2e` only to route to the code-writer-e2e; no `e2e.spec.mjs` is authored this batch.)
