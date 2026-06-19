# Review: remaining areas (Code Reference + Advanced Administration) — sweep completion

## Origin

This review continues the owner's standing instruction (given when kicking off review-2):

> Kick off the next review and don't ask me for the next ones. Make sure they explore the possibility of using folders.

Boundaries (standing instruction, applied here):
- **This is the sweep-completion review** — it assesses the **final two** uncovered top-level developer.wordpress.org areas so all 10 are accounted for. They are assessed **together** because both are expected clean defers of the same class (on-domain, but not plugin-code-buildable scenario areas); a combined lean assessment is proportionate to that.
- **Areas covered so far:** Plugins, Block Editor, REST API, Themes, Common APIs, Coding Standards (implemented); WP-CLI, WordPress Playground (deferred — off-domain grounding). **Remaining (this review): Code Reference, Advanced Administration.**
- **The folders question is resolved** (review-2): adopted `<area>-*` naming; applied only if anything ships.

Convenience link: https://github.com/Automattic/wordpress-skill-experiments/issues/36 (PR #37).

## Goal

Assess the final two areas and, where viable, ship a simple doc-driven scenario; otherwise **defer with a recorded finding** + an honest deferred stub (mirroring review-6 WP-CLI / review-8 Playground). Either way, complete the exhaustive 10-area sweep.

## Constraints

- Build on the existing taxonomy + catalog (promote a stub to a full record if an area ships; replace it with an honest deferred stub if deferred). Do not rebuild the taxonomy.
- Scenarios stay **simple**, user-voice, **tool-agnostic**, `rubrics: []`, grounded in developer.wordpress.org.
- The **skill is not modified.** Existing scenarios, the iAPI `_candidates.yaml`, and non-target catalog records untouched. Static/structural verification only. Apply `<area>-*` naming only if something ships.

## Assumptions / directions to explore — per area

*(open — research resolves these; the disposition follows. NOTE: both areas are ON-domain, so this is NOT the off-domain policy — the question is area-shape / harness feasibility.)*

### Code Reference (https://developer.wordpress.org/reference/)
- The Code Reference is the **API reference index** (functions, hooks, classes, methods) that underlies *every other area* — not a distinct buildable topic. Its existing stub `code-reference-hook-lookup` ("use the Code Reference to find hooks and document their parameters") is a **research/documentation meta-task**, not a plugin-code deliverable.
- **Key question:** is there ANY simple scenario genuinely *unique* to "Code Reference" — i.e. a plugin-code deliverable that isn't just "use a documented function/hook," which every existing Plugins/Common-APIs/REST scenario already does? If the only scenarios are "look something up / document it" (no plugin deliverable) or duplicate other areas' usage, **defer** (Code Reference is the cross-cutting index, not a scenario area).

### Advanced Administration (https://developer.wordpress.org/advanced-administration/)
- Covers **server/operations** topics: security hardening, multisite, debugging, performance, backups, `wp-config.php`. Its existing stub `wp-config-custom-constant` targets **`wp-config.php`** — a **site-config artifact the plugin scaffold (`index.php` + `block.json`) cannot ship** (the same harness wall as the theme.json and Playground-blueprint deferrals).
- **Key question:** does ANY Advanced-Administration sub-topic yield a **simple, on-domain-grounded, plugin-shippable (`index.php`) deliverable** that is genuinely "advanced administration" and not (a) a server/config artifact the plugin scaffold cannot ship, nor (b) already covered by an existing area? If not, **defer** (ops/config, not plugin-code development).

**Disposition rule (per area, independent):** ship at most **one** simple scenario for an area ONLY if a genuinely area-unique, on-domain-grounded, plugin-shippable, simple scenario exists. Otherwise **defer** that area with a recorded reason + honest deferred stub. The expected outcome is **defer both** (completing the sweep); a viable scenario, if found, is welcome. Keep this review lean.
