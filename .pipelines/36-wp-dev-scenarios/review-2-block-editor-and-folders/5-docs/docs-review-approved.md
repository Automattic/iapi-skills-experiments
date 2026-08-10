# Docs Review

## Verdict: approved

## Batch scope

Tasks reviewed: none. The doc plan for run `review-2-block-editor-and-folders` is **empty (zero documentation tasks)** by design, so no doc-writer ran. This is a no-op docs batch. The review independently confirms, against the actually-shipped code, that the empty plan still holds — i.e. no live documentation goes stale now that this run landed (five new `block-editor-*` scenarios plus the in-place Block Editor promotion of `eval/scenarios/_wp-dev-candidates.yaml`, including its header-line fix).

## Summary

I re-swept every live documentation surface in the repository myself rather than trusting the doc plan's recorded sweep, and verified each concrete claim against the shipped code. Every eval/scenario-referencing doc surface remains accurate after this run: the README's "two candidate catalogs" pointer still names exactly the two catalogs that exist on disk (the catalog was edited in place — not renamed, no third catalog added — and its recorded one-line role still spans "the developer.wordpress.org areas," which Block Editor is one of); the README's `(e.g. counter, cpt-register)` line remains an illustration of bare directory names (both directories still exist) and not an enumeration or count; no live doc (README, `.rp.md`, prompts, rubric) describes any scenario-directory naming scheme, so the adopted `block-editor-*` convention contradicts nothing; `eval/prompts/testing-agent.md` already mandates the fixed block name `wp-skill/testing-block`, the fixed registration mechanism, and the `get_block_wrapper_attributes()` wrapper behavior that the five new scenarios consume unchanged; and the skill sentence (README line 7), the iAPI rubric, `eval/prompts/improver.md`, the iAPI `_candidates.yaml`, `.rp.md`, and the README run-mechanics prose are all out of scope and unaffected. The one genuinely self-describing surface that would have gone stale — the `_wp-dev-candidates.yaml` header's "only for the six implemented Plugins scenarios" claim — was fixed in place by the **code phase** (it now reads "for the implemented Plugins and Block Editor scenarios"), which the shipped diff confirms, so it is accurate and is not a doc-phase miss. An empty doc plan is therefore the correct deliverable, and no documentation change is warranted.

## Checks

The project defines no guardrail convention and `package.json` exposes no lint/typecheck/unit/structural gate (scripts: `postinstall`, `skillsmith` [capped/owner-only full matrix], `test:e2e` [requires a `wp-env` boot — not a structural gate, and a live pass is out of bounds per the spec], `env:start`, `env:stop`). There are therefore no gates to run, and the accuracy spot-check below is the verification evidence.

| Check | Command | Result |
| ----- | ------- | ------ |
| None (no project guardrails) | — | n/a |

## Accuracy spot-check

This is a no-op batch (zero tasks), so there is no per-task claim to verify. Instead, the load-bearing claims of every live doc surface were each checked against the shipped code:

- **README "two candidate catalogs" pointer (lines 36-38).** Claim: `eval/scenarios/` holds two leading-underscore non-directory catalogs, `_candidates.yaml` and `_wp-dev-candidates.yaml`, that discovery skips. Verified: `ls eval/scenarios/` shows exactly those two `_`-prefixed files (no third catalog, no rename); the code diff (`git diff --name-only 6ec97e7 71438fc`) touched only `_wp-dev-candidates.yaml` in place and the five new scenario dirs. Accurate.
- **README `_wp-dev-candidates.yaml` role line (line 38).** Claim: "broader WordPress-development candidates spanning the developer.wordpress.org areas." Verified: the catalog still spans multiple area headers (`# === Area: Block Editor ===`, `# === Area: Themes ===`, …); Block Editor is one of those areas, and only its section was promoted. Still holds.
- **README `(e.g. counter, cpt-register)` (line 31).** Claim: bare directory names are scenario names. Verified: `counter/` and `cpt-register/` both exist under `eval/scenarios/`; the line is an illustrative "e.g.", not an enumeration. The new `block-editor-*` names do not falsify it.
- **README skill sentence (line 7).** Claim: the skill's main topic is the Interactivity API, covered by `references/interactivity-api.md` plus five sub-references. Verified: `skills/wordpress-development/references/interactivity-api.md` exists and `references/interactivity-api/` holds exactly five files. The skill was not modified by the code diff. Accurate and out of scope.
- **`eval/prompts/testing-agent.md` scaffold mandate (lines 5, 7).** Claim: fixed block name `wp-skill/testing-block`, fixed registration mechanism, and `render.php` must call `get_block_wrapper_attributes()` to emit the wrapper class and block-supports attributes. Verified: these are exactly the behaviors the five shipped `scenario.yaml` acceptance points rely on (e.g. dynamic-block/supports/styles each reference `get_block_wrapper_attributes()`), and the prompt was not modified. The new scenarios consume the scaffold unchanged; no edit needed.
- **`_wp-dev-candidates.yaml` header-line fix.** Claim (post-fix): "Full prompt + acceptance are included for the implemented Plugins and Block Editor scenarios; all other records are lighter stubs." Verified against `git show 2137750`: the five new Block Editor records carry full `prompt` + `acceptance` (verbatim-matching the shipped `scenario.yaml`), the three deferral stubs and two retained stubs carry no `prompt`/`acceptance`. The refreshed header now accurately self-describes the file; the pre-edit "only for the six implemented Plugins scenarios" wording would have been stale. The fix was made by the code phase, which owns this file.
- **`.rp.md`, `eval/prompts/improver.md`, `eval/rubrics/wp-interactivity-api-best-practices.md`.** Grepped for any scenario enumeration, count, naming-convention, or catalog-by-name reference: none found. `.rp.md` only restates the agent cap; `improver.md` is scoped to the untouched iAPI skill; the rubric scopes itself to "every Interactivity API scenario" and the new Block Editor scenarios declare `rubrics: []`. None goes stale.

## Issues

None.
