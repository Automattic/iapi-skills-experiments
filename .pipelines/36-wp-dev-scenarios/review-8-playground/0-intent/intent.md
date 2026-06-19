# Review: WordPress Playground area scenarios

## Origin

This review continues the owner's standing instruction (given when kicking off review-2):

> Kick off the next review and don't ask me for the next ones. Make sure they explore the possibility of using folders.

Boundaries (standing instruction, applied here):
- **Continue area-by-area coverage autonomously** — one top-level area per review, no pausing to ask between reviews.
- **This review's area: WordPress Playground** (Documentation → https://developer.wordpress.org/playground/). Areas implemented: Plugins, Block Editor, REST API, Themes, Common APIs, Coding Standards. WP-CLI was **deferred** (off-domain grounding — owner-confirmed). Remaining after this: Code Reference, Advanced Administration.
- **The folders question is already resolved** (review-2): adopted `<area>-*` pseudo-folder naming. This review applies it (`playground-*`).

Convenience link: https://github.com/Automattic/wordpress-skill-experiments/issues/36 (PR #37).

## Goal

Assess and (where viable) extend coverage to the **WordPress Playground** area with a simple, documentation-driven scenario, building on the existing taxonomy and catalog (promoting the existing stub `playground-blueprint-plugin-load`, not rebuilding the taxonomy). If the area is not viable under the established constraints, **defer it with a recorded finding** (mirroring review-6 WP-CLI), applying the policy the owner already set.

## Constraints

- **Build on prior artifacts:** reuse the existing taxonomy + catalog; **promote the existing `playground-blueprint-plugin-load` stub** to a full record if the area ships, or replace it with an honest deferred stub if deferred; do not rebuild the taxonomy.
- Scenarios stay **simple** (one concept), user-voice, **tool-agnostic** prompts, `rubrics: []`, grounded in developer.wordpress.org.
- The **skill (`skills/wordpress-development/`) is not modified.**
- **One area (WordPress Playground) this review;** remaining areas are subsequent reviews.
- **Apply the adopted `playground-*` pseudo-folder naming** (dir == `scenario.yaml` name == catalog record name; flat, `/^[a-z0-9-]+$/`). Existing scenarios are NOT renamed.
- Static/structural verification only; existing scenarios, the iAPI `_candidates.yaml`, and non-Playground catalog records untouched.

## Assumptions / directions to explore — TWO load-bearing questions

*(open — research resolves these; the disposition follows from them)*

1. **Grounding (the WP-CLI question, applied here).** The Playground area's lone on-domain catalog `source_files` entry is a **resources hub** (https://developer.wordpress.org/playground/wordpress-playground-resources/). Determine, with sourced evidence, whether the actual **Blueprint JSON API** (the `steps`, `installPlugin`, `login`, etc. reference) is documented **ON developer.wordpress.org**, or only **off-domain** (the Playground docs site / wordpress.github.io). The suite's on-domain grounding has been a never-broken invariant (broken nowhere; WP-CLI was deferred to preserve it). **If the Blueprint API is off-domain, apply the ESTABLISHED off-domain-defer policy the owner already set for WP-CLI — defer to preserve the on-domain invariant, record the finding, leave an honest deferred stub. Do NOT re-ask the owner** (the policy is settled); just record that it follows the WP-CLI precedent.

2. **Harness feasibility.** The Skillsmith scaffold builds a **plugin** (`plugin-<scenario>-<agentId>`) tested via wp-env/Playwright; it does **not** run WordPress Playground. A Playground **Blueprint is a JSON artifact**, not plugin PHP. Assess whether a Playground scenario fits the eval model as **judge-only** (the testing agent authors a `blueprint.json`-style deliverable instead of plugin code; an LLM judge grades it against `acceptance`) — or whether the JSON-artifact-as-deliverable is a poor fit for the plugin-scaffold harness (analogous to the Themes theme-artifact-bound deferrals in review-4). Record the verdict.

**Disposition rule:** ship at most **one** simple judge-only Playground scenario (promote the stub) **only if** the Blueprint API is on-domain-groundable AND the JSON-blueprint deliverable is cleanly judge-gradeable in the harness model. Otherwise **defer** with a recorded reason + honest deferred stub (WP-CLI precedent). A defer is an acceptable, honest outcome for a marginal area. Keep this review lean.
