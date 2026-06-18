# Review: Coding Standards area scenarios

## Origin

This review continues the owner's standing instruction (given when kicking off review-2):

> Kick off the next review and don't ask me for the next ones. Make sure they explore the possibility of using folders.

Boundaries (standing instruction, applied here):
- **Continue area-by-area coverage autonomously** — one top-level area per review, no pausing to ask between reviews.
- **This review's area: Coding Standards** (Documentation → https://developer.wordpress.org/coding-standards/). Areas covered: Plugins (review-1), Block Editor (review-2), REST API (review-3), Themes (review-4), Common APIs (review-5). WP-CLI (review-6) was deferred (off-domain grounding). Remaining after this: Advanced Administration, WordPress Playground, Code Reference.
- **The folders question is already resolved** (review-2): adopted `<area>-*` pseudo-folder naming. This review applies it (`coding-standards-*`) — no re-exploration.

Convenience link: https://github.com/Automattic/wordpress-skill-experiments/issues/36 (PR #37).

## Goal

Extend the `wordpress-development` eval suite's coverage to the **Coding Standards** area with simple, documentation-driven scenarios, building on the reference taxonomy and the `eval/scenarios/_wp-dev-candidates.yaml` candidate catalog established in review-1 (promoting the existing Coding Standards stub `php-coding-standards-yoda` + adding records, not rebuilding the taxonomy). New scenarios use the adopted `coding-standards-*` pseudo-folder naming.

## Constraints

- **Build on prior artifacts:** reuse the existing taxonomy + catalog; **promote the existing `php-coding-standards-yoda` stub** (and add records); do not rebuild the taxonomy.
- Scenarios stay **simple** (one concept, one small feature) and follow the existing conventions: `scenario.yaml`; user-voice, **tool-agnostic** prompts; explicit `rubrics: []`; grounded in developer.wordpress.org.
- The **skill (`skills/wordpress-development/`) is not modified.**
- **One area (Coding Standards) this review;** remaining areas are subsequent reviews.
- **No duplication:** Internationalization is already covered (`i18n-textdomain`); do not re-do it. Target the standards sub-areas not otherwise covered.
- **Apply the adopted `coding-standards-*` pseudo-folder naming** (dir == `scenario.yaml` name == catalog record name; flat immediate children, `/^[a-z0-9-]+$/`). The existing stub `php-coding-standards-yoda` may be renamed to fit the convention (catalog-record rename, as in prior reviews). Existing scenarios are NOT renamed.
- Static/structural verification only; existing scenarios, the iAPI `_candidates.yaml`, and non-Coding-Standards catalog records untouched.

## Assumptions / directions to explore

*(open — research may confirm or revise)*

- **Verification: judge-only.** Coding standards (naming, Yoda conditions, brace/spacing style, escaping/sanitization conventions, PHPDoc/inline documentation, accessibility) are **static code-quality properties, not runtime-observable** — there is no clean e2e surface. These scenarios are **judge-only** (first-class, as in prior reviews: `scenario.yaml` only, acceptance grades standards-compliance on a small deliverable).
- **Candidate sub-areas** (https://developer.wordpress.org/coding-standards/wordpress-coding-standards/): **PHP** (WPCS — Yoda conditions, brace style, naming/prefixing, spacing), **HTML**, **CSS**, **JavaScript**, **Accessibility**, **Inline Documentation Standards** (PHPDoc/JSDoc). The design picks ~1 per major sub-area (a focused subset is fine); each scenario asks for a small, normal feature and grades whether the code follows the relevant standard.
- **Scenarios vs. a shared rubric (assess, don't block):** coding standards are cross-cutting, so a shared **rubric** (like `eval/rubrics/wp-interactivity-api-best-practices.md`) is a plausible alternative expression. BUT the existing catalog already stubs Coding Standards as a **scenario**, and judge-only standards scenarios are a valid, owner-validated pattern. **Default to judge-only scenarios.** The spec may *recommend* a shared coding-standards rubric as a future enhancement, but should not block on it or create one without surfacing it. If the spec finds a specific sub-area genuinely only works as a rubric (not a scenario), record it as a deferred stub with the reason and flag it — do not force an awkward scenario.
- A smaller batch is acceptable; defer with recorded reasons any sub-area that is covered, duplicative, or not simply expressible as a judge-only scenario.
