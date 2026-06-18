# Review: exhaustive, area-by-area WordPress-development scenario coverage

## Origin

The owner requested a **review** of the v1 pipeline for issue #36 (PR #37). Faithful paraphrase of the request:

> Run a review to add many more scenarios. Have the agents go through the links on developer.wordpress.org — both the **Documentation** section (Block Editor, Themes, Plugins, …) and the **API Reference** (Code Reference, REST API, …), and analyze their **subsections** too. Do an exhaustive analysis to create simple scenarios covering anything related to WordPress development. It may help to first create a **structure of the wordpress-development references** and, from that structure, create scenarios for each — similar to what exists for the Interactivity API.

Boundaries agreed with the owner before this run (from a short scoping Q&A):
- **Split by area**, sequential reviews; each area has **sub-areas**. This review builds the exhaustive taxonomy/catalog (all areas/sub-areas) and implements **one area's** scenarios (~1 per major sub-area). Remaining areas are follow-up reviews.
- The "reference structure" is a **planning/taxonomy artifact**; the **skill is not modified**.

Convenience link: https://github.com/Automattic/wordpress-skill-experiments/issues/36 (PR #37).

## Goal

The `wordpress-development` eval suite systematically covers the breadth of WordPress development, driven by an **exhaustive analysis of developer.wordpress.org** — both the Documentation sections and the API Reference, including their subsections. A **reference taxonomy** of WordPress-development topics (areas → sub-areas) organizes the work, and simple, documentation-driven scenarios are created for each topic, delivered **batch by batch across area-scoped reviews**. This review establishes the taxonomy and an exhaustive candidate catalog, and implements the scenarios for the **first area**.

## Constraints

- Scenarios stay **simple** (one concept, one small feature) and follow the existing conventions: Skillsmith `scenario.yaml` (+ optional `e2e.spec.mjs`); user-voice, **tool-agnostic** prompts; explicit `rubrics: []`; grounded in developer.wordpress.org.
- The **skill (`skills/wordpress-development/`) is not modified** — the "reference structure" is a planning/taxonomy artifact, not skill changes.
- **Batched by area:** this review implements **one area's** scenarios (~1 per major sub-area); the remaining areas are explicit follow-up reviews. Do **not** implement the whole catalog in one run.
- **Build on the existing suite** — don't reorganize or break the existing scenarios; respect Skillsmith's flat discovery under `eval/scenarios/`. Avoid duplicating sub-areas already covered by the v1 batch (`filter-body-class`, `shortcode-with-attr`, `cpt-register`, `rest-custom-endpoint`).
- Shared rubrics only where genuinely cross-cutting; never duplicate between a rubric and scenario `acceptance`.

## Context

- This is **review-1** on the v1 pipeline for issue #36 (PR #37), which delivered the first four non-Interactivity-API scenarios alongside the existing Interactivity API suite.
- The existing Interactivity API candidate catalog (`eval/scenarios/_candidates.yaml`) is precedent for a committed candidate-catalog artifact.

## Assumptions / directions to explore

*(open — research may confirm or revise)*

- A taxonomy mirroring developer.wordpress.org's structure (areas → sub-areas) is the backbone; the catalog should be **exhaustive** (all areas/sub-areas) even though only the first area is implemented this review.
- Skillsmith discovers only **immediate children** of `eval/scenarios/` (flat), so "structure" likely means a **catalog/taxonomy document + naming conventions**, not nested scenario folders — research to confirm and propose how to reflect structure without breaking discovery.
- The **first area is open** — the design phase should pick a sensible foundational area from the taxonomy (and justify it), implementing ~1 simple scenario per major sub-area, while avoiding duplication with the v1 batch.
- Whether/which simple shared rubrics to add for cross-cutting concerns (security/escaping/sanitization, i18n, coding standards) is open.
