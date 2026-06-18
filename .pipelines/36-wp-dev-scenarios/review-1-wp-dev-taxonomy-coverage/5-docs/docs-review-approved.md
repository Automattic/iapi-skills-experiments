# Docs Review

## Verdict: approved

## Batch scope

Tasks reviewed:
- Task 1: Add a one-line README pointer disambiguating the two candidate-catalog files (commit `4652c7a`).

## Summary

The batch is a single, deliberately near-empty doc change: a four-line note inserted into the README "Running evals → Single scenario" area that names the two leading-underscore candidate catalogs now coexisting under `eval/scenarios/` (`_candidates.yaml` for Interactivity-API candidates, `_wp-dev-candidates.yaml` for the broader WordPress-development candidates) and states that both are non-directory planning artifacts skipped by scenario discovery. Every concrete claim was verified against the shipped code: both files exist as leading-underscore regular (non-directory) files, and each README one-line role matches that file's own self-describing header. The change introduces no enumeration of entries, areas, scenarios, or counts, and restates no `scenario.yaml`/catalog content, so it is drift-resistant. It is confined to the chosen location — the "Skill structure" line (line 7) and the existing "Single scenario" example (`e.g. counter, cpt-register`) are untouched, the existing `_candidates.yaml` and the skill are unmodified, and no existing scenario directory was touched. I independently re-ran the doc plan's "Surfaces deliberately not changed" sweep across `README.md`, `eval/prompts/*`, `eval/rubrics/*`, and `.rp.md` and found no other live doc left stale by the six new Plugins scenarios + the new catalog.

## Checks

The project defines no guardrails (the doc plan's "Guardrail scopes" table is `None`/`None`; no lint/format/markdownlint/doc gates exist in `package.json` or repo config). There are therefore no gates to run; the accuracy spot-check below is the verification evidence.

| Check | Command | Result |
| ----- | ------- | ------ |
| (no project guardrails) | (none defined) | n/a |

## Accuracy spot-check

**Task 1 — both filenames exist and are non-directory leading-underscore files (discovery-skipped):**
`ls -la` / `file` confirm `eval/scenarios/_candidates.yaml` and `eval/scenarios/_wp-dev-candidates.yaml` are both regular UTF-8 text files (not directories) with leading underscores. `ls -1 eval/scenarios/ | grep '^_'` returns exactly those two. The discovery-skip claim is the design-verified guard-A behavior (non-directory skipped before the YAML-existence guard, verified verbatim at the pinned skillsmith SHA `6bd90c34d88b815fdf4fd661dc8c51288111444c`), corroborated by the existing `_candidates.yaml` already coexisting with real scenarios in the working suite.

**Task 1 — each README one-line role matches that file's own self-describing header:**
- README L37 says `_candidates.yaml` → "candidate Interactivity-API scenarios." File header L1: "Candidate Interactivity API scenarios mined from Gutenberg docs and canonical interactive blocks." Match.
- README L38 says `_wp-dev-candidates.yaml` → "broader WordPress-development candidates spanning the developer.wordpress.org areas." File header L1/L4-7: "WordPress-development candidate catalog — distinct from the Interactivity-API catalog … It covers every one of the 10 top-level developer.wordpress.org areas." Match.

**Task 1 — drift-resistance and scope confinement (verified against the diff):**
The inserted note (README L36-38) enumerates no entries, no areas, no scenario names, no counts, and restates no `scenario.yaml`/catalog `description`/`prompt`/`acceptance`. `git diff a1095e3..HEAD -- README.md` shows only the four-line insertion; the "Skill structure" line and the "Single scenario" example are unchanged. `git diff --stat` confirms `skills/wordpress-development/`, `eval/scenarios/_candidates.yaml`, and all existing scenario directories are untouched.

**Independent stale-surface sweep (re-verifying the doc plan's "Surfaces deliberately not changed"):**
`grep -rniE` over `README.md`, `eval/prompts/*`, `eval/rubrics/*`, `.rp.md` for Interactivity-API / scenario / candidate / `eval/scenarios` references, then inspection of each hit:
- `eval/prompts/improver.md` — a skill-growth prompt scoped to the Interactivity API skill (unchanged, deferred follow-up); not contributor docs; no scenario enumeration or catalog reference. Not stale.
- `eval/prompts/testing-agent.md` — harness/scaffold prompt describing the `wp-skill/testing-block` scaffold consumed unchanged. Not stale.
- `eval/rubrics/wp-interactivity-api-best-practices.md` — scoped to "every Interactivity API scenario"; the six new Plugins scenarios all declare `rubrics: []`, so unaffected. Not stale.
- `.rp.md` — restates the agent cap only; no scenario count, enumeration, or catalog name. Not stale.
- README "Skill structure" (L7) — describes the skill (unchanged); still accurate. README "Single scenario" example (`e.g. counter, cpt-register`) — illustrative, not an enumeration; not stale.

No missed stale surface found.
