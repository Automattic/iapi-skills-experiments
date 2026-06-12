# Code Plan Review — Iteration 2: Approved

Reviewed artifact: `3-plan/code-plan.md` as revised in commit `ad2896b` ("Revise code plan per review 1"), against `1-spec/spec.md` (R1–R12, AC1–AC7), `2-design-doc/design-doc.md`, and the iteration-1 rejection (`code-plan-review-1-rejected.md`).

**Verdict: approved.**

## Scope of this re-review

The revision is exactly three hunks confined to Tasks 7, 15, and 17 — the three items the rejection required — with no other changes to the plan. Everything outside those hunks is byte-identical to the iteration-1 text, which was already verified exhaustively against the live worktree and a clone of `Automattic/skillsmith` at the pinned SHA `6bd90c34d88b815fdf4fd661dc8c51288111444c` (deletion set, copy lists, the three adaptations' scoping, the 9-link rewrite arithmetic, loader header format, dependency ranges, env/gitignore/README contents, R12 propagation, dependency graph, and the full requirement/criterion coverage table). That verification stands; this review checks the three fixes.

## Fix verification

### B1 (blocking) — Task 7 tsconfig `extends`: fixed correctly

- The `extends` target is now the relative path `"./node_modules/@automattic/skillsmith/tsconfig.json"` — the exact form I verified in the iteration-1 sandbox, where `tsc --showConfig` resolves the full inherited Skillsmith root config (strict mode, `module: esnext`, `moduleResolution: bundler`) with the local `types: ["node"]` overlay applied.
- The deviation from design §6 item 3's literal bare-specifier form is documented in place, with the accurate root cause (Skillsmith's `exports` map exposes only `"."`; TypeScript honors `exports` for bare-specifier `extends`, yielding `TS6053`) and the accurate intent-preservation argument (same target file, no new file authored, only the specifier form changes).
- The acceptance now includes the mandated resolution check: a one-off `npx -p typescript tsc --showConfig` exiting 0, correctly gated to after Task 14's install, correctly warned against bare `npx tsc` (which would fetch the unrelated `tsc` stub package, since neither the repo's devDependencies nor Skillsmith's runtime dependencies install TypeScript), and with sensible flexibility to run the check from Task 14's confirmation or Task 17's audit. The rationale — that the string check alone would let a non-resolving `extends` ship silently — is stated, so the check cannot be dropped as optional.

### M1 — Task 15 `loadSkill` import snippet: fixed correctly

The snippet is now the verified working form — a relative file-path import of `./node_modules/@automattic/skillsmith/src/scenarios/skill-loader.ts` run under `tsx` — with both dead ends explained accurately (`loadSkill` is not re-exported from `src/index.ts`; bare subpaths are blocked by the `exports` encapsulation with `ERR_PACKAGE_PATH_NOT_EXPORTED`). The `await` is dropped and the call correctly treated as synchronous. The six expected `=== … ===` headers and the seven-section presence-check note are unchanged and remain correct against the loader's `relative(skillsRoot, file)` header format.

### M2 — Task 17 AC3 `counter-block` carve-out: fixed correctly

The AC3 bullet now checks the old bespoke scenario folders **by directory existence** (no `eval/scenarios/counter-block/` directory; `eval/scenarios/toggle-visibility/` byte-matches the testing-project source), matching the spec's "scenario folders" wording, and carries an explicit carve-out: the copied `eval/scenarios/counter/scenario.yaml`'s `name: counter-block` field is expected copied content that must not be edited (consistent with Task 4's copy-verbatim rule and design §6's "name fields left as copied"). This removes both failure modes flagged in iteration 1 — the false audit failure and the risk of an auditor "fixing" the field. Task 1's similar-sounding acceptance is correctly left unchanged, since it runs before Batch B copies anything.

## Residual notes (non-blocking, carried from iteration 1)

- Task 14's bin check: `npx skillsmith --help` prints the usage string but exits 1 (the bin's `parseArgs` is strict with no `--help` option). The task's "or equivalent prints usage without running an eval" wording gives the code-writer the latitude to key off the usage output rather than the exit code; the task's existing prohibition on bare `npx skillsmith` covers the dangerous alternative. No change required.
- Task 7's acceptance is partially deferred to post-install by construction; the plan addresses this explicitly and it is the pragmatic choice given task ordering.

## R12 compliance

The guardrail is intact and propagated: the top-level cap section binds every task; Tasks 14, 15, and 17 perform no eval run; Task 16 mandates the single-scenario positional argument against the single configured testing agent and forbids the bare full-matrix invocation, with an explicit environment-gated reporting path instead of any workaround. This re-review itself performed no Skillsmith run; the fixes were checked against the diff and the iteration-1 sandbox evidence.

## Conclusion

All three required fixes are applied faithfully and match the experimentally verified forms. The plan is complete, feasible, aligned with the spec and design (with the one documented, intent-preserving deviation), and ready for the code phase.
