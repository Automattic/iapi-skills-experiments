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
