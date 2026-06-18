# Doc Plan Review

## Verdict: approved

## Summary

The empty (zero-task) doc plan is correct. I independently swept the repository end-to-end for every surface that could go stale when this run lands (3 new `rest-api-*` scenario directories plus the in-place REST API edit of `_wp-dev-candidates.yaml`), and confirmed that no live documentation surface falls out of sync, and that the one genuinely stale surface — the catalog header line — is correctly assigned to the **code phase (code Task 4)**, not mis-assigned away from the doc plan. The plan's "Surfaces deliberately not changed (and why)" section is accurate against the live repo: every justification I spot-checked matched the actual file contents. The guardrail-scopes section is the valid empty rendering for a project with no scoped gates, consistent with the (also-approved) code plan's identical finding. An empty plan is the right outcome here, matching the same-shape conclusion of the two prior reviews.

## Verification performed

**Guardrail scopes.** The plan's `## Guardrail scopes` records "No project guardrails" with a single `None | None` row. No scoped gate was passed to this review (the orchestrator brief lists none), so the `None` body is the correct rendering and there is no command to fill, run, or validate. The code plan reaches the byte-identical "No project guardrails" finding. Binds correctly: no unpassed-gate row, no passed-gate-without-row.

**Live-doc sweep (independent, end-to-end).** I grepped the whole repo (excluding `node_modules`, `.git`, `.pipelines`, `.skillsmith`, `.claire`, `dist`) across `*.md`, `*.ts`, `*.mjs`, `*.json`, `*.yaml`, `*.yml` for `rest-api-*`, REST API references, candidate/catalog references, scenario counts, and any naming-convention prose, and inspected each contributor-facing prose surface directly. Findings — each confirms an "untouched" claim in the plan:

- **`README.md` "two candidate catalogs" pointer (lines 36-38).** Names both catalogs with one-line roles. The `_wp-dev-candidates.yaml` role ("broader WordPress-development candidates spanning the developer.wordpress.org areas") stays accurate after an **in-place** REST API edit — the file is not renamed, no third catalog is added, REST API is already one of the spanned areas. Not stale.
- **`README.md` `(e.g. counter, cpt-register)` line (line 31).** Confirmed it is an illustration of bare directory names, not an enumeration or count. Not stale; re-editing would risk turning an illustration into a drift-prone enumeration.
- **`README.md` skill-structure / run-mechanics / report / agent-cap sections.** Describe the skill and harness mechanics, neither of which changes. Not stale.
- **`_wp-dev-candidates.yaml` header line (lines 28-29):** "Full prompt + acceptance are included for the implemented Plugins and Block Editor scenarios; all other records are lighter stubs." This is the **one** stale surface once REST API records are promoted. It is correctly assigned to the **code phase as code Task 4** — verified present in `code-plan.md` Task 4 (Changes line 193 "Fix the stale header line", Acceptance line 210, Coverage check AC 14 line 234). Not a doc-plan task; not mis-assigned away from docs (it is a self-describing planning/data file edited in the same code task that promotes the records).
- **`_wp-dev-candidates.yaml` header "10 areas" map (line 21):** REST API is already one of the 10 listed areas; promoting REST records does not change the area map. Not stale.
- **`_wp-dev-candidates.yaml` REST API section (lines 394-415):** two stubs (`rest-api-custom-field-on-post`, `rest-api-authentication-nonce`), each with `# TODO: prompt + acceptance`, exactly as the design and code plan describe. All edits here are code Task 4; per-record content is forbidden from external docs (would drift). No doc task warranted.
- **`.rp.md` (line 106):** only restates the agent cap. Does not enumerate scenarios, claim a count, describe a naming scheme, or name either catalog. Not stale.
- **`eval/prompts/*` and `eval/rubrics/*`:** the improver/testing-agent prompts and the single iAPI rubric contain no REST-specific or scenario-enumeration content; all govern the skill/harness, which is untouched. Not stale.
- **No naming-convention doc exists.** No live surface (README, `.rp.md`, prompts, configs) describes or asserts any scenario-directory naming scheme, so nothing goes stale when the prefixed `rest-api-*` names appear. The only `rest-api-` hits outside the catalog were in a scenario-definition file (`rest-custom-endpoint/scenario.yaml`), which is not external doc and is not modified.
- **No other README / CONTRIBUTING / CHANGELOG** exists; the repo-root `README.md` is the only such file.

**Scope and no-code-planning.** The plan adds no documentation tasks and includes no code tasks. It stays within the spec and design. Every "deliberately not changed" justification traces to a spec requirement / acceptance criterion or to the design.

## Issues

None.
