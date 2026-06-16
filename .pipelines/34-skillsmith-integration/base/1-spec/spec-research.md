# Spec Research: Integrate the repo with Skillsmith and clean up what's now obsolete

> Source: GitHub issue [Automattic/wordpress-skill-experiments#34](https://github.com/Automattic/wordpress-skill-experiments/issues/34).
> This file is self-contained; agents do not need to open the source issue.

## Goal

The repo uses [Skillsmith](https://github.com/Automattic/skillsmith) as its skill-evaluation tool, and everything in the repo that no longer makes sense after that move is cleaned up.

## Context

- This repo was previously used to explore how to evaluate iapi-skills.
- That exploration concluded with the decision to build an agnostic, standalone evaluation tool instead: [Skillsmith](https://github.com/Automattic/skillsmith).
- Skillsmith is a harness with two parts: a **Skill Tester** that sends scenario prompts to LLMs loaded with a skill and validates the answers end-to-end in a real runtime (producing a pass/fail matrix per skill × model × test case), and an opt-in **Self-Improvement loop** that lets an agent edit a failing skill and re-run the tests until the suite passes. Project-specific behaviour is supplied through hooks; Skillsmith's README cites a "WordPress reference project" as its hook example (scaffolding a plugin per scenario, then running Playwright e2e specs via `wp-env`).

## Assumptions / directions to explore

- Parts of the existing evaluation machinery in this repo are likely superseded by Skillsmith and can be removed; what exactly qualifies is open for the agents to determine.
- The existing GitHub Actions workflows should be reviewed as part of this — some may no longer make sense and could need removal or replacement.

## Q&A

**Q1 (orchestrator):** When this issue is done, where should skill evaluation actually run from? Two broad end states seem possible: (a) this repo keeps running evals itself — it consumes Skillsmith as a dependency (npm package `@automattic/skillsmith` with a `skillsmith` CLI), keeps its scenarios/rubrics/hooks here, and the bespoke `eval/` harness is replaced by Skillsmith; or (b) evaluation moves out of this repo entirely (e.g. into the Skillsmith repo or a separate project), and this repo keeps only the skills. Which end state do you want?

**A1 (owner):** This repo will run evals, but using Skillsmith. We have to define the wanted scenarios and Skillsmith will run them. The scenarios will be defined in a future phase — this issue is just for the setup. Those scenarios will be used in the future to improve the skill.

→ Implications noted: end state (a); defining the actual scenario suite is an out-of-scope candidate (future work); the setup should leave the repo ready for scenarios to be added later, including eventual skill self-improvement.

**Q2 (orchestrator):** The repo currently has two scenarios built for the old harness (`eval/scenarios/counter-block` and `eval/scenarios/toggle-visibility`, each with a `scenario.yaml` and an `e2e.spec.mjs`). Since the real scenario suite comes later: should this setup port these two as Skillsmith-format scenarios (e.g. to prove the wiring works end-to-end), or should they be deleted with the rest of the old harness, leaving the scenario folder empty until the future phase?

**A2 (owner):** In the Skillsmith repo there's a `testing-project/` that was actually the interactivity-api skill. We can copy the config, the skill, and the scenarios from there in this first version. And delete the existing ones.

**Q3 (orchestrator):** This repo's only skill today is `skills/wordpress-development/` (the repo was recently restructured into that single skill), while the testing-project's skill is `skills/wp-interactivity-api/`. When you say "copy the skill and delete the existing ones" — should `skills/wordpress-development/` be replaced by the copied `wp-interactivity-api` skill, or kept alongside it (with "delete the existing ones" referring only to the old scenarios/harness)?

**A3 (owner):** I want a unique `wordpress-development` skill that points to the relevant references ONLY when needed. The interactivity-api is one of those references. Keep `wordpress-development` and populate the reference.

**Q4 (orchestrator):** Today CI runs the old harness twice: `eval-gate.yml` (PR gate on skill/scenario changes) and `run-evals.yml` (daily cron + pushes to trunk, opens regression issues). For this first Skillsmith version, should evals run in CI at all — e.g. replacing those workflows with Skillsmith-based equivalents — or is local-only fine for v1, removing those workflows entirely?

**A4 (owner):** Local-only is fine for v1.

→ Implications noted: `eval-gate.yml` and `run-evals.yml` are removed; running evals in CI becomes an out-of-scope candidate (future work).

**Q5 (orchestrator):** The `skill-improver` agentic workflow triggers on issues labeled `eval-regression` — which were opened by `run-evals.yml`, so with that workflow gone nothing will trigger it anymore; Skillsmith also ships its own self-improvement loop covering similar ground. Should `skill-improver` (both its `.md` and `.lock.yml`) be removed too?

**A5 (owner):** Skillsmith comes with a self-improvement mechanism, so remove `skill-improver` as well.

**Q6 (orchestrator):** The last workflow is `upstream-sync` (`.md` + `.lock.yml`): a weekly agentic tracker that watches WordPress Interactivity API changes and opens draft PRs/issues when something may affect the skills. It's independent of the eval machinery — keeping skill content fresh is still a concern even with Skillsmith. Keep it or remove it?

**A6 (owner):** Remove it for now.

→ Implications noted: all four GitHub workflows are removed. Re-introducing upstream tracking later is an out-of-scope candidate.

**Q7 (orchestrator):** How should "the setup works" be measured for acceptance? For example: a full local Skillsmith run (`skillsmith` in test mode) with the copied config/scenarios completes end-to-end — including the wp-env/Playwright e2e validation — on a developer machine. And if so, must the scenario matrix actually pass, or is "the harness runs to completion and produces its reports" enough for v1 (scenario pass/fail being a skill-quality concern rather than a setup concern)?

**A7 (owner):** That's right. It doesn't have to pass the scenario matrix — I can work on that later.

→ Implications noted: acceptance is "a full local test-mode run completes end-to-end (including wp-env/Playwright e2e) and produces its reports"; making the scenario matrix pass is an out-of-scope candidate (future skill-quality work).

**Q8 (orchestrator):** Skillsmith's second half is the opt-in self-improvement mode (`mode: "self-improvement"`), which you said you'll use in the future to improve the skill. For this setup, should self-improvement mode be wired and verified too, or is test mode the v1 scope, with self-improvement left for when you start working on the skill?

**A8 (owner):** Self-improvement out of scope. It's just a setting in the Skillsmith config.

**Q9 (orchestrator):** Presented the consolidated out-of-scope list (see Out of Scope section) and asked whether anything is missing or wrongly excluded.

**A9 (owner):** Item 7 — the skillpack build/install tooling — can be removed as well (initially said "1", clarified to mean 7). The rest of the list stands.

→ Implications noted: `shared/scripts/skillpack-build.mjs`, `shared/scripts/skillpack-install.mjs` move into cleanup scope. `docs/local-development.md` documents exclusively that flow, so it is obsolete along with the tooling.

**Q10 (owner feedback at spec review):** The owner wants to prevent agents from running Skillsmith with the whole config — a full-matrix run needs a lot of tokens. The owner will run the tests manually once everything is set up.

**Q10b (orchestrator):** Does "prevent agents from running Skillsmith" mean no Skillsmith executions by agents at all (verification limited to static checks; owner does all running), or is a minimal smoke run (e.g. a single scenario against a single agent) acceptable for agents to verify the wiring, with only full-config runs off-limits?

**A10 (owner):** A single scenario against a single testing agent is fine.

→ Implications noted: new constraint requirement — agents never run Skillsmith over the full config; agent verification is capped at one scenario × one testing agent; the owner performs the full-matrix validation manually after setup. Acceptance criteria split accordingly (smoke run = agent-verifiable; full run = owner-manual).

## Research

Findings on `shared/`, `docs/`, and `.env.example` (orchestrator, current worktree):

- `shared/scripts/skillpack-build.mjs` and `skillpack-install.mjs` are verbatim copies from the official `WordPress/agent-skills` repo: they package skills into per-tool directory layouts (`.codex/skills`, `.github/skills`, `.claude/skills`, `.cursor/skills`) and install them into target projects. No references to `eval/` — they are skill-distribution tooling, independent of the evaluation machinery.
- `docs/local-development.md` documents exactly that build/install flow for testing skill changes in a WordPress project. Not eval-related.
- `.env.example` is old-harness-specific: provider API keys "required for LLM eval stages (student + judge)" and points at `eval/eval.config.yaml`.
- `README.md` is two lines ("A repository to experiment and iterate on WordPress skills").

Findings on the current skill and Skillsmith distribution:

- `skills/wordpress-development/` currently contains `SKILL.md` plus a single reference: `references/interactivity-api.md`. The SKILL.md frames itself as "a single entry-point skill for WordPress development… a unique WordPress skill that points to different topic-specific references, which should only be read when the task requires them", and lists the Interactivity API as its only reference so far. The testing-project's `wp-interactivity-api` skill carries the same domain content but split across five reference files (`client-navigation.md`, `directives.md`, `server-rendering.md`, `store.md`, `typescript.md`).
- `@automattic/skillsmith` is **not published to npm** (404 from the registry as of 2026-06-12; version 0.1.0 with changesets configured, public publishConfig). The repo would need to consume it by another mechanism (e.g. git dependency) until it's published — exact mechanism is a design-phase decision.

Contents of `Automattic/skillsmith` `testing-project/` (fetched via GitHub API, trunk):

- Root: `skillsmith.config.ts`, `package.json` + `package-lock.json`, `playwright.config.ts`, `tsconfig.json`, `global-setup.mjs`.
- `eval/prompts/` — `improver.md`, `testing-agent.md`.
- `eval/rubrics/` — `wp-interactivity-api-best-practices.md`.
- `eval/scenarios/` — 11 scenario folders (`async-fetch`, `config-fetch`, `counter`, `derived-double`, `focus-trap-menu`, `fruit-list-each`, `independent-counters`, `minimal-scaffold`, `paginated-list`, `shared-state`, `toggle-visibility`), each with `scenario.yaml` + `e2e.spec.mjs`, plus `_candidates.yaml`.
- `eval/utils/` — `scaffold-plugin.ts`, `verify-e2e.ts`, `wp-cli.mjs`.
- `skills/wp-interactivity-api/` — `SKILL.md` + `references/` (`client-navigation.md`, `directives.md`, `server-rendering.md`, `store.md`, `typescript.md`).

Findings from an initial repo scan (orchestrator, current worktree):

- **Bespoke eval harness at `eval/`** — `run-eval.mjs` with three stages (`format`, `llm`, `e2e`), libraries under `eval/lib/` (LLM providers for Anthropic/Gemini/OpenAI, judge, playwright-runner, plugin-builder, wp-env-manager, reporter, scenario/skill loaders), two scenarios (`counter-block`, `toggle-visibility`), one rubric (`general.yaml`), `eval.config.yaml`, and a Playwright config. `package.json` exposes `eval`, `eval:format`, `eval:llm`, `eval:e2e` scripts and depends on `@anthropic-ai/sdk`, `openai`, `@google/generative-ai`, `yaml`, plus dev deps `@playwright/test` and `@wordpress/env`.
- **Skills at `skills/wordpress-development/`** — `SKILL.md` plus `references/`.
- **Shared scripts at `shared/scripts/`** — `skillpack-build.mjs`, `skillpack-install.mjs`.
- **Docs** — `docs/local-development.md`.
- **Four GitHub workflows** in `.github/workflows/`:
  - `eval-gate.yml` — PR gate on `skills/**`, `shared/**`, `eval/scenarios/**`, `eval/rubrics/**`; runs format → llm stages of the bespoke harness.
  - `run-evals.yml` — daily cron (8AM UTC), pushes to `trunk`/`experiment/**`, and manual dispatch; runs the bespoke harness; has `issues: write` (opens regression issues).
  - `skill-improver.md` + `skill-improver.lock.yml` — agentic (gh-aw style) workflow triggered by issues labeled `eval-regression`; diagnoses failures and opens draft fix PRs.
  - `upstream-sync.md` + `upstream-sync.lock.yml` — weekly agentic tracker of WordPress Interactivity API changes that may affect skills; opens draft PRs/issues. Not eval-machinery per se.
- **Skillsmith repo** (`Automattic/skillsmith`) — npm package `@automattic/skillsmith` (public publish config) exposing a `skillsmith` CLI bin; repo contains `examples/` and `testing-project/` folders; README describes hooks as the project-specific extension point and cites a "WordPress reference project" as its hook example (plugin scaffolding per scenario + Playwright e2e via wp-env), which mirrors what this repo's `eval/` harness does today.

## Out of Scope

Confirmed with the owner (Q9/A9). The skillpack tooling, initially a keep-untouched candidate, was moved into cleanup scope instead.

1. Defining/curating the real scenario suite — the copied testing-project scenarios are just the v1 starting point (A1, A2).
2. Making the scenario matrix pass / improving the skill based on eval results (A1, A7).
3. Running evals in CI — no PR gate, no scheduled runs in v1; local-only (A4).
4. Using/verifying Skillsmith's self-improvement mode — it remains just a setting in the Skillsmith config, not exercised in v1 (A8).
5. Agentic maintenance workflows — `skill-improver` and `upstream-sync` are removed, not replaced; re-introducing upstream tracking is future work (A5, A6).
6. Changes to the Skillsmith tool itself — this issue only consumes it.

## Consolidated Requirements

1. The repo adopts Skillsmith (`@automattic/skillsmith`, `skillsmith` CLI) as its only skill-evaluation harness; evals run from this repo, locally (A1, A4).
2. The Skillsmith project setup is copied from `Automattic/skillsmith` `testing-project/` as the v1 baseline and adapted to this repo: the Skillsmith config, eval prompts, rubrics, all 11 scenarios, and the e2e wiring (Playwright config, global setup, eval utils) (A2).
3. The bespoke evaluation machinery is deleted: the entire `eval/` folder (harness, lib, providers, old scenarios `counter-block` and `toggle-visibility`, rubric, configs), the `eval*` npm scripts, and the now-unused dependencies (A2, A4).
4. `skills/wordpress-development/` remains the repo's unique skill, keeping its single-entry-point structure (topic references read only when needed); its Interactivity API reference content is populated from the testing-project's `wp-interactivity-api` skill (SKILL.md + 5 reference files) (A3).
5. The copied scenarios evaluate `wordpress-development` — the skill under test is this repo's skill, not a copied `wp-interactivity-api` skill (A3).
6. All four GitHub workflows are removed: `eval-gate.yml`, `run-evals.yml`, `skill-improver.md` + `.lock.yml`, `upstream-sync.md` + `.lock.yml` (A4, A5, A6).
7. The skillpack build/install tooling is removed: `shared/scripts/skillpack-build.mjs`, `shared/scripts/skillpack-install.mjs`, and the `docs/local-development.md` doc that exists solely to document that flow (A9).
8. Supporting files reflect the new setup: `.env.example` describes what a Skillsmith run needs, and repo docs/README no longer reference the old harness (A2, A4).
9. Acceptance: on a developer machine, a local test-mode Skillsmith run over the copied scenarios completes end-to-end — including wp-env/Playwright e2e validation — and produces its reports; the scenario matrix does not need to pass (A7).
10. Self-improvement mode is not exercised; it remains an available Skillsmith config setting (A8).
11. Agents never run Skillsmith over the full config (token cost); agent-driven verification is limited to a single scenario against a single testing agent. The owner runs the full-matrix tests manually once everything is set up (Q10/A10).
