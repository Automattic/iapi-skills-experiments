# Code Plan — Genericize provider/tool branding and bump the smart model

Review-1 of `34-skillsmith-integration` (PR #35). Three small, independent
changes from the approved spec and design doc. The tasks below can land in **any
order** — none depends on another. Each is independently executable by a fresh
code-writer.

## Traces-to map

| Task | Change | Spec | Design |
|------|--------|------|--------|
| T1 | README tagline drop "Claude Code " | R1 / AC1 | §2 Change 1 |
| T2 | opus model `claude-opus-4-7` → `claude-opus-4-8` | R2 / AC2 | §2 Change 2 |
| T3 | Block-namespace lockstep rename | R3 / AC3, AC4, AC5 | §3, §4 |

## Conventions for every task

- **No TDD red-test step.** This repo has no `tsc`/lint/build/unit-test script
  (`package.json` scripts are only `postinstall`, `skillsmith`, `test:e2e`,
  `env:start`, `env:stop`). The `.mjs` e2e specs are themselves the tests and are
  not modified to assert behavior — they are *fixtures* that are renamed. So
  acceptance is **static grep**, not a written-then-passing test. Treat the grep
  commands in each task's Acceptance as the executable check.
- **Every tree-wide grep MUST exclude `.pipelines/`.** Committed pipeline
  artifacts (spec.md, design-doc.md, this plan) quote the old literals verbatim;
  an unscoped grep matches them and false-fails AC2/AC3. Use
  `git grep … -- . ':(exclude).pipelines'`. Plain-grep equivalent:
  `grep -rn … --exclude-dir={node_modules,.git,.pipelines,.skillsmith}`.
  `git grep` is preferred (honors `.gitignore`, so it also skips `node_modules`,
  `.skillsmith`, `.git` for free). This exclusion is **non-negotiable**.
- **Count OCCURRENCES, not lines, for the rename.** `grep -c` / `git grep -c`
  count matching *lines* and under-count the two double-inline lines
  (`independent-counters`, `shared-state`). Use `git grep -oE … | wc -l`, which
  prints one line per occurrence.
- **R12 cap.** Agents never run the full `scenarios × testing-agents` eval
  matrix. At most ONE scenario × ONE testing agent
  (`npx skillsmith minimal-scaffold` = 1 scenario × the single `haiku` test
  agent) as an OPTIONAL best-effort check. Scenarios are NOT required to pass for
  acceptance; AC1–AC4 (grep) are sufficient.
- **Commit format:** imperative mood, sentence case, no period, agent name in
  parens — e.g. `Drop "Claude Code" from README tagline (code-writer)`. No
  caveman in files.

---

## T1 — Drop "Claude Code " from the README tagline

**Goal.** Make the line-3 tagline read provider-agnostic by removing exactly the
string `"Claude Code "` (with its trailing space), keeping the Skillsmith link
and the "-based local evals" clause intact.

**Files.**
- `README.md` (line 3 only)

**Changes.**
- In `README.md`, edit line 3 from:
  > `A single Claude Code skill for WordPress development, with [Skillsmith](https://github.com/Automattic/skillsmith)-based local evals.`

  to exactly:
  > `A single skill for WordPress development, with [Skillsmith](https://github.com/Automattic/skillsmith)-based local evals.`
- This is the **minimal drop** of `"Claude Code "` only. Do NOT touch any other
  line. In particular, the README env-setup section (~line 17) legitimately keeps
  "Claude Code" (it names the real `claude-code` provider and Claude Code login)
  — leave it. Anchor the edit to line 3 / the `Claude Code skill` phrase, NOT a
  tree-wide "Claude Code" sweep.

**Depends on.** Nothing.

**Traces to.** Spec R1 / AC1; Design §2 Change 1.

**Acceptance.**
- Line 3 reads exactly the required line:
  ```
  sed -n '3p' README.md
  # => A single skill for WordPress development, with [Skillsmith](https://github.com/Automattic/skillsmith)-based local evals.
  ```
- The `Claude Code skill` phrase is gone from the README:
  ```
  git grep -n "Claude Code skill" -- README.md   # must print nothing
  ```
- The Skillsmith link and "-based local evals" clause are still present on line 3
  (visible in the `sed -n '3p'` output above).
- Sanity: `git diff README.md` shows exactly one changed line (line 3) and no
  other edits.

---

## T2 — Bump the opus agent model to `claude-opus-4-8`

**Goal.** In `skillsmith.config.ts`, change only the `opus` agent's `model` value
from `claude-opus-4-7` to `claude-opus-4-8`, leaving everything else untouched.

**Files.**
- `skillsmith.config.ts` (the `opus` agent's `model` line — currently line 27)

**Changes.**
- Change `model: "claude-opus-4-7"` → `model: "claude-opus-4-8"` inside the
  `opus` agent block.
- The target id is **exactly** `claude-opus-4-8` — **bare id, NO date suffix**.
  This is the repo's existing bare-id convention (`claude-haiku-4-5`, the prior
  `claude-opus-4-7`) and is authoritative against the `claude-api` model catalog
  (the alias *is* the complete id; do not append a date).
- Leave `provider: "claude-code"` and `effort: "xhigh"` on the `opus` agent
  **unchanged** (`xhigh` remains valid on Opus 4.8).
- Leave the `haiku` agent **unchanged** (`model: "claude-haiku-4-5"`,
  `provider: "claude-code"`). Do NOT touch `roles` (`judge: "opus"`,
  `improver: { agent: "opus", … }`) — they reference the agent by key, which is
  unchanged, so the bump flows through automatically.

**Depends on.** Nothing.

**Traces to.** Spec R2 / AC2; Design §2 Change 2.

**Acceptance.**
- The opus agent line now reads `model: "claude-opus-4-8"` (read the agents
  block to confirm `provider: "claude-code"` and `effort: "xhigh"` survive, and
  `haiku` still `claude-haiku-4-5`):
  ```
  git grep -n "claude-opus-4-8" -- skillsmith.config.ts   # the opus model line
  ```
- Tree-wide, **zero** occurrences of the old id (both the literal and the
  anchored form):
  ```
  git grep -n  "claude-opus-4-7"  -- . ':(exclude).pipelines'   # 1 before → 0 after
  git grep -nE "opus[._-]4[._-]7" -- . ':(exclude).pipelines'   # 1 before → 0 after
  ```
- **Loose-form trap (do NOT use as a gate).** Do not gate on a bare
  `git grep -nE "4[.-]7"` — it returns ~8 unrelated `package-lock.json` package
  versions (eslint `4.7.2`, bare-fs `4.7.2`, babel `^7.24.7`, …) and can never be
  zero. The **anchored** `opus[._-]4[._-]7` is the correct gate (1 before, 0
  after).
- Sanity: `git diff skillsmith.config.ts` shows exactly one changed line.

---

## T3 — Rename the example block namespace and derived class (in lockstep)

**Goal.** Rename two distinct literal strings across the eval fixtures, changing
**only the namespace segment** `skillsmith` → `wp-skill`, so the block name and
its WordPress-derived CSS class move together. A partial rename silently breaks
the affected e2e scenarios, so completeness and lockstep are the whole point.

- **Literal A — block name:** `skillsmith/testing-block` → `wp-skill/testing-block`
- **Literal B — derived CSS class:** `wp-block-skillsmith-testing-block` →
  `wp-block-wp-skill-testing-block`

WordPress derives the wrapper class as `wp-block-<namespace>-<name>` with `/`→`-`.
With the full `wp-skill` namespace retained (no stripping),
`wp-skill/testing-block` yields `wp-block-wp-skill-testing-block`.

**Files (13 — the authoritative inventory; renamed via per-file `replace_all` of
each literal it contains).**

Literal A appears in all 13; Literal B in 8 of them.

- `eval/utils/scaffold-plugin.ts` — A: `const BLOCK_NAME = "skillsmith/testing-block"` (feeds `block.json`'s `name`). (A only)
- `eval/prompts/testing-agent.md` — A: prose; B: prose. (A + B)
- `eval/scenarios/async-fetch/e2e.spec.mjs` — A ×1 (posted comment); B ×3 (locators). (A + B)
- `eval/scenarios/config-fetch/e2e.spec.mjs` — A ×1; B ×1. (A + B)
- `eval/scenarios/counter/e2e.spec.mjs` — A ×1; B none. (A only)
- `eval/scenarios/derived-double/e2e.spec.mjs` — A ×1; B none. (A only)
- `eval/scenarios/focus-trap-menu/e2e.spec.mjs` — A ×1; B ×2. (A + B)
- `eval/scenarios/fruit-list-each/e2e.spec.mjs` — A ×1; B ×3. (A + B)
- `eval/scenarios/independent-counters/e2e.spec.mjs` — **A ×2 on one inline line**; B ×2. (A + B — easy-to-miss double-inline)
- `eval/scenarios/minimal-scaffold/e2e.spec.mjs` — A ×1; B ×2. (A + B)
- `eval/scenarios/paginated-list/e2e.spec.mjs` — A ×1; B ×2. (A + B)
- `eval/scenarios/shared-state/e2e.spec.mjs` — **A ×2 on one inline line**; B none. (A only — easy-to-miss double-inline)
- `eval/scenarios/toggle-visibility/e2e.spec.mjs` — A ×1; B none. (A only)

Expected per-literal totals: **A = 15, B = 16.**

**Changes.**
- For **each** file in the inventory, run an occurrence-level `replace_all` of
  each literal it contains — Literal A (`skillsmith/testing-block` →
  `wp-skill/testing-block`) and, where present, Literal B
  (`wp-block-skillsmith-testing-block` → `wp-block-wp-skill-testing-block`).
  - Use the `Edit` tool with `replace_all: true` per literal per file (Read the
    file first — the tool requires it and fails loudly on a missing match, giving
    per-file confirmation). A scripted global pass
    (`perl -pi -e 's{skillsmith/testing-block}{wp-skill/testing-block}g;
    s{wp-block-skillsmith-testing-block}{wp-block-wp-skill-testing-block}g'` over
    the inventory) is an acceptable equivalent, but `replace_all` is preferred
    for its loud per-file failure mode and zero escaping risk.
  - **Occurrence-level is the primary safety requirement.** A line-level "first
    match" edit would leave the second inline copy behind on
    `independent-counters` and `shared-state` (Literal A twice on one line
    `<!-- wp:…/-->\n<!-- wp:…/-->`). `replace_all` covers both inline copies
    without special handling.
  - **Order is immaterial.** The two literals share no substring — A has a
    **slash** (`skillsmith/testing-block`), B is all **dashes**
    (`...skillsmith-testing-block`); neither occurs inside the other — so A↔B
    substitutions are independent and cannot cross-corrupt. No single line
    carries both literals (the match sets are disjoint).
  - **No false-positive larger tokens.** Literal A appears as
    `wp:skillsmith/testing-block`; the `wp:` prefix is a token boundary (colon),
    so the `wp:` survives. Literal B's only larger context is
    `.wp-block-skillsmith-testing-block` inside `.locator(".wp-block-…")`; the
    leading `.` is the CSS-selector dot and stays intact.

**Explicitly UNCHANGED by T3 (do NOT edit):**
- The block **directory name** stays `testing-block`. `scaffold-plugin.ts` uses
  only the short name in the path (`join(pluginDir, "src", "blocks",
  "testing-block")`) — the namespace is not in the path. Leave that line alone.
- The block **title** `title: "Testing Block"` (`scaffold-plugin.ts`) — human
  title, no namespace.
- The short name `testing-block` is invariant everywhere — only the `skillsmith`
  → `wp-skill` namespace segment changes.
- All `@automattic/skillsmith` tool usage (import, dependency, config structure),
  the `.skillsmith/` output dir, the `scaffold-plugin.ts` "Auto-scaffolded by
  skillsmith" provenance comment, and the `focus-trap-menu` bare short-name prose
  comment ("Scope to the testing-block …").
- The 7 grep-clean file types confirmed to carry neither literal need no edits:
  every `scenario.yaml`, `_candidates.yaml`, `verify-e2e.ts`,
  `playwright.config.ts`, `improver.md`, `README.md`, `.env.example`.

**Depends on.** Nothing.

**Traces to.** Spec R3 / AC3, AC4, AC5; Design §3, §4.

**Acceptance (blocking — static grep, occurrence-correct, `.pipelines`-excluded).**

- **AC3 — old literals gone, new conserved.** Tree-wide, **zero** of either old
  literal; new-form counts conserved at 15 / 16 (the new forms had zero
  pre-existing occurrences, so new-count must equal old-count exactly):
  ```
  # Old literals — must be 0 after rename:
  git grep -oE "skillsmith/testing-block"          -- . ':(exclude).pipelines' | wc -l   # 15 → 0
  git grep -oE "wp-block-skillsmith-testing-block" -- . ':(exclude).pipelines' | wc -l   # 16 → 0
  # New literals — conservation check:
  git grep -oE "wp-skill/testing-block"            -- . ':(exclude).pipelines' | wc -l   # must be 15
  git grep -oE "wp-block-wp-skill-testing-block"   -- . ':(exclude).pipelines' | wc -l   # must be 16
  ```
  Zero-of-either-old-literal is the straggler catch (covers the two double-inline
  lines and any missed file); new==15/16 is a second, independent completeness
  confirmation.

- **AC4 — lockstep consistency.** No scenario spec mixes a new block name with an
  old class (or vice versa). This is guaranteed transitively by AC3 (zero old-A +
  zero old-B + new==15/16 leaves no room for a mismatched spec). Explicit per-file
  guard over the spec set:
  ```
  for f in eval/scenarios/*/e2e.spec.mjs; do
    git grep -lE "skillsmith/testing-block|wp-block-skillsmith-testing-block" -- "$f"
  done   # must print nothing after rename
  ```
  Also confirm the directory name, title, and short name `testing-block` are
  unchanged:
  ```
  test -d eval/scenarios && ls eval/scenarios/minimal-scaffold >/dev/null   # dir intact
  git grep -n 'title: "Testing Block"' -- eval/utils/scaffold-plugin.ts      # title intact
  git grep -n '"testing-block"' -- eval/utils/scaffold-plugin.ts             # short name in path intact
  ```

**Acceptance (optional — one capped e2e run, best-effort, NOT blocking).**

- **AC5 — runtime smoke, R12-safe.** Optionally run exactly:
  ```
  npx skillsmith minimal-scaffold
  ```
  This is **one scenario × the single `haiku` test agent = 1×1**
  (`roles.test = { agents: ["haiku"], … }`; the `opus` agent is only judge /
  improver, never a test agent, so it does not multiply the matrix) — inside the
  R12 cap. `minimal-scaffold` posts the block by name then locates it by the
  derived class twice (a text assertion and a `.wp-block-…[data-wp-interactive]`
  attribute selector), so it is the best single proof of name↔class lockstep.
  It needs Docker + `@wordpress/env`, so it is heavier than grep and stays
  best-effort — **passing AC3 + AC4 (grep) is sufficient for acceptance**; do NOT
  block on this run, and do NOT expand it to more scenarios or agents.

---

## Verification notes (apply across tasks)

- **No typecheck/lint/build AC.** There is no `tsc`/lint/build script. A manual
  `npx tsc --noEmit` would compile `scaffold-plugin.ts` but `BLOCK_NAME` is a
  plain `string`, so a wrong value type-checks fine; the `.mjs` specs are outside
  `tsconfig` and are never typechecked. Treat typecheck as a compile-sanity check
  at most, not an AC.
- **Full eval matrix is the owner's job.** Complete pass/fail of all 11 scenarios
  after the rename can only be confirmed by the owner's manual matrix run. Agent
  verification is bounded to AC1–AC4 (grep) plus the single optional capped
  `minimal-scaffold` run (AC5).
- **`.pipelines` exclusion is load-bearing.** Repeat: every verification grep adds
  `':(exclude).pipelines'` (or `--exclude-dir=…,.pipelines`). Without it, the
  committed artifacts quoting the old literals false-fail AC2/AC3.
