# Spec Research

## Rough Idea

Review the WordPress Playground area and extend coverage to it with a simple, documentation-driven scenario, building on the existing taxonomy and catalog (promoting the existing stub `playground-blueprint-plugin-load`, not rebuilding the taxonomy). If the area is not viable under the established constraints, defer it with a recorded finding (mirroring review-6 WP-CLI), applying the policy the owner already set.

Two load-bearing questions determine the disposition:

1. **Grounding:** Is the Blueprint JSON API (`steps`, `installPlugin`, `login`, etc.) documented on developer.wordpress.org, or only off-domain (the Playground docs site / wordpress.github.io)?
2. **Harness feasibility:** Can a Playground Blueprint (a JSON artifact, not plugin PHP) be expressed as a judge-only scenario in the plugin-scaffold model?

**Disposition rule:** ship at most one simple judge-only scenario only if BOTH clear. Otherwise defer with a recorded reason + honest deferred stub (WP-CLI precedent).

## Q&A

### Q1: Is the Blueprint JSON API (the `steps`, `installPlugin`, `login`, etc. reference) documented on developer.wordpress.org, or only off-domain?

**A:** OFF-DOMAIN. There is no on-domain Blueprint API reference. (All evidence curl-verified this session.)

- **(a)** `developer.wordpress.org/playground/` exists but carries NO API-reference content of its own — it returns HTTP 301 and redirects to `wordpress.github.io/wordpress-playground/` (the off-domain Playground docs site). Verified: `curl -sI -L` showed `HTTP/2 301 / location: https://wordpress.github.io/wordpress-playground/`.
- **(b)** There is NO on-domain Blueprint step reference. Every `developer.wordpress.org/playground/*` path probed 301-redirects off-domain (`/playground/blueprints/`, `/blueprints/steps/`, `/blueprints/data-format/`, `/blueprints/getting-started/`, `/api/blueprints/`, `/developers/` — all 301 → `wordpress.github.io`). On-domain alternates outside `/playground/` are 404 (`developer.wordpress.org/reference/blueprints/` → 404, `developer.wordpress.org/docs/playground/` → 404). The real step reference (`installPlugin`, `installTheme`, `runPHP`, `login`, `setSiteOptions`, etc.) lives ONLY at `wordpress.github.io/wordpress-playground/blueprints/steps/` — verified that page's body contains those step names. (It is a client-rendered Docusaurus SPA — off-domain JS docs, not WP content reframed on-domain.)
- **(c)** The existing catalog stub's lone `source_files` entry is `https://developer.wordpress.org/playground/wordpress-playground-resources/` (`eval/scenarios/_wp-dev-candidates.yaml` line 488). That exact URL ALSO 301-redirects to `wordpress.github.io/wordpress-playground/` — it is a resources hub that bounces off-domain, NOT a Blueprint API reference. This matches the intent's framing exactly.

**Reasoning:** This is the WP-CLI grounding question applied to Playground, and the answer is the same shape: the genuine API is documented only off developer.wordpress.org. The suite's on-domain grounding has been a never-broken invariant (77/77 catalog URLs on-domain; WP-CLI was deferred precisely to preserve it). Per the settled WP-CLI policy this triggers a DEFER — record the finding, leave an honest deferred stub, do NOT re-ask the owner. This is the decisive question; per the intent, no further grounding questions are needed.

**Sources:** `curl -sI -L` on `developer.wordpress.org/playground/`, `developer.wordpress.org/playground/wordpress-playground-resources/`, and the other `/playground/*` paths (all 301 → `wordpress.github.io/wordpress-playground/`); `wordpress.github.io/wordpress-playground/blueprints/steps/` (contains the step-name reference); 404 checks on `developer.wordpress.org/reference/blueprints/` and `/docs/playground/`; `eval/scenarios/_wp-dev-candidates.yaml` line 488 (stub `source_files`).

### Q2: Can a Playground Blueprint (a JSON artifact, not plugin PHP) be expressed as a judge-only scenario in the plugin-scaffold harness model?

**A:** Poor fit — a second, independent reason to defer.

- The scaffold (`eval/utils/scaffold-plugin.ts`) builds a PLUGIN (`index.php` + `block.json`); the harness never runs WordPress Playground and has no mechanism to consume a `blueprint.json`.
- A Blueprint is a JSON artifact, not plugin PHP — the same shape as the review-4 `theme.json` defer (an artifact the plugin scaffold cannot ship).
- A judge-only path is technically conceivable (the agent writes `blueprint.json`, an LLM judge grades it against `acceptance`), BUT there is no precedent: zero existing scenario has a non-PHP / non-plugin deliverable. All existing judge-only scenarios (e.g. `cron-event`, `common-apis-options`) still deliver PLUGIN PHP and the judge grades that code; none grade a standalone JSON artifact.

**Reasoning:** Even setting grounding aside, the Blueprint deliverable has no clean fit in the plugin-scaffold model: the deliverable is a JSON artifact the scaffold cannot ship, and a JSON-artifact-as-deliverable judge-only scenario would be a first-of-its-kind departure (analogous to the review-4 theme-artifact-bound deferrals). This is an independent defer reason layered on top of the off-domain grounding — the disposition is doubly determined.

**Sources:** `eval/utils/scaffold-plugin.ts` (plugin scaffold builds `index.php` + `block.json`); review-4 themes `theme.json` defer precedent; scan of existing judge-only scenarios (all deliver plugin PHP).

## Research

### Disposition: DEFER the WordPress Playground area (no scenario implemented), recorded as an honest deferral

Both load-bearing questions point to defer, and either alone would be sufficient:

1. **Grounding (decisive):** The Blueprint JSON API is documented only off developer.wordpress.org (`wordpress.github.io/wordpress-playground/blueprints/steps/`). The entire on-domain `/playground/*` namespace — including the stub's lone `source_files` URL — is a 301 redirect off-domain. The suite's on-domain grounding invariant has never been broken; per the settled WP-CLI policy, off-domain ⇒ defer, no owner re-ask. (Q1)
2. **Harness feasibility (independent reinforcement):** A Blueprint is a JSON artifact the plugin scaffold cannot ship, and no existing scenario grades a non-plugin/non-PHP deliverable. The JSON-blueprint-as-deliverable is a poor fit for the harness, mirroring the review-4 theme-artifact-bound deferrals. (Q2)

This mirrors review-6 (WP-CLI): no new scenario, record the finding, and replace the existing stub with an honest deferred stub citing the off-domain grounding — the same shape as `wp-cli-custom-command` / the `theme.json` deferred stub. Because nothing is implemented, the catalog header line (listing areas with full prompt+acceptance records) is NOT changed. The iAPI `_candidates.yaml`, all non-Playground records, and the skill are untouched. A defer is an acceptable, honest outcome for this marginal area.

## Consolidated Requirements

### A. Outcome of the review

1. **No WordPress Playground scenario is implemented this review.** The review ships no new `eval/scenarios/playground-*/` directory, no `scenario.yaml`, and no `e2e.spec.mjs` for the WordPress Playground area. The area's only output is a recorded deferral in the candidate catalog plus the decision rationale in this spec and the design doc.

2. **The deferral is an honest, evidence-backed call, not an omission.** The review records *why* the WordPress Playground area cannot be cleanly covered under current constraints, citing both findings: (a) the Blueprint JSON API is documented only off developer.wordpress.org, and (b) a Blueprint is a JSON artifact that is a poor fit for the plugin-scaffold judge model. Either reason alone is sufficient to defer.

### B. Why the area is deferred

3. **Grounding reason (decisive): the Blueprint API is off-domain only.** The Blueprint JSON step reference (`steps`, `installPlugin`, `installTheme`, `runPHP`, `login`, `setSiteOptions`, etc.) is documented only at `wordpress.github.io/wordpress-playground/`; the entire `developer.wordpress.org/playground/*` namespace — including the existing stub's lone `source_files` URL (`https://developer.wordpress.org/playground/wordpress-playground-resources/`) — 301-redirects off-domain. Shipping a Playground scenario would require grounding off developer.wordpress.org, which the suite's never-broken on-domain invariant forbids; this applies the settled WP-CLI off-domain-defer policy with no owner re-ask.

4. **Harness reason (independent): the JSON-blueprint deliverable is a poor fit.** The plugin scaffold builds a plugin (`index.php` + `block.json`) and the harness never runs Playground, so a Blueprint (a standalone JSON artifact) cannot be shipped or graded the way existing deliverables are. No existing scenario — including judge-only ones — grades a non-plugin/non-PHP artifact; a JSON-blueprint-as-deliverable would be a first-of-its-kind departure, analogous to the review-4 theme-artifact-bound deferrals. This is a second, independent defer reason.

### C. Catalog update (the review's only file change to `eval/scenarios/`)

5. **The `playground-blueprint-plugin-load` stub is replaced with an honest deferred stub.** Under its WordPress Playground area header, the existing stub is annotated with a `# Deferred:` comment whose reason records the off-domain Blueprint-API grounding (and may also note the JSON-artifact harness mismatch), mirroring the `wp-cli-custom-command` / `theme.json` deferred-stub shape. It remains a stub (no full `prompt`/`acceptance`, no shippable full record); nothing is implemented, so no shipped record points off-domain. Whether to keep the legacy name `playground-blueprint-plugin-load` or adjust it is a design/plan decision; either way the name matches `/^[a-z0-9-]+$/` and the `playground-*` prefix convention, and no existing scenario is renamed.

6. **The deferred stub's reason and pointers are recorded honestly.** The `# Deferred:` comment states that the genuine Playground/Blueprint capability is documented only off developer.wordpress.org and that the suite's on-domain grounding invariant is the (primary) blocker, with the JSON-artifact-vs-plugin-scaffold mismatch as a reinforcing harness reason. The off-domain docs URL (`wordpress.github.io/wordpress-playground/`) MAY be cited inside the `# Deferred:` comment as the pointer to where the capability is documented; the record nonetheless stays a deferred stub. Exact comment wording is a design/plan/code decision.

7. **The catalog header line is NOT changed.** The header comment listing areas with full prompt+acceptance records (Plugins, Block Editor, REST API, Themes, Common APIs, Coding Standards) is left unchanged, because this review ships no full Playground record. No other header change is made.

8. **No other catalog content is touched.** Within `_wp-dev-candidates.yaml`, only the single WordPress Playground stub entry (re-annotated with `# Deferred:`) changes; no other area's records — and no other Playground content beyond that one stub — are added, moved, renamed, promoted, or annotated. The Interactivity-API catalog `eval/scenarios/_candidates.yaml` is not modified.

### D. Naming and conventions (carried forward, applied to the stub)

9. **`playground-*` pseudo-folder naming is preserved on the stub.** The stub's `name` carries the `playground-` prefix and matches `/^[a-z0-9-]+$/`, consistent with the adopted convention. No existing scenario is renamed. (No scenario directory is created this review, so the dir == name == catalog-name identity rule is moot for Playground here; it would apply only if the stub is later promoted.)

### E. Non-disruption and done-criteria

10. **The skill is untouched.** No file under `skills/wordpress-development/` is modified.

11. **The existing suite is intact and flat discovery is preserved.** No existing scenario (Interactivity API, v1, Plugins, Block Editor, REST API, Themes, Common APIs, Coding Standards) is moved, renamed, reorganized, or broken; Skillsmith's flat discovery under `eval/scenarios/` continues to enumerate them unchanged.

12. **Verification is static/structural only; no grading run.** The review's correctness is checked by inspecting the catalog edit (the Playground stub is a well-formed YAML deferred stub with a `# Deferred:` reason, the header line is unchanged, no other records changed, no new scenario directory exists) and confirming the skill and existing scenarios are untouched. No agent runs the `scenarios × testing-agents` matrix, boots wp-env for a pass, or generates plugin code.

### F. Out-of-scope recommendations (recorded, not acted on)

13. **Unblockers for a future WordPress Playground scenario are surfaced as recommendations, not implemented.** Recorded for a future review/owner decision: (a) if Blueprint/Playground documentation lands on developer.wordpress.org, the area becomes on-domain-groundable; and/or (b) if the harness gains a way to ship and grade a standalone `blueprint.json` deliverable (a Playground-aware scenario type), the JSON-artifact fit problem is resolved. Both would be needed to promote the deferred stub to a full judge-only `playground-*` record. Neither is decided or implemented in this review; the owner may also explicitly rule that off-domain Playground-docs grounding is acceptable, which would address reason (a) alone.

