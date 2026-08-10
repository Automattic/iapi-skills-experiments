# Review: Themes area scenarios

## Origin

This review continues the owner's standing instruction (given when kicking off review-2):

> Kick off the next review and don't ask me for the next ones. Make sure they explore the possibility of using folders.

Boundaries (standing instruction, applied here):
- **Continue area-by-area coverage autonomously** — one top-level area per review, no pausing to ask between reviews.
- **This review's area: Themes** (Documentation → Theme Handbook). Areas already covered: Plugins (review-1), Block Editor (review-2), REST API (review-3).
- **The folders question is already resolved** (review-2): adopted `<area>-*` pseudo-folder naming. This review applies it (`themes-*`) — no re-exploration.

Convenience link: https://github.com/Automattic/wordpress-skill-experiments/issues/36 (PR #37).

## Goal

Extend the `wordpress-development` eval suite's coverage to the **Themes** area with simple, documentation-driven scenarios (~1 per major uncovered sub-area), building on the reference taxonomy and the `eval/scenarios/_wp-dev-candidates.yaml` candidate catalog established in review-1 (promoting the Themes records, not rebuilding the taxonomy). New scenarios use the adopted `themes-*` pseudo-folder naming.

## Constraints

- **Build on prior artifacts:** reuse the existing taxonomy + catalog; **promote this area's catalog stubs to full records**; do not rebuild the taxonomy.
- Scenarios stay **simple** (one concept, one small feature) and follow the existing conventions: `scenario.yaml` (+ optional `e2e.spec.mjs`); user-voice, **tool-agnostic** prompts; explicit `rubrics: []`; grounded in developer.wordpress.org.
- The **skill (`skills/wordpress-development/`) is not modified.**
- **One area (Themes) this review;** remaining areas are subsequent reviews.
- **No duplication** with covered sub-areas (Interactivity API, Plugins, Block Editor, REST API).
- **Apply the adopted `themes-*` pseudo-folder naming** (dir == `scenario.yaml` name == catalog record name; flat immediate children, `/^[a-z0-9-]+$/`). Existing scenarios are NOT renamed.
- Static/structural verification only; existing scenarios, the iAPI `_candidates.yaml`, and non-Themes catalog records untouched.

## Assumptions / directions to explore

*(open — research may confirm or revise)*

- **Harness feasibility is the key open question for Themes.** The Skillsmith scaffold builds a **plugin** (`plugin-<scenario>-<agentId>`), not a theme. The design must assess, per Themes sub-area, whether it is **plugin-expressible and front-end-visible** (e2e-feasible) or **theme-artifact-bound** (needs a theme the harness can't scaffold):
  - Likely e2e-feasible from a plugin: **enqueueing a stylesheet/script** (assert a `<link>`/`<script>` for the registered handle appears in the page HTML), **registering a block pattern**, adding a **theme support** (where it produces a front-end-visible effect).
  - Likely theme-artifact-bound (defer with recorded reasons, possibly surfacing a harness-limitation note as a future recommendation): **theme.json** settings/styles, **block templates / template parts**, the **template hierarchy**.
- The design picks ~1 simple scenario per major **uncovered, feasible** sub-area, e2e where feasible and judge-only/deferred otherwise — mirroring how review-2 handled scaffold nuances and review-1/3 handled e2e-vs-judge splits.
- If a substantial share of Themes is theme-artifact-bound, it is acceptable for this review to implement a smaller batch and record the rest as catalog stubs with reasons (a theme-scaffold harness change is out of scope, surfaced as a recommendation).
