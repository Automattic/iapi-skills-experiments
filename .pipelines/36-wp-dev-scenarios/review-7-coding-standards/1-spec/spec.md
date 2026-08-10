# Spec: Coding Standards scenarios

## Overview

The `wordpress-development` skill is evaluated by a Skillsmith-based suite under `eval/`. Prior reviews established a broad area → sub-area taxonomy of developer.wordpress.org, a committed candidate catalog (`eval/scenarios/_wp-dev-candidates.yaml`), and implemented scenarios for the Interactivity API, a v1 set, and the Plugins, Block Editor, REST API, Themes, and Common APIs areas. The **Coding Standards** area (`https://developer.wordpress.org/coding-standards/`) is still uncovered: the catalog carries a single Coding Standards stub (`php-coding-standards-yoda`, a TODO with no prompt/acceptance), and no Coding Standards scenario is implemented.

This review extends coverage to the **Coding Standards** area with a small batch of simple, documentation-grounded, **judge-only** scenarios — reusing (not rebuilding) the existing taxonomy and catalog. Coding standards are static code-quality properties (naming, Yoda conditions, brace/spacing style, inline documentation) with no clean runtime surface, so the batch is deliberately two judge-only scenarios: one grading WordPress **PHP coding-standards** compliance on a small ordinary PHP feature, and one grading WordPress **PHPDoc inline-documentation-standards** compliance on a documented PHP function. The other candidate sub-areas (HTML, CSS, JavaScript, JSDoc, Accessibility) are deferred with recorded reasons and, because none has an existing catalog stub, receive no new catalog entry. As in prior reviews, the skill itself is not modified — the scenarios lead and the skill catches up in later work; verification is **static/structural only**, and scenarios are not required to pass against the current skill. The folders question is already resolved (review-2): the adopted `coding-standards-*` pseudo-folder naming is simply applied here.

The exact prompt prose, which small PHP feature each prompt asks for, the final `coding-standards-*` directory names, and the exact catalog-record text are design/plan/code decisions. This spec sets the selection, the per-scenario shape, the verification expectations, the catalog-consistency rules, and the "done" bar — not the answers.

For context, each implemented scenario follows the established Skillsmith conventions already used by the existing judge-only scenarios (e.g. `cron-event`, `common-apis-options`):
- A directory `eval/scenarios/<name>/` that is a flat immediate child of `eval/scenarios/`, containing a `scenario.yaml` and — for judge-only scenarios — **no** `e2e.spec.mjs`.
- `scenario.yaml` keys: `name`, `description`, `skills: [wordpress-development]`, `prompt`, `acceptance` (scenario-specific success points), and `rubrics` (a list, `[]` when none).
- Skillsmith discovers only immediate children of `eval/scenarios/` that contain a `scenario.yaml`; nested directories and non-directory / leading-underscore files are skipped (which is why the catalog file `_wp-dev-candidates.yaml` sits safely among real scenario directories).
- Provenance (source URLs) lives only in the catalog record, never in the `scenario.yaml`.

## Requirements

### A. Area and selection

1. **One area only: Coding Standards.** Every newly implemented scenario belongs to the Coding Standards area (`https://developer.wordpress.org/coding-standards/`). No newly implemented scenario targets any other top-level area, and the existing Interactivity API, v1, Plugins, Block Editor, REST API, Themes, and Common APIs scenarios are not re-scoped or renamed.

2. **No duplication with covered sub-areas.** No newly implemented scenario re-does an already-covered sub-area. In particular, Internationalization is already covered by `i18n-textdomain` and is NOT re-done. No existing scenario grades PHP code style or PHPDoc inline documentation, so the two implemented scenarios introduce no overlap.

3. **Judge-only is the governing verification mode for this area.** Coding standards are static code-quality properties with no runtime-observable surface; therefore every scenario in this batch is judge-only — acceptance is graded by inspecting the produced source, not by a front-end assertion. No scenario in this batch ships an `e2e.spec.mjs`.

### B. The adopted batch

4. **Adopted batch: two judge-only scenarios.** The implemented batch is exactly two:
   - **(i) `coding-standards-php`** — a judge-only scenario whose prompt asks, in user voice, for a small ordinary PHP feature, and whose acceptance grades the delivered PHP against the **WordPress PHP coding standards**.
   - **(ii) `coding-standards-inline-docs`** — a judge-only scenario whose prompt asks, in user voice, for a documented PHP function, and whose acceptance grades the delivered doc block against the **WordPress PHPDoc inline-documentation standards**.
   A smaller batch than some prior reviews is acceptable, as the intent explicitly permits deferring sub-areas that are covered, duplicative, or not simply expressible as a judge-only scenario.

5. **`coding-standards-php` acceptance enumerates concrete WPCS rules.** The acceptance for `coding-standards-php` enumerates statically checkable WordPress PHP coding-standards rules that the delivered PHP must satisfy, drawn from the PHP coding-standards documentation, including at least: Yoda conditions in comparisons, WordPress brace style, correct spacing (e.g. spaces inside parentheses), and prefixed / `snake_case` naming. The acceptance points are grounded in `https://developer.wordpress.org/coding-standards/wordpress-coding-standards/php/` (and the WPCS landing page).

6. **`coding-standards-inline-docs` acceptance enumerates concrete PHPDoc rules.** The acceptance for `coding-standards-inline-docs` enumerates statically checkable PHPDoc inline-documentation rules that the delivered doc block must satisfy, including at least: a summary line, a `@param` entry per parameter (with types and names), a `@return` entry, an `@since` tag using a three-digit version, and proper alignment / formatting of the doc block. The acceptance points are grounded in `https://developer.wordpress.org/coding-standards/inline-documentation-standards/php/`.

6a. **Each scenario is one concept, one small PHP deliverable.** Each implemented scenario asks for a single small PHP deliverable graded on one standards concept, with a handful of acceptance points. No theme artifact, no block type, no JS toolchain, no custom database table, no second deliverable, and no multi-step task.

### C. Per-scenario shape

7. **Schema-conformant, tool-agnostic, doc-grounded scenarios.** Each implemented scenario is a directory that is a flat immediate child of `eval/scenarios/`, containing a `scenario.yaml` with exactly `name` (lowercase-kebab matching `/^[a-z0-9-]+$/`, equal to the directory name), `description`, `skills: [wordpress-development]`, `prompt`, `acceptance` (scenario-unique check statements), and `rubrics` (present as an array), with no catalog-only fields (`difficulty`, `concepts`, `source`, `source_files`). The `prompt` reads as a user-voice, outcome-phrased request that does NOT name the standard, a tool (e.g. PHPCS / WPCS), a function, or a hook — the user asks for an ordinary outcome, and following the standard is the skill's job. The `acceptance` strings are clean human-readable checks with no embedded source URLs.

8. **`rubrics: []` on every scenario.** Each new scenario declares `rubrics` as an explicit empty array (`Array.isArray(rubrics)` is true). No scenario in this batch references a shared rubric, and no new shared rubric under `eval/rubrics/` is created by this review.

### D. Naming

9. **`coding-standards-*` pseudo-folder naming; the existing stub is renamed, existing scenarios are not.** Each implemented scenario uses the adopted `coding-standards-*` prefix, with the directory name == the `scenario.yaml` `name` == the catalog record `name`, all identical and each matching `/^[a-z0-9-]+$/`. The existing catalog stub `php-coding-standards-yoda` is **renamed** to `coding-standards-php` on promotion (a catalog-record rename, as in prior reviews — no shipped scenario directory exists for it yet). `coding-standards-inline-docs` is a brand-new name. No existing scenario is renamed.

### E. Catalog update

10. **Full catalog record per implemented scenario (1:1 identity, verbatim prompt+acceptance).** For each of the two implemented scenarios, `_wp-dev-candidates.yaml` contains a full record under the Coding Standards area whose `name` equals the scenario's directory name and its `scenario.yaml` `name`, carrying the same `prompt` and `acceptance` text as the shipped `scenario.yaml` verbatim (same text, order, and quoting), plus `description`, `difficulty`, `concepts`, `source`, and `source_files` citing the developer.wordpress.org page(s) that ground its acceptance points. The `coding-standards-inline-docs` record's `source_files` cite the on-domain PHPDoc inline-documentation page (`https://developer.wordpress.org/coding-standards/inline-documentation-standards/php/`). Provenance (source URLs) lives only in the catalog record, never in the `scenario.yaml`.

11. **Stub promoted; both records placed under an Implemented sub-header.** The existing `php-coding-standards-yoda` stub is promoted to a full record renamed to `coding-standards-php`; `coding-standards-inline-docs` is added as a brand-new full record (no prior Coding Standards stub). Both full records are placed under a new `# Implemented Coding Standards scenarios — full records` sub-header within the Coding Standards area, mirroring the Themes / Block Editor / REST API / Common APIs pattern. After the update, no Coding Standards stub carries a `# Deferred:` comment, and every implemented Coding Standards sub-area is represented by exactly one full record under its final `coding-standards-*` name, with no orphaned stub duplicating an implemented sub-area and no name mismatch between any record and its scenario directory.

12. **Header line kept accurate.** The catalog's header comment listing which areas have full prompt+acceptance is updated to also list **Coding Standards** alongside the already-listed areas. This is the only header change.

13. **iAPI catalog and non-Coding-Standards records untouched; no new deferred stubs.** The Interactivity-API catalog `eval/scenarios/_candidates.yaml` is not modified. Within `_wp-dev-candidates.yaml`, only Coding Standards records (the promoted+renamed record and the new record) and the single shared header-comment change occur; no other area's records are rebuilt, re-derived, moved, renamed, or annotated. No new catalog stub is added for any deferred sub-area (see Out of Scope).

### F. Done-criteria and non-disruption

14. **Static/structural verification only; pass not required.** Each implemented scenario is statically/structurally verified to be discoverable by Skillsmith — a flat, non-underscore directory containing a `scenario.yaml` that parses and exposes `rubrics` as an array (`Array.isArray(rubrics)` true) — and each judge-only scenario directory contains no `e2e.spec.mjs`. The catalog file parses as valid YAML and remains discovery-skipped (its leading-underscore filename). A failing grade against the current skill is acceptable and does not violate this bar. No agent runs the full `scenarios × testing-agents` matrix, boots `wp-env` for a real pass, or generates the scenario solution code.

15. **Skill untouched.** No file under `skills/wordpress-development/` is modified by this review.

16. **Existing suite intact; flat discovery preserved.** The existing Interactivity API suite, the v1, Plugins, Block Editor, REST API, Themes, and Common APIs scenarios, and the existing `_candidates.yaml` are not moved, renamed, reorganized, or broken; Skillsmith's flat discovery under `eval/scenarios/` continues to enumerate them; and the two new scenario directories are flat immediate children of `eval/scenarios/`.

## Out of Scope

1. **HTML coding-standards scenario — deferred, not stubbed.** The on-domain HTML page specifies only five thin hygiene rules (lowercase tags, double-quoted attributes, self-closing-tag space, tabs, logical indentation), too low-signal for a standalone scenario; these rules are already incidentally visible in any PHP scenario that echoes markup. Having no catalog stub today, it gets no new catalog entry; its exclusion is recorded only in this spec (and the design doc).

2. **CSS coding-standards scenario — deferred, not stubbed.** Its rules are formatting-oriented and require a separate `.css` deliverable the plugin scaffold lacks (enqueue + CSS standards = two concepts), making it thin as a standalone. Having no catalog stub today, it gets no new catalog entry; its exclusion is recorded only in this spec (and the design doc).

3. **JavaScript coding-standards scenario — deferred, not stubbed.** Its checkable rules (`===`, semicolons, camelCase, always-braces, tabs) are low-distinctiveness (modern models satisfy them by default → near-zero failure signal), and the scenario would require two deliverables (a PHP plugin plus a JS file). Having no catalog stub today, it gets no new catalog entry; its exclusion is recorded only in this spec (and the design doc).

4. **JSDoc inline-documentation scenario — deferred, not stubbed.** It is a JS-only deliverable with the same thinness / feasibility caveat as the JavaScript scenario. Having no catalog stub today, it gets no new catalog entry; its exclusion is recorded only in this spec (and the design doc).

5. **Accessibility coding-standards scenario — deferred, not stubbed.** The on-domain Accessibility page specifies no concrete normative rules; it mandates WCAG 2.2 AA and links off-domain to W3C — the same off-domain-grounding failure that deferred WP-CLI. Having no catalog stub today, it gets no new catalog entry; its exclusion is recorded only in this spec (and the design doc).

6. **A shared coding-standards rubric.** A shared rubric (à la `eval/rubrics/wp-interactivity-api-best-practices.md`) for the cross-cutting standards sub-areas is recorded as a plausible future enhancement (a recommendation), but is NOT created by this review and does not block it.

7. **Any change to the skill** (`skills/wordpress-development/`).

8. **Re-exploring or re-litigating the folders question** (resolved in review-2; the `coding-standards-*` pseudo-folder naming is simply applied here).

9. **Renaming or reorganizing the existing scenarios**, or any change to the iAPI `_candidates.yaml` or to non-Coding-Standards records in `_wp-dev-candidates.yaml`.

10. **Requiring scenarios to pass against the current skill, running the full `scenarios × testing-agents` matrix, or booting `wp-env` for a live pass.** Well-formedness / discoverability (a parsing `scenario.yaml` with `Array.isArray(rubrics)`, no `e2e.spec.mjs`) is the bar.

11. **Generating the scenario solution code for any scenario.**

## Acceptance Criteria

1. **One area: Coding Standards**
   Given the newly implemented scenarios, When mapping each to a top-level area, Then every one belongs to the Coding Standards area; And the existing Interactivity API, v1, Plugins, Block Editor, REST API, Themes, and Common APIs scenarios are unchanged in scope and unrenamed.

2. **No duplication with covered sub-areas**
   Given each newly implemented scenario, When identifying its sub-area, Then it is neither Internationalization (covered by `i18n-textdomain`) nor any other already-covered sub-area; And no existing scenario grades PHP code style or PHPDoc inline documentation.

3. **Adopted batch of two, both judge-only**
   Given the newly implemented scenarios, When counting them, Then there are exactly two — `coding-standards-php` (grades WordPress PHP coding-standards compliance on a small PHP feature) and `coding-standards-inline-docs` (grades WordPress PHPDoc inline-documentation compliance on a documented PHP function); And When inspecting each directory, Then it contains a `scenario.yaml` and NO `e2e.spec.mjs`.

4. **`coding-standards-php` acceptance enumerates concrete WPCS rules**
   Given `coding-standards-php`'s `scenario.yaml`, When reading its `acceptance`, Then it enumerates statically checkable WordPress PHP coding-standards rules including at least Yoda conditions, WordPress brace style, correct spacing (e.g. spaces inside parentheses), and prefixed / `snake_case` naming.

5. **`coding-standards-inline-docs` acceptance enumerates concrete PHPDoc rules**
   Given `coding-standards-inline-docs`'s `scenario.yaml`, When reading its `acceptance`, Then it enumerates statically checkable PHPDoc rules including at least a summary line, a `@param` entry per parameter, a `@return` entry, an `@since` tag with a three-digit version, and proper alignment / formatting of the doc block.

6. **Each scenario is one concept, one small PHP deliverable**
   Given each newly implemented scenario, When inspecting what it asks for, Then it asks for a single small PHP deliverable graded on one standards concept, with a handful of acceptance points, and it requires no theme artifact, no block type, no JS toolchain, no custom database table, no second deliverable, and no multi-step task.

7. **Schema conformance, tool-agnostic, doc-grounded**
   Given each newly implemented scenario's `scenario.yaml`, When reading it, Then it has exactly `name` (lowercase-kebab matching `/^[a-z0-9-]+$/` and equal to the directory name), `description`, `skills: [wordpress-development]`, `prompt`, `acceptance`, and `rubrics`, with no catalog-only fields (`difficulty`, `concepts`, `source`, `source_files`); And When reading its `prompt`, Then it is a user-voice, outcome-phrased request that does not name the standard, a tool, a function, or a hook; And When reading its `acceptance` strings, Then they are clean human-readable checks with no embedded URLs; And the developer.wordpress.org page(s) grounding its acceptance points are cited in its catalog entry, not its `scenario.yaml`.

8. **`rubrics` is an explicit empty array**
   Given each newly implemented scenario, When reading its `rubrics` key, Then it is present as `[]` (an array, `Array.isArray` true); And no scenario references a shared rubric; And no new shared rubric is created under `eval/rubrics/` by this review.

9. **`coding-standards-*` naming applied; existing scenarios not renamed**
   Given each newly implemented scenario, When inspecting its directory name, its `scenario.yaml` `name`, and its catalog record `name`, Then all three are identical, carry the `coding-standards-` prefix, and match `/^[a-z0-9-]+$/`; And the promoted record does not keep the legacy name `php-coding-standards-yoda`; And no existing scenario is renamed.

10. **Full catalog record per implemented scenario (1:1 identity, verbatim)**
    Given each of the two newly implemented scenarios, When inspecting `_wp-dev-candidates.yaml`, Then there is exactly one full Coding Standards record whose `name` equals the scenario's directory name and its `scenario.yaml` `name`, whose `prompt` and `acceptance` text match the shipped `scenario.yaml` verbatim (same text, order, and quoting), and which carries `description`, `difficulty`, `concepts`, `source`, and `source_files` citing the grounding developer.wordpress.org page(s); And no source URL appears in any `scenario.yaml`; And the `coding-standards-inline-docs` record's `source_files` cite `https://developer.wordpress.org/coding-standards/inline-documentation-standards/php/`.

11. **Stub promoted and reconciled under the Implemented sub-header**
    Given the updated catalog, When inspecting the Coding Standards records, Then `php-coding-standards-yoda` is promoted to a full record renamed to `coding-standards-php`, and `coding-standards-inline-docs` is a brand-new full record; And both sit under a new `# Implemented Coding Standards scenarios — full records` sub-header within the Coding Standards area; And no Coding Standards stub carries a `# Deferred:` comment; And every implemented Coding Standards sub-area is represented by exactly one full record under its final `coding-standards-*` name, with no orphaned stub and no name mismatch between any record and its scenario directory.

12. **Header line kept accurate**
    Given the catalog's header comment listing which areas have full prompt+acceptance, When reading it after the update, Then it lists Coding Standards alongside the already-listed areas; And that header line is the only header change.

13. **iAPI catalog and non-Coding-Standards records untouched; no new deferred stubs**
    Given the review's diff, When inspecting `eval/scenarios/_candidates.yaml` and the non-Coding-Standards records in `_wp-dev-candidates.yaml`, Then `_candidates.yaml` is unmodified, and only Coding Standards records (the promoted+renamed record and the new record) plus the single shared header-comment change appear in `_wp-dev-candidates.yaml`; And no new catalog stub is added for any deferred sub-area (HTML, CSS, JavaScript, JSDoc, Accessibility).

14. **Discoverable, judge-only, pass not required**
    Given any newly implemented scenario, When it is statically/structurally verified, Then it is a flat, non-underscore directory containing a `scenario.yaml` that parses and exposes `rubrics` as an array, and contains no `e2e.spec.mjs`; And the catalog file parses as valid YAML and stays discovery-skipped (leading-underscore filename); And a failing grade against the current skill does not violate this criterion; And no agent runs the full `scenarios × testing-agents` matrix, boots `wp-env` for a real pass, or generates the scenario solution code.

15. **Skill unchanged**
    Given the review's diff, When inspecting paths under `skills/wordpress-development/`, Then no file there is modified.

16. **Existing suite intact; flat discovery preserved**
    Given the review's diff, When inspecting the existing Interactivity API suite, the v1, Plugins, Block Editor, REST API, Themes, and Common APIs scenarios, and the existing `_candidates.yaml`, Then none are moved, renamed, reorganized, or broken; Skillsmith's flat discovery still enumerates them; And the two new scenario directories are flat immediate children of `eval/scenarios/`.

17. **Deferred sub-areas have the right footprint**
    Given the deferred Coding Standards sub-areas (HTML, CSS, JavaScript, JSDoc, Accessibility), When inspecting the review's output, Then none is implemented as a scenario and none is added as a new catalog stub; And each defer reason is recorded only in this spec (and the design doc); And a shared coding-standards rubric is recorded as a non-blocking recommendation only and is not created.
