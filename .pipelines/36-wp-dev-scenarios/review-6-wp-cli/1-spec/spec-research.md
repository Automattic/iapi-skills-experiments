# Spec Research

## Rough Idea

Review the WP-CLI Commands area and extend the `wordpress-development` eval suite's coverage to it with simple, documentation-driven scenarios (~1 per major sub-area). Build on the existing taxonomy and catalog; promote the existing stub `wp-cli-eval-flush-rewrite` (or supersede it) to a full record; add new records. Apply the adopted `wp-cli-*` pseudo-folder naming. The `wpCli(args, { stdio: "pipe" })` channel returns stdout, enabling e2e assertions on WP-CLI output. Two candidate framings: (A) developing a custom WP-CLI command (`WP_CLI::add_command`), (B) using built-in WP-CLI commands to drive/verify a dev task. Key open questions: grounding (can framing A be grounded on developer.wordpress.org?), dedup (is the existing stub genuine WP-CLI coverage or CPT re-verification?), e2e vs judge-only split.

## Q&A

### Q1: Grounding — can each framing be grounded on developer.wordpress.org? (a) Is the built-in command reference fully on-domain? (b) Is the custom-command API (`WP_CLI::add_command`) on-domain or only off-domain?

**A:**
- **Framing (B), built-in commands: YES, fully on-domain — no caveat.** The complete command reference is at https://developer.wordpress.org/cli/commands/ (~45 command groups, each with its own page, subcommand pages, and example output). Verified: `wp post-type list`/`get` (https://developer.wordpress.org/cli/commands/post-type/, shows table output with name/public columns), `wp rewrite` with `flush` subcommand (https://developer.wordpress.org/cli/commands/rewrite/), `wp option get`/`update`/`add`/`list` (https://developer.wordpress.org/cli/commands/option/, e.g. `wp option get siteurl` prints the value). `wp post`, `wp taxonomy`, `wp eval` etc. also present.
- **Framing (A), custom-command API (`WP_CLI::add_command`): NO — not on developer.wordpress.org; off-domain only.** `WP_CLI::add_command()` reference: https://make.wordpress.org/cli/handbook/references/internal-api/wp-cli-add-command/. Commands Cookbook (writing-commands guide): https://make.wordpress.org/cli/handbook/guides/commands-cookbook/. A `site:developer.wordpress.org` search for `WP_CLI::add_command` returned zero hits for the PHP API.

**Reasoning:** https://developer.wordpress.org/cli/ is NOT a landing/overview page — it 301-redirects to https://developer.wordpress.org/cli/commands/cli/ (the `wp cli` command page). So the on-domain WP-CLI footprint is purely the built-in command reference; there is no on-domain "intro to writing commands" hub. The handbook/cookbook content is hosted at make.wordpress.org/cli/handbook/ (the intent said wp-cli.org; that is the project homepage, the actual handbook is on make.wordpress.org — either way off developer.wordpress.org). This mirrors the review-4 theme-scaffold situation: framing A would need a recorded grounding caveat (judge-only or deferred), or lean on framing B.

**Sources:** https://developer.wordpress.org/cli/commands/, https://developer.wordpress.org/cli/commands/post-type/, https://developer.wordpress.org/cli/commands/rewrite/, https://developer.wordpress.org/cli/commands/option/, https://make.wordpress.org/cli/handbook/references/internal-api/wp-cli-add-command/, https://make.wordpress.org/cli/handbook/guides/commands-cookbook/; curl -I -L on developer.wordpress.org/cli/ (301 redirect); `site:developer.wordpress.org` search.

### Q2: Is the existing stub `wp-cli-eval-flush-rewrite` genuine WP-CLI coverage, or is it the already-covered `cpt-register`/rewrite work re-verified through a CLI channel?

**A:** NOT genuine WP-CLI coverage. It is `cpt-register` (+ a bit of the rewrite work) re-verified through a CLI channel. The agent's deliverable would be "register a CPT and flush rewrite rules" — both already covered — and WP-CLI appears only in the test harness, not in what the agent must build. Per the intent's no-dup constraint, promoting it as-is violates the rule. `wp post-type list` is just an alternate assertion for the same `register_post_type` deliverable `cpt-register` already asserts via `/wp-json/wp/v2/books`. Recommendation: do NOT promote as-is — either repurpose the `wp-cli-eval-flush-rewrite` name to a real framing-B scenario whose *task* is genuinely CLI-shaped, or retire/rewrite the stub. The stub also bundles two unrelated concepts (CPT + rewrite-flush) that already map to two separate existing scenarios.

**Reasoning:** Evidence from the existing suite:
- `cpt-register` (eval/scenarios/cpt-register/scenario.yaml): prompt asks to "add a new content type for storing book entries, using the identifier `books`"; acceptance asserts `register_post_type()` on `init`, labels, `public => true` and `show_in_rest => true`, and "A GET request to `/wp-json/wp/v2/books` returns HTTP 200 when the plugin is active." So the CPT deliverable + its assertion are already covered.
- No scenario's task is "register a CPT and flush rewrite rules." Across all `eval/scenarios/*/scenario.yaml`: only `cpt-register` registers a CPT; only `common-apis-rewrite-rule` flushes rewrite rules (its acceptance pins "rewrite rules are flushed once when the plugin is activated"). So the stub's two task-halves are each already a separate existing scenario.

Genuine framing-B coverage needs a scenario whose *deliverable itself* is CLI-shaped, or whose verified behavior is not already asserted elsewhere — e.g. an outcome only a built-in command surfaces, or (framing A) a plugin that registers its own `wp` command.

**Sources:** eval/scenarios/cpt-register/scenario.yaml, eval/scenarios/common-apis-rewrite-rule/scenario.yaml, full scan of eval/scenarios/*/scenario.yaml.

### Q3: Is framing A (a plugin registers its own `wp` command via `WP_CLI::add_command`) actually e2e-able through our `wpCli(..., { stdio: "pipe" })` channel? What lands on stdout vs stderr, must the plugin be active, and does registration need a hook?

**A:** PROVEN empirically in a booted wp-env. Framing A IS fully e2e-able through our channel.
- **Registration / hook:** No hook needed. A top-level `WP_CLI::add_command('<cmd>', <callback>)` inside the `if ( defined('WP_CLI') && WP_CLI )` guard registers and runs fine. (`cli_init` is optional for ordering, not required.)
- **Activation:** The plugin MUST be active. Confirmed empirically: deactivated → `wp <cmd>` stdout empty, stderr `Error: '<cmd>' is not a registered wp command.`; reactivated → works. This dovetails with `verify-e2e.ts` (deactivates all after wp-env start; each spec activates its own plugin in `beforeAll`), so a framing-A spec's `beforeAll` activates `plugin-<scenario>-<agentId>` (exactly like cpt-register/rewrite specs via `requestUtils.activatePlugin`), then the test body calls `wpCli([...])`.
- **stdout/stderr split (load-bearing, and a good surprise):** Through `wp-env run cli`, BOTH `WP_CLI::line` AND `WP_CLI::success` land on STDOUT — including the `Success:` prefix. Test: callback did `WP_CLI::line('LINE_TOKEN_R6_alpha')` then `WP_CLI::success('SUCCESS_TOKEN_R6_bravo')`; the captured stdout string was literally `"LINE_TOKEN_R6_alpha\nSuccess: SUCCESS_TOKEN_R6_bravo\n"`. So an e2e CAN assert on either the line output OR the success message. wp-env's own wrapper chatter ("ℹ Starting…", "✔ Ran…") goes to stderr and is NOT in the captured string (`wpCli` returns execFileSync stdout only) — so the returned string is clean command output.
- **Args:** Positional + associative both flow through. `wp researcher-test hello --shout=loud` → stdout `POS=hello;FLAG=loud`. Scenarios can exercise `$args[0]` and `$assoc_args['flag']`.

**Reasoning:** Ran the exact helper call `wpCli(["researcher-test"], { stdio: "pipe" })` from a node script importing `eval/utils/wp-cli.mjs`, against a throwaway plugin listed in `.wp-env.json` (auto-activated), in a clean wp-env on port 9201. The new assertion channel (CLI stdout) is genuinely distinct from the HTTP/DOM/REST channels used so far. Caveat to carry forward: WP-CLI core routes success/warning to stderr in a bare terminal, but through `wp-env run cli` the command's success/line both surface on stdout while wrapper noise is isolated to stderr — verified, not assumed. The remaining issue is NOT mechanics but grounding: framing A's deliverable (`WP_CLI::add_command`) is documented only on make.wordpress.org/cli/handbook (off-domain, per Q1).

**Sources:** empirical run in booted wp-env (port 9201) with throwaway plugin + node script importing `eval/utils/wp-cli.mjs`; `verify-e2e.ts` lifecycle; make.wordpress.org/cli/handbook/guides/commands-cookbook (top-level add_command pattern), make.wordpress.org/cli/handbook/guides/troubleshooting (active-only default, `--require` workaround).

### Q4: Can framing B (built-in commands) yield even one genuine, non-duplicative, on-domain-grounded scenario under our eval model? Candidate-by-candidate.

**A:** NO. Framing B yields no genuine, non-duplicative, plugin-dev scenario. Every honest B reduces to either (i) re-verifying a covered plugin feature via CLI, or (ii) operator usage that isn't a plugin deliverable. The batch is genuinely **A-only** (with the off-domain caveat).

**Reasoning:** Structural reason — our eval tasks an AGENT to WRITE PLUGIN CODE that is then graded. Built-in WP-CLI commands are OPERATOR tools that read/mutate state from outside the plugin, so a built-in command can only ever be the test's ASSERTION channel, never the agent's DELIVERABLE. Whenever a built-in command surfaces a dev-meaningful outcome, that outcome is the output of a plugin API (`register_post_type`, Options API, Transients API, `register_taxonomy`, `wp_schedule_event`…) — every one of which is already a scenario deliverable. So "outcome only a built-in command surfaces AND not already asserted" is empty. Framing A is different precisely because there the agent writes the COMMAND ITSELF — a genuinely CLI deliverable.

Candidate-by-candidate (outcome → covering scenario):
- `wp option` get/set → Options API → COVERED by `common-apis-options`; also `settings-register`. Dup.
- `wp post-type list` → `register_post_type` → COVERED by `cpt-register` (asserts via `/wp-json/wp/v2/books`). This is exactly the stub's dup. Dup.
- `wp transient` set/get → Transients API → COVERED by `common-apis-transients`. Dup.
- `wp cron event list` → `wp_schedule_event` → COVERED by `cron-event`. (review-5's design doc already considered and REJECTED a `wpCli(['cron','event','list'])` assertion for this scenario as "an unused channel.") Dup.
- `wp taxonomy list` → `register_taxonomy` → COVERED by `taxonomy-register`. Dup.
- `wp rewrite flush/list` → rewrite rules → COVERED by `common-apis-rewrite-rule`. Dup (the stub's other half).
- `wp user` → user management is operator usage, no plugin deliverable. Reject.
- `wp plugin` activate/list → operator usage (the harness already uses it). Reject.
- `wp scaffold` → generates starter code FOR a developer; in our model the AGENT is the code generator, so "use wp scaffold" is incoherent and the output is boilerplate, not a gradeable feature. Reject (contradicts eval model).
- `wp eval`/`wp eval-file` → runs arbitrary PHP; debug/operator/assertion tool, no plugin deliverable. Reject.
- `wp db` query/export → pure operator/infra. Reject.

Of 11 candidates: 6 are direct dups of existing scenario deliverables, 5 are operator/tooling usage that doesn't fit "agent writes plugin code." Zero genuine on-domain B. CONCLUSION: there is no real on-domain framing-B scenario under our eval model. The only genuine "WP-CLI development" capability is framing A (agent writes a plugin that registers its own `wp` command), which is e2e-able (proven) but off-domain-grounded only. The honest batch is A-only with a recorded off-domain grounding caveat, OR defer the area. You cannot pair an on-domain B e2e with A because a non-dup on-domain B does not exist. Mirrors review-4's theme-scaffold honest-limitation call.

**Sources:** developer.wordpress.org/cli/commands/ index; full scan of eval/scenarios/*/scenario.yaml; review-5 design doc (rejected `cron event list` CLI assertion).

### Q5: How have prior reviews handled off-domain grounding? Is "all grounding on developer.wordpress.org" a hard invariant? What was review-4's theme-scaffold disposition?

**A:** No shipped scenario has ever been grounded off developer.wordpress.org. "All grounding on developer.wordpress.org" is a hard, never-broken invariant across reviews 1-5. Off-domain ⇒ defer-or-judge-only, never a shipped full e2e record.

- **Review-4 disposition = (c) DEFERRED to a stub, NOT implemented — but the wall was harness-feasibility, not off-domain grounding.** The scenario that hit the wall was theme.json (`theme-json-custom-color-palette`). Spec Requirement 19 (review-4-themes/1-spec/spec.md:70): "Theme-artifact-bound sub-areas are deferred, not implemented — theme.json (settings/styles as a file), block templates, template parts, the template hierarchy, classic theme template files... because the scaffold cannot ship a theme. Of these, only the pre-existing theme-json-custom-color-palette stub is annotated with a # Deferred: reason... A theme-scaffold harness change that would unblock these is surfaced as a future out-of-scope recommendation, not implemented here." The catalog stub comment: "# Deferred: theme.json is a theme-root artifact the plugin scaffold cannot ship — theme-artifact-bound, not feasible without a theme-scaffold harness change." CRUCIAL: theme.json's docs ARE on developer.wordpress.org; it was deferred because the plugin scaffold can't ship a theme FILE (harness wall), NOT because grounding was off-domain. So review-4 is NOT an off-domain precedent. (Review-4's nav-menu/sidebar scenarios shipped JUDGE-ONLY — but fully on-domain and plugin-expressible, just lacking a clean front-end assertion; a different axis from grounding.)
- **Off-domain-source grep across the whole catalog:** every URL in `eval/scenarios/_wp-dev-candidates.yaml` → 77 URLs, ALL 77 on developer.wordpress.org. ZERO on make.wordpress.org / wp-cli.org / github / anywhere else, in stubs OR full records. Provenance never appears in any shipped `scenario.yaml` (only catalog records carry `source_files`).

**Reasoning:** The consistent, unbroken precedent: grounding is ALWAYS on developer.wordpress.org. When a scenario can't be cleanly supported, prior reviews DEFER (theme.json → stub, on-domain) or ship JUDGE-ONLY (nav-menu/sidebar → on-domain) — never a full record grounded off-domain. So framing A (grounded only at make.wordpress.org/cli/handbook) would be the FIRST off-domain-grounded shipped scenario in the entire suite — a genuine departure from a hard invariant, not a continuation of precedent. The intent leaves the door open ("keep (A) judge-only with a recorded grounding caveat, or record (A) as a deferred stub — an honest, recorded call") but does NOT authorize a full off-domain e2e as the default. Precedent points toward DEFER (stub with a `# Deferred:` off-domain-grounding reason, mirroring theme.json) OR judge-only-with-caveat at most.

**Sources:** review-4-themes/1-spec/spec.md:70 (Requirement 19); eval/scenarios/_wp-dev-candidates.yaml:158-166 (theme.json deferred stub); grep of all 77 URLs in `_wp-dev-candidates.yaml`.

## Research

### Decision: defer the WP-CLI area this review (no scenario implemented), recorded as an honest deferral

Weighing the five findings, the spec's central call is to **defer**: this review implements NO WP-CLI scenario and instead records the area as an honest, evidence-backed deferral, mirroring review-4's theme.json defer-with-comment pattern (an honest recorded call, which the intent explicitly permits).

Why this is the principled call, not a punt:
1. **Only framing A is a genuine WP-CLI deliverable.** Framing B is structurally barren under our eval model (the agent writes plugin code; built-in commands are operator tools that can only ever be the test's assertion channel, and every dev-meaningful built-in-command outcome mirrors a plugin API already covered by an existing scenario). The existing `wp-cli-eval-flush-rewrite` stub is a `cpt-register` re-verification, not genuine coverage. (Q2, Q4)
2. **Framing A is e2e-able** — mechanics are proven, not the blocker. (Q3)
3. **Framing A is grounded only off-domain** (make.wordpress.org/cli/handbook); developer.wordpress.org has zero coverage of `WP_CLI::add_command`, and `/cli/` itself 301-redirects to the command reference. (Q1)
4. **On-domain grounding is a hard, never-broken invariant** (77/77 catalog URLs on developer.wordpress.org; zero off-domain ever, in stubs or full records). Shipping framing A would be the first off-domain-grounded scenario in the entire suite — a deliberate first-of-its-kind break of the suite's defining grounding constraint, for a single scenario. (Q5)

Given (a) the one genuine scenario cannot be grounded on-domain, (b) the grounding invariant has never been broken, and (c) prior practice when a scenario can't be cleanly supported is to defer with a recorded reason (review-4 theme.json), deferring is consistent with precedent while shipping framing A off-domain would not be. The deferral is recorded by repurposing the existing `wp-cli-eval-flush-rewrite` stub into a framing-A deferred stub with a `# Deferred:` off-domain-grounding reason, and surfacing the unblockers as out-of-scope recommendations (WP-CLI custom-command docs landing on developer.wordpress.org, or an explicit owner decision to allow handbook grounding for this area).

Note: the intent's "directions to explore" enumerated judge-only-with-caveat, deferred-stub, and accept-off-domain as the honest options. Deferred-stub is chosen over judge-only-with-caveat because a judge-only WP-CLI scenario would still be a *shipped* record whose `source_files` point off-domain (breaking the invariant) and would still need its acceptance grounded somewhere the suite has never grounded; deferring avoids shipping an off-domain record at all while keeping an honest, actionable trail. (If the owner later rules that handbook grounding is acceptable for WP-CLI, the deferred stub is ready to be promoted to a full framing-A e2e record — the mechanics are already proven.)

## Consolidated Requirements

### A. Outcome of the review

1. **No WP-CLI scenario is implemented this review.** The review ships no new `eval/scenarios/wp-cli-*/` directory, no `scenario.yaml`, and no `e2e.spec.mjs` for the WP-CLI Commands area. The area's only output is a recorded deferral in the candidate catalog plus the decision rationale in this spec and the design doc.

2. **The deferral is an honest, evidence-backed call, not an omission.** The review records *why* the WP-CLI Commands area cannot be cleanly covered under current constraints: the only genuine WP-CLI-development deliverable (framing A — a plugin registering its own `wp` command via `WP_CLI::add_command`) is documented only off developer.wordpress.org, and the suite's grounding invariant has never placed a scenario off-domain.

### B. Why framing A is deferred rather than shipped

3. **Framing A is the only genuine WP-CLI deliverable and it is e2e-able.** A scenario where the agent writes a plugin that registers its own `wp` command (top-level `WP_CLI::add_command` under an `if ( defined('WP_CLI') && WP_CLI )` guard, emitting output via `WP_CLI::line`/`WP_CLI::success`) is verifiable end-to-end through the `wpCli(args, { stdio: "pipe" })` channel: with the plugin active, `wp <custom-cmd>` output (both line and success text, including the `Success:` prefix) lands on the captured stdout, while wp-env wrapper chatter stays on stderr. This is recorded as proven so a future review can promote it without re-investigating the mechanics.

4. **Framing A is deferred solely because it cannot be grounded on developer.wordpress.org.** The custom-command API (`WP_CLI::add_command`, the commands cookbook) is documented only at make.wordpress.org/cli/handbook; developer.wordpress.org/cli/ carries only the built-in command reference (it 301-redirects to a command page). Shipping framing A would require `source_files` pointing off-domain — the first such record in the suite — which the review declines to do.

### C. Why framing B yields nothing implementable

5. **No genuine framing-B (built-in-command) scenario exists under the eval model.** Built-in WP-CLI commands are operator tools and can only ever be a test's assertion channel, never the agent's plugin deliverable; every dev-meaningful built-in-command outcome (`wp option`, `wp post-type list`, `wp transient`, `wp cron event list`, `wp taxonomy list`, `wp rewrite`) duplicates an existing scenario's deliverable (`common-apis-options`, `cpt-register`, `common-apis-transients`, `cron-event`, `taxonomy-register`, `common-apis-rewrite-rule`), and the remaining commands (`wp user`, `wp plugin`, `wp scaffold`, `wp eval`, `wp db`) are operator/tooling usage that is not a plugin-development deliverable. No framing-B scenario is implemented and none is added as a new catalog stub.

6. **The existing `wp-cli-eval-flush-rewrite` stub is not genuine WP-CLI coverage and is not promoted as-is.** Its implied deliverable ("register a CPT and flush rewrite rules") is already covered by `cpt-register` and `common-apis-rewrite-rule`; WP-CLI appears only in the would-be test harness, so promoting it as-is would violate the intent's no-duplication constraint.

### D. Catalog update (the review's only file change to `eval/scenarios/`)

7. **The `wp-cli-eval-flush-rewrite` stub is repurposed into a framing-A deferred stub.** Under the `# === Area: WP-CLI Commands ===` header, the existing stub is reframed to the genuine framing-A concept (developing a custom WP-CLI command via `WP_CLI::add_command`) and annotated with a `# Deferred:` comment whose reason is off-domain grounding — mirroring the theme.json deferred-stub pattern (a stub with a `# Deferred:` reason, no `prompt`/`acceptance`). It carries no full `prompt`/`acceptance` (it is a deferred stub, not a full record). Whether to keep the legacy name or rename it to a clearer framing-A `wp-cli-*` name (e.g. one expressing "custom command") is a design/plan decision; either way the name matches `/^[a-z0-9-]+$/` and the `wp-cli-*` prefix convention.

8. **The deferred stub's reason and pointers are recorded honestly.** The `# Deferred:` comment states that the genuine WP-CLI-development scenario (custom `wp` command) is feasible to verify via the `wpCli` stdout channel but is documented only off developer.wordpress.org, and that the suite's on-domain grounding invariant is the blocker — not harness feasibility. The off-domain handbook URL (make.wordpress.org/cli/handbook) MAY be cited inside the `# Deferred:` comment as the pointer to where the capability is documented; the record nonetheless stays a deferred stub (no `prompt`/`acceptance`, no full `source_files` block making it a shippable record) so no shipped record points off-domain. Exact comment wording is a design/plan/code decision.

9. **The catalog header line is NOT changed to add WP-CLI.** The header comment listing areas with full prompt+acceptance records (Plugins, Block Editor, REST API, Themes, Common APIs) is left unchanged, because this review ships no full WP-CLI record. No other header change is made.

10. **No other catalog content is touched.** Within `_wp-dev-candidates.yaml`, only the single WP-CLI stub entry (reframed + `# Deferred:` annotated, optionally renamed) changes; no other area's records — and no other WP-CLI content beyond that one stub — are added, moved, renamed, promoted, or annotated. The Interactivity-API catalog `eval/scenarios/_candidates.yaml` is not modified.

### E. Naming and conventions (carried forward, applied to the stub)

11. **`wp-cli-*` pseudo-folder naming is applied to the (repurposed) stub.** The stub's `name` carries the `wp-cli-` prefix and matches `/^[a-z0-9-]+$/`, consistent with the adopted convention. No existing scenario is renamed. (No scenario directory is created this review, so the dir == name == catalog-name identity rule is moot for WP-CLI here; it applies if the stub is later promoted.)

### F. Non-disruption and done-criteria

12. **The skill is untouched.** No file under `skills/wordpress-development/` is modified.

13. **The existing suite is intact and flat discovery is preserved.** No existing scenario (Interactivity API, v1, Plugins, Block Editor, REST API, Themes, Common APIs) is moved, renamed, reorganized, or broken; Skillsmith's flat discovery under `eval/scenarios/` continues to enumerate them unchanged.

14. **Verification is static/structural only; no grading run.** The review's correctness is checked by inspecting the catalog edit (the WP-CLI stub is a well-formed YAML deferred stub with a `# Deferred:` reason, the header line is unchanged, no other records changed, no new scenario directory exists) and confirming the skill and existing scenarios are untouched. No agent runs the `scenarios × testing-agents` matrix, boots wp-env for a pass, or generates plugin code. (The framing-A mechanics were proven during research; that is not a per-review grading requirement.)

### G. Out-of-scope recommendations (recorded, not acted on)

15. **Unblockers for a future WP-CLI scenario are surfaced as recommendations, not implemented.** Recorded for a future review/owner decision: (a) if WP-CLI custom-command documentation lands on developer.wordpress.org, the framing-A scenario becomes on-domain-groundable and the deferred stub can be promoted to a full framing-A e2e record using the proven `wpCli` stdout channel; or (b) the owner may explicitly rule that make.wordpress.org/cli/handbook grounding is acceptable for the WP-CLI area, which would likewise unblock promotion. Neither is decided or implemented in this review.

