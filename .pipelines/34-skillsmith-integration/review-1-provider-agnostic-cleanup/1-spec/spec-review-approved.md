# Spec Review — APPROVED

**Verdict:** APPROVED
**Reviewed:** `1-spec/spec.md` (committed at `f6ba2fc`)
**Against:** `0-intent/intent.md`, `1-spec/spec-research.md`, and the real repository.

The spec is complete, testable, faithful to the intent's three changes, free of
scope creep, R12-respecting, and risk-aware. Every load-bearing claim was
verified against the actual repo and holds.

## What was verified against the repo

**Change 1 (R1 / AC1 — README tagline).**
- `README.md:3` matches the spec's quoted "current" state verbatim:
  `A single Claude Code skill for WordPress development, with [Skillsmith](…)-based local evals.`
- The required result is the minimal drop of "Claude Code ", preserving the
  Skillsmith link and the "-based local evals" clause — aligned with the intent
  ("read provider-agnostic") and with SKILL.md's own phrasing.
- Scope boundary confirmed: a tree-wide `claude` grep shows the only place the
  *skill itself* is branded Claude-specific is `README.md:3`. All other hits
  (`README.md:17`, `.env.example:5,6,10`, `skillsmith.config.ts:22,26`, `.rp.md`,
  `package-lock.json`) name the real `claude-code` provider / dev tooling / a
  transitive dep — correctly listed Out of Scope and left untouched.
- `skills/wordpress-development/SKILL.md` confirmed already clean
  (`name: wordpress-development`, no "Claude" in the description, body "single
  entry-point skill"). The skills/ subtree has zero "claude" hits.

**Change 2 (R2 / AC2 — model bump).**
- `skillsmith.config.ts` `opus` agent matches the spec's quoted current state
  (`provider: "claude-code"`, `model: "claude-opus-4-7"`, `effort: "xhigh"`,
  lines 25–29). Target `claude-opus-4-8` (bare id, no date suffix) matches the
  Opus 4.8 catalog id and the repo's existing bare-id convention
  (`claude-haiku-4-5`, `claude-opus-4-7`).
- The `opus` agent is referenced by `judge: "opus"` and
  `improver: { agent: "opus", … }`; the `haiku` agent (`claude-haiku-4-5`, `test`
  role) is correctly held unchanged.
- The model string `claude-opus-4-7` and the hyphenated `4-7` form appear exactly
  once tree-wide (the config line), so the rename is genuinely complete after the
  fix.

**Change 3 (R3 / AC3–AC4 — block rename in lockstep).**
- Inventory verified occurrence-by-occurrence:
  - Literal A `skillsmith/testing-block`: **15 occurrences across 13 files** —
    `scaffold-plugin.ts:4`, `testing-agent.md:5`, and 11 scenario specs (with the
    two double-inline lines at `independent-counters:20` and `shared-state:20`
    confirmed present and flagged as easy-to-miss).
  - Literal B `wp-block-skillsmith-testing-block`: **16 occurrences across 8
    files** — `testing-agent.md:7` plus 7 scenario specs, per-file counts matching
    the spec exactly.
- Derived class rule confirmed: full `wp-skill` namespace retained →
  `wp-block-wp-skill-testing-block`. No spec builds the class dynamically; a
  literal grep is complete (verified — no other `wp-block-` refs, no other
  `skillsmith` refs in specs).
- Explicitly-unchanged items confirmed in the repo: directory path uses the short
  name (`scaffold-plugin.ts:86` `join(…, "testing-block")`),
  `title: "Testing Block"` (`:63`), and the "Auto-scaffolded by skillsmith"
  provenance comment (`:25`).
- The `focus-trap-menu:30` near-miss ("Scope to the testing-block …") is confirmed
  bare short-name prose, not the namespaced name or class — correctly excluded.
- "Confirmed absent" files (`*.yaml`, `verify-e2e.ts`, `playwright.config.ts`,
  `improver.md`, `.env.example`, `README.md`) are genuinely grep-clean of both
  literals.

**Alignment / soundness.**
- All `@automattic/skillsmith` tool usage (import in `skillsmith.config.ts:4`,
  type import in `verify-e2e.ts:11`, dep in `package.json:14`, `tsconfig.json`
  extends) stays untouched — exactly as the intent's constraint requires.
- R12 respected throughout: agents never run the full `scenarios × testing-agents`
  matrix; AC5 caps the optional run at one scenario (`minimal-scaffold`) × the
  single `haiku` agent. The `.rp.md` "Running evals" rule matches the spec's
  characterization.
- Open risks captured: lockstep drift (primary), the two double-inline lines, the
  R12-bounded eval surface, and the low residual risk on Changes 1 and 2.
- The acceptance criteria are clear, standalone, and verifiable by grep (AC1–AC4),
  with the e2e run correctly marked optional/non-blocking (AC5).

## Non-blocking note (for the implementer, not a defect)

AC2 phrases a secondary check as "zero of the loose form `4.7`/`4-7` naming the
old model." The hyphenated `4-7` is genuinely zero tree-wide after the fix, but a
naive `grep '4\.7'` (dotted) matches 7 unrelated dependency versions in
`package-lock.json`. AC2's qualifier "naming the old model" makes the criterion
correct and unambiguous, and the primary check (`claude-opus-4-7` → zero) is
clean. No change required; just verify against `claude-opus-4-7` / `opus-4-7` /
`opus-4.7` rather than a bare `4.7` to avoid package-lock false positives.
