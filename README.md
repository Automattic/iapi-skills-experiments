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

Scenarios are organized into seven per-topic folders under `eval/scenarios/` — `interactivity-api/`, `plugins/`, `block-editor/`, `rest-api/`, `themes/`, `common-apis/`, and `coding-standards/` — and each scenario lives one level deeper as `eval/scenarios/<topic>/<scenario>/` (e.g. `interactivity-api/counter`, `plugins/cpt-register`). A scenario is addressed by its `<topic>/<scenario>` path:
```sh
npx skillsmith plugins/cpt-register
```
Note: addressing a nested scenario this way requires the upstream Skillsmith nested-discovery change described under [Skillsmith nested-discovery dependency](#skillsmith-nested-discovery-dependency) below. Until that ships, nested scenarios are not discoverable via `npx skillsmith`.

`eval/scenarios/` also holds two leading-underscore (non-directory) candidate catalogs — planning artifacts that scenario discovery skips, not runnable scenarios. They **stay at the `eval/scenarios/` root** (they are not moved into the topic folders) and reference scenarios by `name`, not by path:
- `eval/scenarios/_candidates.yaml` — candidate Interactivity-API scenarios.
- `eval/scenarios/_wp-dev-candidates.yaml` — broader WordPress-development candidates spanning the developer.wordpress.org areas. Its area headers carry a `# folder:` pointer to the matching topic folder, and it now ends with an `# === Agent-Skills Gaps ===` section recording agent-skills topics that have no scenario yet.

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

### Skillsmith nested-discovery dependency

The per-topic folder layout above depends on an upstream change to the pinned `@automattic/skillsmith` (currently `github:Automattic/skillsmith#6bd90c34d88b815fdf4fd661dc8c51288111444c`). The pinned version discovers scenarios with a **flat, non-recursive** `readdir` of `eval/scenarios/` — it lists only immediate children and expects a `scenario.yaml` directly inside each — and reports each scenario's directory as a **basename** `dirName` (e.g. `counter`). A topic folder like `plugins/` has no `plugins/scenario.yaml`, so the pinned Skillsmith skips it without descending, and the nested scenarios inside it are never found.

Making nested scenarios discoverable and runnable requires **two upstream changes** in Skillsmith's `src/scenarios/enumerate.ts`:

- **(A) Recursive discovery** — walk the subdirectories of the scenarios root (not just its immediate children) to find `scenario.yaml` at any depth, so scenarios inside topic folders are enumerated.
- **(B) Relative `dirName`** — report each scenario's `dirName` as the path **relative to the scenarios root** (e.g. `plugins/cpt-register`, not `cpt-register`), so dirNames stay unique across topic folders and `npx skillsmith plugins/cpt-register` can address a nested scenario.

**Until (A) and (B) ship upstream, the nested scenarios are invisible to the pinned Skillsmith** — the suite is reorganized but not runnable via `npx skillsmith`. This is an accepted, temporary state; the owner is driving the upstream fix via an issue. The local harness is already updated for the nested layout (the e2e specs' relative imports and `verify-e2e.ts`'s failure-attribution path reconstruction), so the moment the upstream change lands the suite is functional with no further local work.

Playwright e2e collection is **not** affected: `playwright.config.ts` uses `testDir: "./eval/scenarios"` with `testMatch: "**/e2e.spec.mjs"`, and the `**/` glob already collects specs at any nesting depth, so no Playwright change is needed.

## Agent cap (R12)

**Agents must never run the full eval matrix; an agent runs at most one scenario against one testing agent, and the full matrix is the owner's manual step.** Always pass a single scenario as a positional argument so the run stays capped. A single nested `<topic>/<scenario>` path is the capped unit of work:

```sh
npx skillsmith plugins/cpt-register
```

Running `npm run skillsmith` with no argument executes the entire `scenarios × testing-agents` matrix. That is expensive and is reserved for the owner to run by hand after setup — it is never an agent task.
