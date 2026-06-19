# Spec Research

## Rough Idea

**Review-10: Organize scenarios into real folders + agent-skills coverage map**

Two parts:

1. **Part 1 — Real folders.** Move every scenario into a real per-topic subdirectory under `eval/scenarios/`. Update the harness, catalogs, and docs. Document the precise Skillsmith nested-discovery dependency so the owner can open an upstream issue.

2. **Part 2 — Coverage map.** Compare our scenarios against the 17 agent-skills topics (`blueprint`, `wordpress-router`, `wp-abilities-api`, `wp-abilities-audit`, `wp-abilities-verify`, `wp-block-development`, `wp-block-themes`, `wp-interactivity-api`, `wp-performance`, `wp-phpstan`, `wp-playground`, `wp-plugin-development`, `wp-plugin-directory-guidelines`, `wp-project-triage`, `wp-rest-api`, `wp-wpcli-and-ops`, `wpds`). Record the coverage status (covered / deferred-area / gap) and produce review-triggerable gap stubs in the catalog — no new scenarios.

**Owner decisions (settled, not re-litigated):**
- Do real folders even if Skillsmith discovery breaks; owner opens upstream issue.
- Scenario `scenario.yaml` prompt/acceptance preserved verbatim.
- `skills/` directory untouched.
- Part 2 = coverage map + review-triggerable gap stubs only, no new scenarios.

## Q&A

### Q1: What is the complete scenario inventory under eval/scenarios/?

For each scenario: directory name, `name` field, `skills:` list, and whether it has an e2e.spec.mjs.

**A:** 38 scenario directories total (confirmed by direct filesystem enumeration). All 38 carry `skills: [wordpress-development]` — the iAPI vs. wp-dev distinction lives **only in the two catalogs**, not in scenario.yaml `skills:` fields. 27 have e2e.spec.mjs, 11 do not.

One pre-existing name/dir mismatch: `counter/` directory has `scenario.yaml` `name: counter-block`. All 37 others have dir == name.

Three scenarios are **not in either catalog** (predating the catalog system): `filter-body-class`, `shortcode-with-attr`, `rest-custom-endpoint`. (`cpt-register` appears only in a deferred comment in `_wp-dev-candidates.yaml`, not as a full record.)

Complete grouping (confirmed, sums to 38):

| Topic folder | Scenarios (dir names) | e2e |
|---|---|---|
| `interactivity-api/` | counter, independent-counters, shared-state, derived-double, config-fetch, async-fetch, fruit-list-each, focus-trap-menu, toggle-visibility, paginated-list, minimal-scaffold | 11/11 |
| `plugins/` | cpt-register, taxonomy-register, post-meta-rest, settings-register, cron-event, i18n-textdomain, admin-menu-page, filter-body-class, shortcode-with-attr | 5/9 |
| `block-editor/` | block-editor-dynamic-block, block-editor-block-supports, block-editor-block-styles, block-editor-block-filters, block-editor-block-bindings | 4/5 |
| `rest-api/` | rest-api-route-validation, rest-api-permission-check, rest-api-custom-field-on-post, rest-custom-endpoint | 4/4 |
| `themes/` | themes-enqueue-assets, themes-nav-menu-location, themes-sidebar-widget-area | 1/3 |
| `common-apis/` | common-apis-options, common-apis-transients, common-apis-rewrite-rule, common-apis-http-request | 1/4 |
| `coding-standards/` | coding-standards-php, coding-standards-inline-docs | 0/2 |

**Reasoning:** Direct filesystem + scenario.yaml parsing; cross-checked against both catalog files.

**Sources:** `eval/scenarios/*/scenario.yaml`, `eval/scenarios/_candidates.yaml`, `eval/scenarios/_wp-dev-candidates.yaml`

### Q2: How does verify-e2e.ts's dirName map work with nested paths, and what docs describe the flat layout?

**A:** Researched from pinned Skillsmith commit `6bd90c3` (`src/scenarios/enumerate.ts`).

**Skillsmith discovery is non-recursive (confirmed):** `readdirSync(scenariosRoot)` lists immediate children only; each child must have `scenario.yaml` directly inside it. A topic folder `plugins/` has no `plugins/scenario.yaml` — it is skipped entirely without descending. Nested scenarios are **invisible** to the pinned Skillsmith.

**dirName is always basename (confirmed):** `out.push({ scenario, dirName: entry })` — `entry` is the immediate child name (e.g. `cpt-register`), never a relative path (e.g. `plugins/cpt-register`).

**Two Skillsmith changes required (for owner's upstream issue):**
- **(A) Recursive discovery:** Walk subdirectories of `paths.scenarios` to find `scenario.yaml` at any depth.
- **(B) Relative dirName:** Set `dirName` to the path relative to `scenariosRoot` (e.g. `plugins/cpt-register`) so dirNames stay unique across topic folders and CLI selection addresses nested scenarios.

**verify-e2e.ts local harness change also required:** Line 74 `join("eval","scenarios",dirName,"e2e.spec.mjs")` resolves correctly once Skillsmith provides relative dirNames. BUT `scenarioDirOf` (~line 225) extracts the **immediate parent segment** from Playwright's reported spec path (e.g. `plugins/cpt-register/e2e.spec.mjs` → `cpt-register`), which would mismatch the relative dirName `plugins/cpt-register` in the `dirToName` map. E2e failures would silently go un-attributed. **`scenarioDirOf` must be updated** to reconstruct the full relative path from `eval/scenarios/` to match the Skillsmith-supplied relative dirName. This is a local harness change this review must make.

**README.md flat-layout references (specific lines):**
- L31: "Scenario names are the bare directory names under `eval/scenarios/` (e.g. `counter`, `cpt-register`)."
- L33: `npx skillsmith counter` example.
- L36–38: Description of leading-underscore catalog files.
- L60–66 (Agent cap R12): `npx skillsmith <one-scenario-dir>` form.

**Sources:** Skillsmith source `src/scenarios/enumerate.ts` at pin `6bd90c3`, `eval/utils/verify-e2e.ts`, `playwright.config.ts`, `README.md`

### Q3: Agent-skills coverage verification — all 17 skills

**A:** Verified by fetching all 17 agent-skills SKILL.md files from `WordPress/agent-skills/trunk/skills/<name>/SKILL.md`.

**Covered (5):**
1. **wp-interactivity-api** → Our Interactivity API (11 scenarios). Strongest coverage.
2. **wp-plugin-development** → Our Plugins (9 scenarios) + common-apis (data storage). Partial on security (nonces/caps) and packaging.
3. **wp-block-development** → Our Block Editor (5 scenarios).
4. **wp-rest-api** → Our REST API (4 scenarios) + post-meta-rest, settings-register, taxonomy-register (show_in_rest).
5. **wp-block-themes** → **Partially.** Our Themes scenarios cover classic-theme/plugin surface (enqueue, nav menus, sidebars) but NOT the block-theme core (`theme.json`, templates, Site Editor). The `theme-json-custom-color-palette` stub in `_wp-dev-candidates.yaml` records this as a catalog deferral (harness wall). Coverage is real but incomplete.

**Deferred-area (3) — explicit catalog deferrals with recorded reasons:**
6. **blueprint** → Our Playground deferral (`playground-blueprint-plugin-load` stub): off-domain docs + non-plugin JSON artifact harness wall.
7. **wp-playground** → Same Playground deferral.
8. **wp-wpcli-and-ops** → Our WP-CLI Commands deferral (`wp-cli-custom-command` stub: off-domain docs) + Advanced Administration ops deferral (harness wall + overlap).

**Gap (9) — no scenario and no catalog stub today:**
9. **wp-abilities-api** — Abilities API registration (WP 6.9+: PHP `register_ability()`, REST exposure). Most scenario-shaped of the gaps; could fit the plugin scaffold.
10. **wp-abilities-audit** — Audit a plugin's REST surface for Abilities registrations. A review/workflow skill — may not fit "build a plugin and grade" shape.
11. **wp-abilities-verify** — Verify Abilities registrations and callback behavior. Same review/workflow shape concern.
12. **wp-performance** — Performance profiling, query optimization, autoloaded options, object caching. Some primitives overlap our cron/transients/http scenarios but performance-as-topic is uncovered.
13. **wp-phpstan** — Configure/run/fix PHPStan static analysis. **Cross-terminology:** our "Coding Standards" area (WPCS style + PHPDoc) is adjacent but distinct — WPCS/phpcs ≠ PHPStan type analysis. Neither `coding-standards-php` nor `coding-standards-inline-docs` covers PHPStan. Also: agent-skills has no direct "WPCS coding standards" skill, so our Coding Standards area has no agent-skills counterpart at all.
14. **wordpress-router** — Classify a WP codebase and route to the correct workflow/skill. A meta/orchestration skill — no PHP plugin deliverable; arguable out of scope for our scenario shape.
15. **wp-project-triage** — Deterministic inspection of a WP repo, producing a structured report. Same meta/orchestration class as `wordpress-router`.
16. **wp-plugin-directory-guidelines** — Review plugins against 18 WordPress.org Plugin Directory rules (GPL, naming, trademarks, freemium). A review/compliance skill; could map to a lint-style scenario.
17. **wpds** — Build UIs with WordPress Design System (WPDS) components. Likely harness-wall (JS/React component UI; no PHP plugin deliverable graded by existing rubrics).

**Gap sub-classification:**
- **Buildable-plugin gaps** (fit our scenario shape, graded against plugin code): `wp-abilities-api`, `wp-performance` (partially).
- **Review/verify-workflow gaps** (audit/classify/verify, don't produce a plugin): `wp-abilities-audit`, `wp-abilities-verify`, `wordpress-router`, `wp-project-triage`, `wp-plugin-directory-guidelines`.
- **Harness-wall gaps** (no PHP-plugin deliverable to grade): `wpds`, `wp-phpstan` (produces phpstan.neon config, not a plugin), core of `wp-block-themes` (theme.json, already cataloged as deferred).

**Sources:** `WordPress/agent-skills/trunk/skills/<name>/SKILL.md` (all 17 fetched), `eval/scenarios/_wp-dev-candidates.yaml`

## Research

### Harness mechanics (directly researched)

**e2e import depth:** All 27 e2e scenarios use `import { deactivateAllPlugins } from "../../utils/wp-cli.mjs"` — a depth-2 relative path from `eval/scenarios/<name>/e2e.spec.mjs` to `eval/utils/wp-cli.mjs`. After moving to `eval/scenarios/<topic>/<name>/`, this must become `"../../../utils/wp-cli.mjs"` (depth-3, one extra `../`). This affects every moved e2e scenario.

**Playwright discovery:** `playwright.config.ts` uses `testDir: "./eval/scenarios"`, `testMatch: "**/e2e.spec.mjs"`. The `**/` glob collects at any nesting depth — nested folders do NOT break Playwright e2e collection.

**skillsmith.config.ts:** No explicit `scenariosDir` or discovery configuration. Discovery is internal to `@automattic/skillsmith` (node_modules not installed at this worktree). The config's `afterAllScenarios` hook receives the `scenarios` array from Skillsmith, including `dirName` per scenario.

### Naming analysis (prefix vs. drop)

17 of 38 scenarios carry an `<area>-*` prefix that would become redundant after foldering:
- `block-editor-*` ×5 (e.g. `block-editor/block-editor-dynamic-block`)
- `common-apis-*` ×4 (e.g. `common-apis/common-apis-options`)
- `coding-standards-*` ×2 (e.g. `coding-standards/coding-standards-php`)
- `rest-api-*` ×3 (e.g. `rest-api/rest-api-route-validation`)
- `themes-*` ×3 (e.g. `themes/themes-enqueue-assets`)

The other 21 already have clean non-prefixed names (e.g. `plugins/cpt-register`, `interactivity-api/counter`).

**Decision: keep prefixes.** The `name` field in scenario.yaml is the plugin-slug fragment used in `plugin-<name>-${agentId}` and activated by `requestUtils.activatePlugin` in e2e specs. Dropping 17 prefixes would change scenario.yaml `name` fields, plugin slugs, catalog record names, and e2e activation keys — significant harness churn for a cosmetic improvement the folder already provides. The redundancy (e.g. `block-editor/block-editor-dynamic-block`) is a cosmetic cost outweighed by zero harness churn. A future review can drop prefixes in a dedicated rename pass after Skillsmith is updated and the suite has been exercised with the new layout.

### Coverage map summary

| agent-skills topic | Status | Our topic/scenarios |
|---|---|---|
| wp-interactivity-api | **Covered** | interactivity-api/ (11 scenarios) |
| wp-plugin-development | **Covered** | plugins/ (9 scenarios) |
| wp-block-development | **Covered** | block-editor/ (5 scenarios) |
| wp-rest-api | **Covered** | rest-api/ (4 scenarios) + REST-adjacent Plugins scenarios |
| wp-block-themes | **Covered (partial)** | themes/ (3 scenarios, classic surface only; block-theme core deferred) |
| blueprint | **Deferred-area** | Playground area (off-domain docs + harness wall) |
| wp-playground | **Deferred-area** | Playground area (same as blueprint) |
| wp-wpcli-and-ops | **Deferred-area** | WP-CLI + Advanced Admin areas (off-domain docs + harness wall) |
| wp-abilities-api | **Gap** | No scenario, no stub |
| wp-abilities-audit | **Gap** | No scenario, no stub (review/workflow shape) |
| wp-abilities-verify | **Gap** | No scenario, no stub (review/workflow shape) |
| wp-performance | **Gap** | No scenario, no stub |
| wp-phpstan | **Gap** | No scenario, no stub (adjacent: our Coding Standards = WPCS, not PHPStan) |
| wordpress-router | **Gap** | No scenario, no stub (meta/orchestration shape) |
| wp-project-triage | **Gap** | No scenario, no stub (meta/orchestration shape) |
| wp-plugin-directory-guidelines | **Gap** | No scenario, no stub |
| wpds | **Gap** | No scenario, no stub (harness wall: JS/React component UI) |

### Gap stub format design

The 9 gaps need review-triggerable catalog stubs. Pattern to follow: existing deferred stubs in `_wp-dev-candidates.yaml` (e.g. `playground-blueprint-plugin-load`, `wp-cli-custom-command`, `theme-json-custom-color-palette`) — each has `name`, `description`, `difficulty`, `concepts`, `source`, `source_files`, and a `# Deferred:` comment.

For gaps, the stub must:
- Use a `name` that fits the relevant catalog (wpcs-style gaps go in `_wp-dev-candidates.yaml`, iAPI-adjacent gaps also there unless a new catalog makes sense; no new catalog for this review)
- Carry an `# agent-skills: <skill-name>` provenance comment to identify the source skill
- Carry a `# Gap (agent-skills/<skill>):` marker comment as the trigger signal
- Include `source` + `source_files` pointing to the agent-skills repo (or developer.wordpress.org if applicable)
- No `prompt` or `acceptance` (these are stubs, not implemented scenarios)

All 9 gap stubs belong in `_wp-dev-candidates.yaml` under a new `# === Agent-Skills Gaps ===` section at the bottom. Each gap stub in that section becomes independently review-triggerable (the same way the `common-apis-http-request` stub triggered review-5's Common APIs work, or `block-editor-*` stubs triggered the Block Editor review).

## Consolidated Requirements

### Part 1 — Folder reorganization

#### A. Topic taxonomy and folder layout

1. **Seven top-level topic folders, topic-only (not skill-first).** Every scenario moves into one of seven new subdirectories under `eval/scenarios/`: `interactivity-api/`, `plugins/`, `block-editor/`, `rest-api/`, `themes/`, `common-apis/`, `coding-standards/`. There is no skill-level split (no `wordpress-development/` parent); the taxonomy is flat at depth-1 under `eval/scenarios/`. The iAPI/wp-dev distinction continues to live only in the two catalogs.

2. **Every scenario moves to its topic folder.** Each of the 38 existing scenario directories is relocated using `git mv eval/scenarios/<name>/ eval/scenarios/<topic>/<name>/`. No scenario is created, deleted, or merged. The mapping is:
   - `interactivity-api/`: counter, independent-counters, shared-state, derived-double, config-fetch, async-fetch, fruit-list-each, focus-trap-menu, toggle-visibility, paginated-list, minimal-scaffold
   - `plugins/`: cpt-register, taxonomy-register, post-meta-rest, settings-register, cron-event, i18n-textdomain, admin-menu-page, filter-body-class, shortcode-with-attr
   - `block-editor/`: block-editor-dynamic-block, block-editor-block-supports, block-editor-block-styles, block-editor-block-filters, block-editor-block-bindings
   - `rest-api/`: rest-api-route-validation, rest-api-permission-check, rest-api-custom-field-on-post, rest-custom-endpoint
   - `themes/`: themes-enqueue-assets, themes-nav-menu-location, themes-sidebar-widget-area
   - `common-apis/`: common-apis-options, common-apis-transients, common-apis-rewrite-rule, common-apis-http-request
   - `coding-standards/`: coding-standards-php, coding-standards-inline-docs

3. **Naming: prefixes kept.** Scenario directory names are not changed — only locations change. The `<area>-*` prefix is retained (e.g. `block-editor/block-editor-dynamic-block`). No `scenario.yaml` `name` field is changed (except as part of fixing the pre-existing `counter`/`counter-block` mismatch — see Req 5). No catalog record `name` is changed by the move.

4. **`scenario.yaml` prompt and acceptance preserved verbatim.** The move does not alter any `scenario.yaml` content except for fixing the pre-existing mismatch (Req 5). Prompt and acceptance text are unchanged in all 38 scenarios.

5. **Pre-existing `counter`/`counter-block` name mismatch: do not fix.** The `counter/` directory has `scenario.yaml` `name: counter-block`. This mismatch predates this review. This review does NOT change it — the move keeps the directory named `counter` and the `name` field as `counter-block`. Fixing this mismatch is a separate concern beyond the scope of the reorganization (it would require a Skillsmith CLI invocation change and a catalog update that could break existing run records).

#### B. e2e import depth

6. **All 27 moved e2e scenarios get their wp-cli.mjs import updated.** After moving from `eval/scenarios/<name>/e2e.spec.mjs` (depth-2) to `eval/scenarios/<topic>/<name>/e2e.spec.mjs` (depth-3), every e2e file's import of `deactivateAllPlugins` is changed from `"../../utils/wp-cli.mjs"` to `"../../../utils/wp-cli.mjs"`. This is a mechanical per-file edit; no other e2e content is changed.

7. **Playwright e2e collection continues to work without configuration changes.** `playwright.config.ts` uses `testDir: "./eval/scenarios"` and `testMatch: "**/e2e.spec.mjs"`. The `**/` glob collects at any nesting depth; no changes to `playwright.config.ts` are needed.

#### C. Harness update: verify-e2e.ts

8. **`verify-e2e.ts` `scenarioDirOf` is updated to return the full relative path from `eval/scenarios/`.** Currently `scenarioDirOf` extracts the immediate parent segment of a spec path (e.g. `cpt-register` from `plugins/cpt-register/e2e.spec.mjs`). After the move, Playwright will report spec paths relative to `testDir` as `plugins/cpt-register/e2e.spec.mjs`. The `dirToName` map keys must match these paths. `scenarioDirOf` must be updated to return the full relative path (e.g. `plugins/cpt-register`) so the `dirToName` lookup in the failure-attribution logic resolves correctly. Without this fix, e2e failures would be silently un-attributed.

9. **`verify-e2e.ts` line-74 spec-path construction continues to work once Skillsmith is updated.** The `join("eval", "scenarios", dirName, "e2e.spec.mjs")` line resolves correctly once Skillsmith supplies relative dirNames (e.g. `plugins/cpt-register`). No change to this line is needed as part of this review, but it is documented here as contingent on the Skillsmith upstream change (see Req 11).

#### D. Skillsmith dependency documentation

10. **The Skillsmith nested-discovery dependency is documented precisely in a visible artifact.** The review produces an explicit, actionable Skillsmith dependency note (in the design doc or a dedicated artifact) stating exactly what the pinned `@automattic/skillsmith` (`6bd90c34…`) must change so the owner can file an actionable upstream issue:
    - **(A) Recursive discovery:** The discovery loop in `src/scenarios/enumerate.ts` must walk subdirectories of `paths.scenarios` (not just immediate children) to find `scenario.yaml` at any depth.
    - **(B) Relative dirName:** `dirName` must be set to the path relative to `scenariosRoot` (e.g. `plugins/cpt-register`, not `cpt-register`) so dirNames are unique across topic folders and CLI selection can address nested scenarios.
    - **Effect on CLI invocation:** Once changed, `npx skillsmith plugins/cpt-register` (or equivalent) becomes the invocation form for nested scenarios. The owner should decide whether Skillsmith also accepts basename-suffix matching.
    - **Temporary state:** After this review commits the real folder structure but before the upstream Skillsmith change is merged, scenarios will be invisible to Skillsmith discovery (not runnable via `npx skillsmith`). The owner is aware and accepts this per the "do it regardless" decision.

#### E. Catalog updates

11. **Both catalog files move with the scenario directories (no content changes to catalog records).** `eval/scenarios/_candidates.yaml` and `eval/scenarios/_wp-dev-candidates.yaml` remain at their current paths (they are not inside a scenario dir). No catalog record `name` or content is changed by the move — that is constrained by Req 3 (names kept). The catalog files stay as immediate children of `eval/scenarios/` (leading underscore keeps them discovery-skipped).

12. **`_wp-dev-candidates.yaml` area section headers are updated to reference the new folder paths.** The `_wp-dev-candidates.yaml` section headers (e.g. `# === Area: Block Editor ===`) gain a note or cross-reference to the corresponding folder (e.g. `# folder: eval/scenarios/block-editor/`). This is a light, non-breaking documentation improvement inside the catalog comment.

#### F. README documentation updates

13. **`README.md` is updated to reflect nested folder layout.** The following passages are updated:
    - L31: Update "bare directory names" to describe nested paths (e.g. `interactivity-api/counter`, `plugins/cpt-register`).
    - L33: Update the example `npx skillsmith counter` to use a nested form (e.g. `npx skillsmith plugins/cpt-register`) with a note that this requires the upstream Skillsmith change (Req 10).
    - L36–38: Update the catalog-file description to mention that the catalogs stay at `eval/scenarios/` root and also mention the new gap-stubs section (Part 2).
    - L60–66 (Agent cap R12): Update the invocation example and note on scenario addressing.

### Part 2 — Coverage map and gap stubs

#### G. Coverage map artifact

14. **A coverage map is recorded as a phase artifact.** The design phase (or a dedicated artifact) records the coverage map for all 17 agent-skills topics with status (Covered / Covered-partial / Deferred-area / Gap) and the rationale for each:
    - **Covered:** wp-interactivity-api, wp-plugin-development, wp-block-development, wp-rest-api
    - **Covered (partial):** wp-block-themes (classic theme surface covered; block-theme core / theme.json is a catalog-deferred gap)
    - **Deferred-area:** blueprint, wp-playground (Playground area, off-domain docs + harness wall), wp-wpcli-and-ops (WP-CLI + Advanced Admin, off-domain + harness wall)
    - **Gap:** wp-abilities-api, wp-abilities-audit, wp-abilities-verify, wp-performance, wp-phpstan, wordpress-router, wp-project-triage, wp-plugin-directory-guidelines, wpds

15. **Cross-terminology is noted clearly.** The coverage map explicitly records:
    - Our "Coding Standards" area (WPCS style + PHPDoc) has NO agent-skills counterpart — agent-skills `wp-phpstan` covers PHPStan static analysis, a distinct discipline. `wp-phpstan` is a genuine gap.
    - Our "Themes" scenarios cover the classic-theme/plugin API surface; `wp-block-themes` covers block-theme theme.json/Site Editor — these are distinct; the classic coverage is real but partial against the agent-skills topic.

#### H. Gap stubs

16. **Nine gap stubs are added to `_wp-dev-candidates.yaml` under a new `# === Agent-Skills Gaps ===` section.** No new scenarios are implemented. No new catalog is created. The stubs appear at the bottom of `_wp-dev-candidates.yaml` after the existing area sections.

17. **Each gap stub has a consistent shape:** `name`, `description`, `difficulty: simple`, `concepts`, `source: agent-skills`, `source_files` (pointing to the agent-skills GitHub URL for the skill), a `# agent-skills: <skill-name>` provenance comment, and a `# Gap (agent-skills/<skill>):` marker comment explaining why it is a gap and its sub-classification (buildable-plugin / review-workflow / harness-wall). No `prompt` or `acceptance` (stubs, not implemented scenarios).

18. **Stub names follow the `<topic>-` naming convention.** Each stub name is a new `<topic>-*` lowercase-kebab name (not reusing any existing scenario or catalog record name) that clearly identifies the agent-skills topic it corresponds to, e.g. `abilities-api-register`, `performance-object-cache`, `phpstan-baseline`, `plugin-directory-review`, `project-triage-report`, `wordpress-router-classify`, `wpds-component-ui`, `abilities-audit-rest-surface`, `abilities-verify-callbacks`.

19. **Gap stubs for review/workflow and harness-wall topics include their shape-concern comment.** Stubs for `wp-abilities-audit`, `wp-abilities-verify`, `wordpress-router`, `wp-project-triage` include a comment noting they are review/workflow skills that may not fit the "build a plugin and grade" scenario shape. Stubs for `wpds` and `wp-phpstan` include a comment noting they are likely harness-wall (no PHP-plugin deliverable to grade under the current harness).

20. **The `_candidates.yaml` (iAPI catalog) is not modified.** All gap stubs go into `_wp-dev-candidates.yaml`. No change to the iAPI catalog.

### Part 3 — Done criteria and non-disruption

21. **Scenario content preserved verbatim.** After the move, every `scenario.yaml` has the same `name`, `description`, `skills`, `prompt`, `acceptance`, and `rubrics` as before (except: no `counter`/`counter-block` fix per Req 5). No acceptance-grading behavior changes.

22. **Playwright e2e collection verified.** After the move, running `npx playwright test` (with the `**/e2e.spec.mjs` glob) still discovers and can load all 27 e2e specs. No spec file is broken by the move (import depth updated per Req 6, content otherwise unchanged).

23. **verify-e2e.ts failure attribution correct after the local fix (Req 8).** With `scenarioDirOf` updated to return the full relative path, the `dirToName` lookup resolves correctly for every moved scenario, so e2e failures are attributed to the right (scenario, agent) pairs.

24. **Skills directory untouched.** No file under `skills/` is modified.

25. **Staging: this review does not break running scenarios against Skillsmith.** The owner is aware that real nested folders make scenarios invisible to the pinned Skillsmith until the upstream change is merged. This is an accepted temporary state. The harness update (Req 8) and import fixes (Req 6) are made in this review so that once Skillsmith is updated, the suite is immediately functional.
