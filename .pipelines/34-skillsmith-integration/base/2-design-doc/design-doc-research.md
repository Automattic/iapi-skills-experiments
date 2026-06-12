# Design Doc Research: Integrate the repo with Skillsmith and clean up what's now obsolete

> Phase 2 running record. Analyst: design-doc-analyst; researcher: design-doc-researcher.
> Inputs: `1-spec/spec.md` (approved), `1-spec/spec-research.md`, `0-intent/intent.md`.

## Design questions on the table

1. **Consumption mechanism** for `@automattic/skillsmith` (not on npm as of 2026-06-12): git dependency vs committed tarball vs submodule, pinning strategy, install ergonomics.
2. **Skillsmith config & CLI surface**: shape of `skillsmith.config.ts`, how a run is restricted to a single scenario × single testing agent (needed for AC1 and the R12 guidance), required env vars (feeds `.env.example`), what testing agents the testing-project configures, report outputs.
3. **Repo layout** for the copied testing-project files (root-level config files, `eval/` tree) and the `package.json` merge (scripts, dependencies, postinstall).
4. **Adaptation to `skills/wordpress-development`**: which copied files reference the skill by path/name and what changes (config fields, scenario yaml, prompts, rubric naming).
5. **Skill content merge**: mapping the testing-project's `wp-interactivity-api` skill (SKILL.md + 5 references) into `skills/wordpress-development`'s single-entry-point structure, superseding `references/interactivity-api.md`.
6. **Cleanup details & supporting files**: exact deletion set beyond the spec's explicit list (orphaned gh-aw support files, emptied folders), `.env.example` contents, README rewrite, and where the R12 agent guidance lives.

## Local findings (analyst, current worktree)

- `skills/wordpress-development/SKILL.md` is a short router: frontmatter (`name: wordpress-development`, `description: "Must use when working on any WordPress development task…"`) plus a REFERENCES section listing a single entry, `references/interactivity-api.md`.
- `shared/` contains **only** `scripts/skillpack-build.mjs` and `scripts/skillpack-install.mjs` — R9's deletions empty the folder entirely.
- `docs/` contains **only** `local-development.md` — R9 empties this folder too.
- `.github/` contains, besides the four workflows (R8): `.github/aw/actions-lock.json` (gh-aw action-pin lockfile) and `.github/agents/agentic-workflows.agent.md` (gh-aw dispatcher agent doc). Both exist solely to support the gh-aw agentic workflows (`skill-improver`, `upstream-sync`); with all four workflows removed they are orphaned.
- There is **no repo-level CLAUDE.md or AGENTS.md**. The project-conventions file read by agents is `.rp.md` ("Read this file at the start of any workflow") — candidate home for the R12 cap (agents run at most one scenario × one testing agent).
- `.claude/settings.local.json` holds only permission allowlist entries (some referencing old `eval` npm scripts — harmless, not in scope).
- Current `package.json`: `postinstall: npx playwright install chromium`; scripts `eval`, `eval:format`, `eval:llm`, `eval:e2e`; deps `@anthropic-ai/sdk`, `@google/generative-ai`, `openai`, `yaml`; devDeps `@playwright/test`, `@wordpress/env`.
- `.env.example` is old-harness-specific (OpenAI/Anthropic/Gemini keys pointing at `eval/eval.config.yaml`). `README.md` is two lines.

## Q&A record

### Topic 1 — Consumption mechanism for `@automattic/skillsmith`

**Q (analyst):** The package is not on npm. How should this repo consume it: git dependency, committed tarball, submodule? What does the package itself require (build step, prepare scripts), how does the testing-project consume it, and does `npm install github:Automattic/skillsmith` actually work?

**Findings (researcher, evidence-backed; no evals run):**

- Skillsmith is a **single package** (no monorepo/workspaces), `type: module`, `@automattic/skillsmith` v0.1.0. `exports "."` points at **raw TypeScript** (`./src/index.ts`); the `skillsmith` bin (`./bin/skillsmith.mjs`) loads `tsx/esm` and dynamically imports `../src/runner.ts` — TS runs from source at runtime via `tsx`, which is a regular runtime dependency. There is **no build step, no `dist/`, no `files` field, no prepare/prepack/postinstall scripts**.
- Runtime deps: `@ai-sdk/{anthropic,google,openai}`, `@anthropic-ai/claude-agent-sdk`, `@openai/codex-sdk`, `ai`, `tsx`, `yaml`, `zod`. Engines: node ≥ 20.17.
- The testing-project consumes it as `"skillsmith": "file:.."` — a relative path that only works because it lives inside the Skillsmith repo, and it aliases the package under the **unscoped** name `skillsmith` while `skillsmith.config.ts` imports from the **scoped** `@automattic/skillsmith` (an in-repo quirk we must not inherit).
- **Decisive experiment:** `npm install github:Automattic/skillsmith` in a throwaway dir **works without auth** (repo is public): installs under `node_modules/@automattic/skillsmith` with `src/` and `bin/` present and the `.bin/skillsmith` symlink created. The CLI prints usage; `import { defineConfig } from "@automattic/skillsmith"` resolves under tsx. The usual git-dependency caveat (only `prepare` runs, not `prepack`) is moot since there is nothing to build.
- Skillsmith's README recommends `npm install -D @automattic/skillsmith` (assumes npm publication). Publication is set up (changesets, public publishConfig, release workflow) and appears imminent, so the chosen mechanism should be a one-line swap to a registry range later.
- Alternatives (committed tarball, submodule + `file:`, vendored copy) are all feasible but strictly heavier with no upside given the git install works.
- testing-project devDeps besides skillsmith: `@playwright/test`, `@wordpress/e2e-test-utils-playwright`, `@wordpress/env`, `@wordpress/scripts`. Scripts: `env:start` = `wp-env start`, `env:stop` = `wp-env stop`, `test:e2e` = `playwright test`, `skillsmith` = `skillsmith`.

**Decision (analyst):** Consume Skillsmith as a **devDependency pinned to a git ref**: `"@automattic/skillsmith": "github:Automattic/skillsmith#<commit-sha-or-tag>"`. Rationale: the real scoped name makes the config's import resolve with zero edits; no build step required; public repo means no auth; a commit-SHA pin gives reproducibility and a trivial swap to `^0.1.0` once the package is published. The design doc should note the swap path. Mirror the testing-project's npm scripts (`skillsmith`, `test:e2e`, `env:start`/`env:stop`) where applicable.

**Carried note for later topics:** the CLI restricts a run to one scenario via a positional arg matching the scenario directory name (`skillsmith <scenario-dir>`), and to one testing agent via the config's `roles.test.agents` array — this is the AC1/R12 smoke handle. The shipped bin also parses `--verbose/--mode/--iterations/--scope/--final-pass` (README's "no CLI flags" claim is stale).

### Topic 2 — Config shape, env vars, outputs, e2e wiring, adaptation surface

**Q (analyst):** Full shape of the testing-project's `skillsmith.config.ts`; the env vars a run needs; where reports land; how the wp-env/Playwright e2e wiring works; every place the copied files reference the skill by name/path; and the exact commit to pin.

**Findings (researcher, static analysis of the Skillsmith clone):**

*Config (`defineConfig`, type `SkillsmithConfigInput`):*
- Fields: `mode` (`"test-only" | "self-improvement"`), `agents` (record of id → `{provider, model, …extras like effort}`), `roles` (`test: {agents: string[], prompt?}`, `judge: string | {agent, prompt?}`, `improver: {agent, prompt?}`), `paths?` (partial of `{base, skills, scenarios, rubrics}`), `hooks?`, `selfImprovement? {maxIterations, scope}`.
- **The skill path is not a config field.** Path defaults (`src/config/defaults.ts`): `base: "./.skillsmith"`, `skills: "./skills"`, `scenarios: "./eval/scenarios"`, `rubrics: "./eval/rubrics"`. The testing-project does not override `paths` — and these defaults match this repo's layout exactly, so we don't either.
- Which skill a scenario exercises comes from each `scenario.yaml`'s `skills:` array (skill directory name under `paths.skills`).
- Testing-project config: `mode: "test-only"`; agents `haiku` (`claude-code`, `claude-haiku-4-5`) and `opus` (`claude-code`, `claude-opus-4-7`, effort xhigh); `roles.test.agents = ["haiku"]` (only haiku tests; opus is judge and improver); `selfImprovement {maxIterations: 3, scope: "failed-scenarios"}` present but dormant under test-only mode (matches R4); hooks `beforeTestAgent → scaffoldPlugin`, `afterAllScenarios → runE2eVerification`; role prompts read via `readFileSync` from `eval/prompts/*.md`.
- Available providers: `claude-code`, `anthropic-api`, `openai-api`, `codex`, `gemini-api`, `mock`. The testing-project uses only `claude-code`. A full-surface reference config lives at `examples/skillsmith.config.ts` in the Skillsmith repo.

*Env vars:*
- Skillsmith's bin natively loads `.env` from the invocation directory (Node's `process.loadEnvFile`, no dotenv); shell env takes precedence.
- Skillsmith's own `.env.example` documents `ANTHROPIC_API_KEY` (anthropic-api), `OPENAI_API_KEY` (openai-api + codex), `GOOGLE_GENERATIVE_AI_API_KEY` (gemini-api).
- **The copied config's agents both use the `claude-code` provider, which is not key-driven**: it calls the Claude Agent SDK with no explicit key, so auth comes from an existing Claude Code login or `ANTHROPIC_API_KEY`. The smoke run's hard requirement is Agent-SDK auth only; the other keys matter only if providers are switched.

*Outputs (satisfies AC1's report levels):*
- Run dir: `./.skillsmith/<runId>/`. Per-agent `iteration-N/<scenario>/<agent>/report.json`; per-scenario `iteration-N/<scenario>/report.json`; per-iteration `iteration-N/report.json`; run-level `report.json` + `run.json` + human `summary.txt`; Playwright JSON at `iteration-N/tests-report.json`.
- Gitignore needs (ported from the Skillsmith root `.gitignore`'s testing-project block): `test-results/`, `playwright-report/`, `.auth/`, `artifacts/`, `.skillsmith/`, `.wp-env.json` (bare path at our root).

*E2e wiring:*
- `playwright.config.ts`: imports `./skillsmith.config`; `testDir: "./eval/scenarios"`, `testMatch: "**/e2e.spec.mjs"`, `globalSetup: "./global-setup.mjs"`; Playwright projects are generated from `roles.test.agents` ids; `workers: 1`; port `WP_ENV_PORT ?? 8987`; storage state `./.auth/admin.json`; uses `@wordpress/e2e-test-utils-playwright`.
- `global-setup.mjs`: logs into wp-env's default admin via `RequestUtils.setupRest()`, persists storage state.
- **No committed `.wp-env.json`** — `verify-e2e.ts` writes it at runtime (scaffolded plugin paths, port 8987) and removes it in `finally`. `PROJECT_ROOT` is computed two levels up from `eval/utils`, which lands on our repo root unchanged.
- Hook flow: build each scaffolded plugin with `wp-scripts build` (`WP_EXPERIMENTAL_MODULES=1`) → write `.wp-env.json` → `npm run env:start` → `npm run test:e2e -- <specs>` → `npm run env:stop` → parse the JSON report into per-(scenario, agent) failures. Requires `env:start`/`env:stop`/`test:e2e` npm scripts (testing-project has them; we must too). Implies local Docker for wp-env.
- `wp-cli.mjs`: thin `npx wp-env run cli wp …` helper used by some specs for fixtures.

*Skill-name coupling — the exact adaptation list:*
1. All 11 `scenario.yaml` files list `skills: [wp-interactivity-api]` → change to `wordpress-development` (this is R3; the only skill-selection coupling).
2. `scenario.yaml` `rubrics:` entries reference rubric basename `wp-interactivity-api-best-practices` — keep the rubric filename and refs as-is (R2 copies the rubric verbatim).
3. `verify-e2e.ts` imports types `from "skillsmith"` (unscoped — only works with the testing-project's `file:..` alias). **Must change to `from "@automattic/skillsmith"`** to resolve against our scoped git install. `skillsmith.config.ts` already imports the scoped name; `scaffold-plugin.ts` and `wp-cli.mjs` import nothing from skillsmith.
4. Everything else is content-level, copied as-is: prompts mention the Interactivity API and its docs URL; the rubric content is interactivity-scoped; `_candidates.yaml` is commented-out notes (contains a harmless hardcoded local path comment); scenario `name:` fields may differ from dir names (selection matches the dir name; `name` is used in iteration dirs) — leave as copied.

*Pin:* trunk HEAD = `6bd90c34d88b815fdf4fd661dc8c51288111444c`; **no git tags exist**, so pin the commit SHA: `"@automattic/skillsmith": "github:Automattic/skillsmith#6bd90c34d88b815fdf4fd661dc8c51288111444c"`.

**Decisions (analyst):**
- **No `paths` override** in our config — Skillsmith's defaults match the repo layout (`skills/`, `eval/scenarios`, `eval/rubrics`); the copied eval tree lands exactly where the spec lists it and the deleted bespoke `eval/` frees the name.
- **Adaptations are exactly two beyond verbatim copying:** the 11 `skills:` entries → `wordpress-development`, and the `verify-e2e.ts` import → `@automattic/skillsmith`. Rubric filename, prompts, `_candidates.yaml`, and scenario name/dir mismatches are copied untouched.
- **Smoke run (AC1/R12) shape:** `npx skillsmith <scenario-dir>` — single scenario by positional arg; the copied config already tests with a single agent (`haiku`), so the 1-scenario × 1-test-agent cap holds without config changes (the judge role is a separate role, not a testing agent).
- **`.env.example`** documents the three provider keys with the claude-code caveat (Agent-SDK auth via Claude Code login or `ANTHROPIC_API_KEY` is what the default config actually needs) and notes that Skillsmith loads `.env` from the invocation dir.
- **`.gitignore`** gains the six entries above.
- **Prerequisites to document:** Node ≥ 20.17, Docker (for wp-env), Playwright Chromium (covered by retained `postinstall`).

### Topic 3 — Repo layout and `package.json` merge (analyst decision from Topics 1–2 evidence)

The Topic 1–2 evidence settles this without further research:

- **Root files copied from testing-project:** `skillsmith.config.ts`, `playwright.config.ts`, `global-setup.mjs`, `tsconfig.json`. The repo has no existing tsconfig or Playwright config at root (the old harness's `playwright.config.mjs` lives inside `eval/` and is deleted with it), so there are no collisions. `package-lock.json` is regenerated by `npm install`, not copied.
- **Eval tree:** `eval/prompts/`, `eval/rubrics/`, `eval/scenarios/` (11 scenario dirs + `_candidates.yaml`), `eval/utils/` — replacing the deleted bespoke `eval/` wholesale.
- **`package.json` after the change:** keep `name`/`private`/`type: module`/`postinstall` (Playwright Chromium install); drop scripts `eval`, `eval:format`, `eval:llm`, `eval:e2e`; add scripts `skillsmith: "skillsmith"`, `test:e2e: "playwright test"`, `env:start: "wp-env start"`, `env:stop: "wp-env stop"`; drop dependencies `@anthropic-ai/sdk`, `@google/generative-ai`, `openai`, `yaml` (Skillsmith bundles its own yaml; nothing else in the repo uses these); devDependencies become `@automattic/skillsmith` (pinned git SHA), `@playwright/test`, `@wordpress/env` (both already present), plus `@wordpress/e2e-test-utils-playwright` and `@wordpress/scripts` (new, required by global-setup and the plugin-build step).

### Topic 4 — Skill loading mechanics and the content merge

**Q (analyst):** How does Skillsmith hand a skill to the testing agent (does reference layout matter)? What's the structure of the testing-project's `wp-interactivity-api` skill? Does superseding our `references/interactivity-api.md` lose anything? Do judge/improver also see the skill?

**Findings (researcher, static analysis):**

*Skill loading (`src/scenarios/skill-loader.ts`) — the layout driver:*
- `loadSkill(skillId, skillsRoot)` reads `<skillsRoot>/<skillId>/SKILL.md`, then **BFS-follows every relative markdown link** whose target resolves inside the skill dir, concatenating each reached file verbatim (with `=== <skillId>/<relpath> ===` headers) into one blob. **Link-driven, not a directory scan**: a reference file on disk that no markdown link reaches is never loaded.
- Links outside the skill dir, absolute URLs, `#fragments`, and `mailto:` are skipped; `#` anchors are stripped before resolving. **Nested subdirectories are allowed** — the only rule is that links must resolve inside the skill dir.
- `skillId` = the **directory name** under `paths.skills` (what `scenario.yaml`'s `skills:` lists). Frontmatter `name` is never read by the loader.
- Delivery: the whole blob (SKILL.md + all transitively linked refs) is **inlined into the testing agent's system prompt**, followed by workspace snapshot, write policy, and the role prompt; the scenario prompt is the user message. The agent does not browse the skill on disk.

*Testing-project skill (`skills/wp-interactivity-api/`):*
- `SKILL.md` (262 lines): frontmatter `name: wp-interactivity-api` + a trigger-heavy description; body = intro, "Hard rules — every one matters" (11 rules), "Standard skeleton" (block.json + render.php + view.js), pattern sections (local context vs global state, derived state, async/fetch, `data-wp-each`, init callbacks, gotchas), ending with a "References (load on demand)" section linking all five refs with one-line read-when gists. Mid-body inline links to `references/store.md` and `references/client-navigation.md` also exist.
- Five refs, flat under `references/`: `directives.md` (159L), `store.md` (277L), `server-rendering.md` (242L), `client-navigation.md` (203L), `typescript.md` (146L). Whole skill ≈ 1,289 lines.

*Substance comparison:* our `references/interactivity-api.md` is a **3-line placeholder stub** ("Placeholder reference. Content to be added."). The testing-project content is a strict superset; nothing is lost by superseding (R6/AC6 is a pure replacement).

*Judge/improver:* the judge **never sees the skill** — its system prompt is built only from rubric files plus the scenario's acceptance criteria, with an explicit instruction not to consult skill docs (so skill layout cannot affect judging). The improver does load the skill via the same loader, but only in self-improvement mode, which stays dormant (R4).

**Decision (analyst), pending one follow-up:** keep `skills/wordpress-development/SKILL.md` as the generic single-entry-point router (R5). Fold the testing-project SKILL.md **body** into the topic entry doc at `references/interactivity-api.md` (superseding the stub at the same path the router already links), and place the five copied refs in a topic subfolder `references/interactivity-api/{directives,store,server-rendering,client-navigation,typescript}.md`, with the entry doc linking all five so the loader reaches them transitively. The frontmatter of the copied SKILL.md is dropped (the router keeps its own); the trigger language can inform the router's read-when line. Follow-up needed before fixing the link-rewrite rules: whether `loadSkill` resolves relative links against the linking file's directory or the skill root (determines how the copied `[references/X.md]` links — including inter-ref links — must be rewritten).
