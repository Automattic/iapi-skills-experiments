# Review: Plugins + REST sub-area scenarios (sub-area campaign 2/3)

## Origin

Owner *"kick all the subareas reviews"* — continue shipping the remaining within-area sub-topic stubs. Relaxed constraints (ship all; harness wall → judge-only with recorded dependency). Sub-area review **2 of 3**.

This review's stubs (no scenario dir): `user-role-check`, `ajax-handler`, `privacy-data-exporter`, `http-api-remote-get` (Plugins area), `rest-api-authentication-nonce` (REST API area). New scenarios go into the **existing** `eval/scenarios/plugins/` and `eval/scenarios/rest-api/` folders.

## Goal

Ship the genuinely-distinct stubs as scenarios (promote to full records); e2e where a clean assertion exists, judge-only otherwise. **One stub needs a dedup decision** (below).

## Constraints

- New scenarios in existing folders: `plugins/<scenario>/` and `rest-api/<scenario>/`; e2e specs use the **3-level** import `"../../../utils/wp-cli.mjs"`; mirror existing scenarios in those folders.
- Simple, user-voice, **tool-agnostic** prompts; `rubrics: []`; skill untouched; iAPI + existing scenarios/records untouched. Keep stub names. Promote each stub IN PLACE to a full record (no duplicates).

## Assumptions / directions to explore (spec resolves)

- **`http-api-remote-get` — DEDUP DECISION (load-bearing).** This Plugins-area stub (`wp_remote_get` + `is_wp_error` + `wp_remote_retrieve_body`) appears **redundant with the already-shipped `common-apis-http-request`** (review-5, same HTTP-API concept). The spec must decide: **drop/supersede it** (it duplicates covered coverage — remove the stub or mark it superseded, citing `common-apis-http-request`), or find a genuinely distinct angle. Default expectation: **drop as redundant** (don't ship a duplicate).
- **`ajax-handler`** — admin-ajax (`wp_ajax_<action>`, `check_ajax_referer`, `wp_send_json_success`). Likely **e2e-feasible**: POST to `/wp-admin/admin-ajax.php?action=<action>` (authed) and assert the JSON response. Assess e2e vs judge-only. Folder `plugins/`.
- **`user-role-check`** — `current_user_can` capability gating. Distinct from `rest-api-permission-check` (which gates a REST route). Assess e2e (if it gates something observable) vs judge-only; likely judge-only. Folder `plugins/`.
- **`privacy-data-exporter`** — register a personal-data exporter (`wp_privacy_personal_data_exporters` filter). Likely judge-only (graded on the registered exporter). Folder `plugins/`.
- **`rest-api-authentication-nonce`** — REST nonce auth from JS (`wp_create_nonce('wp_rest')`, `X-WP-Nonce`, `wp_localize_script`/`rest_url`). Was deferred as a JS-only nonce flow needing a JS toolchain + browser fetch. Assess: judge-only (grade the PHP localize + JS fetch-with-nonce setup) vs e2e. Likely judge-only. Folder `rest-api/`.
- Per scenario: tool-agnostic prompt, scenario-unique acceptance, `rubrics: []`, kind, grounding (on-domain developer.wordpress.org). Catalog: promote in place; `# Harness dependency:` note for judge-only-because-of-harness ones; if `http-api-remote-get` is dropped, remove its stub (and note why). Static/structural + e2e-collectable verification; pass not required.
