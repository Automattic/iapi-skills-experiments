# Docs Summary: Initial simple WordPress development scenarios

## What

A single, one-line README refresh. The "Running evals → Single scenario" subsection's illustrative scenario-name example list changed from `(e.g. counter, async-fetch)` to `(e.g. counter, cpt-register)`, so the example now includes one of the batch's new non-Interactivity-API scenarios. No other documentation surface was added or modified.

## Why

The code phase broadened the eval suite beyond the Interactivity API by adding four self-describing scenarios (`filter-body-class`, `shortcode-with-attr`, `cpt-register`, `rest-custom-endpoint`). The README's "Single scenario" example previously cited only Interactivity-API scenarios; refreshing one example name keeps the illustration representative of the now-broader suite for contributors running evals locally, without implying the example list is exhaustive.

## How

The doc-writer substituted a single real directory name (`cpt-register`, verified to exist under `eval/scenarios/`) into the existing example sentence, leaving the worked `npx skillsmith counter` snippet and every other README section unchanged. The edit is confined to the "Single scenario" subsection and introduces no scenario enumeration and no restatement of any `scenario.yaml` content, keeping the doc drift-resistant.

## Key decisions

- **Deliberately near-empty doc plan.** An end-to-end sweep of the repository's live docs found no surface that goes stale when the four scenarios land: no doc enumerates scenarios exhaustively, claims a scenario count, or asserts "all scenarios target the Interactivity API." The only required change was the optional, illustrative example refresh.
- **Other surfaces left untouched on purpose.** The README "Skill structure" line, `eval/prompts/improver.md`, `eval/prompts/testing-agent.md`, and `eval/rubrics/wp-interactivity-api-best-practices.md` all reference the skill, the block scaffold/harness, or the Interactivity API specifically — all unchanged by this work and out of scope (the skill must not be documented or modified). Editing any of them would either document forbidden skill content or anticipate harness/skill changes this batch does not make.
- **Drift-resistance over completeness.** Each scenario's canonical `description`/`prompt`/`acceptance` lives in its own `scenario.yaml`; duplicating that into external docs would drift, so the README keeps only illustrative directory names.

## Known limitations

The README example remains illustrative, not exhaustive — it names two of the suite's scenarios. This is intentional: the suite is meant to grow, and an exhaustive list in the README would itself become a drift surface.
