# Docs Review

## Verdict: approved

## Batch scope

Tasks reviewed:
- Task 1: Refresh the README's single-scenario example list to reflect the broadened suite (commit `8756c48`).

## Summary

The batch is a single, deliberately near-empty, drift-resistant README touch-up. The doc-writer changed exactly one line in the "Running evals → Single scenario" subsection, substituting the now-removed-as-example `async-fetch` for `cpt-register` so the illustrative scenario-name list spans the broadened (non-Interactivity-API) suite. The change is accurate against the shipped code, confined to the correct subsection, introduces no enumeration or `scenario.yaml` content, and leaves the skill-scoped "Skill structure" line and every other README section untouched. I independently re-ran the doc plan's "Surfaces deliberately not changed" sweep across `README.md`, `eval/prompts/*`, and `eval/rubrics/*` and confirmed no live doc goes stale now that the four scenarios shipped. Approved.

## Checks

The project defines no guardrail scopes (doc plan: "No project guardrails... no scoped gates"). There are no gates to run; the accuracy spot-check below is the verification evidence.

| Check | Command | Result |
| ----- | ------- | ------ |
| (no project guardrails declared) | — | n/a |

## Accuracy spot-check

Task 1 — every concrete claim in the changed line verified against the shipped code and the README's surrounding sections:

- **`cpt-register` is a real scenario directory.** `test -d eval/scenarios/cpt-register` → present (a Custom Post Types scenario, i.e. non-Interactivity-API), matching the design doc's `cpt-register` component. The example name exactly matches a real directory name under `eval/scenarios/`.
- **`counter` is still present.** `test -d eval/scenarios/counter` → present, so the retained example remains valid and the worked `npx skillsmith counter` example below it still resolves.
- **Change is confined to the "Single scenario" subsection.** `git diff 81a5dbe..HEAD -- README.md` shows exactly one changed line (line 31); `git show --stat 8756c48` shows `README.md | 2 +-`, the doc commit touched only `README.md`. The "Skill structure" line (line 7) and all other sections are byte-identical.
- **No drift introduced.** The line cites two illustrative directory names only — no exhaustive scenario enumeration, no scenario count, and no restatement of any `scenario.yaml` `description`/`prompt`/`acceptance`.

Independent re-verification of the doc plan's "Surfaces deliberately not changed" (swept `README.md`, `eval/prompts/*`, `eval/rubrics/*`):

- **`README.md` line 7 ("Skill structure", "the main topic is the Interactivity API")** — scoped to the *skill* under `skills/wordpress-development/`, which this work does not modify; references the skill's reference files, not eval scenarios. Remains accurate. Correctly untouched.
- **`eval/prompts/improver.md` ("Keep it focused on the Interactivity API, and not whole WordPress")** — governs growing the *skill* (deferred follow-up); the skill is unchanged. Not stale.
- **`eval/prompts/testing-agent.md` (block-scaffold instructions: `wp-skill/testing-block`, `get_block_wrapper_attributes()`)** — harness/scaffold-facing; the scaffold is consumed unchanged and the new non-block scenarios coexist with it (per the design doc). Not stale.
- **`eval/rubrics/wp-interactivity-api-best-practices.md`** — scoped to "**every** Interactivity API scenario"; no new iAPI scenarios were added, so it is unaffected. Not stale.
- No doc anywhere in `README.md`/`eval/` enumerates scenarios exhaustively, asserts a scenario count, or claims "all scenarios target the Interactivity API" (grep for such claims returned none). No stale surface the plan missed.
