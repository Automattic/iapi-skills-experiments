# Code review — review-9-remaining-areas (DEFER both): approved

**Verdict: approved.** This is the **sweep-completion** review (the final two of the ten top-level developer.wordpress.org areas).

**Process note (honest disclosure):** both areas deferred (no scenario ships), so the entire code change is a single catalog commit editing two stubs' disposition lines. Given the harness's repeated background-agent watchdog stalls this stretch, the orchestrator made this 2-line, fully-specified, deterministically-verifiable change directly (commit `16f66bc`) and verified it inline (YAML parse, `git diff`, record-shape probe, `grep`).

## Change under review

Commit `16f66bc` — "Defer Code Reference and Advanced Administration with honest deferred stubs". Single file: `eval/scenarios/_wp-dev-candidates.yaml` (2 insertions, 2 deletions), confined to the Code Reference and Advanced Administration sections. Each area's stub keeps its accurate fields; only its placeholder `# TODO: prompt + acceptance` line becomes an honest `# Deferred:` reason.

## Why DEFER (from the committed spec, `061bdec`) — both ON-domain, neither off-domain

- **Code Reference — non-distinct-area.** `developer.wordpress.org/reference/` is the cross-cutting **API reference index** (per-symbol function/hook/class pages) underlying every other area, not a parallel buildable topic. Any plugin-code scenario reduces to "use a documented symbol" — already covered by Plugins/Common APIs/REST (which cite `reference/*` as `source_files`) — and the only Code-Reference-unique task (look up / document symbols) yields no `index.php` deliverable to grade. The "unique AND gradeable as plugin code" set is empty.
- **Advanced Administration — harness-wall + overlap.** Every sub-topic is either a server/site-root config artifact the plugin scaffold (`index.php` + `block.json`) cannot ship — notably `wp-config.php`, which a plugin can only READ constants from, not define (the same wall as theme.json / the Playground blueprint) — or plugin security (nonces/sanitization/capability checks) that overlaps existing Plugins/REST coverage (`rest-api-permission-check`). Server/performance/multisite/debug/mail/backups are all config-wall.

## Checks (all pass)

- **YAML parses** — 38 records (unchanged; two stubs stayed stubs).
- **Both stay STUBS** — `code-reference-hook-lookup` and `wp-config-custom-constant` each have no `prompt`/`acceptance` (verified via record probe).
- **Deferred reasons recorded** — each `# Deferred:` comment states the on-domain, area-shape/harness reason (explicitly NOT off-domain).
- **Header line UNCHANGED** — neither area added to the implemented-areas list (nothing implemented).
- **No scenario directories** — no `code-reference-*` / `advanced-*` / `wp-config-*` dirs.
- **Invariants byte-untouched** — iAPI `_candidates.yaml`, the skill, and all non-target catalog records unchanged; diff confined to the two stubs' disposition lines.
- **No project guardrails** — none declared.

## Sweep completion

With these two deferred, all ten top-level developer.wordpress.org areas are accounted for: **implemented** — Plugins, Block Editor, REST API, Themes, Common APIs, Coding Standards; **deferred** — WP-CLI & WordPress Playground (off-domain grounding), Code Reference (cross-cutting index), Advanced Administration (harness-wall + overlap). Every deferral carries a recorded reason in the catalog + the per-review spec.
