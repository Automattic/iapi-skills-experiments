# Code review — review-17-router: approved (orchestrator inline review)

**Verdict: approved.** Reviewed inline (single judge-only scenario, structure deterministically verified).

Change: commit `bf90e0a` — ships `eval/scenarios/wordpress-router/wordpress-router-classify/scenario.yaml` (judge-only) + promotes the gap stub to a full record under a new `# === Area: Agentic Workflows ===` section.

Checks (all pass):
- **Judge-only, well-formed:** dir contains only `scenario.yaml`; `rubrics: []`; keys correct; no catalog-only fields; no URLs in acceptance; dir==name.
- **Prompt:** user-voice; gives a concrete codebase description (block.json, src/ with edit.js/save.js, @wordpress/scripts, no functions.php/style.css/theme.json) and asks for the classification + routing decision with justification. Self-contained and gradeable.
- **Acceptance:** 4 judge-checkable criteria grounded in the wordpress-router taxonomy — names the project kind (from the 7-kind taxonomy); gives a clear routing decision (target workflow/skill); justifies from concrete file/tooling signals; demonstrates awareness of the intent-based routing categories. Well-grounded in the fetched `wordpress-router` skill.
- **Catalog:** parses; 48 records; NO duplicates; exactly one `wordpress-router-classify` full record (verbatim prompt/acceptance; off-domain `source_files` — the SKILL.md + decision-tree.md — cited honestly; `# Harness dependency:` note); removed from the gaps section (down to 2: triage, directory).
- **Invariants:** skill untouched; iAPI `_candidates.yaml` byte-untouched; diff confined to the new dir + catalog. No project guardrails.

Relaxed-constraints basis: harness wall (meta/workflow skill — no plugin deliverable → judge-only on the produced report, dependency recorded), per "relax constraints, ship all".
