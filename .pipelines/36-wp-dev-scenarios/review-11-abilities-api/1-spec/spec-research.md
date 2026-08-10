# Spec Research

## Rough Idea

Ship ~3 simple Abilities API scenarios, promoting the 3 gap stubs (`abilities-api-register`, `abilities-audit-rest-surface`, `abilities-verify-callbacks`) to full records under `eval/scenarios/abilities-api/`. Constraints (relaxed): off-domain grounding allowed; harness-wall is a recorded dependency, not a blocker. e2e where feasible (3-level import `"../../../utils/wp-cli.mjs"`); judge-only otherwise. Skill untouched; iAPI catalog untouched; verification static/structural only; pass not required.

## Q&A

### Q1: What is the WordPress Abilities API — is it real, documented, and stable? What do the three agent-skills describe?

Does `wp_register_ability` exist in core WP? What do the agent-skills `wp-abilities-api`, `wp-abilities-audit`, and `wp-abilities-verify` each describe? What is the canonical documentation source? Is the REST surface exploitable from the existing e2e harness?

**A:** The Abilities API is real, stable, and shipped in WordPress 6.9 (core, November 2025). `wp_register_ability()` is a core function in `wp-includes/abilities-api.php`. The standalone Composer package (github.com/WordPress/abilities-api) was archived February 2026 after merge to core. On-domain handbook documentation now exists: `developer.wordpress.org/apis/abilities-api/` and `/apis/abilities-api/rest-api-endpoints/`.

The three skills form a pipeline:
- **wp-abilities-api** — teaches writing PHP registrations (hook order, argument shape, annotation semantics, domain-vs-projection). Calls `wp_register_ability()` on `wp_abilities_api_init`; categories on `wp_abilities_api_categories_init`.
- **wp-abilities-audit** — teaches analyzing an existing plugin's REST surface and producing a structured markdown audit document proposing Abilities API registrations. Output is a markdown report with YAML metadata, Controller Inventory table, and three buckets (`proposed_abilities`, `excluded_from_mvp`, `surfaced_gaps`). No plugin deliverable.
- **wp-abilities-verify** — teaches adversarially verifying existing ability registrations: annotation-correctness check (does a `readonly: true` callback actually avoid writes?), permission gate shape, schema lints, audit-doc alignment. Output is a PASS/WARN/FAIL markdown report. No plugin deliverable.

**REST surface key facts (for e2e):** Namespace `wp-abilities/v1`. LIST: `GET /wp-json/wp-abilities/v1/abilities` → bare JSON array, each item has `name` field. Single: `GET /wp-json/wp-abilities/v1/{namespace}/{ability}`. Run: `GET|POST|DELETE /wp-json/wp-abilities/v1/{namespace}/{ability}/run` (method depends on `readonly`/`destructive` meta). CRITICAL: ALL endpoints require an authenticated user — anonymous `page.request.get` returns 401, even for the list. Must use `requestUtils.rest()` (admin). Ability must set `meta.show_in_rest => true` or it is invisible to REST (returns `rest_ability_not_found`).

**e2e feasibility for abilities-api-register:** Feasible without harness change. Mirror the authed half of `rest-api-permission-check`. After activating the plugin, assert `requestUtils.rest({ path: "/wp-abilities/v1/abilities" })` returns an array containing an object whose `.name` equals the registered ability id. wp-env defaults to latest WordPress (>= 6.9), so `wp_register_ability()` is present.

**abilities-audit-rest-surface / abilities-verify-callbacks:** Both produce markdown reports, not PHP plugins. The current harness grades PHP plugin deliverables via scaffold+activate+REST. These are harness-wall scenarios — ship judge-only, record the dependency.

**Reasoning:** Researcher verified against `developer.wordpress.org/apis/abilities-api/`, `make.wordpress.org/core/2025/11/10/abilities-api-in-wordpress-6-9/`, agent-skills SKILL.md files (wp-abilities-api, wp-abilities-audit, wp-abilities-verify), and harness source (wp-env WP version behavior).

**Sources:**
- https://developer.wordpress.org/apis/abilities-api/ (on-domain handbook — primary)
- https://developer.wordpress.org/apis/abilities-api/rest-api-endpoints/ (on-domain)
- https://make.wordpress.org/core/2025/11/10/abilities-api-in-wordpress-6-9/
- https://github.com/WordPress/agent-skills/tree/trunk/skills/wp-abilities-api (SKILL.md)
- https://github.com/WordPress/agent-skills/tree/trunk/skills/wp-abilities-audit (SKILL.md)
- https://github.com/WordPress/agent-skills/tree/trunk/skills/wp-abilities-verify (SKILL.md)

### Q2: For the two judge-only scenarios (audit + verify), what acceptance points can a judge grade from the report content alone?

What sections/fields must an audit report include? What are the minimum acceptance bullets for a verify report?

**A:**

**abilities-audit-rest-surface** — minimum 4 gradeable bullets from report content:
1. Controller Inventory section with a table enumerating at least one REST controller — each row includes controller class/file, HTTP method, route, route-registration line, callback name, permission callback, and return type.
2. At least one entry in `proposed_abilities` — each entry includes `name`, `backing`, `capability_gate`, `annotations` (readonly/destructive/idempotent), and `effort` (S/M/L).
3. Deferred/excluded registrations appear in `excluded_from_mvp` or `surfaced_gaps` — each with a one-sentence deferral reason; abilities with no backing controller have `backing: null` and appear in `surfaced_gaps`.
4. A "Notes and Surprises" prose section covering at least the capability-gate mechanism in use and any non-standard patterns found.

**abilities-verify-callbacks** — minimum 4 gradeable bullets from report content:
1. Report opens with `## Status: PASS | WARN | FAIL` — verdict is one of exactly those three values; a single FAIL forces top-line FAIL; WARNs without FAILs yield WARN.
2. Annotation correctness section — checks each `readonly: true` ability for prohibited write patterns (`$wpdb->update`, `update_option`, non-GET HTTP/REST delegates, filesystem mutations); any violation is FAIL with evidence.
3. Permission gates section — classifies each ability's `permission_callback` against the six known shapes; `current_user_can(...)` (Shape A) is OK; literal `true` (Shape E) is FAIL; per-ability table shows Ability / Claim / Result / Evidence.
4. Static inventory, schema lints, and error-code vocabulary sections — schema lints flag missing `additionalProperties`, empty enums, or non-static defaults as WARN; non-vocabulary WP_Error codes flagged as WARN.

**Reasoning:** Drawn directly from the canonical SKILL.md files (wp-abilities-audit and wp-abilities-verify), which specify required sections, verdict logic, and per-ability table structure.

**Sources:**
- https://raw.githubusercontent.com/WordPress/agent-skills/trunk/skills/wp-abilities-audit/SKILL.md
- https://raw.githubusercontent.com/WordPress/agent-skills/trunk/skills/wp-abilities-verify/SKILL.md

## Research

### abilities-api-register — e2e feasibility

The `wp_register_ability()` function landed in WordPress core 6.9 (November 2025). The REST namespace is `wp-abilities/v1`. The list endpoint `GET /wp-json/wp-abilities/v1/abilities` requires an authenticated user — anonymous requests return 401. An ability must set `meta.show_in_rest => true` to appear on the list. The `@wordpress/e2e-test-utils-playwright` `requestUtils.rest()` channel issues admin-authenticated REST calls and is the correct vehicle for the assertion. No harness change is needed: the existing pattern from `rest-api-permission-check` (`requestUtils.rest({ path: "/wp-abilities/v1/abilities" })`) works as-is. wp-env defaults to latest WordPress (>= 6.9) so the function is present. The e2e spec lives 3 levels deep (`eval/scenarios/abilities-api/abilities-api-register/e2e.spec.mjs`) and imports `"../../../utils/wp-cli.mjs"`.

### abilities-audit-rest-surface and abilities-verify-callbacks — harness wall

Both skills produce markdown documents (an audit report and a verification report), not PHP plugins. The current harness grades PHP plugin deliverables via scaffold + activate + REST/DOM assertion. There is no harness mechanism for activating a "produce a report" scenario and collecting the produced markdown. Both scenarios must ship judge-only. Harness dependency to record: "harness needs a report-collection mode before these can move to e2e."

### Source files for catalog records

- abilities-api-register grounding: `dev.wordpress.org` — `developer.wordpress.org/apis/abilities-api/` + `developer.wordpress.org/apis/abilities-api/rest-api-endpoints/` (both on-domain handbook pages)
- abilities-audit-rest-surface grounding: `agent-skills` (no on-domain Abilities API audit chapter exists; skill SKILL.md is the canonical reference)
- abilities-verify-callbacks grounding: `agent-skills` (same rationale)

## Consolidated Requirements

### 1. Folder layout

New scenarios live under **`eval/scenarios/abilities-api/<scenario-name>/`** — a new topic subfolder under `eval/scenarios/`, mirroring the `block-editor/`, `rest-api/`, `common-apis/` topic-folder pattern established in prior reviews. Directory name equals `scenario.yaml` `name` equals catalog record `name`.

### 2. Scenario count and names

Exactly **3 scenarios** are promoted, keeping the stub names: `abilities-api-register`, `abilities-audit-rest-surface`, `abilities-verify-callbacks`.

### 3. Per-scenario disposition

**abilities-api-register**
- Kind: **e2e** (feasible today without harness change)
- Directory: `eval/scenarios/abilities-api/abilities-api-register/`
- Ships: `scenario.yaml` + `e2e.spec.mjs`
- Prompt (user-voice, tool-agnostic): asks user to register a named ability so it is discoverable over the REST surface. Must pin the ability id (namespaced string, e.g. `wp-skill/my-ability`). The prompt must state the pinned id so the e2e can assert it. Does not name `wp_register_ability`, `wp_abilities_api_init`, or "Abilities API" by name.
- Acceptance (~4 points): ability registered on the correct hook; ability appears at the REST list endpoint; ability is exposed to REST (`show_in_rest: true`); at least one annotation (readonly/destructive/idempotent) declared.
- e2e asserts: authenticated `requestUtils.rest({ path: "/wp-abilities/v1/abilities" })` returns array containing object whose `name` equals the pinned ability id.
- `rubrics: []`
- Import: `import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs"` (3-level relative path)
- Plugin slug: `plugin-abilities-api-register-${workerInfo.project.metadata.agentId}`
- Harness dependency: none
- Catalog grounding: `source: dev.wordpress.org`; `source_files`: `developer.wordpress.org/apis/abilities-api/` + `developer.wordpress.org/apis/abilities-api/rest-api-endpoints/`

**abilities-audit-rest-surface**
- Kind: **judge-only** (harness wall — produces markdown report, not a PHP plugin)
- Directory: `eval/scenarios/abilities-api/abilities-audit-rest-surface/`
- Ships: `scenario.yaml` only (no `e2e.spec.mjs`)
- Prompt (user-voice, tool-agnostic): asks user to audit an existing plugin's REST surface and produce a structured report proposing which REST routes should become named abilities, noting what to defer and why.
- Acceptance (4 points): Controller Inventory section with table enumerating at least one REST controller; at least one `proposed_abilities` entry with required fields (`name`, `backing`, `capability_gate`, `annotations`, `effort`); deferred registrations in `excluded_from_mvp` or `surfaced_gaps` each with a one-sentence deferral reason; Notes and Surprises prose section present covering the capability-gate mechanism and any non-standard patterns.
- `rubrics: []`
- Harness dependency recorded: "harness needs a report-collection mode before this can be automatically verified; until then, judge grades the markdown output statically."
- Catalog grounding: `source: agent-skills`; `source_files`: `https://github.com/WordPress/agent-skills/tree/trunk/skills/wp-abilities-audit`

**abilities-verify-callbacks**
- Kind: **judge-only** (harness wall — produces markdown report, not a PHP plugin)
- Directory: `eval/scenarios/abilities-api/abilities-verify-callbacks/`
- Ships: `scenario.yaml` only (no `e2e.spec.mjs`)
- Prompt (user-voice, tool-agnostic): asks user to verify a plugin's registered abilities — check that each ability's annotations match its callback behavior, that permissions are correctly gated, and produce a structured verdict (pass, warn, or fail).
- Acceptance (4 points): top-level Status verdict (PASS/WARN/FAIL) present — a single FAIL forces top-line FAIL; WARNs without FAILs yield WARN; annotation correctness section checking `readonly: true` callbacks for write patterns with evidence; permission gates section with per-ability classification (direct `current_user_can(...)` OK; literal `true` FAIL); schema lints and error-code vocabulary sections present.
- `rubrics: []`
- Harness dependency recorded: "harness needs a report-collection mode before this can be automatically verified; until then, judge grades the markdown report statically."
- Catalog grounding: `source: agent-skills`; `source_files`: `https://github.com/WordPress/agent-skills/tree/trunk/skills/wp-abilities-verify`

### 4. scenario.yaml shape

Each `scenario.yaml` contains exactly: `name`, `description`, `skills: [wordpress-development]`, `prompt`, `acceptance`, `rubrics: []`. No catalog-only fields (`difficulty`, `concepts`, `source`, `source_files`) appear in any `scenario.yaml`. Prompts are user-voice and tool-agnostic — they do not name the PHP function, hook, API name, or technology. Acceptance strings are clean human-readable checks with no embedded URLs.

### 5. e2e spec shape (abilities-api-register only)

The `e2e.spec.mjs` follows the established lifecycle:
- Imports `{ expect, test }` from `@wordpress/e2e-test-utils-playwright`
- Imports `deactivateAllPlugins` from `"../../../utils/wp-cli.mjs"` (3-level relative path, matching the `abilities-api/abilities-api-register/` nesting depth)
- `test.beforeAll`: calls `deactivateAllPlugins()` then `requestUtils.activatePlugin("plugin-abilities-api-register-${workerInfo.project.metadata.agentId}")`
- `test.afterAll`: calls `deactivateAllPlugins()`
- Assertion: `requestUtils.rest({ path: "/wp-abilities/v1/abilities" })` returns an array containing an object whose `.name` equals the pinned ability id from the prompt
- No content seeding; no new helper added to `eval/utils/`; assertion is theme-independent

### 6. Asserted literals pinned in the prompt

The pinned ability id that the `abilities-api-register` e2e asserts must appear verbatim in that scenario's `prompt`, so prompt and assertion stay in lockstep.

### 7. Catalog update

All three stubs are promoted to full records under a dedicated `# Implemented Abilities API scenarios — full records` sub-header. Each full record carries: `name`, `description`, `difficulty`, `concepts`, `source`, `source_files`, `prompt` (verbatim from `scenario.yaml`), `acceptance` (verbatim from `scenario.yaml`). Source provenance lives only in the catalog record, never in `scenario.yaml`. The two judge-only records additionally carry a `# Harness dependency:` comment noting the report-collection gap. No other area's records are modified.

### 8. Verification bar

Static/structural only: each scenario passes Skillsmith's scenario-shape check (discoverable). For `abilities-api-register`, `e2e.spec.mjs` parses and resolves its imports under test-runner collection. A failing grade against the current skill is acceptable. No wp-env boot; no plugin code generated.

### 9. Skill and existing suite untouched

No file under `skills/wordpress-development/` modified. No existing scenario renamed or reorganized. Skillsmith's topic-folder discovery is unaffected. The iAPI `_candidates.yaml` is not modified. Non-Abilities-API catalog records are not changed.

### 10. Harness/skill dependencies recorded

For the two judge-only scenarios, catalog records must include a comment: "Harness dependency: harness needs a report-collection mode (activate-scenario → collect markdown output → grade) before these can move to e2e." This does not block shipping.

## Out of Scope

1. Modifying the skill (`skills/wordpress-development/`)
2. Running the full test matrix or booting wp-env for a live pass
3. Generating plugin code for any scenario
4. Adding shared rubrics under `eval/rubrics/`
5. Renaming or reorganizing any existing scenario directory
6. Modifying the iAPI `_candidates.yaml` or any non-Abilities-API catalog record
7. Implementing other agent-skills gaps in this review (performance-object-cache, phpstan-baseline, etc.)
8. Re-litigating topic-folder vs flat naming (topic-folder is the post-review-10 convention)
9. Requiring scenarios to pass against the current skill
