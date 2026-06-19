# Code review — review-18-workflows: approved (orchestrator inline review)

**Verdict: approved.** Reviewed inline (two judge-only report scenarios, structure deterministically verified).

Change: commit `3e57ed9` — ships `project-triage/project-triage-report/` + `plugin-directory/plugin-directory-review/` (both judge-only) + promotes the last 2 gap stubs to full records under `# === Area: Agentic Workflows ===`. **The agent-skills gaps section is now empty — all 9 gaps shipped.**

Checks (all pass):
- **Both judge-only, well-formed:** each dir contains only `scenario.yaml`; `rubrics: []`; keys correct; no catalog-only fields; no URLs in acceptance; dir==name.
- **`project-triage-report`:** prompt describes a concrete wp-block-plugin repo (block.json, @wordpress/scripts, Composer/PHPStan/PHPUnit, no wp-env) and asks for a structured triage report; acceptance requires the report's three grounded sections (project inventory/kind, health/findings incl. tooling gaps, prioritized next actions). Grounded in the `wp-project-triage` skill (triage.schema.json fields).
- **`plugin-directory-review`:** prompt describes a plugin with deliberate compliance issues (non-dismissible sitewide upgrade banner; 8 readme tags with competitor names) alongside passing attributes (GPL-2.0+ header, MIT bundled lib, opt-in external connection, readable source, "for WooCommerce"); acceptance requires per-guideline PASS/FAIL/WARN verdicts (Guidelines 1/4/5/7/11/12/17) with grounded reasons. Grounded in the `wp-plugin-directory-guidelines` skill + the on-domain detailed guidelines. Excellent, gradeable design.
- **Catalog:** parses; 48 records; NO duplicates; one full record each (verbatim prompt/acceptance; honest `source_files` incl. on-domain detailed-plugin-guidelines for the directory one; `# Harness dependency:` notes); the `# === Agent-Skills Gaps ===` section is now empty (note: all 9 promoted).
- **Invariants:** skill untouched; iAPI `_candidates.yaml` byte-untouched; diff confined to the 2 new dirs + catalog. No project guardrails.

Relaxed-constraints basis: harness wall (report deliverables, not plugins → judge-only, dependency recorded), per "relax constraints, ship all".
