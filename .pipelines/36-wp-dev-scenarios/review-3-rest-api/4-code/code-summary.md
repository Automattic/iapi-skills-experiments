# Code Summary: REST API scenarios

## What

Three new Skillsmith evaluation scenarios were added under `eval/scenarios/`, each a flat immediate child directory containing a `scenario.yaml` and an `e2e.spec.mjs`:

- `eval/scenarios/rest-api-custom-field-on-post/` — adds a top-level `reading_time` field to the Posts REST response using `register_rest_field`; verified by seeding a published post and asserting `reading_time === "5 min"` anonymously.
- `eval/scenarios/rest-api-route-validation/` — route argument validation constraining a `filter` param to an allowed set; verified by asserting HTTP 200 for `?filter=blue` and HTTP 400 for `?filter=purple`.
- `eval/scenarios/rest-api-permission-check/` — a permission-gated route at `/wp-json/example/v1/private`; verified by asserting HTTP 401 for anonymous access and `body === "This is private data."` for an authenticated admin via `requestUtils.rest`.

The existing catalog `eval/scenarios/_wp-dev-candidates.yaml` was updated in place: the `rest-api-custom-field-on-post` stub was promoted to a full record, two new full records were added, the `rest-api-authentication-nonce` stub was annotated `# Deferred`, and one stale header line was corrected.

## Why

The `wordpress-development` skill evaluation suite had no coverage of three major REST API sub-areas — modifying existing responses, schema/argument validation, and authentication/permissions. The only existing REST scenario (`rest-custom-endpoint`) covers route registration. These three scenarios close that coverage gap with one simple, doc-grounded scenario per sub-area, on the scale of prior batch reviews (v1 = 4, Plugins = 6, Block Editor = 5).

## How

Each scenario follows the established `rest-custom-endpoint` / `post-meta-rest` lifecycle verbatim:

- `beforeAll`: `deactivateAllPlugins()` + `requestUtils.activatePlugin(\`plugin-<name>-${workerInfo.project.metadata.agentId}\`)`. Scenario 1 additionally seeds a published post.
- `afterAll`: `deactivateAllPlugins()`. Scenario 1 additionally calls `requestUtils.deleteAllPosts()`.
- Assertions inline: scenarios 1 and 2 use the anonymous channel (`page.request.get`); scenario 3 uses both the anonymous channel (for 401) and the authenticated-as-admin channel (`requestUtils.rest`, returns parsed body, no `.status()`, throws on non-2xx).

No new `eval/utils/` helper was added. The scaffold, harness, Skillsmith, and skill are untouched.

## Key decisions

- **Modifying-responses scenario adds a top-level field, not `.meta`**: `register_rest_field` adds a top-level key; `register_meta` surfaces values under `.meta`. This keeps the new scenario distinct from the existing `post-meta-rest` scenario.
- **Validation scenario asserts observable 200/400 behavior, not a specific mechanism**: `enum`, `validate_callback`, or both yield the same accept/reject behavior. The prompt is tool-agnostic; the acceptance checks server-side rejection before the handler runs.
- **Permission scenario pins status 401 (not 403) for the anonymous case**: doubly grounded — the handbook example hardcodes `status: 401` and core's `rest_authorization_required_code()` returns 401 for logged-out callers regardless of implementation style.
- **Authenticated half asserts the body, never a status**: `requestUtils.rest` returns the parsed body and throws on non-2xx; calling `.status()` on its result would be a coding error.
- **`rest-api-*` pseudo-folder naming, no filesystem nesting**: flat immediate children match `/^[a-z0-9-]+$/`, keeping Skillsmith discovery, import paths, and `verify-e2e.ts` attribution all unchanged.

## Known limitations

- These scenarios lead the skill; a failing grade against the current `wordpress-development` skill is acceptable and expected. The bar is structural/static only: Skillsmith-discoverable + test-runner-collectable.
- The `rest-api-authentication-nonce` sub-area (JS nonce flow) remains deferred: it requires a JS toolchain and browser fetch, is not cleanly assertable in a server-side PHP eval, and server-side authentication is covered by the new permission scenario.
- Global parameters (`_fields`/`_embed`) are excluded entirely (no server-side surface to author or grade) and have no catalog entry.
