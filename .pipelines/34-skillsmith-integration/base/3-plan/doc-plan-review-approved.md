# Doc Plan Review — APPROVED

**Artifact reviewed:** `3-plan/doc-plan.md`
**Reviewed against:** `1-spec/spec.md` (R1–R12 / AC1–AC7), `2-design-doc/design-doc.md`, `3-plan/code-plan.md`
**Verdict:** APPROVED (first iteration)
**Guardrail (spec R12):** honoured — static review only; no Skillsmith run was performed, and the plan correctly propagates the R12 cap into the documentation it plans.

---

## Summary

The doc plan defines four documentation tasks (D1 README, D2 `.env.example`, D3 `.rp.md` eval cap, D4 skill-prose coherence) that between them own exactly the documentation-bearing surface of this change — and nothing the code phase already owns functionally. Every task block is self-contained, traces to a spec requirement and a design section, names the correct upstream code task, and carries an explicit, testable acceptance list. The plan is drift-resistant: it instructs every doc-writer to read the shipped file first and confine edits to documentation quality, leaving functional facts (script names, key names, version floors, link targets) as the code phase shipped them unless demonstrably wrong against the design. The R12 cap is propagated into both documentation homes the design names (README + `.rp.md`) with a consistency requirement between them, and the plan's own guardrail forbids running Skillsmith for doc verification while still requiring the cap be documented as a string.

I verified the plan's load-bearing claims against the live repo and the upstream artifacts; all hold.

## What I checked and confirmed

**Code-task references are accurate.** Every code task the doc plan cites maps to the code plan exactly:
- Task 8 = skill content merge (entry doc + five refs + link rewrite).
- Task 10 = rewrite `.env.example`.
- Task 12 = rewrite `README.md`.
- Task 13 = add `.rp.md` "Running evals" rule.
- Task 14 = `npm install` (so script/dep facts are final).
- Task 15 = static blob verification (the AC6 hard gate).
D1/D2/D3/D4 `Depends on` lines name the right tasks, and the "this doc plan does not re-author from scratch" framing correctly reflects that code Tasks 10/12/13 land first-draft prose for the smoke run and audit to check.

**Factual consistency with the design (no drift).**
- Node floor `≥ 20.17` (design §11/§3) — matches.
- Report path `.skillsmith/<runId>/` (design §3.4) — matches.
- Single-scenario `npx skillsmith <scenario-dir>` (≡ `npm run skillsmith -- <scenario-dir>`) vs full-matrix `npm run skillsmith` (design §9.4) — matches verbatim, including the deliberate treatment that the README documents the full-matrix command while flagging it as the owner's-only manual step.
- `.env.example` key set: `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `GOOGLE_GENERATIVE_AI_API_KEY` (not the old `GEMINI_API_KEY`), plus the auto-load/shell-precedence header and the "claude-code default needs no keys" note (design §3.3/§9.3) — matches, and D2 explicitly guards against reintroducing `GEMINI_API_KEY` / the `eval/eval.config.yaml` framing.
- `skillsmith` script name (design §8) — D1 requires confirming it exists in the shipped `package.json` rather than asserting it.

**Live-repo premises hold.** The current `README.md` is a 2-line stub, `.env.example` still carries the old `GEMINI_API_KEY` + `eval/eval.config.yaml` framing, `.rp.md` has no "Running evals" section, `SKILL.md` is the single-entry router linking `references/interactivity-api.md`, and there is no `CLAUDE.md`/`AGENTS.md` — so D3's claim that `.rp.md` is the agent-guidance home is correct.

**Coverage is correctly scoped.** The requirement→doc-task table claims only the prose-documentation requirements (R5, R6, R11, R12) and their criteria (AC6, AC7). It correctly omits R1–R4, R7–R10 and AC1–AC5 — those are code/structural concerns with no documentation deliverable, and claiming them would be overreach. AC6's coherence is owned by D4 while its hard gate stays code Task 15's blob check — stated explicitly, not blurred.

**R12 propagation is genuine, not a footnote.** A dedicated GUARDRAIL section binds every task; D1 and D3 each state the full cap (never the full matrix; at most one scenario × one testing agent; full matrix is the owner's manual step) with a cross-task consistency requirement; and the plan forbids any doc task from running Skillsmith to "check" documentation, treating the capped command as a string to document rather than execute.

**Drift-resistance against the silent-broken-link footgun.** D4 is correctly read-only on the entry doc and the five reference files: their link targets are functional and blob-gated by code Task 15, so D4 routes any suspected broken link back to the code phase as a finding rather than silently editing it — which would bypass the code-phase guard. The only prose edit D4 permits is a minimal clarity refinement of the router's read-when line, leaving frontmatter and link target untouched.

## Minor observations (non-blocking, no rework required)

These are noted for the doc-writers' awareness; none rises to a rejection and none requires a plan edit:

1. **D1 documents the full-matrix command in a user-facing README.** The plan inherits this directly from design §9.4, which deliberately documents `npm run skillsmith` (full matrix) for the human owner while flagging that agents must never run it. This is the design's settled intent, not a contradiction of R12 (R12 caps *agents*, not the human owner). The plan's acceptance for D1 keeps the guardrail framing attached, so the surface cannot read as inviting an agent to run the full matrix. No change needed.

2. **D4's coherence check is necessarily soft.** AC6's real gate is code Task 15's blob check; D4 only confirms the prose "reads coherently." The plan states this division explicitly, so there is no risk of D4 being mistaken for the hard gate. Acceptable as scoped.

These observations do not affect the verdict.

## Conclusion

The doc plan is complete (covers every documentation-bearing requirement and no more), drift-resistant (verify-the-shipped-file-first discipline, functional facts left to the code phase, broken links routed back rather than silently edited), and fully aligned with the approved spec, design, and code plan. The R12 cap is correctly propagated into both documentation homes. **Approved.**
