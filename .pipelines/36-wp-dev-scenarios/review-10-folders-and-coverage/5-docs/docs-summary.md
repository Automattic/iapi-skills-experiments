# Docs Summary — review-10-folders-and-coverage

## What shipped

Two documentation artifacts were added in commit `ba3f919`:

**README.md** — the flat-scenario-layout prose is replaced by an accurate description of the seven per-topic folders (`interactivity-api/`, `plugins/`, `block-editor/`, `rest-api/`, `themes/`, `common-apis/`, `coding-standards/`) with `<topic>/<scenario>` addressing (e.g. `plugins/cpt-register`). A new "Skillsmith nested-discovery dependency" section documents precisely why nested scenarios are temporarily invisible to the pinned `@automattic/skillsmith` (`6bd90c34…`) and what two upstream changes are needed: (A) recursive discovery and (B) relative `dirName`. The accepted temporary-invisibility caveat, the Playwright no-change rationale, and the catalog-stays-at-root / new `# === Agent-Skills Gaps ===` section note are all present.

**.pipelines/36-wp-dev-scenarios/review-10-folders-and-coverage/agent-skills-coverage-map.md** — a durable planning artifact classifying all 17 `WordPress/agent-skills` topics against this repo's eval suite: 4 Covered, 1 Covered (partial), 3 Deferred-area, 9 Gap. Each of the nine gaps cross-links to its review-triggerable stub in `_wp-dev-candidates.yaml` with a sub-classification (buildable-plugin / review-workflow / harness-wall). Two explicit cross-terminology notes record that Coding Standards (WPCS/PHPDoc) ≠ `wp-phpstan` and Themes (classic surface) ≠ `wp-block-themes` core.

No skill file, scenario, catalog record, or harness file was changed by the doc commit.
