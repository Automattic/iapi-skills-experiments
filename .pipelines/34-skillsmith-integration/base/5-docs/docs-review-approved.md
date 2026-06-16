# Docs batch review — APPROVED

**Phase:** 5 (Docs)
**Batch:** D1–D4 (full doc plan)
**Base ref:** `37754de6601e82eee4ba3209e594535d053a01f4`
**Code-phase approval commit:** `b16cf98`
**Doc-phase diff reviewed:** one commit, `a799da0` (D1's README refinement). D2, D3, D4 reported "no change needed"; their claims were verified against the shipped files, not just the diff.

The documentation batch is approved. Every doc task satisfies its acceptance in full, the single refinement introduced no factual drift, and the three "no change needed" claims are honest (the relevant files are byte-identical to the code-phase state). The R12 guardrail was honored throughout — this review was reading and static inspection only; no Skillsmith run was performed.

## D1 — README front-door doc (commit `a799da0`)

**Verdict: satisfied.**

- The refinement (`a799da0`) is a pure documentation tightening: it collapses the R12 cap into one quotable sentence ("Agents must never run the full eval matrix; an agent runs at most one scenario against one testing agent, and the full matrix is the owner's manual step.") and clarifies that the no-argument `npm run skillsmith` form triggers the full matrix. The diff touches only the "Agent cap (R12)" section; no functional fact (script name, key name, version floor) was altered.
- **Command form is correct — the flagged concern is clean.** The README uses the bare scenario-directory-name form everywhere: `npx skillsmith <scenario-dir>`, the worked example `npx skillsmith counter`, and `npx skillsmith <one-scenario-dir>` in the cap. No path form (e.g. `eval/scenarios/counter`) appears. This was verified against the installed package: the CLI passes positionals straight through (`bin/skillsmith.mjs`), and the runner's `filterScenarios` (`src/pipeline/pipeline.ts:448`) matches each positional against a `Map` keyed by `dirName` — the bare directory entry name — throwing "Unknown scenario" for anything else. A path form would be rejected; the bare form is the only valid one, and that is what the README documents. The example scenario `counter` exists under `eval/scenarios/counter/`.
- **Skill-structure description matches the shipped router.** README §"Skill structure" describes the single-entry-point layout with `SKILL.md` routing to topic references, the Interactivity API entry doc, and five sub-references — matching the shipped `SKILL.md` (REFERENCES section links `references/interactivity-api.md`) and the on-disk `references/interactivity-api/` tree (five files present).
- **Prerequisites match the shipped `package.json`.** Node ≥ 20.17 (Skillsmith's engine floor), Docker (for `@wordpress/env`), and `npm install` running the Playwright-Chromium `postinstall` — the `postinstall: npx playwright install chromium` script is present in the shipped `package.json`.
- **Run commands match shipped scripts and design §3.4.** Single-scenario `npx skillsmith <scenario-dir>` / `npm run skillsmith -- <scenario-dir>` vs full matrix `npm run skillsmith`; the `skillsmith` script exists in `package.json`. Report location `.skillsmith/<runId>/` and the per-agent / per-scenario / run-level / Playwright report paths match design §3.4.
- **R12 cap stated as a clear guardrail** with all three clauses.
- **Negative check clean:** grep for `eval/lib`, `run-eval`, `eval.config`, `eval-gate`, `run-evals`, `skill-improver`, `upstream-sync`, `skillpack`, `local-development` found nothing in `README.md`.

Satisfies AC7 (README half), spec R11 + R12, design §9.4.

## D2 — `.env.example` (no change)

**Verdict: claim verified, satisfied.**

- `.env.example` is byte-identical to the code-phase state (zero diff `b16cf98..HEAD`), so the "no change needed" claim is honest.
- Content matches design §3.3 / §9.3 and the installed package's provider sources:
  - Header note: Skillsmith auto-loads `.env` via Node's `process.loadEnvFile` (no dotenv) and shell env vars take precedence — present.
  - `ANTHROPIC_API_KEY` documented for the `anthropic-api` provider and as fallback auth for `claude-code` agents.
  - `OPENAI_API_KEY` for the `openai-api` and `codex` providers.
  - `GOOGLE_GENERATIVE_AI_API_KEY` — correct variable name (not the old `GEMINI_API_KEY`).
  - "Default config uses only claude-code-provider agents; a logged-in install needs no keys" note present.
- Negative check clean: no `eval/eval.config.yaml`, removed-harness, or old `GEMINI_API_KEY` references.

Satisfies AC7 (.env.example half), spec R11, design §3.3 / §9.3.

## D3 — `.rp.md` "Running evals" note (no change)

**Verdict: claim verified, satisfied.**

- `.rp.md` is byte-identical to the code-phase state (zero diff `b16cf98..HEAD`), so both the "no change needed" claim and the "no other section altered" claim hold — confirmed by an empty `git diff` over the whole file.
- The "Running evals" section states all three required clauses: never the full configuration; at most one scenario against one testing agent with the `npx skillsmith <one-scenario-dir>` form; full `scenarios × testing-agents` matrix is the owner's manual step.
- **Cap wording is consistent with the README's (D1 soft-coordination requirement met).** Both surfaces state the identical three-clause rule; an agent reading either home gets the same rule.

Satisfies spec R12 (agent-guidance home), design §9.5.

## D4 — Skill router + Interactivity API entry-doc coherence (no change)

**Verdict: claim verified by reading, satisfied.**

- The doc phase touched zero skill files (empty `git diff b16cf98..HEAD -- skills/`), so the read-only constraint and "5 reference files verbatim" claim hold.
- **Router intact:** `SKILL.md` presents the single-entry-point structure with a REFERENCES section linking `references/interactivity-api.md`; frontmatter (`name: wordpress-development` + description) and link target unchanged.
- **Entry doc coherent:** `references/interactivity-api.md` reads as a self-contained Interactivity API reference. All five markdown link targets point into `interactivity-api/` (`directives.md`, `store.md`, `server-rendering.md`, `client-navigation.md`, `typescript.md`) and resolve — from the entry doc's own directory — to the five files that exist under `references/interactivity-api/`.
- **Same-doc anchor resolves:** the in-page link `[Derived state — per-instance pattern](#derived-state--per-instance-pattern)` (line 18) targets the heading `## Derived state — per-instance pattern` (line 114), whose GitHub slug matches.
- Per the task constraint, the merge and blob check were NOT re-run (those are code Tasks 8/15); this was a read-through only.

Satisfies AC6 coherence (hard gate remains code Task 15's blob check), spec R5 / R6, design §7.

## Guardrail compliance

No Skillsmith run was performed at any point in this review. The pre-existing smoke-run evidence under `.skillsmith/20260612-192332/` is present and was not needed. Review was reading + static inspection of the installed package source only.
