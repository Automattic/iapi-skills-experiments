# Review: organize scenarios into real folders + agent-skills coverage map

## Origin

A **new owner-assigned review** (not the auto-chain — the 10-area sweep is complete). The owner's request, verbatim intent:

> Organize the scenarios in folders per relevant topics. Apart from that, check if the topics in these skills are covered: https://github.com/WordPress/agent-skills/tree/trunk/skills — it does NOT need to use the same structure, but ensure those topics are covered in our structure of scenarios.

Two parts, with the owner's scoping decisions (asked and answered at kickoff):

- **Part 1 — real folders.** Owner decision (verbatim): *"Do the folders even if they don't work in Skillsmith. I'll open an issue in that repo if needed."* → Reorganize scenarios into **real per-topic subdirectories** under `eval/scenarios/`, even though the pinned external Skillsmith currently discovers scenarios as flat immediate children. This **overrides** the earlier review-2 pseudo-folder compromise. The owner will drive any upstream Skillsmith change; this review does the reorganization + our own harness updates + documents the precise Skillsmith dependency.
- **Part 2 — coverage map.** Owner decision: *"Map + catalog the gaps in a way they're later used to trigger new reviews easily."* → Compare our scenario coverage against the topics in `WordPress/agent-skills/skills`, and **record the gaps as catalog stubs structured to easily trigger future reviews** (do NOT author new scenarios this review).

Convenience link: https://github.com/Automattic/wordpress-skill-experiments/issues/36 (PR #37).

## Goal

(1) Move every scenario into a real per-topic folder under `eval/scenarios/`, updating our harness/catalog/docs to match and documenting the Skillsmith-discovery dependency; (2) produce an agent-skills coverage map and record the gaps as review-triggerable catalog stubs. **The `skills/` directory (the skills themselves) is NOT modified.** Scenario *content* (`scenario.yaml` prompt/acceptance) is preserved; only locations/paths (and possibly the now-redundant `<area>-*` name prefixes) change.

## Established facts (harness; for the design to build on)

- **Discovery is external + pinned:** `@automattic/skillsmith` (github pin `6bd90c34…`) does scenario discovery; `eval/utils/` does NOT. Per prior findings, Skillsmith discovers scenarios as **flat immediate children** of `eval/scenarios/` (skips nested dirs / leading-underscore). **Whether real nested folders are discoverable by the pin is the key external dependency** — the design must state precisely what Skillsmith change is needed so the owner's upstream issue is actionable. (Per the owner, we proceed with real folders regardless.)
- **Playwright e2e collection already supports nesting:** `playwright.config` uses `testDir: "./eval/scenarios"`, `testMatch: "**/e2e.spec.mjs"` — the `**/` glob collects e2e specs at ANY depth. So nesting does **not** break e2e collection.
- **e2e import depth shifts:** the 27 e2e scenarios import `deactivateAllPlugins` from `"../../utils/wp-cli.mjs"` (depth-2). Each extra nesting level needs **one more `../`** (`"../../../utils/wp-cli.mjs"` at depth-3). Mechanical, per-file; must be updated for every moved e2e scenario.
- **`verify-e2e.ts` maps by `dirName`:** it assumes spec files live under `eval/scenarios/<dirName>/` and keys results by `scenario.name`/`dirName`. If Skillsmith reports nested `dirName`s (e.g. `plugins/cpt-register`), the join still resolves; the design must confirm/handle this (it's part of the Skillsmith dependency).
- **Two catalogs + two skills:** `eval/scenarios/_candidates.yaml` (Interactivity API) and `_wp-dev-candidates.yaml` (WordPress development) are discovery-skipped planning artifacts. Scenarios carry `skills: [<skill>]` — the iAPI set vs the wordpress-development set. The taxonomy must account for both skills' scenarios.

## agent-skills topics (Part 2 input — 17 skills, fetched this session)

`blueprint`, `wordpress-router`, `wp-abilities-api`, `wp-abilities-audit`, `wp-abilities-verify`, `wp-block-development`, `wp-block-themes`, `wp-interactivity-api`, `wp-performance`, `wp-phpstan`, `wp-playground`, `wp-plugin-development`, `wp-plugin-directory-guidelines`, `wp-project-triage`, `wp-rest-api`, `wp-wpcli-and-ops`, `wpds`.

First-pass mapping (research to verify): **covered** → wp-plugin-development (Plugins), wp-block-development (Block Editor), wp-block-themes (Themes, partial), wp-interactivity-api (iAPI), wp-rest-api (REST API); **deferred-area** → blueprint + wp-playground (Playground, off-domain), wp-wpcli-and-ops (WP-CLI off-domain + Advanced-Admin ops); **likely GAPS** → wp-abilities-api/audit/verify (Abilities API), wp-performance (Performance), wp-phpstan (static analysis), wordpress-router (routing), wp-plugin-directory-guidelines, wp-project-triage, wpds (design system). Coding Standards has no direct agent-skills counterpart (wp-phpstan is adjacent).

## Constraints

- **Skill (`skills/`) not modified.** Scenario `scenario.yaml` prompt/acceptance **preserved verbatim** through any move/rename. The iAPI `_candidates.yaml` and the wp-dev `_wp-dev-candidates.yaml` are updated only as needed to reflect the new organization + the gap stubs.
- This review **moves/renames existing scenarios** (the first to do so) — that is the explicit ask; do it cleanly (git mv), keeping each scenario runnable: e2e import depth fixed, Playwright still collects, YAML still parses.
- **Document the Skillsmith dependency** precisely (what nested-discovery support the pin needs) so the owner's upstream issue is actionable; do NOT silently fall back to pseudo-folders.
- Part 2 ships **no new scenarios** — only the coverage map + **review-triggerable gap stubs** in the catalog(s). Define a clear, consistent stub shape/marker so each gap can later kick off a review (mirroring how the existing area stubs fed reviews 1–9).
- Verification: scenarios discoverable (by the intended post-change mechanism) / e2e collectable by Playwright / YAML parses / catalogs consistent; static-structural where Skillsmith discovery can't be exercised locally (node_modules not installed here).

## Key design questions (for phases 1–2 to resolve)

1. **The topic taxonomy + folder layout.** What are the top-level topic folders, and does the structure split by **skill first** (`interactivity-api/…` vs `wordpress-development/…`) then topic, or by **topic only** (iAPI as one topic)? Map every existing scenario to a folder.
2. **Naming inside folders.** Do scenarios **drop the now-redundant `<area>-*` prefix** (e.g. `common-apis/rewrite-rule`) — which changes `scenario.yaml` `name` (the plugin-slug fragment) and the catalog record `name` — or keep the prefix for stability? Weigh cleanliness vs. churn/slug-stability.
3. **Catalog(s) reorganization.** How the two catalogs reflect the new folder structure (paths/names) and host the Part-2 gap stubs as review-triggerable entries.
4. **Docs.** README (and any prose) describing scenario discovery / the flat layout / the candidate catalogs will likely change — this is expected to be the first review with real doc changes.
