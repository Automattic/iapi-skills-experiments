# Review: Block Editor sub-area scenarios (sub-area campaign 1/3)

## Origin

Owner: *"kick all the subareas reviews"* — ship scenarios for the remaining within-area sub-topic catalog stubs (the 11 records without prompts in `_wp-dev-candidates.yaml`). Same **relaxed-constraints** posture as the just-completed gaps/deferred campaign: ship all; off-domain grounding allowed where canonical (these are on-domain); **harness wall = ship judge-only with a recorded `# Harness dependency:` note** (JS toolchain / editor-only behavior now acceptable). This is **sub-area review 1 of 3**.

This review's batch — the **5 Block Editor** stubs (all currently `# Deferred:` or stub, no scenario dir): `block-api-static-block`, `block-filter-add-custom-attribute`, `block-editor-block-variations`, `block-editor-inner-blocks`, `block-editor-block-patterns`. They ship into the **existing `eval/scenarios/block-editor/` folder**.

## Goal

Ship ~5 simple Block Editor sub-area scenarios, promoting the 5 stubs to full records. e2e where a clean runtime assertion exists, judge-only (with recorded dependency) otherwise.

## Constraints

- New scenarios go in **`eval/scenarios/block-editor/<scenario>/`** (existing topic folder); e2e specs use the **3-level** import `"../../../utils/wp-cli.mjs"`. Mirror the existing block-editor e2e scenarios (`block-editor-dynamic-block`, `block-editor-block-filters`, etc.).
- Simple, user-voice, **tool-agnostic** prompts; `rubrics: []`; skill untouched; iAPI `_candidates.yaml` + existing scenarios/records untouched. Keep the stub names.
- **Dedup** against the existing implemented Block Editor scenarios (dynamic-block, block-supports, block-styles, block-filters, block-bindings) — each new one must target a genuinely distinct sub-area.

## Assumptions / directions to explore (spec resolves)

- **`block-api-static-block`** — a basic static block (`registerBlockType`/`block.json` + `edit.js`/`save.js`). The foundational block scenario. JS toolchain; assess e2e (front-end renders the block's saved content) vs judge-only.
- **`block-filter-add-custom-attribute`** — JS `addFilter` on `blocks.registerBlockType` adding a custom attribute (distinct from the PHP `render_block` filter already covered by `block-editor-block-filters`). JS-only editor → likely judge-only.
- **`block-editor-block-variations`** — `registerBlockVariation` (JS-only editor registration) → likely judge-only.
- **`block-editor-inner-blocks`** — `InnerBlocks` with `allowedBlocks` (parent/child) → likely judge-only.
- **`block-editor-block-patterns`** — `register_block_pattern` (PHP) → assess e2e (the pattern is registered/exposed, e.g. via the patterns REST endpoint) vs judge-only.
- Per scenario: directory in `eval/scenarios/block-editor/`, tool-agnostic prompt, scenario-unique acceptance, `rubrics: []`, kind (e2e/judge), grounding (on-domain developer.wordpress.org/block-editor/...). Promote each stub IN PLACE to a full record (drop `# Deferred:`/stub markers, add verbatim prompt+acceptance, add a `# Harness dependency:` note where judge-only); exactly one record per name. Static/structural + e2e-collectable verification; pass not required.
