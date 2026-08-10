# Code Review

## Verdict: approved

## Batch scope

Tasks reviewed (re-dispatched from rejection iteration 1):

- Task 4: Migrate the 9 existing scenarios; delete the 2 non-curated + the index — re-dispatched to clean the acceptance lists of 7 migrated scenarios (Issues 1 and 2).
- Task 8: Author `derived-state` group (4 new) — re-dispatched to make two specs' assertions verify the scenario's distinctive derived behavior (Issue 3).

The rest of the batch (Tasks 1, 2, 4 migration mechanics, 5–7, 9–16) was approved in iteration 1 and is unchanged in this iteration. The diff `81a5dbe → HEAD` carries those approved commits plus exactly the two fix commits reviewed here (`d194552`, `c369265`).

## Summary

The three iteration-1 defects are all genuinely resolved, and the fixes are tightly scoped — the two fix commits touch exactly the nine flagged files and nothing else. The seven migrated scenarios (`minimal-scaffold`, `independent-counters`, `shared-state-tally`, `derived-double`, `config-rest-nonce`, `fruit-list-with-add`, `paginated-posts-router`) now carry acceptance lists with no iAPI directive/store/server-API names and no rubric-owned wiring restatements; each retains its distinct concept, and the only "first paint" claims left are tied to concrete seeded values (mirroring the already-approved `joke-fetch`/`side-drawer` template). `config-rest-nonce` no longer re-endorses the deprecated `data-wp-on-async--click` directive. The two `derived-state` specs now assert the real derived computation: `price-with-vat` parses both decimals per card and asserts `vatTotal ≈ basePrice × 1.20`; `shopping-list-server-derived` asserts the per-row server-derived in-cart icon is present on in-cart rows and absent on every not-in-cart row in the raw server HTML. No regressions: the tree is still exactly the 68 curated scenarios across 12 groups, every leaf is well-formed, all 68 `name` fields are unique and equal their directory, the edited YAMLs parse and keep the schema, the edited specs parse as valid JS, and the approved `joke-fetch`/`side-drawer` reference pair is untouched.

## Checks

This project has no guardrails convention defined, so there are no gates to run. The verdict rests on review judgment plus the repository-state behavior verification below (these specs are authored test-first and are not executed in this run).

| Check | Command | Result |
| ----- | ------- | ------ |
| (no guardrails convention defined for this project) | — | n/a |

## Behavior verification

Per the launch prompt, the `e2e.spec.mjs` files are authored test-first and **not executed** in this run; behavior verification is re-driving the E2E test plan's Flows 1–5 against the committed repository state, focused on what the two fix commits could disturb. Evidence captured:

- **Iteration-1 issue confirmation (the core of this iteration).**
  - **Issue 1 (Task 4) — resolved.** A token scan over the `acceptance` blocks of all seven flagged scenarios for `data-wp-*`, `wp_interactivity_*`, `store(`, `getContext`, `getConfig`, `getElement`, `withSyncEvent`, `function*`, `yield`, `addEventListener`, `innerText`, `textContent`, `render.php`, `view.js`, `block.json` returned **zero hits** in every file. Reading each list, the distinct concept survives (minimal-scaffold → init-once-per-instance; independent-counters → per-instance independence; shared-state-tally → page-wide shared state across instances; derived-double → derived value always 2× the counter with a single mutable field; config-rest-nonce → server-computed REST URL + nonce read on the client and sent as the `X-WP-Nonce` header; fruit-list-with-add → SSR list + in-place append; paginated-posts-router → in-place region swap + no-JS fallback + per-page SSR), and the only first-paint statements are tied to concrete seeded values, matching the already-approved `joke-fetch`/`side-drawer` template.
  - **Issue 2 (Task 4) — resolved.** `config-rest-nonce/scenario.yaml` no longer contains `data-wp-on-async`; the whole rubric-owned wiring restatement was removed. The sole header reference (`X-WP-Nonce`) is a user-facing integration point, not an iAPI directive.
  - **Issue 3 (Task 8) — resolved.** `price-with-vat/e2e.spec.mjs:71-101` now parses all `\d+\.\d{2}` numbers per card, takes min as base and max as VAT total, and asserts `vatTotal` is close to `basePrice * 1.2` to 2 decimals (sound, since base × 1.20 is always strictly greater than base). `shopping-list-server-derived/e2e.spec.mjs:31-100` now asserts `inCartCount > 0` for in-cart rows and, in the second test, asserts `notInCartCount > 0` and loops each not-in-cart row asserting it contains zero in-cart-icon descendants — all against raw server HTML with `setJavaScriptEnabled(false)`. The previously-unused `inCartIcons` locator is now asserted on.
- **No-regression / scope check.** `git diff --name-only 05f173b..HEAD` is exactly the nine flagged files (seven migrated `scenario.yaml` + two `derived-state` `e2e.spec.mjs`). `joke-fetch` and `side-drawer` — the iteration-1 approved reference pair — were **not** modified.
- **Flow 1 (curated tree is exactly the 68 scenarios).** `find eval/scenarios -name scenario.yaml` and `-name e2e.spec.mjs` each yield **68**, under exactly the 12 group directories. No `counter/`, `toggle-visibility/`, `_candidates.yaml`, flat scenario dir, or group-level YAML exists. **Pass.**
- **Flow 2 (every directory is well-formed).** Every one of the 68 leaves contains both files (per-leaf loop found none incomplete). All 68 `name` fields are globally unique (`uniq -d` empty). For the nine edited scenarios, `name` still equals the directory name. The seven edited YAMLs parse via `js-yaml` and keep the fields `name, description, skills, prompt, acceptance, rubrics` with `skills: [wordpress-development]` and `rubrics: [wp-interactivity-api-best-practices]`. **Pass.**
- **Flow 3 (prompts user-language, acceptance scenario-specific).** Acceptance now passes for the seven previously-failing migrated scenarios (token scan above) and re-endorses no deprecated directive. **Pass.**
- **Flow 4 (specs follow repo conventions, runnable in shape).** Both edited `derived-state` specs import `deactivateAllPlugins` from `../../../utils/wp-cli.mjs`, activate `plugin-<scenario>-${...agentId}`, target `wp-skill/testing-block`, and `node --check` parses each without error. **Pass.**
- **Flow 5 (tooling supports the nested layout).** Untouched by these fixes and confirmed in iteration 1 (`@automattic/skillsmith` pin → trunk SHA `95c86bdbbcae79c4dc46dea07d15fd5d69e4ee2d`, `scenarioDirOf()` nested behavior, rubric no longer contains `data-wp-on-async`). The working tree is clean and HEAD is at `c369265`. **Pass.**
