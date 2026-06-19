# Code review — review-21-plugins-rest-subareas: approved (after one fix)

**Verdict: approved** (the code-reviewer requested one change; it has been made and verified).

## The fix

The code-reviewer (sonnet) caught a real **strict-YAML discovery defect**: `plugins/user-role-check/scenario.yaml` had an `acceptance` item starting with a bare backtick (`` `current_user_can(...)` ``). The `yaml` package that Skillsmith's `enumerate.ts` uses treats a leading backtick as a reserved indicator and rejects the file ("Plain value cannot start with reserved character"), so the scenario would never be discovered. (Earlier verification used the lenient `js-yaml`, which accepted it — hence it slipped past the inline checks.)

Fixed (commit `86aef9c`) by wrapping that item in double quotes — a YAML-syntax-only change; the parsed value is identical, so the catalog record's verbatim `prompt`/`acceptance` still match (verified with the strict parser: both `acceptance` and `prompt` values equal between `scenario.yaml` and the `user-role-check` catalog record).

## Suite-wide strict validation (added)

Because the lenient parser had been masking this class of defect, every `scenario.yaml` in the suite was re-validated with the strict `yaml` package + the `Array.isArray(rubrics)` shape check: **all 61 scenario.yaml pass** strict YAML + the discovery shape. The only failure was `user-role-check` (now fixed); `project-triage-report` lines 13–14 were a false positive (they live inside the `prompt: |` block scalar, not a YAML list). No other scenario has a latent discovery defect.

## The rest of the batch (per the code-reviewer)

- **`plugins/ajax-handler` (e2e):** `scenario.yaml` pins action `my_plugin_ping`; `e2e.spec.mjs` uses the correct 3-level import, sync `deactivateAllPlugins()`, the agentId slug, and the authed admin channel `requestUtils.request.post("/wp-admin/admin-ajax.php?action=my_plugin_ping")` asserting `body.success === true` (the `check_ajax_referer` nonce is judge-graded — e2e can't mint a valid ajax nonce). `node --check` passes; Playwright collects 1 test; `my_plugin_ping` in lockstep.
- **3 judge-only** (`user-role-check`, `privacy-data-exporter`, `rest-api-authentication-nonce`): `scenario.yaml` only, `rubrics: []`, tool-agnostic, scenario-unique acceptance; `user-role-check` distinct from `rest-api-permission-check` (hook-callback capability gating, not a REST route); `rest-api-authentication-nonce` distinct (client-side nonce wiring vs server-side route auth).
- **Catalog:** parses; 47 records; no duplicates; the 4 shipped names promoted in place; **`http-api-remote-get` dropped** (superseded by `common-apis-http-request`, comment left); `# Harness dependency:` notes on the 3 judge-only; iAPI/skill untouched.

No project guardrails.
