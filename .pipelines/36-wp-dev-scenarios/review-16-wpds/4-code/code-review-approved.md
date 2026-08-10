# Code review — review-16-wpds: approved (orchestrator inline review)

**Verdict: approved.** Reviewed inline (single judge-only scenario, structure deterministically verified).

Change: commit `3787328` — ships `eval/scenarios/wpds/wpds-component-ui/scenario.yaml` (judge-only) + promotes the gap stub to a full record under a new `# === Area: WordPress Design System (wpds) ===` section.

Checks (all pass):
- **Judge-only, well-formed:** dir contains only `scenario.yaml`; `rubrics: []`; keys correct; no catalog-only fields; no URLs in acceptance; dir==name.
- **Prompt:** user-voice; asks for a small block-editor settings panel built with the official WordPress component library (`@wordpress/components`) rather than hand-rolled HTML/CSS, pinning a concrete UI (panel + labeled toggle + primary button). Naming the WordPress component library is acceptable (deliverable type == task).
- **Acceptance:** 5 judge-checkable JS/JSX criteria — imports + renders `Panel`/`PanelBody`; `ToggleControl` with `label`/`checked` (no raw `<input type=checkbox>`); `Button variant="primary"` (no raw `<button>`); all three from `@wordpress/components`; no raw-HTML replacements. Concrete and gradeable on the produced source.
- **Catalog:** parses; 48 records; NO duplicates; exactly one `wpds-component-ui` full record (verbatim prompt/acceptance; `source_files` cite on-domain `developer.wordpress.org/block-editor/reference-guides/components/` + the wpds SKILL.md; `# Harness dependency:` note); removed from the gaps section (down to 3: router, triage, directory).
- **Invariants:** skill untouched; iAPI `_candidates.yaml` byte-untouched; diff confined to the new dir + catalog. No project guardrails.

Relaxed-constraints basis: harness wall (no JS build/render step → judge-only on the produced JS/JSX, dependency recorded), per "relax constraints, ship all". Grounding is partly on-domain (`@wordpress/components`).
