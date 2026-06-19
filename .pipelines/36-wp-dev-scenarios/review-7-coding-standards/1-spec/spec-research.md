# Spec Research

## Rough Idea

Extend the `wordpress-development` eval suite's coverage to the **Coding Standards** area with simple, documentation-driven, judge-only scenarios. Build on the existing taxonomy and the `eval/scenarios/_wp-dev-candidates.yaml` candidate catalog. Promote the existing `php-coding-standards-yoda` stub and add records for new scenarios. Apply the adopted `coding-standards-*` pseudo-folder naming.

Key constraints from the intent:
- **Judge-only only** (no e2e): coding standards are static code-quality properties, not runtime-observable.
- Scenarios stay simple (one concept, one small feature), user-voice, tool-agnostic prompts, `rubrics: []`.
- Skill (`skills/wordpress-development/`) is not modified.
- Internationalization already covered (`i18n-textdomain`) — do not re-do.
- Candidate sub-areas: **PHP** (WPCS — Yoda conditions, brace style, naming/prefixing, spacing), **HTML**, **CSS**, **JavaScript**, **Accessibility**, **Inline Documentation Standards** (PHPDoc/JSDoc).
- ~1 scenario per major sub-area; a focused subset is fine.
- Static/structural verification only; scenarios not required to pass against current skill.

Existing catalog stub for this area (single entry):
```yaml
- name: php-coding-standards-yoda
  description: Apply WordPress PHP coding standards — Yoda conditions, brace style, spacing.
  difficulty: simple
  concepts: [WPCS, PHP coding standards, Yoda conditions]
  source: dev.wordpress.org
  source_files:
    - https://developer.wordpress.org/coding-standards/wordpress-coding-standards/php/
    - https://developer.wordpress.org/coding-standards/wordpress-coding-standards/
  # TODO: prompt + acceptance
```

## Q&A

### Q1: What does each Coding Standards sub-area's documentation actually cover, and which sub-areas produce the most naturally gradeable judge-only scenarios?

**A:** All six sub-area URLs verified on-domain. Gradeability summary:
- **PHP (WPCS):** Strong. Concrete checkable rules — Yoda conditions, brace style, spacing, naming/prefixing. Maps cleanly to the existing `php-coding-standards-yoda` stub (promote + rename to `coding-standards-php`).
- **Inline Docs PHP (PHPDoc):** Strong. Concrete rules — summary line + `@param` + `@return` + `@since` (3-digit) + alignment. "Document a function" scenario grades cleanly.
- **Accessibility:** Weak as standalone scenario. Page merely mandates WCAG 2.2 AA compliance and links off-domain to W3C — normative rules live off-domain. Could pin self-contained points (label+for, ARIA) but on-domain grounding is thin.
- **HTML:** Has concrete rules (lowercase tags, quoted attrs, indentation) but mostly style/formatting — thin standalone scenario signal.
- **CSS:** Concrete but mostly formatting rules — similar thinness as HTML.
- **JavaScript:** Concrete rules (===, camelCase, spacing) but JS-toolchain feasibility caveat applies (same JS-only concerns that deferred other JS scenarios in the catalog). JSDoc similarly.
- **Dedup:** No overlap confirmed — no existing scenario grades PHP style. `i18n-textdomain` covers i18n. REST namespace prefix is a different concept.

**Reasoning:** Researcher verified all URLs, checked all existing scenarios and rubrics for overlap, and flagged gradeability per sub-area.

**Sources:** https://developer.wordpress.org/coding-standards/wordpress-coding-standards/php/, https://developer.wordpress.org/coding-standards/inline-documentation-standards/php/, https://developer.wordpress.org/coding-standards/wordpress-coding-standards/accessibility/, https://developer.wordpress.org/coding-standards/wordpress-coding-standards/html/, https://developer.wordpress.org/coding-standards/wordpress-coding-standards/css/, https://developer.wordpress.org/coding-standards/wordpress-coding-standards/javascript/

### Q2 + Q3 (consolidated): HTML/CSS/JS viability, prior JS-deferral reasoning, and catalog Coding Standards section

**A:**

**HTML:** Five rules total (lowercase, double-quoted attrs, self-closing space, tabs, logical indentation) — all hygiene. Too thin for a standalone scenario. Rules ARE visible in PHP files that echo HTML inline (shortcode callback, admin page render, etc.), so no separate deliverable is required for a PHP scenario that also grades HTML output. But a dedicated HTML scenario would have near-zero failure signal for a modern model.

**CSS:** Larger rule set (~8 sections: property ordering, selector naming, shorthand, values, media queries, commenting). But the deliverable must be a `.css` file, and the plugin scaffold has none — the agent would need to create and enqueue a stylesheet, making this a "two-concept" scenario (enqueue + CSS standards). Viable as a rubric addendum on an enqueue scenario; thin as a standalone.

**JavaScript:** Checkable rules (`===`, semicolons, camelCase, always-braces, tabs). No Yoda conditions in JS (PHP-only). Feasible via a plain `.js` file + `wp_enqueue_script` with no toolchain. But the scenario would be "write a plugin that enqueues a JS file and write the file following WP JS standards" — two deliverables (one PHP + one JS). Grading points are low-distinctiveness (modern JS already uses `===` and semicolons). Thin as a standalone.

**Accessibility:** On-domain page contains NO concrete normative rules — mandates WCAG 2.2 AA and links off-domain to W3C. Same off-domain grounding failure that deferred WP-CLI. Definitively defer.

**JS-deferral precedent:** Review-1 design-doc deferred `ajax-handler` (Plugins/JS area) for "awkward as a non-block `index.php` edit, admin-ajax patterns are dated." Different sub-area. No prior review explicitly deferred a JS-coding-standards scenario. The review-4 Themes spec established "no JS toolchain" as a shared convention; a plain `.js` file satisfies it.

**Catalog confirmation:** The Coding Standards section of `_wp-dev-candidates.yaml` contains exactly ONE entry — `php-coding-standards-yoda` (a TODO stub, no prompt/acceptance). No HTML, CSS, JS, Accessibility, or PHPDoc stubs exist in this area. Under the intent's stub rule, deferred sub-areas without existing stubs get no new catalog entry unless the spec explicitly elects to add one with a recorded reason.

**Researcher verdict table:**

| Sub-area | Verdict | Reason |
|---|---|---|
| PHP (WPCS) | IMPLEMENT — promote+rename stub | Concrete rules, all statically gradeable, existing stub to promote |
| PHPDoc | IMPLEMENT — new scenario | Concrete, gradeable, zero overlap |
| HTML | DEFER (no stub) | 5 thin hygiene rules; too thin for standalone; no existing stub |
| CSS | DEFER (no stub) | Formatting-only; needs `.css` deliverable (second concept); no existing stub |
| JS coding standards | DEFER (no stub) | Thin rules; two-deliverable scenario; no existing stub |
| JS docs (JSDoc) | DEFER (no stub) | JS-only deliverable; no existing stub |
| Accessibility | DEFER (no stub) | No concrete rules on-domain; all criteria off-domain at W3C; no existing stub |

**Reasoning:** Researcher fetched all sub-area pages, checked prior specs for JS deferral reasoning, and confirmed catalog Coding Standards section.

**Sources:** `eval/scenarios/_wp-dev-candidates.yaml` lines 444–454; `.pipelines/36-wp-dev-scenarios/review-1-wp-dev-taxonomy-coverage/2-design-doc/design-doc.md` lines 482–484; `.pipelines/36-wp-dev-scenarios/review-4-themes/1-spec/spec.md` line 30; https://developer.wordpress.org/coding-standards/wordpress-coding-standards/html/; https://developer.wordpress.org/coding-standards/wordpress-coding-standards/css/; https://developer.wordpress.org/coding-standards/wordpress-coding-standards/javascript/; https://developer.wordpress.org/coding-standards/wordpress-coding-standards/accessibility/

## Research

The four-question Q&A above (with the researcher's verdict table) is the complete research record. No empirical/wp-env experiment was required — Coding Standards scenarios are judge-only (static code-quality properties), so feasibility rests on (a) on-domain grounding of concrete checkable rules and (b) expressibility as a simple, tool-agnostic, single-deliverable scenario, both established by document inspection.

**Orchestrator note:** the spec-analyst stalled on the harness stream watchdog immediately before writing this consolidated section. All four Q&A blocks and the verdict table were already written and are the analyst's work; the orchestrator finished only the consolidation below, faithfully transcribing the analyst's stated final batch decision (`coding-standards-php` + `coding-standards-inline-docs`; defer HTML/CSS/JS/JSDoc/Accessibility with no new stubs) and then committed the file.

## Consolidated Requirements

### Batch (2 judge-only scenarios)

**R1 — `coding-standards-php` (promote + rename the existing `php-coding-standards-yoda` stub).** A judge-only scenario whose prompt asks, in user voice and tool-agnostically, for a small, ordinary PHP feature (e.g. a tiny helper/callback), and whose acceptance grades **WordPress PHP coding-standards compliance** on the delivered PHP: Yoda conditions in comparisons, WordPress brace style, correct spacing (e.g. spaces inside parentheses), and prefixed/`snake_case` naming. `scenario.yaml` only; `rubrics: []`. Grounded in https://developer.wordpress.org/coding-standards/wordpress-coding-standards/php/ (+ the WPCS landing).

**R2 — `coding-standards-inline-docs` (new scenario).** A judge-only scenario whose prompt asks, in user voice and tool-agnostically, for a documented PHP function, and whose acceptance grades **WordPress PHPDoc inline-documentation-standards compliance**: a summary line, `@param` entries (with types/names), an `@return` entry, an `@since` tag (3-digit version), and proper alignment/format of the doc block. `scenario.yaml` only; `rubrics: []`. Grounded in https://developer.wordpress.org/coding-standards/inline-documentation-standards/php/.

### Scope / framing

**R3 — Judge-only, no e2e.** Both scenarios ship `scenario.yaml` ONLY (no `e2e.spec.mjs`). Coding standards are static code-quality properties with no runtime surface; acceptance is graded by inspecting the produced source. (Matches the established judge-only first-class shape, e.g. `cron-event`, `common-apis-options`.)

**R4 — Simple, tool-agnostic, single-deliverable.** Each scenario is one concept on a single small PHP deliverable. Prompts must NOT name the standard, a tool (PHPCS/WPCS), a function, or a hook — the user asks for an ordinary outcome; following the standard is the skill's job. Pin no e2e literals (judge-only).

**R5 — `coding-standards-*` naming.** Directory name == `scenario.yaml` `name` == catalog record name; flat immediate children matching `/^[a-z0-9-]+$/`. The existing stub `php-coding-standards-yoda` is **renamed** to `coding-standards-php` (a catalog-record rename, as with prior promotions). Existing scenarios are NOT renamed.

**R6 — `rubrics: []` on every scenario.** Explicit empty array (`Array.isArray` true). No scenario references a shared rubric.

### Deferrals (recorded; NO new catalog stubs)

**R7 — Defer HTML, CSS, JavaScript, JSDoc, and Accessibility**, each with a recorded reason, and — because **none has an existing catalog stub** — add **NO** new catalog entry for them (per the intent's scoped stub rule). Reasons:
- **HTML** — five thin hygiene rules (lowercase tags, quoted attrs, self-closing space, tabs, logical indentation); too low-signal for a standalone scenario; HTML rules are already incidentally visible in any PHP scenario that echoes markup.
- **CSS** — formatting-oriented rules requiring a separate `.css` deliverable the plugin scaffold lacks (enqueue + CSS = two concepts); thin as a standalone.
- **JavaScript** — checkable but low-distinctiveness rules (`===`, semicolons, camelCase, always-braces, tabs); two-deliverable scenario (PHP + JS); modern models satisfy these by default → near-zero failure signal.
- **JSDoc** — JS-only deliverable; same thinness/feasibility caveat.
- **Accessibility** — the on-domain page specifies NO concrete normative rules; it mandates WCAG 2.2 AA and links off-domain to W3C — the same off-domain grounding failure that deferred WP-CLI. Definitively off-domain.

**R8 — Rubric option (recommendation only, non-blocking).** A shared coding-standards rubric (à la `eval/rubrics/wp-interactivity-api-best-practices.md`) is a plausible future enhancement for the cross-cutting sub-areas, but is NOT created this review and does NOT block. Recorded as a recommendation only.

### Catalog promotion (mirror review-5)

**R9 — Promote + rename** `php-coding-standards-yoda` → full record `coding-standards-php` (with prompt + acceptance matching the shipped `scenario.yaml` verbatim).

**R10 — Add new full record** `coding-standards-inline-docs` (prompt + acceptance matching its shipped `scenario.yaml` verbatim; `source_files` cite the on-domain PHPDoc inline-documentation page).

**R11 — Sub-header + header line.** Place both full records under a new `# Implemented Coding Standards scenarios — full records` sub-header. Update the catalog's implemented-areas header line to add **Coding Standards** (the lone header change).

**R12 — Byte-untouched invariants.** The iAPI `_candidates.yaml`, the skill, all existing scenarios, and all non-Coding-Standards catalog records remain untouched. No new deferred stubs are added (R7).

### Verification / done-criteria

**R13 — Static/structural only.** Each scenario is discoverable (flat non-underscore dir with `scenario.yaml` exposing `Array.isArray(rubrics)`), the YAML parses, and the two judge-only dirs contain no `e2e.spec.mjs`. The catalog parses and stays discovery-skipped (leading-underscore filename). Scenarios are NOT required to pass against the current skill; no full eval matrix / wp-env boot is part of grading.

**R14 — Skill untouched.** `skills/wordpress-development/` is not modified.
