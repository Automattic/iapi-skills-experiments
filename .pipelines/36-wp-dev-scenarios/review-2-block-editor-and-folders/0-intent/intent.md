# Review: Block Editor scenarios + explore folder organization

## Origin

After review-1 completed, the owner directed:

> Kick off the next review and don't ask me for the next ones. Make sure they explore the possibility of using folders.

Boundaries / interpretation (standing instruction):
- **Continue area-by-area coverage autonomously.** This review (review-2) implements the next uncovered top-level area; the remaining areas proceed as further reviews **without pausing to ask the owner between them**.
- **This review's area: the Block Editor** — its non-Interactivity-API sub-areas (the Interactivity API sub-area is already saturated by the existing 11 iAPI scenarios).
- **Explore using folders** to organize scenarios (subdirectories under `eval/scenarios/`), including the Skillsmith flat-discovery constraint and any harness/config implications; recommend, and adopt if low-risk.

Convenience link: https://github.com/Automattic/wordpress-skill-experiments/issues/36 (PR #37).

## Goal

Extend the `wordpress-development` eval suite's coverage to the **Block Editor** area with simple, documentation-driven scenarios (~1 per major uncovered sub-area), building on the reference taxonomy and the `eval/scenarios/_wp-dev-candidates.yaml` candidate catalog established in review-1 (not rebuilding them). In parallel, **evaluate whether scenarios can be organized into topic folders** and, if feasible and low-risk, adopt that organization.

## Constraints

- **Build on review-1's artifacts:** reuse the existing reference taxonomy (in review-1's design doc) and the committed catalog `eval/scenarios/_wp-dev-candidates.yaml` — promote this area's catalog stubs to full records; do **not** rebuild the taxonomy or re-derive the whole catalog.
- Scenarios stay **simple** (one concept, one small feature) and follow the existing conventions: `scenario.yaml` (+ optional `e2e.spec.mjs`); user-voice, **tool-agnostic** prompts; explicit `rubrics: []`; grounded in developer.wordpress.org.
- The **skill (`skills/wordpress-development/`) is not modified.**
- **One area (Block Editor) this review;** remaining areas are subsequent reviews.
- **No duplication:** target Block Editor sub-areas not already covered (the Interactivity API sub-area is saturated; Plugins sub-areas were covered by v1 + review-1).
- **Folders exploration must respect Skillsmith discovery:** real subdirectories only if discovery supports them or a low-risk harness/config change enables them. Do **not** destabilize the existing suite — a large reorganization of the existing 21 scenarios is out of scope for this review (surface it as a recommendation) unless it is trivially safe.

## Assumptions / directions to explore

*(open — research may confirm or revise)*

- Candidate Block Editor sub-areas for simple scenarios: block registration (`block.json` + render), dynamic/server-rendered blocks, block supports, block variations, block styles, block patterns, block bindings, InnerBlocks. The design picks ~1 per major **uncovered** sub-area, e2e where feasible (the existing block scaffold supports block plugins).
- **Folders:** review-1 found Skillsmith's `enumerate.ts` reads only the immediate children of `eval/scenarios/` (flat). The design should confirm this and assess the options — real subdirectories via a low-risk harness/config change, naming-convention "pseudo-folders" (e.g. area-prefixed scenario names), or staying flat — and recommend with a clear rationale, adopting only if low-risk. Account for both the new Block Editor scenarios and whether/how existing scenarios + the two `_*-candidates.yaml` catalogs would be affected.
- The block scaffold (`eval/prompts/testing-agent.md`, the `wp-skill` testing block) already supports block plugins and can be reused for Block Editor e2e scenarios.
