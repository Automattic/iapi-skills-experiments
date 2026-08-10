# wordpress-development skill

A single skill for WordPress development, with [Skillsmith](https://github.com/Automattic/skillsmith)-based local evals.

The eval scenarios live under `eval/scenarios/`, organized into a capability-based
folder taxonomy. To browse the curated set, understand how it is organized, or add
or extend a scenario, start with the [scenario-set guide](eval/scenarios/README.md).

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
npx skillsmith <group>/<scenario>
# equivalently
npm run skillsmith -- <group>/<scenario>
```

Scenarios are nested one level deep, so a scenario is addressed by its
`<group>/<scenario>` path under `eval/scenarios/` — the bare leaf name on its own no
longer selects a scenario. For example, to run the `minimal-scaffold` scenario in the
`foundations` group:
```sh
npx skillsmith foundations/minimal-scaffold
```

This runs one scenario against the single configured testing agent and writes results under `.skillsmith/<runId>/`.

See the [scenario-set guide](eval/scenarios/README.md) for the full list of groups and the scenarios under each.

### Filter by capability group (owner's manual step)

A positional argument that names a **group folder** (rather than a full
`<group>/<scenario>` path) selects every scenario in that group:

```sh
npx skillsmith foundations
```

This runs all scenarios under `eval/scenarios/foundations/`. The match is
segment-aware: `foundations` selects `foundations/minimal-scaffold` and its siblings,
but not a differently named group. You can pass several filters, each either a full
scenario path or a group folder, and an unknown filter fails the run with the list of
available scenarios.

Selecting a whole group runs more than one scenario, so — like the full matrix — it is
**not** an agent task; it is an owner's manual step. An agent always passes a single
`<group>/<scenario>` path (see the cap below).

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

Here `<scenario>` is the **bare scenario name** (the leaf directory name, which equals
the scenario's `name` field) — not the nested `<group>/<scenario>` path used to address
it on the command line. Skillsmith keys run workspaces and artifacts on the scenario
name, so even though `foundations/minimal-scaffold` selects the scenario, its output
lands under `iteration-N/minimal-scaffold/`. (Scenario names are globally unique across
the tree, so this stays unambiguous.)

## Agent cap (R12)

**Agents must never run the full eval matrix; an agent runs at most one scenario against one testing agent, and the full matrix is the owner's manual step.** Always pass a single scenario as a positional argument — addressed by its full nested `<group>/<scenario>` path — so the run stays capped to exactly one scenario:

```sh
npx skillsmith <group>/<scenario>
```

A bare group folder (e.g. `npx skillsmith foundations`) selects every scenario in that group, and `npm run skillsmith` with no argument executes the entire `scenarios × testing-agents` matrix. Both run more than one scenario, are expensive, and are reserved for the owner to run by hand after setup — they are never an agent task.
