# Design Doc Review — APPROVED

**Artifact:** `2-design-doc/design-doc.md` (committed at 283bb9b)
**Reviewer:** design-doc-reviewer
**Verdict:** APPROVED

The design doc is sound, complete, and faithfully aligned with the approved spec.
Every load-bearing claim was verified against the real repository; all checks pass.

## What was verified (against the live tree)

### Soundness & completeness of the rename mechanic (Change 3)

- **Occurrence-level, not line-level.** Literal A
  (`skillsmith/testing-block`) measures **15 occurrences across 13 lines** — the
  two double-inline lines `independent-counters/e2e.spec.mjs:20` and
  `shared-state/e2e.spec.mjs:20` each carry the literal twice
  (`"<!-- wp:…/-->\n<!-- wp:…/-->"`), confirmed by inspecting the raw lines.
  `replace_all` covers both inline copies; a line-level "first match" edit would
  strand the second. Correct.
- **Order-independent (the crux).** Verified by direct substring test: old A is
  **not** a substring of old B and vice versa (slash-before-`testing-block` in A
  vs all-dashes `skillsmith-testing-block` in B); the new forms are likewise
  disjoint, and new-A does not appear inside old B. So A↔B substitutions cannot
  cross-corrupt in either order. The design's §3.4 "crux" argument holds.
- **Lockstep / two-sources-of-truth.** `eval/utils/scaffold-plugin.ts:4` defines
  `BLOCK_NAME`, written to `block.json`'s `name` at `:62`; the title `"Testing
  Block"` (`:63`) and the directory `join(pluginDir, "src", "blocks",
  "testing-block")` (`:86`, short name only) are correctly identified as
  unchanged. The class is derived by WordPress, so the spec locators are a second
  source that must be rewritten in lockstep. Model is accurate.
- **Conservation identity.** Both new-form strings have **0** pre-existing
  occurrences, so post-rename counts must equal old counts exactly: **15** (name)
  and **16** (class). Both old counts verified (A=15, B=16); both new counts
  verified 0. The conservation check is valid.
- **Authoritative inventory.** Every path:line in §3.3 matches the live tree:
  Literal A across `scaffold-plugin.ts:4`, `testing-agent.md:5`, and the 11 specs
  (with the two double-inline spots); Literal B's 16 lines
  (async-fetch:46,66,72; config-fetch:54; focus-trap-menu:35,43;
  fruit-list-each:31,39,47; independent-counters:35,46; minimal-scaffold:38,55;
  paginated-list:67,84; testing-agent.md:7). The four name-only specs (counter,
  derived-double, shared-state, toggle-visibility — class=0) and seven
  class-bearing specs are exactly as claimed. Both literals live only in
  `.ts/.mjs/.md` (zero in yaml/json/php), confirmed.

### Verification is executable and correct

- **AC2 anchored, not bare.** `git grep -nE "opus[._-]4[._-]7"` returns **1**
  today (the config line, no false positives); the bare `4[.-]7` trap returns
  **8** (7 unrelated package-lock versions). The design uses the anchored form and
  explicitly warns against the bare form. Verified.
- **AC3 occurrence counting.** Uses `git grep -oE … | wc -l` (one line per
  occurrence), correctly counting the two double-inline lines that `grep -c`
  would under-count. Verified A=15, B=16.
- **`.pipelines` exclusion — the critical subtlety.** `git check-ignore
  .pipelines` returns nonzero (NOT ignored), so committed artifacts that quote the
  old literals would false-fail an unscoped grep. **Every tree-wide grep (`-- .`)
  in the design carries `':(exclude).pipelines'`** — AC2 (both greps), AC3 (all
  four greps). The file-scoped checks correctly do not need it: AC1's `sed -n '3p'`
  / `git grep … -- README.md` target a single tracked file, and AC4's loop greps
  `-- "$f"` (one spec) — none can reach `.pipelines`. No required exclusion is
  omitted.
- **AC1 anchoring.** README carries "Claude Code" on line 3 (target) and line 17
  (legitimate `claude-code` env-setup). The anchored phrase `"Claude Code skill"`
  matches only line 3, so the design correctly avoids a tree-wide false positive.
- **AC4 lockstep.** Transitively guaranteed by AC3 (zero old-A + zero old-B + new
  conserved ⇒ no per-spec drift); the explicit per-file guard loop ran clean
  pre-rename (lists all specs, as expected). No line carries both literals (A/B
  sets disjoint), so per-literal `replace_all` cannot cross-corrupt.
- **AC5 R12-safe.** `skillsmith.config.ts` binds `roles.test = { agents:
  ["haiku"] }`; opus is only `judge`/`improver`. `npx skillsmith minimal-scaffold`
  is therefore 1 scenario × 1 haiku test agent = 1×1, inside R12. `minimal-scaffold`
  posts by name at `:19` and locates by class at `:38` and via
  `[data-wp-interactive]` at `:55` — verified — making it a genuine lockstep
  smoke. Correctly best-effort, not blocking.

### Alignment with spec — no scope creep, no dropped scope

- All three spec changes (R1 tagline, R2 model bump, R3 lockstep rename) are
  covered faithfully with the exact target strings.
- `@automattic/skillsmith` tool usage (import in `verify-e2e.ts` /
  `skillsmith.config.ts`, `package.json` dependency, `tsconfig.json` extends) is
  left untouched — none of those lines contain `skillsmith/testing-block`.
- R12 cap respected; no typecheck/lint/build AC invented (consistent with the
  absence of such scripts in `package.json`).

## Notes (non-blocking, for the implementer)

These are observations, not defects — the design already handles each correctly:

- The AC2 anchored loose grep is, as the research notes, redundant with the
  exact-id grep (`claude-opus-4-7` is the sole source hit). The design treats it
  as belt-and-suspenders, which is fine.
- AC4's per-file guard is transitively redundant with AC3 but cheap and adds a
  direct per-spec confirmation. Reasonable to keep.

No blocking findings. Design doc approved.
