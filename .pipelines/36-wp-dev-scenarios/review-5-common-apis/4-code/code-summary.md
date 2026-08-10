# Code Summary: Common APIs scenarios

## What

Four Common APIs-area evaluation scenarios added to the Skillsmith eval suite under `eval/scenarios/`, plus a catalog reconciliation:

- `eval/scenarios/common-apis-rewrite-rule/` — `scenario.yaml` + `e2e.spec.mjs` (e2e). Asks the agent to serve the exact text `Hello from my plugin` at the custom URL `/my-custom-page` (not a 404, not a themed page), live immediately on activation; asserts `page.request.get("/my-custom-page")` returns status 200 and the body `toContain("Hello from my plugin")`.
- `eval/scenarios/common-apis-options/` — `scenario.yaml` only (judge-only). Asks the agent to imperatively store and read back a value under the namespaced key `my_plugin_setting`, defaulting to `enabled` when unset — framed explicitly as store/retrieve, not registering a setting for the admin UI.
- `eval/scenarios/common-apis-transients/` — `scenario.yaml` only (judge-only). Asks the agent to cache a computed value under the namespaced key `my_plugin_data` with an expiry and recompute it only after it expires — a standalone cache-with-expiry, decoupled from any HTTP call.
- `eval/scenarios/common-apis-http-request/` — `scenario.yaml` only (judge-only). Asks the agent to fetch data from an external web service from a hook callback, check for failure before using the response, and extract the body — endpoint-agnostic (no host pinned), no live call.
- `eval/scenarios/_wp-dev-candidates.yaml` — Common APIs section promoted: legacy stubs `options-api-store-retrieve` and `transient-cache-remote-data` renamed+promoted to full `common-apis-options` / `common-apis-transients` records (Transients reframed off the remote-data framing); new full `common-apis-rewrite-rule` and `common-apis-http-request` records added under an `# Implemented Common APIs scenarios — full records` sub-header; header line updated to list Common APIs.

## Why

The `wordpress-development` skill's eval suite had no Common APIs-area coverage — the catalog carried only two un-promoted Common APIs stubs. This batch adds the four genuinely uncovered Common APIs sub-areas (Rewrite, Options, Transients, HTTP API), bringing coverage from zero to four scenarios. The batch is deliberately small (one e2e + three judge-only) because the Common APIs Handbook overlaps heavily with the Plugin Handbook: Metadata, Shortcode, Settings, Cron, and i18n are already covered by existing scenarios and must not be re-done, and of the uncovered sub-areas only the Rewrite API yields a clean, theme-independent, front-end-observable assertion.

## How

All four scenarios follow the established Skillsmith conventions: flat immediate child of `eval/scenarios/`, schema-conformant `scenario.yaml` (name == directory name == catalog record name, six keys in order, `rubrics: []`, no catalog-only fields, tool-agnostic prompt, URL-free acceptance). The e2e scenario follows the `cpt-register` lifecycle verbatim (synchronous `deactivateAllPlugins()` in `beforeAll`/`afterAll`, `requestUtils.activatePlugin` with the slug derived from `workerInfo.project.metadata.agentId`, raw-HTTP `page.request.get` + status + body assertion, no seeding, no new `eval/utils/` helper). The three judge-only scenarios mirror the existing `cron-event` / `admin-menu-page` / `i18n-textdomain` pattern (`scenario.yaml` only, graded by the judge against the produced PHP). Each catalog record's prompt and acceptance is verbatim-identical to its shipped `scenario.yaml`.

## Key decisions

- **Dedup-driven four-scenario batch (one e2e + three judge-only).** Only genuinely uncovered Common APIs sub-areas were candidates; of those, only Rewrite produces a clean front-end-observable assertion, so it is e2e and Options/Transients/HTTP (data-oriented, no front-end surface) are judge-only. Explicitly permitted by the intent given the handbook overlap.
- **Rewrite asserts the raw HTTP response, not DOM.** A custom rewrite rule mapping to a custom query var 404s by default unless the var is registered and a `template_redirect` handler emits 200 + body + exit. The prompt steers to "returns this exact text at this exact URL" (without naming functions) and the acceptance bakes in the 200, the token, the intercept-before-template, and the activation flush — so a bare `add_rewrite_rule()` fails for the right reason. `page.request.get` reads the plugin's raw output and is theme-independent.
- **Options kept distinct from `settings-register`.** Framed as imperatively storing/reading a value (zero function overlap with the Settings API), not declaring a setting's schema for the admin UI.
- **Transients decoupled from HTTP.** The legacy stub over-coupled caching to a remote fetch; the reframed scenario caches an arbitrary computed value with an expiry, keeping it distinct from `common-apis-http-request`.
- **HTTP graded statically, no live call.** No `e2e.spec.mjs`, no live-200 criterion, no host pinned; the graded signal is the make-request → check-error → read-body pattern, so the scenario is independent of outbound network. The `is_wp_error` error-handling point is grounded to the second `wp_remote_get` reference `source_file`.
- **Plugins `http-api-remote-get` stub left untouched.** HTTP coverage is added as a new Common APIs record re-grounded to `/apis/making-http-requests/`; the accepted near-duplicate (un-promoted Plugins stub + new Common APIs record) stands because the HTTP API is documented in both handbooks and non-Common-APIs records are a hard untouched constraint.

## Known limitations

- **Database (`$wpdb`) and Filesystem (`WP_Filesystem`) are deferred.** Neither fits the "simple, one concept, tool-agnostic" bar (raw `$wpdb` needs a custom table and names the database; `WP_Filesystem` needs multi-step credential bootstrapping). Neither has a catalog stub today, so neither gets a new one; their defer reasons live only in the spec and design doc.
- **Three of four scenarios are judge-only.** Options, Transients, and HTTP have no front-end-observable surface (data lives in the options/transient store; the HTTP scenario performs no live call by design), so they are graded solely by an LLM judge against the produced PHP.
- **Scenarios are not required to pass against the current skill.** Per the spec, the bar is static/structural only (discoverable + e2e-collectable). A failing grade against the current skill is acceptable; the skill catches up in later work.
