# Review: Performance scenarios (campaign 4/9)

## Origin

Owner directive *"kick off reviews from the gaps … include the deferred areas"* + *"Relax constraints, ship all"*. Campaign review **4 of 9**. Ships the `wp-performance` gap (catalog stub `performance-object-cache`).

## Goal

Ship ~1–2 simple **Performance** scenarios, promoting the `performance-object-cache` gap stub to a full record. Likely **judge-only** (performance practices are static code properties, not cleanly runtime-assertable in the harness); e2e only if a clean assertion genuinely exists.

## Constraints (relaxed)

- Off-domain grounding allowed (cite the canonical source — developer.wordpress.org performance docs if present, else the agent-skills `wp-performance` / make.wordpress.org / WordPress core handbook). Record provenance honestly.
- New folder `eval/scenarios/performance/<scenario>/`; user-voice, **tool-agnostic** prompts; `rubrics: []`; skill untouched; iAPI + existing records untouched.
- **Dedup is important:** Performance primitives overlap covered areas — **Transients** (`common-apis-transients`), **Cron** (`cron-event`), **HTTP** (`common-apis-http-request`) are already covered. Target performance practices NOT already covered.

## Assumptions / directions to explore

- Candidate uncovered, gradeable performance practices (the `wp-performance` skill covers autoloaded options, object cache, query optimization):
  - **Object cache** (`wp_cache_get`/`wp_cache_set`/`wp_cache_add` with a cache group) to cache an expensive computation — distinct from Transients (object cache = in-memory/request or persistent backend; not the DB-transient API). Judge-only.
  - **Autoloaded options** — register an option with `autoload = 'no'` (a.k.a. not autoloaded) for a large/rarely-read value; a recognized performance best practice. Judge-only.
  - **Query optimization** — a `WP_Query` using `no_found_rows`, `fields => 'ids'`, bounded `posts_per_page`, avoiding `post__not_in` — judge-only.
- The design picks ~1–2 that are SIMPLE, single-concept, gradeable, and not duplicative of transients/cron/http. e2e is unlikely (no clean runtime perf assertion); judge-only is expected (first-class). Record any harness dependency.
- Naming `performance-*` (keep the stub name `performance-object-cache` for the object-cache one; add records for any others). Promote the stub IN PLACE to a full record; add records for additional scenarios; no duplicates. Static/structural verification; pass not required.
