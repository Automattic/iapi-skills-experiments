# Design Doc: Organize scenarios into real topic folders + agent-skills coverage map

## Overview

The `wordpress-development` skill is evaluated by a Skillsmith-based suite under `eval/`. Today the suite holds **38 scenario directories as flat immediate children of `eval/scenarios/`** (plus two leading-underscore catalog files: `_candidates.yaml` for the Interactivity API and `_wp-dev-candidates.yaml` for WordPress development). Scenario discovery is performed by an external, pinned package — `@automattic/skillsmith` (github pin `6bd90c34…`) — whose `src/scenarios/enumerate.ts` lists only the immediate children of `eval/scenarios/` and requires a `scenario.yaml` directly inside each child. The flat layout has become hard to navigate as the suite has grown across ten developer.wordpress.org areas.

This review does two independent things:

**Part 1 — Real topic folders.** Move every one of the 38 scenarios into one of **seven real per-topic subdirectories** under `eval/scenarios/` (`interactivity-api/`, `plugins/`, `block-editor/`, `rest-api/`, `themes/`, `common-apis/`, `coding-standards/`), update the local harness (`verify-e2e.ts`, the 27 e2e import paths), refresh the catalog area headers and the README, and **document the precise Skillsmith nested-discovery dependency** so the owner can file an actionable upstream issue. This is the first review to actually move/rename scenarios; it supersedes the review-2 "pseudo-folder" (area-prefixed flat names) compromise.

**Part 2 — Coverage map.** Compare our scenario coverage against the **17 agent-skills topics** in `WordPress/agent-skills/skills`, record a coverage status (Covered / Covered-partial / Deferred-area / Gap) for each, and add **nine review-triggerable gap stubs** to `_wp-dev-candidates.yaml` under a new `# === Agent-Skills Gaps ===` section. No new scenarios are authored.

**Owner decisions, settled at kickoff (not re-litigated here):**
- Do real folders **even though** the pinned Skillsmith currently cannot discover nested scenarios — the owner will drive the upstream fix and accepts the temporary invisibility.
- **Keep the `<area>-*` directory-name prefixes** (e.g. `block-editor/block-editor-dynamic-block`). Only locations change; no `scenario.yaml` `name` or catalog record `name` changes.
- The `skills/` directory is **untouched**.
- Every `scenario.yaml`'s `prompt` and `acceptance` (and `name`, `description`, `skills`, `rubrics`) are **preserved verbatim** through the move — including the pre-existing `counter/` directory ↔ `name: counter-block` mismatch, which is **not** fixed here.
- Part 2 = coverage map + gap stubs only; **no new scenarios**, no new catalog file.

As in prior reviews, verification is **static/structural** (git detects the moves as renames; Playwright still collects all 27 e2e specs; the YAML still parses; no scenario content drifts). Skillsmith discovery cannot be exercised locally (its `node_modules` is not installed at this worktree), so the Skillsmith-side behavior is reasoned from the pinned source and documented, not run.

## Approach

The end-to-end mental model the implementer works from:

**The taxonomy is topic-only, flat at depth-1.** There is **no skill-level split** — no `wordpress-development/` or `interactivity-api/` *skill* parent. The Interactivity-API scenarios live in a topic folder `interactivity-api/` exactly like every other topic; the iAPI-vs-wp-dev distinction continues to live **only in the two catalogs** (`_candidates.yaml` vs `_wp-dev-candidates.yaml`) and in each scenario's `skills:` field — not in the directory tree. Every scenario sits exactly two levels under `eval/scenarios/`: `eval/scenarios/<topic>/<existing-dir-name>/`.

**Each scenario moves with `git mv`, names unchanged.** For each of the 38 directories: `git mv eval/scenarios/<name>/ eval/scenarios/<topic>/<name>/`. No directory is created, deleted, merged, or renamed — only relocated. The `<area>-*` prefixes are kept (so `block-editor/block-editor-dynamic-block` is intentional and accepted as cosmetic redundancy). Because `git mv` preserves file identity, the move is a pure rename in git history and `scenario.yaml` bytes are unchanged.

**Two mechanical consequences of the extra nesting level must be handled.** (1) Every e2e spec's relative import of `wp-cli.mjs` gains one `../` (depth-2 → depth-3). (2) The local harness `verify-e2e.ts` attributes e2e failures by the scenario's directory **basename**; once scenarios are nested and Skillsmith reports a *relative* `dirName` (`plugins/cpt-register`), the basename-only logic mismatches and failures go silently un-attributed — so `scenarioDirOf` must be updated to reconstruct the **full relative path from `eval/scenarios/`**.

**One external dependency is documented, not resolved.** The pinned Skillsmith does non-recursive discovery and emits basename `dirName`s, so after this review's moves land the nested scenarios are **invisible to `npx skillsmith` until two upstream changes ship** (recursive discovery + relative `dirName`). The owner accepts this temporary state. The local-harness changes (import depth, `scenarioDirOf`) are made now so that the moment Skillsmith is fixed, the suite is immediately functional with no further local work.

**Part 2 is documentation + catalog stubs only.** The coverage map (all 17 agent-skills topics, with status and rationale) is recorded **in this design doc** (and the spec research) — the durable artifact home; no new skill file and no new catalog file is created. The nine genuine gaps each get a **review-triggerable stub** appended to `_wp-dev-candidates.yaml` under a new `# === Agent-Skills Gaps ===` section, mirroring how the existing area stubs seeded reviews 1–9. Each stub carries provenance and a trigger marker but no `prompt`/`acceptance` (it is a stub, not an implemented scenario).

**What is NOT touched:** the `skills/` directory; any `scenario.yaml` content; any existing catalog *record's* `name` or body (only area-header comments and the new gaps section change); `playwright.config.ts`; the iAPI `_candidates.yaml`; the scaffold (`scaffold-plugin.ts`); `wp-cli.mjs`; `eval/rubrics/`.

## Components

### Modified components

- **The 38 scenario directories** (`eval/scenarios/<name>/` → `eval/scenarios/<topic>/<name>/`). Relocated via `git mv`; directory names and all file contents unchanged (except the e2e import line, below).
- **27 `e2e.spec.mjs` files** — one import line each changes from `"../../utils/wp-cli.mjs"` to `"../../../utils/wp-cli.mjs"`. No other content changes.
- **`eval/utils/verify-e2e.ts`** — `scenarioDirOf` (and the comment block describing it) is updated to return the **full relative path from the Playwright testDir** (`eval/scenarios`) rather than the immediate-parent basename. The `dirToName`/`nameToDir` maps, the line-74 spec-path join, and the rest of the file are unchanged in code (their *inputs* become relative paths once Skillsmith is fixed; see Interfaces).
- **`eval/scenarios/_wp-dev-candidates.yaml`** — (a) light, non-record area-header comments updated to cross-reference the new folder paths; (b) a new `# === Agent-Skills Gaps ===` section with nine gap stubs appended at the bottom. **No existing record's `name` or body changes.**
- **`README.md`** — lines ~31-38 (the "bare directory names" passage + the catalog-files note) and lines ~60-66 (the Agent-cap R12 invocation example) updated to describe the nested per-topic layout, plus a short paragraph documenting the Skillsmith nested-discovery dependency.

### New components

- **Seven topic directories** under `eval/scenarios/`: `interactivity-api/`, `plugins/`, `block-editor/`, `rest-api/`, `themes/`, `common-apis/`, `coding-standards/`. They are created implicitly by the `git mv` destination paths; none contains its own `scenario.yaml` (a topic folder is a grouping container, not a scenario — which is exactly why the pinned Skillsmith skips it).
- **Nine gap stubs** (catalog records) inside `_wp-dev-candidates.yaml`'s new gaps section.
- **The coverage map** (this design doc + the spec research artifact). Not a code file.

### Untouched-but-relevant components

- **`@automattic/skillsmith`** (pinned `6bd90c34…`, `src/scenarios/enumerate.ts`) — does discovery. Non-recursive: `readdirSync(scenariosRoot)` lists immediate children; each must hold a `scenario.yaml` directly; emits `dirName: entry` (basename). **Not modified by this review** — but the design specifies the two upstream changes it needs (documented for the owner's issue, not made here).
- **`playwright.config.ts`** — `testDir: "./eval/scenarios"`, `testMatch: "**/e2e.spec.mjs"`. The `**/` glob collects e2e specs at **any** depth, so nesting does **not** break collection. **No change needed** (confirmed against the file).
- **`eval/utils/scaffold-plugin.ts`** — scaffolds `plugin-<scenario.name>-<agentId>`. Keyed off `scenario.name`, not the directory path; since no `name` changes, it is unaffected.
- **`eval/utils/wp-cli.mjs`** — exports `deactivateAllPlugins()`. Its *location* (`eval/utils/`) does not change; only the importers' relative path to it changes.
- **`eval/scenarios/_candidates.yaml`** (iAPI catalog) — byte-untouched.
- **`skills/`** — byte-untouched.

## Interfaces and Data Flow

### Folder taxonomy and the complete 38-scenario move map

Seven topic folders. Every scenario maps to exactly one. Directory **names are unchanged** — only the parent path changes. (Counts: iAPI 11, Plugins 9, Block Editor 5, REST API 4, Themes 3, Common APIs 4, Coding Standards 2 = 38. e2e column = whether that scenario ships an `e2e.spec.mjs`.)

| # | From (current) | To (after move) | e2e? |
|---|---|---|---|
| 1 | `eval/scenarios/counter/` | `eval/scenarios/interactivity-api/counter/` | yes |
| 2 | `eval/scenarios/independent-counters/` | `eval/scenarios/interactivity-api/independent-counters/` | yes |
| 3 | `eval/scenarios/shared-state/` | `eval/scenarios/interactivity-api/shared-state/` | yes |
| 4 | `eval/scenarios/derived-double/` | `eval/scenarios/interactivity-api/derived-double/` | yes |
| 5 | `eval/scenarios/config-fetch/` | `eval/scenarios/interactivity-api/config-fetch/` | yes |
| 6 | `eval/scenarios/async-fetch/` | `eval/scenarios/interactivity-api/async-fetch/` | yes |
| 7 | `eval/scenarios/fruit-list-each/` | `eval/scenarios/interactivity-api/fruit-list-each/` | yes |
| 8 | `eval/scenarios/focus-trap-menu/` | `eval/scenarios/interactivity-api/focus-trap-menu/` | yes |
| 9 | `eval/scenarios/toggle-visibility/` | `eval/scenarios/interactivity-api/toggle-visibility/` | yes |
| 10 | `eval/scenarios/paginated-list/` | `eval/scenarios/interactivity-api/paginated-list/` | yes |
| 11 | `eval/scenarios/minimal-scaffold/` | `eval/scenarios/interactivity-api/minimal-scaffold/` | yes |
| 12 | `eval/scenarios/cpt-register/` | `eval/scenarios/plugins/cpt-register/` | yes |
| 13 | `eval/scenarios/taxonomy-register/` | `eval/scenarios/plugins/taxonomy-register/` | yes |
| 14 | `eval/scenarios/post-meta-rest/` | `eval/scenarios/plugins/post-meta-rest/` | yes |
| 15 | `eval/scenarios/settings-register/` | `eval/scenarios/plugins/settings-register/` | yes |
| 16 | `eval/scenarios/cron-event/` | `eval/scenarios/plugins/cron-event/` | no |
| 17 | `eval/scenarios/i18n-textdomain/` | `eval/scenarios/plugins/i18n-textdomain/` | no |
| 18 | `eval/scenarios/admin-menu-page/` | `eval/scenarios/plugins/admin-menu-page/` | no |
| 19 | `eval/scenarios/filter-body-class/` | `eval/scenarios/plugins/filter-body-class/` | yes |
| 20 | `eval/scenarios/shortcode-with-attr/` | `eval/scenarios/plugins/shortcode-with-attr/` | yes |
| 21 | `eval/scenarios/block-editor-dynamic-block/` | `eval/scenarios/block-editor/block-editor-dynamic-block/` | yes |
| 22 | `eval/scenarios/block-editor-block-supports/` | `eval/scenarios/block-editor/block-editor-block-supports/` | yes |
| 23 | `eval/scenarios/block-editor-block-styles/` | `eval/scenarios/block-editor/block-editor-block-styles/` | yes |
| 24 | `eval/scenarios/block-editor-block-filters/` | `eval/scenarios/block-editor/block-editor-block-filters/` | yes |
| 25 | `eval/scenarios/block-editor-block-bindings/` | `eval/scenarios/block-editor/block-editor-block-bindings/` | no |
| 26 | `eval/scenarios/rest-api-route-validation/` | `eval/scenarios/rest-api/rest-api-route-validation/` | yes |
| 27 | `eval/scenarios/rest-api-permission-check/` | `eval/scenarios/rest-api/rest-api-permission-check/` | yes |
| 28 | `eval/scenarios/rest-api-custom-field-on-post/` | `eval/scenarios/rest-api/rest-api-custom-field-on-post/` | yes |
| 29 | `eval/scenarios/rest-custom-endpoint/` | `eval/scenarios/rest-api/rest-custom-endpoint/` | yes |
| 30 | `eval/scenarios/themes-enqueue-assets/` | `eval/scenarios/themes/themes-enqueue-assets/` | yes |
| 31 | `eval/scenarios/themes-nav-menu-location/` | `eval/scenarios/themes/themes-nav-menu-location/` | no |
| 32 | `eval/scenarios/themes-sidebar-widget-area/` | `eval/scenarios/themes/themes-sidebar-widget-area/` | no |
| 33 | `eval/scenarios/common-apis-options/` | `eval/scenarios/common-apis/common-apis-options/` | no |
| 34 | `eval/scenarios/common-apis-transients/` | `eval/scenarios/common-apis/common-apis-transients/` | no |
| 35 | `eval/scenarios/common-apis-rewrite-rule/` | `eval/scenarios/common-apis/common-apis-rewrite-rule/` | yes |
| 36 | `eval/scenarios/common-apis-http-request/` | `eval/scenarios/common-apis/common-apis-http-request/` | no |
| 37 | `eval/scenarios/coding-standards-php/` | `eval/scenarios/coding-standards/coding-standards-php/` | no |
| 38 | `eval/scenarios/coding-standards-inline-docs/` | `eval/scenarios/coding-standards/coding-standards-inline-docs/` | no |

**e2e total: 27** (iAPI 11, Plugins 6 — cpt-register, taxonomy-register, post-meta-rest, settings-register, filter-body-class, shortcode-with-attr; Block Editor 4; REST API 4; Themes 1; Common APIs 1). 11 are judge-only. Matches the inventory.

The two catalog files (`_candidates.yaml`, `_wp-dev-candidates.yaml`) **stay where they are**, as immediate children of `eval/scenarios/`. They are not scenarios, the leading underscore keeps them discovery-skipped, and they reference scenarios by `name` (not by path), so they do not move.

### Harness change 1 — e2e import depth (27 files)

Every e2e spec currently has exactly **one** relative import (verified across all 27 specs — the only `from "../..` line in each file):

```js
import { deactivateAllPlugins } from "../../utils/wp-cli.mjs";
```

This resolves from `eval/scenarios/<name>/e2e.spec.mjs` (depth-2) to `eval/utils/wp-cli.mjs`. After the move to `eval/scenarios/<topic>/<name>/e2e.spec.mjs` (depth-3) it must become:

```js
import { deactivateAllPlugins } from "../../../utils/wp-cli.mjs";
```

One extra `../`. **No e2e spec has any other `../../utils/...` import** (confirmed by grep — `wp-cli.mjs` is the sole relative import in every spec), so this single per-file edit is the complete set of import changes. The 27 affected scenarios (by destination path):

`interactivity-api/`: counter, independent-counters, shared-state, derived-double, config-fetch, async-fetch, fruit-list-each, focus-trap-menu, toggle-visibility, paginated-list, minimal-scaffold (11).
`plugins/`: cpt-register, taxonomy-register, post-meta-rest, settings-register, filter-body-class, shortcode-with-attr (6).
`block-editor/`: block-editor-dynamic-block, block-editor-block-supports, block-editor-block-styles, block-editor-block-filters (4).
`rest-api/`: rest-api-route-validation, rest-api-permission-check, rest-api-custom-field-on-post, rest-custom-endpoint (4).
`themes/`: themes-enqueue-assets (1).
`common-apis/`: common-apis-rewrite-rule (1).

(Any spec that imports `wp-cli.mjs` via `import.meta.url`/`require` resolution, an absolute path, or a non-`utils` relative path would need separate handling — but none does; the grep shows a uniform single `"../../utils/wp-cli.mjs"` line, so the change is purely "add one `../`" everywhere.)

### Harness change 2 — `verify-e2e.ts` `scenarioDirOf`

**Current code** (lines 217-229):

```ts
/**
 * Extract the scenario directory name from a spec file path. Specs live
 * at `<scenarioDir>/e2e.spec.mjs`, so the scenario directory is the
 * spec's immediate parent. Playwright reports file paths relative to its
 * testDir (`eval/scenarios`), e.g. `counter/e2e.spec.mjs` — there is no
 * `scenarios` segment to anchor on, so we take the parent segment
 * directly. This also handles absolute paths that do include `scenarios`.
 */
function scenarioDirOf(file: string): string | undefined {
	const segments = file.split(/[\\/]/).filter((s) => s.length > 0);
	if (segments.length >= 2) return segments[segments.length - 2];
	return undefined;
}
```

**Why it breaks after the move.** `scenarioDirOf`'s result is used as the key into `dirToName` (line 195: `const scenario = dirName ? dirToName.get(dirName) : undefined;`). The `dirToName` map is built from `scenario.dirName` as Skillsmith reports it (line 40). Once Skillsmith reports **relative** dirNames (e.g. `plugins/cpt-register`) — which is upstream change (B), required for nested discovery — the map keys are `plugins/cpt-register`. But `scenarioDirOf` returns only the **immediate parent segment** of the spec path. For a nested spec path `plugins/cpt-register/e2e.spec.mjs`, `segments[length-2]` is `cpt-register`, **not** `plugins/cpt-register`. The lookup misses, `scenario` is `undefined`, and the failing spec is **silently dropped** (line 196: `if (scenario === undefined) continue;`). Result: a real e2e failure on a nested scenario is never reported back as a `VerificationFailure` — a silent correctness hole in failure attribution.

**Intended new behavior (WHAT, not necessarily final code).** `scenarioDirOf` must return the **full path from `eval/scenarios/` down to the scenario directory** (the spec's parent), i.e. everything between the testDir root and the `e2e.spec.mjs` filename — so it yields `plugins/cpt-register`, matching the relative `dirName` Skillsmith supplies. Concretely:

- Strip the trailing filename segment (`e2e.spec.mjs`).
- If the path contains a `scenarios` segment (absolute paths do), return the join of all segments **after** `scenarios`.
- Otherwise (Playwright's testDir-relative form, which has no `scenarios` anchor), return the join of **all segments except the last** (the filename) — i.e. the full relative directory path, not just its last segment.
- Preserve forward-slash joining so the key matches the `dirName` form Skillsmith produces.

This keeps the **flat case working unchanged** (`counter/e2e.spec.mjs` → `counter`, matching a flat `dirName: counter`) while making the **nested case correct** (`plugins/cpt-register/e2e.spec.mjs` → `plugins/cpt-register`). The comment block above the function is updated to describe path-reconstruction instead of "immediate parent."

**Line-74 spec-path construction is left as-is.** `join("eval", "scenarios", dirName, "e2e.spec.mjs")` (line 74) already resolves correctly once `dirName` is the relative path `plugins/cpt-register` — it builds `eval/scenarios/plugins/cpt-register/e2e.spec.mjs`, the true location. No change is needed there; it is contingent only on Skillsmith change (B). This makes the two sides consistent: line 74 *constructs* spec paths from relative dirNames, and `scenarioDirOf` *parses* spec paths back into the same relative dirNames — both keyed identically into `nameToDir`/`dirToName`.

**Note on local-only verifiability.** Because Skillsmith's `node_modules` is not installed here, the *runtime* coupling (Skillsmith handing `verify-e2e.ts` relative dirNames) cannot be exercised locally. `verify-e2e.ts` is changed now so it is correct **for both** the flat dirNames Skillsmith emits today and the relative dirNames it will emit after change (B); the function above satisfies both.

### Harness change 3 — Playwright (none)

`playwright.config.ts` uses `testDir: "./eval/scenarios"` and `testMatch: "**/e2e.spec.mjs"`. The `**/` glob already matches at any nesting depth, so all 27 specs are still collected from `eval/scenarios/<topic>/<name>/e2e.spec.mjs`. **No change to `playwright.config.ts` is required** — confirmed against the file.

### Catalog change — `_wp-dev-candidates.yaml`

Two kinds of edits, **neither of which alters an existing record's `name` or body**:

1. **Area-header cross-references (light, non-record).** Each `# === Area: <X> ===` comment header gains a folder pointer, e.g.:
   - `# === Area: Block Editor ===` → add a line `# folder: eval/scenarios/block-editor/`
   - similarly for Plugins → `eval/scenarios/plugins/`, Themes → `eval/scenarios/themes/`, Common APIs → `eval/scenarios/common-apis/`, Coding Standards → `eval/scenarios/coding-standards/`, REST API → `eval/scenarios/rest-api/`.
   - Areas without a matching folder of implemented scenarios (Advanced Administration, WordPress Playground, Code Reference, WP-CLI Commands) are left as-is or get a `# folder: (none — deferred area)` note. These are comment-only changes; **do not churn or reorder records**.

2. **New `# === Agent-Skills Gaps ===` section appended at the bottom** with the nine gap stubs (full content below).

The iAPI `_candidates.yaml` is **not modified at all** (no gap stubs go there).

### Gap-stub shape and the nine concrete stubs

Each stub follows the existing deferred-stub shape (`name`, `description`, `difficulty: simple`, `concepts`, `source`, `source_files`) **plus two provenance/trigger comments and no `prompt`/`acceptance`**:
- `source: agent-skills` (distinguishes these from `dev.wordpress.org` records).
- `source_files`: the skill's GitHub URL, `https://github.com/WordPress/agent-skills/tree/trunk/skills/<skill>`.
- An `# agent-skills: <skill>` provenance comment (identifies the source skill).
- A `# Gap (agent-skills/<skill>): <sub-class>` trigger marker, where `<sub-class>` ∈ `buildable-plugin` | `review-workflow` | `harness-wall`, followed by the one-line reason and (for review-workflow/harness-wall) the shape-concern note.

Stub names use a new `<topic>-*` kebab name that does not collide with any existing scenario or catalog record. The nine stubs (concrete content for phase 4 to transcribe):

```yaml
# === Agent-Skills Gaps ===
#
# Review-triggerable stubs for agent-skills topics with NO scenario and NO
# prior catalog stub. Each maps to one WordPress/agent-skills skill (the
# `# agent-skills:` comment) and carries a `# Gap (...)` trigger marker whose
# sub-class records why/how it could become a scenario:
#   buildable-plugin = fits "build a plugin, grade the code" shape.
#   review-workflow  = audit/classify/verify task; may NOT fit the build-a-plugin shape.
#   harness-wall     = no PHP-plugin deliverable the current rubrics can grade.
# Stubs carry NO prompt/acceptance (not implemented scenarios).

- name: abilities-api-register
  description: Register an Ability via the Abilities API (PHP register_ability) and expose it over REST.
  difficulty: simple
  concepts: [register_ability, abilities-api, rest-exposure]
  source: agent-skills
  source_files:
    - https://github.com/WordPress/agent-skills/tree/trunk/skills/wp-abilities-api
  # agent-skills: wp-abilities-api
  # Gap (agent-skills/wp-abilities-api): buildable-plugin — WP 6.9+ PHP register_ability() + REST exposure; most scenario-shaped gap, fits the plugin scaffold.

- name: performance-object-cache
  description: Optimize a plugin for performance — autoloaded options, object cache, query optimization.
  difficulty: simple
  concepts: [object-cache, autoloaded-options, query-optimization]
  source: agent-skills
  source_files:
    - https://github.com/WordPress/agent-skills/tree/trunk/skills/wp-performance
  # agent-skills: wp-performance
  # Gap (agent-skills/wp-performance): buildable-plugin — performance-as-a-topic is uncovered; primitives partially overlap cron/transients/http but profiling/caching is not graded today.

- name: abilities-audit-rest-surface
  description: Audit a plugin's REST surface for Abilities API registrations and report findings.
  difficulty: simple
  concepts: [abilities-api, rest-audit, static-analysis]
  source: agent-skills
  source_files:
    - https://github.com/WordPress/agent-skills/tree/trunk/skills/wp-abilities-audit
  # agent-skills: wp-abilities-audit
  # Gap (agent-skills/wp-abilities-audit): review-workflow — audits an existing REST surface; produces a report, not a plugin. May not fit the build-a-plugin-and-grade shape.

- name: abilities-verify-callbacks
  description: Verify Abilities API registrations and their callback behavior.
  difficulty: simple
  concepts: [abilities-api, verification, callback-behavior]
  source: agent-skills
  source_files:
    - https://github.com/WordPress/agent-skills/tree/trunk/skills/wp-abilities-verify
  # agent-skills: wp-abilities-verify
  # Gap (agent-skills/wp-abilities-verify): review-workflow — verifies registrations/callbacks; produces a verification result, not a plugin. May not fit the build-a-plugin-and-grade shape.

- name: phpstan-baseline
  description: Configure and run PHPStan static analysis on a plugin and fix the reported type errors.
  difficulty: simple
  concepts: [phpstan, static-analysis, phpstan.neon]
  source: agent-skills
  source_files:
    - https://github.com/WordPress/agent-skills/tree/trunk/skills/wp-phpstan
  # agent-skills: wp-phpstan
  # Gap (agent-skills/wp-phpstan): harness-wall — produces a phpstan.neon config + analysis, not a plugin deliverable the current rubrics grade. Distinct from our Coding Standards area (WPCS style/PHPDoc != PHPStan type analysis); no WPCS agent-skill exists.

- name: wordpress-router-classify
  description: Classify a WordPress codebase and route it to the correct workflow/skill.
  difficulty: simple
  concepts: [routing, classification, orchestration]
  source: agent-skills
  source_files:
    - https://github.com/WordPress/agent-skills/tree/trunk/skills/wordpress-router
  # agent-skills: wordpress-router
  # Gap (agent-skills/wordpress-router): review-workflow — meta/orchestration skill; no PHP plugin deliverable. May not fit the build-a-plugin-and-grade shape.

- name: project-triage-report
  description: Deterministically inspect a WordPress repo and produce a structured triage report.
  difficulty: simple
  concepts: [triage, repo-inspection, structured-report]
  source: agent-skills
  source_files:
    - https://github.com/WordPress/agent-skills/tree/trunk/skills/wp-project-triage
  # agent-skills: wp-project-triage
  # Gap (agent-skills/wp-project-triage): review-workflow — meta/orchestration; produces a report, not a plugin. May not fit the build-a-plugin-and-grade shape.

- name: plugin-directory-review
  description: Review a plugin against the WordPress.org Plugin Directory guidelines (GPL, naming, trademarks, freemium).
  difficulty: simple
  concepts: [plugin-directory-guidelines, compliance-review, gpl]
  source: agent-skills
  source_files:
    - https://github.com/WordPress/agent-skills/tree/trunk/skills/wp-plugin-directory-guidelines
  # agent-skills: wp-plugin-directory-guidelines
  # Gap (agent-skills/wp-plugin-directory-guidelines): review-workflow — reviews a plugin against 18 directory rules; lint-style, produces findings rather than a plugin.

- name: wpds-component-ui
  description: Build a UI with WordPress Design System (WPDS) components.
  difficulty: simple
  concepts: [wpds, design-system, react-components]
  source: agent-skills
  source_files:
    - https://github.com/WordPress/agent-skills/tree/trunk/skills/wpds
  # agent-skills: wpds
  # Gap (agent-skills/wpds): harness-wall — JS/React component UI; no PHP-plugin deliverable the current rubrics grade.
```

### README change

Two passages plus a dependency note.

**Lines ~31-38 (the "bare directory names" + catalog passage).** Update the L31 sentence from "Scenario names are the bare directory names under `eval/scenarios/` (e.g. `counter`, `cpt-register`)" to describe the **nested per-topic layout** — scenarios now live at `eval/scenarios/<topic>/<scenario>/` (e.g. `interactivity-api/counter`, `plugins/cpt-register`). Update the L33 example from `npx skillsmith counter` to the nested form `npx skillsmith plugins/cpt-register`, with a note that this requires the upstream Skillsmith nested-discovery change (see below). Keep the L36-38 catalog note, adjusting it to state that the two leading-underscore catalogs (`_candidates.yaml`, `_wp-dev-candidates.yaml`) **remain at the `eval/scenarios/` root** (they are not moved into topic folders), and add a one-line mention that `_wp-dev-candidates.yaml` now carries an `# === Agent-Skills Gaps ===` section recording uncovered agent-skills topics.

**Lines ~60-66 (Agent cap R12 invocation).** Update the `npx skillsmith <one-scenario-dir>` example to the nested `<topic>/<scenario>` addressing form (e.g. `npx skillsmith plugins/cpt-register`) and note that a single nested scenario path is still the capped unit of work.

**New dependency paragraph (in or near the Running-evals section).** Document the **Skillsmith nested-discovery dependency** so the owner's upstream issue is actionable. State precisely that the pinned `@automattic/skillsmith` (`6bd90c34…`) needs two changes before nested scenarios are discoverable/runnable:
- **(A) Recursive discovery** — `src/scenarios/enumerate.ts` must walk subdirectories of `paths.scenarios` (not just immediate children) to find `scenario.yaml` at any depth; a topic folder like `plugins/` has no `plugins/scenario.yaml` and is currently skipped without descending.
- **(B) Relative `dirName`** — `dirName` must be the path **relative to `scenariosRoot`** (e.g. `plugins/cpt-register`, not `cpt-register`) so dirNames stay unique across topic folders and CLI selection can address a nested scenario.
- Note the **temporary state**: until (A)+(B) ship upstream, nested scenarios are invisible to `npx skillsmith` (the suite is reorganized but not runnable via Skillsmith); this is accepted per the owner's "do it regardless" decision. The local harness (`verify-e2e.ts`, e2e import depth) is already updated so the suite is functional the moment Skillsmith is fixed.

### Data flow (unchanged in shape, paths nest one level deeper)

`scenario.yaml` (discovery + judge input) → Skillsmith discovers each scenario and supplies `dirName` → scaffold writes `plugin-<name>-<agentId>` → testing agent edits the plugin → judge grades code against `acceptance` → for e2e scenarios, `verify-e2e.ts` boots `wp-env`, runs the spec (located via `join("eval","scenarios",dirName,...)`), and maps failures back per (scenario, agent) using `scenarioDirOf` → `dirToName`. The only flow change is that `dirName` becomes a relative path (`<topic>/<scenario>`) and both the spec-path join (already correct) and `scenarioDirOf` (this review's fix) operate on that relative form. The catalog feeds nothing in this flow — it is a human/future-review planning artifact.

## Coverage Map (all 17 agent-skills topics)

Recorded here (durable artifact home; also in `1-spec/spec-research.md`). No new skill file is created.

| agent-skills topic | Status | Our coverage / rationale |
|---|---|---|
| wp-interactivity-api | **Covered** | `interactivity-api/` (11 scenarios) — strongest coverage. |
| wp-plugin-development | **Covered** | `plugins/` (9 scenarios) + `common-apis/` data storage. Partial on security (nonces/caps) and packaging. |
| wp-block-development | **Covered** | `block-editor/` (5 scenarios). |
| wp-rest-api | **Covered** | `rest-api/` (4 scenarios) + REST-adjacent Plugins scenarios (`post-meta-rest`, `settings-register`, `taxonomy-register` via `show_in_rest`). |
| wp-block-themes | **Covered (partial)** | `themes/` (3 scenarios) cover the classic-theme/plugin surface (enqueue, nav menus, sidebars) but NOT the block-theme core (`theme.json`, templates, Site Editor). The `theme-json-custom-color-palette` stub already records that as a catalog deferral (harness wall). Coverage is real but incomplete. |
| blueprint | **Deferred-area** | Playground area; deferred via `playground-blueprint-plugin-load` stub — off-domain docs + non-plugin JSON artifact (harness wall). |
| wp-playground | **Deferred-area** | Same Playground deferral as blueprint. |
| wp-wpcli-and-ops | **Deferred-area** | WP-CLI Commands deferral (`wp-cli-custom-command` stub — off-domain docs) + Advanced Administration ops deferral (harness wall + overlap). |
| wp-abilities-api | **Gap** | No scenario, no prior stub → new stub `abilities-api-register` (buildable-plugin). |
| wp-abilities-audit | **Gap** | New stub `abilities-audit-rest-surface` (review-workflow). |
| wp-abilities-verify | **Gap** | New stub `abilities-verify-callbacks` (review-workflow). |
| wp-performance | **Gap** | New stub `performance-object-cache` (buildable-plugin). |
| wp-phpstan | **Gap** | New stub `phpstan-baseline` (harness-wall). Cross-terminology: our "Coding Standards" area is **WPCS style + PHPDoc**, distinct from PHPStan type analysis; neither `coding-standards-php` nor `coding-standards-inline-docs` covers PHPStan, and agent-skills has no WPCS skill, so our Coding Standards area has no agent-skills counterpart. |
| wordpress-router | **Gap** | New stub `wordpress-router-classify` (review-workflow — meta/orchestration). |
| wp-project-triage | **Gap** | New stub `project-triage-report` (review-workflow — meta/orchestration). |
| wp-plugin-directory-guidelines | **Gap** | New stub `plugin-directory-review` (review-workflow — compliance/lint). |
| wpds | **Gap** | New stub `wpds-component-ui` (harness-wall — JS/React UI). |

**Cross-terminology, recorded explicitly:** (1) Coding Standards (WPCS/PHPDoc) ≠ `wp-phpstan` (static type analysis) — `wp-phpstan` is a genuine gap and our Coding Standards area has no agent-skills counterpart. (2) Themes (classic-theme/plugin surface) ≠ `wp-block-themes` block-theme core (`theme.json`/Site Editor) — the classic coverage is real but partial against the agent-skills topic.

## Key Decisions

### Decision: Topic-only taxonomy (no skill-level split), seven folders, scenarios nested at depth-2

- **Choice:** Seven topic folders directly under `eval/scenarios/`; iAPI is one topic folder like any other; no `wordpress-development/` vs `interactivity-api/` *skill* parent. Every scenario at `eval/scenarios/<topic>/<scenario>/`.
- **Alternatives:** Skill-first then topic (`<skill>/<topic>/<scenario>/`) — rejected: deeper nesting for no benefit, and the skill distinction already lives in the two catalogs + each scenario's `skills:` field. Keep the flat pseudo-folder (area-prefixed) layout — rejected: the owner explicitly asked for real folders, overriding review-2.
- **Trade-offs:** Real folders give navigable grouping but cost the temporary Skillsmith-discovery break (accepted). Topic-only keeps depth minimal (one extra `../` for e2e imports) while still grouping cleanly.
- **Traces to:** Requirements 1, 2; Acceptance Criteria 21, 24.

### Decision: Keep the `<area>-*` directory-name prefixes; change locations only

- **Choice:** Do not drop the now-redundant prefixes (e.g. `block-editor/block-editor-dynamic-block`). No `scenario.yaml` `name`, plugin slug, catalog record `name`, or e2e activation key changes.
- **Alternatives:** Drop the 17 redundant prefixes (`block-editor/dynamic-block`) — rejected: the `name` field is the plugin-slug fragment used in `plugin-<name>-<agentId>` and in `requestUtils.activatePlugin`; dropping prefixes would churn `scenario.yaml` names, plugin slugs, catalog names, and e2e activation keys for a cosmetic win the folder already delivers, and could break existing run records.
- **Trade-offs:** Cosmetic redundancy (`block-editor/block-editor-*`) is accepted in exchange for zero harness churn and slug stability. A future dedicated rename pass can drop prefixes after Skillsmith is updated.
- **Traces to:** Requirement 3; Acceptance Criterion 21.

### Decision: Move with `git mv`; preserve all `scenario.yaml` content verbatim; do NOT fix the counter mismatch

- **Choice:** `git mv` each directory; touch no `scenario.yaml` byte. The pre-existing `counter/` directory ↔ `name: counter-block` mismatch is preserved, not fixed.
- **Alternatives:** Recreate directories and copy files — rejected: loses git rename detection and risks content drift. Fix the counter mismatch in passing — rejected: out of scope; it would require a CLI-invocation change and a catalog update that could break existing run records.
- **Trade-offs:** `git mv` keeps the move auditable as pure renames and guarantees no content drift (verifiable by `git diff -M`). Carrying the counter mismatch forward is a known, deliberately-deferred wart.
- **Traces to:** Requirements 4, 5; Acceptance Criteria 21, 24.

### Decision: Update e2e imports with one extra `../` (27 files); no other import change

- **Choice:** Change the single `"../../utils/wp-cli.mjs"` import to `"../../../utils/wp-cli.mjs"` in each of the 27 e2e specs.
- **Alternatives:** Introduce a path alias / move `wp-cli.mjs` — rejected: unnecessary churn; the relative fix is mechanical and local. Leave imports unchanged — rejected: they would resolve to a nonexistent path and break collection.
- **Trade-offs:** A trivial per-file edit; grep confirms `wp-cli.mjs` is the sole relative import in every spec, so there is no hidden second import to miss.
- **Traces to:** Requirement 6; Acceptance Criterion 22.

### Decision: Update `scenarioDirOf` to return the full relative path; leave the line-74 join and Playwright config unchanged

- **Choice:** Reconstruct the full path from `eval/scenarios/` to the scenario directory in `scenarioDirOf` so it matches Skillsmith's relative `dirName`. Keep `join("eval","scenarios",dirName,...)` (line 74) and `playwright.config.ts` as-is.
- **Alternatives:** Change the `dirToName` map keys to basenames instead — rejected: basenames are not unique across topic folders (collisions break attribution), and Skillsmith's relative dirName is the correct canonical key. Re-key everything off `scenario.name` — rejected: larger change; the dir-based attribution is the existing design and only `scenarioDirOf` is wrong for nested paths.
- **Trade-offs:** The targeted `scenarioDirOf` fix keeps the flat case working unchanged while making the nested case correct, with the smallest possible surface. Without it, e2e failures on nested scenarios are silently un-attributed — a correctness hole, not a crash, which is the dangerous kind.
- **Traces to:** Requirements 8, 9; Acceptance Criterion 23.

### Decision: Document the Skillsmith dependency (recursive discovery + relative dirName); do not patch Skillsmith here

- **Choice:** Specify changes (A) recursive discovery and (B) relative `dirName` precisely in this design doc and the README, for the owner's upstream issue. Do not vendor or patch Skillsmith.
- **Alternatives:** Vendor/fork Skillsmith locally — rejected: out of scope; the owner owns the upstream change and accepts temporary invisibility. Fall back to pseudo-folders to stay discoverable — rejected: the owner explicitly forbade silently falling back.
- **Trade-offs:** Temporary Skillsmith invisibility is accepted in exchange for a clean real-folder structure and an actionable upstream issue. All local harness work is done now so the suite is immediately functional once upstream lands.
- **Traces to:** Requirements 10, 25; Acceptance Criterion 25.

### Decision: Coverage map recorded in artifacts; nine gap stubs in `_wp-dev-candidates.yaml`; no new scenarios, no new catalog

- **Choice:** Record the 17-topic coverage map in the design doc + spec research; append nine gap stubs (one per genuine gap) to `_wp-dev-candidates.yaml` under `# === Agent-Skills Gaps ===`, each with `source: agent-skills`, the skill's GitHub `source_files`, an `# agent-skills:` provenance comment, and a `# Gap (...): <sub-class>` trigger marker; no `prompt`/`acceptance`. Do not modify `_candidates.yaml`.
- **Alternatives:** Author new scenarios for the gaps — rejected: the intent ships no new scenarios this review. Create a new catalog file or a new skill file for the gaps — rejected: out of scope; the gaps belong in the existing wp-dev catalog. Put stubs in the iAPI catalog — rejected: wrong catalog.
- **Trade-offs:** Stubs make each gap independently review-triggerable (mirroring how existing area stubs seeded reviews 1–9) at zero scenario-authoring cost. The sub-classification (buildable-plugin / review-workflow / harness-wall) tells a future review which gaps are even scenario-shaped.
- **Traces to:** Requirements 14, 15, 16, 17, 18, 19, 20; Acceptance Criteria 14, 15, 16.

### Decision: Light catalog area-header cross-references; do not churn records

- **Choice:** Add a `# folder: eval/scenarios/<topic>/` comment to each area header that has a matching folder; change no record `name` or body.
- **Alternatives:** Reorder/regroup records to mirror folders — rejected: needless churn and diff noise; record `name`s are the stable identity and must not move. Leave the catalog untouched — rejected: the headers would no longer reflect where scenarios live.
- **Trade-offs:** Comment-only edits keep the catalog diff minimal and reviewable while documenting the new layout.
- **Traces to:** Requirements 11, 12; Acceptance Criterion 24.

### Decision: README documents the nested layout, nested invocation, and the Skillsmith dependency

- **Choice:** Update L31/L33 to the nested layout + nested `npx skillsmith <topic>/<scenario>` example; update L36-38 to note catalogs stay at root and the new gaps section; update L60-66 (R12) to the nested invocation; add a dependency paragraph spelling out (A)+(B) and the temporary-invisibility state.
- **Alternatives:** Defer doc changes — rejected: the README's flat-layout claims would be wrong and the owner's upstream issue would be undocumented.
- **Trade-offs:** Slightly larger doc diff, but the README is the first place a contributor looks and the owner's issue needs an actionable reference.
- **Traces to:** Requirements 10, 13; Acceptance Criterion 25.

## Dependencies

No new runtime dependency and no new `eval/utils/` helper.

- **Internal:** `eval/utils/verify-e2e.ts` (the `scenarioDirOf` change), `eval/utils/wp-cli.mjs` (`deactivateAllPlugins`, unchanged but re-pathed by importers), `eval/utils/scaffold-plugin.ts` (unaffected — keyed off `scenario.name`), `playwright.config.ts` (unchanged), the two catalog files.
- **External (already present):** `@automattic/skillsmith` (discovery/scaffold/judge) — **the load-bearing external dependency**: nested discovery needs upstream changes (A) recursive discovery and (B) relative `dirName`; documented for the owner, not made here. `@wordpress/e2e-test-utils-playwright` and `@playwright/test` (collect the e2e specs via the depth-agnostic `**/` glob). `@wordpress/env` (`wp-env` runtime). All unchanged.
- **External reference (Part 2):** `WordPress/agent-skills` (the 17 SKILL.md topics) — the source of truth for the coverage map and the gap stubs' `source_files` GitHub URLs. Read-only; not a runtime dependency.

## Failure Modes and Observability

- **Nested scenario invisible to Skillsmith (expected, accepted):** the pinned Skillsmith's non-recursive discovery skips topic folders, so nested scenarios are not discoverable/runnable via `npx skillsmith` until upstream (A)+(B) land. This is the accepted temporary state, documented in the README and this doc. Detected by: `npx skillsmith <topic>/<scenario>` finding nothing until the pin is bumped.
- **e2e import resolves to a nonexistent path (guarded):** if a spec's `wp-cli.mjs` import is not re-pathed to `"../../../utils/wp-cli.mjs"`, Playwright fails to load that spec at collection time (visible, loud — a collection error in the runner output). Mitigation: all 27 specs get the one-`../` edit; grep confirms there is exactly one relative import per spec.
- **Silent e2e failure attribution (the dangerous one — guarded by the `scenarioDirOf` fix):** if `scenarioDirOf` kept returning only the basename, a nested spec's failure would miss the `dirToName` lookup and be **silently dropped** (no `VerificationFailure` emitted) — a real e2e failure reported as a pass. Mitigation: `scenarioDirOf` returns the full relative path matching Skillsmith's relative `dirName`. This is the primary correctness risk of the whole review.
- **Playwright not collecting nested specs (not a real risk):** the `**/e2e.spec.mjs` glob collects at any depth; confirmed against the config. If a future change narrowed the glob, collection would silently drop specs — out of scope here.
- **Content drift during the move (guarded):** using `git mv` (not copy/delete) and verifying with `git diff -M --stat` ensures every `scenario.yaml` is a pure rename with no content change. A non-rename diff on a `scenario.yaml` is the detection signal.
- **YAML parse break in the catalog (guarded):** the new gaps section and header comments must keep `_wp-dev-candidates.yaml` valid YAML. Detection: parse the file after editing; comment-only header edits and append-only stub records minimize risk.
- **Catalog churn beyond intent (correctness invariant):** only area-header comments + the new gaps section change; no existing record `name`/body and no byte of `_candidates.yaml` may change. Phase 4/5 must diff-check this.
- **Observability:** Playwright collection/run errors surface in the runner output and the JSON report; `verify-e2e.ts` parses that report into per-(scenario, agent) `VerificationFailure`s; `git diff -M` makes the moves auditable as renames; YAML validity is checkable by a parse.

## Risks and Open Questions

- **Temporary Skillsmith invisibility (accepted, owner-owned).** After the moves land, nested scenarios are not runnable via `npx skillsmith` until upstream changes (A) recursive discovery + (B) relative `dirName` ship. The owner accepts this and will file the upstream issue; the README + this doc make it actionable. Not a blocker.
- **`scenarioDirOf` correctness (the load-bearing harness risk).** The fix must reconstruct the full relative path so it matches Skillsmith's relative `dirName`; getting this wrong reintroduces silent failure attribution. Because Skillsmith's runtime behavior cannot be exercised locally (no installed `node_modules`), phase 4 should make `scenarioDirOf` provably correct for both the flat dirName form (today) and the relative form (post-upstream) and cover it with a unit-level check if feasible. Flagged for phase 4, not a design blocker.
- **Relative-dirName form must match exactly.** Skillsmith change (B) is expected to produce a forward-slash relative path (`plugins/cpt-register`). `scenarioDirOf` must emit the same separator/casing. If the owner's upstream implementation chooses a different `dirName` form (e.g. OS-native separators or basename-suffix matching), `verify-e2e.ts` must be reconciled to it. Recorded as a coordination point with the upstream change.
- **Verbatim preservation (must-hold).** Every `scenario.yaml` (and every existing catalog record `name`/body, and all of `_candidates.yaml`) is byte-unchanged except the documented edits. Phase 4/5 must verify via `git diff -M`.
- **Gap-stub `source_files` URL form (phase-4 latitude).** The stubs cite `https://github.com/WordPress/agent-skills/tree/trunk/skills/<skill>`. Phase 4 may point at the `SKILL.md` file path within the skill instead if preferred for precision, as long as `source: agent-skills` and the `# agent-skills:`/`# Gap (...)` markers are present and consistent.
- **Counter mismatch carried forward (known, deferred).** `counter/` keeps `name: counter-block`; not fixed here (out of scope). Recorded so phase 4 does not "tidy" it.
- **Verification approach (phase-4 confirmation):** git detects all 38 moves as renames (`git diff -M`); Playwright collects all 27 e2e specs from their nested paths; `_wp-dev-candidates.yaml` parses as valid YAML with the nine new stubs and updated headers; no `scenario.yaml` content drifts; `_candidates.yaml` and `skills/` are byte-untouched. Skillsmith discovery is verified by reasoning from the pinned source (not run locally).
