# wordpress-development skill

A single skill for WordPress development, with [Skillsmith](https://github.com/Automattic/skillsmith)-based local evals.

## Skill structure

The skill lives under `skills/wordpress-development/`. It uses a single-entry-point layout: `skills/wordpress-development/SKILL.md` is the root document that routes the model to topic-specific reference files. Currently the main topic is the Interactivity API, covered by `skills/wordpress-development/references/interactivity-api.md` and five sub-references under `skills/wordpress-development/references/interactivity-api/`.

## Prerequisites

- **Node ≥ 20.17**
- **Docker** — required by `@wordpress/env` to boot a local WordPress instance during evals
- **Dependencies** — run `npm install` from the repo root; the `postinstall` script automatically installs the Playwright Chromium browser

## Environment setup

Copy `.env.example` to `.env` and fill in the keys you need. The default Skillsmith configuration uses only `claude-code`-provider agents, so a logged-in Claude Code install needs no API keys. If you want to test other providers, `.env.example` documents `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, and `GOOGLE_GENERATIVE_AI_API_KEY`.

Skillsmith auto-loads `.env` from the directory you invoke it in (using Node's built-in `process.loadEnvFile`). Shell environment variables take precedence over `.env`.

## Running evals

### Single scenario (the normal dev workflow)

```sh
npx skillsmith <scenario-dir>
# equivalently
npm run skillsmith -- <scenario-dir>
```

Scenario names are the bare directory names under `eval/scenarios/` (e.g. `counter`, `cpt-register`). For example:
```sh
npx skillsmith counter
```

`eval/scenarios/` also holds two leading-underscore (non-directory) candidate catalogs — planning artifacts that scenario discovery skips, not runnable scenarios:
- `eval/scenarios/_candidates.yaml` — candidate Interactivity-API scenarios.
- `eval/scenarios/_wp-dev-candidates.yaml` — broader WordPress-development candidates spanning the developer.wordpress.org areas.

This runs one scenario against the single configured testing agent and writes results under `.skillsmith/<runId>/`.

### Full matrix (owner's manual step only)

```sh
npm run skillsmith
```

Running the full `scenarios × testing-agents` matrix is expensive and is **not** an agent task. See the cap below.

### Report location

All run output lands under `.skillsmith/<runId>/`:
- Per-agent report: `iteration-N/<scenario>/<agent>/report.json`
- Per-scenario report: `iteration-N/<scenario>/report.json`
- Run-level summary: `report.json`, `run.json`, `summary.txt`
- Playwright results: `iteration-N/tests-report.json`

## Agent cap (R12)

**Agents must never run the full eval matrix; an agent runs at most one scenario against one testing agent, and the full matrix is the owner's manual step.** Always pass a single scenario directory as a positional argument so the run stays capped:

```sh
npx skillsmith <one-scenario-dir>
```

Running `npm run skillsmith` with no argument executes the entire `scenarios × testing-agents` matrix. That is expensive and is reserved for the owner to run by hand after setup — it is never an agent task.
