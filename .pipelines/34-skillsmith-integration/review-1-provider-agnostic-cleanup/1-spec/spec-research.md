# Spec Research — Genericize provider/tool branding and bump the smart model

> Review-1 of the `34-skillsmith-integration` base run (PR #35). Three small,
> well-scoped changes layered on top of the shipped Skillsmith integration.
> This document is the running Q&A record between `spec-analyst` and
> `spec-researcher`; it feeds `spec.md` (written by the spec-writer).

## Summary of the three changes

| # | Change | Surface | Verification |
|---|--------|---------|--------------|
| 1 | Genericize the skill's own branding | `README.md:3` tagline only | static grep |
| 2 | Bump the "smart" model to Opus 4.8 | `skillsmith.config.ts:27` only | static grep + typecheck |
| 3 | Rename block namespace `skillsmith/` → `wp-skill/` | 15 block-name + 16 CSS-class occurrences across 10 files | static grep + 1 capped e2e run |

All three are independent and can land in any order. Change 3 is the only one
with a runtime regression surface (block name ↔ derived CSS class must stay in
lockstep per spec).

---

## Change 1 — Genericize the skill's own branding

**Confirmed scope (Q1).** The *only* place the skill itself is branded
Claude-specific is the `README.md:3` tagline:

> `A single Claude Code skill for WordPress development, with [Skillsmith](https://github.com/Automattic/skillsmith)-based local evals.`

Tree-wide grep for "claude", "claude code skill", "claude skill", "claude-code
skill" (excl `node_modules`, `.git`, `.pipelines`, `.skillsmith`) confirms every
*other* "Claude" hit is out of scope and stays:

- `README.md:17` — names the `claude-code` provider + Claude Code login (env setup). Real provider. **Keep.**
- `.env.example:5,6,10` — `claude-code`-provider agents + Claude Code login. **Keep.**
- `skillsmith.config.ts:22,26` — `provider: "claude-code"` (haiku + opus agents). **Keep.**
- `.rp.md:3` — "Claude Code is the agentic coding tool used here." Dev-tooling note. **Keep.**
- `package-lock.json` — `@anthropic-ai/claude-agent-sdk` transitive dep. **Keep.**

`SKILL.md` is already clean: frontmatter `name: wordpress-development`, no
"Claude" in the description, body reads "single entry-point skill for WordPress
development". The README heading `# wordpress-development skill` (`README.md:1`)
is already provider-agnostic — no change.

**Agreed reword (Q1b).** Minimal drop of "Claude Code ", preserving the
Skillsmith-evals clause and matching SKILL.md's own phrasing:

> `A single skill for WordPress development, with [Skillsmith](https://github.com/Automattic/skillsmith)-based local evals.`

The intent asks the line to *read* provider-agnostic, not to assert agnosticism,
so the minimal drop is preferred. (Alternative, if the spec-writer wants it
explicit: `A single, provider-agnostic skill for WordPress development, with
[Skillsmith]…evals.` — recorded but not recommended.)

---

## Change 2 — Bump the "smart" model to Opus 4.8

**Confirmed scope (Q2).** Single-line change in `skillsmith.config.ts`. The
"smart" model is the `opus` agent (lines 25-29):

```ts
opus: {
    provider: "claude-code",
    model: "claude-opus-4-7",   // → "claude-opus-4-8"
    effort: "xhigh",
},
```

- Only the `model` value changes. `provider: "claude-code"` and `effort: "xhigh"` stay.
- The `opus` agent is referenced by both roles: `judge: "opus"` and `improver: { agent: "opus", … }` — so the bump affects **judge and improver**.
- The `haiku` agent (`model: "claude-haiku-4-5"`, the `test` role) is **unchanged**.

**Target model id (Q2).** Exactly `claude-opus-4-8` — bare id, no date suffix.
Verified authoritative against the `claude-api` skill model catalog: Claude Opus
4.8's id is `claude-opus-4-8` and the alias *is* the complete id (rule: "use
exact model ID strings; do not append date suffixes"). This matches the repo's
existing bare-id convention (`claude-haiku-4-5`, `claude-opus-4-7` — no dates).
Valid for the `claude-code` provider (4.7 already runs there; 4.8 is the same
surface, no breaking change). `effort: "xhigh"` remains valid and appropriate on
4.8.

**No stray version strings (Q2b).** Tree-wide grep for `4-7` / `4.7` / `opus`
finds exactly one hit: `skillsmith.config.ts:27`. No comment names "4-7", no
other docs/README/.env reference the old version. Clean single-line change.

---

## Change 3 — Rename block namespace `skillsmith/testing-block` → `wp-skill/testing-block`

**Confirmed inventory (Q3a — recounted, authoritative).** Two distinct literal
strings, counting every occurrence (not just matching lines):

**A) Block name `skillsmith/testing-block` — 15 occurrences across 13 files:**

- `eval/utils/scaffold-plugin.ts:4` — `const BLOCK_NAME = "skillsmith/testing-block"` (feeds `block.json` `name` via `scaffold-plugin.ts:62`).
- `eval/prompts/testing-agent.md:5` — prose.
- 11 scenario `e2e.spec.mjs` files (post content `<!-- wp:skillsmith/testing-block /-->`):
  - 1 each: async-fetch:18, config-fetch:20, counter:17, derived-double:19, focus-trap-menu:16, fruit-list-each:16, minimal-scaffold:19, paginated-list:31, toggle-visibility:16
  - **2 inline on one line each:** independent-counters:20, shared-state:20 (`"<!-- wp:…/-->\n<!-- wp:…/-->"`)

**B) Derived CSS class `wp-block-skillsmith-testing-block` — 16 occurrences across 8 files:**

- `eval/prompts/testing-agent.md:7` — prose.
- 7 scenario specs (`.locator(".wp-block-…")` / `querySelector`):
  - async-fetch:46,66,72 (3); config-fetch:54 (1); focus-trap-menu:35,43 (2); fruit-list-each:31,39,47 (3); independent-counters:35,46 (2); minimal-scaffold:38,55 (2); paginated-list:67,84 (2).

After rename: block name → `wp-skill/testing-block`; WordPress derives the
wrapper class as `wp-block-<namespace>-<name>` with `/`→`-`, giving
`wp-block-wp-skill-testing-block` (Q3c — full namespace retained, no stripping).

**Unchanged by the rename (Q3b):**

- Block directory path uses only the short name: `scaffold-plugin.ts:86`
  `join(pluginDir, "src", "blocks", "testing-block")`. Namespace not in path → **stays `testing-block`**.
- `title: "Testing Block"` (`scaffold-plugin.ts:63`) — human title, no namespace → **stays**.
- Only the namespace segment of the `name` field changes; the short name
  `testing-block` is invariant everywhere.

**Confirmed absent (no missed references):** all `scenario.yaml`,
`_candidates.yaml`, `verify-e2e.ts`, `playwright.config.ts`, `improver.md`,
`README.md`, `.env.example` are grep-clean of both literals. Four specs
(counter, derived-double, toggle-visibility, shared-state) carry the block name
but **not** the class — they assert via state/`[data-wp-interactive]`/button
selectors, consistent with their having no class hit.

**No dynamic/computed references (Q3c):** every spec uses the literal class
string; none builds the class from pieces or derives it from the block name at
runtime, so a literal grep is complete. One non-target near-miss:
`focus-trap-menu:30` comment "Scope to the testing-block …" — bare short-name
prose, not the namespaced name or class; stays valid since the short name is
unchanged.

**Lockstep regression guard:** block name and CSS class MUST change together.
Within each spec, the posted block (`wp:wp-skill/testing-block`) and the locator
(`.wp-block-wp-skill-testing-block`) must stay consistent, or the e2e run breaks.

---

## Out of scope — Skillsmith refs that stay (legitimate tool usage)

The repo *consumes* Skillsmith as the eval tool; only the example block's
*namespace* drops the Skillsmith name. These references are intentional and
untouched:

- `@automattic/skillsmith` import — `skillsmith.config.ts:4`, `eval/utils/verify-e2e.ts:11`.
- Dependency `package.json:14` (`github:Automattic/skillsmith#…`) and script `package.json:8`.
- `.skillsmith/` output directory — `.gitignore:13` and README run-output prose.
- README Skillsmith link target — `README.md:3` keeps the `[Skillsmith](…)` link; only "Claude Code" drops.
- `eval/prompts/improver.md:1,7` — "Skillsmith harness/tool" prose. Line 7
  states the skill is "completely agnostic to the Skillsmith tool" — the correct
  framing the intent wants; stays.
- `claude-code` provider prose in `.env.example:1` and `README.md:17,19`.
- `tsconfig.json:2` — `extends: "./node_modules/@automattic/skillsmith/tsconfig.json"`. Tool config inheritance. **Stays.**
- `scaffold-plugin.ts:25` — plugin Description comment "Auto-scaffolded by skillsmith". Tool-provenance prose, not block branding. **Stays.**
- `.rp.md:106` — R12 rule names Skillsmith (governs the tool). **Stays.**
- README run commands `npx skillsmith` / `npm run skillsmith` (`README.md:26,28,33,41,59,62`). **Stay.**
- `playwright.config.ts:18,20,22,23` — comments referencing `skillsmith.config` and the `SKILLSMITH_TESTING_AGENTS` env var. **Stay.**
- `package-lock.json` Skillsmith dep entries. **Stay.**

---

## Verification surface (R12-capped)

`.rp.md` R12 caps agent-driven verification at **one scenario × one testing
agent** (`npx skillsmith <one-scenario-dir>`); the full
`scenarios × testing-agents` matrix is the owner's manual step, never an agent
task. The acceptance surface is therefore static grep first, with one optional
capped run.

**Required / blocking — static grep (cheap, deterministic):**

- **C1 (tagline):** `README.md:3` contains no "Claude Code"; the
  `[Skillsmith](https://github.com/Automattic/skillsmith)`-based-local-evals
  clause is intact.
- **C2 (model):** `skillsmith.config.ts` `opus.model == "claude-opus-4-8"`; zero
  occurrences of `claude-opus-4-7` (or `4.7`) tree-wide.
- **C3 (rename):** zero occurrences of `skillsmith/testing-block` **and** zero
  of `wp-block-skillsmith-testing-block` tree-wide; in every scenario spec the
  posted block name (`wp:wp-skill/testing-block`) matches its locator
  (`.wp-block-wp-skill-testing-block`).

**Optional / best-effort — one capped e2e run:**

- `npx skillsmith minimal-scaffold` (1 scenario × the single `haiku` test agent —
  R12-safe). `minimal-scaffold` is the best single proof of the name↔class
  lockstep: it posts the block by name (`e2e.spec.mjs:19`), then locates it by
  the derived class twice (`:38`, and `:55` with the `[data-wp-interactive]`
  attribute selector). If the name and class drift apart, the block fails to
  insert or the locator finds nothing → the spec fails. Matches the base run's
  "capped AC1 smoke run (1×1)" pattern. Requires Docker + `@wordpress/env`, so it
  is heavier than grep and stays best-effort, not blocking.

**Note on typecheck (not a correctness AC):** there is no `tsc`/lint/build
script (`package.json` scripts are only `postinstall`, `skillsmith`, `test:e2e`,
`env:start`, `env:stop`). A manual `npx tsc --noEmit` would compile
`scaffold-plugin.ts` (reachable via `skillsmith.config.ts:5`) but only catches
syntax breakage — `BLOCK_NAME` is a plain `string`, so a wrong/mismatched value
type-checks fine. The e2e specs are `.mjs` and outside `tsconfig`, never
typechecked. Treat typecheck as a compile-sanity check at most, not an AC.

---

## Open risks

- **Lockstep drift (Change 3, primary risk).** The block name and the derived
  CSS class must be renamed together; a partial rename leaves some specs posting
  `wp-skill/testing-block` while locating on `.wp-block-skillsmith-testing-block`
  (or vice versa), silently breaking the affected scenarios. The two
  double-inline lines (`independent-counters:20`, `shared-state:20`) are
  easy-to-miss spots — a per-file `replace_all` of each literal mitigates this.
  Mitigation: the C3 "zero of either old literal tree-wide" grep catches any
  straggler.
- **Eval run not fully exercisable by agents (R12).** The full pass/fail of all
  11 scenarios after the rename can only be confirmed by the owner's manual
  matrix run. Agent verification is bounded to grep + the single capped
  `minimal-scaffold` run; the spec must not require more.
- **Low residual risk on Changes 1 and 2.** Both are single-line, grep-checkable,
  with no runtime surface. The `claude-opus-4-8` id is verified against the
  `claude-api` model catalog (bare id, no date suffix) and matches the repo's
  existing bare-id convention; `effort: "xhigh"` remains valid on 4.8.
