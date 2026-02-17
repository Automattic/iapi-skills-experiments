# Eval Pipeline

This directory contains a three-stage evaluation pipeline that tests how well an LLM can generate WordPress Interactivity API code when guided by our skill instructions.

## Overview

```
Stage 1: Format Validation
  → Does the SKILL.md follow the authoring guide?

Stage 2: LLM Evaluation
  → Can a student LLM produce correct code using the skill?
  → Does a judge LLM confirm the code meets the rubric?

Stage 3: E2E Testing
  → Does the generated code actually work in a real WordPress site?
```

## Running

```bash
npm run eval          # All three stages
npm run eval:format   # Stage 1 only
npm run eval:llm      # Stage 2 only
npm run eval:e2e      # Stage 3 only (requires cached LLM results + Docker)
```

Filter to specific scenarios with `--scenarios`:

```bash
npm run eval:llm -- --scenarios=counter-block
npm run eval:e2e -- --scenarios=counter-block,toggle-visibility
```

## Stage 1: Format Validation

Runs the harness at `harness/run.mjs` against the skill's `SKILL.md` to verify it follows the [authoring guide](https://github.com/WordPress/agent-skills/blob/trunk/docs/authoring-guide.md) (YAML frontmatter, required fields, etc.).

No external dependencies required.

## Stage 2: LLM Evaluation

1. Loads the skill context (`SKILL.md` + all reference docs) as a system prompt.
2. For each scenario, sends the scenario prompt to a **student LLM** to generate code.
3. Sends the generated code + a merged rubric to a **judge LLM** that scores each criterion as pass/fail.

The rubric for each scenario combines:

- `rubrics/general.yaml` — shared best-practice criteria (e.g. uses `viewScriptModule`, imports from `@wordpress/interactivity`)
- `scenarios/{name}/scenario.yaml` → `specific_rubric` — scenario-specific criteria

Results are cached to `eval/.cache/llm-results.json` so Stage 3 can run independently.

### Configuration

LLM providers and models are configured in `eval.config.yaml`:

```yaml
student:
  provider: openai
  model: gpt-4o-mini
judge:
  provider: openai
  model: gpt-4o
skill: wp-interactivity-api
```

API keys are read from a `.env` file at the repo root (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`).

## Stage 3: E2E Testing

Takes the generated code from Stage 2 and verifies it works in a real WordPress environment.

**Requirements:** Docker Desktop must be running.

### Pipeline

1. **Code extraction** (`lib/code-extractor.mjs`) — Parses the LLM's raw output to extract `block.json`, `render.php`, and `view.js` from fenced code blocks.
2. **Plugin build** (`lib/plugin-builder.mjs`) — Writes extracted files into a valid WordPress plugin under `wp-env/plugins/`.
3. **Environment setup** (`lib/wp-env-manager.mjs`) — Generates `.wp-env.json`, starts wp-env, enables pretty permalinks, and creates test posts via WP-CLI.
4. **Test execution** (`lib/playwright-runner.mjs`) — Runs Playwright specs from `scenarios/{name}/e2e.spec.mjs` against the live site at `http://localhost:8888`.
5. **Cleanup** — Stops wp-env and removes generated plugins.

### Error handling

| Failure                   | Behavior                                      |
| ------------------------- | --------------------------------------------- |
| Code extraction fails     | Scenario reported as SKIP                     |
| `block.json` invalid JSON | Scenario reported as ERROR                    |
| Docker not running        | Entire E2E stage skipped with warning         |
| Plugin has PHP fatal      | Playwright `waitForSelector` times out → FAIL |
| No cached LLM results     | Error: "Run `eval:llm` first"                 |

## Directory Structure

```
eval/
├── run-eval.mjs              # Main orchestrator
├── eval.config.yaml           # LLM provider/model config
├── playwright.config.mjs      # Playwright config for E2E tests
├── harness/
│   └── run.mjs                # Stage 1 format validation harness
├── lib/
│   ├── config.mjs             # Config loader (YAML + CLI args)
│   ├── scenario-loader.mjs    # Load scenario YAML + merge rubrics
│   ├── skill-loader.mjs       # Load SKILL.md + references as context
│   ├── judge.mjs              # LLM-as-judge evaluation
│   ├── reporter.mjs           # Console reporter for all stages
│   ├── code-extractor.mjs     # Parse LLM output into files
│   ├── plugin-builder.mjs     # Write files as a WP plugin
│   ├── wp-env-manager.mjs     # wp-env lifecycle management
│   ├── playwright-runner.mjs  # Run Playwright + parse results
│   └── providers/             # LLM provider adapters
│       ├── base.mjs
│       ├── anthropic.mjs
│       ├── openai.mjs
│       └── index.mjs
├── rubrics/
│   └── general.yaml           # Shared rubric criteria
├── scenarios/
│   ├── counter-block/
│   │   ├── scenario.yaml      # Prompt, rubric, e2e config
│   │   └── e2e.spec.mjs       # Playwright test
│   └── toggle-visibility/
│       ├── scenario.yaml
│       └── e2e.spec.mjs
└── wp-env/                    # Runtime directory for wp-env (gitignored contents)
    └── README.md
```

## Adding a New Scenario

1. Create `eval/scenarios/{name}/scenario.yaml` with `name`, `prompt`, `specific_rubric`, and `e2e` section.
2. Create `eval/scenarios/{name}/e2e.spec.mjs` with Playwright tests targeting the generated block.
3. Run `npm run eval:llm -- --scenarios={name}` to test Stage 2.
4. Run `npm run eval:e2e -- --scenarios={name}` to test Stage 3 (Docker required).
