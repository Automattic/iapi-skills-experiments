# Review: REST API area scenarios

## Origin

This review continues the owner's standing instruction (given when kicking off review-2):

> Kick off the next review and don't ask me for the next ones. Make sure they explore the possibility of using folders.

Boundaries (standing instruction, applied here):
- **Continue area-by-area coverage autonomously** — one top-level area per review, no pausing to ask between reviews.
- **This review's area: the REST API** (API Reference → REST API Handbook). The owner is not asked to pick it; the orchestrator selects the next area.
- **The folders question is already resolved** (review-2): real subdirectories are not low-risk (Skillsmith's external/pinned flat discovery), so the adopted convention is **`<area>-*` pseudo-folder naming** (flat directories with an area prefix). This review simply **applies** that convention (`rest-api-*`) — no re-exploration needed.

Convenience link: https://github.com/Automattic/wordpress-skill-experiments/issues/36 (PR #37).

## Goal

Extend the `wordpress-development` eval suite's coverage to the **REST API** area with simple, documentation-driven scenarios (~1 per major uncovered sub-area), building on the reference taxonomy and the `eval/scenarios/_wp-dev-candidates.yaml` candidate catalog established in review-1 (promoting the REST API records, not rebuilding the taxonomy). New scenarios use the adopted `rest-api-*` pseudo-folder naming.

## Constraints

- **Build on prior artifacts:** reuse the existing taxonomy + catalog; **promote this area's catalog stubs to full records**; do not rebuild the taxonomy.
- Scenarios stay **simple** (one concept, one small feature) and follow the existing conventions: `scenario.yaml` (+ optional `e2e.spec.mjs`); user-voice, **tool-agnostic** prompts; explicit `rubrics: []`; grounded in developer.wordpress.org.
- The **skill (`skills/wordpress-development/`) is not modified.**
- **One area (REST API) this review;** remaining areas are subsequent reviews.
- **No duplication:** target REST API sub-areas NOT already covered — in particular, the **custom-endpoint registration** sub-area is already covered by v1's `rest-custom-endpoint`, so this batch targets the *other* REST API sub-areas.
- **Apply the adopted `rest-api-*` pseudo-folder naming** for the new scenarios (dir == `scenario.yaml` name == catalog record name; flat immediate children, matching `/^[a-z0-9-]+$/`). The existing scenarios are NOT renamed.
- Static/structural verification only (as prior reviews); existing scenarios, the iAPI `_candidates.yaml`, and non-REST-API catalog records untouched.

## Assumptions / directions to explore

*(open — research may confirm or revise)*

- Candidate uncovered REST API sub-areas for simple scenarios: **modifying responses** (`register_rest_field` adding a field to an existing resource), **schema / argument validation** (route `args` with `validate_callback`/`sanitize_callback`), **authentication / permissions** (a `permission_callback` gating a route so anon gets 401 and authenticated gets 200), and possibly **global parameters** (`_fields`/`_embed`). The design picks ~1 per major uncovered sub-area.
- Verification: e2e where feasible via direct REST assertions (anon `page.request.get` and the authenticated `requestUtils` channel, as in v1's `cpt-register`/`rest-custom-endpoint` and review-2's settings scenario); judge-only where a clean runtime assertion isn't simple.
- The plugin scaffold hosts REST registrations cleanly (`rest_api_init`, `register_rest_route`, `register_rest_field`) — no theme artifact needed.
