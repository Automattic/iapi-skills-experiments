# Review: WP-CLI Commands area scenarios

## Origin

This review continues the owner's standing instruction (given when kicking off review-2):

> Kick off the next review and don't ask me for the next ones. Make sure they explore the possibility of using folders.

Boundaries (standing instruction, applied here):
- **Continue area-by-area coverage autonomously** — one top-level area per review, no pausing to ask between reviews.
- **This review's area: WP-CLI Commands** (API Reference → https://developer.wordpress.org/cli/). Areas already covered: Plugins (review-1), Block Editor (review-2), REST API (review-3), Themes (review-4), Common APIs (review-5). Remaining after this: Advanced Administration, Coding Standards, WordPress Playground, Code Reference.
- **The folders question is already resolved** (review-2): adopted `<area>-*` pseudo-folder naming. This review applies it (`wp-cli-*`) — and the existing catalog stub already uses that prefix (`wp-cli-eval-flush-rewrite`).

Convenience link: https://github.com/Automattic/wordpress-skill-experiments/issues/36 (PR #37).

## Goal

Extend the `wordpress-development` eval suite's coverage to the **WP-CLI Commands** area with simple, documentation-driven scenarios (~1 per major sub-area), building on the reference taxonomy and the `eval/scenarios/_wp-dev-candidates.yaml` candidate catalog established in review-1 (promoting the existing WP-CLI stub `wp-cli-eval-flush-rewrite` + adding records, not rebuilding the taxonomy). New scenarios use the adopted `wp-cli-*` pseudo-folder naming.

## Constraints

- **Build on prior artifacts:** reuse the existing taxonomy + catalog; **promote the existing WP-CLI stub to a full record** and add new records as the design decides; do not rebuild the taxonomy.
- Scenarios stay **simple** (one concept, one small feature) and follow the existing conventions: `scenario.yaml` (+ optional `e2e.spec.mjs`); user-voice, **tool-agnostic** prompts; explicit `rubrics: []`; grounded in developer.wordpress.org.
- The **skill (`skills/wordpress-development/`) is not modified.**
- **One area (WP-CLI Commands) this review;** remaining areas are subsequent reviews.
- **No duplication:** do not merely re-verify an already-covered feature (e.g. `cpt-register`) through a CLI channel and call it a WP-CLI scenario — each scenario must be genuinely *about* WP-CLI usage or WP-CLI command development.
- **Apply the adopted `wp-cli-*` pseudo-folder naming** (dir == `scenario.yaml` name == catalog record name; flat immediate children, `/^[a-z0-9-]+$/`). Existing scenarios are NOT renamed.
- Static/structural verification only; existing scenarios, the iAPI `_candidates.yaml`, and non-WP-CLI catalog records untouched.

## Assumptions / directions to explore

*(open — research may confirm or revise)*

- **A new verification channel is available and is the key enabler.** `eval/utils/wp-cli.mjs` already exports `wpCli(args, { stdio: "pipe" })`, which runs `npx wp-env run cli wp <args>` and **returns stdout as a string**. An e2e spec can therefore run a `wp` command and assert on its output — a genuinely new channel beyond the HTTP/DOM/REST channels used so far. The Rewrite e2e lifecycle (activate the agent's plugin, then assert) is the model; here the assertion runs a `wp` command via `wpCli(..., { stdio: "pipe" })` and checks the captured stdout.
- **Two candidate framings for "WP-CLI Commands" scenarios** — the design picks the most in-scope, simple, gradeable ones (a mix is fine):
  - **(A) Developing a custom WP-CLI command** — the plugin registers a command via `WP_CLI::add_command` with output (`WP_CLI::success`/`line`), optionally positional/associative args. e2e: `wpCli(["<custom-command>"], { stdio: "pipe" })` → assert stdout. This is the genuine "WP-CLI development" capability.
  - **(B) Using built-in WP-CLI commands** to drive/verify a development task — e.g. the agent ships a plugin and the scenario exercises built-in commands (`wp post-type list`, `wp option get`, `wp post list`) to confirm the dev outcome. The existing stub `wp-cli-eval-flush-rewrite` is in this family.
- **Key open question — grounding (resolve in the spec phase, mirroring how review-4 surfaced the theme-scaffold limitation):** the WP-CLI **command reference** (built-in commands) lives at https://developer.wordpress.org/cli/commands/ (fully in-scope), but the **custom-command API** (`WP_CLI::add_command`, the commands cookbook) is documented primarily at the off-domain WP-CLI handbook (wp-cli.org). The spec must determine, per framing, whether a scenario can be **grounded in developer.wordpress.org**. If framing (A) cannot be cleanly grounded on-domain, prefer framing (B), keep (A) judge-only with a recorded grounding caveat, or record (A) as a deferred stub — an honest, recorded call, as in prior reviews.
- e2e where feasible via the `wpCli` stdout channel; judge-only/deferred where a clean on-domain grounding or runtime assertion isn't simple. A smaller batch is acceptable.
