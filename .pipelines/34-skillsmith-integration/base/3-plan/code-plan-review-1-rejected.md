# Code Plan Review — Iteration 1: Rejected

Reviewed artifact: `3-plan/code-plan.md`, against `1-spec/spec.md` (R1–R12, AC1–AC7) and `2-design-doc/design-doc.md`.

**Verdict: rejected**, on one verified blocking defect (B1) plus two required minor fixes (M1, M2). Everything else in the plan was checked and found sound — the rejection is narrow and the fixes are small. No re-planning of structure, batching, or task decomposition is needed.

## Review method

Static review only, per the R12 guardrail. No Skillsmith eval/CLI run was performed at any point. Verification used:

- A read of the pipeline worktree to confirm every premise about the current repo state (deletion targets, `package.json`, `.gitignore`, `.env.example`, `SKILL.md`, the placeholder reference, `.rp.md`).
- A clone of `Automattic/skillsmith` at the pinned SHA `6bd90c34d88b815fdf4fd661dc8c51288111444c` (in `/tmp`, outside the worktree) to confirm every claim about the testing-project source files.
- Sandboxed static experiments in `/tmp` (never in the repo): an `npm install` of the exact git dependency Task 14 specifies, `tsc --showConfig` with TypeScript 6.0.3 (the version Skillsmith itself pins), Node `import.meta.resolve` checks, and a static `loadSkill` call via `tsx` against the source skill — the same kind of static Node call Task 15 itself defines as R12-safe. No scenarios, no agents, no eval, no LLM calls.

## What was verified and found sound

- **Task 1 deletion set matches the actual tree exactly.** All listed paths exist; nothing under `.github/`, `shared/`, `docs/`, `eval/` is missed; after deletion `.github/` would indeed contain no files. `.gitattributes`'s only rule targets the removed lock files.
- **Task 0 / Batch B source claims are all true at the pinned SHA.** The SHA exists and is reachable without auth. `testing-project/` contains exactly the four root files, two prompts, the rubric, the three utils, `_candidates.yaml`, and the 11 named scenario directories, each with `scenario.yaml` + `e2e.spec.mjs` and nothing else.
- **The three adaptations are correctly scoped — two of three verified correct.** All 11 `scenario.yaml` files list `skills:` with the single entry `wp-interactivity-api` (Task 6's edit is the only skill-selection coupling). `verify-e2e.ts:11` is the only unscoped `from "skillsmith"` import, and both imported types (`RunScenario`, `VerificationFailure`) are exported from the package root, so the scoped rewrite resolves (the root specifier `@automattic/skillsmith` resolves under the git install — verified). `skillsmith.config.ts` already imports the scoped name; `scaffold-plugin.ts` and `wp-cli.mjs` import nothing from Skillsmith. The third adaptation is the blocking issue (B1).
- **Task 8's link arithmetic is exact.** The source `SKILL.md` contains exactly 9 occurrences of `[references/X.md](references/X.md)` (mid-body: `store.md` at lines 25, 207, 253 and `client-navigation.md` at line 254; plus the five closing-section links at lines 258–262). The five reference files contain zero markdown links. Link text equals link target in all 9, so the plan's rewrite form is right, and resolved from `references/interactivity-api.md` the rewritten targets land on `references/interactivity-api/X.md`, matching the loader's `resolve(dirname(file), href)` behavior.
- **Task 15's expected headers match the loader.** `loadSkill` emits `=== ${relative(skillsRoot, file)} ===` sections; a static run against the source skill produced exactly the expected `<skillId>/<relpath>` headers. The merged skill will produce 7 sections (router `SKILL.md` + entry doc + five refs), consistent with the plan's presence-check note.
- **Task 9's manifest values match the testing-project at the pinned SHA**: scripts (`skillsmith`, `test:e2e`, `env:start`, `env:stop`) and the exact devDependency ranges (`@playwright/test ^1.59.1`, `@wordpress/env ^11.4.0`, `@wordpress/e2e-test-utils-playwright ^1.44.0`, `@wordpress/scripts ^32.2.0`). The Skillsmith package's name is `@automattic/skillsmith`, so the scoped git dependency installs cleanly (verified by actually installing it).
- **Tasks 10–12 match their sources**: Skillsmith's own `.env.example` documents exactly the three keys with the auto-load/precedence framing; its root `.gitignore`'s testing-project block contains exactly the entries Task 11 ports; the bin's `process.loadEnvFile` behavior and the positional-scenario restriction were confirmed in `bin/skillsmith.mjs`.
- **The e2e wiring claims hold**: `verify-e2e.ts` computes `PROJECT_ROOT` two levels up, writes `.wp-env.json` with `testsEnvironment: false`, and shells out to `npm run env:start` / `test:e2e` / `env:stop`; `global-setup.mjs` requires `@wordpress/e2e-test-utils-playwright`; `playwright.config.ts` matches the design's description.
- **R12 propagation is thorough.** The cap is stated as a top-level guardrail, restated operationally in Tasks 14, 15, 16, and 17, recorded for the future in Task 12 (README) and Task 13 (`.rp.md`), and Task 16 mandates the positional argument and forbids the bare invocation, with an explicit environment-gated fallback that prohibits a full-matrix workaround.
- **Coverage and ordering are complete.** Every requirement R1–R12 and criterion AC1–AC7 maps to at least one task; the dependency graph is acyclic and correct (Batch B after Tasks 0 and 1; Task 6 after 4; Task 7 after 2 and 5; Task 15 after 8 and 14).

## Blocking issue

### B1. Task 7, adaptation 3: the planned `extends` target does not resolve — verified experimentally

The plan (following design §6 item 3) sets `tsconfig.json`'s `extends` to `"@automattic/skillsmith/tsconfig.json"`. This does not work. Skillsmith's `package.json` declares an `exports` map exposing only the root entry (`"exports": { ".": "./src/index.ts" }`), and TypeScript honors `exports` when resolving a bare-specifier `extends` from `node_modules`. Reproduced in a sandbox with the exact git dependency installed (the file `node_modules/@automattic/skillsmith/tsconfig.json` present on disk) and TypeScript 6.0.3:

```
tsconfig.json(2,13): error TS6053: File '@automattic/skillsmith/tsconfig.json' not found.
```

So the adapted config has the very failure mode design §6.3 introduces the adaptation to fix ("`tsc` and editors flag the file as broken and every inherited compiler option is silently dropped"). Worse, Task 7's acceptance is a literal string check, so the defect would ship silently: nothing in Task 7 or the Task 17 audit would catch it. (The AC1 smoke run is unaffected — `tsx`/Playwright do not type-check — which is exactly why only a resolution check can catch this.)

**Required fix (design-intent-preserving):**

1. In Task 7, change the `extends` target to the relative path `"./node_modules/@automattic/skillsmith/tsconfig.json"`. A relative `extends` is a plain file lookup that bypasses `exports`. Verified in the same sandbox: `tsc --showConfig` resolves the full inherited Skillsmith root config (strict mode, `module: esnext`, `moduleResolution: bundler`, etc.) with the local `types: ["node"]` overlay applied. This reaches the exact file the design intended, authors no new file, and changes only the specifier form; the plan should note this one deviation from the design's literal text and why.
2. Add a resolution check to the acceptance, runnable only after Task 14's install. Note that neither the repo's devDependencies nor Skillsmith's runtime dependencies install `tsc` (`@wordpress/scripts` compiles TS via Babel and does not depend on `typescript`), so the check needs a one-off TypeScript invocation, e.g. `npx -p typescript tsc --showConfig` exiting 0 — placed in Task 14's confirmation or Task 17's audit. (Do not use bare `npx tsc` when typescript is absent — npx would fetch the unrelated `tsc` stub package.)

## Required minor fixes

### M1. Task 15's import snippet cannot work in either form it suggests

Both forms the task offers fail, verified against the installed package:

- `import { loadSkill } from "@automattic/skillsmith"` — `loadSkill` is **not** exported from `src/index.ts` (its export list carries `defineConfig`, `run`, `DEFAULT_PATHS`, and types only).
- A bare subpath such as `@automattic/skillsmith/src/scenarios/skill-loader.ts` — blocked by the same `exports` encapsulation as B1: `ERR_PACKAGE_PATH_NOT_EXPORTED` (verified with `import.meta.resolve`).

The hedge ("the code-writer resolves the exact import") does cover this, but the snippet should not point at two dead ends. **Fix:** state the working form, which I verified end-to-end in the sandbox: a relative **file-path** import, run under `tsx` (file-path imports bypass `exports`):

```js
import { loadSkill } from "./node_modules/@automattic/skillsmith/src/scenarios/skill-loader.ts";
const blob = loadSkill("wordpress-development", "skills");
```

Also note `loadSkill` is synchronous (returns `string`) — drop the `await` so the snippet is accurate. The six expected headers in the task are correct as written.

### M2. Task 17's AC3 sweep will trip over the copied `counter` scenario's `name: counter-block`

At the pinned SHA, `testing-project/eval/scenarios/counter/scenario.yaml` carries `name: counter-block` (the only scenario whose `name:` differs from its directory). The plan correctly copies it verbatim (Task 4) and correctly leaves `name:` fields untouched (design §6 "not changed"). But Task 17 instructs "tree searches" confirming no `counter-block` remnants — a raw grep **will** match the copied file post-Batch-B. The plan already carves out the analogous `toggle-visibility` collision but missed this one. The risk is a false audit failure, or worse, an auditor "fixing" the `name:` field and breaking the copy-verbatim rule.

**Fix:** in Task 17 (AC3 bullet), make the `counter-block`/`toggle-visibility` check a **directory-existence** check (no `eval/scenarios/counter-block/` directory, matching the spec's "scenario folders" wording) and add an explicit carve-out that `eval/scenarios/counter/scenario.yaml`'s `name: counter-block` field is copied content, expected, and must not be edited. Task 1's identical-sounding acceptance is fine as-is since it runs before Batch B copies anything.

## Non-blocking notes (no change required, but cheap to fold in)

- **Task 14's help check:** the bin's `parseArgs` is `strict: true` with no `--help` option, so `npx skillsmith --help` prints the usage string to stderr but **exits 1**. The acceptance should key off the usage output (or the `.bin/skillsmith` symlink resolving), not a zero exit code — and the task should keep its existing warning that a writer must never "try" the bare `npx skillsmith` instead, since that starts the full matrix.
- Task 9 keeps `version` although design §8's "kept" list omits it; keeping it is obviously right and needs no change.

## Conclusion

One verified blocking defect (B1) and two precision fixes (M1, M2). All three are local edits to Tasks 7, 15, and 17; no structural change to the plan is needed. With these applied the plan is approvable.
