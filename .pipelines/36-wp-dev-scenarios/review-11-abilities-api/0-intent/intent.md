# Review: Abilities API scenarios (campaign 1/9 — ship gaps + deferred areas)

## Origin

Owner directive: *"kick off reviews from the gaps. Include the deferred areas as well."* + (clarification) *"Relax constraints, ship all"* — permit **off-domain handbook grounding** and treat the **plugin-scaffold harness wall as a future-harness dependency** (ship the scenario now; record what the harness/skill must add). This reverses the earlier on-domain-only invariant. This is **review 1 of a ~9-review campaign** shipping scenarios for the 9 agent-skills gaps + the 4 deferred areas.

**This review's topic: the WordPress Abilities API** (agent-skills `wp-abilities-api`, `wp-abilities-audit`, `wp-abilities-verify`). Promote the 3 catalog gap stubs — `abilities-api-register`, `abilities-audit-rest-surface`, `abilities-verify-callbacks` — to full records.

Convenience link: https://github.com/Automattic/wordpress-skill-experiments/issues/36 (PR #37).

## Goal

Ship ~3 simple Abilities API scenarios, promoting the gap stubs to full records. e2e where feasible today, judge-only (with a recorded harness/skill dependency) otherwise.

## Constraints (relaxed per owner)

- **Off-domain grounding allowed** — cite the canonical Abilities API docs even if off developer.wordpress.org (e.g. the make.wordpress.org / WordPress GitHub / agent-skills sources). Record provenance honestly in `source_files`.
- **Harness-wall is a dependency, not a blocker** — if a scenario can't be exercised by the current plugin-scaffold/e2e harness, ship it **judge-only** and record the harness/skill dependency (like the Skillsmith nested-discovery note).
- **New folder layout applies:** new scenarios go in a real topic folder **`eval/scenarios/abilities-api/<scenario>/`**. e2e specs (now nested 3 levels deep) import `"../../../utils/wp-cli.mjs"` (3× `../`). Mirror the post-review-10 structure.
- Simple, user-voice, **tool-agnostic** prompts; explicit `rubrics: []`. Skill (`skills/`) untouched. Existing scenarios + iAPI `_candidates.yaml` untouched.

## Assumptions / directions to explore

- **The Abilities API** lets a plugin register named "abilities" (PHP `wp_register_ability` / the Abilities API) — discrete capabilities with input/output schemas and callbacks — often **discoverable/invocable over REST**. The 3 sub-topics:
  - **register** (`abilities-api-register`) — register an ability and expose it; **likely e2e-feasible** (assert the ability appears at / responds on its REST surface, like the existing REST scenarios — anon `page.request.get` / authed `requestUtils.rest`).
  - **audit** (`abilities-audit-rest-surface`) — audit a plugin's REST/ability surface and report; likely **judge-only** (analysis output).
  - **verify** (`abilities-verify-callbacks`) — verify ability registrations + callback behavior; likely **judge-only**.
- **Grounding:** determine where the Abilities API is canonically documented (developer.wordpress.org/reference if present; else make.wordpress.org / the WordPress/abilities-api GitHub / the agent-skills SKILL.md). Cite the best canonical source(s).
- Naming `abilities-api-*` (keep the stubs' names; dir == scenario.yaml name == catalog record name, inside `abilities-api/`). Verification static/structural + e2e-collectable where an e2e ships; pass not required.
