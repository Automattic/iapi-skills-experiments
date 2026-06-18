# Doc Plan Review

## Verdict: approved

## Summary

The doc plan is a deliberately near-empty plan carrying one small, optional, drift-resistant README pointer task, and that decision holds up under an independent, repo-wide adversarial sweep. I verified myself — not by trusting the plan's prose — that no live documentation surface goes stale when the six Plugins scenarios and the new `eval/scenarios/_wp-dev-candidates.yaml` catalog land: no contributor-facing doc enumerates scenarios, claims a scenario count, asserts an "all scenarios are Interactivity API" framing, or references `_candidates.yaml` by name. The full set of contributor/prose surfaces in the repo is small and fully accounted for (`README.md`, `.rp.md`, `eval/prompts/improver.md`, `eval/prompts/testing-agent.md`, `eval/rubrics/wp-interactivity-api-best-practices.md`); there is no `CONTRIBUTING`, `CHANGELOG`, `docs/`, or `package.json` description to go stale. The single task is well-formed (Goal / Audience / Files / Sections-scope / Depends on / Traces to / Acceptance all present), traces to spec Requirements 3 and 4 and code Task 7, names a concrete audience, is confined to one surface (README), produces no code, stays within spec/design scope, and is drift-resistant (no enumerations, counts, function names, or restated `scenario.yaml`/catalog content). The Guardrail scopes section binds correctly: this project defines no scoped gates, so the lone `None | None` row with a "No project guardrails" body is the valid rendering, consistent with the code plan's identical finding — there is no command to execute.

## Independent verification performed

- **Stale-surface sweep (the load-bearing check).** Grepped the whole repo (excluding `node_modules`, `.git`, `.pipelines`, `.skillsmith`, `.claire`, `dist`, and `skills/wordpress-development/`) for `_candidates.yaml` / `candidates.yaml` references, scenario enumerations/counts (`four/six/eleven scenario`, `number of`, etc.), and "all/only Interactivity API" claims. **Zero** matches in any contributor doc. No live sentence is rendered false by adding a second catalog file or six new scenario directories.
- **README confirmed line-by-line.** Line 7 ("main topic is the Interactivity API") is explicitly scoped to the *skill* under `skills/wordpress-development/` (unchanged — Spec R13), so it stays accurate. The "Single scenario" example `(e.g. counter, cpt-register)` (line 31) is an illustration, not an enumeration; I confirmed via `git log` that commit `8756c48` ("Refresh README single-scenario example to span broadened suite") already broadened it, exactly as the plan claims — adding the six new names would be churn that risks turning the illustration into a drift-prone enumeration, so leaving it is correct.
- **`.rp.md` and prompt files confirmed.** `.rp.md` "Running evals" / agent-cap text refers generically to "scenario(s)" with no count and names no catalog — nothing stale. `eval/prompts/improver.md` ("Keep it focused on the Interactivity API") governs building the **skill** (out of scope, unchanged); `eval/prompts/testing-agent.md` is harness/scaffold-facing. Both correctly excluded.
- **Rubric confirmed.** `eval/rubrics/wp-interactivity-api-best-practices.md` line 3 says its criteria "apply to **every** Interactivity API scenario" — that remains true and does not claim *all scenarios* are Interactivity API; the new Plugins scenarios declare `rubrics: []` and never invoke it. Not stale.
- **No collisions.** Confirmed the six new scenario directories and `_wp-dev-candidates.yaml` are all absent today, consistent with the code plan.
- **Surface completeness.** No `CONTRIBUTING`, `CHANGELOG`, `AUTHORS`, or `docs/` directory exists; `package.json` has no `description` field. The contributor-doc surface set is exhausted.

## Task-level review (Task 1 — optional README catalog-pointer)

- **Traceability:** traces to Spec Requirements 3 / 4 (catalog present, distinct from the iAPI `_candidates.yaml`) and Code plan Task 7 (creates the second catalog beside the existing one). Valid.
- **Drift-resistance:** the task is a pointer only; its acceptance explicitly forbids enumerating catalog entries, scenarios, areas, or counts, and instructs the writer to read the actual files' headers at phase-5 time rather than inventing roles. No function names, parameter lists, or restated `scenario.yaml`/catalog content. Drift-resistant.
- **Audience:** concrete — repository contributors and skill maintainers browsing `eval/scenarios/` who encounter two `_*-candidates.yaml` files.
- **Acceptance:** evaluable and reader-outcome framed (a reader can tell two catalogs exist and what each is for without opening them; both are flagged as discovery-skipped planning artifacts; filenames verified against the filesystem; no enumeration introduced; change confined to the chosen location). Consistent with the traced spec requirements.
- **Granularity / ordering / feasibility:** single surface (README), no dependencies, no code, and the referenced README location ("Running evals" / "Single scenario", lines ~23-36) exists and is the natural home. Feasible in phase 5.
- **Scope:** light supporting documentation for the catalog artifact (Requirement 4), not skill documentation (forbidden) and not a new feature. Within scope; not scope creep.

## Guardrail scopes

The plan's `## Guardrail scopes` section is present with the required table and a `None | None` row plus a "No project guardrails" body. No scoped gate was passed to this review, the project defines no scoped gates, and the code plan records the identical finding — so the `None` rendering is valid and binds correctly. There is no filled command to execute.
