# Design Research: Initial simple WordPress development scenarios

## Research

<!-- Non-trivial findings from the design-doc-researcher, with sources cited. -->

### Skillsmith scenario discovery — flat structure required

`eval/utils/enumerate.ts` (inside `@automattic/skillsmith`) walks only the **immediate children** of `eval/scenarios/` (`readdirSync(scenariosRoot)` — no recursion). Any subdirectory that does not itself contain a `scenario.yaml` at its root is silently skipped. Therefore, a path like `eval/scenarios/plugins/custom-post-type/scenario.yaml` is **never discovered** — only `eval/scenarios/custom-post-type/scenario.yaml` is. Topic grouping via nested subdirectories is not supported by the current Skillsmith harness without code changes.

`playwright.config.ts` uses `testMatch: "**/e2e.spec.mjs"`, so Playwright itself would find specs in subdirectories — but the e2e harness in `verify-e2e.ts` derives spec paths from Skillsmith's `dirName` (the immediate child name), so subdirectory specs would also fail to be run.

Source: `node_modules/@automattic/skillsmith/src/scenarios/enumerate.ts` lines 33–84.

### Scaffold and harness constraints

The Skillsmith scaffold (`eval/utils/scaffold-plugin.ts`) is block-centric by default: it creates `index.php`, `package.json`, and `src/blocks/testing-block/block.json` per (scenario, agent) pair. The block is named `wp-skill/testing-block` (fixed), uses apiVersion 3, and has `render: file:./render.php`. The testing agent is told to work inside this scaffold. However, the agent CAN add its own PHP/hooks to `index.php` (CPTs, REST endpoints, shortcodes, etc.) alongside the block registration — the scaffold does not prevent it.

The e2e harness (`eval/utils/verify-e2e.ts`) runs `wp-scripts build` only if `src/blocks` exists, then boots `wp-env`, runs Playwright specs from `eval/scenarios/<dir>/e2e.spec.mjs`. Specs can use `requestUtils` (createPost, activatePlugin, REST calls with app-password auth), `page.route` mocking, and `wp-cli` via `npx wp-env run cli`. Both front-end and REST endpoints are reachable from e2e tests.

Existing scenario.yaml schema keys in use: `name` (must match `/^[a-z0-9-]+$/`, used as plugin slug), `description`, `skills: [wordpress-development]`, `prompt`, `acceptance`, `rubrics` (optional, referenced by filename stem).

All 11 existing scenarios target the Interactivity API. One rubric exists: `wp-interactivity-api-best-practices.md`.

### Detailed doc rules for each scenario (from ddresearcher, second pass)

**Filter (body_class) — https://developer.wordpress.org/plugins/hooks/filters/**
- "Filters are meant to work in an isolated manner, and should never have side effects such as affecting global variables and output."
- "Filters expect to have something returned back to them."
- `add_filter()` signature: `add_filter( string $hook_name, callable $callback, int $priority = 10, int $accepted_args = 1 )`.
- body_class example: callback receives `$classes` array, appends class with `$classes[] = 'wporg-is-awesome'` inside `if ( ! is_admin() )` guard, returns `$classes`.

**Shortcodes — https://developer.wordpress.org/plugins/shortcodes/basic-shortcodes/ + /shortcodes-with-parameters/**
- Callback must "always return" — the example code contains the comment `// always return`.
- Full 3-param callback: `function wporg_shortcode( $atts = [], $content = null, $tag = '' )`.
- `shortcode_atts()` merges user attributes with defaults: `shortcode_atts( array( 'title' => 'WordPress.org', ), $atts, $tag )`.
- Output is escaped before returning: example uses `esc_html( $wporg_atts['title'] )`. Rule: "secure the output before returning it."
- Normalization: `array_change_key_case( (array) $atts, CASE_LOWER )` recommended before shortcode_atts.

**Custom Post Types — https://developer.wordpress.org/plugins/post-types/registering-custom-post-types/**
- Hook: "You must call `register_post_type()` before the `admin_init` hook and after the `after_setup_theme` hook. A good hook to use is the `init` action hook."
- Identifier: must not exceed 20 characters; must not start with `wp_`.
- Labels: array with at least `name` and `singular_name`, using `__()`.
- `public => true`: controls public visibility (default false).
- `has_archive => true`: enables post type archives (default false).
- `show_in_rest => true`: exposes CPT in REST API and block editor (default false, must be explicit).

**REST Custom Endpoints — https://developer.wordpress.org/rest-api/extending-the-rest-api/adding-custom-endpoints/**
- `register_rest_route( $namespace, $route, $args )` — three params.
- Namespace format: `vendor/v1` pattern; "Failing to use unique namespaces is analogous to a failure to use a vendor function prefix."
- `permission_callback` required as of WP 5.5; omitting it triggers `_doing_it_wrong`; public endpoint uses `'__return_true'`.
- Callback should "always return data; it shouldn't attempt to send the response body itself."
- Plain arrays are automatically converted to JSON; `WP_REST_Response` allows custom status codes/headers.
- Registration: `add_action( 'rest_api_init', function() { register_rest_route(...); } )`.

### Existing scenario structure

All scenarios live flat under `eval/scenarios/<name>/`. No subdirectory grouping by topic exists today. Existing scenarios: async-fetch, config-fetch, counter, derived-double, focus-trap-menu, fruit-list-each, independent-counters, minimal-scaffold, paginated-list, shared-state, toggle-visibility.

There is also a `_candidates.yaml` file at the scenarios root (likely scratch/planning notes).

## Topics

### Topic: Approach — end-to-end mental model

- **Spec link:** All Requirements, Acceptance Criteria 1–9
- **Options:** N/A — the Skillsmith harness is fixed; the design must work within it.
- **Decision:** Each new scenario is a self-contained directory under `eval/scenarios/<name>/` containing `scenario.yaml` and `e2e.spec.mjs`. The testing agent implements the required WordPress feature by adding PHP code to the scaffold's `index.php`. The scaffold already creates a block plugin with an `init` hook that registers a block — non-block scenarios (filter, shortcode, CPT, REST endpoint) coexist with this block registration without conflict, since `index.php` is just regular PHP. The prompt is phrased in user/outcome terms and does not name the implementation mechanism. Acceptance points describe observable properties of the code that the judge verifies. The e2e spec activates the plugin and asserts the runtime behavior. No changes to the scaffold, harness, skill, or any existing file are needed.
- **Rationale:** This matches the pattern established by all 11 existing scenarios and requires zero infrastructure changes.

### Research: WordPress developer.wordpress.org topic areas (from ddresearcher)

Four candidate non-iAPI areas investigated, all from developer.wordpress.org:

1. **Shortcodes**: https://developer.wordpress.org/plugins/shortcodes/ — sub-page: https://developer.wordpress.org/plugins/shortcodes/basic-shortcodes/. Concept: `add_shortcode()`, handler signature, return-not-echo. E2e: create post with `[shortcode]`, navigate, assert HTML. GOOD.
2. **Custom Post Types**: https://developer.wordpress.org/plugins/post-types/ — sub-page: https://developer.wordpress.org/plugins/post-types/registering-custom-post-types/. Concept: `register_post_type()` with labels, `public:true`, `has_archive:true`. E2e: REST `/wp-json/wp/v2/<type>` assertion or archive URL. GOOD.
3. **REST Custom Endpoints**: https://developer.wordpress.org/rest-api/extending-the-rest-api/adding-custom-endpoints/ — "Bare Basics" section: `register_rest_route()` with GET callback. E2e: direct REST JSON assertion via `page.request.get()`. EXCELLENT.
4. **Hooks / Filters**: https://developer.wordpress.org/plugins/hooks/ + https://developer.wordpress.org/plugins/hooks/filters/ — concept: `add_filter()`, callback, return modified value. Examples: `body_class` adds CSS class; `the_title` prepends text. E2e: front-end body class or title text assertion. GOOD.

Ruled out: Settings API (admin-page interaction required, not front-end, harder e2e in this harness).

### Topic: Topic areas for this batch

- **Spec link:** Requirement 1 (broaden beyond Interactivity API, more than one topic area), Requirement 3 (simple, one concept), Requirement 2 (documentation-driven from developer.wordpress.org), Acceptance Criterion 1
- **Options:**
  1. Three areas: Shortcodes, Custom Post Types, Hooks/Filters (3 scenarios total, 1 each).
  2. Four areas: Shortcodes, Custom Post Types, REST Custom Endpoints, Hooks/Filters (4 scenarios total, 1 each).
  3. Three areas: Shortcodes, REST Custom Endpoints, Hooks/Filters (skip CPT, lean into REST more) — 2 REST scenarios (CPT + endpoint), 1 shortcode, 1 filter = effectively 4 scenarios across 3 areas.
- **Trade-offs:**
  - More areas = better breadth signal. The spec says "more than one" area and "demonstrably broaden the suite."
  - Four distinct areas (option 2) gives the strongest breadth with minimal extra work — each is 1 scenario.
  - Option 1 covers 3 areas / 3 scenarios — adequate but leaves REST untouched.
  - All four areas have excellent e2e feasibility, so there is no trade-off between e2e coverage and area count.
- **Decision:** Option 2 — four areas: **Filters (hooks)**, **Shortcodes**, **Custom Post Types**, **REST Custom Endpoints**. One scenario per area, giving 4 scenarios total.
- **Rationale:** Four distinct areas best satisfies "demonstrably broaden the suite beyond the Interactivity API." All four have strong e2e coverage, all four are grounded in primary developer.wordpress.org documentation, and each is a single focused concept. Keeping it at 1 scenario per area keeps complexity minimal while maximizing breadth. The REST API endpoint scenario is especially valuable because it is the most mechanically verifiable (direct JSON assertion, no DOM needed).

### Topic: Specific scenarios within chosen areas

- **Spec link:** Requirements 2, 3, 5; Acceptance Criteria 3, 4, 5
- **Options:** N/A — each area has one clear, simple concept suitable for a scenario.
- **Trade-offs:** N/A
- **Decision:** Four scenarios, one per topic area. Full details with doc-backed acceptance points below.
- **Rationale:** Each is a single focused task, exercising one WordPress concept in one plugin, with a handful of acceptance points. All are grounded in primary developer.wordpress.org documentation.

---

#### Scenario: `filter-body-class`

- **Topic area:** Hooks / Filters
- **Doc source:** https://developer.wordpress.org/plugins/hooks/filters/
- **Prompt (user-voice, tool-agnostic):**
  > I want my WordPress plugin to add a custom CSS class called `my-custom-class` to every page's `<body>` element on the front end, so I can target the whole site with a single CSS rule.
- **Acceptance points** (each traceable to the doc above):
  1. Plugin registers a callback via `add_filter('body_class', ...)` that appends a custom CSS class to the array.
  2. The filter callback receives the `$classes` array, appends the custom class, and **returns** the modified array (does not echo or produce direct output).
  3. The callback guards against admin pages — the custom class appears only on front-end pages (not in the WordPress admin).
  4. The custom CSS class appears in the `<body>` element's `class` attribute on the front end.
- **e2e shape:** Activate plugin → `page.goto('/')` → assert `page.locator('body')` has class `my-custom-class`.
- **e2e note:** Point 4 is directly testable; points 1–3 are judge-checked from the code.

---

#### Scenario: `shortcode-with-attr`

- **Topic area:** Shortcodes
- **Doc sources:** https://developer.wordpress.org/plugins/shortcodes/basic-shortcodes/ , https://developer.wordpress.org/plugins/shortcodes/shortcodes-with-parameters/
- **Prompt (user-voice, tool-agnostic):**
  > I want to create a WordPress shortcode called `greeting` that I can drop into any post or page. When I write `[greeting name="Alice"]` in the editor, I want it to display a greeting message to Alice on the front end. The shortcode should fall back to a default name if none is provided.
- **Acceptance points** (each traceable to the docs above):
  1. Plugin registers a shortcode via `add_shortcode()` (hooked on `init` or called after theme setup).
  2. The shortcode callback accepts `$atts` and uses `shortcode_atts()` to merge user-supplied attributes with defaults (so omitting the `name` attribute falls back to the default).
  3. The callback **returns** an HTML string — it does not echo or print directly.
  4. The output HTML escapes the attribute value before rendering it (e.g. using `esc_html()` or `esc_attr()`).
  5. Placing `[greeting name="Alice"]` in a post causes the rendered page to contain a greeting message including "Alice".
- **e2e shape:** Activate plugin → `requestUtils.createPost({ content: '[greeting name="Alice"]', status: 'publish' })` → `page.goto('/?p=<id>')` → assert greeting text containing "Alice" appears on the page.
- **e2e note:** Point 5 is the e2e check; points 1–4 are judge-checked.

---

#### Scenario: `cpt-register`

- **Topic area:** Custom Post Types
- **Doc sources:** https://developer.wordpress.org/plugins/post-types/registering-custom-post-types/ , https://developer.wordpress.org/reference/functions/register_post_type/
- **Prompt (user-voice, tool-agnostic):**
  > I want my WordPress plugin to add a new content type called 'Books' for storing book entries. Editors should be able to create and manage books from the WordPress admin, and the books should be accessible via the WordPress REST API.
- **Acceptance points** (each traceable to the docs above):
  1. `register_post_type()` is called on the `init` action hook.
  2. The post type slug does not begin with `wp_` and does not exceed 20 characters.
  3. The `labels` array includes at least `name` and `singular_name`, with strings wrapped in `__()` for translation.
  4. `public => true` and `show_in_rest => true` are both set so the CPT is publicly accessible and exposed via the REST API.
  5. A GET request to `/wp-json/wp/v2/<post-type-slug>` returns HTTP 200 when the plugin is active.
- **e2e shape:** Activate plugin → `page.request.get('/wp-json/wp/v2/books')` → assert `response.status() === 200`.
- **e2e note:** Point 5 is the e2e check; points 1–4 are judge-checked. The exact slug (`books` or similar) is what the agent chooses; the e2e spec must discover the correct slug or use the one from the prompt guidance. Since the prompt says "Books", the slug is expected to be `books` or `book`; the spec can assert either 200 on `/wp-json/wp/v2/books` or discover it from the API root index.

---

#### Scenario: `rest-custom-endpoint`

- **Topic area:** REST API Custom Endpoints
- **Doc source:** https://developer.wordpress.org/rest-api/extending-the-rest-api/adding-custom-endpoints/
- **Prompt (user-voice, tool-agnostic):**
  > I want my WordPress plugin to expose a simple JSON endpoint that returns a greeting message. When someone sends a GET request to `/wp-json/myplugin/v1/hello`, they should get back a JSON response with a `message` field.
- **Acceptance points** (each traceable to the doc above):
  1. Route is registered via `register_rest_route()` inside an `add_action('rest_api_init', ...)` callback.
  2. The namespace follows the `vendor/v1` pattern (plugin-scoped prefix, not a bare generic name).
  3. A `permission_callback` is explicitly set on the route — a public endpoint uses `'__return_true'` (not omitted, which would produce a `_doing_it_wrong` notice as of WP 5.5).
  4. The callback **returns** data (a plain array or `WP_REST_Response`) rather than echoing JSON or calling `wp_send_json()` / `die()`.
  5. A GET request to the registered route returns HTTP 200 and a JSON body containing a `message` field.
- **e2e shape:** Activate plugin → `const resp = await page.request.get('/wp-json/myplugin/v1/hello')` → assert `resp.status() === 200` and `(await resp.json()).message` exists.
- **e2e note:** Point 5 is the e2e check; points 1–4 are judge-checked. The prompt names the path `/wp-json/myplugin/v1/hello` explicitly, so the e2e spec can use that exact path.

### Topic: e2e vs judge-only split

- **Spec link:** Requirement 7, Acceptance Criterion 6
- **Options:**
  1. All four scenarios get `e2e.spec.mjs` files.
  2. Judge-only for CPT and REST scenarios; e2e only for filter and shortcode (front-end-visible scenarios).
  3. Judge-only for all four scenarios (maximum simplicity, but loses runtime verification value).
- **Trade-offs:**
  - All four produce runtime-verifiable behavior in wp-env: filter adds a body class (Playwright can check `document.body`), shortcode renders HTML in post content (createPost + navigate + locator), CPT registration is verifiable via REST `/wp-json/wp/v2/<type>` (HTTP 200 + `data[0].type === "..."` or just 200 OK), custom REST endpoint returns JSON (direct `page.request.get()` assertion).
  - Option 1 maximizes the runtime-verification signal and is the spec's preferred path when e2e is feasible. The harness is proven to handle REST assertions (existing `config-fetch` scenario uses REST).
  - Option 2 is unnecessarily conservative — CPT and REST endpoint assertions are actually the simplest possible e2e checks (a JSON HTTP request + status code).
  - Option 3 wastes the harness capability and defeats the purpose of the "mixed verification bar" requirement.
- **Decision:** Option 1 — all four scenarios include `e2e.spec.mjs`.
- **Rationale:** All four scenarios produce unambiguous runtime-testable outputs within the existing wp-env harness. The e2e check shapes for each: (a) Filter — activate plugin, navigate to home page (or any page), assert `body` element has the expected CSS class. (b) Shortcode — activate plugin, create post with `[shortcode attr="value"]`, navigate to post, assert expected HTML in `.entry-content`. (c) CPT — activate plugin, `page.request.get('/wp-json/wp/v2/<type>')`, assert HTTP 200 and non-empty array or at least valid REST response structure. (d) REST endpoint — activate plugin, `page.request.get('/wp-json/<namespace>/v1/<route>')`, assert HTTP 200 and expected JSON keys. These are simple, low-flake checks appropriate to the simple scenario scope.

### Topic: Folder/grouping structure and reorg of existing scenarios

- **Spec link:** Requirement 10, Out of Scope item 5, Acceptance Criterion 1
- **Options:**
  1. **Flat with naming convention** — keep all scenarios as immediate children of `eval/scenarios/`, prefix scenario directories with a topic token (e.g. `plugins-custom-post-type`, `rest-api-endpoint`). No existing scenarios moved.
  2. **Flat with naming convention + reorg existing** — same as (1), but also rename existing iAPI scenario directories with an `iapi-` prefix (e.g. `iapi-counter`, `iapi-toggle-visibility`).
  3. **Subdirectory grouping** — place scenarios under topic subdirectories like `eval/scenarios/plugins/`, `eval/scenarios/rest-api/`. (Ruled out: Skillsmith discovery does not recurse; this would break harness completely.)
- **Trade-offs:**
  - Option 1: Zero disruption to existing scenarios; topic grouping is implicit but evident from directory names. Requires no migration work. New topics are clearly differentiated from iAPI ones.
  - Option 2: Consistent naming across old and new scenarios, makes topic grouping unambiguous in directory listings. Requires renaming 11 existing directories and updating any references to them in the harness or test output. Higher risk, more implementation work; the spec explicitly says reorganizing existing scenarios is not a required deliverable (Out of Scope item 5).
  - Option 3: Not viable — Skillsmith enumerate.ts reads only immediate children of `eval/scenarios/`.
- **Decision:** Option 1 — flat layout with descriptive directory names for new scenarios. No reorganization of existing Interactivity API scenarios.
- **Rationale:** Skillsmith's enumeration hardcodes a single level of directory scanning, making subdirectory grouping non-functional without harness changes (which are out of scope). Renaming 11 existing scenarios (option 2) is explicitly called out as not a required deliverable, adds migration cost and risk, and would require verifying all harness references. Option 1 gives sufficient topic organization via naming convention with zero risk and zero disruption. The spec says the "exact folder structure, and whether to reorganize the existing Interactivity API scenarios into that structure, is decided in the design phase" — and the decision here is to keep it flat.

Chosen directory names for the four new scenarios (must match `/^[a-z0-9-]+$/`):
- `filter-body-class` — Hooks/Filters topic
- `shortcode-with-attr` — Shortcodes topic
- `cpt-register` — Custom Post Types topic
- `rest-custom-endpoint` — REST API topic

These follow the same descriptive-name convention as existing scenarios (`counter`, `toggle-visibility`, `minimal-scaffold`). The topic is legible from the directory name without requiring a mandatory prefix.

### Topic: Shared rubrics

- **Spec link:** Requirements 8, 9, Acceptance Criterion 8
- **Options:**
  1. Add zero new rubrics — each scenario's acceptance list carries all its checks.
  2. Add one rubric covering general WordPress plugin best practices (e.g. escaping output, returning from filters, translation functions) shared across multiple scenarios.
  3. Add a narrow rubric covering only "return vs. echo" (the one principle that appears in 3 of 4 scenarios).
- **Trade-offs:**
  - Reviewing the four scenarios' acceptance points, the candidates for genuinely shared cross-cutting checks are: (a) "return, don't echo" — applies to filter, shortcode, and REST endpoint callbacks in this batch; (b) output escaping — applies explicitly only to shortcode output; (c) hook naming — each scenario uses a different hook (`init`, `rest_api_init`, `body_class`), so no shared "hook pattern" rule makes sense.
  - The "return, don't echo" principle appears in three scenarios but its expression differs enough that a rubric text would need three separate phrasings for filter callbacks, shortcode callbacks, and REST callbacks — reducing its value as a unified rubric. Each scenario's acceptance list already explicitly covers it.
  - Output escaping is important but only meaningfully required in the shortcode scenario; the filter scenario doesn't return user strings, REST JSON is handled by WP, and CPT registration doesn't produce escaped output.
  - No check is genuinely "the same rule in the same form" across all four scenarios the way iAPI best practices uniformly apply across all 11 iAPI scenarios.
  - Option 2 risks creating a catch-all rubric that overlaps with per-scenario acceptance points (violating Requirement 8) or is too vague to be useful.
- **Decision:** Option 1 — add zero new rubrics.
- **Rationale:** The spec explicitly states "Adding zero new rubrics is acceptable if no genuinely-shared check emerges." After reviewing the four scenarios' acceptance points, no single rule appears in the same form across all (or even most) scenarios in a way that would benefit from extraction. The most common candidate ("return, don't echo") is already captured per-scenario in clear, scenario-specific language. Adding a rubric to cover it would either duplicate the acceptance points (violating Requirement 8) or be too abstract to be useful to the judge. Zero rubrics is the correct decision for this batch.

## Open Questions

- **CPT slug discovery in e2e**: The `cpt-register` scenario prompts for "Books" as the content type name. The CPT slug (used in the REST route) is what the agent chooses — likely `book` or `books`. The e2e spec should either assert `/wp-json/wp/v2/books` directly (which may fail if the agent picks `book`) or query the API root to discover the registered CPT. The implementation phase should decide: either hard-code the prompt to say the slug must be `books`, or have the e2e spec query `/wp-json/` and check that any CPT matching "book" appears. Simplest approach: add to the prompt that the slug should be `books`.
- **shortcode-with-attr output format**: The acceptance points say the greeting must include "Alice" — but they don't specify the exact HTML structure. The judge can verify this flexibly; the e2e spec asserts only that the text "Alice" appears somewhere in the post content. This is intentionally flexible per the spec's guidance that the approach is the skill's job.
- **REST endpoint namespace in e2e**: The prompt names `/wp-json/myplugin/v1/hello` as the example path. If the agent uses a different namespace, the e2e spec would fail. The implementation phase should decide whether to make the namespace/path part of the prompt requirement. Simplest: the prompt already names the path, so the agent is expected to implement it at that exact path.

## Risks

- The scaffold strongly nudges block-based work (testing-agent prompt says to implement the block). Non-block scenarios (REST API endpoints, shortcode output, CPT registration) are achievable by adding hooks to `index.php`, but the testing agent may be confused by the block scaffold for non-block tasks. This is a known limitation; the scenario prompts and acceptance points should be clear enough that the agent adds hooks to `index.php` as needed.
- Scenario `name` values must match `/^[a-z0-9-]+$/` (used as plugin slug). Topic-prefixed names like `plugins-custom-post-type` are valid.
- The scaffold hardcodes `wp-skill/testing-block` as the block name — scenarios that register a CPT or REST endpoint must still live in a plugin that also registers this block (or the scaffold's init hook fails silently). This is fine as long as the scenario accepts any extra block registration alongside the primary task.
