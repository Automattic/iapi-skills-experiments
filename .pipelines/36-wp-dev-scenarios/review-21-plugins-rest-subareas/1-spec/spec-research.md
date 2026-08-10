# Spec Research

## Rough Idea

Review: Plugins + REST sub-area scenarios (sub-area campaign 2/3)

Ship the genuinely-distinct stubs as scenarios (promote to full records); e2e where a clean assertion exists, judge-only otherwise. One stub needs a dedup decision.

Stubs in scope: `user-role-check`, `ajax-handler`, `privacy-data-exporter`, `http-api-remote-get` (Plugins area), `rest-api-authentication-nonce` (REST API area). New scenarios go into the existing `eval/scenarios/plugins/` and `eval/scenarios/rest-api/` folders.

Relaxed constraints: ship all; harness wall → judge-only with recorded dependency.

## Q&A

### Q1: Does `http-api-remote-get` duplicate the shipped `common-apis-http-request`, and should it be dropped?

**A:** Yes — it is a full duplicate and should be dropped. `common-apis-http-request` is a fully-shipped record (full prompt + acceptance, in the catalog under the Common APIs area, directory `eval/scenarios/common-apis/common-apis-http-request/`). It covers exactly the same concept: `wp_remote_get`, `is_wp_error`/error check before use, and `wp_remote_retrieve_body`. The Plugins-area stub `http-api-remote-get` has no prompt or acceptance (stub only) and was explicitly left untouched by review-5 pending this dedup decision. Shipping a new scenario on top of the existing `common-apis-http-request` would be a duplicate; the stub must be dropped (removed from the catalog, citing `common-apis-http-request` as the existing coverage).

**Reasoning:** The catalog record for `common-apis-http-request` has `concepts: [wp_remote_get, wp_remote_retrieve_body, is_wp_error]` and its acceptance requires an outbound GET, error check, response-body extraction, and invocation from a hook callback — identical in concept to the `http-api-remote-get` stub (`concepts: [wp_remote_get, wp_retrieve_body, WP_Error]`). No distinct angle exists: the only difference is area-folder (Plugins vs. Common APIs), and the HTTP API is already grounded to both handbooks. Review-5 explicitly left the stub untouched pending this dedup decision.

**Sources:** `eval/scenarios/_wp-dev-candidates.yaml` lines 375–383 (stub), 458–474 (shipped record); `.pipelines/36-wp-dev-scenarios/review-5-common-apis/1-spec/spec.md` requirements 16 and Out-of-Scope item 4.

### Q2: Is `ajax-handler` feasible as e2e, or does the harness wall make it judge-only?

**A (initial read):** Judge-only appeared likely — the harness has `requestUtils.rest()` for authenticated REST but no obvious admin-ajax POST + nonce helper. Admin-ajax requires a CSRF nonce that is only available after an authenticated browser session.

**Update after spec-researcher answer:** E2E IS FEASIBLE. `requestUtils.request` is a raw Playwright `APIRequestContext` carrying admin cookies — it can `POST` to any URL including `/wp-admin/admin-ajax.php?action=<action>`. `wp_send_json_success()` returns `{"success":true,"data":...}` — a clean JSON assertion. The nonce (`check_ajax_referer`) is a wrinkle but not a blocker: the e2e asserts the authed admin POST returns `{"success":true}` JSON (proving `wp_ajax_<action>` + `wp_send_json_success` are wired); the judge grades the `check_ajax_referer` call statically. This two-part hybrid mirrors the `rest-api-permission-check` anon/authed split pattern.

**Final determination:** `ajax-handler` is **e2e** (with nonce verification graded by judge in acceptance). Directory `plugins/`. No `# Harness dependency:` note (not judge-only-because-of-harness).

**Sources:** spec-researcher Q2 answer; `eval/scenarios/rest-api/rest-api-permission-check/e2e.spec.mjs`; `https://developer.wordpress.org/reference/functions/wp_send_json_success/`.

### Q3: Is `user-role-check` genuinely distinct from `rest-api-permission-check`, and is it e2e-feasible?

**A:** Genuinely distinct; judge-only. `rest-api-permission-check` gates a registered REST route via its `permission_callback` — it is a REST-API concept that uses `current_user_can` only as the underlying check within a REST-specific hook. `user-role-check` (`current_user_can` in a general plugin action/hook callback) is a different concept: capability gating in an arbitrary plugin context, not REST routing. Zero function surface overlap (REST uses `register_rest_route` + `permission_callback`; the Plugins scenario uses just `current_user_can` on a hook). These are distinct handbook chapters: Plugin Handbook > Users (`/plugins/users/`) vs. REST API auth.

Not e2e-feasible: `current_user_can` gating in a hook callback produces no observable front-end URL response — it silently skips an action when the capability check fails, giving nothing to assert against from the test runner. Graded statically: `current_user_can('<cap>')` called to gate an action, correct capability, check happens before the sensitive operation, gated branch is skipped when the cap is absent.

**Reasoning:** `rest-api-permission-check/scenario.yaml` prompt pins "The access gate must be enforced by the route's permission check." The `user-role-check` covers the general plugin case (blocking an action in a hook) — different mental model and chapter. Spec-researcher confirmed: distinct + judge-only. To stay clean of duplication, the prompt must NOT gate a REST route.

**Sources:** `eval/scenarios/rest-api/rest-api-permission-check/scenario.yaml`; `eval/scenarios/_wp-dev-candidates.yaml` lines 365–373 (user-role-check stub); spec-researcher Q3 answer; `https://developer.wordpress.org/plugins/users/`; `https://developer.wordpress.org/reference/functions/current_user_can/`.

### Q4: Is `rest-api-authentication-nonce` judge-only, and what is the judge-only scope?

**A:** Judge-only. The concept is the PHP side of the REST nonce flow: `wp_create_nonce('wp_rest')`, `wp_localize_script` to pass the nonce and REST URL to JS, and `rest_url()` — plus a JS snippet that reads the localized nonce and sends it as `X-WP-Nonce` on a fetch. The JS fetch side cannot be asserted without a live browser fetch + JS toolchain — the harness has no pattern for client-side JS fetch assertions on arbitrary enqueued scripts. The existing stub already had `# Deferred: JS-only nonce flow`; on promotion that becomes `# Harness dependency:`. Distinct from `rest-api-permission-check` (server-side route auth): this scenario is about client-side credential passing from PHP-localized data.

Graded statically: PHP calls `wp_create_nonce('wp_rest')` + `wp_localize_script` exposing `rest_url()` + nonce; a JS snippet reads the localized nonce and sends it as `X-WP-Nonce` on a fetch to a rest_url path.

**Sources:** `eval/scenarios/_wp-dev-candidates.yaml` lines 592–600 (stub); spec-researcher Q4 answer; `https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/` (canonical cookie auth + nonce section).

### Q5: Is `privacy-data-exporter` judge-only, and what is the grounding URL?

**A:** Judge-only. The personal-data exporter only runs inside the admin Tools > Export Personal Data wizard (admin-driven, multi-step, requires entering an email + confirming). No public URL, no REST route, not exercisable by a simple authed GET/POST. e2e would require driving the full admin privacy wizard UI — well out of scope.

Graded statically: `add_filter('wp_privacy_personal_data_exporters', cb)` registered; callback returns an array entry with `exporter_friendly_name` (translatable) + `callback`; exporter callback returns the `data`/`done` shape with at least one well-formed item (`group_id`, `group_label`, `item_id`, `data` array of name/value pairs).

Grounding: `https://developer.wordpress.org/plugins/privacy/adding-the-personal-data-exporter-to-your-plugin/` (canonical how-to, primary). `https://developer.wordpress.org/plugins/privacy/` (landing, secondary).

**Sources:** spec-researcher Q5 answer; `https://developer.wordpress.org/plugins/privacy/adding-the-personal-data-exporter-to-your-plugin/` (verified on-domain).

## Research

### Existing e2e harness patterns

- All existing e2e specs import from `@wordpress/e2e-test-utils-playwright` and `deactivateAllPlugins` from `../../../utils/wp-cli.mjs` (3-level import from scenario dir).
- `requestUtils.activatePlugin(name)` in `beforeAll`; `deactivateAllPlugins()` in `afterAll`.
- Two authenticated channels: `requestUtils.rest({path})` (REST API, authenticated admin); `requestUtils.request` (raw Playwright `APIRequestContext` carrying admin cookies, can POST to any URL).
- Unauthenticated channel: `page.request.get(url)`.
- No admin-ajax pattern exists yet, but `requestUtils.request.post('/wp-admin/admin-ajax.php?action=<action>')` is feasible.
- No `e2e.spec.mjs` exists for any of the stubs in this batch.

### Scenarios that already exist (and must not be duplicated)

In `eval/scenarios/rest-api/`: `rest-api-custom-field-on-post`, `rest-api-permission-check`, `rest-api-route-validation`, `rest-custom-endpoint`.
In `eval/scenarios/plugins/`: `admin-menu-page`, `cpt-register`, `cron-event`, `filter-body-class`, `i18n-textdomain`, `post-meta-rest`, `settings-register`, `shortcode-with-attr`, `taxonomy-register`.

`rest-api-permission-check` gates a REST route via `permission_callback` — distinct from `user-role-check` which gates a plugin action via `current_user_can` in a hook.

### http-api-remote-get dedup confirmation

`common-apis-http-request` (shipped, full record): concepts `[wp_remote_get, wp_remote_retrieve_body, is_wp_error]`, acceptance requires outbound GET + error check + response-body extraction + call from hook callback. `http-api-remote-get` stub: concepts `[wp_remote_get, wp_retrieve_body, WP_Error]`. Identical concept. The Plugins stub has no distinct angle; drop it.

### Grounding URLs per scenario

- `ajax-handler`: `https://developer.wordpress.org/plugins/javascript/ajax/` (wp_ajax_ hooks), `https://developer.wordpress.org/reference/hooks/wp_ajax_action/`
- `user-role-check`: `https://developer.wordpress.org/plugins/users/` (Roles and Capabilities, Principle of Least Privileges), `https://developer.wordpress.org/reference/functions/current_user_can/`
- `privacy-data-exporter`: `https://developer.wordpress.org/plugins/privacy/adding-the-personal-data-exporter-to-your-plugin/`, `https://developer.wordpress.org/plugins/privacy/`
- `rest-api-authentication-nonce`: `https://developer.wordpress.org/rest-api/using-the-rest-api/authentication/` (primary, cookie auth + nonce), `https://developer.wordpress.org/rest-api/using-the-rest-api/`, `https://developer.wordpress.org/rest-api/key-concepts/`

## Consolidated Requirements

### Batch composition

1. **Four scenarios ship; one stub is dropped.** The shipped batch is: (i) `ajax-handler` — e2e; (ii) `user-role-check` — judge-only; (iii) `privacy-data-exporter` — judge-only; (iv) `rest-api-authentication-nonce` — judge-only. The `http-api-remote-get` stub is dropped as a duplicate of the already-shipped `common-apis-http-request` scenario and removed from the catalog, with a comment citing `common-apis-http-request` as the existing coverage.

2. **`http-api-remote-get` stub is removed from `_wp-dev-candidates.yaml`, not promoted.** The removal note cites `common-apis-http-request` (shipped under Common APIs, covering `wp_remote_get` + `is_wp_error` + `wp_remote_retrieve_body`) as the reason. No new `http-api-remote-get` scenario directory is created.

### Per-scenario: ajax-handler

3. **`ajax-handler` is an e2e scenario in `eval/scenarios/plugins/ajax-handler/`.** It ships a `scenario.yaml` and an `e2e.spec.mjs`. The prompt asks (in user voice, tool-agnostic) for a plugin to handle an authenticated admin-ajax request and return a JSON success response. The `name` field equals `ajax-handler` and matches the directory name.

4. **The `ajax-handler` e2e spec uses `requestUtils.request.post('/wp-admin/admin-ajax.php?action=<action>')` to send an authenticated admin POST and asserts the JSON response contains `"success": true`.** It follows the established lifecycle: imports from `@wordpress/e2e-test-utils-playwright` and `deactivateAllPlugins` from `../../../utils/wp-cli.mjs`, activates `plugin-ajax-handler-${agentId}` in `beforeAll`, deactivates all in `afterAll`.

5. **The `ajax-handler` acceptance includes a static judge criterion for `check_ajax_referer`.** Because the e2e cannot mint a valid WordPress ajax nonce for the POST, `check_ajax_referer` (or equivalent nonce verification) is required in the produced PHP but graded by the judge against the code, not asserted via the e2e POST. The acceptance also requires `wp_send_json_success()` and the `wp_ajax_<action>` hook.

6. **The action name used in `ajax-handler` is pinned in the prompt** so the e2e assertion can reference a known action string.

### Per-scenario: user-role-check

7. **`user-role-check` is a judge-only scenario in `eval/scenarios/plugins/user-role-check/`.** It ships a `scenario.yaml` only (no `e2e.spec.mjs`). The prompt asks (user voice, tool-agnostic) for a plugin to check whether the current user has a capability before performing a sensitive action, and to skip the action when the capability is absent.

8. **`user-role-check` is distinct from `rest-api-permission-check`.** The prompt must not gate a REST route or register a REST endpoint. The concept is general capability gating in a plugin hook callback using `current_user_can`, not REST route authorization.

9. **`user-role-check` acceptance is judge-graded on the PHP.** The acceptance requires: `current_user_can('<capability>')` is called before the sensitive operation; the sensitive action is skipped (or an appropriate response is returned) when the capability is absent; a specific named capability (e.g., `manage_options` or `edit_posts`) is checked. A `# Harness dependency:` comment notes that capability gating has no HTTP surface and is judge-graded statically.

### Per-scenario: privacy-data-exporter

10. **`privacy-data-exporter` is a judge-only scenario in `eval/scenarios/plugins/privacy-data-exporter/`.** It ships a `scenario.yaml` only. The prompt asks (user voice, tool-agnostic) for a plugin to register a personal data exporter so user data can be exported for privacy compliance.

11. **`privacy-data-exporter` acceptance is judge-graded on the PHP.** The acceptance requires: the exporter is registered via the `wp_privacy_personal_data_exporters` filter; the registered entry has a human-readable name (translatable) and a callback; the callback returns an array with `data` (array of items) and `done` (boolean) keys; each item has at least `group_id`, `group_label`, `item_id`, and a `data` array of name/value pairs. A `# Harness dependency:` comment notes that the personal-data exporter only runs in the admin export wizard and has no public HTTP surface.

### Per-scenario: rest-api-authentication-nonce

12. **`rest-api-authentication-nonce` is a judge-only scenario in `eval/scenarios/rest-api/rest-api-authentication-nonce/`.** It ships a `scenario.yaml` only. The prompt asks (user voice, tool-agnostic) for a plugin to expose the REST API endpoint URL and a nonce to JavaScript so a browser script can make authenticated REST requests.

13. **`rest-api-authentication-nonce` acceptance is judge-graded on the PHP and JS.** The acceptance requires: `wp_create_nonce('wp_rest')` is called to generate the nonce; `wp_localize_script` passes the nonce and `rest_url()` to JavaScript; the JS snippet reads the localized nonce and sends it as `X-WP-Nonce` in a fetch request to a REST API URL. A `# Harness dependency:` comment notes that the JS nonce flow requires a JS toolchain and live browser cookie session to exercise end-to-end and is judge-graded statically.

14. **`rest-api-authentication-nonce` is distinct from `rest-api-permission-check`.** `rest-api-permission-check` is about server-side route authorization; this scenario is about client-side credential passing (PHP localizes the nonce; JS sends it). The existing `# Deferred:` comment in the stub is replaced by `# Harness dependency:` on promotion.

### Schema and catalog

15. **Each shipped `scenario.yaml` has exactly the keys `name`, `description`, `skills`, `prompt`, `acceptance`, and `rubrics`.** `name` is lowercase-kebab matching the directory name. `rubrics: []`. No catalog-only fields (`difficulty`, `concepts`, `source`, `source_files`) appear in any `scenario.yaml`. Prompts are user-voice and tool-agnostic (no function or API names). Acceptance strings are human-readable checks with no embedded URLs.

16. **Each shipped scenario gets a full catalog record in `_wp-dev-candidates.yaml` under its Plugins or REST API area section**, promoted in place from its stub. The record carries `name`, `description`, `difficulty`, `concepts`, `source`, `source_files` (grounding developer.wordpress.org URLs), `prompt`, and `acceptance` — with `prompt` and `acceptance` verbatim-matching the `scenario.yaml`. The `# TODO: prompt + acceptance` and `# Deferred:` stub comments are removed on promotion.

17. **Stubs promoted in place; exactly one record per name; no duplicates.** Each stub's existing catalog entry is promoted to a full record at the same location in the catalog (no new area sections added). After the update, each scenario name appears exactly once in the catalog.

### Harness dependency notes

18. **`user-role-check`, `privacy-data-exporter`, and `rest-api-authentication-nonce` each carry a `# Harness dependency:` comment** in their catalog record (not in `scenario.yaml`) explaining why the scenario is judge-only (no HTTP surface / JS toolchain required / admin-wizard-only). `ajax-handler` does not carry this note (it ships an e2e spec).

### Non-disruption

19. **Skill untouched.** No file under `skills/wordpress-development/` is modified.

20. **Existing scenarios untouched.** The existing Plugins and REST API scenarios, the iAPI `_candidates.yaml`, and all non-Plugins/non-REST-API catalog records are not moved, renamed, reorganized, or broken.

21. **Flat discovery preserved.** New scenario directories are flat immediate children of the existing `eval/scenarios/plugins/` and `eval/scenarios/rest-api/` folders, matching Skillsmith's discovery convention.

22. **e2e specs use the 3-level import path.** `ajax-handler`'s `e2e.spec.mjs` imports `deactivateAllPlugins` from `"../../../utils/wp-cli.mjs"` (3 levels up from `eval/scenarios/plugins/ajax-handler/`).
