# Code review — review-8-playground (DEFER outcome): approved

**Verdict: approved.**

**Process note (honest disclosure):** review-8 deferred the WordPress Playground area (per the owner's already-settled WP-CLI off-domain policy — no re-ask was warranted), so the entire code change is a single catalog stub edit. Given the harness has repeatedly stalled background agents on the 600s watchdog this stretch, the orchestrator made this 1-line, fully-specified, deterministically-verifiable change directly (commit `cc66e8e`) and verified it inline (YAML parse, `git diff`, record-shape probe, `grep`). The verification is mechanical, not judgment-heavy.

## Change under review

Commit `cc66e8e` — "Defer WordPress Playground area with honest deferred stub". Single file: `eval/scenarios/_wp-dev-candidates.yaml` (1 insertion, 1 deletion), confined to the `# === Area: WordPress Playground ===` section.

The `playground-blueprint-plugin-load` stub's placeholder `# TODO: prompt + acceptance` line is replaced by an honest `# Deferred:` reason. The record keeps its accurate `name`/`description`/`difficulty`/`concepts`/`source`/`source_files` (the Playground area + the blueprint-load capability are correctly described); only the disposition note changes from "TODO" to a recorded deferral.

## Why DEFER (from the committed spec, `4037afa`)

Two independent reasons, either sufficient:
1. **Off-domain grounding (decisive).** The entire `developer.wordpress.org/playground/*` namespace — including the stub's lone `source_files` URL (`/playground/wordpress-playground-resources/`) — 301-redirects to `wordpress.github.io/wordpress-playground/` (curl-verified). The Blueprint JSON API (`steps`, `installPlugin`, `login`, `setSiteOptions`, `runPHP`, …) is documented only off-domain. Deferring preserves the suite's never-broken on-domain grounding invariant, applying the owner-settled WP-CLI policy.
2. **Harness misfit (independent).** A Blueprint is a standalone JSON artifact the plugin scaffold (`index.php` + `block.json`) cannot ship, and no existing scenario — judge-only included — grades a non-plugin/non-PHP deliverable. Same wall as the review-4 theme.json deferral.

## Checks (all pass)

- **YAML parses** — `js-yaml` load succeeds; 38 records (unchanged — a stub stayed a stub).
- **Stays a STUB** — `playground-blueprint-plugin-load` has no `prompt` and no `acceptance` (verified via record probe).
- **Deferred reason recorded** — the `# Deferred:` comment states the off-domain-grounding reason (with the redirect evidence) and the harness-mismatch reinforcing reason.
- **Header line UNCHANGED** — WordPress Playground is NOT added to the implemented-areas list (nothing implemented). The line still reads "…Common APIs, and Coding Standards scenarios…".
- **No scenario directory** — no `eval/scenarios/playground-*/` exists.
- **Invariants byte-untouched** — the iAPI `_candidates.yaml`, the skill, and all non-Playground catalog records are unchanged; the diff is confined to the Playground stub's disposition line.
- **Discovery-skip holds** — leading-underscore catalog filename unchanged.
- **No project guardrails** — none declared.

The change faithfully realizes the DEFER spec requirement.
