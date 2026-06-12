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

(Recorded per topic as the researcher reports back.)
