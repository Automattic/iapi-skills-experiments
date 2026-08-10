# Docs Summary

## What

A single four-line pointer was added to `README.md` in the "Running evals → Single scenario" area. It tells a contributor browsing `eval/scenarios/` that the directory holds two leading-underscore (non-directory) candidate catalogs and what each is for at a one-line level:

- `eval/scenarios/_candidates.yaml` — candidate Interactivity-API scenarios.
- `eval/scenarios/_wp-dev-candidates.yaml` — broader WordPress-development candidates spanning the developer.wordpress.org areas.

The note also states both files are planning artifacts that scenario discovery skips (not runnable scenarios). No other documentation surface was changed.

## Why

This run introduces a *second* `_*-candidates.yaml` file (`_wp-dev-candidates.yaml`) beside the existing iAPI `_candidates.yaml`. Without a pointer, a contributor browsing `eval/scenarios/` cannot tell which catalog is which, or that both are non-scenario planning artifacts the harness skips. The note resolves that ambiguity at a who-is-who level.

## How

The pointer was placed in the most natural existing location — the "Single scenario" subsection, which already explains that scenario names are the bare directory names under `eval/scenarios/`. The two filenames and their one-line roles were drawn from each file's own self-describing header (verified against the filesystem at phase-5 time), not invented.

## Key decisions

- **Near-empty doc plan, honored as written.** An end-to-end repo sweep found no live doc that goes stale when the six Plugins scenarios + the new catalog land: no live doc enumerates scenarios, claims a count, asserts an Interactivity-API-only suite, or referenced `_candidates.yaml` by name. The only needed touch was the two-catalog disambiguation pointer.
- **Pointer only, never a restatement.** The note names the two files and gives a one-line role for each; it deliberately does NOT enumerate catalog entries, the 10 areas, the six new scenarios, any counts, or any `scenario.yaml`/catalog `description`/`prompt`/`acceptance`. That content lives in the self-describing data files and would drift if duplicated in prose.
- **Surfaces left untouched (and why).** The "Skill structure" line (L7) describes the *skill* (unchanged, and the spec forbids documenting it); the "Single scenario" example (`e.g. counter, cpt-register`) is illustrative and already accurate; `eval/prompts/improver.md` and `eval/prompts/testing-agent.md` are skill/harness prompts, not contributor docs; the iAPI rubric applies only to iAPI scenarios; `.rp.md` restates only the agent cap. The existing `_candidates.yaml` is referenced by name but not edited. The catalog and reference taxonomy are self-describing planning artifacts authored by the code/design phases.

## Known limitations

- The discovery-skip claim relies on skillsmith's discovery-guard behavior (non-directory files skipped before the YAML-existence check), verified at the pinned skillsmith SHA during the design phase; the skillsmith package is not installed in this worktree, so the guard was not re-executed here. It is corroborated by the existing `_candidates.yaml` already coexisting with real scenarios in the working suite.
- The pointer is intentionally minimal; it does not (and by design must not) describe the catalogs' contents, so a reader still opens the files to see candidate entries, areas, or scenario records.
