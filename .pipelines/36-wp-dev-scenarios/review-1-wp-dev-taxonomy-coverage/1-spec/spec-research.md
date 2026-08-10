# Spec Research

## Rough Idea

**Review:** exhaustive, area-by-area WordPress-development scenario coverage

Build the exhaustive taxonomy/catalog of WordPress-development topics driven by developer.wordpress.org (Documentation + API Reference, all areas and sub-areas), and implement the first area's scenarios (~1 per major sub-area). Skill untouched. Simple, doc-driven, tool-agnostic prompts, `rubrics: []`, Skillsmith conventions, flat discovery, no duplication with v1 batch.

V1 batch existing scenarios: `filter-body-class`, `shortcode-with-attr`, `cpt-register`, `rest-custom-endpoint` (plus Interactivity API suite).

Key open points to resolve:
1. What the reference taxonomy/catalog must contain, its form, and where it lives as a committed artifact (mirroring `_candidates.yaml`).
2. How the first area is chosen and the ~1-per-sub-area rule.
3. Verification approach and done-criteria.
4. Explicit out-of-scope boundaries.

## Q&A

### Q1: What is the structure/schema of the existing `eval/scenarios/_candidates.yaml`, the precedent committed catalog artifact?

**A:** It is a flat committed catalog doc (file `eval/scenarios/_candidates.yaml`, 1298 lines, 66 entries), sitting as a sibling of real scenario dirs. The leading underscore + lack of a `scenario.yaml` means Skillsmith's discovery (which only reads directories containing `scenario.yaml`) ignores it — so a catalog can live there safely.

- **Header (lines 1-11):** comment block stating what the file is, where mined from (Gutenberg docs paths), ordering rule ("simple → advanced within each group"), and that each entry mirrors `counter/scenario.yaml` shape MINUS `skills:` and `rubrics:` (consumer fills those in).
- **Grouping:** flat YAML list, visually grouped by `# === Group X — <theme> ===` comment banners (18 groups A..R). Grouping is COMMENTS ONLY, not a YAML key/nesting. Each group = one primary iAPI concept.
- **Entry schema (7 keys, identical on all 66 entries):**
  - `name` (kebab-case string = intended scenario dir name)
  - `description` (one line)
  - `difficulty` (enum: simple | intermediate | advanced; counts 17/34/15)
  - `concepts` (inline list)
  - `source` (enum: docs | derived; 57 docs / 9 derived — "derived" = mined from real block source, not prose docs)
  - `source_files` (list of repo-relative provenance paths)
  - `prompt` (block scalar, user-voice)
  - `acceptance` (list of check strings)
- The schema is intentionally a subset+superset of a real `scenario.yaml`: it OMITS `skills:`/`rubrics:` and ADDS catalog-only keys (`difficulty`, `concepts`, `source`, `source_files`). A later phase promotes a catalog entry into a real scenario dir by dropping the catalog-only keys and adding `skills`+`rubrics`.

**Reasoning:** This is exactly the committed taxonomy/catalog precedent the intent points to. A new wp-dev catalog can mirror it: leading-underscore filename in `eval/scenarios/` (ignored by discovery), comment banners for grouping, same entry schema. Key gap for this review: `_candidates.yaml` groups by iAPI CONCEPT, whereas the wp-dev taxonomy must group by developer.wordpress.org AREA → SUB-AREA — so the catalog likely needs an explicit area/sub-area field (or banner) the iAPI version expresses only as freeform group names.

**Sources:** `eval/scenarios/_candidates.yaml` (lines 1-11 header; 18 group banners; key counts verified by grep — 66× each of the 7 keys).

### Q2: Must candidate entries be authored exhaustively for ALL areas this run, or is only the taxonomy (area→sub-area map) exhaustive while candidate entries / implementation are scoped to the first area?

**A:** Consistent reading: the committed artifact is effectively TWO layers with different exhaustiveness bars.

1. **Taxonomy (exhaustive, all areas):** an exhaustive area → sub-area map of every top-level area and every sub-area across dev.wordpress.org's Documentation + API Reference, sourced from the site nav. This is the backbone.
2. **Candidate catalog (broad, "exhaustive catalog" per intent):** candidate entries covering the taxonomy — at minimum every area represented; ideally one candidate per major sub-area. Entry depth can be lighter (name + concept + one-line description + source URL — enough to be a real candidate) for not-yet-implemented areas; fully-authored prompt+acceptance records are only required for the first area's chosen scenarios.
3. **Implementation (first area only):** real scenario dirs (`scenario.yaml` + optional `e2e`), ~1 per major sub-area, schema-conformant, no duplication with the v1 batch.
4. **Deferred to DESIGN:** the actual exhaustive dev.wordpress.org sweep and the specific first-area pick.

**Reasoning:** Intent draws the line at "implement" (= promote a candidate into a discoverable scenario dir), not at the catalog. Intent repeatedly calls the catalog "exhaustive" (Goal lines 15-17; boundaries line 10; assumptions line 36). But requiring fully-authored scenario-quality records for ALL sub-areas across ALL areas would effectively author ~all scenarios, contradicting "Do NOT implement the whole catalog in one run" (constraints line 23) and the base spec's "picks deferred" stance (base R4: exact topics/scenarios/count chosen in design/plan, not spec). The `_candidates.yaml` precedent supports the two-layer split: 66 catalog entries authored ahead of implementation, only a subset promoted to real dirs. The exhaustive sweep itself is the DESIGN phase's job.

**Caveat (researcher):** Synthesis of intent + base-spec wording, not an external fact. A harder line ("every sub-area across ALL areas must have a fully-authored candidate entry this run") would contradict line 23 and base R4; advised against.

**Sources:** intent.md lines 10, 15-17, 23, 36-38; base spec.md R4, Out-of-Scope 5; `eval/scenarios/_candidates.yaml`.

### Q4: What testable criteria define a good foundational first-area pick, and is the v1-dup constraint expressed at area or sub-area level?

**A (overlap framing — decides everything):** The v1 batch touches MULTIPLE top-level areas, and the relevant topics are documented in more than one handbook simultaneously, so NO top-level area is 100% clean and "zero v1 overlap at the AREA level" is NOT usable. The constraint MUST be expressed at the **sub-area level**: "the first area's implemented scenarios must not duplicate any sub-area already covered by the v1 batch (Hooks/Filters via body_class, Shortcodes, Custom Post Types, custom REST endpoints)." This mirrors intent.md line 24, which already frames dup at the sub-area level.

Evidence (v1 scenarios are dual-documented):
- `filter-body-class` → Hooks/Filters — in Plugins (`/plugins/hooks/filters/`), Common APIs (`/apis/hooks/filter-reference/`), and Code Reference.
- `shortcode-with-attr` → Shortcodes — in Plugins (`/plugins/shortcodes/`) and Common APIs (`/apis/shortcode/`).
- `cpt-register` → Custom Post Types — Plugins (`/plugins/post-types/`).
- `rest-custom-endpoint` → REST API (`/rest-api/`).
So v1 already touches Plugins, Common APIs, and REST API (≥3 top-level areas).

**A (six checkable criteria for a good foundational first pick — design makes the pick + justifies against these):**
1. **Non-saturation (sub-area level).** The area has multiple major sub-areas NOT in v1's four. Checkable: list the area's major sub-areas, subtract {Hooks/Filters, Shortcodes, Custom Post Types, custom REST endpoints}; remainder must be large enough to host ~1 scenario per major sub-area. If only 1-2 uncovered sub-areas remain, bad pick.
2. **Foundational / broad applicability.** Concepts are prerequisites/building blocks reused across WP-dev work, not niche. Proxies: (a) a "core" handbook devs hit first (Plugins, Common APIs, Themes, Block Editor) vs specialized (Advanced Administration, WP-CLI, Playground); (b) sub-areas map to data/behavior primitives (options, settings, metadata, taxonomies, users, hooks, cron, HTTP). Require design to argue ≥2 of its sub-areas are prerequisites reused by other areas. (Irreducibly judgment-y → require a justification, not a binary.)
3. **Code-gen-friendly / simple-scaffoldable.** Each candidate sub-area yields a SIMPLE scenario (one concept, one small feature) implementable as a single scaffolded-plugin edit (base R3; scaffold writes a plugin the agent edits). Areas whose sub-areas are inherently complex/multi-step are weaker unless a simple slice exists.
4. **E2e-feasible in wp-env (for the runtime-checkable subset).** Mixed verification (base R7/AC6): the area should contain at least some sub-areas whose behavior is observable in a booted wp-env site (HTTP/DOM/REST/db). Pure advice/standards areas (Coding Standards) are judge-only by nature → weaker as a FIRST area (can't exercise the mixed bar), though not disqualified.
5. **Documentation-grounded & stable.** Every sub-area traces to a concrete dev.wordpress.org page (base R2/AC4); prefer drift-stable structures (Plugins, Common APIs mature) over reorganizing handbooks (Advanced Administration).
6. **Tool-agnostic-promptable.** Each sub-area expressible as a user-voice, outcome-phrased prompt that doesn't name the API/function (base R5/AC3).

**Bad picks (contrapositive):** saturated areas (e.g. REST API — canonical custom-endpoint already done); niche/non-foundational (Advanced Administration, WP-CLI, Playground — hard to scaffold/e2e as a simple plugin feature); areas with only complex sub-areas; 100%-judge-only areas (Coding Standards) as the first area.

**Recommended spec shape (researcher):** Don't name the area; REQUIRE design to (a) pick ONE top-level area, (b) justify it against criteria 1-6 with cited sub-area URLs, (c) implement ~1 simple scenario per major UN-COVERED sub-area, (d) prove no chosen sub-area duplicates the v1 four. Keeps the pick deferred (base R4) while making the bar testable.

**Caveat:** Synthesis of intent + base-spec + the area map. Criterion 2 ("foundational") has a judgment-y core → require a justification; criteria 1,3,4,5,6 are objectively checkable.

**Sources:** intent.md lines 10, 23-24, 37; base spec.md R2/R3/R5/R7, AC3/AC4/AC6; v1 `scenario.yaml` files (`eval/scenarios/{filter-body-class,shortcode-with-attr,cpt-register,rest-custom-endpoint}/scenario.yaml`); dual-documentation confirmed this session; scaffold behavior from `skillsmith.config.ts` `beforeTestAgent → scaffoldPlugin`.

### Q5: What are the concrete, checkable verification mechanics, the e2e pattern, and the mandated per-scenario shape?

**A (verification — "well-formed/runnable" without the full matrix):** v1 itself was NEVER run live; the precedent bar is STATIC/STRUCTURAL verification, not execution (base code-summary.md "Known limitations": scenarios structurally/statically verified for schema, prompt tool-agnosticity, acceptance content, e2e flow correctness — NOT run end-to-end against live wp-env; full matrix is the owner's manual step).

Cheapest real checks an agent CAN run (no wp-env, no testing agent, no LLM judge):
- **(a) YAML parses + passes `isScenarioShape`.** Replicate the validator (name non-empty str, description str, skills str[], prompt str, acceptance str[], rubrics str[]) with a small js-yaml script, OR force discovery via the CLI: `npx skillsmith <unknown-name>` prints `Unknown scenario` + an `Available scenarios` list — a malformed new scenario is absent from that list or surfaces a `scenario.yaml malformed` error. Proves the scenario will be DISCOVERED + graded, not silently skipped. (CLI flag behavior verified in an earlier pipeline, not re-run this session; no dedicated `validate`/`--dry-run`/`--list` flag found in pinned skillsmith — design should confirm against the installed CLI.)
- **(b) e2e spec loadable/collectable by Playwright without booting wp-env:** `npx playwright test <dir>/e2e.spec.mjs --list` imports the spec (catches syntax/import errors) without starting a browser/wp-env. Proves the spec parses and imports resolve. (Needs node_modules; global-setup may run under `--list` — design to confirm, else fall back to a parse/import check.)
- **(c) Static lint/format check** against the v1 e2e shape.

**What these do NOT prove (state as spec limitation, mirroring v1):** that the scenario PASSES against the current skill (a failing grade is explicitly acceptable per intent + base AC7); that the e2e goes green in a live wp-env (no plugin built, no WP booted, no agent code generated); that the LLM judge interprets acceptance as intended; that `wp-scripts` build succeeds. So "runnable" in the spec = **DISCOVERABLE (passes `isScenarioShape`) + e2e spec (if present) LOADABLE/COLLECTABLE** — i.e. `npx skillsmith <dir>` would execute to a graded result without harness/config errors (base AC7). It must NOT mean "passes."

**A (fixed e2e pattern — all 4 v1 specs follow it identically):**
1. `import { expect, test } from "@wordpress/e2e-test-utils-playwright";`
2. `import { deactivateAllPlugins } from "../../utils/wp-cli.mjs";`
3. `test.describe("<scenario> scenario", () => { ... })`
4. `test.beforeAll(async ({ requestUtils }, workerInfo) => { deactivateAllPlugins(); await requestUtils.activatePlugin(\`plugin-<dir>-${workerInfo.project.metadata.agentId}\`); /* optional seed via requestUtils.createPost */ })` — **CRITICAL:** activated slug is exactly `plugin-<scenarioName>-<agentId>`, and `scenarioName` === scenario dir/name; drift activates a non-existent plugin.
5. `test.afterAll(() => { deactivateAllPlugins(); /* + requestUtils.deleteAllPosts() if posts seeded */ })`
6. one or more `test("...", async ({ page }) => { ...assert... })`.
- Assertion styles proven across the 4: DOM locator (`toHaveClass`); rendered text after seeding a post (`page.goto('/?p=...')` → `toContainText`); REST status (`page.request.get('/wp-json/...')` → `status()` `toBe(200)`); REST status + JSON shape (`toHaveProperty`).
- **Determinism rule:** every literal the e2e asserts (CSS class, slug, route, attr value) is PINNED in the scenario's prompt so prompt and assertion stay in lockstep. Spec should REQUIRE this.

**A (per-scenario shape the spec must mandate — confirmed by `isScenarioShape` + v1 practice, in v1's key order):**
- `name` — kebab, MUST equal the directory name, MUST match SLUG_PATTERN `/^[a-z0-9-]+$/`
- `description` — one line
- `skills` — `[wordpress-development]` (string[]; single entry)
- `prompt` — user-voice, tool-agnostic, block scalar
- `acceptance` — string[] of scenario-unique checks
- `rubrics` — `[]` (string[] — MUST be present; `[]` is the only passing form for no-rubric; omitting or null FAILS discovery)
- NOTHING else is required. No `difficulty`/`concepts`/`source` — those are `_candidates.yaml` catalog-only fields, NOT scenario.yaml fields.

**Additional hard constraints discovery/harness imposes (capture or design will trip):**
- Directory must be an immediate child of `eval/scenarios/` and contain `scenario.yaml` (else silently skipped).
- `name` must match `/^[a-z0-9-]+$/` AND equal the dir name; `scaffold-plugin.ts` THROWS otherwise (`cpt_register`, `CPT-Register` would crash). Lowercase-kebab only.
- If an e2e exists, the activated plugin slug derives from `name` — name drift breaks the e2e.
- e2e is OPTIONAL per scenario (judge-only allowed); `verify-e2e.ts` only runs specs that exist (`.filter(existsSync)`).

**Sources (read this session):** `eval/scenarios/{filter-body-class,shortcode-with-attr,cpt-register,rest-custom-endpoint}/{scenario.yaml,e2e.spec.mjs}`; `eval/utils/verify-e2e.ts`; `eval/utils/scaffold-plugin.ts` (SLUG_PATTERN line 5, `pluginSlug` throws lines 7-19); `eval/utils/wp-cli.mjs`; `skillsmith.config.ts`; `package.json` scripts; `enumerate.ts` `isScenarioShape` (pinned SHA); base code-summary.md "Known limitations". CLI `Unknown scenario`/`Available scenarios` behavior verified in an earlier pipeline, not re-run this session (flagged).

### Q6: Should the spec fix the catalog file location/name, and is "zero new rubrics / `rubrics: []`" the settled stance for this review?

**A (catalog location):** REQUIRE-a-committed-artifact-and-DEFER-exact-path. Intent does not pin a path; it says the catalog "mirrors `_candidates.yaml`" (a shape/precedent reference) and calls the structure a "planning/taxonomy artifact" (intent lines 7, 11, 22, 30). base Out-of-Scope 5 treats layout as a design decision. But the spec SHOULD fix two load-bearing CONSTRAINTS on wherever it lands: (a) it must NOT break flat discovery — if placed inside `eval/scenarios/`, it must be a non-directory file OR a leading-underscore name so the discovery guards skip it; (b) it must be committed (a real repo artifact, not pipeline-only).
- **iAPI-confusion risk (real):** `_candidates.yaml` is specifically the iAPI catalog (header names Gutenberg/interactivity sources). A broad wp-dev taxonomy as its sibling could read as "more iAPI candidates." Non-binding options for design: a clearly-named sibling like `eval/scenarios/_wp-dev-candidates.yaml`, OR placing the taxonomy outside `eval/scenarios/` (e.g. `eval/_wp-dev-taxonomy.md`). Researcher's read: the area→sub-area MAP is arguably better OUTSIDE `eval/scenarios/` (planning doc, broader than a candidate list), while candidate ENTRIES naturally mirror `_candidates.yaml` near it — but this is a design-phase layout call.
- **Recommended spec wording:** "commit a taxonomy + candidate catalog artifact (mirroring the `_candidates.yaml` precedent in shape); exact path/filename is a design decision, subject to: must not break Skillsmith flat discovery, and must be clearly distinguishable from the iAPI `_candidates.yaml`."

**A (rubrics):** CONFIRMED — "default zero new shared rubrics; every new scenario declares `rubrics: []`" is the consistent stance, and it matches what v1 did (zero rubrics across 4 scenarios spanning 4 sub-areas). No contradiction with intent line 25 ("Shared rubrics only where genuinely cross-cutting; never duplicate between a rubric and scenario acceptance") — that is a permissive/conditional guard, identical in spirit to base R9/AC8, NOT an instruction to add one. A single area's handful of scenarios is even less likely to surface a genuinely cross-cutting check than the 4-area v1 batch.
- **Precise stance to encode (mirror intent's permissive-default-zero, do not over-tighten):** every new scenario uses `rubrics: []` by default; a new shared rubric is added ONLY if a genuinely cross-cutting check is shared across multiple of THIS review's scenarios, and if added must be simple/general and not duplicated in any `acceptance` list.
- **Nuance:** even if a rubric were added, every `scenario.yaml` still needs the `rubrics:` key present (`[]` when none, `[<stem>]` when referencing one). The key is never omitted (discovery requirement).

**Decision (analyst):** Mirror intent's permissive-default-zero rather than impose a harder zero-rubrics rule the intent does not compel. Expected outcome is zero new rubrics with every new scenario declaring `rubrics: []`.

**Sources:** intent.md lines 7, 11, 22, 25, 30; base spec.md R9 + AC8; base code-summary.md (v1 added zero rubrics); `enumerate.ts` discovery guards.

## Research

### dev.wordpress.org top-level structure (Q3)

Site splits into two buckets on the home nav: **Documentation** handbooks + **API Reference** areas. The line is a bit blurry on the home page (card layout, not a strict two-column menu), but the canonical split is:

**DOCUMENTATION (handbooks):**
1. **Block Editor** (`/block-editor/`) — Getting Started, How-to Guides, Reference Guides, Explanations, Contributor Guide. BIG; Reference Guides fans out into Block API, Components, Data, Packages, Interactivity API, SlotFills, Theme.json, etc. Dozens of sub-areas, multi-level. (The Interactivity API reference lives here.)
2. **Themes** (`/themes/`) — Getting Started, Core Concepts, Block Themes, Classic Themes, Advanced Theme Topics, Releasing Your Theme. ~6 chapters.
3. **Plugins** (`/plugins/`) — ~18 chapters: Intro, Plugin Basics, Security, Hooks, Privacy, Administration Menus, Shortcodes, Settings, Metadata, Custom Post Types, Taxonomies, Users, HTTP API, JS/jQuery/Ajax, Cron, i18n, Plugin Directory, Developer Tools. **v1 batch area** — partially used up.
4. **Common APIs** (`/apis/`) — ~15-20 API sub-areas: Hooks (Action/Filter Reference), Settings, Options, Metadata, Transients, Database, Filesystem, HTTP requests, Shortcode, Rewrite, Theme, Plugin, i18n, Security, wp-config.php, etc.
5. **Advanced Administration** (`/advanced-administration/`) — server/site-management oriented (hosting, security, performance, upgrading, WordPress.org). ~8-12 chapters (partially verified).
6. **Coding Standards** (`/coding-standards/`) — WordPress Coding Standards {Accessibility, CSS, HTML, JavaScript, PHP} + Inline Documentation Standards {JavaScript, PHP}. ~7 leaf pages.
7. **WordPress Playground** — home-page card; own docs section; depth not mapped; lower relevance for code-gen scenarios.

**API REFERENCE:**
- **A. Code Reference** (`/reference/`) — auto-generated symbol reference: Functions, Classes, Methods, Hooks (Actions+Filters); grouped "API reference" index (Dashboard Widgets, Database, HTTP API, Filesystem, Global Variables, Metadata, Options, Quicktags, Rewrite, Settings, Shortcode, Transients, XML-RPC). Thousands of pages.
- **B. REST API** (`/rest-api/`) — Using the REST API, Reference (endpoints), Extending, Authentication, Global Parameters, Pagination. **v1 batch area** — partially used up.
- **C. WP-CLI Commands** (`/cli/commands/`) — flat listing of all WP-CLI commands.

**Headline numbers:** ~7 Documentation areas + ~3 API Reference areas = **~10 top-level areas** (Playground and WP-CLI are the fuzzy/lower-priority ones). Smallest sub-area set: Coding Standards (~7 leaves); largest: Block Editor (dozens, multi-level).

**Feasibility / drift:**
- Authoring an exhaustive area → sub-area map is feasible: each handbook has a stable, navigable left-sidebar TOC; the top-level area set is small (~10) and stable.
- The **area layer (~10) is very drift-stable** — safe to pin in spec.
- The **sub-area leaf layer is stable enough to map but WILL drift** (dev.wordpress.org reorganizes handbooks over time). Recommend treating the catalog as a **point-in-time snapshot dated/sourced to URLs**, not a frozen contract. Each catalog entry should carry its source URL (the `_candidates.yaml` `source_files` precedent) so drift is auditable.
- **Caveat:** Common APIs and Advanced Administration full sidebars are JS-collapsible and did not fully render via WebFetch; sub-areas corroborated via search-result URLs but not a verbatim ordered TOC. The exhaustive verbatim enumeration is the DESIGN-phase sweep's job; for SPEC, the ~10-area map + "each has a multi-item sidebar" is established and sufficient.

**Dup warning — v1 batch spans MULTIPLE areas (not one):**
- `filter-body-class` → Plugins/Hooks (or Common APIs/Hooks)
- `shortcode-with-attr` → Plugins/Shortcodes (Common APIs/Shortcode)
- `cpt-register` → Plugins/Custom Post Types
- `rest-custom-endpoint` → REST API
So whichever first area design picks, it must avoid re-doing those specific sub-areas. Plugins and REST API are partially used up.

**Sources:** visited this session — `/`, `/block-editor/`, `/themes/`, `/plugins/`, `/apis/`, `/advanced-administration/`, `/coding-standards/`, `/reference/`, `/rest-api/`, `/cli/commands/`, plus search-confirmed sub-URLs under `/apis/` and `/rest-api/`. Common-APIs and Advanced-Administration full TOCs partially verified.

### Skillsmith flat-discovery + schema constraints (verified firsthand at pinned SHA)

Verified against pinned Skillsmith source `src/scenarios/enumerate.ts` at SHA `6bd90c34d88b815fdf4fd661dc8c51288111444c` (node_modules not installed in worktree; fetched pinned source directly).

1. **Discovery is flat — immediate children only.** `for (const entry of readdirSync(scenariosRoot))`, no recursion. Nested dirs like `eval/scenarios/<area>/<x>/scenario.yaml` are NEVER discovered.
2. **Two skip-guards:** non-directories are skipped (`!isDirectorySafe`), and dirs lacking `scenario.yaml` are skipped (`!existsSync(yamlPath)`). A loose file like `_candidates.yaml` in the scenarios root is silently skipped by the first guard — which is exactly why the existing catalog can live among real scenario dirs safely.
3. **`rubrics:` must be present and an array.** `isScenarioShape` requires ALL of: `name` (non-empty string), `description` (string), `skills` (string[]), `prompt` (string), `acceptance` (string[]), `rubrics` (string[]). Omitting `rubrics` or leaving it null FAILS discovery. For no-rubric scenarios, `rubrics: []` is the only passing form (matches all 4 v1 scenarios).

**Implications for the taxonomy artifact:**
- It CANNOT be expressed as nested scenario folders (discovery won't see them).
- It SHOULD be a flat committed doc — a leading-underscore file in `eval/scenarios/` (like `_candidates.yaml`, ignored by discovery) and/or a markdown/yaml artifact elsewhere in the repo.
- "Area → sub-area structure" = a CATALOG/MAP DOCUMENT + naming conventions, NOT directory nesting (same conclusion the v1 design doc reached).

**Sources:** `https://raw.githubusercontent.com/Automattic/skillsmith/6bd90c34d88b815fdf4fd661dc8c51288111444c/src/scenarios/enumerate.ts`; corroborated by base `design-doc-research.md` (enumerate.ts lines 33-84) and base `design-doc.md`.

## Consolidated Requirements

Each requirement below is phrased as an observable outcome of the completed review.

### A. Reference taxonomy (exhaustive)

1. **Exhaustive area → sub-area taxonomy.** The review delivers a committed taxonomy that maps every top-level area of developer.wordpress.org's Documentation handbooks AND its API Reference to its major sub-areas. The Documentation areas are at least: Block Editor, Themes, Plugins, Common APIs, Advanced Administration, Coding Standards (plus WordPress Playground where relevant); the API Reference areas are at least: Code Reference, REST API, WP-CLI Commands. "Exhaustive" applies to the area layer (all ~10 top-level areas present) and to each area's major sub-areas as enumerated from the site navigation.

2. **Traceable and drift-auditable.** Every taxonomy area/sub-area is traceable to a concrete developer.wordpress.org URL, and the artifact is recorded as a point-in-time snapshot (dated / source-URL-bearing) rather than a frozen contract, so future reviews can detect and refresh drift. The area layer is treated as stable; the sub-area leaf layer is expected to need periodic refresh.

### B. Candidate catalog

3. **Committed candidate catalog mirroring the `_candidates.yaml` precedent.** The review delivers a committed candidate catalog whose entries mirror the shape of the existing `eval/scenarios/_candidates.yaml` (a flat list of candidate records grouped by area, each carrying at least an intended scenario `name`, a one-line `description`, the concept(s) covered, and source provenance URL/paths back to developer.wordpress.org). The catalog covers the taxonomy broadly: at minimum every top-level area is represented, ideally with one candidate per major sub-area. Entry depth may be lighter for not-yet-implemented areas; only the first area's chosen scenarios require fully-authored `prompt` + `acceptance` records.

4. **Catalog location preserves flat discovery and is distinct from the iAPI catalog.** Wherever the taxonomy/catalog artifact lives, it does not break Skillsmith's flat scenario discovery: if placed inside `eval/scenarios/`, it is a non-directory file and/or uses a leading-underscore name so the discovery guards skip it. It is a real committed repo artifact (not pipeline-only), and it is clearly distinguishable from the iAPI-specific `_candidates.yaml`. The exact path and filename are a design-phase decision subject to these constraints.

### C. First-area selection and implementation

5. **One foundational, non-saturated first area, justified.** The review implements scenarios for exactly ONE top-level area, chosen and justified by the design phase against checkable criteria: (a) non-saturation — the area has multiple major sub-areas not already covered by the v1 batch; (b) foundational/broad applicability — argued by showing at least two of its sub-areas are prerequisites reused across other WordPress-dev areas; (c) simple-scaffoldable — each chosen sub-area yields a one-concept/one-small-feature scenario implementable as a single scaffolded-plugin edit; (d) e2e-feasible — the area contains at least some sub-areas whose behavior is observable in a booted `wp-env` site; (e) documentation-grounded and drift-stable; (f) tool-agnostic-promptable. Saturated areas, niche/server-ops or tooling areas (Advanced Administration, WP-CLI, Playground), and 100%-judge-only areas (Coding Standards) are weak first-area picks.

6. **~1 simple scenario per major un-covered sub-area.** The first area is implemented as approximately one simple scenario per major sub-area of that area that is not already covered by the v1 batch. Each scenario is a single focused task exercising one concept in one plugin, with a handful of acceptance points (on par with the existing v1 and Interactivity API scenarios). No multi-feature, multi-step, or otherwise complex scenarios.

7. **No duplication with the v1 batch (sub-area level).** No newly implemented scenario duplicates a sub-area already covered by the v1 batch: Hooks/Filters (via `filter-body-class`), Shortcodes (`shortcode-with-attr`), Custom Post Types (`cpt-register`), and custom REST endpoints (`rest-custom-endpoint`). The constraint is evaluated at the sub-area level, because the relevant topics are dual-documented across multiple handbooks and no top-level area is 100% clean.

8. **Documentation-driven, user-voice, tool-agnostic.** Every implemented scenario is grounded in developer.wordpress.org: each acceptance point traces to an official doc page (cited URL), and each `prompt` reads like a real user's outcome-phrased request that does NOT name the tool, API, function, or technology to use.

### D. Scenario shape and verification

9. **Schema-conformant scenarios.** Each implemented scenario is a directory that is an immediate child of `eval/scenarios/` containing a `scenario.yaml` with exactly the required keys: `name` (lowercase-kebab matching `/^[a-z0-9-]+$/` and equal to the directory name), `description`, `skills: [wordpress-development]`, `prompt`, `acceptance` (a list of scenario-unique checks), and `rubrics` (present as an array). Catalog-only fields (`difficulty`, `concepts`, `source`, `source_files`) do not appear in a `scenario.yaml`.

10. **Default zero shared rubrics; `rubrics: []`.** Each new scenario declares `rubrics: []` by default and no new shared rubric is added, mirroring the v1 outcome. A new shared rubric under `eval/rubrics/` is added only if a genuinely cross-cutting check is shared across multiple of this review's scenarios; if added, it is simple and general and is never duplicated in any scenario's `acceptance` list. The `rubrics:` key is always present (never omitted), even when empty.

11. **Mixed verification bar.** For each implemented scenario whose behavior is observable in a real runtime, the scenario directory includes an `e2e.spec.mjs` that follows the established v1 lifecycle: import `{ expect, test }` from `@wordpress/e2e-test-utils-playwright` and `deactivateAllPlugins` from the e2e utils; `beforeAll` deactivates all plugins then activates `plugin-<name>-${agentId}` (and optionally seeds posts); `afterAll` deactivates all plugins (and deletes seeded posts); assertions are observable in a booted `wp-env` site (DOM, rendered post content, or REST status/JSON). Every literal the e2e asserts (CSS class, slug, route, attribute value) is pinned in that scenario's `prompt`. Where a real-runtime check is impractical, a judge-only scenario (no `e2e.spec.mjs`, graded against `acceptance`) is acceptable.

12. **Well-formed and runnable, not required to pass.** Each implemented scenario is statically/structurally verified to be DISCOVERABLE (passes Skillsmith's `isScenarioShape`) and, where an `e2e.spec.mjs` is present, LOADABLE/COLLECTABLE by Playwright (parses, imports resolve) — i.e. `npx skillsmith <scenario-dir>` would execute to a graded result without harness/configuration errors. A failing grade against the current skill is acceptable and does not violate this bar. Agents do not run the full `scenarios × testing-agents` matrix, do not boot `wp-env` for a real pass, and do not generate the plugin code — full-matrix execution remains the owner's manual step.

### E. Integration and non-disruption

13. **Skill untouched.** No file under `skills/wordpress-development/` is modified by this review.

14. **Builds on the existing suite without disruption.** The existing scenarios (the Interactivity API suite and the four v1 scenarios) and the existing `_candidates.yaml` are not reorganized, moved, or broken, and Skillsmith's flat discovery under `eval/scenarios/` continues to work. New scenario directories are added as flat immediate children of `eval/scenarios/`.

## Out of Scope

1. **Implementing the other areas.** Only the first area's scenarios are implemented this run; the remaining ~9 areas are explicit follow-up reviews. The whole catalog is NOT implemented in one run.
2. **Any change to the skill** (`skills/wordpress-development/`).
3. **Nested scenario folders / area-directory nesting.** Structure is expressed as a catalog/taxonomy document plus naming conventions, never as nested directories (flat discovery would not see them).
4. **Reorganizing or moving existing scenarios** (Interactivity API suite, v1 scenarios) or the existing `_candidates.yaml`.
5. **Requiring scenarios to pass against the current skill, or running the full `scenarios × testing-agents` matrix / booting `wp-env` for a live pass.** Well-formedness/runnability (discoverable + e2e-loadable) is the bar; full-matrix runs remain the owner's manual step.
6. **Fully-authoring scenario-quality prompt+acceptance records for every sub-area across all areas.** Only the first area's chosen scenarios are fully authored; other areas' catalog entries may be lighter candidate records.
7. **Scenarios grounded in non-official sources.** All taxonomy entries and scenario acceptance points derive from developer.wordpress.org and its sublinks.
8. **Adding shared rubrics by default.** Zero new rubrics is the expected outcome; a rubric is added only on a genuinely cross-cutting shared check across this review's scenarios.
9. **The exhaustive developer.wordpress.org sweep and the specific first-area pick are performed in the DESIGN phase, not the spec phase.**
