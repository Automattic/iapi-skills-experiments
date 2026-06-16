# Design Doc Review 1 — Rejected

Reviewer: design-doc-reviewer. Reviewed artifact: `2-design-doc/design-doc.md` against the approved spec (`1-spec/spec.md`), with `2-design-doc/design-doc-research.md` as supporting evidence.

Verification method: static review only (per spec R12 — Skillsmith was never run). I read this repo's working tree and cloned `Automattic/skillsmith` read-only at the design's pinned SHA (`6bd90c34d88b815fdf4fd661dc8c51288111444c`, confirmed to be trunk HEAD with no tags), inspected its source (`bin/skillsmith.mjs`, `src/config/defaults.ts`, `src/scenarios/skill-loader.ts`, `src/scenarios/enumerate.ts`, `src/pipeline/testing-agent.ts`, `src/pipeline/judge-agent.ts`, `src/providers/claude-code.ts`, `src/reports/*`, `.env.example`, `.gitignore`, the full `testing-project/` tree), and ran two isolated tool-behavior experiments in `/tmp` (tsx and Playwright against a tsconfig with a broken `extends`; npm-pack inspection of `@wordpress/env` 10.39.0 and 11.8.0 config parsers). None of these executed Skillsmith.

## Verdict

**Rejected.** The design is thorough and almost entirely accurate — the overwhelming majority of its factual claims about the repo, the Skillsmith package, the CLI, the skill loader, the e2e wiring, the report outputs, and the testing-project contents were independently verified and hold. However, two concrete defects must be fixed, the first of which makes the AC1 smoke run infeasible as designed.

## Blocking finding 1: `@wordpress/env ^10.0.0` is incompatible with the copied e2e flow (breaks AC1)

Design doc section 8 specifies the devDependencies after the change as: `@automattic/skillsmith` (new), `@playwright/test` — "already present", `@wordpress/env` — "already present", plus two new `@wordpress/*` packages. "Already present" means the repo's existing range `@wordpress/env: ^10.0.0` is retained (caret semantics keep it on 10.x; the latest 10.x is 10.39.0). The research record made the same call (Topic 3: "@playwright/test, @wordpress/env (both already present)") even though Topic 1 had recorded the testing-project's actual range, `^11.4.0`.

This fails against the copied e2e utility. `testing-project/eval/utils/verify-e2e.ts` (copied verbatim under the design) writes a `.wp-env.json` at the repo root containing:

```json
{
  "plugins": [...],
  "port": 8987,
  "testsEnvironment": false,
  "lifecycleScripts": { "afterStart": "npx wp-env run cli wp plugin deactivate --all" }
}
```

`@wordpress/env` validates `.wp-env.json` keys strictly and throws on anything unknown. In 10.39.0 (`lib/config/parse-config.js`), the root-only keys accepted beyond `DEFAULT_ENVIRONMENT_CONFIG` are exactly `testsPort`, `lifecycleScripts`, and `env`; `testsEnvironment` is not a config option anywhere in 10.x (it appears only as an internal runtime property), so config parsing throws:

```
ValidationError: Invalid .wp-env.json: "testsEnvironment" is not a configuration option.
```

In 11.8.0 the same file explicitly parses `testsEnvironment` as a root-only boolean option (`parse-config.js` lines 398–404 and the `case 'testsEnvironment':` arm in the root-only switch). The option is an 11.x addition; the testing-project's `^11.4.0` is not incidental.

Consequence: with `^10.0.0`, `npm run env:start` (invoked by `runE2eVerification` inside the `afterAllScenarios` hook) hard-fails before WordPress ever boots. Playwright never runs, no `tests-report.json` is produced, and the hook throws. AC1 requires the smoke run to "complete end-to-end — including the wp-env/Playwright e2e validation — producing Skillsmith's per-agent, per-scenario, and run-level reports"; that cannot happen as designed.

**Required fix:** section 8 must bump `@wordpress/env` to an 11.x range (the testing-project's `^11.4.0` is the natural choice, keeping the dependency set coherent with the copied setup at the pinned SHA).

## Blocking finding 2: the copied `tsconfig.json` carries a dangling `extends: "../tsconfig.json"` — contradicting the "only two edits" claim

The testing-project's `tsconfig.json` is:

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": { "types": ["node"] },
  "include": ["skillsmith.config.ts", "playwright.config.ts"]
}
```

`../tsconfig.json` is the Skillsmith repo root tsconfig (strict mode, `module: ESNext`, `moduleResolution: Bundler`, etc.). It resolves only because the testing-project lives inside the Skillsmith repo. Copied verbatim to this repo's root — as design sections 5–6 prescribe ("Everything in the copied eval setup is taken verbatim except two changes. These are the only edits to the copied files.") — the `extends` target points at the directory above this repository, where no tsconfig exists.

Verified impact (isolated experiments, no Skillsmith involved):

- **tsx** runs TypeScript fine under a tsconfig whose `extends` target is missing (exit 0), so the smoke run itself is not broken by this.
- **Playwright** likewise loads a TS config and lists tests without error.
- But `tsc` against the file fails immediately, editors flag the tsconfig as broken, and — more subtly — every inherited compiler option (strict mode and friends) is silently dropped for `skillsmith.config.ts` and `playwright.config.ts`, so the file no longer does what it appears to do.

This is not a runtime blocker, but it is a factual defect in the design's central "exactly two adaptations" contract (section 6), which the code plan will inherit as an authoritative claim. The shipped repo would contain a config file with a dangling reference out of the box.

**Required fix:** the design must acknowledge a third adaptation for `tsconfig.json` and specify it. Reasonable options: replace the `extends` with `"@automattic/skillsmith/tsconfig.json"` (the git install ships the root tsconfig — the package has no `files` field — and TypeScript resolves package-relative `extends` from `node_modules`), or inline the handful of needed compilerOptions. Either works; the design should pick one and renumber the "two adaptations" claim accordingly.

## Non-blocking observations (address alongside the fixes)

1. **Section 8 gives no version ranges for the new devDependencies.** For coherence with the copied setup at the pinned SHA, specify the testing-project's ranges: `@wordpress/e2e-test-utils-playwright ^1.44.0`, `@wordpress/scripts ^32.2.0`. (`@playwright/test ^1.40.0` is fine as-is — caret resolves to the latest 1.x on lockfile regeneration — though refreshing to the testing-project's `^1.59.1` would not hurt.)
2. **Section 7.1 undercounts the mid-body links.** It says "Two mid-body inline links to `references/store.md` and `references/client-navigation.md` also exist"; the testing-project SKILL.md actually has four mid-body links (`store.md` at lines 25, 207, 253; `client-navigation.md` at line 254) plus the five in the closing references section. The operative total — 9 occurrences to rewrite (section 7.3) — is correct, so this is purely descriptive; fix the sentence so the plan writer is not confused by the mismatch.
3. **Section 7.4's "six section headers" wording is ambiguous.** The assembled blob will contain seven `=== … ===` sections (the root `SKILL.md` plus the entry doc plus the five refs). The intended check — that the six reached documents all appear — is right, but if a code-writer implements "assert exactly six headers" it will fail. Phrase the verification as "the blob contains the headers for the entry doc and all five references" (presence check, not an exact count).

## Spot-checked and confirmed accurate (no action needed)

For the writer's confidence, the following design claims were independently verified against the pinned Skillsmith source and this repo and are correct: the package shape (no build step, raw-TS exports, tsx-based bin, dependency list, Node ≥ 20.17); `npm install github:Automattic/skillsmith` viability reasoning; the pinned SHA being trunk HEAD with no tags; the bin's `.env` loading via `process.loadEnvFile` and its flag set; the config surface and defaults (`skills/`, `eval/scenarios`, `eval/rubrics`, `.skillsmith`) matching this repo so no `paths` override is needed; the testing-project config contents (agents `haiku`/`opus`, `roles.test.agents = ["haiku"]`, dormant `selfImprovement`, the two hooks, prompt loading); all 11 `scenario.yaml` files listing `skills: [wp-interactivity-api]` and rubric basename `wp-interactivity-api-best-practices`; the `verify-e2e.ts` unscoped `"skillsmith"` type import (and that `RunScenario`/`VerificationFailure` are exported from the scoped package, so the planned one-line fix works); `scaffold-plugin.ts`/`wp-cli.mjs` importing nothing from Skillsmith; the skill loader's link-driven BFS, dirname-relative resolution, silent skipping of broken links, and skillId-as-directory-name semantics; the judge never seeing the skill and the improver loading it only in self-improvement mode; the report output levels AC1 requires; the skill content inventory (262-line SKILL.md, the five refs at 203/159/242/277/146 lines, exactly 9 rewritable link occurrences, zero markdown links inside the refs, the four backtick-only cross-mentions); the current-repo inventory in section 2 (including the gh-aw orphans, the `.gitattributes` single rule, and the absence of hidden coupling); and the router `SKILL.md`'s existing loader-followable link to `references/interactivity-api.md`.

## Resolution path

Both blocking fixes are narrow: a one-line version bump in section 8 plus a specified third adaptation for `tsconfig.json` (and the corresponding correction to section 6's "only two edits" framing). With those and the three wording touch-ups, this design is approvable.
