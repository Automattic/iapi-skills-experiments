# Doc Plan Review

## Verdict: approved

## Summary

The doc plan is **empty by design (zero documentation tasks)**, and an independent end-to-end sweep of the live repository confirms that no external prose documentation goes stale when this run lands (five new `block-editor-*` scenarios plus the in-place edit of the Block Editor section of `_wp-dev-candidates.yaml`). I re-swept every doc surface myself rather than trusting the plan's recorded sweep, and every eval/scenario-referencing surface the plan lists as "deliberately not changed" checks out: the README's "two candidate catalogs" pointer stays accurate because the catalog is edited in place (not renamed or added) and its one-line role already spans "the developer.wordpress.org areas"; the README's `(e.g. counter, cpt-register)` line is an illustration, not an enumeration; no live doc describes any scenario-naming scheme, so the adopted `block-editor-*` convention contradicts nothing; `testing-agent.md` already mandates the `get_block_wrapper_attributes()` wrapper behavior the new scenarios consume unchanged; and the skill, rubrics, iAPI catalog, `.rp.md`, and run-mechanics prose are all out of scope and unaffected. The one self-describing surface that genuinely goes stale — the catalog header's claim that "full prompt + acceptance are included only for the six implemented Plugins scenarios" — lives inside `_wp-dev-candidates.yaml`, which is authored and edited by the **code phase** (code-plan Task 6 owns that file and explicitly allows refreshing its header), not by the doc phase. An empty doc plan is therefore the correct deliverable, and no doc change is warranted. The required document structure is present, and the `## Guardrail scopes` section correctly renders `None | None` because the project defines no scoped gates (confirmed independently against `package.json`, which exposes no lint/typecheck/unit gate, matching the code plan's identical finding).

## Verification performed

**Guardrail scopes.** The project defines no scoped gates. `package.json` scripts are `postinstall`, `skillsmith` (capped/owner-only), `test:e2e` (full Playwright requiring a `wp-env` boot — not a structural gate), and `env:start`/`env:stop`. There is no passed scoped gate to fill, so the single `None | None` row is the valid empty rendering, consistent with the code plan's independent "No project guardrails" finding. No gate command existed to execute.

**Surface sweep (every eval/scenario/catalog-referencing surface, swept independently):**

- `README.md` "two candidate catalogs" pointer (L36-38) — accurate after an in-place catalog edit; the catalog is not renamed, no third catalog is added, and its recorded role ("broader WordPress-development candidates spanning the developer.wordpress.org areas") still holds once Block Editor records are promoted. Not stale.
- `README.md` `(e.g. counter, cpt-register)` (L31) — explicitly an illustrative "e.g." of bare directory names, not an enumeration or count. The new names do not make it stale.
- `README.md` "Skill structure" iAPI sentence (L7), "Running evals" / "Full matrix" / "Report location" / "Agent cap (R12)" — describe the untouched skill and unchanged run mechanics; flat discovery is preserved, so nothing goes stale. Out of scope.
- `eval/prompts/testing-agent.md` — already mandates `get_block_wrapper_attributes()` and the fixed block name/registration; the five scenarios consume the scaffold unchanged. Out of scope.
- `eval/prompts/improver.md` — skill-improvement input scoped to the Interactivity API; the only block-editor token is a docs URL. Out of scope.
- `eval/rubrics/wp-interactivity-api-best-practices.md` — scopes itself to "every Interactivity API scenario"; the new scenarios declare `rubrics: []`. Does not enumerate or count. Out of scope.
- `skills/wordpress-development/**` (SKILL.md + 6 iAPI references) — grepped clean of any eval/scenario/catalog/count reference; skill is untouched (Spec R18 / AC17). Out of scope.
- `.rp.md` — no scenario enumeration, count, naming-convention, or catalog-by-name reference. Out of scope.
- Scenario-naming-convention doc — no such live doc exists, so the adopted `block-editor-*` convention contradicts nothing and makes nothing stale; no contributor note is warranted.

**The one genuinely-staling surface is a code-phase surface, not a doc-phase miss.** The header of `eval/scenarios/_wp-dev-candidates.yaml` (lines 28-29) asserts: "Full prompt + acceptance are included only for the six implemented Plugins scenarios; all other records are lighter stubs." This run promotes five Block Editor records to full (with `prompt` + `acceptance`), which falsifies that claim unless the header is refreshed. However, `_wp-dev-candidates.yaml` is a self-describing planning/data file authored and edited entirely by the **code phase** (`code-plan.md` Task 6, whose Changes step explicitly permits an optional one-line header refresh). The doc phase does not own this file, and the doc plan's exclusion reasoning for it (its "Surfaces deliberately not changed" entry) is sound. This is flagged here only as a non-blocking reminder for the code phase — it is not a defect in the doc plan.

## Issues

None.
