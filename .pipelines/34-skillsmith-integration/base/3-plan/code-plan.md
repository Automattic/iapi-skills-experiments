# Code Plan: Integrate the repo with Skillsmith and clean up what's now obsolete

This plan turns the approved design (`2-design-doc/design-doc.md`) into discrete, dispatchable tasks. The design's decisions are settled and are not reopened here; every task traces back to a spec requirement (R1–R12) / acceptance criterion (AC1–AC7) and a design section.

## How to read this plan

- Tasks are grouped into **batches**. Tasks within a batch are independent of each other unless a `Depends on` says otherwise; batches run in order.
- Each task carries: **Goal / Files / Changes / Depends on / Traces to / Acceptance**.
- "Repo root" means the pipeline worktree root: `/Users/santosguillamot/Desktop/Code/wordpress-skill-experiments/.claude/worktrees/34-skillsmith-integration`. All paths below are relative to that root unless stated otherwise. Never touch the main repository checkout.
- "Testing-project source" means a clone of `Automattic/skillsmith` checked out at the **pinned SHA `6bd90c34d88b815fdf4fd661dc8c51288111444c`**, under its `testing-project/` directory. Several tasks copy files from there. The same SHA is the dependency pin (design §4). A code-writer that needs these source files obtains them by cloning the public repo at that SHA into a scratch location outside the worktree (see Task 0).

## GUARDRAIL — R12 token cap (read this; it binds every task)

**Never run Skillsmith over the full configuration.** A full `scenarios × testing-agents` matrix consumes too many tokens. Any verification a task performs with Skillsmith must be capped to **at most one scenario against one testing agent** — i.e. always pass a single scenario-directory positional argument (`npx skillsmith <one-scenario-dir>`) and rely on the copied config's `roles.test.agents = ["haiku"]` (one testing agent). Never run the bare `npm run skillsmith` / `npx skillsmith` with no scenario argument. The blob-verification step (Task 9) is a **static Node call, not an eval run**, and is R12-safe. The full-matrix run is the owner's manual step after the setup lands and is **not** part of this pipeline's acceptance. If any task is tempted to "just verify the whole thing," it must not.

---

## Batch A — Obtain source, delete obsolete machinery

### Task 0 — Fetch the pinned testing-project source

**Goal.** Make the Skillsmith `testing-project/` files available locally so later tasks can copy from them, pinned to the exact SHA that the dependency will install.

**Files.** None in the repo. A scratch clone **outside** the worktree (e.g. `/tmp/skillsmith-6bd90c3`).

**Changes.**
1. Clone the public repo at the pinned SHA into a scratch directory outside the worktree:
   ```
   git clone https://github.com/Automattic/skillsmith.git /tmp/skillsmith-6bd90c3
   git -C /tmp/skillsmith-6bd90c3 checkout 6bd90c34d88b815fdf4fd661dc8c51288111444c
   ```
   (No authentication is required — the repo is public.)
2. Confirm the source tree exists: `/tmp/skillsmith-6bd90c3/testing-project/` contains `skillsmith.config.ts`, `playwright.config.ts`, `global-setup.mjs`, `tsconfig.json`, `eval/{prompts,rubrics,scenarios,utils}`, and `skills/wp-interactivity-api/`.
3. Record the absolute scratch path; downstream copy tasks read from `<scratch>/testing-project/…`.

**Depends on.** Nothing.

**Traces to.** Design §4 (pinned SHA), §4 "Keeping the copied config coherent". Enables R2, R6.

**Acceptance.** The scratch clone exists at the pinned SHA and `git -C <scratch> rev-parse HEAD` prints `6bd90c34d88b815fdf4fd661dc8c51288111444c`; `testing-project/skillsmith.config.ts` and `testing-project/skills/wp-interactivity-api/SKILL.md` are present.

---

### Task 1 — Delete the bespoke harness and all obsolete machinery

**Goal.** Remove every obsolete file the move makes redundant, clearing the slots the copied eval tree and rewritten supporting files will refill. This is a pure deletion task.

**Files (all deleted).**
- `eval/` — **the entire directory** (runner `run-eval.mjs`, `eval/harness/`, `eval/lib/` incl. the Anthropic/Gemini/OpenAI providers, judge, playwright-runner, plugin-builder, wp-env-manager, reporter, loaders; the old scenarios `counter-block` and `toggle-visibility`; `eval/rubrics/general.yaml`; `eval.config.yaml`; `eval/playwright.config.mjs`; `eval/wp-env/`; `eval/README.md`).
- `.github/workflows/eval-gate.yml`
- `.github/workflows/run-evals.yml`
- `.github/workflows/skill-improver.md`
- `.github/workflows/skill-improver.lock.yml`
- `.github/workflows/upstream-sync.md`
- `.github/workflows/upstream-sync.lock.yml`
- `.github/aw/actions-lock.json`
- `.github/agents/agentic-workflows.agent.md`
- `.gitattributes`
- `shared/` — the entire directory (`shared/scripts/skillpack-build.mjs`, `shared/scripts/skillpack-install.mjs`).
- `docs/` — the entire directory (`docs/local-development.md`).

**Changes.** `git rm -r` each path above. After deletion, `.github/` must end up with **no files** (git drops empty directories), and `shared/` and `docs/` must be gone entirely.

**Depends on.** Nothing. (Independent of Task 0 — but note Batch B refills `eval/`, so Task 1 must land before Batch B copies into `eval/`.)

**Traces to.** R7 (delete `eval/`), R8 (workflows), R9 (skillpack `shared/`, `docs/`); design §9.1, §2 (gh-aw orphans, `.gitattributes`). Satisfies AC3 (partial — harness deletion), AC4 (workflows), AC5 (skillpack).

**Acceptance.**
- `eval/`, `shared/`, `docs/` no longer exist.
- `find .github -type f` returns nothing.
- `.gitattributes` no longer exists.
- A tree search finds no `run-eval`, `eval.config.yaml`, `eval/lib/`, `eval/harness/`, `counter-block`, or old `toggle-visibility` scenario folder remnants (the copied `toggle-visibility` scenario added in Batch B is a *different* file under `eval/scenarios/` and is fine).

---

## Batch B — Copy the testing-project eval setup

> All tasks in Batch B depend on **Task 0** (source available) and on **Task 1** (the bespoke `eval/` deleted, so the copied tree lands on a clean slot). They are independent of each other.

### Task 2 — Copy root-level Skillsmith project files

**Goal.** Place the four root-level project files the run needs, copied from the testing-project.

**Files (created at repo root).**
- `skillsmith.config.ts`
- `playwright.config.ts`
- `global-setup.mjs`
- `tsconfig.json`

**Changes.** Copy each verbatim from `<scratch>/testing-project/` to the repo root. **Do not adapt `tsconfig.json` here** — its `extends` adaptation is Task 7. **Do not adapt `skillsmith.config.ts`** — it already imports the scoped name `@automattic/skillsmith` and needs no change. `playwright.config.ts` and `global-setup.mjs` are taken as-is.

The repo has no existing root tsconfig or root Playwright config (the old harness's `playwright.config.mjs` lived inside `eval/` and was deleted in Task 1), so there are no collisions.

**Depends on.** Task 0, Task 1.

**Traces to.** R2 (config + supporting project files); design §5 "Files copied… landing at the repo root". Enables AC1.

**Acceptance.** All four files exist at the repo root and are byte-identical to their testing-project sources (before any later adaptation). `skillsmith.config.ts` imports from `@automattic/skillsmith`.

---

### Task 3 — Copy the eval prompts and rubric

**Goal.** Place the role prompts and the rubric the copied config and scenarios reference.

**Files (created).**
- `eval/prompts/improver.md`
- `eval/prompts/testing-agent.md`
- `eval/rubrics/wp-interactivity-api-best-practices.md`

**Changes.** Copy each verbatim from `<scratch>/testing-project/eval/…`. **Filenames and contents are left exactly as copied** — the rubric basename `wp-interactivity-api-best-practices` is referenced by every `scenario.yaml`'s `rubrics:` entry, and the prompts' Interactivity-API mentions are content, not a functional coupling (design §6 "What is deliberately *not* changed").

**Depends on.** Task 0, Task 1.

**Traces to.** R2 (prompts, rubric); design §5 "The eval tree". Enables AC1.

**Acceptance.** The three files exist with the exact paths and basenames above and are byte-identical to their sources.

---

### Task 4 — Copy all 11 scenarios and `_candidates.yaml`

**Goal.** Place the full scenario suite under `eval/scenarios/`.

**Files (created).** Under `eval/scenarios/`:
- The 11 scenario directories — `async-fetch`, `config-fetch`, `counter`, `derived-double`, `focus-trap-menu`, `fruit-list-each`, `independent-counters`, `minimal-scaffold`, `paginated-list`, `shared-state`, `toggle-visibility` — **each containing its `scenario.yaml` and `e2e.spec.mjs`** (and any other files the source scenario directory carries).
- `_candidates.yaml`.

**Changes.** Copy the entire `<scratch>/testing-project/eval/scenarios/` tree verbatim. **Do not edit the `scenario.yaml` `skills:` field here** — that is Task 6. `_candidates.yaml` (commented-out notes, incl. a harmless hardcoded local-path comment) is copied as-is. Scenario `name:` fields that differ from their directory names are left as copied (selection matches the directory name).

**Depends on.** Task 0, Task 1.

**Traces to.** R2 (all 11 scenarios + `_candidates.yaml`); design §5 "The eval tree". Enables AC1.

**Acceptance.** All 11 named directories exist under `eval/scenarios/`, each with a `scenario.yaml` and `e2e.spec.mjs`; `_candidates.yaml` exists; the files are byte-identical to their sources (before the Task 6 skill-selection edit).

---

### Task 5 — Copy the eval utils

**Goal.** Place the three eval utility files the e2e hook flow needs.

**Files (created).**
- `eval/utils/scaffold-plugin.ts`
- `eval/utils/verify-e2e.ts`
- `eval/utils/wp-cli.mjs`

**Changes.** Copy each verbatim from `<scratch>/testing-project/eval/utils/`. **Do not edit the type import in `verify-e2e.ts` here** — that is Task 7. `scaffold-plugin.ts` and `wp-cli.mjs` import nothing from Skillsmith and are taken fully as-is.

Note for downstream reasoning (no action here): `verify-e2e.ts` computes `PROJECT_ROOT` two levels up from `eval/utils/`, which lands on this repo's root unchanged; it writes a runtime `.wp-env.json` at that root (with `testsEnvironment: false`) and removes it in a `finally` block. This is why `@wordpress/env` must be `^11.4.0` (Task 8) and why `.wp-env.json` is gitignored at the root (Task 11).

**Depends on.** Task 0, Task 1.

**Traces to.** R2 (eval utils); design §5, §3.4. Enables AC1.

**Acceptance.** The three files exist under `eval/utils/` and are byte-identical to their sources (before the Task 7 import edit).

---

## Batch C — The three adaptations to the copied setup

> Design §6 fixes **exactly three** edits to the copied files. Each is its own task so the change set is auditable. These depend on the Batch B files existing.

### Task 6 — Adaptation 1: point every scenario at `wordpress-development`

**Goal.** Make the scenarios evaluate **this repo's** skill instead of the copied `wp-interactivity-api` skill (the only skill-selection coupling).

**Files (edited).** All 11 `eval/scenarios/*/scenario.yaml` files.

**Changes.** In each `scenario.yaml`, change the `skills:` list from `[wp-interactivity-api]` to `[wordpress-development]`. The loader's `skillId` is the **directory name** under `paths.skills`; `skills: [wordpress-development]` names this repo's skill directory `skills/wordpress-development/`. **No other field changes** — `rubrics:` (referencing `wp-interactivity-api-best-practices`) and `name:` stay as copied.

**Depends on.** Task 4.

**Traces to.** R3 (scenarios evaluate `wordpress-development`); design §6 item 1. Satisfies AC2.

**Acceptance.** Every one of the 11 `scenario.yaml` files lists `skills: [wordpress-development]`; none lists `wp-interactivity-api` under `skills:`. (A grep for `wp-interactivity-api` may still match `rubrics:` entries — that is expected and correct.)

---

### Task 7 — Adaptations 2 & 3: scope the type import and the tsconfig `extends`

**Goal.** Make the copied TypeScript resolve against the scoped git install.

**Files (edited).**
- `eval/utils/verify-e2e.ts`
- `tsconfig.json`

**Changes.**
1. In `verify-e2e.ts`, change the type import source from `"skillsmith"` (the unscoped name, which only resolved under the testing-project's `file:..` alias) to `"@automattic/skillsmith"`. (`skillsmith.config.ts` already imports the scoped name; `scaffold-plugin.ts` and `wp-cli.mjs` import nothing from Skillsmith — leave them.)
2. In `tsconfig.json`, change the `extends` target from `"../tsconfig.json"` (a dangling reference once the file lands at this repo's root) to `"@automattic/skillsmith/tsconfig.json"`. The git install ships the Skillsmith root tsconfig (no `files` field, so the whole repo is packed), and TypeScript resolves a package-relative `extends` from `node_modules`. **Leave the rest of `tsconfig.json` verbatim** (`compilerOptions.types: ["node"]` and `include: ["skillsmith.config.ts", "playwright.config.ts"]`).

**Depends on.** Task 5 (for `verify-e2e.ts`), Task 2 (for `tsconfig.json`).

**Traces to.** Design §6 items 2 & 3. Enables AC1 (correct resolution) and keeps the config honest under `tsc`/editors.

**Acceptance.** `verify-e2e.ts` imports its Skillsmith types from `"@automattic/skillsmith"` and contains no `from "skillsmith"`. `tsconfig.json`'s `extends` is `"@automattic/skillsmith/tsconfig.json"`; its `compilerOptions.types` and `include` are unchanged.

---

## Batch D — Skill content merge

### Task 8 — Populate the Interactivity API reference content from the testing-project skill

**Goal.** Supersede the 3-line placeholder `references/interactivity-api.md` with the testing-project `wp-interactivity-api` skill content, keeping the router's single-entry-point structure (R5) and matching the substance of the source skill (R6). This includes the **mandatory link rewrite** so the loader reaches every reference.

**Files.**
- `skills/wordpress-development/SKILL.md` — **unchanged** (router kept as-is; it already links `references/interactivity-api.md`). Listed here only to state explicitly that it is not edited.
- `skills/wordpress-development/references/interactivity-api.md` — **overwritten** (was the 3-line stub).
- `skills/wordpress-development/references/interactivity-api/directives.md` — created.
- `skills/wordpress-development/references/interactivity-api/store.md` — created.
- `skills/wordpress-development/references/interactivity-api/server-rendering.md` — created.
- `skills/wordpress-development/references/interactivity-api/client-navigation.md` — created.
- `skills/wordpress-development/references/interactivity-api/typescript.md` — created.

**Changes.**
1. **Entry doc.** Replace the contents of `references/interactivity-api.md` with the **body** of `<scratch>/testing-project/skills/wp-interactivity-api/SKILL.md` — i.e. everything **below** its YAML frontmatter (drop the `---`…`---` frontmatter block; the router keeps its own frontmatter).
2. **Five references.** Copy the five files from `<scratch>/testing-project/skills/wp-interactivity-api/references/` **verbatim** into the new `references/interactivity-api/` subfolder: `directives.md`, `store.md`, `server-rendering.md`, `client-navigation.md`, `typescript.md`. **Do not edit these five** — they contain zero markdown links (their cross-mentions are inside backtick code spans, which the loader never follows), and they read naturally as sibling basenames.
3. **Link rewrite — exactly one place (the entry doc).** In the new `references/interactivity-api.md`, rewrite the **9 occurrences** of links of the form `[references/X.md](references/X.md)` to `[interactivity-api/X.md](interactivity-api/X.md)`, for the five reference basenames (`directives`, `store`, `server-rendering`, `client-navigation`, `typescript`). Concretely: both the link **text** and the link **target** lose the `references/` prefix and gain the `interactivity-api/` prefix, so that — resolved against the entry doc's own directory `references/` — each target lands on `references/interactivity-api/X.md`. The source has the 9 occurrences spread across the closing "References (load on demand)" section (five links) and four mid-body inline links (`store.md` ×3, `client-navigation.md` ×1). **This is the only link rewrite in the entire skill.** Make no other edits to the entry-doc prose.

**Depends on.** Task 0. (Independent of the eval-tree tasks.)

**Traces to.** R5 (single-entry structure preserved), R6 (content populated from the `wp-interactivity-api` skill); design §7.1–§7.3. Satisfies AC6.

**Acceptance.**
- `SKILL.md` is unchanged and still links `references/interactivity-api.md`.
- `references/interactivity-api.md` carries the testing-project SKILL.md body with **no YAML frontmatter** and contains **no** `](references/` link targets (all rewritten to `](interactivity-api/`).
- The five files exist under `references/interactivity-api/` and are byte-identical to their sources.
- The blob-verification in Task 9 passes (the real gate that the rewrite is correct).

---

## Batch E — Manifest and supporting files

> These can proceed in parallel with Batches B–D where noted; the install/verification in Batch F depends on all of them.

### Task 9 — Update `package.json`

**Goal.** Make `package.json` reflect the Skillsmith setup: add the pinned git dependency and the scripts/deps the e2e flow needs; drop the bespoke harness's scripts and unused SDKs.

**Files (edited).** `package.json`.

**Changes.** Apply design §8 exactly:

- **Keep:** `name`, `version`, `private`, `type: "module"`, and `postinstall: "npx playwright install chromium"`.
- **Drop scripts:** `eval`, `eval:format`, `eval:llm`, `eval:e2e`.
- **Add scripts:**
  - `"skillsmith": "skillsmith"`
  - `"test:e2e": "playwright test"`
  - `"env:start": "wp-env start"`
  - `"env:stop": "wp-env stop"`
- **Drop dependencies:** `@anthropic-ai/sdk`, `@google/generative-ai`, `openai`, `yaml`. (After this, the `dependencies` object is empty — remove the now-empty `dependencies` key, or leave it as `{}`; prefer removing it.)
- **devDependencies after the change:**
  - `"@automattic/skillsmith": "github:Automattic/skillsmith#6bd90c34d88b815fdf4fd661dc8c51288111444c"` — new.
  - `"@playwright/test": "^1.59.1"` — bumped from `^1.40.0` to match the testing-project.
  - `"@wordpress/env": "^11.4.0"` — **bumped** from `^10.0.0`. Required, not optional: `verify-e2e.ts` writes a `.wp-env.json` with root key `testsEnvironment: false`, which is an 11.x addition; under `^10.0.0`, `wp-env start` hard-fails validation before WordPress boots, breaking the AC1 e2e step.
  - `"@wordpress/e2e-test-utils-playwright": "^1.44.0"` — new; required by `global-setup.mjs`.
  - `"@wordpress/scripts": "^32.2.0"` — new; required by the plugin-build step (`wp-scripts build`).

**Depends on.** Nothing structurally, but the values must match design §8. (Can run in parallel with Batches B–D.)

**Traces to.** R10 (package.json reflects new setup), R1 (Skillsmith consumed via the pinned git dependency); design §4, §8. Satisfies AC3 (partial — `eval*` scripts and unused SDK deps gone), enables AC1.

**Acceptance.**
- No `eval`, `eval:format`, `eval:llm`, `eval:e2e` scripts remain; the four new scripts are present.
- No `@anthropic-ai/sdk`, `@google/generative-ai`, `openai`, or top-level `yaml` dependency remains.
- `devDependencies` contains the five entries above with the exact ranges/SHA.
- `postinstall` is retained.

---

### Task 10 — Rewrite `.env.example`

**Goal.** Describe the variables a Skillsmith run needs, with no references to the old harness or its config file.

**Files (edited/overwritten).** `.env.example`.

**Changes.** Replace the contents per design §9.3. It documents:
- A header noting that Skillsmith **auto-loads `.env` from the invocation directory** (Node's `process.loadEnvFile`, no dotenv) and that **shell environment variables take precedence** over `.env`.
- `ANTHROPIC_API_KEY` — for the `anthropic-api` provider; also the fallback auth for the default `claude-code` agents when no Claude Code login exists.
- `OPENAI_API_KEY` — for the `openai-api` and `codex` providers.
- `GOOGLE_GENERATIVE_AI_API_KEY` — for the `gemini-api` provider.
- A note that the **default config uses only `claude-code`-provider agents**, so a logged-in Claude Code install needs no keys at all.

Remove the old keys' framing entirely: no `GEMINI_API_KEY` (the old name), no pointer to `eval/eval.config.yaml`.

**Depends on.** Nothing. (Can run in parallel.)

**Traces to.** R11; design §9.3. Satisfies AC7 (partial — `.env.example`).

**Acceptance.** `.env.example` documents the three keys above (note: `GOOGLE_GENERATIVE_AI_API_KEY`, not `GEMINI_API_KEY`), carries the auto-load/precedence and claude-code-default notes, and contains no reference to `eval/eval.config.yaml` or the removed harness.

---

### Task 11 — Update `.gitignore`

**Goal.** Drop the obsolete eval-cache block and add the Skillsmith/e2e generated-output entries.

**Files (edited).** `.gitignore`.

**Changes.** Per design §9.2:
- **Remove** the old eval block: `eval/wp-env/plugins/`, `eval/wp-env/.wp-env.json`, `eval/.cache/` (and its comment header).
- **Add** the Skillsmith/e2e entries (ported from the Skillsmith root `.gitignore`'s testing-project block): `.skillsmith/`, `test-results/`, `playwright-report/`, `.auth/`, `artifacts/`, and `.wp-env.json` (a **bare path at the repo root**, since `verify-e2e.ts` writes it there at runtime).
- **Keep** all existing generic entries: `.DS_Store`, `dist/`, `node_modules/`, the `*-debug.log*` lines, the `.env` / `.env.*` / `!.env.example` block, and `.rp.local.md`.

**Depends on.** Nothing. (Can run in parallel.)

**Traces to.** R11 (supporting files reflect new setup); design §9.2.

**Acceptance.** `.gitignore` no longer references any `eval/` path; it includes `.skillsmith/`, `test-results/`, `playwright-report/`, `.auth/`, `artifacts/`, and a root `.wp-env.json` entry; the generic entries and `.rp.local.md` are retained.

---

### Task 12 — Rewrite `README.md`

**Goal.** Describe the repo as it now is — a single `wordpress-development` skill plus Skillsmith-based local evals — with no references to the removed harness, workflows, or skillpack flow, and carrying the R12 agent cap.

**Files (overwritten).** `README.md`.

**Changes.** Per design §9.4, write a README covering:
- A pointer to the skill structure (single-entry `skills/wordpress-development/SKILL.md` routing to topic references).
- **Prerequisites:** Node ≥ 20.17, Docker (for wp-env), and `npm install` (which runs the Playwright-Chromium `postinstall`).
- An **env-setup pointer** to `.env.example`.
- **How to run:** a **single scenario** with `npx skillsmith <scenario-dir>` (equivalently `npm run skillsmith -- <scenario-dir>`) versus the **full matrix** with `npm run skillsmith`; note where reports land (`.skillsmith/<runId>/`).
- **The agent cap (R12):** agents must **never** run the full matrix; **at most one scenario against one testing agent**; full runs are the **owner's manual step**.

It must contain **no** references to the removed harness, the removed workflows, or the skillpack flow / `docs/local-development.md`.

**Depends on.** Nothing. (Can run in parallel.)

**Traces to.** R11, R12 (README cap); design §9.4. Satisfies AC7 (partial — `README.md`).

**Acceptance.** `README.md` describes the skill + Skillsmith setup, lists the prerequisites, documents the single-scenario vs full-matrix commands and report location, states the R12 cap, and references neither the old harness nor the skillpack flow nor the removed workflows.

---

### Task 13 — Add the R12 "Running evals" rule to `.rp.md`

**Goal.** Record the agent-run cap in the conventions file agents read at workflow start (there is no repo `CLAUDE.md`/`AGENTS.md`), alongside the README note.

**Files (edited).** `.rp.md`.

**Changes.** Per design §9.5, add a short **"Running evals"** section carrying the same cap: agents must never run Skillsmith over the full configuration; agent-driven verification is limited to **at most one scenario against one testing agent** (`npx skillsmith <one-scenario-dir>`); the full `scenarios × testing-agents` matrix is the **owner's manual step** after setup, not an agent task. Keep the rest of `.rp.md` untouched.

**Depends on.** Nothing. (Can run in parallel.)

**Traces to.** R12; design §9.5.

**Acceptance.** `.rp.md` contains a "Running evals" rule stating the one-scenario / one-testing-agent cap and that the full matrix is the owner's manual step. No other section of `.rp.md` is altered.

---

## Batch F — Install, static verification, and the capped smoke run

> This batch depends on **all** prior tasks: the copied + adapted eval tree (Batches B–C), the merged skill (Batch D), and the manifest/supporting files (Batch E). It performs the only commands that touch the network/Docker.

### Task 14 — Install dependencies and regenerate the lockfile

**Goal.** Install the pinned Skillsmith git dependency and the bumped/new devDependencies, regenerating `package-lock.json`, and run the retained Playwright-Chromium postinstall.

**Files.** `package-lock.json` — **regenerated** (not hand-edited, not copied). `node_modules/` is created (gitignored).

**Changes.**
1. From the repo root, run `npm install`. This resolves `@automattic/skillsmith` from `github:Automattic/skillsmith#6bd90c3…` (no auth needed — public repo; the package has no build step, so the git-dependency `prepare`-only caveat is moot), installs the bumped `@wordpress/env ^11.4.0`, `@playwright/test ^1.59.1`, and the new `@wordpress/e2e-test-utils-playwright`, `@wordpress/scripts`, and triggers the `postinstall` (`npx playwright install chromium`).
2. Confirm the install landed: `node_modules/@automattic/skillsmith/` exists with `src/` and `bin/` present, and the `.bin/skillsmith` symlink resolves (`npx skillsmith --help` or equivalent prints usage **without running an eval**).

**Depends on.** Task 9 (package.json). In practice run **after** all of Batches B–E so the lockfile reflects the final manifest, but the hard dependency is Task 9.

**Traces to.** R1 (consume Skillsmith), R10; design §4, §8, §11. Enables AC1.

**Acceptance.** `npm install` completes; `package-lock.json` is regenerated and pins `@automattic/skillsmith` to the SHA `6bd90c3…`; `node_modules/@automattic/skillsmith` is present with `src/` and `bin/`; invoking the `skillsmith` bin's usage/help (no scenario) succeeds. **No eval run is performed in this task** (R12).

---

### Task 15 — Static blob verification (mandatory; R12-safe, no eval run)

**Goal.** Guard against the silent-broken-link footgun: confirm the assembled skill blob actually reaches the entry doc and all five references after the Task 8 merge + link rewrite. This is the **only** guard that a typo did not silently drop a reference from the agent's prompt.

**Files.** A throwaway verification script (e.g. `/tmp/verify-blob.mjs`) — **not committed**. No repo files change.

**Changes.**
1. Statically invoke Skillsmith's skill loader against the merged skill — **a static Node call, not an eval run** (R12-safe). Concretely, import `loadSkill` from the installed package and call it for `skillId = "wordpress-development"` with the skills root `skills/`:
   ```js
   import { loadSkill } from "@automattic/skillsmith"; // or the loader's actual export path
   const blob = await loadSkill("wordpress-development", "skills");
   ```
   If `loadSkill` is not re-exported from the package root, import it from its module path inside the installed package (the design references `src/scenarios/skill-loader.ts`); the code-writer resolves the exact import against the installed `node_modules/@automattic/skillsmith`. Use `tsx` to run the script if the loader is TypeScript-only.
2. **Assert** the blob **contains the `=== … ===` section headers for the entry doc and all five references** reached from `SKILL.md`:
   - `=== wordpress-development/references/interactivity-api.md ===`
   - `=== wordpress-development/references/interactivity-api/directives.md ===`
   - `=== wordpress-development/references/interactivity-api/store.md ===`
   - `=== wordpress-development/references/interactivity-api/server-rendering.md ===`
   - `=== wordpress-development/references/interactivity-api/client-navigation.md ===`
   - `=== wordpress-development/references/interactivity-api/typescript.md ===`

   (Match the header **format** the installed loader emits; the six reachable documents must all appear. The blob also carries a header for the root `SKILL.md` itself, so the total is seven `=== … ===` sections — this is a **presence check** for the six reachable docs, **not** an exact count of six.)
3. If any of the six is missing, the link rewrite (Task 8) is wrong — **fix Task 8's entry-doc links and re-run** until all six headers are present. Do **not** proceed to Task 16 until this passes.

**Depends on.** Task 8 (skill merge), Task 14 (package installed so the loader is importable).

**Traces to.** Design §3.5 (silent broken links), §7.4 (mandatory blob-verification). Hard gate for AC6.

**Acceptance.** The static `loadSkill` call returns a blob containing all six headers above (entry doc + five references). The verification script is **not** committed. **No Skillsmith eval/CLI run is performed** (R12).

---

### Task 16 — Capped AC1 smoke run (1 scenario × 1 testing agent)

**Goal.** Demonstrate the AC1 end-to-end smoke run within the R12 cap: a single scenario against the single configured testing agent, completing the wp-env/Playwright e2e validation and producing Skillsmith's per-agent, per-scenario, and run-level reports.

**Files.** Run outputs under `.skillsmith/<runId>/` (gitignored). At runtime, `verify-e2e.ts` writes and then removes a root `.wp-env.json`. No committed repo files change.

**Changes.**
1. **Prerequisites for the run** (environment, not repo edits): Docker running (for wp-env), Claude Agent SDK auth available (a Claude Code login, or `ANTHROPIC_API_KEY` fallback — both configured agents use the `claude-code` provider), and Playwright Chromium installed (from Task 14's postinstall).
2. Run **exactly one scenario** against the single testing agent:
   ```
   npx skillsmith <one-scenario-dir>
   ```
   Pick one scenario directory name from `eval/scenarios/` (e.g. `counter` or `minimal-scaffold`). **The positional argument is mandatory** — it restricts the run to one scenario; the copied config's `roles.test.agents = ["haiku"]` restricts to one testing agent; the `opus` judge is a separate role and does not count against the cap. **NEVER run the bare `npx skillsmith` / `npm run skillsmith` with no scenario** (that is the full matrix — forbidden by R12).
3. Confirm the run **completes end-to-end** — including the wp-env start → `wp-scripts build` → Playwright e2e → wp-env stop flow — and that it writes the report levels AC1 requires under `.skillsmith/<runId>/`:
   - per-agent: `iteration-N/<scenario>/<agent>/report.json`
   - per-scenario: `iteration-N/<scenario>/report.json`
   - run-level: `report.json` + `run.json` + `summary.txt`
   - Playwright JSON: `iteration-N/tests-report.json`
4. Confirm (AC2) that the run evaluated `skills/wordpress-development` — every `scenario.yaml` now lists `skills: [wordpress-development]`, so the run's config/outputs reflect that skill.

**The scenario is NOT required to pass** — AC1 only requires the run to complete and produce reports. If the smoke run cannot complete because Docker or Agent-SDK auth is unavailable in the execution environment, the code-writer must **report that the AC1 run is environment-gated** (not silently skip it) and confirm everything up to the run is in place; it must **not** attempt the full matrix as a workaround.

**Depends on.** All prior tasks — specifically Task 14 (install), Task 15 (blob verified), and the full copied+adapted eval tree and merged skill.

**Traces to.** AC1 (smoke run completes, produces reports), AC2 (skill under eval), R12 (cap respected); design §3.2, §3.4, §10. This is the pipeline's automated acceptance run; the full matrix is the owner's manual step and is **not** performed here.

**Acceptance.** `npx skillsmith <one-scenario-dir>` (single scenario, single testing agent) completes end-to-end including the wp-env/Playwright e2e validation and writes the per-agent, per-scenario, and run-level reports under `.skillsmith/<runId>/`; the run's skill under evaluation is `skills/wordpress-development`. The scenario need not pass. No full-matrix run is performed. (If environment-gated, the gating is reported explicitly with everything-up-to-the-run confirmed in place.)

---

## Batch G — Final tree audit

### Task 17 — Whole-tree acceptance sweep

**Goal.** Verify the repo as a whole satisfies every acceptance criterion before the phase closes — a read-only audit, no eval run.

**Files.** None changed (audit only).

**Changes.** Run tree searches / file checks and confirm:

- **AC3.** No bespoke-harness remnants: no `eval/lib/`, `eval/harness/`, `run-eval.mjs`, `eval.config.yaml`, old `counter-block`/`toggle-visibility` *bespoke* scenario folders, `eval*` npm scripts, or unused LLM SDK deps (`@anthropic-ai/sdk`, `@google/generative-ai`, `openai`, top-level `yaml`). (The copied `eval/scenarios/toggle-visibility/` from Batch B is the new, valid scenario — not a remnant.)
- **AC4.** `find .github -type f` lists none of `eval-gate.yml`, `run-evals.yml`, `skill-improver.*`, `upstream-sync.*` — in fact `.github/` has no files.
- **AC5.** `shared/scripts/skillpack-build.mjs`, `shared/scripts/skillpack-install.mjs`, and `docs/local-development.md` are gone (and `shared/`, `docs/` are gone).
- **AC6.** `skills/wordpress-development/SKILL.md` still presents the single-entry-point structure with topic references; its Interactivity API content matches the substance of the testing-project's `wp-interactivity-api` skill (entry body + five reference topics). (Already hard-gated by Task 15's blob check.)
- **AC7.** `.env.example` and `README.md` describe only the Skillsmith setup and reference neither the removed harness, the removed workflows, nor the skillpack flow.
- **R12 propagation.** Both `README.md` and `.rp.md` carry the one-scenario / one-testing-agent cap.

**Depends on.** All prior tasks.

**Traces to.** AC3–AC7, R12; design §12 (traceability). Final acceptance gate.

**Acceptance.** Every check above passes. Any failure is fixed in the owning task and re-audited. **No Skillsmith run is performed in this task** (R12).

---

## Dependency summary

```
Task 0 (fetch source) ─┬─> Task 2 ─┐
                       ├─> Task 3   ├─ (Batch B copy)
                       ├─> Task 4 ──┼──> Task 6 (adapt skill-selection)
                       ├─> Task 5 ──┤
                       └─> Task 8 (skill merge)
Task 1 (delete) ───────┘ (must precede Batch B refill of eval/)

Task 2 + Task 5 ──> Task 7 (adapt import + tsconfig)

Task 9 (package.json) ──> Task 14 (npm install) ──> Task 15 (blob verify, needs Task 8)
                                                  └─> Task 16 (capped smoke run, needs all)

Task 10, 11, 12, 13 (supporting files) ── independent, parallel-safe

Everything ──> Task 17 (final audit)
```

Recommended execution order for code-writers: **0 → 1 → (2,3,4,5 parallel) → (6,7,8 parallel) → (9,10,11,12,13 parallel) → 14 → 15 → 16 → 17.**

## Requirement → task coverage

| Spec item | Task(s) |
| --- | --- |
| R1 (consume Skillsmith) | 9, 14 |
| R2 (copy config/prompts/rubric/scenarios/utils) | 2, 3, 4, 5 |
| R3 (scenarios evaluate `wordpress-development`) | 6 |
| R4 (self-improvement dormant) | 2 (config copied with `mode: test-only`) |
| R5 (single-entry skill structure) | 8 |
| R6 (Interactivity API content from `wp-interactivity-api`) | 8 |
| R7 (delete bespoke `eval/`) | 1 |
| R8 (remove workflows) | 1 |
| R9 (remove skillpack `shared/`, `docs/`) | 1 |
| R10 (package.json reflects new setup) | 9 |
| R11 (`.env.example`, README, supporting files) | 10, 11, 12 |
| R12 (agent run cap) | embedded in every task; recorded in 12 (README) & 13 (.rp.md); enforced in 15, 16, 17 |
| AC1 | 16 |
| AC2 | 6, 16 |
| AC3 | 1, 9, 17 |
| AC4 | 1, 17 |
| AC5 | 1, 17 |
| AC6 | 8, 15, 17 |
| AC7 | 10, 12, 17 |
