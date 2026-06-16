# Spec — Genericize provider/tool branding and bump the smart model

## Overview

This is review-1 of the completed `34-skillsmith-integration` work (PR #35),
layered onto its open PR. The repository contains a `wordpress-development`
skill plus an eval harness that consumes [Skillsmith](https://github.com/Automattic/skillsmith)
as the evaluation tool. The skill is usable with any provider; the repo merely
*uses* Skillsmith and the `claude-code` testing provider as tools.

Three small, independent changes make the repo and its eval fixtures present the
WordPress skill and its test scaffolding as tool- and provider-agnostic, while
still consuming Skillsmith as the evaluation tool:

1. **Genericize the skill's own branding** — drop "Claude Code " from the
   `README.md` line-3 tagline so the line reads provider-agnostic. The skill is a
   standalone skill, not a "Claude Code skill."
2. **Bump the "smart" testing agent to Opus 4.8** in the Skillsmith config so the
   judge and improver roles run on `claude-opus-4-8`.
3. **Make the example test block agnostic to Skillsmith** — rename the example
   block namespace `skillsmith/testing-block` → `wp-skill/testing-block`, and the
   derived CSS class `wp-block-skillsmith-testing-block` →
   `wp-block-wp-skill-testing-block`, in lockstep across every occurrence.

The repo keeps consuming Skillsmith as a tool: the `@automattic/skillsmith`
dependency/import, the `.skillsmith/` output directory, the `claude-code` testing
provider, and the `skillsmith.config.ts` structure all stay. The three changes
are independent and can land in any order. Change 3 is the only one with a
runtime regression surface (the block name and its derived CSS class must stay in
lockstep, or the affected e2e specs break).

All three changes are verified by static grep (Acceptance Criteria below), with
one optional, capped e2e run for Change 3. Per the project's R12 rule, agents
never run the full `scenarios × testing-agents` eval matrix — at most one
scenario × one testing agent. The full matrix is the owner's manual step.

## Requirements

### R1 — Genericize the skill's own branding (README tagline only)

The *only* place the skill itself is branded Claude-specific is the `README.md`
line-3 tagline. Reword it to drop "Claude Code " while preserving the
Skillsmith-evals clause.

**Current (`README.md:3`):**

> `A single Claude Code skill for WordPress development, with [Skillsmith](https://github.com/Automattic/skillsmith)-based local evals.`

**Required result:**

> `A single skill for WordPress development, with [Skillsmith](https://github.com/Automattic/skillsmith)-based local evals.`

- This is the minimal drop of "Claude Code ". The intent asks the line to *read*
  provider-agnostic, not to assert agnosticism, so the minimal drop is preferred.
- The `[Skillsmith](https://github.com/Automattic/skillsmith)` link and the
  "-based local evals" clause MUST remain intact — only "Claude Code " is removed.
- No other line in `README.md` or any other file changes for this requirement.

### R2 — Bump the "smart" testing agent to Opus 4.8

In `skillsmith.config.ts`, the `opus` agent is the "smart" testing agent (used by
both the `judge` and `improver` roles). Bump only its `model` value.

**Current (`skillsmith.config.ts`, the `opus` agent, ~lines 25-29):**

```ts
opus: {
    provider: "claude-code",
    model: "claude-opus-4-7",
    effort: "xhigh",
},
```

**Required result:** `model: "claude-opus-4-8"`.

- The target model id is **exactly** `claude-opus-4-8` — bare id, no date suffix.
  This matches the repo's existing bare-id convention (`claude-haiku-4-5`,
  `claude-opus-4-7`) and is verified authoritative against the `claude-api` model
  catalog (the alias *is* the complete id; do not append a date suffix).
- `provider: "claude-code"` and `effort: "xhigh"` MUST stay unchanged. `effort:
  "xhigh"` remains valid and appropriate on Opus 4.8.
- The bump affects both roles that reference the `opus` agent: `judge: "opus"` and
  `improver: { agent: "opus", … }`.
- The `haiku` agent (`model: "claude-haiku-4-5"`, the `test` role) is **unchanged**.

### R3 — Rename the example block namespace and derived class (in lockstep)

Rename two distinct literal strings across the eval fixtures, changing **only the
namespace segment**. The two literals MUST be renamed together everywhere, or the
e2e specs that post the block by name and locate it by the derived class will
break.

**Literal A — block name:** `skillsmith/testing-block` → `wp-skill/testing-block`

**Literal B — derived CSS class:** `wp-block-skillsmith-testing-block` →
`wp-block-wp-skill-testing-block`

WordPress derives the wrapper class as `wp-block-<namespace>-<name>` with `/`→`-`.
With the full `wp-skill` namespace retained (no stripping), `wp-skill/testing-block`
yields the class `wp-block-wp-skill-testing-block`.

**Inventory — every occurrence must be updated:**

Literal A (block name `skillsmith/testing-block`) — 15 occurrences across these
files:

- `eval/utils/scaffold-plugin.ts` — `const BLOCK_NAME = "skillsmith/testing-block"`
  (feeds `block.json`'s `name` field).
- `eval/prompts/testing-agent.md` — prose.
- 11 scenario `e2e.spec.mjs` files, in the posted block comment
  `<!-- wp:skillsmith/testing-block /-->`: async-fetch, config-fetch, counter,
  derived-double, focus-trap-menu, fruit-list-each, minimal-scaffold,
  paginated-list, toggle-visibility (1 each), and **independent-counters** and
  **shared-state** (2 inline on one line each — easy-to-miss spots).

Literal B (CSS class `wp-block-skillsmith-testing-block`) — 16 occurrences across
these files:

- `eval/prompts/testing-agent.md` — prose.
- 7 scenario `e2e.spec.mjs` files, in `.locator(".wp-block-…")` / `querySelector`
  calls: async-fetch (3), config-fetch (1), focus-trap-menu (2), fruit-list-each
  (3), independent-counters (2), minimal-scaffold (2), paginated-list (2).

**Lockstep guard:** Within each scenario spec, the posted block name
(`wp:wp-skill/testing-block`) and every locator/class reference
(`.wp-block-wp-skill-testing-block`) MUST stay consistent. A partial rename that
leaves a spec posting `wp-skill/testing-block` while locating on
`.wp-block-skillsmith-testing-block` (or vice versa) silently breaks that
scenario. Recommended mitigation: per-file `replace_all` of each literal, which
covers the two double-inline lines (independent-counters, shared-state) safely.

**Explicitly unchanged by R3:**

- The block **directory name** stays `testing-block`. `scaffold-plugin.ts` uses
  only the short name in the path (`join(pluginDir, "src", "blocks",
  "testing-block")`); the namespace is not in the path.
- The block **title** `title: "Testing Block"` (`scaffold-plugin.ts`) — a human
  title with no namespace.
- The short name `testing-block` is invariant everywhere; only the namespace
  segment of the `name` field changes.
- All `@automattic/skillsmith` tool usage (import, dependency, config structure).

These files are confirmed grep-clean of both literals and need no edits: every
`scenario.yaml`, `_candidates.yaml`, `verify-e2e.ts`, `playwright.config.ts`,
`improver.md`, `README.md`, `.env.example`. Four specs (counter, derived-double,
toggle-visibility, shared-state) carry the block name but **not** the class —
they assert via state / `[data-wp-interactive]` / button selectors. The
`focus-trap-menu` comment "Scope to the testing-block …" is bare short-name prose,
not the namespaced name or class, and stays valid (the short name is unchanged).

## Out of Scope

The following "Claude" / `claude-code` / `skillsmith` references are intentional
and MUST NOT change. They name the real testing provider, the dev tooling, or
legitimate Skillsmith tool usage — not the skill's own branding or the example
block's namespace.

**"Claude" / `claude-code` references that stay (real provider / dev tooling):**

- `README.md` env-setup section (~line 17) — names the `claude-code` provider and
  Claude Code login.
- `.env.example` (~lines 5, 6, 10) — `claude-code`-provider agents and Claude Code
  login.
- `skillsmith.config.ts` `provider: "claude-code"` on both the `haiku` and `opus`
  agents.
- `.rp.md` (~line 3) — "Claude Code is the agentic coding tool used here." Dev
  tooling note.
- `package-lock.json` — the `@anthropic-ai/claude-agent-sdk` transitive
  dependency.

**`skillsmith` references that stay (legitimate tool usage):**

- `@automattic/skillsmith` import — `skillsmith.config.ts`, `eval/utils/verify-e2e.ts`.
- Dependency in `package.json` (`github:Automattic/skillsmith#…`) and the
  `skillsmith` script.
- `.skillsmith/` output directory — `.gitignore` and README run-output prose.
- The `[Skillsmith](https://github.com/Automattic/skillsmith)` link in
  `README.md:3` (only "Claude Code" drops from that line; the link stays).
- `eval/prompts/improver.md` (lines 1, 7) — "Skillsmith harness/tool" prose;
  line 7 already states the skill is "completely agnostic to the Skillsmith tool"
  (the correct framing; stays).
- `tsconfig.json` `extends: "./node_modules/@automattic/skillsmith/tsconfig.json"`
  — tool config inheritance.
- `scaffold-plugin.ts` plugin Description comment "Auto-scaffolded by skillsmith"
  — tool-provenance prose, not block branding.
- `.rp.md` R12 rule that names Skillsmith (governs the tool).
- README run commands `npx skillsmith` / `npm run skillsmith`.
- `playwright.config.ts` comments referencing `skillsmith.config` and the
  `SKILLSMITH_TESTING_AGENTS` env var.
- `package-lock.json` Skillsmith dependency entries.

**Other explicitly out-of-scope items:**

- `SKILL.md` — already clean (frontmatter `name: wordpress-development`, no
  "Claude" in the description). No change.
- The `README.md` heading `# wordpress-development skill` — already
  provider-agnostic. No change.
- The block directory name, block title, and short name `testing-block` (see R3).
- Running the **full** eval matrix (all scenarios × all testing agents) — that is
  the owner's manual step, never an agent task (R12).

## Acceptance Criteria

Acceptance is **static grep first** (cheap, deterministic, blocking), with one
**optional** capped e2e run for Change 3. Grep scope excludes `node_modules`,
`.git`, `.pipelines`, and `.skillsmith`.

### Blocking — static verification

**AC1 (R1 — tagline).** `README.md` line 3 contains no "Claude Code", and the
`[Skillsmith](https://github.com/Automattic/skillsmith)`-based-local-evals clause
is intact. The line reads exactly:
`A single skill for WordPress development, with [Skillsmith](https://github.com/Automattic/skillsmith)-based local evals.`

**AC2 (R2 — model).** `skillsmith.config.ts`'s `opus` agent has
`model: "claude-opus-4-8"`. Tree-wide there are **zero** occurrences of
`claude-opus-4-7` (and zero of the loose form `4.7`/`4-7` naming the old model).
The `opus` agent still has `provider: "claude-code"` and `effort: "xhigh"`; the
`haiku` agent still has `model: "claude-haiku-4-5"`.

**AC3 (R3 — rename, complete).** Tree-wide there are **zero** occurrences of
`skillsmith/testing-block` **and zero** occurrences of
`wp-block-skillsmith-testing-block`. (A non-zero count of either old literal means
a straggler was missed — this catches the two double-inline lines.)

**AC4 (R3 — lockstep consistency).** In every scenario `e2e.spec.mjs`, the posted
block name (`wp:wp-skill/testing-block`) matches its locator/class references
(`.wp-block-wp-skill-testing-block`). No spec mixes a new block name with an old
class, or an old block name with a new class. The block directory name, title,
and short name `testing-block` are unchanged.

### Optional — one capped e2e run (best-effort, not blocking)

**AC5 (R3 — runtime smoke, R12-safe).** Optionally run `npx skillsmith
minimal-scaffold` — exactly **one** scenario against the single `haiku` test
agent, within the R12 cap (never the full matrix). `minimal-scaffold` is the best
single proof of the name↔class lockstep: it posts the block by name, then locates
it by the derived class twice (including via a `[data-wp-interactive]` attribute
selector). If the name and class drift apart, the block fails to insert or the
locator finds nothing and the spec fails. This run requires Docker +
`@wordpress/env`, so it is heavier than grep and stays best-effort — passing grep
ACs (AC1–AC4) is sufficient for acceptance.

### Notes on verification limits

- **No typecheck/lint/build AC.** There is no `tsc`/lint/build script
  (`package.json` scripts are only `postinstall`, `skillsmith`, `test:e2e`,
  `env:start`, `env:stop`). A manual `npx tsc --noEmit` would compile
  `scaffold-plugin.ts` but only catches syntax breakage — `BLOCK_NAME` is a plain
  `string`, so a wrong value type-checks fine. The `.mjs` e2e specs are outside
  `tsconfig` and never typechecked. Treat typecheck as a compile-sanity check at
  most, not an AC.
- **Full eval matrix is the owner's job.** The complete pass/fail of all 11
  scenarios after the rename can only be confirmed by the owner's manual matrix
  run. Agent verification is bounded to AC1–AC4 (grep) plus the single optional
  capped `minimal-scaffold` run (AC5); acceptance must not require more.

### Open risks carried forward

- **Lockstep drift (Change 3, primary risk).** The block name and derived CSS
  class must be renamed together; a partial rename silently breaks the affected
  scenarios. The two double-inline lines (`independent-counters`, `shared-state`)
  are the easiest to miss — a per-file `replace_all` of each literal mitigates
  this, and AC3's "zero of either old literal tree-wide" catches any straggler.
- **Eval run not fully exercisable by agents (R12).** Full pass/fail of all
  scenarios is the owner's manual step; agent verification is grep + the single
  capped `minimal-scaffold` run.
- **Low residual risk on Changes 1 and 2.** Both are single-line, grep-checkable,
  with no runtime surface. The `claude-opus-4-8` id is verified against the
  `claude-api` model catalog (bare id, no date suffix) and matches the repo's
  existing bare-id convention; `effort: "xhigh"` remains valid on 4.8.
