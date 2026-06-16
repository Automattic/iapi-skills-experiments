# Doc Plan: Integrate the repo with Skillsmith and clean up what's now obsolete

This plan defines the documentation work for the Skillsmith-integration change. It draws on the approved spec (`1-spec/spec.md`, R1–R12 / AC1–AC7), the approved design (`2-design-doc/design-doc.md`), and the approved code plan (`3-plan/code-plan.md`). Every doc task below traces to a spec requirement and a design section, and is scoped so the documentation matches **what the code phase actually ships** — not what was imagined.

## How this plan relates to the code plan

The code plan already assigns the *creation* of three prose-bearing files to code-writers:

- **Task 10** writes `.env.example`.
- **Task 12** writes `README.md`.
- **Task 13** adds the "Running evals" rule to `.rp.md`.

That code-phase authoring lands first-draft content so the smoke run (code Task 16) and audit (code Task 17) have something to check. **This doc plan does not re-author those files from scratch and does not duplicate the code-writer's mechanical edits.** Instead, each doc task here takes the shipped file as its starting point and owns its **documentation quality**: accuracy against the code that actually landed, completeness for the stated audience, coherence of the prose, and correct propagation of the R12 cap. Where the code-phase draft is already correct and complete, the doc task's job is to **verify and, only where needed, refine** — not to rewrite for its own sake. A doc task that finds the shipped file already fully correct records that and makes no change; it must never regress a correct file.

Concretely: the code phase guarantees these files *exist and pass the audit*; the doc phase guarantees they *read well, are accurate to the shipped behaviour, and serve their reader*. The two phases touch overlapping files but own different properties, so a doc-writer must read the file as it exists post-code-phase before editing, and confine edits to documentation concerns (clarity, completeness, accuracy, audience fit), leaving functional content (script names, key names, dependency facts) exactly as the code phase shipped it unless it is demonstrably wrong against the design.

## How to read this plan

- Each task block is dispatched **verbatim** to a fresh doc-writer with no other context, so every block is self-contained and carries: **Goal / Audience / Files / Sections-scope / Depends on / Traces to / Acceptance**.
- "Repo root" means the pipeline worktree root: `/Users/santosguillamot/Desktop/Code/wordpress-skill-experiments/.claude/worktrees/34-skillsmith-integration`. All repo paths are relative to that root. Never touch the main repository checkout.
- All doc tasks run **after the code phase has completed and committed**, so the files they document already exist in their shipped form. Read the live file first; do not assume its contents from this plan.

## GUARDRAIL — R12 token cap (binds every task)

**Never run Skillsmith over the full configuration, and never run Skillsmith at all to "check" documentation.** A full `scenarios × testing-agents` matrix consumes too many tokens. No doc task needs to run an eval: documentation is verified by reading files and, at most, by reading the already-produced run outputs under `.skillsmith/<runId>/` if a prior code task left them. If any doc task is tempted to run Skillsmith to confirm a documented command, it must **not run the full matrix** — the only permissible run anywhere in this project is a single scenario directory against the single configured testing agent (`npx skillsmith <one-scenario-dir>`), and even that is the owner's / code-phase concern, not a documentation step. Doc tasks should treat the capped command as a *string to document correctly*, copied from the design (§10) and the shipped README, not as something to execute. When any doc task documents how to run evals, it must state the cap explicitly: agents must never run the full configuration; at most one scenario against one testing agent; the full matrix is the owner's manual step.

---

## Task D1 — Verify and refine `README.md` as the repo's front-door doc

**Goal.** Ensure the repository's `README.md` accurately and completely describes the repo as it now is — a single `wordpress-development` skill plus Skillsmith-based local evals — for someone arriving at the repo for the first time. The code phase (Task 12) has already written a first-draft README per design §9.4; this task takes that shipped file and verifies it against the design and the *actually shipped* manifest, refining only where it is inaccurate, incomplete, or unclear. It must carry the R12 cap as a genuine guardrail, not a footnote.

**Audience.** A developer (human or agent) cloning the repo for the first time who needs to understand what the repo contains, how to set it up, and how to run an eval — without prior knowledge of Skillsmith or the old harness.

**Files.** `README.md` (repo root). Read it as the code phase left it before editing.

**Sections-scope.** The whole README. It must cover, and the doc-writer must confirm each against the shipped repo:
- **What the repo is** — a pointer to the single-entry skill structure: `skills/wordpress-development/SKILL.md` routes to topic-specific references read only when a task needs them. Confirm this matches the shipped `SKILL.md` router.
- **Prerequisites** — Node ≥ 20.17 (Skillsmith's engine requirement), Docker (for `@wordpress/env`), and `npm install` (which runs the Playwright-Chromium `postinstall`). Verify the Node floor and the `postinstall` against the shipped `package.json`.
- **Env setup** — a pointer to `.env.example` for the keys/auth a run needs.
- **How to run** — the single-scenario command `npx skillsmith <scenario-dir>` (equivalently `npm run skillsmith -- <scenario-dir>`) versus the full matrix `npm run skillsmith`; where reports land (`.skillsmith/<runId>/`). Confirm the script name `skillsmith` exists in the shipped `package.json` and that the report path matches design §3.4.
- **The R12 agent cap** — stated as a guardrail: agents must **never** run the full matrix; **at most one scenario against one testing agent**; full runs are the **owner's manual step**.

It must contain **no** references to the removed harness, the removed GitHub workflows, or the skillpack flow / `docs/local-development.md`.

**Depends on.** Code phase complete (specifically code Tasks 1, 9, 12, and the package install in Task 14 so script/dependency facts are final).

**Traces to.** Spec R11 (README describes only the new setup), R12 (README carries the agent cap); design §9.4. Satisfies AC7 (README half).

**Acceptance.**
- `README.md` describes the single `wordpress-development` skill and the Skillsmith-based local eval setup, and its skill-structure description matches the shipped `SKILL.md` router.
- It lists the prerequisites (Node ≥ 20.17, Docker, `npm install` with the Chromium postinstall) and they match the shipped `package.json`.
- It documents the single-scenario vs full-matrix commands using script/command names that exist in the shipped `package.json`, and states where reports land (`.skillsmith/<runId>/`).
- It states the R12 cap (never the full matrix; at most one scenario × one testing agent; full matrix is the owner's manual step) as a clear guardrail.
- It contains no reference to the old harness (`eval/lib`, `run-eval`, `eval.config.yaml`), the removed workflows (`eval-gate`, `run-evals`, `skill-improver`, `upstream-sync`), or the skillpack flow / `docs/local-development.md`.
- Any change made is a documentation refinement (accuracy/completeness/clarity); no functional fact (script name, key name, version floor) is altered away from what the shipped code supports. If the code-phase draft was already fully correct, no change is made and that is recorded in the task's commit/notes.

---

## Task D2 — Verify and refine the `.env.example` variable descriptions

**Goal.** Ensure `.env.example` correctly and completely describes the environment variables and auth model a Skillsmith run needs, so a reader configuring the repo knows exactly which keys matter and when. The code phase (Task 10) has already written a first-draft `.env.example` per design §9.3; this task takes that shipped file and verifies its descriptions against the design's auth model, refining wording only where it is inaccurate, incomplete, or unclear.

**Audience.** A developer setting up the repo who needs to know which API keys (if any) to configure before running an eval, and why a logged-in Claude Code install may need none.

**Files.** `.env.example` (repo root). Read it as the code phase left it before editing.

**Sections-scope.** The descriptive comments around each variable. It must convey, and the doc-writer must confirm against design §3.3 / §9.3:
- A **header note** that Skillsmith auto-loads `.env` from the invocation directory (Node's `process.loadEnvFile`, no dotenv) and that **shell environment variables take precedence** over `.env`.
- `ANTHROPIC_API_KEY` — for the `anthropic-api` provider; also the **fallback auth** for the default `claude-code` agents when no Claude Code login exists.
- `OPENAI_API_KEY` — for the `openai-api` and `codex` providers.
- `GOOGLE_GENERATIVE_AI_API_KEY` — for the `gemini-api` provider. (Confirm the variable name is `GOOGLE_GENERATIVE_AI_API_KEY`, **not** the old `GEMINI_API_KEY`.)
- A note that the **default config uses only `claude-code`-provider agents**, so a logged-in Claude Code install needs no keys at all.

It must contain **no** reference to `eval/eval.config.yaml` or the removed harness, and must not reintroduce the old `GEMINI_API_KEY` name or the old "configure provider in eval/eval.config.yaml" framing.

**Depends on.** Code phase complete (specifically code Task 10; and Task 14 so the design's provider/auth facts are validated against the installed Skillsmith).

**Traces to.** Spec R11 (.env.example describes the new setup); design §3.3, §9.3. Satisfies AC7 (.env.example half).

**Acceptance.**
- `.env.example` documents the three keys above with the variable name `GOOGLE_GENERATIVE_AI_API_KEY` (not `GEMINI_API_KEY`), each with an accurate "used by which provider" description.
- It carries the auto-load + shell-precedence header note and the "default config uses only claude-code agents, so a logged-in install needs no keys" note.
- It contains no reference to `eval/eval.config.yaml`, the removed harness, or the old key framing.
- Any change is a description refinement; the set of variables and their names match what the design specifies and the shipped config uses. If the code-phase draft was already fully correct, no change is made and that is recorded.

---

## Task D3 — Verify and refine the R12 "Running evals" agent-guidance note in `.rp.md`

**Goal.** Ensure the project conventions file `.rp.md` — which every agent reads at the start of any workflow — carries a clear, correct "Running evals" rule stating the R12 agent-run cap, so future agents working in this repo never run Skillsmith over the full configuration. The code phase (Task 13) has already added a first-draft "Running evals" section per design §9.5; this task takes the shipped `.rp.md` and verifies that the rule is present, correctly worded as a binding guardrail, and consistent with the same cap stated in the README, refining only where it is unclear, incomplete, or inconsistent. No other section of `.rp.md` may be altered.

**Audience.** An agent (pipeline agent or any future agent operating in this repo) reading `.rp.md` at workflow start, who must learn the eval-run cap before it considers running Skillsmith.

**Files.** `.rp.md` (repo root). Read it as the code phase left it before editing. Edits are confined to the "Running evals" section the code phase added; all other sections stay byte-identical.

**Sections-scope.** Only the "Running evals" section. It must state:
- Agents must **never** run Skillsmith over the full configuration (a full `scenarios × testing-agents` matrix consumes too many tokens).
- Agent-driven verification is limited to **at most one scenario against one testing agent** — i.e. always pass a single scenario-directory argument: `npx skillsmith <one-scenario-dir>`.
- The full `scenarios × testing-agents` matrix is the **owner's manual step** after setup lands, not an agent task.

The wording must be consistent with the same cap as documented in the README (Task D1), so an agent reading either surface gets the identical rule.

**Depends on.** Code phase complete (specifically code Task 13). Coordinate wording with Task D1 (README cap) for consistency.

**Traces to.** Spec R12 (agent run cap; recorded in the agent-guidance file); design §9.5. (Note: `.rp.md` is the repo's agent-guidance home — there is no `CLAUDE.md`/`AGENTS.md`.)

**Acceptance.**
- `.rp.md` contains a "Running evals" section stating the never-full-config rule, the one-scenario / one-testing-agent cap with the `npx skillsmith <one-scenario-dir>` form, and that the full matrix is the owner's manual step.
- The cap wording is consistent with the README's (Task D1).
- No section of `.rp.md` other than "Running evals" is altered.
- Any change is a clarity/consistency refinement; if the code-phase draft was already correct and consistent with the README, no change is made and that is recorded.

---

## Task D4 — Verify the skill router and Interactivity API entry-doc prose read coherently

**Goal.** Confirm that, after the skill content merge (code Task 8), the `wordpress-development` skill reads coherently from a documentation standpoint: the router `SKILL.md` still presents the single-entry-point structure and its reference link/read-when line make sense, and the merged Interactivity API entry doc (`references/interactivity-api.md`) reads as a self-contained reference whose internal links point at the five topic files. This is a **read-only documentation coherence check plus, only if needed, a minimal prose refinement of the router's read-when line** — it does **not** re-do the content merge, does not edit the five reference files, and does not touch the entry doc's link targets (those are functionally load-bearing and were set by code Task 8 and gated by the blob check in code Task 15).

**Audience.** A future contributor (human or agent) reading the skill to understand its structure, and — indirectly — the testing agent that receives the assembled skill blob as its system prompt.

**Files.**
- `skills/wordpress-development/SKILL.md` — read; refine **only** the router's reference read-when description line if it is unclear, otherwise leave unchanged. Do **not** change its frontmatter or its link target `references/interactivity-api.md`.
- `skills/wordpress-development/references/interactivity-api.md` — **read only** for coherence; do **not** edit (its prose is the testing-project SKILL.md body and its links were rewritten and blob-verified by code Tasks 8/15; changing them risks breaking the loader).
- The five files under `skills/wordpress-development/references/interactivity-api/` (`directives.md`, `store.md`, `server-rendering.md`, `client-navigation.md`, `typescript.md`) — **read only**; do **not** edit (copied verbatim, zero markdown links).

**Sections-scope.** The router's REFERENCES section read-when line (the only place a prose refinement is permitted, and only if it is genuinely unclear). Everything else is verification-only.

**Constraint — do not re-run the merge or the blob check.** The content merge and its mandatory blob-verification are code-phase concerns (code Tasks 8 and 15). This task does not re-perform them and does not run Skillsmith (R12). It is a documentation read-through: confirm the router still routes, the entry doc reads as a coherent standalone reference, and the structure matches AC6's "single-entry-point structure with topic references." If the doc-writer suspects a broken internal link in the entry doc, it must **report that as a finding** for the code phase to fix (since link targets are functional and blob-gated), not silently edit it.

**Depends on.** Code phase complete (specifically code Tasks 8 and 15 — the skill merged and the blob verified).

**Traces to.** Spec R5 (single-entry skill structure preserved), R6 (Interactivity API content populated from the `wp-interactivity-api` skill); design §7. Confirms AC6 reads coherently (AC6's hard gate remains code Task 15's blob check).

**Acceptance.**
- `SKILL.md` is confirmed to still present the single-entry-point structure with a REFERENCES section linking `references/interactivity-api.md`; its frontmatter and link target are unchanged.
- The entry doc `references/interactivity-api.md` is confirmed to read as a coherent standalone Interactivity API reference (the testing-project SKILL.md body) with its internal links pointing into `interactivity-api/`.
- The five reference files are confirmed present and unedited.
- Any edit made is limited to a minimal clarity refinement of the router's read-when line; no entry-doc or reference-file prose or link is changed. Suspected broken links are reported, not edited. If everything already reads coherently, no edit is made and that is recorded.
- No Skillsmith run is performed.

---

## Task ordering and dependencies

```
Code phase (all tasks, committed) ──> D1 (README)        ┐
                                  ──> D2 (.env.example)    ├─ independent of each other; D1 & D3 coordinate cap wording
                                  ──> D3 (.rp.md eval cap) ┘
                                  ──> D4 (skill prose coherence; read-only + minimal router refinement)
```

All four doc tasks depend on the code phase being complete and committed (so the files exist in shipped form). D1, D2, D3, and D4 are otherwise independent and may run in parallel, with one soft coordination: **D1 and D3 must state the R12 cap with consistent wording** (the README note and the `.rp.md` note are the two homes of the same rule per design §9.4/§9.5).

## Requirement → doc-task coverage

| Spec / design item | Doc task(s) |
| --- | --- |
| R5 (single-entry skill structure preserved) | D4 |
| R6 (Interactivity API content from `wp-interactivity-api`) | D4 |
| R11 (`.env.example` describes new setup) | D2 |
| R11 (README describes only new setup) | D1 |
| R12 (agent run cap — README home) | D1 |
| R12 (agent run cap — `.rp.md` agent-guidance home) | D3 |
| AC6 (skill structure + Interactivity API content reads coherently) | D4 (coherence; hard gate stays code Task 15) |
| AC7 (`.env.example` half) | D2 |
| AC7 (README half) | D1 |

## Out of scope (carried from spec §"Out of Scope" and the design)

The documentation work does **not**:

1. Author or curate documentation for a real scenario suite — the copied testing-project scenarios are the v1 starting point and are not documented per-scenario here.
2. Document how to make the scenario matrix pass or how to use Skillsmith's self-improvement mode (it stays dormant — spec R4).
3. Document any CI / PR-gate / scheduled-run flow — evaluation is local-only in v1.
4. Document replacements for the removed agentic workflows (`skill-improver`, `upstream-sync`).
5. Re-author from scratch the files the code phase already shipped (`.env.example`, `README.md`, `.rp.md`) or re-do the skill content merge — the doc phase verifies and refines the documentation quality of shipped surfaces, it does not duplicate code-phase authoring.
6. Run Skillsmith in any form (R12) — documentation is verified by reading, never by executing an eval.
