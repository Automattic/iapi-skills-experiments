# Review: Common APIs area scenarios

## Origin

This review continues the owner's standing instruction (given when kicking off review-2):

> Kick off the next review and don't ask me for the next ones. Make sure they explore the possibility of using folders.

Boundaries (standing instruction, applied here):
- **Continue area-by-area coverage autonomously** — one top-level area per review, no pausing to ask between reviews.
- **This review's area: Common APIs** (Documentation → Common APIs Handbook). Areas already covered: Plugins (review-1), Block Editor (review-2), REST API (review-3), Themes (review-4).
- **The folders question is already resolved** (review-2): adopted `<area>-*` pseudo-folder naming. This review applies it (`common-apis-*`) — no re-exploration.

Convenience link: https://github.com/Automattic/wordpress-skill-experiments/issues/36 (PR #37).

## Goal

Extend the `wordpress-development` eval suite's coverage to the **Common APIs** area with simple, documentation-driven scenarios (~1 per major **uncovered** sub-area), building on the reference taxonomy and the `eval/scenarios/_wp-dev-candidates.yaml` candidate catalog established in review-1 (promoting the Common APIs records, not rebuilding the taxonomy). New scenarios use the adopted `common-apis-*` pseudo-folder naming.

## Constraints

- **Build on prior artifacts:** reuse the existing taxonomy + catalog; **promote this area's catalog stubs to full records**; do not rebuild the taxonomy.
- Scenarios stay **simple** (one concept, one small feature) and follow the existing conventions: `scenario.yaml` (+ optional `e2e.spec.mjs`); user-voice, **tool-agnostic** prompts; explicit `rubrics: []`; grounded in developer.wordpress.org.
- The **skill (`skills/wordpress-development/`) is not modified.**
- **One area (Common APIs) this review;** remaining areas are subsequent reviews.
- **No duplication — this is the critical constraint for Common APIs.** The Common APIs Handbook overlaps heavily with the Plugin Handbook: **Metadata, Shortcodes, Settings/Options-as-settings, Cron, and Internationalization are already covered** by the Plugins scenarios (`post-meta-rest`, `shortcode-with-attr`, `settings-register`, `cron-event`, `i18n-textdomain`). Target only genuinely **uncovered** Common APIs sub-areas and do not re-do a covered one.
- **Apply the adopted `common-apis-*` pseudo-folder naming** (dir == `scenario.yaml` name == catalog record name; flat immediate children, `/^[a-z0-9-]+$/`). Existing scenarios are NOT renamed.
- Static/structural verification only; existing scenarios, the iAPI `_candidates.yaml`, and non-Common-APIs catalog records untouched.

## Assumptions / directions to explore

*(open — research may confirm or revise)*

- Candidate **uncovered** Common APIs sub-areas for simple scenarios: **Options API** (`add_option`/`update_option`/`get_option` used directly — distinct from the Settings API's `register_setting`), **Transients API** (`set_transient`/`get_transient`), **HTTP API** (`wp_remote_get`/`wp_remote_post`), **Rewrite API** (`add_rewrite_rule`/`add_rewrite_endpoint` for a custom URL), **Database** (`$wpdb`), **Filesystem** (`WP_Filesystem`). The design picks ~1 per major uncovered sub-area, deduping against the covered Plugins sub-areas.
- **e2e feasibility:** the **Rewrite API** is the most promising e2e candidate (register a custom URL/endpoint, navigate to it, assert the expected status/content — front-end-visible, like `filter-body-class`/REST scenarios; note rewrite rules typically need a permalink flush, which the design must account for). The data-oriented sub-areas (Options, Transients, HTTP API, Database, Filesystem) likely have no clean front-end surface and would be **judge-only** (first-class, as in prior reviews). e2e where feasible; judge-only/defer otherwise.
- A smaller batch is acceptable given the overlap; defer with recorded reasons any sub-area that is covered or not simply expressible.
