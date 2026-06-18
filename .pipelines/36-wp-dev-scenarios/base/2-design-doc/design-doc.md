# Design Doc: Initial simple WordPress development scenarios

## Overview

The `wordpress-development` skill is evaluated by a Skillsmith-based suite under `eval/`. Today all 11 scenarios in `eval/scenarios/` target the **Interactivity API**, and the sole rubric (`eval/rubrics/wp-interactivity-api-best-practices.md`) is Interactivity-API-specific. The suite therefore exercises only a sliver of the WordPress development domain.

This change adds an **initial batch of four simple, documentation-driven, non-Interactivity-API scenarios** that broaden the suite across four distinct WordPress development topic areas: **Hooks/Filters**, **Shortcodes**, **Custom Post Types**, and **REST API custom endpoints**. Each is a single focused task — one concept, one small feature — grounded in primary documentation on developer.wordpress.org, with a tool-agnostic user-voice prompt, a scenario-specific `acceptance` list, and a Playwright `e2e.spec.mjs` that verifies real runtime behavior under `wp-env`. The batch adds **zero** new rubrics, does not reorganize the existing Interactivity API scenarios, and touches no file under `skills/wordpress-development/`. It fits the existing suite by following — exactly — the conventions established by the `counter` scenario and the `eval/utils/` harness, requiring no harness, scaffold, or skill changes.

## Approach

Each new scenario is a **self-contained directory** `eval/scenarios/<dir>/` containing a `scenario.yaml` and an `e2e.spec.mjs`. This mirrors the structure of every existing scenario (e.g. `eval/scenarios/counter/`). The end-to-end mental model:

1. **Skillsmith discovers the scenario** by reading the immediate children of `eval/scenarios/` and loading each child's `scenario.yaml`. The directory is the scenario's identity for discovery; the `name` field inside the YAML is the plugin slug used downstream.
2. **For each (scenario, testing-agent) pair, Skillsmith scaffolds a plugin** via `eval/utils/scaffold-plugin.ts` into the agent's workspace. The scaffold is block-centric: it writes `index.php` (a plugin header plus an `init` hook that registers any block found under `src/blocks` or `build/blocks`), a `package.json`, and a fixed `src/blocks/testing-block/block.json` named `wp-skill/testing-block`. The plugin directory and slug are `plugin-<scenario.name>-<agentId>`.
3. **The testing agent implements the requested feature** by editing the scaffold. For these four non-block scenarios, the agent adds ordinary PHP (an `add_filter`, an `add_shortcode`, a `register_post_type`, or a `register_rest_route`) to `index.php`. This coexists with the scaffold's block-registration `init` hook without conflict — `index.php` is just PHP, and the extra block registration is harmless. **None of the four scenarios requires the agent to build a block.**
4. **An LLM judge grades the produced code** against the scenario's `acceptance` list (and any referenced `rubrics`; here, none).
5. **The e2e harness (`eval/utils/verify-e2e.ts`) runs the Playwright spec** in a `wp-env` runtime: it builds plugins that have a `src/blocks` directory (all of them, since the scaffold always creates one), boots `wp-env` with every produced plugin registered but all deactivated, then runs the scenario's `e2e.spec.mjs`. Each spec activates exactly its own plugin and asserts the runtime behavior.

The prompt for each scenario is phrased by desired outcome in a real user's voice and never names the API/tool/mechanism — deciding the approach is the skill's job. The `acceptance` points describe observable properties of the produced code (judge-verified), and each e2e spec asserts the one runtime-visible outcome that proves the feature works.

No changes are made to the scaffold, the e2e harness, the Skillsmith package, the skill, or any existing scenario or rubric.

## Components

### New components (this batch)

- **`eval/scenarios/filter-body-class/`** — Hooks/Filters scenario (`scenario.yaml` + `e2e.spec.mjs`).
- **`eval/scenarios/shortcode-with-attr/`** — Shortcodes scenario (`scenario.yaml` + `e2e.spec.mjs`).
- **`eval/scenarios/cpt-register/`** — Custom Post Types scenario (`scenario.yaml` + `e2e.spec.mjs`).
- **`eval/scenarios/rest-custom-endpoint/`** — REST API custom-endpoint scenario (`scenario.yaml` + `e2e.spec.mjs`).

Directory names match `/^[a-z0-9-]+$/`, follow the existing descriptive-name convention (`counter`, `toggle-visibility`, `minimal-scaffold`), and make the topic legible without a mandatory prefix.

### Untouched-but-relevant components (consumed, not modified)

- **`eval/utils/scaffold-plugin.ts`** — scaffolds the per-(scenario, agent) plugin. Fixed facts the new scenarios depend on: plugin slug is `plugin-<scenario.name>-<agentId>`; the block name is hardcoded `wp-skill/testing-block`; the `init` hook registers blocks under `src/blocks`/`build/blocks` and returns harmlessly if none build. Agents may add arbitrary PHP to `index.php`.
- **`eval/utils/verify-e2e.ts`** — locates each ran scenario's spec at `eval/scenarios/<dirName>/e2e.spec.mjs` (where `dirName` is the directory Skillsmith discovered), runs `wp-scripts build` for plugins with `src/blocks`, boots `wp-env` (config written to a transient `.wp-env.json` with all plugins deactivated `afterStart`), and runs the specs. New specs plug in simply by existing at that path.
- **`eval/utils/wp-cli.mjs`** — exports `deactivateAllPlugins()`, used by every existing spec's `beforeAll` to reset plugin state before activating its own plugin. New specs reuse it identically.
- **`@automattic/skillsmith` (`enumerate.ts`)** — discovers scenarios by reading **only the immediate children** of `eval/scenarios/` (no recursion). This constrains the folder layout (see Key Decisions).
- **`playwright.config.ts`** — `testMatch: "**/e2e.spec.mjs"`, `testDir: eval/scenarios`; Playwright projects are named after testing-agent ids.

### Explicitly NOT modified

- The 11 existing Interactivity API scenario directories (no reorganization).
- `eval/rubrics/` (no new rubric; the existing iAPI rubric is untouched).
- Anything under `skills/wordpress-development/`.

## Interfaces and Data Flow

### `scenario.yaml` schema (per the existing `counter` scenario)

```yaml
name: <slug>            # must match /^[a-z0-9-]+$/; becomes the plugin slug
description: <one line>
skills:
  - wordpress-development
prompt: |
  <user-voice, tool-agnostic request>
acceptance:
  - <scenario-unique success point>
  - ...
# rubrics:              # OMITTED for all four — present only when a scenario references one
```

`name` is the plugin slug fragment; the scaffolded plugin directory/slug is `plugin-<name>-<agentId>`, and the e2e spec must activate that exact slug. Note that `name` need not equal the directory name (e.g. the `counter` directory has `name: counter-block`). For this batch we set each scenario's `name` equal to its directory name for clarity (e.g. `filter-body-class`), so the slug is `plugin-filter-body-class-<agentId>`.

### `e2e.spec.mjs` interface (per existing specs)

```js
import { expect, test } from "@wordpress/e2e-test-utils-playwright";
import { deactivateAllPlugins } from "../../utils/wp-cli.mjs";
// beforeAll: deactivateAllPlugins(); await requestUtils.activatePlugin(`plugin-<name>-${workerInfo.project.metadata.agentId}`);
// (scenario-specific seeding, navigation, and assertions)
// afterAll: deactivateAllPlugins(); await requestUtils.deleteAllPosts();
```

Available e2e mechanisms (proven by existing specs): `requestUtils.activatePlugin`, `requestUtils.createPost`, `requestUtils.deleteAllPosts`, `page.goto`, `page.locator` / `getByRole`, `page.request.get` (authenticated REST/front-end requests), and `page.route` mocking. REST endpoints and front-end pages are both reachable.

### Data flow

`scenario.yaml` (discovery + judge input) → scaffold writes plugin → testing agent edits `index.php` → judge grades code against `acceptance` → `verify-e2e.ts` builds + boots `wp-env` → `e2e.spec.mjs` activates the plugin and asserts runtime behavior → Playwright JSON report → harness maps failures back to (scenario, agent).

---

## The four scenarios

Each scenario below is fully specified so phase 3/4 can build it without re-deciding anything.

### Scenario 1 — `filter-body-class` (Hooks / Filters)

- **Topic area:** Hooks / Filters.
- **Doc source(s):** https://developer.wordpress.org/plugins/hooks/filters/
- **Prompt (user-voice, tool-agnostic):**
  > I want my WordPress plugin to add a custom CSS class called `my-custom-class` to every page's `<body>` element on the front end, so I can target the whole site with a single CSS rule.
- **`acceptance` (scenario-unique points):**
  1. Plugin registers a callback via `add_filter('body_class', ...)` that appends a custom CSS class to the array.
  2. The filter callback receives the `$classes` array, appends the custom class, and **returns** the modified array (does not echo or produce direct output).
  3. The callback guards against admin pages — the custom class appears only on front-end pages (not in the WordPress admin).
  4. The custom CSS class appears in the `<body>` element's `class` attribute on the front end.
- **e2e plan (`e2e.spec.mjs`):** In `beforeAll`, deactivate all plugins, then `activatePlugin('plugin-filter-body-class-<agentId>')`. In the test, `page.goto('/')` (front-end home), then assert `page.locator('body')` has class `my-custom-class` (body-class assertion, e.g. `await expect(page.locator('body')).toHaveClass(/my-custom-class/)`). This proves acceptance point 4; points 1–3 are judge-checked from the code.
- **Doc traceability:** "Filters expect to have something returned back to them"; filters "should never have side effects such as affecting global variables and output"; the documented `body_class` example guards with `if ( ! is_admin() )` and returns the `$classes` array.

### Scenario 2 — `shortcode-with-attr` (Shortcodes)

- **Topic area:** Shortcodes.
- **Doc source(s):** https://developer.wordpress.org/plugins/shortcodes/basic-shortcodes/ , https://developer.wordpress.org/plugins/shortcodes/shortcodes-with-parameters/
- **Prompt (user-voice, tool-agnostic):**
  > I want to create a WordPress shortcode called `greeting` that I can drop into any post or page. When I write `[greeting name="Alice"]` in the editor, I want it to display a greeting message to Alice on the front end. The shortcode should fall back to a default name if none is provided.
- **`acceptance` (scenario-unique points):**
  1. Plugin registers a shortcode via `add_shortcode()` (hooked on `init` or called after theme setup).
  2. The shortcode callback accepts `$atts` and uses `shortcode_atts()` to merge user-supplied attributes with defaults (so omitting the `name` attribute falls back to the default).
  3. The callback **returns** an HTML string — it does not echo or print directly.
  4. The output escapes the attribute value before rendering it (e.g. `esc_html()` or `esc_attr()`).
  5. Placing `[greeting name="Alice"]` in a post causes the rendered page to contain a greeting message including "Alice".
- **e2e plan (`e2e.spec.mjs`):** `beforeAll`: deactivate all, `activatePlugin('plugin-shortcode-with-attr-<agentId>')`, then `requestUtils.createPost({ content: '[greeting name="Alice"]', status: 'publish' })`. Test: `page.goto('/?p=<post.id>')`, assert the rendered page contains the text "Alice" (e.g. `await expect(page.locator('body')).toContainText('Alice')`, or scope to the post-content container). `afterAll`: `deleteAllPosts()`. This proves acceptance point 5; points 1–4 are judge-checked. The e2e asserts only that "Alice" appears — it does not pin the exact HTML structure, so the agent is free to choose the markup.
- **Doc traceability:** shortcode callback "always return" (doc's `// always return` comment); 3-param signature `function wporg_shortcode( $atts = [], $content = null, $tag = '' )`; `shortcode_atts()` merges defaults; "secure the output before returning it" via `esc_html()`.

### Scenario 3 — `cpt-register` (Custom Post Types)

- **Topic area:** Custom Post Types.
- **Doc source(s):** https://developer.wordpress.org/plugins/post-types/registering-custom-post-types/ , https://developer.wordpress.org/reference/functions/register_post_type/
- **Prompt (user-voice, tool-agnostic) — slug pinned to remove e2e drift (see Risks/Open Notes):**
  > I want my WordPress plugin to add a new content type for storing book entries, using the identifier `books`. Editors should be able to create and manage these book entries from the WordPress admin, and the entries should be accessible via the WordPress REST API.
- **`acceptance` (scenario-unique points):**
  1. `register_post_type()` is called on the `init` action hook.
  2. The post-type identifier does not begin with `wp_` and does not exceed 20 characters.
  3. The `labels` array includes at least `name` and `singular_name`, with strings wrapped in `__()` for translation.
  4. `public => true` and `show_in_rest => true` are both set so the CPT is publicly accessible and exposed via the REST API.
  5. A GET request to `/wp-json/wp/v2/books` returns HTTP 200 when the plugin is active.
- **e2e plan (`e2e.spec.mjs`):** `beforeAll`: deactivate all, `activatePlugin('plugin-cpt-register-<agentId>')`. Test: `const resp = await page.request.get('/wp-json/wp/v2/books')` and assert `resp.status() === 200` (a registered, REST-exposed CPT's collection route returns 200 even when empty; the empty array is a valid response). No DOM, no post seeding. This proves acceptance point 5; points 1–4 are judge-checked.
- **Doc traceability:** "call `register_post_type()` ... A good hook to use is the `init` action hook"; identifier "must not exceed 20 characters" and "must not start with `wp_`"; labels require `name`/`singular_name`; `public => true` and `show_in_rest => true` default to false and must be set explicitly.

### Scenario 4 — `rest-custom-endpoint` (REST API custom endpoints)

- **Topic area:** REST API custom endpoints.
- **Doc source(s):** https://developer.wordpress.org/rest-api/extending-the-rest-api/adding-custom-endpoints/
- **Prompt (user-voice, tool-agnostic) — path pinned so the e2e can assert it directly:**
  > I want my WordPress plugin to expose a simple JSON endpoint that returns a greeting message. When someone sends a GET request to `/wp-json/myplugin/v1/hello`, they should get back a JSON response with a `message` field.
- **`acceptance` (scenario-unique points):**
  1. Route is registered via `register_rest_route()` inside an `add_action('rest_api_init', ...)` callback.
  2. The namespace follows the `vendor/v1` pattern (a plugin-scoped prefix, not a bare generic name).
  3. A `permission_callback` is explicitly set on the route — a public endpoint uses `'__return_true'` (not omitted, which would trigger a `_doing_it_wrong` notice as of WP 5.5).
  4. The callback **returns** data (a plain array or `WP_REST_Response`) rather than echoing JSON or calling `wp_send_json()` / `die()`.
  5. A GET request to the registered route returns HTTP 200 and a JSON body containing a `message` field.
- **e2e plan (`e2e.spec.mjs`):** `beforeAll`: deactivate all, `activatePlugin('plugin-rest-custom-endpoint-<agentId>')`. Test: `const resp = await page.request.get('/wp-json/myplugin/v1/hello')`, assert `resp.status() === 200` and `(await resp.json()).message` is defined (e.g. `expect((await resp.json())).toHaveProperty('message')`). No DOM, no post seeding. This proves acceptance point 5; points 1–4 are judge-checked. The prompt names the exact path, so the spec asserts it directly.
- **Doc traceability:** `register_rest_route($namespace, $route, $args)`; unique `vendor/v1` namespace ("Failing to use unique namespaces is analogous to a failure to use a vendor function prefix"); `permission_callback` required since WP 5.5, public uses `'__return_true'`; callback "should always return data; it shouldn't attempt to send the response body itself"; plain arrays auto-convert to JSON.

---

## File layout each scenario produces

Each new scenario directory contains exactly two files, mirroring `eval/scenarios/counter/`:

```
eval/scenarios/<dir>/
  scenario.yaml     # name, description, skills:[wordpress-development], prompt, acceptance (no rubrics key)
  e2e.spec.mjs      # Playwright spec: activate plugin-<name>-<agentId>, exercise, assert
```

How it plugs into Skillsmith:

- **Discovery:** Skillsmith's `enumerate.ts` reads the immediate children of `eval/scenarios/` and loads `<dir>/scenario.yaml`. Placing the directory directly under `eval/scenarios/` is what makes it discoverable.
- **Scaffold:** `scaffold-plugin.ts` writes the plugin to `plugin-<name>-<agentId>/` with `index.php` (block-registering `init` hook), `package.json`, and `src/blocks/testing-block/block.json`. The agent adds its feature's PHP to `index.php`.
- **Judge:** Skillsmith grades the produced code against `acceptance`. Since no scenario sets `rubrics`, only `acceptance` is used.
- **e2e pickup:** `verify-e2e.ts` derives the spec path from the discovered `dirName` (`eval/scenarios/<dir>/e2e.spec.mjs`), runs `wp-scripts build` (succeeds because the scaffold always creates `src/blocks`), boots `wp-env` with all produced plugins registered-but-deactivated, and runs the spec. The spec activates its own `plugin-<name>-<agentId>` and asserts behavior. Playwright reports map the spec's parent directory back to the scenario and the project name back to the agent.

## Key Decisions

### Decision: Flat folder layout, no topic subdirectories

- **Choice:** Place all four new scenarios as immediate children of `eval/scenarios/` with descriptive directory names (`filter-body-class`, `shortcode-with-attr`, `cpt-register`, `rest-custom-endpoint`). Do not introduce topic subdirectories (e.g. `eval/scenarios/plugins/...`).
- **Alternatives:** (a) Subdirectory grouping by topic; (b) flat layout with a mandatory topic prefix on each directory name.
- **Trade-offs:** Subdirectory grouping is **not viable**: Skillsmith's `enumerate.ts` reads only the immediate children of `eval/scenarios/` (no recursion), and `verify-e2e.ts` derives spec paths from the immediate-child `dirName`, so a nested `scenario.yaml`/spec would never be discovered or run without harness changes (out of scope). A mandatory topic prefix adds no discovery value over a descriptive name and diverges from the existing convention. The chosen names already make the topic legible.
- **Traces to:** Requirement 10 (topic grouping is a design decision), Out of Scope item 5, Acceptance Criterion 1 (new scenarios discoverable under `eval/scenarios/`), Acceptance Criterion 7 (runnable without harness errors).

### Decision: Do not reorganize the existing 11 Interactivity API scenarios

- **Choice:** Leave all existing scenario directories untouched.
- **Alternatives:** Rename them with an `iapi-` prefix for consistent topic grouping across old and new.
- **Trade-offs:** Renaming 11 directories would require auditing and updating every harness reference and any output keyed on those names, adding migration cost and risk for no required benefit. The spec explicitly marks reorganizing existing scenarios as not a required deliverable.
- **Traces to:** Out of Scope item 5, Requirement 10.

### Decision: Four topic areas, one scenario each

- **Choice:** Cover Hooks/Filters, Shortcodes, Custom Post Types, and REST API custom endpoints — one scenario per area, four scenarios total.
- **Alternatives:** (a) Three areas / three scenarios (drop REST endpoints or CPT); (b) lean into REST with two REST-flavored scenarios across three areas.
- **Trade-offs:** Four distinct areas give the strongest "demonstrably broaden the suite" signal with minimal extra work (each area is one simple scenario). All four have strong, low-flake e2e feasibility, so there is no tension between breadth and runtime verifiability. Three areas would be adequate but leave an easily-covered, highly-verifiable area (REST endpoints) on the table. The Settings API was ruled out because it needs admin-page interaction rather than front-end/REST behavior, making a simple e2e impractical in this harness.
- **Traces to:** Requirement 1 (more than one new topic area; demonstrably broaden), Requirement 3 (one concept each), Requirement 2 (documentation-driven), Acceptance Criterion 1.

### Decision: All four scenarios include an `e2e.spec.mjs`

- **Choice:** Provide a Playwright e2e spec for every scenario in the batch (no judge-only scenarios).
- **Alternatives:** (a) e2e only for the front-end-visible scenarios (filter, shortcode), judge-only for CPT and REST; (b) judge-only for all four.
- **Trade-offs:** Every scenario produces an unambiguous, runtime-testable output that the existing `wp-env` harness already handles: a body class (locator assertion), rendered shortcode HTML (createPost + navigate + text assertion), a CPT collection route (REST 200), and a custom REST route (REST 200 + JSON shape). The REST/CPT checks are in fact the simplest and least flaky (an HTTP GET + status code), so omitting them would be needlessly conservative and would waste a proven harness capability (existing `config-fetch` already exercises REST). Judge-only-for-all forfeits the runtime-verification signal the spec's mixed-verification bar prefers when e2e is feasible.
- **Traces to:** Requirement 7 (mixed verification — provide e2e where feasible), Acceptance Criterion 6.

### Decision: Add zero new shared rubrics

- **Choice:** Add no files under `eval/rubrics/`; each scenario's `acceptance` list carries all of its checks.
- **Alternatives:** (a) One general "WordPress plugin best practices" rubric (escaping, return-not-echo, translation); (b) a narrow "return, don't echo" rubric.
- **Trade-offs:** Reviewing the four `acceptance` lists, no single rule recurs in the *same form* across all (or even most) scenarios the way iAPI best practices uniformly apply to all 11 iAPI scenarios. The strongest candidate — "return, don't echo" — appears in three scenarios (filter, shortcode, REST) but in materially different forms (return a filtered array, return an HTML string, return response data not `wp_send_json()`), so a single rubric text would fragment into three phrasings and add little over the per-scenario points that already state it precisely. Output escaping is only meaningfully required by the shortcode scenario. A catch-all rubric would risk duplicating per-scenario acceptance points (violating the rubric/acceptance separation rule) or being too vague to help the judge. The spec explicitly allows zero rubrics when no genuinely-shared check emerges.
- **Traces to:** Requirement 8 (rubric/acceptance separation), Requirement 9 (shared rubrics in scope but only when genuinely cross-cutting), Acceptance Criterion 8.

### Decision: Agents implement non-block features by adding PHP to the scaffold's `index.php`

- **Choice:** Treat the block-centric scaffold as a host; the agent adds `add_filter`/`add_shortcode`/`register_post_type`/`register_rest_route` to `index.php` alongside the scaffold's block-registration `init` hook.
- **Alternatives:** Change the scaffold to support non-block plugins.
- **Trade-offs:** The scaffold's `init` hook registers blocks found under `src/blocks`/`build/blocks` and returns harmlessly otherwise, so an extra `wp-skill/testing-block` registration is inert for these scenarios and does not interfere with the feature under test. Changing the scaffold is out of scope and unnecessary. The residual risk (the block scaffold may nudge the agent toward block-based work) is mitigated by clear, outcome-focused prompts and acceptance points; it is noted under Risks.
- **Traces to:** Requirement 11 (skill untouched — and, more broadly, no harness/scaffold change), Requirement 6 (schema-conformant scenarios on the existing harness), Acceptance Criterion 7.

### Decision: Pin the CPT identifier and the REST route in the prompts

- **Choice:** The `cpt-register` prompt names the identifier `books`; the `rest-custom-endpoint` prompt names the path `/wp-json/myplugin/v1/hello`. The e2e specs assert those exact strings.
- **Alternatives:** Leave the slug/namespace fully to the agent and have the e2e discover it (e.g. query `/wp-json/` and match any "book"-like CPT or any namespaced route).
- **Trade-offs:** Without pinning, the e2e assertion target would drift with the agent's naming choice (`book` vs `books`; arbitrary namespace), making the spec flaky or forcing discovery logic that adds complexity disproportionate to a "simple scenario." Naming a concrete identifier/path in the prompt keeps the prompt user-voiced (a user can legitimately ask for a specific slug or URL) and tool-agnostic (it still does not name `register_post_type`/`register_rest_route` or any API), while making the e2e deterministic. This preserves "deciding the approach is the skill's job" — the *mechanism* is still unspecified.
- **Traces to:** Requirement 5 (tool-agnostic prompt — preserved), Requirement 7 / Acceptance Criterion 6 (e2e must run reliably under `wp-env`), Acceptance Criterion 7 (runnable without harness errors).

## Dependencies

All dependencies already exist in the repo; the batch introduces **no new** dependency.

- **Internal:** `eval/utils/scaffold-plugin.ts`, `eval/utils/verify-e2e.ts`, `eval/utils/wp-cli.mjs` (`deactivateAllPlugins`), `playwright.config.ts`, and the `eval/scenarios/counter/` reference pattern.
- **External (already present):** `@automattic/skillsmith` (discovery, scaffold orchestration, judge), `@wordpress/e2e-test-utils-playwright` (`test`, `expect`, `requestUtils`), `@wordpress/scripts` (`wp-scripts build`), `@wordpress/env` (`wp-env` runtime, `wp-cli`), Playwright.
- **Documentation (selection grounding, not a runtime dependency):** developer.wordpress.org pages cited per scenario above.

## Failure Modes and Observability

- **Scenario not discovered:** A directory not placed as an immediate child of `eval/scenarios/`, or missing `scenario.yaml`, is silently skipped by `enumerate.ts`. Mitigation: flat layout with the two required files. Observable as the scenario simply not appearing in run output.
- **Invalid `name`:** `scaffold-plugin.ts` throws if `name` (or agentId) does not match `/^[a-z0-9-]+$/`. The chosen names all conform.
- **e2e cannot activate the plugin / wrong slug:** If a spec activates a slug that does not match `plugin-<scenario.name>-<agentId>`, activation fails and the spec errors. Mitigation: specs derive the slug from `scenario.name` and `workerInfo.project.metadata.agentId`, exactly as existing specs do.
- **e2e assertion drift (CPT/REST):** Mitigated by pinning the identifier/route in the prompt (see Key Decisions); the spec asserts the pinned string.
- **Build step:** `verify-e2e.ts` runs `wp-scripts build` only for plugins with `src/blocks` (always present from the scaffold) and logs but does not abort on build failure. For these non-block scenarios the build is incidental; the feature under test lives in `index.php` and runs regardless.
- **Observability:** Failures surface through Playwright's JSON report (`tests-report.json`), which `verify-e2e.ts` parses into per-(scenario, agent) `VerificationFailure` records (`details: "e2e failed: <spec title>"`). Judge results surface through Skillsmith's normal grading output. `wp-env` start/stop and build steps log to stdout/stderr via `stdio: "inherit"`.
- **Expected non-failure:** Per the spec, a *failing grade against the current skill* is acceptable and is not a harness error. The bar is that each scenario runs to a graded result and its e2e executes; it need not pass against today's skill.

## Risks and Open Questions

- **Block scaffold nudges block-based work (Risk).** The scaffold writes a block plus a testing-agent expectation oriented around blocks. For these four non-block tasks the agent must instead add hooks to `index.php`. The extra block registration is inert, but the agent could be distracted by the scaffold. Mitigation: outcome-focused, unambiguous prompts and acceptance points that describe the feature, not a block. This is a known harness limitation, not a defect introduced here. Phase 4 should keep the prompts crisp about the desired non-block outcome.
- **Shortcode output shape is intentionally unconstrained (resolved).** The acceptance points require the rendered page to include "Alice" but do not pin the HTML structure; the e2e asserts only that "Alice" appears in the rendered content. This is deliberate — choosing the markup is the skill's job. No open question remains; phase 4 should write the e2e to assert the text, not a specific element.
- **CPT identifier / REST route drift (resolved by pinning).** Open question from research — whether to pin or discover the slug/namespace — is resolved here by pinning `books` and `/wp-json/myplugin/v1/hello` in the prompts. Phase 4 must keep the prompt string and the e2e assertion target in lockstep; if a prompt is reworded, the matching e2e assertion must change with it.
- **Return-not-echo and escaping are acceptance-point obligations (implementation note for phase 3/4).** Three scenarios depend on "return, don't echo" (filter returns the array; shortcode returns a string; REST callback returns data) and the shortcode depends on escaping the attribute before output (`esc_html()`/`esc_attr()`). These are captured per-scenario in the `acceptance` lists (not in a rubric, by decision above); phase 4 must transcribe them faithfully so the judge can check them.
- **Slug-vs-directory-name consistency (implementation note).** `scenario.name` (not the directory name) is the plugin slug fragment the e2e activates. This batch sets `name` equal to the directory name for each scenario; phase 4 must keep them equal, or else update the spec's `activatePlugin` call to use the `name` value.
