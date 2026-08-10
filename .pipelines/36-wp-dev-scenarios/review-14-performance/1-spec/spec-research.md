# Spec Research

## Rough Idea

Ship ~1–2 simple Performance scenarios, promoting the `performance-object-cache` catalog stub to a full record. Candidates: **Object cache** (`wp_cache_get`/`wp_cache_set`/`wp_cache_add` with a group — in-memory/persistent backend, distinct from DB Transients), **Autoloaded options** (register with `autoload = 'no'`), **Query optimization** (`WP_Query` with `no_found_rows`, `fields => 'ids'`, bounded `posts_per_page`). Likely judge-only. Must dedup against: `common-apis-transients`, `cron-event`, `common-apis-http-request`. Naming: `performance-*`; stub name `performance-object-cache` kept. Off-domain grounding allowed. Skill untouched; iAPI untouched; static/structural verification; pass not required.

## Q&A

### Q1: Does the object-cache scenario (wp_cache_get/wp_cache_set with a group) have genuinely distinct acceptance points from common-apis-transients, and what would those concrete check statements look like?

**A:** Object cache is DISTINCT from transients; the distinction holds. Object cache = `wp_cache_*` (in-memory, per-request by default unless a persistent drop-in like Redis/Memcached is present); transients = `set_transient`/`get_transient` (DB-backed via wp_options, survive across requests on their own). Object cache supports cache **groups** (the `$group` arg namespaces keys, same key reusable across groups) — transients have no group concept (flat key only). Object cache distinguishes `wp_cache_add` (write-only-if-absent) vs `wp_cache_set` (overwrite) vs `wp_cache_get` (found-by-ref); transients have no add/replace distinction.

Distinct acceptance checks (do NOT duplicate transient checks):
1. An expensive value is cached using the object cache API (`wp_cache_get`/`wp_cache_set`, or `wp_cache_add`) — NOT the transient API. [forces the distinct API]
2. The cache entry uses an explicit, non-default cache group (the `$group` argument), namespaced to the plugin. [object-cache-unique; transients can't do this]
3. On a cache miss the value is computed and stored; on a cache hit the cached value is returned without recomputation (the `wp_cache_get` result / found-flag is checked before recompute).
4. The cache key is a string literal namespaced to the plugin.

CAVEAT: the prompt/acceptance MUST pin the object-cache API explicitly (check #1), or a model will satisfy it with transients and collide with `common-apis-transients`.

**Reasoning:** The `$group` concept is the cleanest single distinguisher and is unrepresentable with transients. The WordPress core docs themselves state the canonical relationship ("this uses the object cache, so if your server doesn't have an object cache, better to use the transient functions… transients provide wider compatibility"), confirming the two are recognized as distinct APIs.

**Sources:** `eval/scenarios/common-apis/common-apis-transients/scenario.yaml`; https://developer.wordpress.org/reference/functions/wp_cache_set/ (signature `wp_cache_set( $key, $data, $group = '', $expire )` + the transients-vs-object-cache note + `$group` description); agent-skills `wp-performance` SKILL.md + references/object-cache.md (thin — topic provenance only, no signatures).

### Q2: Between autoloaded-options and query-optimization as the candidate second scenario, which is the simpler, single-concept, cleanly judge-gradeable, and most distinct (vs Options API, settings-register, and any covered area)? Recommend one or recommend shipping only object-cache.

**A:** RECOMMENDATION: ship 2 — `performance-object-cache` (promoted) + a new `performance-autoloaded-options`. SKIP query-optimization.

(A) AUTOLOADED OPTIONS — single concept ("register a large/rarely-read option NON-autoloaded"), pure static PHP, cleanly gradeable. Distinct acceptance checks:
- An option is registered/stored with autoload turned OFF (the autoload argument is false / 'no').
- Written via `add_option`/`update_option` with autoload explicitly set to not-autoload (`add_option` 4th arg, `update_option` 3rd arg).
- The non-autoloaded value represents a large or rarely-read payload (not a tiny flag read every request).
- optional: a namespaced string-literal key is used.

Dedup: NO collision with `common-apis-options` (bare store/retrieve/default/read-back — never touches autoload; the load-bearing graded property, autoload=false, is absent there). NO collision with `settings-register` (Settings API / REST, different surface). Overlap is only incidental `add_option`/`get_option` plumbing.

API WRINKLE (load-bearing): the strings `'yes'`/`'no'` are DEPRECATED as of WP 6.7.0; modern API uses boolean `false` (or `null`). Acceptance must accept `false` (preferred) AND tolerate legacy `'no'` — do NOT hard-pin `'no'`, or correct modern code is penalized. Word as "autoload turned off (false, or legacy 'no')."

Tool-agnostic prompt is achievable without naming autoload, by stating the performance goal (e.g. "a big chunk of data only needed on one rarely-visited admin screen; don't load it into memory on every page load — only fetch when that screen needs it; store it so it persists but isn't pulled in on every request"). The model must recognize "don't load every request" => non-autoloaded option.

(B) QUERY OPTIMIZATION — NOT cleanly single-concept: it's a bundle of 3-4 sub-tactics (`no_found_rows`, `fields => 'ids'`, bounded `posts_per_page`, avoid `post__not_in`). Checking all = multi-concept (violates simple/single-concept bar); checking one = thin/arbitrary. A tool-agnostic "I want a fast query" prompt gives the model no anchor to produce the specific params the rubric wants — many valid fast-query shapes exist, so high false-negative and gameability risk. No dedup collision, but a coherence problem. Grounding is OK but diffuse (WP_Query class ref documents the params; the optimization handbook page does not name them). Skip as a shipped scenario; optionally demote to a stub with a "multi-tactic; not cleanly single-concept for a tool-agnostic prompt" note.

**Reasoning:** Autoload has a sharp single target (the autoload-off property) the judge can check statically, a clean performance-goal prompt that doesn't leak the API, and a dedicated canonical handbook section. Query-opt lacks a sharp single target under a tool-agnostic prompt, making it the weak third to cut from a "~1-2 simple scenarios" intent.

**Sources:** `eval/scenarios/common-apis/common-apis-options/scenario.yaml`; https://developer.wordpress.org/reference/functions/add_option/ and /update_option/ (autoload arg + 6.7.0 deprecation changelog); https://developer.wordpress.org/advanced-administration/performance/optimization/ (dedicated "Autoloaded Options" section — recommends <800kb, autoload off per-option); WP_Query class ref https://developer.wordpress.org/reference/classes/wp_query/ (no_found_rows, fields=>'ids'); agent-skills wp-performance references/autoload-options.md (provenance, thin on API).

### Q3: Confirm kind (judge-only vs e2e) and any harness dependency for both shipped scenarios. Is there ANY clean front-end-observable runtime assertion in the plugin-scaffold harness for either object-cache or autoload, or are both judge-only?

**A:** BOTH judge-only — confirmed. No clean front-end-observable runtime assertion for either; no harness dependency that matters; the object-cache prompt stays goal-only with acceptance check #1 carrying the dedup.

1. Both JUDGE-ONLY:
   - Object cache: in the default harness the object cache is per-request (no persistent drop-in), so a "cache hit on the next request" never happens; even a same-request hit produces no front-end output difference (cached vs recomputed return the same value). Same wall as `common-apis-transients`/`cron-event`.
   - Autoload: whether an option autoloads is an internal `wp_options` storage/query property with zero front-end signal — the rendered page is byte-identical regardless; the only observable difference is a SQL query-count delta the harness has no hook to measure.
   - No clean e2e assertion exists for either. (The existing e2e specs all assert HTTP-observable output, e.g. rewrite-rule asserts GET => 200 + body token; neither perf practice yields such an observable.)

2. Harness dependency: NONE that matters — record as "none (static judge-only)." Object cache does NOT need a persistent drop-in for a static judge-only scenario (we grade produced PHP — presence of `wp_cache_*` + group + miss/hit branch — never execute across requests). Autoload is a static read of the autoload arg. Optional honest provenance note per scenario (mirroring `playground-blueprint`/abilities records that carry a "Harness dependency:" comment): "graded statically by the judge on the produced PHP; no runtime assertion."

3. Prompt-leak boundary (object cache): keep the prompt GOAL-ONLY; acceptance checks #1 (uses `wp_cache_*`, NOT the transient API) + #2 (explicit cache group) carry both the API-pinning AND the dedup vs `common-apis-transients`. You CANNOT write a pure performance-goal prompt that only the object-cache API satisfies and transients cannot — canonical guidance treats them as substitutable for the same goal ("Transients are stored in object cache anyway… wider compatibility"). This matches how the suite already works (tool-agnostic prompt + acceptance pins the mechanism, as in `cron-event`). A minor goal-framing nudge toward in-memory/per-request caching within the page lifecycle is allowed, but check #1 stays the hard gate.

**Reasoning:** Performance practices are static code properties, not cleanly runtime-assertable; the harness can only observe HTTP output, and neither a caching-hit nor autoload-off changes HTTP output. Static judge grading needs no runtime backend, so the per-request-only default cache is irrelevant to grading. The prompt/acceptance division of labor follows the established suite convention.

**Sources:** existing e2e specs under `eval/scenarios/*/e2e.spec.mjs` (all assert HTTP output); `common-apis-transients` and `cron-event` (judge-only precedent); https://developer.wordpress.org/reference/functions/wp_cache_set/ (transients-stored-in-object-cache note); `cron-event/scenario.yaml` (tool-agnostic-prompt + mechanism-pinning-acceptance precedent).

## Research

(No standalone research topics beyond the Q&A investigations above; all findings are captured per-question.)

## Consolidated Requirements

These requirements govern review-14-performance, phase 1 (Spec). They define the selection, per-scenario shape, kind, grounding, catalog reconciliation, and done-bar — not the final prompt/acceptance wording (a design/plan/code decision).

### A. Area and selection

1. **Performance area only.** Every newly implemented scenario belongs to a new Performance area and lives in `eval/scenarios/performance/`. No newly implemented scenario targets any other area, and no existing scenario (iAPI, v1, Plugins, Block Editor, REST API, Themes, Common APIs, Coding Standards, WP-CLI, Playground, Abilities API) is re-scoped, renamed, or moved.

2. **Ship exactly two scenarios.** The implemented batch is two Performance scenarios: (i) **object cache** and (ii) **autoloaded options**. Both are judge-only.

3. **Object cache is genuinely distinct from Transients.** The object-cache scenario targets the WordPress object cache API (`wp_cache_get` / `wp_cache_set` / `wp_cache_add` with an explicit cache **group**), framed as distinct from the DB-backed Transients API. It does not duplicate `common-apis-transients`; the distinguishing graded property is the use of `wp_cache_*` with a non-default cache group, a concept transients cannot express.

4. **Autoloaded options is genuinely distinct from Options API and Settings API.** The autoload scenario targets registering/storing a large or rarely-read option with autoload turned OFF. It does not duplicate `common-apis-options` (which never touches autoload) or `settings-register` (Settings API / REST). The distinguishing graded property is the explicit not-autoload argument, absent from both covered scenarios.

5. **Query optimization is NOT shipped.** Query optimization is excluded as a shipped scenario because it is a multi-tactic bundle (`no_found_rows`, `fields => 'ids'`, bounded `posts_per_page`, avoid `post__not_in`) that is not cleanly single-concept and cannot be sharply targeted by a tool-agnostic prompt without leaking the specific params, yielding high false-negative and gameability risk. Its exclusion (and any optional defer/stub note) is recorded in this spec and the design doc.

### B. Per-scenario shape

6. **Each scenario is one concept, one small plugin edit.** Each scenario is a single one-concept task realizable as a single edit to the scaffolded plugin's `index.php` (registrations/calls on a global hook such as `init`), with a handful of acceptance points — no theme artifact, no block type, no JS toolchain, no custom database table, and no multi-step task.

7. **Tool-agnostic, user-voice, outcome-phrased prompts.** Each `prompt` reads as a user-voice request stated as a performance goal and does NOT name the tool, API, function, or technology. Object cache is framed as caching an expensive computed value in memory within the request lifecycle; autoload is framed as storing a large/rarely-read payload so it isn't loaded into memory on every page load.

8. **Acceptance is scenario-unique and pins the mechanism.**
   - Object cache acceptance pins: uses the object cache API (`wp_cache_*`), NOT the transient API; uses an explicit non-default cache group namespaced to the plugin; on a cache miss computes and stores, on a hit returns the cached value without recomputation (found-flag/result checked before recompute); the cache key is a namespaced string literal.
   - Autoload acceptance pins: an option is stored with autoload turned OFF (the autoload argument is `false`, or legacy `'no'` tolerated — NOT hard-pinned to `'no'`); written via `add_option`/`update_option` with the autoload arg explicitly set to not-autoload; the value represents a large or rarely-read payload; (optional) a namespaced string-literal key is used.
   - Acceptance strings are clean human-readable checks with no embedded source URLs.

9. **`rubrics: []` and no catalog-only fields in scenario.yaml.** Each `scenario.yaml` declares `rubrics` as an array (`[]` by default) and contains exactly `name`, `description`, `skills: [wordpress-development]`, `prompt`, `acceptance`, `rubrics` — no `difficulty`, `concepts`, `source`, or `source_files`. No new shared rubric under `eval/rubrics/` is added unless a genuinely cross-cutting check is shared across both scenarios.

### C. Kind and grounding

10. **Both scenarios are judge-only; neither ships an `e2e.spec.mjs`.** Neither object-cache nor autoload produces a clean front-end-observable runtime assertion in the harness (per-request object cache yields no cross-request hit and no output delta; autoload is an internal `wp_options` property with zero front-end signal and only an unmeasurable query-count delta). Each is a `scenario.yaml`-only directory graded statically by the judge against the produced PHP.

11. **No blocking harness dependency; provenance recorded honestly.** Neither scenario requires a persistent object-cache drop-in or any new harness infrastructure for static grading. The judge-only / "graded on produced PHP, no runtime assertion" nature is recorded as a provenance note (in the catalog record and/or design doc), mirroring existing records that carry a harness-dependency note.

12. **Off-domain grounding allowed, cited honestly.** Acceptance points are grounded to canonical sources, cited in the catalog record only (never in `scenario.yaml`): object cache to `https://developer.wordpress.org/reference/functions/wp_cache_set/` (and related `wp_cache_*` references); autoload to `https://developer.wordpress.org/advanced-administration/performance/optimization/` (the "Autoloaded Options" section) plus `add_option`/`update_option` references (including the WP 6.7.0 `'yes'`/`'no'` deprecation). The agent-skills `wp-performance` skill is cited for topic provenance only (thin on API).

### D. Naming and catalog

13. **`performance-*` naming, directory == scenario name == catalog name.** Each scenario's directory name equals its `scenario.yaml` `name` equals its catalog record `name`, all identical, lowercase-kebab matching `/^[a-z0-9-]+$/`, each a flat immediate child of `eval/scenarios/performance/`. The object-cache scenario keeps the stub name `performance-object-cache`; the autoload scenario uses a new `performance-*` name (e.g. `performance-autoloaded-options`).

14. **Promote the `performance-object-cache` stub IN PLACE to a full record; add a record for the autoload scenario.** In `_wp-dev-candidates.yaml`, the existing `performance-object-cache` stub is promoted in place to a full record (keeping its name), and a new full record is added for the autoload scenario, both under an Implemented-Performance sub-header. Each full record carries `description`, `prompt` + `acceptance` matching the shipped `scenario.yaml` verbatim, `difficulty`, `concepts`, `source`, and `source_files` citing the grounding pages. Exactly one record per name; no duplicate record for any name.

15. **iAPI catalog and non-Performance records untouched.** `eval/scenarios/_candidates.yaml` is not modified. Within `_wp-dev-candidates.yaml`, only the Performance records (promoted stub + new autoload record, plus any header line update) change; no other area's records — including Common APIs Transients/Options/HTTP — are rebuilt, moved, renamed, or annotated.

### E. Done-criteria and non-disruption

16. **Static/structural verification; pass not required.** Each scenario is statically/structurally verified to be discoverable by Skillsmith (passes its scenario-shape check). No `e2e.spec.mjs` is shipped. A failing grade against the current skill is acceptable. No agent runs the full `scenarios × testing-agents` matrix, boots `wp-env`, or generates the plugin code.

17. **Skill untouched; existing suite intact.** No file under `skills/wordpress-development/` is modified. The existing scenario suite and both catalog files' non-Performance content remain intact; Skillsmith's flat discovery under `eval/scenarios/` continues to enumerate all existing scenarios, and the new Performance scenario directories are flat immediate children of `eval/scenarios/performance/`.

### Out-of-scope candidates

- **Query optimization** — excluded as multi-tactic / not cleanly single-concept under a tool-agnostic prompt (Requirement 5).
- **Profiling / runtime perf measurement** — no clean runtime assertion in the harness; out of scope.
- **Any e2e scenario for the shipped batch** — no front-end-observable assertion exists; both are judge-only.
- **Persistent object-cache drop-in / new harness infrastructure** — not required for static grading; out of scope.
- **Any change to the skill, the iAPI catalog, or non-Performance catalog records.**
