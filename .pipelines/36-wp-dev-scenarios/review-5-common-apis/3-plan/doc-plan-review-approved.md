# Doc Plan Review

## Verdict: approved

## Summary

The doc plan is deliberately empty (zero tasks) for run `review-5-common-apis`, and an independent end-to-end sweep of the live repository confirms that this is correct: nothing live goes stale when the four new `common-apis-*` scenarios and the in-place Common APIs edit of `_wp-dev-candidates.yaml` (two stub renames + two new full records + one header-line fix) land. The plan's "Surfaces deliberately not changed (and why)" section is thorough, accurate, and verifiable against the actual files. The single genuinely stale surface — the catalog's internal header comment — is correctly assigned to the code phase (code Task 5), not mis-assigned away from the docs phase. The guardrail-scopes section is a valid empty rendering, consistent with the code plan's identical "No project guardrails" finding. This run is the same shape as the four prior reviews, each of which concluded an empty doc plan for the same reason.

## Validation performed

### Guardrail scopes
- Plan records "No project guardrails" with a single `None | None` row. This project defines no scoped gates, so no command template exists to fill or execute. The `None` body is the valid rendering when no scoped gate was passed, and it matches the code plan's identical finding. No binding violation (no passed scoped gate left without a row; no row for a nonexistent gate). Valid.

### Independent coverage sweep (live repo, excluding `node_modules`, `.git`, `.pipelines`, `.skillsmith`, `.claire`, `.claude`, `dist`)
- **Live markdown inventory** — found exactly 12 files: `README.md`, `.rp.md`, `eval/prompts/{testing-agent,improver}.md`, `eval/rubrics/wp-interactivity-api-best-practices.md`, and the seven `skills/wordpress-development/**` files. Matches the plan's enumeration.
- **Common APIs terms** — case-insensitive grep for `common-apis` / `Common APIs` across all `.md`/`.yaml`/`.yml` returned **zero** hits outside `_wp-dev-candidates.yaml` itself (the code-phase surface). No prose doc references Common APIs or the four sub-areas.
- **Legacy stub names** — grep for `options-api-store-retrieve` and `transient-cache-remote-data` returned **zero** hits anywhere outside the catalog. Confirmed they currently live only at catalog lines 366 and 376, exactly where code Task 5 renames+promotes them.
- **Scenario-count / naming-convention prose** — no live doc enumerates scenarios, asserts a scenario count, or describes a scenario-directory naming scheme. README's only "candidate catalogs" mention (lines 36-38) is the generic two-catalog pointer; its `_wp-dev-candidates.yaml` description ("broader WordPress-development candidates spanning the developer.wordpress.org areas") stays accurate after an in-place edit. `.rp.md` has zero catalog-file-name or naming references. `eval/prompts/testing-agent.md` has zero scenario/catalog/area references.
- **README `e.g. counter, cpt-register` example (line 31)** — both directories still exist; the line is an illustration of bare scenario names, not an enumeration, so it does not go stale.
- **README "Skill structure" (line 7)** and the run-mechanics sections — scoped to the untouched skill and the unchanged harness respectively; unaffected by flat-child scenarios.

### Mis-assignment check (the one stale surface)
- The catalog header comment at lines 28-29 ("Full prompt + acceptance are included for the implemented Plugins, Block Editor, REST API, and Themes scenarios; all other records are lighter stubs.") is the one surface that goes stale on promotion. It is a catalog-internal comment, not prose documentation, and code plan Task 5 explicitly owns the fix — it quotes the exact line and instructs adding Common APIs, with its acceptance covering this as the only header change. Correctly assigned to the code phase; no warranted doc change was assigned away from docs.
- The catalog's area→URL map already lists "Common APIs  https://developer.wordpress.org/apis/" (line 14), so it needs no change — this run promotes records *within* an already-listed area.

### Filesystem corroboration
- No `common-apis-*` directory exists yet (no collision).
- Prefixed sets (`block-editor-*`, `rest-api-*`, `themes-*`) already coexist beside non-prefixed scenarios — confirming the plan's "forward inconsistency already present, no naming-convention doc to contradict" reasoning.
- The judge-only precedent scenarios (`cron-event`, `admin-menu-page`, `i18n-textdomain`) and the e2e reference (`cpt-register`) exist, as the plan and code plan assume.

## Issues

None.
