# Spec Research

## Rough Idea

Sweep-completion review assessing the final two uncovered top-level developer.wordpress.org areas — **Code Reference** and **Advanced Administration** — to determine whether each yields a viable, simple, plugin-shippable scenario, or should be deferred with a recorded finding.

Both areas are ON-domain. The disposition question is **area-shape / harness feasibility** — not the off-domain grounding policy applied to WP-CLI and Playground.

- **Code Reference** (`developer.wordpress.org/reference/`): The API reference index (functions, hooks, classes, methods) underlying every other area. Key question: is there any scenario genuinely unique to "Code Reference" — a plugin-code deliverable that is not just "use a documented function/hook" (already covered by Plugins / Common APIs / REST) and not a research/documentation meta-task?
- **Advanced Administration** (`developer.wordpress.org/advanced-administration/`): Covers server/operations topics: security, multisite, debugging, performance, `wp-config.php`. Key question: does any sub-topic yield a simple, on-domain-grounded, plugin-shippable (`index.php`) deliverable that is not a server/config artifact the scaffold cannot ship and not already covered?

Disposition rule (per area, independent): ship at most one simple scenario only if a genuinely area-unique, on-domain-grounded, plugin-shippable scenario exists. Otherwise defer with a recorded finding + honest deferred stub (mirroring review-6 WP-CLI / review-8 Playground).

## Q&A

### Q1: For Code Reference — is there any scenario genuinely unique to it that produces a plugin-code deliverable (not "look up a function and use it," which every existing area already does, and not a research/documentation meta-task)?

**A:** NO. No scenario unique to Code Reference yields a plugin-code deliverable. DEFER.

- The Code Reference (`developer.wordpress.org/reference/`, verified this session) is a pure API reference INDEX. Two sections only: "New and updated in 7.0" (recent funcs/hooks, e.g. `add_theme_support()`, `resolve_pattern_blocks()`) and an "API reference" categorical link hub (Database, Filesystem, REST/XML-RPC, Plugin/Theme, Settings/Options/Metadata, Dashboard Widgets, Rewrite, Transients, HTTP, Globals). It is a navigational gateway to per-symbol pages (functions/hooks/classes/methods), not a tutorial hub with buildable-topic content of its own.
- Every per-symbol page documents ONE function/hook/class/method. "Build a plugin using documented symbol X" is exactly what every existing Plugins/Common-APIs/REST scenario already does — they cite `reference/functions/*` URLs as `source_files` (e.g. `common-apis-http-request` cites `reference/functions/wp_remote_get/`). Code Reference is the shared substrate UNDER those areas, not a parallel area.
- The only thing genuinely unique to Code Reference is the act of looking up / navigating / documenting symbols — precisely the existing stub `code-reference-hook-lookup` ("find all actions/filters fired during `wp_head` and document their parameters"), a research/doc META-task that produces no plugin deliverable (output is documentation, not `index.php`), so it cannot be graded as plugin code.
- The two options collapse: (a) "use a documented symbol" duplicates every other area (the symbol always belongs to an already-covered API — Options/Transients/HTTP/REST/CPT/etc.), or (b) "look up / document symbols" is a meta-task with no plugin deliverable. The set "unique to Code Reference AND yields a gradeable `index.php`" is empty.

**Reasoning:** Defer. The class differs from WP-CLI/Playground: this is NOT off-domain (it IS the canonical on-domain root) and NOT a harness/artifact wall. The defer reason is **cross-cutting-index / non-distinct-area** — Code Reference is the API index underlying every other area, so any buildable scenario reduces to an existing area's deliverable, and the only Code-Reference-unique task is a no-deliverable lookup/doc meta-task. Mirror the deferred-stub pattern (annotate `code-reference-hook-lookup` with a `# Deferred:` reason).

**Sources:** `developer.wordpress.org/reference/` (WebFetch, this session — index structure + category list); `eval/scenarios/_wp-dev-candidates.yaml` line 493 (stub `code-reference-hook-lookup`, TODO prompt+acceptance, no deliverable) and line 422 (`common-apis-http-request` already cites `reference/functions/wp_remote_get/`); intent.md Code Reference key-question.

### Q2: For Advanced Administration — does any sub-topic yield a simple, on-domain-grounded, plugin-shippable (`index.php`) deliverable that is genuinely "advanced administration," NOT a server/config artifact the plugin scaffold cannot ship (the `wp-config.php` wall), and NOT already covered by an existing area?

**A:** NO viable scenario. DEFER. (Confirmed: the scaffold cannot ship `wp-config.php`; plugins can only READ its constants, not define them.)

Per-topic verdict (verified, `developer.wordpress.org/advanced-administration/*`):
- Before You Install (server prep, dev copy, multi-instance) — CONFIG-WALL (server/ops, not `index.php`).
- Upgrading (core/network update) — CONFIG-WALL (operator task, no plugin deliverable).
- Server config (`.htaccess`, `nginx.conf`, `web.config`, mod_rewrite) — CONFIG-WALL (server-root artifacts, scaffold can't ship).
- `wp-config.php` constants (the stub's target) — CONFIG-WALL (site-root file; plugins can only READ constants, not define them — verified).
- Security / Hardening — file-perms / `.htaccess` / BasicAuth / HTTPS / DB-privs = CONFIG-WALL (server); `DISALLOW_FILE_EDIT` = CONFIG-WALL (wp-config constant); nonces / sanitization / escaping / cap-checks = DUPLICATE (Plugins + REST `rest-api-permission-check`). No survivor.
- Performance / Optimization (caching, `WP_MEMORY_LIMIT`, `WP_CACHE`, PHP version) — CONFIG-WALL (wp-config + server tuning).
- Debug (`WP_DEBUG`, `WP_DEBUG_LOG`, `WP_DEBUG_DISPLAY`, `SCRIPT_DEBUG`, `SAVEQUERIES`) — CONFIG-WALL (all wp-config constants); `error_log()` wrapper = weak/generic-PHP, not distinctively advanced-admin.
- Multisite / Network (prepare, create-network, admin, domain-mapping, migrate) — CONFIG-WALL (needs `WP_ALLOW_MULTISITE` in wp-config + `.htaccess`/nginx + network install; not a single-plugin deliverable).
- Mail / Cookies — CONFIG-WALL (server/config). Backups — CONFIG-WALL (operator/server DB+files procedure, no plugin deliverable).

The two plugin-adjacent threads, and why both fail:
1. **`wp-config.php` constants** (the stub `wp-config-custom-constant` targets this). Hard wall, confirmed: `wp-config.php` lives in the WordPress root, edited by the site administrator. Plugins cannot define/modify its constants — they can only read values already defined there (verified on the wp-config page). The scaffold (`scaffold-plugin.ts`) ships only `index.php` + `block.json` (+ a `block.json` under `src/blocks`) — no site-root files. So every wp-config deliverable (`WP_DEBUG`, `DISALLOW_FILE_EDIT`, `WP_MEMORY_LIMIT`, `FORCE_SSL_ADMIN`, `table_prefix`, salts, `WP_ALLOW_MULTISITE`, `DISABLE_WP_CRON`, …) is unshippable — the SAME harness wall as `theme.json` (review-4) and the Playground blueprint (review-8): a site-root artifact the plugin scaffold cannot ship.
2. **Security / Hardening.** File permissions (chmod), wp-config protection, securing wp-includes/wp-admin (mod_rewrite, HTTPS), DB privilege restriction — all SERVER artifacts. The only "WordPress-level" measure is `DISALLOW_FILE_EDIT`, a wp-config constant (wall #1). Everything a plugin could genuinely do in PHP that is security-shaped (nonces, sanitization, escaping, capability/permission checks, validation) is NOT advanced administration — it is standard plugin security already in Plugins-area scope and REST permission checks (`rest-api-permission-check` exists). So security/hardening yields either server artifacts (can't ship) or plugin security that duplicates existing areas. Empty set.

Debug thread: the wp-config debug constants are all wall #1; the one plugin-PHP angle (a custom `error_log()` wrapper for formatted logging) is a trivial generic-PHP logging helper, not meaningfully "advanced administration" and not a distinctive on-domain advanced-admin capability — weak/duplicative, not a clean unique scenario.

**Reasoning:** Defer, doubly determined like Playground: harness wall (`wp-config.php`/`.htaccess`/nginx are site-root/server artifacts the scaffold cannot ship) + overlap (the only plugin-PHP residue is generic security/logging already in Plugins/REST scope). Grounding IS on-domain here (it is developer.wordpress.org), so the defer reason is **harness-wall + overlap**, NOT off-domain (differs from WP-CLI/Playground). Annotate the `wp-config-custom-constant` stub with a `# Deferred:` reason.

**Sources:** `developer.wordpress.org/advanced-administration/` landing, `.../security/hardening/`, `.../debug/debug-wordpress/`, `.../wordpress/wp-config/`, `.../multisite/*`, `.../performance/optimization/` (WebFetch/WebSearch, this session); `eval/utils/scaffold-plugin.ts` (ships `index.php` + `block.json` only, no site-root files); `eval/scenarios/_wp-dev-candidates.yaml` line 434 (`wp-config-custom-constant` stub, TODO, targets `wp-config.php`) and `rest-api-permission-check` (existing security coverage); intent.md Advanced Administration key-question + `theme.json` harness-wall precedent.

## Research

### Disposition: DEFER both areas (no scenario implemented), each recorded as an honest deferral

Both areas defer, and each is doubly determined.

**Code Reference — defer (cross-cutting-index / non-distinct-area).** Code Reference is the API reference index underlying every other area, not a parallel buildable topic. Any buildable scenario reduces to "use documented symbol X," which duplicates an already-covered area (the symbol always belongs to Options/Transients/HTTP/REST/CPT/etc.), while the only Code-Reference-unique task — looking up / documenting symbols (the existing `code-reference-hook-lookup` stub) — is a research/doc meta-task that produces no `index.php` deliverable and cannot be graded as plugin code. The intersection "unique to Code Reference AND yields a gradeable `index.php`" is empty. Note: this is NOT off-domain (it is the canonical on-domain root) and NOT a harness/artifact wall — the reason is non-distinct-area.

**Advanced Administration — defer (harness-wall + overlap).** No sub-topic yields a simple, on-domain-grounded, plugin-shippable (`index.php`) deliverable that is genuinely advanced administration and not (a) a server/site-config artifact the scaffold cannot ship, nor (b) already covered. The two plugin-adjacent threads both fail: `wp-config.php` constants hit the site-root harness wall (plugins can only read, not define them — same wall as `theme.json`/blueprint), and security/hardening yields either server artifacts (unshippable) or plugin security that overlaps Plugins/REST. Grounding is on-domain; the defer reason is harness-wall + overlap, NOT off-domain.

This mirrors review-6 (WP-CLI) and review-8 (Playground): no new scenario, record the finding, and replace each area's existing stub with an honest deferred stub citing the area-specific reason — the same shape as `wp-cli-custom-command` / `playground-blueprint-plugin-load` / the `theme.json` deferred stub. Because nothing is implemented, the catalog header line is NOT changed. The iAPI `_candidates.yaml`, all non-target records, and the skill are untouched. A defer is an acceptable, honest outcome for both marginal areas.

**Sweep completion.** This review assesses the final two of the ten top-level developer.wordpress.org areas. With both deferred, the exhaustive 10-area sweep is complete: Plugins, Block Editor, REST API, Themes, Common APIs, Coding Standards (implemented); WP-CLI, WordPress Playground (deferred — off-domain grounding); Code Reference (deferred — cross-cutting index); Advanced Administration (deferred — harness wall + overlap).

## Consolidated Requirements

### A. Outcome of the review

1. **No new scenario is implemented this review.** No `eval/scenarios/code-reference-*/` or `eval/scenarios/advanced-administration-*/` directory, `scenario.yaml`, or `e2e.spec.mjs` is created. Both areas' only output is a recorded deferral in the candidate catalog plus the decision rationale in this spec and the design doc.

2. **Each area is deferred independently, as an honest evidence-backed call.** Code Reference and Advanced Administration are each assessed against their own key question and each deferred for its own recorded reason; neither defer is an omission.

### B. Why each area is deferred

3. **Code Reference — cross-cutting-index / non-distinct-area.** Code Reference (`developer.wordpress.org/reference/`) is the API reference index (functions, hooks, classes, methods) that underlies every other area, not a parallel buildable topic. Any plugin-buildable scenario reduces to "use documented symbol X," which duplicates an already-covered area; the only Code-Reference-unique task is a lookup/documentation meta-task (the existing `code-reference-hook-lookup` stub) that yields no `index.php` deliverable and cannot be graded as plugin code. The set "unique to Code Reference AND gradeable as `index.php`" is empty. This is NOT off-domain (it is the canonical on-domain root) and NOT a harness/artifact wall.

4. **Advanced Administration — harness-wall + overlap.** No Advanced-Administration sub-topic (`developer.wordpress.org/advanced-administration/`) yields a simple, on-domain-grounded, plugin-shippable (`index.php`) deliverable that is genuinely advanced administration and not already covered. The `wp-config.php` thread hits the site-root harness wall — `wp-config.php` is a WordPress-root file edited by the administrator; plugins can only read its constants, not define them, and the scaffold ships only `index.php` + `block.json`, no site-root files (same wall as `theme.json` / Playground blueprint). The security/hardening, server, performance, multisite, and debug threads are either server/site-config artifacts the scaffold cannot ship or plugin security/logging that overlaps existing Plugins/REST coverage. Grounding is on-domain; the defer reason is harness-wall + overlap, NOT off-domain.

### C. Catalog update (the review's only file change to `eval/scenarios/`)

5. **The `code-reference-hook-lookup` stub is replaced with an honest deferred stub.** Under its Code Reference area header, the existing stub is annotated with a `# Deferred:` comment recording the cross-cutting-index / non-distinct-area reason (Code Reference is the shared API index under every other area; any buildable scenario duplicates an existing area, and the lookup/doc task yields no plugin deliverable). It remains a stub (no full `prompt`/`acceptance`, no shippable record). Exact comment wording is a design/plan/code decision.

6. **The `wp-config-custom-constant` stub is replaced with an honest deferred stub.** Under its Advanced Administration area header, the existing stub is annotated with a `# Deferred:` comment recording the harness-wall + overlap reason (`wp-config.php` is a site-root admin file the plugin scaffold cannot ship — plugins can only read its constants, not define them; the area's other sub-topics are server-config or plugin security that overlaps existing areas). It remains a stub. Exact comment wording is a design/plan/code decision.

7. **The catalog header line is NOT changed.** The header comment listing areas with full prompt+acceptance records (Plugins, Block Editor, REST API, Themes, Common APIs, Coding Standards) is left unchanged, because this review ships no full record for either area. No other header change is made.

8. **No other catalog content is touched.** Within `_wp-dev-candidates.yaml`, only the two stub entries (`code-reference-hook-lookup` and `wp-config-custom-constant`, each re-annotated with `# Deferred:`) change; no other area's records are added, moved, renamed, promoted, or annotated. The Interactivity-API catalog `eval/scenarios/_candidates.yaml` is not modified.

### D. Naming and conventions (carried forward, applied to the stubs)

9. **Existing stub names and `<area>-*` conventions are preserved; nothing is renamed.** Both stub `name`s match `/^[a-z0-9-]+$/`. No existing scenario is renamed. No scenario directory is created this review, so the dir == name == catalog-name identity rule is moot here; `<area>-*` naming would apply only if a stub were later promoted.

### E. Non-disruption and done-criteria

10. **The skill is untouched.** No file under `skills/wordpress-development/` is modified.

11. **The existing suite is intact and flat discovery is preserved.** No existing scenario (Interactivity API, v1, Plugins, Block Editor, REST API, Themes, Common APIs, Coding Standards) is moved, renamed, reorganized, or broken; flat discovery under `eval/scenarios/` continues to enumerate them unchanged.

12. **Verification is static/structural only; no grading run.** Correctness is checked by inspecting the catalog edits (each stub is a well-formed YAML deferred stub with a `# Deferred:` reason, the header line is unchanged, no other records changed, no new scenario directory exists) and confirming the skill and existing scenarios are untouched. No agent runs the scenarios × testing-agents matrix, boots wp-env, or generates plugin code.

### F. Sweep completion and out-of-scope recommendations (recorded, not acted on)

13. **This review completes the exhaustive 10-area sweep.** All ten top-level developer.wordpress.org areas are now accounted for: Plugins, Block Editor, REST API, Themes, Common APIs, Coding Standards (implemented); WP-CLI, WordPress Playground (deferred — off-domain grounding); Code Reference (deferred — cross-cutting index); Advanced Administration (deferred — harness wall + overlap).

14. **Unblockers for future scenarios are surfaced as recommendations, not implemented.** Recorded for a future review/owner decision: (a) Code Reference could only become a distinct scenario area if the harness adopted a non-plugin "look up / document a symbol" deliverable type (a research/doc-graded scenario), which would be a first-of-its-kind departure; (b) Advanced Administration could become buildable if the harness gained a way to ship and grade site-root/server artifacts (`wp-config.php`, `.htaccess`) — the same unblocker the `theme.json` and Playground-blueprint deferrals need. Neither is decided or implemented in this review.
