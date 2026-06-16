# Design Doc Research — Genericize provider/tool branding and bump the smart model

> Review-1 of the `34-skillsmith-integration` base run (PR #35). Running Q&A
> record between `design-doc-analyst` (drives, decides) and
> `design-doc-researcher` (investigates, brings evidence). Feeds `design-doc.md`
> (written by the design-doc-writer).
>
> The change set is tiny and mechanical — three independent, single-purpose
> edits. There is **no new architecture**. The only genuine design decisions are
> (T1) the safest *rename mechanic* for Change 3 that guarantees the block name
> and its derived CSS class stay in lockstep with zero stragglers, and (T2) the
> exact grep-based *verification* that proves it. This document records those two
> decisions and the evidence behind them. Changes 1 and 2 are trivial single-line
> edits and carry no design question beyond "what is the exact target string".

## The three changes (for context)

| # | Change | Surface | Design question? |
|---|--------|---------|------------------|
| 1 | Drop "Claude Code " from README tagline | `README.md:3` only | None — exact target string fixed by spec |
| 2 | Bump opus model `claude-opus-4-7` → `claude-opus-4-8` | `skillsmith.config.ts:27` only | None — exact target id fixed by spec |
| 3 | Rename block namespace `skillsmith/` → `wp-skill/` (name **and** derived class, in lockstep) | 15 block-name + 16 class occurrences across 13 files | **Yes** — rename mechanic + verification |

All three are independent and can land in any order. Change 3 is the only one
with a runtime regression surface.

---

## T1 — Rename mechanic for Change 3 (DECIDED)

### Question

What mechanic guarantees both literals are renamed in lockstep with **zero
stragglers**, given that two lines carry the block-name literal twice inline?

- **Literal A — block name:** `skillsmith/testing-block` → `wp-skill/testing-block`
- **Literal B — derived CSS class:** `wp-block-skillsmith-testing-block` →
  `wp-block-wp-skill-testing-block`

Candidates compared:
- **(a)** one scripted global pass (sed/perl) doing two exact-literal substitutions tree-wide;
- **(b)** per-file `Edit replace_all` of each literal, file by file.

### Evidence (analyst-verified + researcher-confirmed)

**E1 — Occurrence vs line count (why occurrence-level matters).** `grep -rn` for
Literal A returns **13 lines** but **15 occurrences**: `independent-counters/e2e.spec.mjs:20`
and `shared-state/e2e.spec.mjs:20` each carry the literal **twice on one line**
(`"<!-- wp:…/-->\n<!-- wp:…/-->"`). Literal B returns **16 lines = 16
occurrences** (all distinct lines). A line-level edit that fixes "the first match
on the line" would silently leave the second inline copy behind. An
occurrence-level replace (`replace_all`, or a global `s///g`) covers both copies.
This is the single most important property the mechanic must have.

**E2 — No substring overlap between the two literals → order-independent (the
crux).** Literal A is `skillsmith/testing-block` (slash before `testing-block`).
Literal B is `wp-block-skillsmith-testing-block` (all dashes). Literal A's exact
string `skillsmith/testing-block` does **not** occur inside Literal B, because B
has `skillsmith-testing-block` (dash, not slash). Conversely B does not occur
inside A. Therefore substituting A can never corrupt B and vice versa —
**the two substitutions are independent and order does not matter**. The
slash-vs-dash distinction is exactly what makes the two-literal rename safe.

**E3 — No false-positive larger tokens.** A regex sweep for any larger token
*containing* each literal found:
- Literal A: **none** — `skillsmith/testing-block` is never embedded in a bigger
  identifier. In the specs it appears as `wp:skillsmith/testing-block`; the `wp:`
  prefix is separated by a colon (a token boundary), so substituting the literal
  cleanly preserves `wp:`.
- Literal B: the only "larger" hit is `.wp-block-skillsmith-testing-block` — the
  leading `.` is the CSS-selector dot inside `.locator(".wp-block-…")`.
  Substituting the literal `wp-block-skillsmith-testing-block` rewrites only the
  class token and leaves the selector dot intact. Not a false positive.

**E4 — Clean conservation check (target literals not pre-existing).** The
new-form strings `wp-skill/testing-block` and `wp-block-wp-skill-testing-block`
each have **zero** pre-existing occurrences in the tree. So after the rename the
new-form counts must equal the old-form counts exactly: **15** for the block name
and **16** for the class. Any deviation flags a problem. This conservation
identity is a free, strong post-condition for verification (see T2).

**E5 — Authoritative file inventory (path:line, analyst-verified).**

Literal A — `skillsmith/testing-block` (15 occurrences, 13 files):
- `eval/utils/scaffold-plugin.ts:4` — `const BLOCK_NAME = "skillsmith/testing-block"`
- `eval/prompts/testing-agent.md:5` — prose
- 11 scenario specs: `async-fetch:18`, `config-fetch:20`, `counter:17`,
  `derived-double:19`, `focus-trap-menu:16`, `fruit-list-each:16`,
  `minimal-scaffold:19`, `paginated-list:31`, `toggle-visibility:16` (1 each),
  and `independent-counters:20`, `shared-state:20` (**2 inline each**).

Literal B — `wp-block-skillsmith-testing-block` (16 occurrences, 8 files):
- `eval/prompts/testing-agent.md:7` — prose
- 7 scenario specs: `async-fetch:46,66,72` (3); `config-fetch:54` (1);
  `focus-trap-menu:35,43` (2); `fruit-list-each:31,39,47` (3);
  `independent-counters:35,46` (2); `minimal-scaffold:38,55` (2);
  `paginated-list:67,84` (2).

Both literals live **only** in `.ts`/`.mjs`/`.md`. Zero occurrences in
`.yaml`/`.json`/`.php` or any other file type (researcher grepped all
extensions). The four specs `counter`, `derived-double`, `toggle-visibility`,
`shared-state` carry the block name but **no** class (they assert via
state/`[data-wp-interactive]`/button selectors) — consistent with the inventory.

**E6 — Why "lockstep" is two-sources-must-agree, not one edit.** The CSS class is
**not hardcoded** in `scaffold-plugin.ts`. `scaffold-plugin.ts` writes
`block.json`'s `name` from `BLOCK_NAME` (line 4 → the `name` field), and at
runtime **WordPress derives** the wrapper class as `wp-block-<namespace>-<name>`
(with `/`→`-`) and emits it via `get_block_wrapper_attributes()`. So there are
two independent sources of truth that must agree:
1. **Runtime source** — `BLOCK_NAME` drives both the posted block name *and* the
   actual emitted class.
2. **Test-literal source** — the specs hardcode `.wp-block-…` locator strings
   that must match whatever WordPress emits.

Lockstep means: after renaming `BLOCK_NAME` to `wp-skill/testing-block`,
WordPress will emit `wp-block-wp-skill-testing-block`, so every hardcoded spec
locator must be rewritten to that exact class — otherwise the spec posts the new
block but locates the old class (or vice versa) and finds nothing.

`independent-counters/e2e.spec.mjs` is the clearest single illustration: it
carries **both** literals (block name 2× inline at line 20; class at lines 35 and
46). A one-literal-only rename here would post `wp-skill/testing-block` blocks but
locate `.wp-block-skillsmith-testing-block`, failing `toHaveCount(2)`.

### Decision (T1)

**Per-file `Edit replace_all` of each literal — mechanic (b) — is the chosen
mechanic, with a tree-wide grep backstop.** Concretely, for each of the two
literals, run an occurrence-level `replace_all` in every file that contains it
(inventory E5), renaming A then B (order is immaterial per E2). Rationale:

- `replace_all` is **occurrence-level**, so it covers the two double-inline lines
  (E1) without special handling — the primary safety requirement.
- It is **order-independent and false-positive-free** by E2/E3, so the simple
  two-literal substitution is provably safe; there is no escaping/quoting risk
  that a `sed`/`perl` one-liner (mechanic a) would introduce with the `/` in
  Literal A and the `.`/regex-meta context of Literal B.
- The `Edit` tool requires the file be read first and fails loudly on a missing
  match, giving per-file confirmation; a global `sed -i` would silently no-op a
  mistyped literal. For a 13-file inventory, per-file edits are tractable and
  auditable.
- **Backstop:** after the edits, the AC3 grep "**zero** of either old literal
  tree-wide" catches any straggler (E1's inline copies, a missed file), and the
  E4 conservation check (new-form count == old-form count: 15 and 16) confirms
  completeness. The mechanic plus this backstop together guarantee lockstep.

A scripted global pass (mechanic a) is an acceptable equivalent *if* an
implementer prefers it — E2/E3 prove it is safe — but mechanic (b) is preferred
for its loud per-file failure mode and zero escaping risk. Either way the
verification (T2) is identical and is what actually guarantees correctness.

---

## T2 — Verification (DECIDED)

### Question

What exact grep-based checks prove all three changes landed, with the right scope
exclusions, occurrence-correct counting, and a lockstep cross-check — plus the
role of the optional capped e2e run?

### Evidence (analyst-verified + researcher-confirmed)

**E7 — Scope-exclusion mechanism (important subtlety).** The spec mandates
excluding `node_modules`, `.git`, `.pipelines`, `.skillsmith`. In this repo
`.gitignore` ignores `.skillsmith` and `node_modules` but **NOT `.pipelines`**
(verified: `git check-ignore .pipelines` returns nothing). Consequences:
- `git grep` searches tracked files only, so it auto-excludes `node_modules`,
  `.skillsmith` (gitignored) and `.git` for free.
- `.pipelines` is currently **untracked** (`git status` shows `??`), so `git grep`
  skips it *today* — but the pipeline commits its artifacts (spec.md,
  spec-research.md, this file) which quote the literals. To stay correct **after
  those artifacts are committed**, the verification command MUST add an explicit
  pathspec `':(exclude).pipelines'`. This is the robust, durable form:
  ```
  git grep -n "<pattern>" -- . ':(exclude).pipelines'
  ```
- Equivalent with plain grep: `grep -rn --include=… <pattern> .` with
  `--exclude-dir={node_modules,.git,.pipelines,.skillsmith}`. `git grep` is
  preferred (cleaner, honors `.gitignore`), but the explicit `.pipelines`
  exclusion is non-negotiable either way.

**E8 — AC1 (tagline).** Check `README.md:3` no longer contains "Claude Code" and
the Skillsmith-evals clause is intact:
```
sed -n '3p' README.md   # must read exactly the required line
git grep -n "Claude Code skill" -- README.md   # must be empty
```
The README env-setup line (~:17) keeps "Claude Code" legitimately (the
`claude-code` provider), so a bare tree-wide "Claude Code" grep is the wrong
check — anchor to line 3 / the "Claude Code skill" phrase.

**E9 — AC2 (model), with the loose-form trap resolved.** The exact check:
```
git grep -n "claude-opus-4-7" -- . ':(exclude).pipelines'   # must be 0 after bump (1 before)
```
Pre-change this returns exactly **1** (`skillsmith.config.ts:27`); post-change
**0**. The opus agent must still show `provider: "claude-code"` and
`effort: "xhigh"`, and haiku still `claude-haiku-4-5` — confirm by reading the
agents block.

**Trap (analyst-verified):** the spec's "zero of the loose form `4.7`/`4-7`"
must NOT be read as a bare `4[.-]7` grep. A bare `git grep -nE "4[.-]7"` returns
**8** hits today, 7 of them unrelated `package-lock.json` package versions
(eslint `4.7.2`, bare-fs `4.7.2`, babel `^7.24.7`, find-process `^1.4.7`, …) —
it can never be zero and is the wrong gate. The correct "loose" check is
**anchored to the model id**:
```
git grep -nE "opus[._-]4[._-]7" -- . ':(exclude).pipelines'   # must be 0 after bump
```
This returns exactly **1** today (the config line, no false positives) and 0
after the bump. Use the anchored form, not bare `4-7`.

**Redundancy note:** the exact-id grep `claude-opus-4-7` is already the *sole*
source hit today (the anchored loose form finds the same single line and nothing
else), so the loose-form check is **redundant but harmless** — it adds no
coverage the exact-id grep lacks. The primary AC2 gate is therefore
`claude-opus-4-7 == 0` plus confirming `skillsmith.config.ts:27` reads
`claude-opus-4-8`; the anchored loose grep is an optional belt-and-suspenders
guard against a hypothetical mistyped variant, not a separate requirement.

**E10 — AC3 (rename complete), occurrence-correct counting.** Two facts: (i)
`grep -c` counts **lines**, not occurrences, so it under-counts the two
double-inline lines; (ii) the new-form literals have **zero** pre-existing
occurrences (E4), so counts are conserved. The occurrence-correct checks:
```
# Old literals — must be 0 after rename:
git grep -oE "skillsmith/testing-block"          -- . ':(exclude).pipelines' | wc -l   # was 15 → 0
git grep -oE "wp-block-skillsmith-testing-block" -- . ':(exclude).pipelines' | wc -l   # was 16 → 0
# New literals — conservation check, must equal the old counts:
git grep -oE "wp-skill/testing-block"            -- . ':(exclude).pipelines' | wc -l   # must be 15
git grep -oE "wp-block-wp-skill-testing-block"   -- . ':(exclude).pipelines' | wc -l   # must be 16
```
`-oE` prints each occurrence on its own line, so `| wc -l` counts occurrences and
correctly catches the two double-inline lines. Pre-change measured counts: old A
= **15**, old B = **16**, both new = **0** (verified). AC3's "zero of either old
literal" is the straggler catch; the new-form `==15`/`==16` conservation gives a
second, independent confirmation of completeness.

**E11 — AC4 (lockstep per-spec).** All 11 specs carry the block name (A); **7**
of them also carry the class (B): `async-fetch`, `config-fetch`,
`focus-trap-menu`, `fruit-list-each`, `independent-counters`, `minimal-scaffold`,
`paginated-list` (verified by per-spec count). The other 4 (`counter`,
`derived-double`, `shared-state`, `toggle-visibility`) carry name only and assert
via state/`[data-wp-interactive]`/button selectors — no class to drift against.

Lockstep is guaranteed transitively by AC3: if **zero** old-A and **zero** old-B
remain tree-wide AND new-A == 15 and new-B == 16, then no spec can post a new
name while locating an old class (that would leave an old-B straggler) or vice
versa. As an explicit, direct per-spec guard, the researcher provided a runnable
drift-detector that classifies each both-literal spec's name and class as OLD or
NEW and prints any disagreement:
```
for f in eval/scenarios/*/e2e.spec.mjs; do
  on=$(grep -c "skillsmith/testing-block" "$f"); nn=$(grep -c "wp-skill/testing-block" "$f")
  oc=$(grep -c "wp-block-skillsmith-testing-block" "$f"); nc=$(grep -c "wp-block-wp-skill-testing-block" "$f")
  if [ "$oc" -gt 0 ] || [ "$nc" -gt 0 ]; then
    ng=none; [ "$on" -gt 0 ] && ng=OLD; [ "$nn" -gt 0 ] && ng=NEW
    cg=none; [ "$oc" -gt 0 ] && cg=OLD; [ "$nc" -gt 0 ] && cg=NEW
    [ "$ng" != "$cg" ] && echo "DRIFT $f name=$ng class=$cg"
  fi
done   # post-rename: prints nothing (all 7 both-specs are name=NEW class=NEW)
```
Run pre-rename, all 7 both-specs are `name=OLD class=OLD` (consistent old state,
zero DRIFT); post-rename they must all be `name=NEW class=NEW`. Any `DRIFT` line
is a lockstep break. Researcher also confirmed **no line carries both literals** —
the A and B match sets are fully disjoint — so per-literal `replace_all` cannot
cross-corrupt.

**E12 — AC5 (optional capped e2e), R12-safe binding.** `skillsmith.config.ts`
binds the `test` role to a single agent: `roles.test = { agents: ["haiku"], … }`.
The `opus` agent is only `judge`/`improver`, never a *test* agent, so it does not
multiply the test matrix. Therefore:
```
npx skillsmith minimal-scaffold
```
runs **one scenario × the single haiku test agent = 1×1**, inside the R12 cap
(never the full `scenarios × testing-agents` matrix). `minimal-scaffold` is the
best single lockstep proof: it posts the block by name (`e2e.spec.mjs:19`), then
locates it by the derived class twice — `:38` (text assertion) and `:55` via the
`.wp-block-…[data-wp-interactive]` attribute selector. If name and class drift,
the block fails to insert or the locator finds nothing and the spec fails. This
run needs Docker + `@wordpress/env`, so it is heavier than grep and stays
**best-effort, not blocking** — passing AC1–AC4 (grep) is sufficient for
acceptance.

**E13 — No typecheck/lint/build AC.** `package.json` scripts are only
`postinstall`, `skillsmith`, `test:e2e`, `env:start`, `env:stop` — no
`tsc`/lint/build. A manual `npx tsc --noEmit` compiles `scaffold-plugin.ts` but
`BLOCK_NAME` is a plain `string`, so a wrong value type-checks fine; the `.mjs`
specs are outside `tsconfig` and never typechecked. Typecheck is a compile-sanity
check at most, not an AC.

### Decision (T2)

Verification is **static grep first, occurrence-correct, `.pipelines`-excluded,
with the conservation cross-check as a second confirmation**, plus the single
optional capped `minimal-scaffold` run:

1. **AC1** — `README.md:3` exact line; `Claude Code skill` phrase absent (E8).
2. **AC2** — `claude-opus-4-7` == 0 and anchored `opus[._-]4[._-]7` == 0 (NOT
   bare `4-7`); opus keeps `claude-code`/`xhigh`, haiku keeps `claude-haiku-4-5`
   (E9).
3. **AC3** — old-A == 0, old-B == 0 (occurrence-correct `-oE | wc -l`); new-A ==
   15, new-B == 16 conservation check (E10).
4. **AC4** — transitively guaranteed by AC3; explicit per-spec no-old-straggler
   guard over the 7 class-bearing specs (E11).
5. **AC5 (optional)** — `npx skillsmith minimal-scaffold` (1×haiku, R12-safe);
   best-effort, not blocking (E12).

All grep commands MUST carry `':(exclude).pipelines'` (or the equivalent
`--exclude-dir`) so committed pipeline artifacts that quote the old literals do
not cause false failures (E7). This is the single most important verification
subtlety beyond the greps themselves.

---

## Summary of decisions

| Topic | Decision |
|-------|----------|
| **T1 — rename mechanic** | Per-file `Edit replace_all` of each literal (A then B; order immaterial — slash-vs-dash proven disjoint and order-independent by experiment), occurrence-level so it covers the two double-inline lines; backstopped by AC3 zero-old grep + conservation count. A scripted global pass is an acceptable equivalent. |
| **T2 — verification** | Static grep first: AC1 tagline, AC2 model (anchored `opus[._-]4[._-]7`, not bare `4-7`), AC3 occurrence-correct old==0 + new==15/16 conservation, AC4 per-spec lockstep (transitive from AC3). All greps `':(exclude).pipelines'`. AC5 optional `npx skillsmith minimal-scaffold` (1×haiku), best-effort. |

## Open risks (carried to design-doc / plan)

- **Lockstep drift (Change 3, primary).** Block name and derived class must move
  together. Mitigated by occurrence-level `replace_all`, AC3 zero-old grep, and
  the new==15/16 conservation cross-check. The two double-inline lines
  (`independent-counters:20`, `shared-state:20`) are the easy-to-miss spots that
  occurrence-level (not line-level) handling covers.
- **`.pipelines` not gitignored → verification false-positive risk.** Committed
  pipeline artifacts quote the old literals; every verification grep MUST exclude
  `.pipelines` explicitly, or AC2/AC3 will false-fail after the artifacts are
  committed. (Newly surfaced in this phase; not previously called out.)
- **Eval run not fully exercisable by agents (R12).** Full pass/fail of all 11
  scenarios is the owner's manual matrix step; agent verification is bounded to
  grep + the single capped `minimal-scaffold` run.
- **Low residual risk on Changes 1 and 2.** Single-line, grep-checkable, no
  runtime surface. `claude-opus-4-8` is the bare id (no date suffix) matching the
  repo convention; `effort: "xhigh"` remains valid on 4.8.
