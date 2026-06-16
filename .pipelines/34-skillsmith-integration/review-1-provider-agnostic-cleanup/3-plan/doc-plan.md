# Doc Plan — Genericize provider/tool branding and bump the smart model

Review-1 of `34-skillsmith-integration` (PR #35). This plan covers documentation
updates needed so the repo's prose stays accurate after the three code changes
ship (T1 README tagline, T2 opus model bump, T3 block-namespace lockstep rename).

## Outcome: NO separate documentation work required

After investigating the real docs for ripple effects, the conclusion is that the
three code changes leave **zero** prose inaccurate beyond the edits the code phase
already makes. The one `.md` file that quotes the renamed literals
(`eval/prompts/testing-agent.md`) is already inside the code plan's T3 rename
inventory, so the code phase renames it. There is no additional doc task, and
inventing one would be busywork.

The rest of this document records the evidence for that conclusion, so a reviewer
can confirm the no-op is correct rather than a missed gap. The verification greps
below are the same ones the doc-reviewer should re-run; every one excludes
`.pipelines/` (committed artifacts quote the old literals verbatim and would
false-match).

## Inputs reconciled

- **Spec** (`1-spec/spec.md`) — R1 tagline, R2 model bump, R3 lockstep rename.
- **Design** (`2-design-doc/design-doc.md`) — §2 (trivial Changes 1/2), §3/§4
  (Change 3 rename + verification).
- **Code plan** (`3-plan/code-plan.md`) — T1 (`README.md:3`), T2
  (`skillsmith.config.ts` opus model), T3 (per-file `replace_all` of both literals
  across the 13-file inventory, which **includes `eval/prompts/testing-agent.md`**
  — Literal A prose at `:5`, Literal B prose at `:7`).

## Per-change ripple analysis

### T1 — README tagline (R1): no extra doc work

The skill's *own* Claude-specific branding exists in exactly one place — the
`README.md:3` tagline — and code T1 edits that line. No other prose frames the
skill as Claude-specific.

- The only `Claude Code skill` phrase tree-wide is `README.md:3`:
  ```
  git grep -n "Claude Code skill" -- . ':(exclude).pipelines'
  # => README.md:3 only (and 0 after T1)
  ```
- Every *other* "Claude" reference is an explicitly out-of-scope, legitimate
  provider/tooling mention (spec "Out of Scope") and **must stay**:
  `README.md:17` (names the real `claude-code` provider + Claude Code login),
  `.env.example:5,6,10` (`claude-code`-provider agents + Claude Code login),
  `.rp.md:3` (dev-tooling note), `skillsmith.config.ts:22,26`
  (`provider: "claude-code"`), and `package-lock.json` transitive deps. None of
  these describe the skill's branding, so none needs rewording.
- No guide/example/reference under `skills/wordpress-development/` (SKILL.md, the
  Interactivity API references) contains "Claude" framing — they are already
  provider-agnostic.

**Conclusion:** T1's one-line edit fully satisfies R1. No companion doc task.

### T2 — opus model bump (R2): no extra doc work

No documentation anywhere names the smart model, the model id, the judge role's
model, or the improver role's model. The model id lives only in
`skillsmith.config.ts`, which T2 edits; the change is self-documenting.

- Zero prose mentions of the old id or "Opus 4.7" outside the config + lockfile:
  ```
  git grep -inE "opus[ ._-]?4[ ._-]?7|claude-opus-4-7" -- '*.md' '.env.example' ':(exclude).pipelines'
  # => no match
  ```
- Zero docs name any model id, "smart model/agent", or the judge/improver model:
  ```
  git grep -inE "claude-(opus|haiku|sonnet)|opus 4|haiku 4|smart (model|agent)|judge.*model|improver.*model" -- '*.md' '.env.example' ':(exclude).pipelines'
  # => no match
  ```

**Conclusion:** T2's one-line config edit fully satisfies R2. No companion doc task.

### T3 — block-namespace lockstep rename (R3): covered by code, no extra doc work

Both old literals appear in exactly one `.md`/prose file —
`eval/prompts/testing-agent.md` (Literal A at line 5, Literal B at line 7) — and
that file is **already in the code plan's T3 rename inventory**, so the code
phase's `replace_all` renames its prose in lockstep with the specs and
`scaffold-plugin.ts`. No documentation outside that inventory references the
renamed block name or class.

- The only prose carrying either old literal is `testing-agent.md` (both lines
  are inside code T3's scope):
  ```
  git grep -n "skillsmith/testing-block"          -- '*.md' ':(exclude).pipelines'
  # => eval/prompts/testing-agent.md:5 only (renamed by code T3)
  git grep -n "wp-block-skillsmith-testing-block" -- '*.md' ':(exclude).pipelines'
  # => eval/prompts/testing-agent.md:7 only (renamed by code T3)
  ```
- `README.md` names **no** block name, derived class, or namespace; the scenario
  examples it cites (`counter`, `async-fetch`) are scenario *directory* names,
  which R3 leaves unchanged. So no README prose drifts:
  ```
  git grep -inE "testing-block|wp-block-|namespace" -- README.md
  # => no match
  ```
- `eval/prompts/improver.md` carries no block-name/class reference and its line-7
  "completely agnostic to the Skillsmith tool" framing is the correct, intended
  framing (spec "Out of Scope") — it stays as-is:
  ```
  git grep -inE "skillsmith/testing-block|wp-block-skillsmith|testing-block" -- eval/prompts/improver.md
  # => no match
  ```

**Conclusion:** Code T3 renames the only prose file (`testing-agent.md`) in
lockstep. No companion doc task — adding one would duplicate code T3.

## Out of scope for this doc plan (do not touch)

- `.pipelines/` artifacts (this plan, spec, design, code plan) — historical record;
  they quote old literals on purpose and are excluded from every grep above.
- All legitimate `@automattic/skillsmith` tool references (import, dependency,
  config structure, `.skillsmith/` output dir, README run commands, tsconfig
  extends) — these stay; the repo keeps consuming Skillsmith as a tool.
- All legitimate `claude-code` provider / Claude Code login references
  (`README.md:17`, `.env.example`, `.rp.md`, `skillsmith.config.ts` `provider`).

## Acceptance for this doc plan (the no-op is correct iff all hold)

A doc-reviewer can confirm the no-op outcome by re-running these, all
`.pipelines`-excluded. The plan is correct precisely because the code phase's T1
and T3 edits make all four pass; no separate doc edit is needed.

- After T1, the skill's own branding is gone and no other prose is Claude-specific:
  ```
  git grep -n "Claude Code skill" -- . ':(exclude).pipelines'   # 0
  ```
  (Remaining "Claude" hits are the out-of-scope provider/tooling mentions above —
  expected, not a doc gap.)
- After T2, no doc names the old model id (none ever did):
  ```
  git grep -inE "claude-opus-4-7|opus[ ._-]?4[ ._-]?7" -- '*.md' '.env.example' ':(exclude).pipelines'   # 0
  ```
- After T3, no prose carries either old block literal (the `testing-agent.md`
  prose was renamed by code T3, in lockstep with the specs):
  ```
  git grep -n "skillsmith/testing-block"          -- '*.md' ':(exclude).pipelines'   # 0
  git grep -n "wp-block-skillsmith-testing-block" -- '*.md' ':(exclude).pipelines'   # 0
  ```
- `eval/prompts/testing-agent.md` reads coherently after rename — the block-name
  prose (line 5) and the derived-class prose (line 7) both show the new
  `wp-skill` namespace and remain mutually consistent (the class is still the
  `wp-block-<namespace>-<name>` form of the named block).

## Tasks

**None.** The three code tasks (T1, T2, T3) leave the documentation accurate.
Recording this finding — with the verification greps a reviewer can re-run — is
the correct, proportional outcome for this phase.
