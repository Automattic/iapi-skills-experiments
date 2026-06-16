# Design Doc — Genericize provider/tool branding and bump the smart model

> Review-1 of the `34-skillsmith-integration` base run (PR #35), layered onto its
> open PR.

## 1. Summary

This change set is **tiny and mechanical** — three independent, single-purpose
edits with **no new architecture**, no new files, and no new abstractions. The
goal is to make the WordPress skill and its eval fixtures *read* as tool- and
provider-agnostic, while the repo keeps consuming
[Skillsmith](https://github.com/Automattic/skillsmith) and the `claude-code`
testing provider as tools.

| # | Change | Surface | Has a design question? |
|---|--------|---------|------------------------|
| 1 | Drop `"Claude Code "` from the README tagline | `README.md:3` only | No — exact target string fixed by spec |
| 2 | Bump the `opus` agent model `claude-opus-4-7` → `claude-opus-4-8` | `skillsmith.config.ts` (the `opus` agent, ~line 27) only | No — exact target id fixed by spec |
| 3 | Rename the example block namespace `skillsmith/` → `wp-skill/` (block **name** and the derived CSS **class**, in lockstep) | 15 block-name + 16 class occurrences across 13 files | **Yes** — rename mechanic + verification |

All three are independent and can land in **any order**. Change 3 is the only one
with a runtime regression surface. Changes 1 and 2 are single-line, grep-checkable
edits with no runtime surface and no design question beyond "what is the exact
target string", so the rest of this doc concentrates on Change 3.

## 2. Changes 1 and 2 (trivial)

### Change 1 — README tagline

`README.md:3` currently reads:

> `A single Claude Code skill for WordPress development, with [Skillsmith](https://github.com/Automattic/skillsmith)-based local evals.`

Drop only `"Claude Code "` so it reads:

> `A single skill for WordPress development, with [Skillsmith](https://github.com/Automattic/skillsmith)-based local evals.`

This is the **minimal drop** — the intent asks the line to *read* agnostic, not to
assert agnosticism. The `[Skillsmith](https://github.com/Automattic/skillsmith)`
link and the `-based local evals` clause stay intact. No other line changes. The
README env-setup section (~line 17) keeps "Claude Code" legitimately — it names
the real `claude-code` provider and Claude Code login — so this edit is anchored
to line 3, not a tree-wide "Claude Code" sweep.

### Change 2 — opus model bump

In `skillsmith.config.ts`, the `opus` agent is the "smart" testing agent referenced
by both the `judge` and `improver` roles. Bump only its `model`:

```ts
opus: {
    provider: "claude-code",
    model: "claude-opus-4-8",   // was "claude-opus-4-7"
    effort: "xhigh",
},
```

- The target id is **exactly** `claude-opus-4-8` — bare id, **no date suffix**.
  This is verified authoritative against the `claude-api` model catalog (the alias
  *is* the complete id) and matches the repo's existing bare-id convention
  (`claude-haiku-4-5`, the previous `claude-opus-4-7`).
- `provider: "claude-code"` and `effort: "xhigh"` stay unchanged — `xhigh` remains
  valid and appropriate on Opus 4.8.
- The `haiku` agent (`model: "claude-haiku-4-5"`, the `test` role) is **unchanged**.

## 3. Change 3 — block-namespace rename (the only design decision)

### 3.1 What is being renamed

Two **distinct** literal strings, changing only the namespace segment:

- **Literal A — block name:** `skillsmith/testing-block` → `wp-skill/testing-block`
- **Literal B — derived CSS class:** `wp-block-skillsmith-testing-block` →
  `wp-block-wp-skill-testing-block`

The short name `testing-block` is invariant. Explicitly **unchanged**: the block
**directory name** (`testing-block` — `scaffold-plugin.ts` uses only the short name
in the path), the block **title** (`"Testing Block"`), and all
`@automattic/skillsmith` tool usage (import, dependency, config structure).

### 3.2 Why "lockstep" means two sources of truth must agree

The CSS class is **not hardcoded** in one place that we could edit once. There are
two independent sources of truth:

1. **Runtime source.** `eval/utils/scaffold-plugin.ts:4` defines
   `const BLOCK_NAME = "skillsmith/testing-block"`, which it writes into
   `block.json`'s `name` field. At runtime **WordPress derives** the wrapper class
   as `wp-block-<namespace>-<name>` (with `/`→`-`) and emits it via
   `get_block_wrapper_attributes()`. So `BLOCK_NAME` drives *both* the posted block
   name and the actual emitted class. With the full `wp-skill` namespace retained
   (no stripping), `wp-skill/testing-block` yields the class
   `wp-block-wp-skill-testing-block`.
2. **Test-literal source.** The scenario specs hardcode `.wp-block-…` locator
   strings (`.locator(...)` / `querySelector`) that must match whatever WordPress
   emits.

**Lockstep means:** after renaming `BLOCK_NAME`, every hardcoded spec locator must
be rewritten to the new derived class. A partial rename that leaves a spec posting
`wp-skill/testing-block` while locating `.wp-block-skillsmith-testing-block` (or
vice versa) silently breaks that scenario — the block inserts but the locator finds
nothing. `independent-counters/e2e.spec.mjs` is the clearest illustration: it
carries **both** literals (block name twice inline at line 20; class at lines 35
and 46), so a one-literal-only rename there posts the new block but locates the old
class and fails `toHaveCount(2)`.

### 3.3 Authoritative inventory

Both literals live **only** in `.ts`/`.mjs`/`.md` files — zero occurrences in
`.yaml`/`.json`/`.php` or any other type.

**Literal A — `skillsmith/testing-block` — 15 occurrences across 13 files:**

- `eval/utils/scaffold-plugin.ts:4` — `const BLOCK_NAME = "skillsmith/testing-block"`
- `eval/prompts/testing-agent.md:5` — prose
- 11 scenario specs, in the posted block comment `<!-- wp:skillsmith/testing-block /-->`:
  `async-fetch:18`, `config-fetch:20`, `counter:17`, `derived-double:19`,
  `focus-trap-menu:16`, `fruit-list-each:16`, `minimal-scaffold:19`,
  `paginated-list:31`, `toggle-visibility:16` (**1 each**), and
  **`independent-counters:20`** and **`shared-state:20`** (**2 inline on one line
  each** — the easy-to-miss spots).

**Literal B — `wp-block-skillsmith-testing-block` — 16 occurrences across 8 files
(all distinct lines):**

- `eval/prompts/testing-agent.md:7` — prose
- 7 scenario specs, in `.locator(".wp-block-…")` / `querySelector` calls:
  `async-fetch:46,66,72` (3); `config-fetch:54` (1); `focus-trap-menu:35,43` (2);
  `fruit-list-each:31,39,47` (3); `independent-counters:35,46` (2);
  `minimal-scaffold:38,55` (2); `paginated-list:67,84` (2).

The four specs `counter`, `derived-double`, `toggle-visibility`, and `shared-state`
carry the block **name** but **no** class — they assert via state /
`[data-wp-interactive]` / button selectors, so they have no class to drift against.

### 3.4 The rename mechanic (DECISION)

**Decision: per-file occurrence-level `replace_all` of each literal, with a
tree-wide grep backstop.** For each of the two literals, run an occurrence-level
`replace_all` in every file that contains it (the inventory above), renaming A then
B. The order is immaterial (see "order-independent" below). A scripted global pass
(`sed`/`perl` with two exact-literal substitutions) is an **acceptable equivalent**
— it is provably safe — but `replace_all` is preferred for its loud per-file
failure mode and zero escaping risk.

Four properties make this mechanic correct and safe:

- **Occurrence-level, not line-level (the primary safety requirement).** A
  line-level edit that fixes "the first match on the line" would silently leave the
  second inline copy behind on `independent-counters:20` and `shared-state:20`,
  where Literal A appears twice on one line (`"<!-- wp:…/-->\n<!-- wp:…/-->"`).
  `replace_all` (like a global `s///g`) replaces **every** occurrence, covering both
  inline copies without special handling. This is the single most important
  property the mechanic must have.
- **Order-independent (the crux — proven by experiment).** The two literals share
  no substring. Literal A is `skillsmith/testing-block` (a **slash** before
  `testing-block`); Literal B is `wp-block-skillsmith-testing-block` (all
  **dashes**, `skillsmith-testing-block`). Literal A's exact string does **not**
  occur inside Literal B, and B does not occur inside A. Therefore substituting A
  can never corrupt B and vice versa — the substitutions are independent and order
  does not matter. The slash-vs-dash distinction is exactly what makes the
  two-literal rename safe. (Verified by running the rename in both orders and
  diffing — identical results.)
- **No false-positive larger tokens.** Literal A is never embedded in a bigger
  identifier; in the specs it appears as `wp:skillsmith/testing-block`, and the
  `wp:` prefix is separated by a colon (a token boundary), so substituting the
  literal cleanly preserves `wp:`. Literal B's only "larger" context is
  `.wp-block-skillsmith-testing-block` — the leading `.` is the CSS-selector dot
  inside `.locator(".wp-block-…")`; substituting the class token leaves the dot
  intact.
- **Loud failure + grep backstop.** The `Edit` tool requires the file be read first
  and fails loudly on a missing match, giving per-file confirmation; a global
  `sed -i` would silently no-op a mistyped literal. After the edits, the AC3 grep
  ("**zero** of either old literal tree-wide") catches any straggler, and the
  conservation check (new-form count == old-form count) confirms completeness — see
  §4.

**Conservation identity (free, strong post-condition).** The new-form strings
`wp-skill/testing-block` and `wp-block-wp-skill-testing-block` each have **zero**
pre-existing occurrences in the tree. So after the rename the new-form counts must
equal the old-form counts exactly: **15** for the block name and **16** for the
class. Any deviation flags a problem.

## 4. Verification (DECISION)

**Decision: static grep first — occurrence-correct, `.pipelines`-excluded, with the
conservation cross-check as a second confirmation — plus one optional capped e2e
run.** Grep is cheap, deterministic, and blocking; the e2e run is heavier and
best-effort. Grep scope excludes `node_modules`, `.git`, `.pipelines`, and
`.skillsmith`.

### 4.1 CRITICAL — exclude `.pipelines` from every grep

`.gitignore` ignores `.skillsmith` and `node_modules` but **NOT `.pipelines`**
(verified: `git check-ignore .pipelines` returns nothing). Consequences:

- `git grep` searches tracked files only, so it auto-excludes `node_modules`,
  `.skillsmith` (gitignored), and `.git` for free.
- `.pipelines` is untracked *today*, so `git grep` skips it for now — **but the
  pipeline commits its own artifacts** (`spec.md`, `design-doc-research.md`, this
  doc, …), and those artifacts **quote the old literals**. Once committed, an
  unscoped grep would match them and false-fail AC2/AC3.
- Therefore **every verification grep MUST add an explicit pathspec**
  `':(exclude).pipelines'`:
  ```
  git grep -n "<pattern>" -- . ':(exclude).pipelines'
  ```
  Plain-grep equivalent: `grep -rn … --exclude-dir={node_modules,.git,.pipelines,.skillsmith}`.
  `git grep` is preferred (cleaner, honors `.gitignore`), but the explicit
  `.pipelines` exclusion is non-negotiable either way.

This is the single most important verification subtlety beyond the greps
themselves, and it is **load-bearing for the code and docs phases**.

### 4.2 Blocking — static checks

**AC1 (Change 1 — tagline).** `README.md:3` no longer contains "Claude Code" and
the Skillsmith-evals clause is intact. The line must read exactly:
`A single skill for WordPress development, with [Skillsmith](https://github.com/Automattic/skillsmith)-based local evals.`
```
sed -n '3p' README.md                          # must read exactly the required line
git grep -n "Claude Code skill" -- README.md   # must be empty
```
Anchor to line 3 / the `Claude Code skill` phrase — a bare tree-wide "Claude Code"
grep is the wrong check, because the env-setup line legitimately keeps it.

**AC2 (Change 2 — model).** The `opus` agent has `model: "claude-opus-4-8"`;
tree-wide there are **zero** occurrences of the old id. The opus agent still shows
`provider: "claude-code"` and `effort: "xhigh"`; haiku still `claude-haiku-4-5`
(confirm by reading the agents block).
```
git grep -n  "claude-opus-4-7"   -- . ':(exclude).pipelines'   # 1 before → 0 after
git grep -nE "opus[._-]4[._-]7"  -- . ':(exclude).pipelines'   # 1 before → 0 after
```
**Loose-form trap:** the spec's "zero of the loose form `4.7`/`4-7`" must **NOT** be
read as a bare `4[.-]7` grep. A bare `git grep -nE "4[.-]7"` returns **8** hits
today, 7 of them unrelated `package-lock.json` package versions (eslint `4.7.2`,
bare-fs `4.7.2`, babel `^7.24.7`, find-process `^1.4.7`, …) — it can never be zero
and is the wrong gate. Use the **anchored** `opus[._-]4[._-]7` form, which returns
exactly 1 today (the config line, no false positives) and 0 after the bump.

**AC3 (Change 3 — rename complete, occurrence-correct).** Tree-wide **zero** of
either old literal; new-form counts conserved at 15 and 16. `grep -c` counts
**lines**, not occurrences, so it would under-count the two double-inline lines —
use `-oE … | wc -l`, which prints one line per occurrence:
```
# Old literals — must be 0 after rename:
git grep -oE "skillsmith/testing-block"          -- . ':(exclude).pipelines' | wc -l   # 15 → 0
git grep -oE "wp-block-skillsmith-testing-block" -- . ':(exclude).pipelines' | wc -l   # 16 → 0
# New literals — conservation check, must equal the old counts:
git grep -oE "wp-skill/testing-block"            -- . ':(exclude).pipelines' | wc -l   # must be 15
git grep -oE "wp-block-wp-skill-testing-block"   -- . ':(exclude).pipelines' | wc -l   # must be 16
```
"Zero of either old literal" is the straggler catch (it catches the two
double-inline lines and any missed file); the `new-A == 15` / `new-B == 16`
conservation gives a second, independent confirmation of completeness.

**AC4 (Change 3 — lockstep consistency).** In every scenario spec, the posted block
name (`wp:wp-skill/testing-block`) matches its locator/class references
(`.wp-block-wp-skill-testing-block`); no spec mixes new name with old class or vice
versa. The directory name, title, and short name `testing-block` are unchanged.

Lockstep is **guaranteed transitively by AC3**: if zero old-A and zero old-B remain
tree-wide AND new-A == 15 and new-B == 16, then no spec can post a new name while
locating an old class (that would leave an old-B straggler) or vice versa. As an
explicit per-file guard over the 7 class-bearing specs (`async-fetch`,
`config-fetch`, `focus-trap-menu`, `fruit-list-each`, `independent-counters`,
`minimal-scaffold`, `paginated-list`):
```
for f in eval/scenarios/*/e2e.spec.mjs; do
  git grep -lE "skillsmith/testing-block|wp-block-skillsmith-testing-block" -- "$f"
done   # must print nothing after rename
```
No single line carries both literals — the A and B match sets are fully disjoint —
so per-literal `replace_all` cannot cross-corrupt.

### 4.3 Optional — one capped e2e run (best-effort, not blocking)

**AC5 (Change 3 — runtime smoke, R12-safe).** Optionally run:
```
npx skillsmith minimal-scaffold
```
`skillsmith.config.ts` binds the `test` role to a single agent
(`roles.test = { agents: ["haiku"], … }`); the `opus` agent is only `judge` /
`improver`, never a *test* agent, so it does not multiply the test matrix. This run
is therefore **one scenario × the single haiku test agent = 1×1**, inside the R12
cap (agents never run the full `scenarios × testing-agents` matrix).

`minimal-scaffold` is the best single lockstep proof: it posts the block by name
(`e2e.spec.mjs:19`), then locates it by the derived class twice — `:38` (text
assertion) and `:55` via the `.wp-block-…[data-wp-interactive]` attribute selector.
If name and class drift apart, the block fails to insert or the locator finds
nothing and the spec fails. This needs Docker + `@wordpress/env`, so it is heavier
than grep and stays **best-effort** — passing AC1–AC4 is sufficient for acceptance.

### 4.4 No typecheck/lint/build AC

`package.json` scripts are only `postinstall`, `skillsmith`, `test:e2e`,
`env:start`, `env:stop` — there is no `tsc`/lint/build script. A manual
`npx tsc --noEmit` would compile `scaffold-plugin.ts` but `BLOCK_NAME` is a plain
`string`, so a wrong value type-checks fine; the `.mjs` specs are outside `tsconfig`
and are never typechecked. Treat typecheck as a compile-sanity check at most, not an
AC.

## 5. Open risks

- **Lockstep drift (Change 3, primary).** The block name and derived class must move
  together; a partial rename silently breaks the affected scenarios. The two
  double-inline lines (`independent-counters:20`, `shared-state:20`) are the
  easiest to miss. Mitigated by occurrence-level `replace_all`, the AC3 zero-old
  grep, and the new==15/16 conservation cross-check.
- **`.pipelines` not gitignored → verification false-positive risk.** Committed
  pipeline artifacts quote the old literals; every verification grep MUST exclude
  `.pipelines` explicitly, or AC2/AC3 will false-fail after the artifacts are
  committed (see §4.1).
- **Eval run not fully exercisable by agents (R12).** Full pass/fail of all 11
  scenarios is the owner's manual matrix step; agent verification is bounded to grep
  (AC1–AC4) plus the single capped `minimal-scaffold` run (AC5).
- **Low residual risk on Changes 1 and 2.** Single-line, grep-checkable, no runtime
  surface. `claude-opus-4-8` is the bare id (no date suffix), verified against the
  `claude-api` model catalog and matching the repo convention; `effort: "xhigh"`
  remains valid on Opus 4.8.
