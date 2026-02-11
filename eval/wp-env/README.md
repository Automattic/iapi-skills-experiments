# wp-env (E2E testing environment)

This directory is used at runtime by Stage 3 (E2E testing) of the eval pipeline.

During an E2E run, the following are generated here automatically:

- `.wp-env.json` — wp-env configuration pointing to the generated plugins
- `plugins/` — WordPress plugin directories built from LLM-generated code

Both are gitignored and cleaned up after each run.

## Requirements

- Docker Desktop must be running
- Dependencies installed (`npm install`)

## How it works

1. `plugin-builder.mjs` writes generated code into `plugins/{slug}/`
2. `wp-env-manager.mjs` writes `.wp-env.json` and runs `npx wp-env start`
3. Test posts are created via WP-CLI
4. Playwright runs the E2E specs against `http://localhost:8888`
5. Everything is torn down and cleaned up afterwards
