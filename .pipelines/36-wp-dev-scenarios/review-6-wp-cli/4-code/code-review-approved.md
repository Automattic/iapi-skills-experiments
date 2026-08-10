# Code review — review-6-wp-cli (DEFER outcome): approved

**Verdict: approved.**

**Process note (honest disclosure):** review-6 deferred the WP-CLI Commands area (owner decision), so the entire code change is a single catalog stub edit. The dedicated code-writer and then the dedicated code-reviewer each stalled on the harness stream watchdog (no progress for 600s) before producing/committing anything. To avoid burning further agent cycles on a 4-line, fully-specified, deterministically-verifiable change, the orchestrator made the edit directly (commit `dc2f621`) and verified it inline with deterministic checks (YAML parse, `git diff`, `grep`, a record-shape probe). The verification below is mechanical, not judgment-heavy, so inline self-verification is reliable here.

## Change under review

Commit `dc2f621` — "Defer WP-CLI area with honest deferred stub". Single file: `eval/scenarios/_wp-dev-candidates.yaml` (4 insertions, 5 deletions), confined to the `# === Area: WP-CLI Commands ===` section.

The non-genuine `wp-cli-eval-flush-rewrite` stub (which merely re-verified already-covered deliverables — `cpt-register` + rewrite-flush — through a CLI assertion) is replaced by an honest framing-A **deferred stub** `wp-cli-custom-command`, mirroring the theme.json deferred-stub pattern (catalog line ~166).

## Checks (all pass)

- **YAML parses** — `js-yaml` load succeeds; 37 records (consistent: 1 stub replaced 1-for-1).
- **Stays a STUB** — `wp-cli-custom-command` has no `prompt` and no `acceptance`; `source: dev.wordpress.org`; on-domain `source_files` only (the off-domain make.wordpress.org/cli handbook is cited inside the `# Deferred:` comment, not as a record field).
- **Deferred reason recorded** — the `# Deferred:` comment states the custom-command API (`WP_CLI::add_command`) is documented only off-domain, that developer.wordpress.org/cli/ 301-redirects to the command reference, that deferring preserves the never-broken on-domain grounding invariant, and that framing-A e2e is empirically feasible via the `wpCli(...,{stdio:"pipe"})` stdout channel (so it can be promoted later).
- **Header line UNCHANGED** — WP-CLI is NOT added to the implemented-areas list (line 29 still reads "…REST API, Themes, and Common APIs scenarios…"). Nothing was implemented this review.
- **No scenario directory** — no `eval/scenarios/wp-cli-*/` exists; no `e2e.spec.mjs`.
- **Invariants byte-untouched** — `git diff c457350..HEAD` shows the iAPI `_candidates.yaml`, the skill, and all non-WP-CLI catalog records unchanged; the only changed file is the candidate catalog, only in its WP-CLI section.
- **Discovery-skip holds** — leading-underscore filename unchanged; the catalog is not a discoverable scenario.
- **No project guardrails** — none declared; no gates to run.

The change faithfully realizes the DEFER spec (`spec-research.md`, `c457350`) requirement #3.
