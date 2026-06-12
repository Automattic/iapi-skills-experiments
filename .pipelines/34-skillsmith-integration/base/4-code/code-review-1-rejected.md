# Code Review 1 — Rejected

Review of the full batch (Tasks 0–17) on branch `worktree-34-skillsmith-integration`, diffed against base `37754de6601e82eee4ba3209e594535d053a01f4`, judged against `1-spec/spec.md`, `2-design-doc/design-doc.md`, and `3-plan/code-plan.md`.

The batch is very close: every deletion, copy, adaptation, and supporting-file rewrite was verified against the pinned testing-project source and the plan, the static blob verification was independently re-run and passes, and the AC1 smoke-run evidence on disk is genuine and complete. One blocking defect remains, in the README.

## Blocking issues

### Issue 1 — README documents an eval command the CLI rejects (Task 12)

`README.md` documents the single-scenario run as a **path**:

- Line 26: `npx skillsmith eval/scenarios/<scenario-dir>`
- Line 28: `npm run skillsmith -- eval/scenarios/<scenario-dir>`
- Line 33 (the concrete example): `npx skillsmith eval/scenarios/counter`
- Line 59 (inside the R12 agent-cap section): `npx skillsmith eval/scenarios/<one-scenario-dir>`

Skillsmith's CLI does not accept this form. The positional argument is matched **exactly** against the bare scenario directory name: `filterScenarios` in the installed package (`node_modules/@automattic/skillsmith/src/pipeline/pipeline.ts`, lines 448–481) builds a map keyed by `dirName`, which `enumerateScenarios` (`src/scenarios/enumerate.ts`) sets to the raw `readdirSync` entry — e.g. `counter`. The only normalization applied to the argument is `trim()`; a value containing `eval/scenarios/` can never equal a directory entry, so the run aborts with `Unknown scenario: eval/scenarios/counter` before anything executes. Verified empirically against the installed pin: `npx skillsmith no-such-scenario-xyz` prints `Unknown scenario: …` followed by an `Available scenarios:` list of **bare names** (`counter`, `async-fetch`, …).

This matters beyond a cosmetic doc slip:

- AC1 is phrased around "the documented Skillsmith eval command" — the command the README documents does not run.
- The R12 agent-cap section (the text agents are meant to follow) carries the same broken form, so an agent obeying the README verbatim gets an error instead of a capped run.
- The plan's Task 12 ordered the design's form `npx skillsmith <scenario-dir>` (design §9.4, §10); the writer embellished it into `eval/scenarios/<scenario-dir>`, which is both a deviation from the plan's literal text and functionally wrong.

The smoke run itself was executed with the correct bare-name form (its evidence under `.skillsmith/20260612-192332/` is valid), so the defect is confined to the README text.

**Required fix (Task 12).** Replace the `eval/scenarios/` prefix in all four spots with the bare scenario directory name form, e.g. `npx skillsmith <scenario-dir>` / `npm run skillsmith -- <scenario-dir>` with the concrete example `npx skillsmith counter`. Keeping a parenthetical that scenario names are the directory names under `eval/scenarios/` would aid discoverability without reintroducing the path form.

**Re-dispatch:** Task 12.

## Adjudication of the surfaced deviations (no re-dispatch required)

### Deviation 1 — Task 6 rubrics leak and its revert: resolved, net state exactly per plan

Commit `2ef5326` overreached by renaming the `rubrics:` entries in all 11 `scenario.yaml` files; commit `22226c8` reverted them. I verified the **net state** by diffing every scenario file against the pinned testing-project source (`6bd90c3…`): each of the 11 `scenario.yaml` files differs **only** in the `skills:` line (`wp-interactivity-api` → `wordpress-development`); `rubrics:` (`wp-interactivity-api-best-practices`) and `name:` fields are byte-identical to source, including the expected `name: counter-block` in `eval/scenarios/counter/scenario.yaml` (the Task 17 carve-out, correctly left alone). Both fix-up commits touched only the 11 scenario files. The end state is exactly what the plan ordered. No action needed.

### Deviation 2 — Task 16's playwright.config.ts adaptation: accepted as a necessary integration fix

Commit `658cb50` replaced `playwright.config.ts`'s `import config from "./skillsmith.config"` with an agent list read from `SKILLSMITH_TESTING_AGENTS` (default `"haiku"`), and pinned `@wordpress/e2e-test-utils-playwright` to 1.44.0 in the lockfile.

**Necessity.** The import is genuinely broken in this repo even though it worked in the testing-project: importing `skillsmith.config.ts` pulls in `@automattic/skillsmith`, whose `exports` point at raw TypeScript (`./src/index.ts`), and Playwright's esbuild-based config loader does not transpile `.ts` files under `node_modules` (`ERR_UNKNOWN_FILE_EXTENSION`). The testing-project escaped this because its `file:..` install is a symlink whose real path lies outside `node_modules`; our git-SHA install is a real directory inside it. Without the fix, the Playwright config cannot load, the e2e hook produces no `tests-report.json`, and AC1's end-to-end requirement is unachievable. The design's "exactly three adaptations" framing was about keeping the copy auditable, not a license to ship a broken run; a fourth, forced adaptation is consistent with its intent. The smoke run (judge PASS, Playwright 2/2, all report levels written) confirms the fix works.

**Scope and correctness.** The change is confined to `playwright.config.ts` (the lockfile pin aside, the `package.json` hunk in `658cb50` is a pure alphabetical reorder — the `^1.44.0` range was already Task 9's plan-conformant value). The default `"haiku"` matches the shipped `roles.test.agents = ["haiku"]`, and a keep-in-sync comment is present.

**Residual drift risk (advisory, non-blocking).** `eval/utils/verify-e2e.ts` invokes `npm run test:e2e` (line 129) without setting `SKILLSMITH_TESTING_AGENTS`, so Playwright's project list always comes from the env default rather than the config. Scenario specs activate `plugin-<scenario>-<agentId>` per project, so if `roles.test.agents` is ever expanded (say to `["haiku", "opus"]`) without exporting the env var, the non-haiku agents' e2e specs simply never run and their failures are silently absent from the verification — Skillsmith would report those agents' e2e as clean. The sync comment also lives in `playwright.config.ts`, not in `skillsmith.config.ts` where such an edit would be made. This only materializes under future config changes that are out of scope for v1 (the suite and agent set are explicitly future work), and hardening it would require a further unplanned edit to the verbatim-copied `verify-e2e.ts` (e.g. deriving the agent list from the iteration directory walk and passing it via the spawn env). Recorded here as a recommended future improvement, not a re-dispatch.

### Lockfile-only pin of `@wordpress/e2e-test-utils-playwright` (advisory, non-blocking)

`package.json` keeps the plan's `^1.44.0` range while the lockfile resolves 1.44.0 at top level (with `@wordpress/scripts`' own nested 1.48.0 untouched). A fresh clone is safe — `npm install` honors the committed lockfile since 1.44.0 satisfies the range — so AC1's fresh-clone premise holds. But any lockfile regeneration or `npm update` re-resolves the caret to 1.48.x, whose raw-TS exports break `global-setup.mjs` again. The writer's choice (keep the plan's literal range, pin in the lockfile) is the minimal deviation and is accepted; tightening the range or adding a comment is left as a future consideration.

### Commit-format misses (process note)

`22226c8` and `658cb50` lack the required agent-name suffix in their commit messages. History is immutable mid-pipeline; noted for the record only.

## Verification performed (full batch)

- **Tasks 0–5 (source + deletions + copies).** Scratch clone confirmed at `6bd90c34d88b815fdf4fd661dc8c51288111444c`. `find .github -type f` returns nothing; `eval/` (old), `shared/`, `docs/`, `.gitattributes` gone. `skillsmith.config.ts` and `global-setup.mjs` byte-identical to source; prompts, rubric, all 11 scenarios plus `_candidates.yaml`, and `scaffold-plugin.ts`/`wp-cli.mjs` byte-identical.
- **Tasks 6–7 (adaptations).** Scenarios: only `skills:` changed (see Deviation 1). `verify-e2e.ts`: only the import line differs (`@automattic/skillsmith`). `tsconfig.json`: only `extends` differs, set to `./node_modules/@automattic/skillsmith/tsconfig.json` per the plan's documented deviation; `npx -y -p typescript tsc --showConfig` exits 0 and shows the inherited Skillsmith options (`module: esnext`, `moduleResolution: bundler`, strict) with the local `types: ["node"]` overlay.
- **Task 8 (skill merge).** `SKILL.md` router unchanged (zero diff against base) and still links `references/interactivity-api.md`. The five reference files are byte-identical to source. The entry doc equals the source `SKILL.md` body minus frontmatter, with exactly the 9 planned link rewrites (`references/X.md` → `interactivity-api/X.md`: 4 mid-body, 5 in the closing references section) and one dropped leading blank line (non-substantive).
- **Task 9 (package.json).** Exact match to the plan: four new scripts, no `eval*` scripts, no `dependencies` key, the five devDependencies with the exact ranges and git SHA, `postinstall` retained.
- **Tasks 10–13 (supporting files).** `.env.example`: three keys with correct names (`GOOGLE_GENERATIVE_AI_API_KEY`, not `GEMINI_API_KEY`), auto-load/precedence header, claude-code-default note, no old-harness references. `.gitignore`: old eval block gone, all six new entries present, generic entries and `.rp.local.md` retained. `README.md`: structure, prerequisites, env pointer, report locations, and R12 cap all present (but see Issue 1). `.rp.md`: "Running evals" section added, additions only.
- **Task 14 (install/lockfile).** Lockfile pins `@automattic/skillsmith` to the exact SHA; `npm ls --package-lock-only` resolves cleanly; working tree clean; no generated outputs (`.skillsmith/`, `.auth/`, `test-results/`, `node_modules/`, `.wp-env.json`) tracked.
- **Task 15 (blob verification).** Independently re-ran the static `loadSkill` check under `tsx` against the installed loader: all six expected `=== … ===` headers present, seven total sections, exactly as the design predicts. No eval run performed.
- **Task 16 (smoke run).** Evidence inspected on disk at `.skillsmith/20260612-192332/`: per-agent report (`iteration-1/counter-block/haiku/report.json`, judge rubric `wp-interactivity-api-best-practices` pass with notes), per-scenario and per-iteration reports, run-level `report.json` + `run.json` + `summary.txt` (scenario `counter-block`, agent `haiku`, PASS, 268,293 tokens), and `iteration-1/tests-report.json` (2 tests, 0 unexpected). AC2 confirmed via configuration: all 11 scenarios list `skills: [wordpress-development]`, and the run's successful skill load (validated by the blob check against `skills/wordpress-development/`) confirms that is the skill under evaluation.
- **Task 17 (tree audit).** Tracked-tree grep (excluding `.pipelines/` and the lockfile) finds no `run-eval`, `eval.config`, `skillpack`, `local-development`, or `GEMINI_API_KEY` references; no `eval/scenarios/counter-block/` directory, no `eval/lib/`/`eval/harness/`; AC4 and AC5 hold.
- **R12 compliance of this review.** No eval run was performed; the only Skillsmith invocation was an unknown-scenario probe that exits at argument validation.

## Verdict

**Rejected.** Tasks to re-dispatch: **Task 12** (fix the README's eval command forms as described in Issue 1). Everything else in the batch is verified and approved as-is, including the two adjudicated deviations.
