# Code Plan Review — APPROVED

Review of `3-plan/code-plan.md` (committed at dfa3715) against the approved
spec (`1-spec/spec.md`), design doc (`2-design-doc/design-doc.md`), and the
live repo.

**Verdict: APPROVED.**

The plan's three tasks (T1 README tagline, T2 opus model bump, T3 lockstep
rename) cover the full spec scope with no gaps and no scope creep. Each task is
independently executable with clear Files / Changes / Acceptance, and every
acceptance command was run against the live repo and behaves as the plan
states. No blocking or non-blocking defects found.

## Completeness & feasibility

- **T1 → R1 / AC1 / Design §2 Change 1.** Minimal drop of `"Claude Code "` from
  `README.md:3`, anchored to line 3 and the `Claude Code skill` phrase rather
  than a tree-wide sweep. The plan correctly carves out the line-17 env-setup
  occurrence, which legitimately keeps "Claude Code" (it names the `claude-code`
  provider). Verified: line 3 matches the spec's "current" string verbatim, and
  "Claude Code" appears only on lines 3 and 17.
- **T2 → R2 / AC2 / Design §2 Change 2.** Bump only the `opus` agent's `model`
  from `claude-opus-4-7` to the bare id `claude-opus-4-8`, leaving
  `provider: "claude-code"`, `effort: "xhigh"`, the `haiku` agent, and the
  `judge`/`improver` role references untouched. Verified: the model literal is
  on `skillsmith.config.ts:27` (matches the plan's claimed line), the bare-id
  convention matches `claude-haiku-4-5`, and `claude-opus-4-8` does not yet
  exist in the tree.
- **T3 → R3 / AC3, AC4, AC5 / Design §3, §4.** Two-literal lockstep rename of
  the namespace segment only (`skillsmith` → `wp-skill`). The 13-file inventory,
  the A-vs-B per-file split, and the two easy-to-miss double-inline lines are
  all reproduced exactly. The "explicitly unchanged" list (directory name, title
  `"Testing Block"`, short name `testing-block`, all `@automattic/skillsmith`
  usage, `.skillsmith/` dir, provenance comment, focus-trap bare-short-name
  prose) matches the spec's Out-of-Scope section item for item.

## Acceptance is correct & executable (verified live)

- **`.pipelines/` exclusion is present on every tree-wide grep** and is genuinely
  load-bearing: `git check-ignore .pipelines` returns nothing (not gitignored),
  the artifacts are tracked and quote the old literals, and an unscoped Literal-A
  count returns **57** vs the scoped **15**. Omitting the exclusion would
  catastrophically false-fail AC2/AC3.
- **AC2 uses the anchored `opus[._-]4[._-]7`**, not a bare `4-7`/`4.7`. Verified
  the anchored form returns exactly **1** today (the config line, no false
  positives → 0 after the bump), while the bare loose form `4[.-]7` returns **8**
  hits (package-lock noise) and can never reach zero. The plan's explicit
  "loose-form trap — do NOT gate on this" warning is correct.
- **AC3 counts OCCURRENCES** via `git grep -oE … | wc -l`, not lines. Verified
  live: old Literal A = **15**, old Literal B = **16**; both new forms pre-exist
  at **0**, so the conservation targets (new-A == 15, new-B == 16) are exact. The
  per-file breakdown matches the inventory, including independent-counters (A×2)
  and shared-state (A×2) on a single inline line each.
- **Name↔class lockstep (AC4)** is enforced transitively by AC3 and backed by the
  explicit per-file guard loop over `eval/scenarios/*/e2e.spec.mjs`. The
  `wp:`-prefix (colon boundary) and `.wp-block-` selector-dot claims that make
  the per-literal `replace_all` non-corrupting were verified in-context.
- **R12 cap respected.** AC5 (`npx skillsmith minimal-scaffold`) is marked
  OPTIONAL / best-effort / non-blocking, and scenarios are not required to pass.
  The 1×1 claim is verified: `roles.test = { agents: ["haiku"] }` and `opus` is
  only judge/improver, so it never multiplies the test matrix. The cited
  minimal-scaffold lines (name post :19, class locators :38 and :55 with
  `[data-wp-interactive]`) are accurate.

## Alignment

- `@automattic/skillsmith` tool usage (import, dependency, config structure), the
  `testing-block` directory name, and the block title `"Testing Block"` are all
  explicitly left untouched and called out as such. No drift from the spec's
  Out-of-Scope boundaries.

All file paths, line targets, occurrence counts, and acceptance commands in the
plan were checked against the live repo and are accurate.
