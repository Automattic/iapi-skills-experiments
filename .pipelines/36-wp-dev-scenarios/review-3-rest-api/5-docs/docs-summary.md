# Docs Summary: REST API scenarios

## What

No documentation changes were needed. The docs phase for run `review-3-rest-api` is a no-op: the doc plan was deliberately empty (zero tasks), and this review independently confirmed, against the actually-shipped code, that no live documentation surface goes stale now that the run landed.

The run shipped 3 new `rest-api-*` scenario directories (`rest-api-custom-field-on-post`, `rest-api-route-validation`, `rest-api-permission-check`, each with a `scenario.yaml` + `e2e.spec.mjs`) and an in-place REST API promotion of `eval/scenarios/_wp-dev-candidates.yaml` (one stub promoted to full, two new full records, one stub annotated `# Deferred:`, one header-line fix). None of this required an external-doc edit.

## Why

The shipped artifacts are self-describing planning/data and test files, and the spec forbids duplicating their content (prompt/acceptance/provenance) in external docs because it would drift. The repo's live prose surfaces do not enumerate scenarios, claim a scenario count, assert which areas the eval suite covers, or describe a scenario-naming convention — so the new prefixed names and the in-place catalog edit leave nothing out of sync. The README's "two candidate catalogs" pointer stays accurate because the catalog was edited in place (not renamed or added) and REST API is already one of the developer.wordpress.org areas its role spans. The one genuinely stale line — the catalog header listing which areas have full prompt+acceptance — was correctly owned and fixed by the code phase (it now lists REST API), because that header travels with the records it describes inside the same self-describing file.

## How

End-to-end live-doc sweep, verified surface by surface against the shipped code:

- Enumerated every live prose surface in the repo: `README.md`, `.rp.md`, `eval/prompts/improver.md`, `eval/prompts/testing-agent.md`, `eval/rubrics/wp-interactivity-api-best-practices.md`.
- Grepped all of them (and the code/config) for `rest`, `candidate`, `catalog`, `_wp-dev`, `register_rest`, scenario-count, and naming-convention prose — confirming no live doc enumerates/counts scenarios or describes a naming scheme.
- README "two candidate catalogs" pointer: confirmed the catalog was edited **in place** via the shipped diff, and that its role ("spanning the developer.wordpress.org areas") still holds — the catalog header lists REST API as one of the 10 areas.
- README `(e.g. counter, cpt-register)` line: confirmed both directories still exist; the line is an illustration, not an enumeration.
- Catalog header line: confirmed the code phase's fix landed — now "Plugins, Block Editor, and REST API scenarios" — and that it is accurate against the three full REST records that now carry `prompt`+`acceptance`.
- Confirmed the three shipped `scenario.yaml` `name`s equal their directory names (catalog records describe real scenarios).
- Confirmed `eval/scenarios/_candidates.yaml` (iAPI catalog) and everything under `skills/` are byte-untouched via `git diff --stat`.

## Key decisions

- **Empty plan is the correct outcome.** Editing surfaces "just because the run is large" would be churn that risks turning illustrations into drift-prone enumerations and duplicating self-describing content the spec forbids.
- **The one stale surface (catalog header line) is a code-phase surface, not a docs task.** It is a comment inside a self-describing data file and travels with the records it describes; it was correctly fixed by code Task 4.

## Known limitations

- A forward naming inconsistency exists by design: the new `rest-api-*` scenarios sit beside non-prefixed older scenarios. No live doc describes a naming convention, so nothing is stale; a suite-wide rename is explicitly out of scope. This is recorded in the design, not a documentation gap.
