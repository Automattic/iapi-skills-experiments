# Add an initial set of simple, doc-driven WordPress development scenarios

> Source: GitHub issue [Automattic/wordpress-skill-experiments#36](https://github.com/Automattic/wordpress-skill-experiments/issues/36).
> This file is self-contained; agents do not need to open the source issue.

## Goal

The `wordpress-development` eval suite covers more than the Interactivity API. It includes an initial set of **simple** scenarios drawn from the official WordPress developer documentation (developer.wordpress.org and its sublinks), so the skill can be evaluated across a broader range of WordPress development tasks. Cross-cutting best practices that are shared across scenarios are captured in **simple, general rubrics** rather than repeated in each scenario's own success criteria.

## Constraints

- Scope this first batch to **simple** scenarios only; more complex scenarios are deliberately left for later, separate work.
- **Scenario prompts must stay simple and read like a real user's request** — phrased by outcome/intent, not by implementation. They must **not** name the specific tool, API, or technology to use (e.g. not "build a block with the Interactivity API"); choosing the right approach is the skill's job. This mirrors how the existing scenario prompts are written.
- Do **not** change the skill itself (`skills/wordpress-development/`) in this work. Only scenarios and rubrics are added/changed here; skill updates happen afterward, once the scenarios exist.
- Scenarios must be grounded in the official WordPress developer documentation at developer.wordpress.org and its sublinks.
- Any shared rubrics added must stay **simple** and contain only general, cross-cutting checks. A scenario's success criteria must not restate anything its rubrics already cover, and rubrics must not absorb scenario-specific criteria.

## Context

- Today every scenario under `eval/scenarios/` targets the Interactivity API, and the only rubric is `wp-interactivity-api-best-practices.md`. This work begins broadening the suite to the wider WordPress development domain.
- Scenarios are authored for and tested with **Skillsmith** (https://github.com/Automattic/skillsmith); new scenarios and rubrics must fit its scenario format and conventions.
- This issue intentionally stops at scenarios (and shared rubrics). Expanding the skill to document these new topics is planned as follow-up work once the scenarios exist — the scenarios lead, the skill catches up later.
- Primary source: https://developer.wordpress.org/ and its sublinks (e.g. Block Editor Handbook, Themes Handbook, Plugin Handbook, REST API Handbook, Common APIs, Coding Standards).

## Assumptions / directions to explore

*(open — later research may confirm or revise these)*

- Organizing scenarios into per-topic folders (e.g. grouping by area such as plugins, themes, blocks, REST API) is worth exploring — the exact structure is open.
- The existing Interactivity API scenarios may be reorganized into that topic structure (e.g. under an `interactivity-api/` folder) if it aids consistency; whether to actually move them is left to the pipeline to decide.
- Topic selection for the first batch is intentionally left open: a sensible spread of simple, documentation-driven scenarios should be chosen during research rather than fixed here.
- Plausible cross-cutting rubric themes, *only where genuinely shared across scenarios*: WordPress coding standards, security (escaping/sanitization/nonces), and internationalization (i18n). Which rubrics, if any, are warranted is open.
