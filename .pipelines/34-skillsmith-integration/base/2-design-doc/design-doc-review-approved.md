# Design Doc Review — Approved

Reviewer: design-doc-reviewer. Reviewed artifact: `2-design-doc/design-doc.md` at commit `0716d70` (revision after review 1, `design-doc-review-1-rejected.md`), against the approved spec (`1-spec/spec.md`).

Verification method: static review only (per spec R12 — Skillsmith was never run). Review 1 had independently verified the full body of the design's claims against this repo's working tree and a read-only clone of `Automattic/skillsmith` at the pinned SHA (`6bd90c34d88b815fdf4fd661dc8c51288111444c`). This second pass reviewed the revision diff (`adb27e7..0716d70`) and re-verified the new factual claims it introduced, including npm-pack inspection of `@wordpress/env` 11.0.0 and 11.4.0 config parsers.

## Verdict

**Approved.**

## Disposition of review-1 findings

Both blocking findings and all three non-blocking observations from review 1 are correctly resolved:

1. **`@wordpress/env` bump (was blocking).** Section 8 now specifies `@wordpress/env ^11.4.0`, replacing the repo's `^10.0.0`, with a full and accurate rationale: the copied `verify-e2e.ts` writes a `.wp-env.json` carrying `testsEnvironment: false`, wp-env validates config keys strictly and throws on unknown keys, and `testsEnvironment` is an 11.x-only option — so under 10.x `npm run env:start` would hard-fail inside the `afterAllScenarios` hook and the AC1 smoke run could not complete. Verified: `testsEnvironment` is parsed as a root-only boolean in 11.4.0 (and absent from every 10.x parser, per review 1). The fix restores AC1 feasibility.
2. **`tsconfig.json` third adaptation (was blocking).** Section 6 is now "The three adaptations", with adaptation 3 changing the copied tsconfig's `extends` from the dangling `"../tsconfig.json"` to `"@automattic/skillsmith/tsconfig.json"`, and section 5 flags the adaptation at the copy list. The mechanism is sound and was verified in review 1's evidence: the git install packs the Skillsmith root `tsconfig.json` (the package has no `files` field and its `.gitignore` does not exclude the file), and TypeScript resolves package-relative `extends` targets from `node_modules`. The "only edits to the copied files" claim is now consistent with reality, and no stale "two adaptations" references remain anywhere in the doc (the traceability entry "sections 6 (item 1)" still points at the correct adaptation).
3. **Dependency ranges (was non-blocking).** Section 8 now pins the testing-project's ranges: `@playwright/test ^1.59.1`, `@wordpress/e2e-test-utils-playwright ^1.44.0`, `@wordpress/scripts ^32.2.0`.
4. **Mid-body link count (was non-blocking).** Section 7.1 now correctly describes four mid-body links with their line numbers, reconciling with the 9-occurrence rewrite total in 7.3.
5. **Blob-verification wording (was non-blocking).** Section 7.4 now specifies a presence check — the headers for the entry doc and all five references must appear — and explicitly notes the blob holds seven sections in total (including the root `SKILL.md`), preventing an "exactly six" mis-implementation.

## Residual nits (explicitly non-blocking; no revision required)

These are recorded so downstream phases are not confused; neither affects any decision or implementation step:

- Section 8's parenthetical calls `^11.4.0` "the floor at which `testsEnvironment` is accepted". Verified against npm: the option is already parsed in 11.0.0, so the true floor is the 11.0 major boundary. The chosen range is still the right one — it is the testing-project's range at the pinned SHA, which is the stated and sufficient justification — the parenthetical is just slightly overspecific.
- Section 6's opening sentence says "Everything in the copied **eval tree** is taken verbatim except three changes", but adaptation 3 targets `tsconfig.json`, a root-level file outside the eval tree. The section title ("the copied eval setup") and the explicit three-item list make the meaning unambiguous.

## Conclusion

With the revision, every claim in the design doc that this review checked — covering the repo inventory, the Skillsmith package and CLI behavior, the skill-loader semantics, the e2e wiring and its version requirements, the report outputs, the testing-project contents, the three adaptations, the skill content merge and its link rewrites, the cleanup set, and the AC traceability — is accurate and evidence-backed, and the design satisfies the spec's requirements R1–R12 and acceptance criteria AC1–AC7 within its stated scope. The design doc is approved as the basis for phase 3 planning.
