# Review: WP-CLI custom-command scenario (campaign 2/9)

## Origin

Owner directive *"kick off reviews from the gaps. Include the deferred areas as well"* + *"Relax constraints, ship all"*. Campaign review **2 of 9**. This **un-defers WP-CLI** (deferred in review-6 to preserve the on-domain grounding invariant) now that off-domain handbook grounding is explicitly allowed.

## Goal

Ship the **framing-A custom WP-CLI command** scenario — empirically proven e2e-feasible in review-6 via the existing `wpCli(..., { stdio: "pipe" })` stdout channel. Promote the `wp-cli-custom-command` deferred stub to a full record.

## Reuse review-6 research (authoritative mechanics)

`.pipelines/36-wp-dev-scenarios/review-6-wp-cli/1-spec/spec-research.md` established: a plugin registers a custom command via `WP_CLI::add_command`; `WP_CLI::line()`/`WP_CLI::success()` output lands on captured **stdout** (wp-env wrapper noise on stderr); the plugin must be active; positional/associative args flow through. The `wpCli` helper in `eval/utils/wp-cli.mjs` runs `npx wp-env run cli wp <args>` and returns stdout when called with `{ stdio: "pipe" }`.

## Scope

- **1 scenario:** `eval/scenarios/wp-cli/wp-cli-custom-command/` — **e2e** (scenario.yaml + e2e.spec.mjs). New `wp-cli/` topic folder.
  - The plugin registers a custom `wp <command>` that prints a pinned token; the e2e activates the plugin and runs the command via `wpCli([...], { stdio: "pipe" })`, asserting the captured stdout contains the token.
  - User-voice, **tool-agnostic** prompt (don't name `WP_CLI::add_command`); pin the command name + output token; keep prompt↔assertion literals in lockstep.
- **Grounding (off-domain allowed):** cite the canonical WP-CLI custom-command docs (make.wordpress.org/cli handbook / wp-cli.org commands-cookbook) in `source_files`, plus the on-domain `developer.wordpress.org/cli/` landing; `source: dev.wordpress.org` is fine if the landing is cited, but record the off-domain handbook honestly.
- Catalog: **promote** `wp-cli-custom-command` to a full record (drop the `# Deferred:` note; add verbatim prompt/acceptance) under an implemented sub-header.

## Constraints

- New folder layout: `eval/scenarios/wp-cli/<scenario>/`; e2e import is **3-level** `"../../../utils/wp-cli.mjs"` (importing both `wpCli` and `deactivateAllPlugins`). Mirror the post-review-10 nested e2e shape.
- `rubrics: []`; skill untouched; existing scenarios + iAPI `_candidates.yaml` untouched. Static/structural + e2e-collectable verification; pass not required.
