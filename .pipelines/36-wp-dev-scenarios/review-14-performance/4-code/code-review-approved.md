# Code review — review-14-performance: approved (orchestrator inline review)

**Verdict: approved.** Reviewed inline (campaign efficiency — two judge-only scenarios, structure deterministically verified).

Change: commit `d2998b8` — ships `performance/performance-object-cache/` + `performance/performance-autoloaded-options/` (both judge-only) + catalog (object-cache promoted out of the gaps section; autoloaded-options added; both full records under a new `# === Area: Performance ===` / Implemented sub-header).

Checks (all pass):
- **Both judge-only, well-formed:** each dir contains only `scenario.yaml`; `rubrics: []`; keys correct; no catalog-only fields; no URLs in acceptance; dir==name.
- **`performance-object-cache` — tool-agnostic + deduped:** prompt is goal-only (make an expensive computed value fast to re-read, dedicated namespace) and does NOT name `wp_cache_*`/transients. Acceptance carries the dedup: object cache API (`wp_cache_get`/`set`/`add`) **NOT** the transient API; explicit non-default cache `$group`; cache-first/miss-recompute/store branch; namespaced key. Genuinely distinct from `common-apis-transients`.
- **`performance-autoloaded-options` — tool-agnostic + distinct:** prompt is goal-only (large rarely-read payload that must not load on every page request) and does NOT name `add_option`/`autoload`. Acceptance pins autoload OFF (boolean `false` preferred, legacy `'no'` tolerated, `true`/`'yes'`/omit rejected — correctly handling the WP 6.7 deprecation), via `add_option`/`update_option`, large payload, `get_option` on demand. Distinct from `settings-register` and `common-apis-options`.
- **Catalog:** parses; 48 records; NO duplicates; both performance records appear exactly once as full records with verbatim prompt/acceptance; on-domain `source_files`; the gaps section is correctly down to 5 (phpstan, router, triage, directory, wpds).
- **Invariants:** skill untouched; iAPI `_candidates.yaml` byte-untouched; diff confined to the 2 new dirs + catalog. No project guardrails.

Grounding is on-domain (developer.wordpress.org); no harness dependency (static judge grading).
