# Spec: Integrate the repo with Skillsmith and clean up what's now obsolete

## Overview

This repository (`Automattic/wordpress-skill-experiments`) hosts the `wordpress-development` skill and was previously also home to a bespoke evaluation harness (`eval/`) built while exploring how to evaluate iapi-skills. That exploration concluded with the creation of [Skillsmith](https://github.com/Automattic/skillsmith) (`@automattic/skillsmith`), an agnostic, standalone skill-evaluation harness with a `skillsmith` CLI: it tests skills by sending scenario prompts to LLMs and validating the answers end-to-end in a real runtime, and offers an opt-in self-improvement loop.

This change replaces the bespoke harness with Skillsmith and removes everything the move makes obsolete. The v1 evaluation setup (Skillsmith config, prompts, rubrics, scenarios, e2e wiring) is copied from Skillsmith's own `testing-project/` — which was originally built around the Interactivity API skill — and adapted so it evaluates this repo's `wordpress-development` skill. Evals run locally only in v1; the real scenario suite and making the suite pass are future work.

## Requirements

### Skillsmith adoption

- **R1.** The repo consumes Skillsmith (`@automattic/skillsmith`) as its only skill-evaluation harness, runnable locally from this repo. Note: the package is not yet published to npm (as of 2026-06-12); the consumption mechanism is a design-phase decision.
- **R2.** The v1 evaluation setup is copied from `Automattic/skillsmith` `testing-project/` and adapted to this repo:
  - The Skillsmith config (`skillsmith.config.ts`) and any supporting project files the run needs (e.g. Playwright config, global setup, `tsconfig`).
  - The eval prompts (`eval/prompts/improver.md`, `eval/prompts/testing-agent.md`).
  - The rubric (`eval/rubrics/wp-interactivity-api-best-practices.md`).
  - All 11 scenarios under `eval/scenarios/` (`async-fetch`, `config-fetch`, `counter`, `derived-double`, `focus-trap-menu`, `fruit-list-each`, `independent-counters`, `minimal-scaffold`, `paginated-list`, `shared-state`, `toggle-visibility`, plus `_candidates.yaml`), each with its `scenario.yaml` and `e2e.spec.mjs`.
  - The eval utils (`eval/utils/scaffold-plugin.ts`, `verify-e2e.ts`, `wp-cli.mjs`).
- **R3.** The scenarios evaluate this repo's `skills/wordpress-development` skill — the skill under test is `wordpress-development`, not a copied `wp-interactivity-api` skill.
- **R4.** Skillsmith's self-improvement mode is not exercised; it remains an available config setting only.
- **R12.** Agents (in this pipeline and in the repo's future agent guidance) must not run Skillsmith over the full configuration — a full scenarios × testing-agents matrix consumes too many tokens. Agent-driven verification is limited to at most a single scenario against a single testing agent. Full-matrix validation is performed manually by the owner once the setup is in place.

### The skill

- **R5.** `skills/wordpress-development/` remains the repo's unique skill and keeps its single-entry-point structure: `SKILL.md` routes to topic-specific references that are read only when the task requires them.
- **R6.** The skill's Interactivity API reference content is populated from the testing-project's `skills/wp-interactivity-api/` skill (its `SKILL.md` plus references: `client-navigation.md`, `directives.md`, `server-rendering.md`, `store.md`, `typescript.md`), superseding the current single `references/interactivity-api.md` content.

### Cleanup of obsolete machinery

- **R7.** The bespoke harness is deleted: the entire `eval/` folder (runner `run-eval.mjs`, `eval/harness/`, `eval/lib/` including the Anthropic/Gemini/OpenAI providers, judge, playwright-runner, plugin-builder, wp-env-manager, reporter and loaders, the old scenarios `counter-block` and `toggle-visibility`, rubric `general.yaml`, `eval.config.yaml`, `playwright.config.mjs`, `eval/wp-env/`).
- **R8.** All four GitHub workflows are removed: `eval-gate.yml`, `run-evals.yml`, `skill-improver.md` + `skill-improver.lock.yml`, `upstream-sync.md` + `upstream-sync.lock.yml` (leaving `.github/workflows/` with no remaining workflows).
- **R9.** The skillpack tooling is removed: `shared/scripts/skillpack-build.mjs`, `shared/scripts/skillpack-install.mjs`, and `docs/local-development.md` (which documents only that flow).
- **R10.** `package.json` reflects the new setup: the `eval`, `eval:format`, `eval:llm`, `eval:e2e` scripts and the old harness's dependencies (`@anthropic-ai/sdk`, `openai`, `@google/generative-ai`, `yaml`) are removed where no longer used, replaced by whatever the Skillsmith setup needs.
- **R11.** Supporting files reflect the new setup: `.env.example` describes the variables a Skillsmith run needs (instead of the old harness's keys pointing at `eval/eval.config.yaml`), and the repo's documentation (`README.md` and any remaining docs) no longer references the removed harness, workflows, or skillpack flow.

## Out of Scope

1. Defining/curating the real scenario suite — the copied testing-project scenarios are only the v1 starting point.
2. Making the scenario matrix pass, or improving the skill based on eval results.
3. Running evals in CI — no PR gate or scheduled runs in v1; evaluation is local-only.
4. Using or verifying Skillsmith's self-improvement mode.
5. Replacements for the removed agentic workflows (`skill-improver`, `upstream-sync`) — re-introducing upstream tracking is future work.
6. Changes to the Skillsmith tool itself — this issue only consumes it.

## Acceptance Criteria

- **AC1.** Given a fresh clone with dependencies installed and the required API keys configured, when an agent runs the documented Skillsmith eval command restricted to a single scenario against a single testing agent (test mode), then that smoke run completes end-to-end — including the wp-env/Playwright e2e validation — producing Skillsmith's per-agent, per-scenario, and run-level reports. The scenario is not required to pass. Agents never run the full configuration; the full-matrix run is the owner's manual validation after setup and is not part of the pipeline's automated acceptance.
- **AC2.** Given the completed run from AC1, when inspecting its configuration and outputs, then the skill under evaluation is `skills/wordpress-development`.
- **AC3.** Given the repo after the change, when searching the tree, then no bespoke-harness remnants remain: no `eval/lib/`, `eval/harness/`, `run-eval.mjs`, `eval.config.yaml`, old `counter-block`/`toggle-visibility` scenario folders, `eval*` npm scripts, or unused LLM SDK dependencies.
- **AC4.** Given the repo after the change, when listing `.github/workflows/`, then none of `eval-gate.yml`, `run-evals.yml`, `skill-improver.*`, `upstream-sync.*` exist.
- **AC5.** Given the repo after the change, when looking for the skillpack flow, then `shared/scripts/skillpack-build.mjs`, `shared/scripts/skillpack-install.mjs`, and `docs/local-development.md` are gone.
- **AC6.** Given the repo after the change, when reading `skills/wordpress-development/SKILL.md`, then it still presents the single-entry-point structure with topic references, and its Interactivity API reference content matches the substance of the testing-project's `wp-interactivity-api` skill (entry content plus the five reference topics: directives, store, server rendering, client navigation, TypeScript).
- **AC7.** Given the repo after the change, when reading `.env.example` and `README.md`, then they describe only the Skillsmith-based setup and contain no references to the removed harness, workflows, or skillpack tooling.
