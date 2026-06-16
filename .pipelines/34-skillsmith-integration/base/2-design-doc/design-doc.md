# Design Doc: Integrate the repo with Skillsmith and clean up what's now obsolete

## 1. Context and goal

This repository (`Automattic/wordpress-skill-experiments`) hosts the `wordpress-development` skill. It was previously also home to a bespoke evaluation harness under `eval/`, built while exploring how to evaluate iapi-skills. That exploration concluded with the creation of [Skillsmith](https://github.com/Automattic/skillsmith) (`@automattic/skillsmith`), an agnostic, standalone skill-evaluation harness with a `skillsmith` CLI. Skillsmith tests skills by sending scenario prompts to LLMs and validating the answers end-to-end in a real runtime, and offers an opt-in self-improvement loop.

The goal of this change is to replace the bespoke harness with Skillsmith and remove everything the move makes obsolete. The v1 evaluation setup (Skillsmith config, prompts, rubrics, scenarios, and e2e wiring) is copied from Skillsmith's own `testing-project/` — which was originally built around an Interactivity API skill — and adapted so it evaluates this repo's `wordpress-development` skill instead. Evals run locally only in v1; curating the real scenario suite and making it pass are explicitly future work.

This document is the design for that change. It assumes the reader knows the goal above but nothing else about the repo or Skillsmith; every decision needed to implement the change is recorded here. The companion spec (Acceptance Criteria AC1–AC7, Requirements R1–R12) defines what "done" means; this doc explains how the pieces fit together to satisfy it.

### Guiding constraints carried from the spec

- **Local-only in v1.** No CI gate, no scheduled runs. Evaluation happens on a developer's machine.
- **Token cap on agent-driven runs (spec R12).** A full scenarios × testing-agents matrix consumes too many tokens. Any agent (including pipeline agents and the repo's future agent guidance) may run **at most one scenario against one testing agent**. The full-matrix run is the owner's manual step after the setup lands, and is deliberately *not* part of automated acceptance.
- **Self-improvement stays dormant (spec R4).** Skillsmith's self-improvement mode remains an available config setting that is never exercised in this change.

## 2. Current state of the repo (what we're changing)

The change touches these existing pieces:

- **The skill** lives at `skills/wordpress-development/`. `SKILL.md` is a short router: frontmatter (`name: wordpress-development`, a "Must use when working on any WordPress development task…" description) plus a REFERENCES section that links a single entry, `references/interactivity-api.md`. That entry is currently a **3-line placeholder stub** ("Placeholder reference. Content to be added.").
- **The bespoke harness** is the entire `eval/` tree: a runner (`run-eval.mjs`), `eval/harness/`, `eval/lib/` (Anthropic/Gemini/OpenAI providers, judge, playwright-runner, plugin-builder, wp-env-manager, reporter, loaders), the old scenarios `counter-block` and `toggle-visibility`, rubric `general.yaml`, `eval.config.yaml`, `playwright.config.mjs`, and `eval/wp-env/`.
- **GitHub workflows** under `.github/workflows/`: `eval-gate.yml`, `run-evals.yml`, and two gh-aw agentic workflows each with a markdown + lock pair — `skill-improver.md` + `skill-improver.lock.yml` and `upstream-sync.md` + `upstream-sync.lock.yml`.
- **gh-aw support files** that exist solely for those agentic workflows: `.github/aw/actions-lock.json` (action-pin lockfile) and `.github/agents/agentic-workflows.agent.md` (dispatcher agent doc).
- **`.gitattributes`** whose only rule (`.github/workflows/*.lock.yml linguist-generated merge=ours`) targets the removed lock files.
- **The skillpack tooling**: `shared/scripts/skillpack-build.mjs` and `shared/scripts/skillpack-install.mjs` (the only contents of `shared/`), plus `docs/local-development.md` (the only contents of `docs/`, documenting only the skillpack flow).
- **`package.json`**: `postinstall: npx playwright install chromium`; scripts `eval`, `eval:format`, `eval:llm`, `eval:e2e`; dependencies `@anthropic-ai/sdk`, `@google/generative-ai`, `openai`, `yaml`; devDependencies `@playwright/test`, `@wordpress/env`.
- **Supporting files**: `.env.example` (old-harness keys pointing at `eval/eval.config.yaml`), `.gitignore` (an eval-specific block), and a two-line `README.md`.
- **Project conventions** are recorded in `.rp.md` ("Read this file at the start of any workflow"). There is no repo-level `CLAUDE.md` or `AGENTS.md`. `.rp.md` is the home for the R12 agent-cap rule.

A grep over the worktree (excluding `eval/`, `.pipelines/`, and the lockfile) confirms references to the old harness (`run-eval`, `eval.config`, `eval/` paths) appear only in `.env.example`, `.gitignore`, `package.json`, and the four workflows — all files this change already rewrites or deletes. Skillpack/local-development references appear only in the skillpack scripts and the doc themselves. There is no hidden coupling.

## 3. How Skillsmith works (the parts this design relies on)

Skillsmith is a **single package** (no monorepo or workspaces), `type: module`, currently `@automattic/skillsmith` v0.1.0. Its `exports "."` entry points at **raw TypeScript** (`./src/index.ts`); the `skillsmith` bin (`./bin/skillsmith.mjs`) loads `tsx/esm` and dynamically imports `../src/runner.ts`. In other words, TypeScript runs directly from source at runtime via `tsx`, which is a regular runtime dependency. There is **no build step, no `dist/`, no `files` field, and no prepare/prepack/postinstall scripts**.

Its runtime dependencies are `@ai-sdk/{anthropic,google,openai}`, `@anthropic-ai/claude-agent-sdk`, `@openai/codex-sdk`, `ai`, `tsx`, `yaml`, and `zod`. It requires Node ≥ 20.17.

The facts below drive the design decisions in sections 4–9.

### 3.1 Config surface

The config file (`skillsmith.config.ts`) calls `defineConfig` with an object of type `SkillsmithConfigInput`. Its fields:

- `mode` — `"test-only"` or `"self-improvement"`.
- `agents` — a record of agent id → `{ provider, model, …extras }` (e.g. an `effort` extra).
- `roles` — `test: { agents: string[], prompt? }`, `judge: string | { agent, prompt? }`, `improver: { agent, prompt? }`.
- `paths?` — a partial of `{ base, skills, scenarios, rubrics }`.
- `hooks?` — lifecycle hooks (see 3.4).
- `selfImprovement?` — `{ maxIterations, scope }`.

**There is no "skill path" config field.** Which skill a scenario exercises comes from each scenario's `scenario.yaml` `skills:` array, naming a skill directory under `paths.skills`. The path defaults (in Skillsmith's `src/config/defaults.ts`) are `base: "./.skillsmith"`, `skills: "./skills"`, `scenarios: "./eval/scenarios"`, `rubrics: "./eval/rubrics"`.

Available providers: `claude-code`, `anthropic-api`, `openai-api`, `codex`, `gemini-api`, `mock`. A full-surface reference config lives at `examples/skillsmith.config.ts` in the Skillsmith repo.

### 3.2 The CLI run handle (how a single scenario × single agent is selected)

The shipped bin restricts a run in two independent ways:

- **One scenario** via a positional argument matching the scenario *directory* name: `skillsmith <scenario-dir>`.
- **One testing agent** via the config's `roles.test.agents` array.

The bin also parses `--verbose`, `--mode`, `--iterations`, `--scope`, and `--final-pass` (Skillsmith's README claims "no CLI flags," which is stale). The judge role is a *separate* role from the testing agents, so it does not count against the one-testing-agent cap.

### 3.3 Environment variables and auth

Skillsmith's bin natively loads `.env` from the invocation directory (Node's `process.loadEnvFile`, no dotenv); shell environment variables take precedence over `.env`. Skillsmith's own `.env.example` documents three provider keys:

- `ANTHROPIC_API_KEY` — for the `anthropic-api` provider.
- `OPENAI_API_KEY` — for the `openai-api` and `codex` providers.
- `GOOGLE_GENERATIVE_AI_API_KEY` — for the `gemini-api` provider.

Crucially, the **`claude-code` provider is not key-driven**: it calls the Claude Agent SDK with no explicit key, so auth comes from an existing Claude Code login (or `ANTHROPIC_API_KEY` as a fallback). The copied config uses only `claude-code`-provider agents, so the smoke run's only hard auth requirement is Agent-SDK auth; the other keys matter only if a provider is switched.

### 3.4 Outputs and the e2e (wp-env + Playwright) wiring

A run writes into `./.skillsmith/<runId>/` with reports at every level: per-agent (`iteration-N/<scenario>/<agent>/report.json`), per-scenario (`iteration-N/<scenario>/report.json`), per-iteration (`iteration-N/report.json`), and run-level (`report.json` + `run.json` + a human-readable `summary.txt`). The Playwright JSON lands at `iteration-N/tests-report.json`. These levels are exactly what AC1 requires.

The end-to-end validation runs WordPress in `@wordpress/env` (wp-env, which needs local Docker) and drives it with Playwright:

- `playwright.config.ts` imports `./skillsmith.config`; sets `testDir: "./eval/scenarios"`, `testMatch: "**/e2e.spec.mjs"`, `globalSetup: "./global-setup.mjs"`, `workers: 1`, port `WP_ENV_PORT ?? 8987`, and storage state `./.auth/admin.json`. Playwright projects are generated from `roles.test.agents` ids. It uses `@wordpress/e2e-test-utils-playwright`.
- `global-setup.mjs` logs into wp-env's default admin via `RequestUtils.setupRest()` and persists the storage state.
- There is **no committed `.wp-env.json`**. The eval util `verify-e2e.ts` writes one at runtime (with the scaffolded plugin paths, port 8987) and removes it in a `finally` block. Its `PROJECT_ROOT` is computed two levels up from `eval/utils/`, which lands on the repo root unchanged when the tree is copied as-is.
- The hook flow: build each scaffolded plugin with `wp-scripts build` (`WP_EXPERIMENTAL_MODULES=1`) → write `.wp-env.json` → `npm run env:start` → `npm run test:e2e -- <specs>` → `npm run env:stop` → parse the JSON report into per-(scenario, agent) failures. This requires `env:start`, `env:stop`, and `test:e2e` npm scripts to exist in the consuming repo.
- `wp-cli.mjs` is a thin `npx wp-env run cli wp …` helper that some specs use for fixtures.

The testing-project config wires these via hooks: `beforeTestAgent → scaffoldPlugin` and `afterAllScenarios → runE2eVerification`. Role prompts are read with `readFileSync` from `eval/prompts/*.md`.

### 3.5 How a skill is delivered to the agent (the layout driver)

Skillsmith's skill loader (`src/scenarios/skill-loader.ts`) is **link-driven, not a directory scan**:

- `loadSkill(skillId, skillsRoot)` reads `<skillsRoot>/<skillId>/SKILL.md`, then does a breadth-first walk that **follows every relative markdown link** whose target resolves *inside the skill directory*, concatenating each reached file verbatim into one blob (each section prefixed with a `=== <skillId>/<relpath> ===` header).
- A reference file that no markdown link reaches is **never loaded**. Links pointing outside the skill dir, absolute URLs, `#fragments`, and `mailto:` are skipped; `#` anchors are stripped before resolving. Nested subdirectories are allowed — the only rule is that the resolved target stays inside the skill dir.
- Relative links resolve against the **linking file's own directory** (`resolve(dirname(file), href)`), not the skill root.
- `skillId` is the **directory name** under `paths.skills` (what `scenario.yaml`'s `skills:` lists). The loader never reads the frontmatter `name`.
- **Broken links fail silently.** A link whose target doesn't exist is skipped with no error (the only hard failure is a missing root `SKILL.md`). So a typo'd link silently drops that reference from the agent's prompt while the run still reports success — a real footgun this design must guard against (see 7.3). Skillsmith's scenario validation only checks that `skills/<id>/SKILL.md` and `rubrics/<id>.md` exist; it never validates the reference structure.

Delivery: the whole blob (SKILL.md plus all transitively linked refs) is **inlined into the testing agent's system prompt**, followed by a workspace snapshot, the write policy, and the role prompt; the scenario prompt is the user message. The agent does not browse the skill on disk.

The **judge never sees the skill** — its system prompt is built only from the rubric files plus the scenario's acceptance criteria, with an explicit instruction not to consult skill docs, so skill layout cannot affect judging. The **improver** does load the skill through the same loader, but only in self-improvement mode, which stays dormant here.

## 4. Consuming Skillsmith

### Decision

Add Skillsmith as a **devDependency pinned to a git commit SHA**:

```
"@automattic/skillsmith": "github:Automattic/skillsmith#6bd90c34d88b815fdf4fd661dc8c51288111444c"
```

### Rationale

The package is not yet published to npm (as of 2026-06-12), so a registry range is not yet an option. A direct experiment confirmed `npm install github:Automattic/skillsmith` **works without authentication** (the repo is public): it installs under `node_modules/@automattic/skillsmith` with `src/` and `bin/` present and the `.bin/skillsmith` symlink created; the CLI prints usage, and `import { defineConfig } from "@automattic/skillsmith"` resolves under `tsx`. Because the package has no build step, the usual git-dependency caveat (only `prepare` runs, not `prepack`) is moot.

Using the **real scoped name** `@automattic/skillsmith` (rather than the testing-project's local `file:..` alias of the unscoped `skillsmith`) makes the copied config's import resolve with zero edits. Pinning to a **commit SHA** gives reproducibility; Skillsmith has **no git tags**, so a SHA is the only stable pin available. `6bd90c34d88b815fdf4fd661dc8c51288111444c` is trunk HEAD as of this design.

**Swap path:** Skillsmith's publication is set up (changesets, public `publishConfig`, a release workflow) and appears imminent. Once published, this becomes a one-line swap to a semver range such as `^0.1.0`. The design intentionally keeps the consumption mechanism to a single `package.json` line so that swap is trivial.

Alternatives considered — committed tarball, submodule + `file:`, or a vendored copy — are all feasible but strictly heavier with no upside given the git install works.

### Keeping the copied config coherent with the installed package

The eval setup is copied from a clone of `Automattic/skillsmith` checked out at the **same pinned SHA** as the dependency (`6bd90c3…`). This keeps the copied `skillsmith.config.ts`, prompts, scenarios, and utils coherent with the exact version of the package that gets installed.

## 5. Repo layout after the change

### Files copied from the testing-project, landing at the repo root

- `skillsmith.config.ts`
- `playwright.config.ts`
- `global-setup.mjs`
- `tsconfig.json` — copied, then adapted (see section 6, adaptation 3): the testing-project's `tsconfig.json` extends `../tsconfig.json` (the Skillsmith repo root tsconfig), a path that only resolves inside the Skillsmith repo and dangles when the file lands at this repo's root.

The repo has no existing tsconfig or root Playwright config (the old harness's `playwright.config.mjs` lives inside `eval/` and is deleted with it), so there are no collisions. `package-lock.json` is regenerated by `npm install`, not copied.

### The eval tree

The copied `eval/{prompts,rubrics,scenarios,utils}` **replaces the deleted bespoke `eval/` wholesale**:

- `eval/prompts/improver.md`, `eval/prompts/testing-agent.md`
- `eval/rubrics/wp-interactivity-api-best-practices.md`
- `eval/scenarios/` — all 11 scenario directories (`async-fetch`, `config-fetch`, `counter`, `derived-double`, `focus-trap-menu`, `fruit-list-each`, `independent-counters`, `minimal-scaffold`, `paginated-list`, `shared-state`, `toggle-visibility`), each with its `scenario.yaml` and `e2e.spec.mjs`, plus `_candidates.yaml`.
- `eval/utils/scaffold-plugin.ts`, `verify-e2e.ts`, `wp-cli.mjs`.

### No `paths` override

Skillsmith's default paths (`skills/`, `eval/scenarios`, `eval/rubrics`, `.skillsmith` base) match this repo's layout exactly, so the copied config does **not** set `paths`. The deletion of the bespoke `eval/` frees the directory name for the copied tree to land where the defaults expect.

### The config itself (copied verbatim)

The testing-project config is taken as-is:

- `mode: "test-only"`.
- Two agents: `haiku` (`claude-code` provider, model `claude-haiku-4-5`) and `opus` (`claude-code` provider, model `claude-opus-4-7`, `effort: xhigh`).
- `roles.test.agents = ["haiku"]` — only `haiku` is a testing agent; `opus` is the judge and improver.
- `selfImprovement: { maxIterations: 3, scope: "failed-scenarios" }` — present but dormant under `test-only` mode (satisfies R4).
- Hooks `beforeTestAgent → scaffoldPlugin` and `afterAllScenarios → runE2eVerification`.
- Role prompts read from `eval/prompts/*.md`.

## 6. The three adaptations to the copied eval setup

Everything in the copied eval tree is taken verbatim **except three changes**. These are the only edits to the copied files.

1. **Skill selection (spec R3).** All 11 `scenario.yaml` files list `skills: [wp-interactivity-api]`. Change each to `skills: [wordpress-development]`. This is the only skill-selection coupling — the loader's `skillId` is the directory name, which these entries name.

2. **Type import in `verify-e2e.ts`.** It imports types `from "skillsmith"` (the unscoped name, which only resolved under the testing-project's `file:..` alias). Change it to `from "@automattic/skillsmith"` so it resolves against our scoped git install. (`skillsmith.config.ts` already imports the scoped name; `scaffold-plugin.ts` and `wp-cli.mjs` import nothing from Skillsmith.)

3. **`extends` target in `tsconfig.json`.** The testing-project's `tsconfig.json` is:

   ```json
   {
     "extends": "../tsconfig.json",
     "compilerOptions": { "types": ["node"] },
     "include": ["skillsmith.config.ts", "playwright.config.ts"]
   }
   ```

   `../tsconfig.json` is the Skillsmith repo root tsconfig (strict mode, `module: ESNext`, `moduleResolution: Bundler`, etc.); it resolves only because the testing-project lives inside the Skillsmith repo. Copied to this repo's root, `../tsconfig.json` points at the directory **above** this repository, where no tsconfig exists — a dangling reference. `tsx` and Playwright tolerate it (they don't type-check, so the smoke run still works), but `tsc` and editors flag the file as broken and every inherited compiler option is silently dropped, so the config no longer does what it appears to.

   Change the `extends` target to `"@automattic/skillsmith/tsconfig.json"`. The git install ships the Skillsmith root tsconfig (the package has no `files` field, so the whole repo is packed, including its root `tsconfig.json`), and TypeScript resolves a package-relative `extends` from `node_modules`. This restores the inherited strict options against the same config the testing-project relied on, with no new file to author. The rest of the copied `tsconfig.json` (`compilerOptions.types` and `include`) is left verbatim.

### What is deliberately *not* changed

- The **rubric filename and references stay** `wp-interactivity-api-best-practices`. Each `scenario.yaml`'s `rubrics:` entry references that basename; the rubric is copied verbatim (R2), so leaving the name preserves the link.
- **Prompts** (`improver.md`, `testing-agent.md`) mention the Interactivity API and its docs URL — copied as-is; this is content, not a functional coupling.
- **`_candidates.yaml`** is commented-out notes (including a harmless hardcoded local-path comment) — copied as-is.
- **Scenario `name:` fields** may differ from their directory names. Selection matches the *directory* name; the `name` field is only used in iteration output dirs. Left as copied.

## 7. The skill content merge

This satisfies spec R6/AC6: populate the skill's Interactivity API reference content from the testing-project's `wp-interactivity-api` skill, superseding the current placeholder.

### 7.1 Source content

The testing-project's `skills/wp-interactivity-api/` skill is:

- `SKILL.md` (262 lines): frontmatter (`name: wp-interactivity-api` + a trigger-heavy description) and a body covering an intro, "Hard rules — every one matters" (11 rules), a "Standard skeleton" (`block.json` + `render.php` + `view.js`), pattern sections (local context vs global state, derived state, async/fetch, `data-wp-each`, init callbacks, gotchas), and a closing "References (load on demand)" section linking all five refs with one-line read-when gists. Four mid-body inline links also exist (`references/store.md` at lines 25, 207, 253; `references/client-navigation.md` at line 254). Together with the five closing-section links, that is the 9-occurrence total the link rewrite in 7.3 covers.
- Five reference files, flat under `references/`: `directives.md` (159 lines), `store.md` (277), `server-rendering.md` (242), `client-navigation.md` (203), `typescript.md` (146). The whole skill is roughly 1,289 lines.

Our current `references/interactivity-api.md` is a 3-line placeholder stub, so the testing-project content is a strict superset — nothing is lost by superseding it. This is a pure replacement.

### 7.2 Target layout

The router stays generic (spec R5). The merge produces:

```
skills/wordpress-development/
  SKILL.md                                   # router, kept as-is (already links references/interactivity-api.md)
  references/
    interactivity-api.md                     # entry doc = testing-project SKILL.md *body* (frontmatter dropped)
    interactivity-api/
      directives.md                          # five refs, copied verbatim
      store.md
      server-rendering.md
      client-navigation.md
      typescript.md
```

- `SKILL.md` keeps its own router frontmatter and its existing link to `references/interactivity-api.md`. No change to the router beyond what it already does. The testing-project SKILL.md's frontmatter is dropped (the router keeps its own); its trigger language can inform the router's read-when line.
- `references/interactivity-api.md` becomes the **entry doc**: the testing-project SKILL.md *body* (everything below its frontmatter), placed at the same path the router already links.
- The five reference files are copied **verbatim** into the `references/interactivity-api/` subfolder. Nested subdirectories are allowed by the loader.

### 7.3 Link rewrites — exactly one place

Because the loader resolves relative links against the **linking file's own directory** (3.5), the link rewrites are confined to the entry doc:

- The entry doc (testing-project SKILL.md body) contains **9 occurrences** of the form `[references/X.md](references/X.md)`. From its new home at `references/interactivity-api.md`, those must be rewritten to `[interactivity-api/X.md](interactivity-api/X.md)` so they resolve to `references/interactivity-api/X.md`. **This is the only link rewrite in the entire skill.**
- The **five reference files contain zero markdown links.** They mention each other only inside backtick code spans (4 spots: `directives.md:105`; `store.md:77,145,264`), which the loader never follows. These read naturally as sibling basenames; they are left untouched.

### 7.4 Mandatory blob-verification step

Because broken links fail silently (3.5), the implementation **must verify the assembled blob** rather than trust that the links are correct. The check: statically invoke `loadSkill` and assert that the blob **contains the `=== … ===` section headers for the entry doc and all five references** reached from `SKILL.md`. This is a presence check, not an exact count — the assembled blob also carries a header for the root `SKILL.md` itself, so it holds seven `=== … ===` sections in total; the guard is that the six reachable documents all appear, not that the header count equals six. This is a **static Node call, not an eval run**, so it is R12-safe. The plan must include this step; it is the only guard against a typo silently dropping a reference from the agent's prompt.

## 8. `package.json` after the change

Satisfies spec R10.

**Kept:** `name`, `private`, `type: module`, and `postinstall: npx playwright install chromium` (the Playwright Chromium install).

**Scripts dropped:** `eval`, `eval:format`, `eval:llm`, `eval:e2e`.

**Scripts added** (mirroring the testing-project, and required by the e2e hook flow in 3.4):

- `skillsmith: "skillsmith"`
- `test:e2e: "playwright test"`
- `env:start: "wp-env start"`
- `env:stop: "wp-env stop"`

**Dependencies dropped:** `@anthropic-ai/sdk`, `@google/generative-ai`, `openai`, `yaml`. Skillsmith bundles its own `yaml`, and nothing else in the repo uses these once the bespoke harness is gone.

**devDependencies after the change** (ranges match the testing-project's at the pinned SHA, keeping the dependency set coherent with the copied setup):

- `@automattic/skillsmith` (the pinned git SHA from section 4) — new.
- `@playwright/test` — already present; bump to the testing-project's `^1.59.1` (the repo's existing caret range resolves to the latest 1.x on lockfile regeneration anyway, but matching keeps the set coherent).
- `@wordpress/env ^11.4.0` — **bumped** from the repo's existing `^10.0.0`. The copied `verify-e2e.ts` writes a `.wp-env.json` whose root carries `testsEnvironment: false`. `@wordpress/env` validates `.wp-env.json` keys strictly and throws on unknown keys; `testsEnvironment` is an 11.x addition (parsed as a root-only boolean), and is **not** a config option in any 10.x release. Under `^10.0.0` (caret keeps it on 10.x), `npm run env:start` — invoked by `runE2eVerification` inside the `afterAllScenarios` hook — would hard-fail with `ValidationError: Invalid .wp-env.json: "testsEnvironment" is not a configuration option.` before WordPress ever boots, so Playwright never runs and no `tests-report.json` is produced. That breaks the AC1 smoke run, which must complete the wp-env/Playwright e2e validation end-to-end. `^11.4.0` (the testing-project's range, the floor at which `testsEnvironment` is accepted) is therefore required, not optional.
- `@wordpress/e2e-test-utils-playwright ^1.44.0` — new; required by `global-setup.mjs`.
- `@wordpress/scripts ^32.2.0` — new; required by the plugin-build step (`wp-scripts build`).

## 9. Cleanup and supporting files

### 9.1 Deletion set

The spec's explicit list (R7–R9) plus the orphans verified in section 2:

- **`eval/` entirely** (R7) — the bespoke harness. (Its slot is then refilled by the copied eval tree from section 5.)
- **The six workflow files** (R8): `eval-gate.yml`, `run-evals.yml`, `skill-improver.md`, `skill-improver.lock.yml`, `upstream-sync.md`, `upstream-sync.lock.yml`.
- **`shared/` entirely** (R9) — its only contents are the two skillpack scripts.
- **`docs/` entirely** (R9) — its only content is `local-development.md`.
- **`.github/aw/actions-lock.json`** and **`.github/agents/agentic-workflows.agent.md`** — gh-aw support files that exist solely for the removed agentic workflows (orphaned under R8/R11's intent).
- **`.gitattributes`** — its only rule targets the now-removed `*.lock.yml` files.

**Net effect on `.github/`:** with all workflows and the gh-aw support files gone, `.github/` ends up with no files at all (git drops empty directories), which satisfies AC4.

### 9.2 `.gitignore`

Remove the old eval block: `eval/wp-env/plugins/`, `eval/wp-env/.wp-env.json`, `eval/.cache/`.

Add the Skillsmith/e2e entries (ported from the Skillsmith root `.gitignore`'s testing-project block): `.skillsmith/`, `test-results/`, `playwright-report/`, `.auth/`, `artifacts/`, and `.wp-env.json` (a bare path at the repo root, since `verify-e2e.ts` writes it there at runtime).

Existing generic entries (including `.env*` handling and `.rp.local.md`) stay.

### 9.3 `.env.example`

Rewritten for Skillsmith (spec R11). It documents:

- A header noting that Skillsmith auto-loads `.env` from the invocation directory and that shell environment variables take precedence.
- `ANTHROPIC_API_KEY` — for the `anthropic-api` provider; also the fallback auth for the default `claude-code` agents when no Claude Code login exists.
- `OPENAI_API_KEY` — for the `openai-api` and `codex` providers.
- `GOOGLE_GENERATIVE_AI_API_KEY` — for the `gemini-api` provider.
- A note that the **default config uses only `claude-code`-provider agents**, so a logged-in Claude Code install needs no keys at all.

### 9.4 `README.md`

Rewritten (spec R11/AC7) to describe the repo as it now is: a single `wordpress-development` skill plus Skillsmith-based evals. Content:

- A pointer to the skill structure.
- Prerequisites: Node ≥ 20.17, Docker (for wp-env), and `npm install` (which runs the Playwright-Chromium postinstall).
- An env-setup pointer to `.env.example`.
- How to run: a **single scenario** with `npx skillsmith <scenario-dir>` (equivalently `npm run skillsmith -- <scenario-dir>`) versus the **full matrix** with `npm run skillsmith`; where reports land (`.skillsmith/<runId>/`).
- The agent cap (R12): **agents must never run the full matrix; at most one scenario against one testing agent; full runs are the owner's manual step.**

It must contain no references to the removed harness, workflows, or skillpack flow.

### 9.5 R12 agent-guidance home

`.rp.md` (the conventions file agents read at workflow start; there is no repo `CLAUDE.md`/`AGENTS.md`) gains a short "Running evals" rule carrying the same cap, alongside the README note.

### 9.6 Untouched

`.claude/settings.local.json` holds personal permission-allowlist entries, some referencing the old `eval*` npm scripts. These are harmless personal-settings noise and are out of scope — left untouched.

## 10. The smoke run (AC1 / R12)

The acceptance smoke run is:

```
npx skillsmith <one-scenario-dir>
```

This is **naturally a 1-scenario × 1-testing-agent run**: the positional argument restricts to one scenario, and the copied config's `roles.test.agents = ["haiku"]` restricts to one testing agent. The judge (`opus`) is a separate role and does not count against the cap. No config change is needed to stay within R12.

It requires:

- **Claude Agent SDK auth** — a Claude Code login (or `ANTHROPIC_API_KEY` fallback), since both configured agents use the `claude-code` provider.
- **Docker** — for wp-env to boot WordPress.
- **Playwright Chromium** — installed by the retained `postinstall`.

A successful run completes end-to-end, including the wp-env/Playwright e2e validation, and produces Skillsmith's per-agent, per-scenario, and run-level reports under `.skillsmith/<runId>/` (AC1). The scenario is **not required to pass** — AC1 only requires the run to complete and produce reports. Inspecting the run confirms the skill under evaluation is `skills/wordpress-development` (AC2), since every `scenario.yaml` now lists `skills: [wordpress-development]`.

The full scenarios × testing-agents matrix is the **owner's manual validation** after the setup lands; it is explicitly not part of the pipeline's automated acceptance.

## 11. Prerequisites summary

For any local run (smoke or full):

- **Node ≥ 20.17** (Skillsmith's engine requirement).
- **Docker**, for `@wordpress/env`.
- **`npm install`**, which installs the pinned Skillsmith git dependency and runs the Playwright-Chromium `postinstall`.
- **Auth** as in section 10 — a Claude Code login is sufficient for the default config; the three provider API keys matter only if a provider is switched.

## 12. Traceability — design decisions to acceptance criteria

- **AC1** (smoke run completes, produces reports) — sections 3.2, 3.4, 10.
- **AC2** (skill under eval is `skills/wordpress-development`) — sections 6 (item 1), 10.
- **AC3** (no bespoke-harness remnants) — section 9.1 (delete `eval/`), 8 (drop `eval*` scripts and unused SDK deps).
- **AC4** (`.github/workflows/` cleared) — section 9.1 (six workflow files + gh-aw orphans → empty `.github/`).
- **AC5** (skillpack flow gone) — section 9.1 (delete `shared/`, `docs/`).
- **AC6** (skill keeps single-entry structure; Interactivity API content matches the testing-project skill) — section 7.
- **AC7** (`.env.example` and `README.md` describe only the Skillsmith setup) — sections 9.3, 9.4.
- **R4** (self-improvement dormant) — section 5 (config `mode: "test-only"`, `selfImprovement` present but inert).
- **R12** (agent run cap) — sections 9.4, 9.5, 10.

## 13. Out of scope (carried from the spec)

This change does **not**:

1. Define or curate the real scenario suite — the copied testing-project scenarios are only the v1 starting point.
2. Make the scenario matrix pass, or improve the skill based on eval results.
3. Run evals in CI — no PR gate or scheduled runs in v1; evaluation is local-only.
4. Use or verify Skillsmith's self-improvement mode.
5. Provide replacements for the removed agentic workflows (`skill-improver`, `upstream-sync`) — re-introducing upstream tracking is future work.
6. Change the Skillsmith tool itself — this issue only consumes it.
