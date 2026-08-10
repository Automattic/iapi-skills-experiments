# Code Summary

## What

Phase 4 produced eight new files across four new Skillsmith eval scenario directories under `eval/scenarios/`:

- `eval/scenarios/filter-body-class/scenario.yaml` + `e2e.spec.mjs`
- `eval/scenarios/shortcode-with-attr/scenario.yaml` + `e2e.spec.mjs`
- `eval/scenarios/cpt-register/scenario.yaml` + `e2e.spec.mjs`
- `eval/scenarios/rest-custom-endpoint/scenario.yaml` + `e2e.spec.mjs`

No existing file was modified. No rubric files, no skill files, no harness or config files were changed.

## Why

The `wordpress-development` skill evaluation suite previously covered only the Interactivity API (11 scenarios, one rubric). This batch broadens the suite across four distinct, foundational WordPress development topic areas — Hooks/Filters, Shortcodes, Custom Post Types, and REST API custom endpoints — each grounded in official developer.wordpress.org documentation. The goal is to start measuring the skill's competence outside the Interactivity API domain so it can be grown to cover the wider WordPress development landscape.

## How

Each scenario directory mirrors the `eval/scenarios/counter/` reference pattern: a `scenario.yaml` (Skillsmith discovery + LLM-judge input) and an `e2e.spec.mjs` (Playwright spec run under `wp-env`). The `scenario.yaml` for every new scenario uses `skills: [wordpress-development]`, a tool-agnostic user-voice `prompt`, a scenario-unique `acceptance` list, and `rubrics: []` (explicit empty array required by Skillsmith's `isScenarioShape` validator). Each e2e spec follows the established lifecycle: `beforeAll` calls `deactivateAllPlugins()` then `requestUtils.activatePlugin('plugin-<name>-${workerInfo.project.metadata.agentId}')`, runs the scenario-specific assertion, and `afterAll` calls `deactivateAllPlugins()` (plus `deleteAllPosts()` where posts were seeded). The four specs exercise the full range of available harness mechanisms: a DOM locator assertion (`filter-body-class`), a REST status check (`cpt-register`), a REST status + JSON shape check (`rest-custom-endpoint`), and a post-seeding + text-content assertion (`shortcode-with-attr`).

## Key decisions

- **Zero new rubrics.** No check recurs in the same form across all scenarios; each `acceptance` list carries all its own points. The `rubrics: []` key is still present in every YAML to satisfy the Skillsmith discovery validator.
- **CPT identifier and REST route pinned in the prompts.** `books` and `/wp-json/myplugin/v1/hello` appear in the prompts so the e2e specs can assert deterministic targets rather than discover them dynamically. The prompts remain tool-agnostic — only the user-visible names are pinned, not the implementation API.
- **Flat layout, no topic subdirectories.** All four scenarios are immediate children of `eval/scenarios/` because Skillsmith's `enumerate.ts` reads only that level (no recursion). Topic subdirectories would make the scenarios undiscoverable without harness changes.
- **All four scenarios include an e2e spec.** Every scenario produces an unambiguous, runtime-testable outcome (body class, rendered text, REST 200, REST 200 + JSON shape), so judge-only grading was not chosen for any of them.

## Known limitations

- Scenarios are structurally and statically verified (schema, prompt tool-agnosticity, acceptance content, e2e flow correctness) but are not run end-to-end against a live `wp-env` instance in this phase. Full `npx skillsmith` matrix execution — scaffolding plugins, running the testing agent, grading with the LLM judge, and running the Playwright specs — is the owner's manual next step.
- The block-centric scaffold (`index.php` + `src/blocks/testing-block/`) is present in every scaffolded plugin even for these non-block scenarios. This is a known harness characteristic; the extra block registration is inert for these tasks, but testing agents could be distracted by the scaffold structure.
