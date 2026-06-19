# Design Doc: Coding Standards scenarios

## Overview

The `wordpress-development` skill is evaluated by a Skillsmith-based suite under `eval/`. Prior reviews established a broad area → sub-area taxonomy of developer.wordpress.org, committed a candidate catalog at `eval/scenarios/_wp-dev-candidates.yaml`, and implemented scenarios for the Interactivity API, a v1 set, and the Plugins, Block Editor, REST API, Themes, and Common APIs areas. The **Coding Standards** area (`https://developer.wordpress.org/coding-standards/`) is still uncovered: the catalog carries a single Coding Standards stub (`php-coding-standards-yoda`, a TODO with no prompt/acceptance), and no Coding Standards scenario is implemented.

This review extends coverage to the **Coding Standards** area with a deliberately small batch — **two judge-only scenarios** — reusing (not rebuilding) the existing taxonomy and catalog. Coding standards are static code-quality properties (naming, Yoda conditions, brace/spacing style, inline documentation) with no clean runtime-observable surface, so the batch is two judge-only scenarios graded by inspecting the produced source, not a front-end assertion: one grading WordPress **PHP coding-standards** compliance on a small ordinary PHP feature (`coding-standards-php`), and one grading WordPress **PHPDoc inline-documentation-standards** compliance on a documented PHP function (`coding-standards-inline-docs`). Five other candidate sub-areas — **HTML, CSS, JavaScript, JSDoc, Accessibility** — are deferred with recorded reasons and, because none has an existing catalog stub, receive **no new catalog entry**.

As in prior reviews, the **skill itself is not modified** — the scenarios lead and the skill catches up in later work; verification is **static/structural only** (each scenario discoverable by Skillsmith), and scenarios are **not required to pass** against the current skill. The folders question is already resolved (review-2): the adopted convention is the **`coding-standards-*` pseudo-folder naming** (area-prefixed flat scenario names), which this review applies. The deliverables are: (1) **two Coding Standards scenarios** — `coding-standards-php` (judge-only) and `coding-standards-inline-docs` (judge-only); and (2) a **catalog promotion + reconciliation** of the Coding Standards section of `_wp-dev-candidates.yaml` (one stub renamed+promoted to full, one new full record, one header-line fix). The existing scenarios, the scaffold, the harness, Skillsmith, the iAPI `_candidates.yaml`, all non-Coding-Standards catalog records, and the skill are all untouched.

## Approach

The end-to-end mental model the implementer works from:

**Naming convention (the structural element).** Both new scenarios use the prefix `coding-standards-<concept>` as their directory name, their `scenario.yaml` `name`, and their catalog record `name` — identical in all three places, each matching `/^[a-z0-9-]+$/`. This is the adopted "pseudo-folder" organization carried over from review-2: it visually clusters Coding Standards scenarios when `eval/scenarios/` is listed and sorted, while every scenario remains a **flat immediate child** of `eval/scenarios/`. No filesystem nesting is introduced, so Skillsmith discovery, the scaffold, and the test runner's collection are all unchanged. The existing scenarios are NOT renamed. The legacy stub name `php-coding-standards-yoda` is NOT carried forward — it is renamed (a catalog-record rename only; no shipped scenario directory exists for it yet) to `coding-standards-php`. The two names are: `coding-standards-php`, `coding-standards-inline-docs`. Neither collides with any existing scenario directory (no existing dir carries a `coding-standards-` prefix).

**Scenarios (the implemented work).** Each scenario is a self-contained directory `eval/scenarios/<name>/` containing **only** a `scenario.yaml` — **no `e2e.spec.mjs`** (both are judge-only). The established runtime lifecycle is reused unchanged:

1. **Skillsmith discovers the scenario** by reading the immediate children of `eval/scenarios/` and loading each child's `scenario.yaml`. The directory name is the discovery identity; the `name` field inside the YAML is the plugin-slug fragment used downstream. For both scenarios, `name` equals the directory name.
2. **Skillsmith scaffolds a plugin** per (scenario, testing-agent). The plugin slug is `plugin-<scenario.name>-<agentId>`. The scaffold provides an `index.php` (plugin header + hooks) that hosts all PHP. **No block or theme artifact is needed** — each scenario is a single small PHP deliverable (a helper function / a documented function) authored inside `index.php`.
3. **The testing agent implements the requested feature** as a single edit to `index.php`. One concept, one small PHP deliverable, one plugin edit each. No theme artifact, no block type, no JS toolchain, no custom database table, no second deliverable, no multi-step task.
4. **An LLM judge grades the produced code** against the scenario's `acceptance` list. Every scenario declares `rubrics: []`, so only `acceptance` is used. Both scenarios are graded **solely** by the judge against the produced PHP — they ship **no** `e2e.spec.mjs`, mirroring the existing judge-only scenarios (`cron-event`, `admin-menu-page`, `i18n-textdomain`, `common-apis-options`, `common-apis-transients`, `common-apis-http-request`).
5. **No e2e harness step runs for this batch.** Because neither scenario ships an `e2e.spec.mjs`, `eval/utils/verify-e2e.ts` finds no spec for either and `wp-env` is never booted on their behalf. The grading path stops at the judge step.

**The prompt-elicitation property (the core feasibility constraint).** Because grading is judge-only and static, each prompt must reliably **elicit the gradeable construct** while staying tool-agnostic (the prompt must not name the standard, a tool such as PHPCS/WPCS/PHPDoc, a function, a hook, or a tag — following the standard is the skill's job, not a hint baked into the prompt):

- `coding-standards-php` grades **comparison/conditional style** (Yoda conditions), brace style, spacing, and naming. The prompt must therefore ask for a small PHP feature that **naturally requires a comparison or conditional** — otherwise there is no comparison to grade for Yoda. The design satisfies this by asking for a tiny helper function that decides between outcomes based on an input value (e.g. checks an input against a known value and returns/echoes accordingly), which forces at least one `if`/comparison into the deliverable without naming "Yoda" or "comparison style."
- `coding-standards-inline-docs` grades **the doc block** (summary line, `@param`, `@return`, `@since`, alignment). The prompt must therefore ask for a function **plus documentation a reader can rely on** — otherwise there is no doc block to grade. The design satisfies this by asking for a small function (that takes at least one parameter and returns a value, so `@param` and `@return` are both gradeable) accompanied by a documentation comment that explains it, without naming "PHPDoc," "doc block," or any tag.

**Acceptance grounding and naming.** `acceptance` strings are clean, human-readable checks with no embedded source URLs, but — following the established convention (`cron-event` names `wp_schedule_event()` in its acceptance) — acceptance **may** name the concrete rules, tags, and constructs being graded (Yoda conditions, brace style, `@param`, `@since`, etc.). The tool-agnostic constraint applies to the **prompt only**. Provenance (source URLs) lives only in the catalog record, never in the `scenario.yaml`.

**Catalog.** The Coding Standards section of `eval/scenarios/_wp-dev-candidates.yaml` is updated: `php-coding-standards-yoda` is **renamed and promoted** to a full record named `coding-standards-php`; one new full record (`coding-standards-inline-docs`) is added; both sit under a new `# Implemented Coding Standards scenarios — full records` sub-header mirroring the Block Editor / REST API / Themes / Common APIs pattern; and the header line is updated to list Coding Standards among the areas with full prompt+acceptance. After the update, no Coding Standards stub remains, so no Coding Standards stub carries a `# Deferred:` comment. **No new stub is created** for the deferred HTML / CSS / JavaScript / JSDoc / Accessibility sub-areas (none has a stub today). The iAPI `_candidates.yaml` and all non-Coding-Standards records are byte-untouched.

**No change is made** to the scaffold, the e2e harness, the Skillsmith package, the skill, the existing scenarios, `eval/utils/`, `eval/rubrics/`, or `_candidates.yaml`.

## Components

### New components (this review)

- `eval/scenarios/coding-standards-php/` — `scenario.yaml` only (judge-only).
- `eval/scenarios/coding-standards-inline-docs/` — `scenario.yaml` only (judge-only).
- `eval/scenarios/_wp-dev-candidates.yaml` — Coding Standards section updated in place (1 stub renamed+promoted to full, 1 new full record under an `# Implemented Coding Standards scenarios — full records` sub-header, 1 header-line fix).

Both directory names match `/^[a-z0-9-]+$/`, equal their `scenario.yaml` `name` and their catalog record `name`, are flat immediate children of `eval/scenarios/`, and carry the `coding-standards-` prefix. Neither collides with an existing scenario directory.

### Untouched-but-relevant components (consumed, not modified)

- `eval/utils/scaffold-plugin.ts` — scaffolds the per-(scenario, agent) plugin. Fixed facts the scenarios depend on: slug `plugin-<scenario.name>-<agentId>`; `index.php` hosts the PHP. Throws if `name` (or `agentId`) does not match `/^[a-z0-9-]+$/`. No block or theme artifact is needed for this batch.
- `eval/utils/verify-e2e.ts` — locates each ran scenario's spec at the flat path `eval/scenarios/<dirName>/e2e.spec.mjs`. **Neither scenario plugs into this flow** (both are judge-only and ship no spec); it is listed only to record that this batch adds nothing to it.
- `@automattic/skillsmith` — discovers scenarios by reading only the immediate children of `eval/scenarios/` (non-recursive); skips nested directories and leading-underscore / non-directory entries (which is why `_wp-dev-candidates.yaml` sits safely among real scenario dirs). Its shape-check requires `rubrics` present as an array. NOT modified.
- `playwright.config.ts` — test-runner configuration (`testMatch` for `e2e.spec.mjs`, `testDir: eval/scenarios`). Both judge-only scenarios contribute no spec, so they add nothing to the test-runner collection.
- The scaffolded plugin's `index.php` — hosts the small PHP deliverable for each scenario. No block/theme artifact is touched.
- The existing judge-only scenarios (`cron-event`, `admin-menu-page`, `i18n-textdomain`, `common-apis-options`, `common-apis-transients`, `common-apis-http-request`) — the judge-only precedent shape (a `scenario.yaml` with `rubrics: []` and no `e2e.spec.mjs`).

### Explicitly NOT modified

- Any existing scenario directory (the existing Interactivity API, v1, Plugins, Block Editor, REST API, Themes, and Common APIs scenarios are not moved, renamed, or reorganized).
- `eval/scenarios/_candidates.yaml` (the iAPI catalog) — byte-untouched.
- All non-Coding-Standards records in `_wp-dev-candidates.yaml` — byte-untouched.
- `eval/rubrics/` (no new shared rubric — each scenario carries `rubrics: []`).
- `eval/utils/` (no new helper) and the e2e harness.
- Anything under `skills/wordpress-development/`.

## Interfaces and Data Flow

### `scenario.yaml` schema (the existing shape)

```yaml
name: coding-standards-php            # matches /^[a-z0-9-]+$/, equals the directory name; plugin-slug fragment
description: <one line>
skills:
  - wordpress-development
prompt: |
  <user-voice, outcome-phrased; asks for an ordinary small PHP feature; does NOT name
   the standard, a tool (PHPCS / WPCS / PHPDoc), a function, a hook, or a doc tag>
acceptance:
  - <scenario-unique, clean, human-readable check; MAY name the concrete rule/tag; NO embedded source URL>
rubrics: []                           # explicit empty array — REQUIRED for discovery
```

**The `rubrics` key must be present as an explicit empty array (`rubrics: []`).** Skillsmith's discovery shape-check requires `rubrics` to be an array; an omitted key (`undefined`) or a valueless `rubrics:` (parsed as `null`) silently fails discovery and the scenario is never graded. The same check requires `name`, `description`, `skills`, `prompt`, and `acceptance` to be present and well-typed. **Catalog-only fields (`difficulty`, `concepts`, `source`, `source_files`) and source URLs never appear in a `scenario.yaml`** — provenance lives only in the catalog record.

`name` is the plugin-slug fragment; the scaffolded plugin slug is `plugin-<name>-<agentId>`. For both scenarios `name` equals the directory name. Both `scenario.yaml` files are identical in shape to the existing judge-only scenarios (same keys), with no accompanying `e2e.spec.mjs`.

### Catalog record shape (Coding Standards area, in `_wp-dev-candidates.yaml`)

Full records for both implemented scenarios (judge-only scenarios still get full records, exactly as `cron-event` / `common-apis-options` do). The catalog full-record fields are `name`, `description`, `difficulty`, `concepts`, `source`, `source_files`, `prompt |`, `acceptance:`. There is **no `rubrics` field in catalog records** — `rubrics` is `scenario.yaml`-only. Each record's `prompt` and `acceptance` must match the shipped `scenario.yaml` **verbatim** (same text, order, and quoting).

```yaml
- name: coding-standards-php                 # == directory name == scenario.yaml name
  description: <one line>
  difficulty: simple
  concepts: [WPCS, PHP coding standards, Yoda conditions, brace style, naming]
  source: dev.wordpress.org
  source_files:
    - https://developer.wordpress.org/coding-standards/wordpress-coding-standards/php/
    - https://developer.wordpress.org/coding-standards/wordpress-coding-standards/
  prompt: |
    <exact same text as the shipped scenario.yaml prompt>
  acceptance:
    - <exact same items as the shipped scenario.yaml acceptance>
```

Per-record `source_files` (provenance, catalog-only):

| Record `name` | `source_files` |
|---|---|
| `coding-standards-php` | `https://developer.wordpress.org/coding-standards/wordpress-coding-standards/php/`, `https://developer.wordpress.org/coding-standards/wordpress-coding-standards/` |
| `coding-standards-inline-docs` | `https://developer.wordpress.org/coding-standards/inline-documentation-standards/php/` |

The `coding-standards-php` record inherits the legacy stub's two `source_files` (the WPCS PHP page + the WPCS landing). The `coding-standards-inline-docs` record's `source_files` cite the on-domain PHPDoc inline-documentation page (Requirement 10 / Acceptance Criterion 10).

### Data flow

`scenario.yaml` (discovery + judge input) → scaffold writes plugin `plugin-<name>-<agentId>` → testing agent edits `index.php` (writes the small PHP deliverable) → judge grades the produced PHP against `acceptance`. Neither scenario ships an `e2e.spec.mjs`, so the flow stops at the judge step (no `wp-env` boot, no front-end assertion). The catalog file feeds nothing in this flow; it is a committed planning artifact read by humans and future reviews.

## The two Coding Standards scenarios

Both scenarios are judge-only, one concept on a single small PHP deliverable, with a handful of acceptance points and `rubrics: []`. Each is fully specified below so phase 3/4 build it without re-deciding. The prompt prose drafted here is the recommended copy; phase 4 may reword **provided** it preserves the two load-bearing properties: (a) tool-agnostic (no standard/tool/function/hook/tag named), and (b) it still elicits the gradeable construct (a comparison/conditional for `coding-standards-php`; a parameterized, returning, documented function for `coding-standards-inline-docs`).

### Scenario 1 — `coding-standards-php` (WordPress PHP coding-standards compliance) — judge-only

- **Sub-area:** Coding Standards → PHP (WordPress Coding Standards). Promotes + renames the existing `php-coding-standards-yoda` stub.
- **Source URL(s) (catalog `source_files` only, never in `scenario.yaml`):** `https://developer.wordpress.org/coding-standards/wordpress-coding-standards/php/` (primary) and `https://developer.wordpress.org/coding-standards/wordpress-coding-standards/` (the WPCS landing).
- **Kind:** judge-only — `scenario.yaml` only, no `e2e.spec.mjs`.
- **Deliverable (single `index.php` edit):** a tiny helper function that branches on an input value — it compares the input against a known value (or checks a condition) and returns/produces a result accordingly. The comparison is the construct that makes Yoda conditions gradeable; it arises naturally from the task, not from the prompt naming it.
- **Recommended prompt (user-voice, tool-agnostic — draft for phase 4):**
  > "I'm building a small WordPress plugin and I need a little helper function in PHP. It should take a status value (like an order or post status) and return a short, friendly label for it — for example, turning a stored status into something I can show to a reader. If the status isn't one it recognizes, it should fall back to a sensible default label. Please write that function for me."

  This forces a comparison/conditional (matching the input against known statuses) and naming (the function name), so all four rule families are gradeable, without naming "Yoda," "WPCS," "brace style," any function, or any hook.
- **`acceptance` (scenario-unique, clean checks, no URLs; may name the rules) — draft for phase 4:**
  1. Comparisons place the constant/literal on the left-hand side (Yoda conditions), so an accidental single `=` assignment cannot pass silently.
  2. Braces follow the WordPress brace style — opening brace on the same line as the statement, closing brace on its own line, and braces used even for single-statement blocks.
  3. Spacing follows the WordPress PHP standard — spaces inside the parentheses of control structures and function calls that take arguments, and spaces around operators.
  4. Identifiers use lowercase `snake_case`, and the function name is prefixed/namespaced to avoid collisions (not a bare generic name).
- **Catalog `concepts` (illustrative):** `[WPCS, PHP coding standards, Yoda conditions, brace style, naming]`.

### Scenario 2 — `coding-standards-inline-docs` (WordPress PHPDoc inline-documentation compliance) — judge-only

- **Sub-area:** Coding Standards → Inline Documentation Standards (PHP / PHPDoc). A brand-new scenario (no prior stub).
- **Source URL(s) (catalog `source_files` only, never in `scenario.yaml`):** `https://developer.wordpress.org/coding-standards/inline-documentation-standards/php/`.
- **Kind:** judge-only — `scenario.yaml` only, no `e2e.spec.mjs`.
- **Deliverable (single `index.php` edit):** a small PHP function that **takes at least one parameter and returns a value**, accompanied by a documentation comment. The parameter + return value make `@param` and `@return` both gradeable; the documentation comment is the construct that makes the summary line, `@since`, and alignment gradeable.
- **Recommended prompt (user-voice, tool-agnostic — draft for phase 4):**
  > "I have a small PHP function for my plugin that takes a user's display name and a greeting prefix and returns a formatted welcome message. The function works, but other developers (and future me) will need to understand it without reading the body. Please add a proper documentation comment above it that explains what it does, describes each input and the value it returns, and notes the plugin version it was introduced in — formatted the way it should be for this kind of project."

  This requires documenting a function that has parameters and a return value, plus a version note, so the summary line, `@param` per parameter, `@return`, `@since`, and alignment are all gradeable — without naming "PHPDoc," "doc block," or any tag. (Phase 4 may instead have the prompt ask for both the function and its documentation; either framing is acceptable as long as the result is a single small documented function with at least one parameter and a return value.)
- **`acceptance` (scenario-unique, clean checks, no URLs; may name the tags) — draft for phase 4:**
  1. The doc block opens with a single-sentence summary line describing what the function does.
  2. Each parameter has a `@param` entry giving its type and `$name` (one per parameter), in declaration order.
  3. There is a `@return` entry stating the returned type (and a description where the type alone is ambiguous).
  4. There is an `@since` tag using a three-digit version number (e.g. `@since 1.0.0`).
  5. The doc block is a `/** ... */` block placed immediately above the function, with the tag descriptions aligned/formatted per the standard.
- **Catalog `concepts` (illustrative):** `[PHPDoc, inline documentation, docblock, @param, @return, @since]`.

### Summary

| # | Scenario (= dir = `name`) | Sub-area | Gradeable construct the prompt elicits | Kind | Ships `e2e.spec.mjs`? |
|---|---|---|---|---|---|
| 1 | `coding-standards-php` | PHP (WPCS) | A helper function with a comparison/conditional + a name | judge-only | No |
| 2 | `coding-standards-inline-docs` | Inline Docs (PHPDoc) | A documented function with a parameter + a return value | judge-only | No |

Both declare `rubrics: []`. Each is one `index.php` edit. Neither ships an `e2e.spec.mjs`.

## Catalog promotion + reconciliation

The Coding Standards section of `_wp-dev-candidates.yaml` is reconciled to mirror the review-5 (Common APIs) precedent:

1. **Promote + rename the stub.** `php-coding-standards-yoda` (the single existing Coding Standards stub, a `# TODO: prompt + acceptance`) is promoted to a **full record** and renamed to `coding-standards-php`. It keeps its two `source_files`, gains `prompt` and `acceptance` matching the shipped `coding-standards-php/scenario.yaml` verbatim, and updates `description`/`concepts` to reflect the full rule set (Yoda + brace + spacing + naming). The legacy name `php-coding-standards-yoda` does not survive.
2. **Add the new full record.** `coding-standards-inline-docs` is added as a **brand-new full record** (there is no prior PHPDoc stub), with `prompt` and `acceptance` matching the shipped `coding-standards-inline-docs/scenario.yaml` verbatim, and `source_files` citing the on-domain PHPDoc inline-documentation page (`https://developer.wordpress.org/coding-standards/inline-documentation-standards/php/`).
3. **Sub-header.** Both full records are placed under a new `# Implemented Coding Standards scenarios — full records` sub-header within the Coding Standards area, mirroring the Themes / Block Editor / REST API / Common APIs pattern. After the update, no Coding Standards stub remains, so no Coding Standards stub carries a `# Deferred:` comment, and every implemented Coding Standards sub-area is represented by exactly one full record under its final `coding-standards-*` name — no orphaned stub, no name mismatch between any record and its scenario directory.
4. **Header line (the lone header change).** The catalog's header comment listing which areas have full prompt+acceptance (currently "Full prompt + acceptance are included for the implemented Plugins, Block Editor, REST API, Themes, and Common APIs scenarios; all other records are lighter stubs.", at ~line 28–29) is updated to add **Coding Standards** to that list. This is the **only** header change.
5. **Byte-untouched invariants.** The iAPI `_candidates.yaml` is not modified. Within `_wp-dev-candidates.yaml`, only the two Coding Standards records (the promoted+renamed record and the new record) and the single shared header-comment change occur; no other area's records are rebuilt, re-derived, moved, renamed, or annotated. **No new catalog stub** is added for any deferred sub-area (HTML, CSS, JavaScript, JSDoc, Accessibility) — none has a stub today, so under the intent's scoped stub rule none gets one.

**1:1 identity (verbatim) requirement.** For each implemented scenario, the catalog record `name` equals the scenario's directory name and its `scenario.yaml` `name`, and the record's `prompt` and `acceptance` match the shipped `scenario.yaml` verbatim (same text, order, and quoting). Phase 4 must author the `scenario.yaml` and the catalog record together so the two stay in lockstep; any phase-4 rewording of a prompt or acceptance must update both copies identically.

## Key Decisions

### Decision: Adopt a two-scenario judge-only batch (PHP + PHPDoc); defer the other five sub-areas

- **Choice:** Implement exactly `coding-standards-php` and `coding-standards-inline-docs`, both judge-only. Defer HTML, CSS, JavaScript, JSDoc, and Accessibility.
- **Alternatives:** A larger batch including HTML/CSS/JS/JSDoc/Accessibility (rejected per the recorded defer reasons below); an e2e scenario for any sub-area (rejected — coding standards are static code-quality properties with no runtime-observable surface; there is nothing for a front-end assertion to read).
- **Trade-offs:** The two implemented sub-areas (PHP via WPCS, PHPDoc via the inline-documentation standards) have concrete, statically checkable, on-domain-grounded rules and express cleanly as a single small PHP deliverable graded by the judge. A smaller batch than some prior reviews is explicitly permitted by the intent for sub-areas that are covered, duplicative, or not simply expressible as a judge-only scenario. The judge-only pattern is already established (`cron-event`, `common-apis-options`).
- **Traces to:** Requirements 3, 4, 5, 6, 6a; Acceptance Criteria 3, 4, 5, 6.

### Decision: Judge-only is the governing verification mode — no e2e surface for either scenario

- **Choice:** Neither scenario ships an `e2e.spec.mjs`; acceptance is graded by the LLM judge inspecting the produced source.
- **Alternatives:** A front-end e2e assertion (rejected — there is no runtime-observable property; a coding-standards rule like Yoda or a doc block is invisible at runtime and can only be read from source); a static linter run in the harness (rejected — out of scope; this review adds no new harness step, and the judge reads the source directly).
- **Trade-offs:** Judge-only matches the nature of the property and reuses the established judge-only shape with zero harness change. The cost is that grading quality depends on the judge reading the source carefully; mitigated by enumerating concrete, individually checkable rules in `acceptance`.
- **Traces to:** Requirements 3, 7; Acceptance Criteria 3, 14.

### Decision: The prompt must elicit the gradeable construct while staying tool-agnostic

- **Choice:** `coding-standards-php`'s prompt asks for a helper function that branches on an input value (forcing a comparison/conditional for Yoda and a name for naming rules); `coding-standards-inline-docs`'s prompt asks for documentation of a function that takes a parameter and returns a value (forcing `@param` + `@return`, plus a version note for `@since`). Neither prompt names the standard, a tool (PHPCS/WPCS/PHPDoc), a function, a hook, or a doc tag.
- **Alternatives:** A vague prompt ("write some PHP" / "document this") — rejected, because it may not produce a comparison (nothing to grade for Yoda) or a parameterized/returning function (nothing to grade for `@param`/`@return`); a prompt that names the construct ("use Yoda conditions" / "add a PHPDoc block with `@param`") — rejected, because it would name the standard/tags and defeat the test of whether the skill applies them unprompted.
- **Trade-offs:** A tool-agnostic prompt that nonetheless reliably elicits the construct is the crux of a judge-only standards scenario. The chosen framings make the gradeable construct an inevitable consequence of an ordinary outcome request, so the skill is genuinely tested on whether it applies the standard without being told to. Residual risk: a model could satisfy the outcome with a degenerate shape (e.g. a `match`/array lookup with no `if`, or a one-line function with no real parameters). Mitigation: the recommended prompts steer toward a recognize-or-fall-back conditional and a multi-input/returning function; phase 4 keeps the elicitation property when rewording.
- **Traces to:** Requirements 4, 5, 6, 7; Acceptance Criteria 4, 5, 7.

### Decision: `acceptance` enumerates concrete on-domain rules; the prompt stays clean; provenance lives only in the catalog

- **Choice:** `coding-standards-php`'s acceptance enumerates Yoda conditions, WordPress brace style, correct spacing (e.g. spaces inside parentheses), and prefixed/`snake_case` naming. `coding-standards-inline-docs`'s acceptance enumerates a summary line, a `@param` per parameter (type + name), a `@return`, an `@since` with a three-digit version, and proper alignment/format. Acceptance strings are clean (no embedded URLs) but may name the concrete rules/tags (as `cron-event` names `wp_schedule_event()`). Source URLs appear only in the catalog record's `source_files`.
- **Alternatives:** Acceptance that names the construct only vaguely (rejected — the spec requires concrete, statically checkable, enumerated rules); embedding source URLs in `scenario.yaml` (rejected — provenance is catalog-only).
- **Trade-offs:** Enumerating concrete rules gives the judge unambiguous, individually checkable points and grounds them in the on-domain WPCS / PHPDoc pages. The tool-agnostic constraint is correctly scoped to the prompt, not the acceptance — so the acceptance can be precise without leaking the standard's name into the user-voice request.
- **Traces to:** Requirements 5, 6, 7, 10; Acceptance Criteria 4, 5, 7, 10.

### Decision: Apply `coding-standards-*` naming; rename+promote the one stub; do not re-litigate folders or rename existing scenarios

- **Choice:** Both new scenarios use the `coding-standards-<concept>` prefix as flat immediate children (directory name == `scenario.yaml` `name` == catalog record `name`). The legacy stub `php-coding-standards-yoda` is renamed (a catalog-record rename — no shipped directory exists for it yet) to `coding-standards-php`. `coding-standards-inline-docs` is a brand-new name. Existing scenarios are not renamed.
- **Alternatives:** Real subdirectories (`eval/scenarios/coding-standards/<name>/`) — review-2 classified these as not low-risk (require an uncommittable change to Skillsmith's non-recursive discovery); keep the legacy stub name `php-coding-standards-yoda` (rejected — it lacks the prefix and Acceptance Criterion 9 forbids keeping the legacy name).
- **Trade-offs:** The prefix delivers visual grouping at zero harness risk, every scenario remaining a flat immediate child whose name matches `/^[a-z0-9-]+$/`. The forward inconsistency (prefixed Coding Standards scenarios beside non-prefixed older scenarios) is accepted and out of scope (review-2 resolved the folders question).
- **Traces to:** Requirement 9; Acceptance Criterion 9.

### Decision: Promote one stub, add one full record under an Implemented sub-header, fix one header line; confine all edits to the Coding Standards section

- **Choice:** Rename+promote `php-coding-standards-yoda` → full `coding-standards-php`; add `coding-standards-inline-docs` full record; place both under an `# Implemented Coding Standards scenarios — full records` sub-header; add Coding Standards to the implemented-areas header line. Add no new stub for the five deferred sub-areas. Leave `_candidates.yaml` and all non-Coding-Standards records byte-untouched.
- **Alternatives:** Add deferred stubs for HTML/CSS/JS/JSDoc/Accessibility (rejected — the stub rule is scoped to sub-areas that already have a stub; none does); leave the legacy stub un-promoted alongside a new record (rejected — would orphan a stub duplicating an implemented sub-area).
- **Trade-offs:** Mirrors the Themes / Block Editor / REST API / Common APIs reconciliation precedent: full records 1:1 with implemented scenarios, no orphaned stub, no name mismatch. Confining edits to the Coding Standards section + one header line keeps the iAPI catalog and all other areas intact — a correctness invariant phase 4/5 must diff-check.
- **Traces to:** Requirements 9, 10, 11, 12, 13; Acceptance Criteria 9, 10, 11, 12, 13.

### Decision: Add zero new shared rubrics; both scenarios declare `rubrics: []`

- **Choice:** Add no files under `eval/rubrics/`; each scenario carries its checks in `acceptance` and declares the explicit empty array `rubrics: []`.
- **Alternatives:** A shared cross-cutting "coding-standards" rubric across the batch.
- **Trade-offs:** The two scenarios grade different concerns (PHP style vs. doc-block structure) with no single check general enough to share without duplicating per-scenario acceptance points (which the spec forbids). A shared rubric is recorded as a non-blocking future recommendation (see Risks). The `rubrics:` key is always present as an array (required for discovery).
- **Traces to:** Requirement 8; Acceptance Criteria 8, 17.

### Decision: Defer HTML, CSS, JavaScript, JSDoc, and Accessibility — record reasons here only, add no catalog entry

- **Choice:** Do not implement any of the five; add no new catalog stub for any; record their defer reasons only in the spec and this design doc.
- **Alternatives:** Implement one (none fits the "simple, one concept, high-signal, judge-only, single-PHP-deliverable" bar); add a deferred stub (rejected — the stub rule is scoped to sub-areas that already have a stub; none has one today).
- **Trade-offs (the recorded reasons):**
  - **HTML** — the on-domain page specifies only five thin hygiene rules (lowercase tags, double-quoted attributes, self-closing-tag space, tabs, logical indentation); too low-signal for a standalone scenario, and these rules are already incidentally visible in any PHP scenario that echoes markup.
  - **CSS** — formatting-oriented rules requiring a separate `.css` deliverable the plugin scaffold lacks (enqueue + CSS standards = two concepts); thin as a standalone.
  - **JavaScript** — checkable rules (`===`, semicolons, camelCase, always-braces, tabs) are low-distinctiveness (modern models satisfy them by default → near-zero failure signal), and the scenario would require two deliverables (a PHP plugin plus a JS file).
  - **JSDoc** — a JS-only deliverable with the same thinness / feasibility caveat as the JavaScript scenario.
  - **Accessibility** — the on-domain page specifies no concrete normative rules; it mandates WCAG 2.2 AA and links off-domain to W3C — the same off-domain-grounding failure that deferred WP-CLI.
- **Traces to:** Out of Scope 1–5; Acceptance Criterion 17.

### Decision: Static / structural verification only; scenarios not required to pass; skill untouched

- **Choice:** Verify each scenario is Skillsmith-discoverable (a flat, non-underscore directory containing a `scenario.yaml` that parses and exposes `rubrics` as an array) and contains no `e2e.spec.mjs`; verify the catalog parses as valid YAML and stays discovery-skipped (leading-underscore filename). Do not boot `wp-env`, run the full `scenarios × testing-agents` matrix, or generate scenario solution code. Modify nothing under `skills/wordpress-development/`.
- **Alternatives:** Run the scenarios against the current skill and require passing grades (rejected — the scenarios lead, the skill catches up later; a failing grade is acceptable per the spec).
- **Trade-offs:** The bar is well-formedness / discoverability, matching prior reviews. A failing grade against the current skill does not violate the bar.
- **Traces to:** Requirements 14, 15, 16; Acceptance Criteria 14, 15, 16.

## Dependencies

All dependencies already exist in the repo; this review introduces **no new** dependency and adds **no new** `eval/utils/` helper.

- **Internal:** `eval/utils/scaffold-plugin.ts` (scaffolds the per-(scenario, agent) plugin; `index.php` hosts the PHP; throws on a `name` not matching `/^[a-z0-9-]+$/`); the existing judge-only scenarios (`cron-event`, `admin-menu-page`, `i18n-textdomain`, `common-apis-options`, `common-apis-transients`, `common-apis-http-request`) as the judge-only precedent shape; the existing `eval/scenarios/_wp-dev-candidates.yaml` (catalog precedent; Coding Standards section edited, rest untouched).
- **External (already present):** `@automattic/skillsmith` (discovery, scaffold orchestration, judge); `@wordpress/scripts`; `@wordpress/env` (`wp-env` runtime — **not exercised by this batch**, since neither scenario ships an e2e). No new external dependency.
- **Documentation (selection/acceptance grounding, not a runtime dependency):** the developer.wordpress.org pages cited per scenario and in the catalog `source_files` — `/coding-standards/wordpress-coding-standards/php/` + `/coding-standards/wordpress-coding-standards/` for `coding-standards-php`; `/coding-standards/inline-documentation-standards/php/` for `coding-standards-inline-docs`. All were verified on-domain during spec research.

## Failure Modes and Observability

- **Scenario not discovered:** a directory not placed as a flat immediate child of `eval/scenarios/`, or missing `scenario.yaml`, is silently skipped by Skillsmith's non-recursive discovery. Mitigation: both use the flat `coding-standards-*` layout, each with a `scenario.yaml`.
- **Malformed `scenario.yaml`:** Skillsmith's shape check requires `rubrics` present as an array; an omitted key (`undefined`) or a valueless `rubrics:` (`null`) silently fails discovery and the scenario is never graded. Mitigation: every scenario declares `rubrics: []` explicitly; `name`/`description`/`skills`/`prompt`/`acceptance` are all present and well-typed.
- **Invalid `name`:** `scaffold-plugin.ts` throws if `name` (or `agentId`) does not match `/^[a-z0-9-]+$/`. Both `coding-standards-*` names conform (hyphens only, no underscores).
- **Prompt fails to elicit the gradeable construct (the primary judge-only failure mode):** if `coding-standards-php`'s prompt yields PHP with no comparison/conditional, there is nothing to grade for Yoda; if `coding-standards-inline-docs`'s prompt yields a function with no parameter or no return value, `@param`/`@return` cannot be graded. Mitigation baked into the design: the recommended prompts force a recognize-or-fall-back conditional and a multi-input, returning function; phase 4 must preserve this elicitation property when rewording.
- **Prompt leaks the standard/tool/tag (would invalidate the test):** naming "Yoda," "WPCS," "PHPDoc," a function, a hook, or a tag in the prompt would tell the skill what to do and defeat the scenario. Mitigation: the tool-agnostic constraint is called out for the prompt; acceptance (not the prompt) carries the concrete rule names.
- **Embedded provenance in `scenario.yaml`:** a source URL in a `scenario.yaml` violates the schema. Mitigation: URLs live only in the catalog record's `source_files`; the `scenario.yaml` carries no catalog-only fields.
- **Verbatim drift between `scenario.yaml` and catalog record:** if a prompt/acceptance is reworded in one place but not the other, the 1:1-verbatim invariant breaks. Mitigation: phase 4 authors both copies together; phase 4/5 diff-checks the prompt/acceptance text matches verbatim.
- **Catalog edits not confined to the Coding Standards section (correctness invariant):** only the two Coding Standards records and the one header line may change; the iAPI `_candidates.yaml` and all non-Coding-Standards records in `_wp-dev-candidates.yaml` must be byte-untouched. Phase 4/5 must diff-check this.
- **Legacy stub name survives:** if `php-coding-standards-yoda` is not renamed on promotion, Acceptance Criterion 9 fails. Mitigation: the promotion is a rename to `coding-standards-php`; no record keeps the legacy name and no `# Deferred:` Coding Standards stub remains.
- **Expected non-failure:** per the spec, a *failing grade against the current skill* is acceptable and is not a harness error. The bar (Acceptance Criterion 14) is that each scenario is discoverable, its YAML parses, `rubrics` is an array, and it ships no `e2e.spec.mjs`.
- **Observability:** judge results (both scenarios) surface through Skillsmith's grading output. There is no e2e for this batch, so no test-runner JSON report or `wp-env` log is produced on its behalf.

## Risks and Open Questions

These are phase-4 confirmations (latitude, not blockers) and recorded risks; all design-blocking questions are resolved.

- **Prompt must elicit the construct while staying tool-agnostic (RESOLVED into the design).** `coding-standards-php` asks for a helper that branches on an input (forces a comparison + a name); `coding-standards-inline-docs` asks for documentation of a parameterized, returning function (forces `@param` + `@return` + `@since`). Flagged for phase 4 so a reworded prompt cannot read as "write some PHP" / "document this" without the construct, and cannot name the standard/tool/tag.
- **Exact prompt prose (phase-4 task).** The recommended prompts above are guidance, not final copy. Phase 4 writes the final user-voice, tool-agnostic text and may reword **provided** it preserves (a) tool-agnosticism and (b) the elicitation property. Any change to a prompt must be mirrored verbatim into the catalog record.
- **Exact acceptance wording (phase-4 task).** The acceptance drafts above are guidance. Phase 4 finalizes the enumerated, concrete, on-domain-grounded rule checks (Yoda / brace / spacing / naming for PHP; summary / `@param` / `@return` / `@since` / alignment for PHPDoc), keeps them URL-free, and mirrors them verbatim into the catalog record.
- **Degenerate-shape residual risk (recorded).** A model could satisfy the outcome with a shape that sidesteps the construct (e.g. a `match`/array lookup with no `if` for the PHP scenario, or a trivial no-real-parameter function for the docs scenario). Acceptable residual risk for a judge-only scenario; the recommended prompts steer away from it, and the acceptance still grades the rules that do appear.
- **Verbatim lockstep (correctness, must-hold).** Each record's `prompt` and `acceptance` must match the shipped `scenario.yaml` verbatim (same text, order, quoting). Phase 4 authors both together; phase 4/5 verifies.
- **Catalog edits confined to the Coding Standards section (correctness, must-hold).** Only the two Coding Standards records + the one header line may change; the iAPI `_candidates.yaml` and all non-Coding-Standards records must be byte-untouched (Requirement 13 / Acceptance Criterion 13). Phase 4/5 must diff-check this.
- **Catalog full-record order within the sub-header (phase-4 latitude).** Any consistent order within `# Implemented Coding Standards scenarios — full records`; recommended `coding-standards-php` then `coding-standards-inline-docs` (matching the promotion + addition order).
- **Shared coding-standards rubric (recommendation only, non-blocking).** A shared rubric (à la `eval/rubrics/wp-interactivity-api-best-practices.md`) for the cross-cutting standards sub-areas is a plausible future enhancement, but is NOT created by this review and does not block it. Recorded as a recommendation only.
- **Deferred sub-areas footprint (per spec).** HTML, CSS, JavaScript, JSDoc, and Accessibility are not implemented and get no new catalog stub (none has a stub today); their defer reasons live in the spec and this design doc only.
- **Naming forward inconsistency (recorded, out of scope).** The new `coding-standards-*` scenarios sit beside non-prefixed older scenarios and the already-prefixed `themes-*` / `block-editor-*` / `rest-api-*` / `common-apis-*` sets. A suite-wide rename is out of scope; existing scenarios are NOT renamed.
- **Static / structural verification only (intentional).** No agent boots `wp-env`, runs the full `scenarios × testing-agents` matrix, or generates scenario solution code; the skill is untouched. The bar is discoverable + well-formed.
