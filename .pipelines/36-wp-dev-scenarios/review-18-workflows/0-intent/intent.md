# Review: project-triage + plugin-directory scenarios (campaign 8/9)

## Origin

Owner *"kick off reviews from the gaps … include the deferred areas"* + *"Relax constraints, ship all"*. Campaign review **8 of 9**. Ships the last two agent-skills gaps — `wp-project-triage` (stub `project-triage-report`) and `wp-plugin-directory-guidelines` (stub `plugin-directory-review`) — both review-workflow / report-style.

## Goal

Ship **2 judge-only** scenarios (report deliverables, not plugins). Promote both gap stubs to full records.

## Constraints (relaxed)

- The code-writer should **FETCH each agent-skills SKILL.md** to ground each scenario:
  - `wp-project-triage`: `https://github.com/WordPress/agent-skills/tree/trunk/skills/wp-project-triage`
  - `wp-plugin-directory-guidelines`: `https://github.com/WordPress/agent-skills/tree/trunk/skills/wp-plugin-directory-guidelines`
- **Off-domain grounding allowed**; cite each SKILL.md + canonical refs honestly. The Plugin Directory guidelines are partly on-domain (`developer.wordpress.org/plugins/wordpress-org/detailed-plugin-guidelines/`) — cite it for the directory scenario.
- **Harness wall = recorded dependency:** both deliverables are reports/analysis, not plugins the harness runs → **judge-only** (judge grades the produced report). Record the harness dependency per record.
- New folders `eval/scenarios/project-triage/` and `eval/scenarios/plugin-directory/`; user-voice prompts; `rubrics: []`; skill untouched; iAPI + existing records untouched.

## Scope

1. **`eval/scenarios/project-triage/project-triage-report/`** — judge-only. Prompt: given a described WordPress repo, produce a structured **triage report** (inventory of what the project is, its components/health, and prioritized next actions), grounded in the `wp-project-triage` skill's report structure. Acceptance: the report contains the skill's required sections (e.g. project inventory, findings/health, prioritized actions) and is grounded in concrete repo signals.
2. **`eval/scenarios/plugin-directory/plugin-directory-review/`** — judge-only. Prompt: review a described plugin against the **WordPress.org Plugin Directory guidelines** and report compliance findings (GPL licensing, naming/trademarks, no obfuscation, freemium/upsell rules, etc.). Acceptance: the report checks the key guideline categories (per the skill / the on-domain detailed guidelines) with pass/fail + reasons.

- Catalog: **promote** both stubs — remove each from `# === Agent-Skills Gaps ===`, add full records (verbatim prompt+acceptance, honest `source_files`, `# Harness dependency:` notes) under an implemented sub-header (the existing `# === Area: Agentic Workflows ===` section, or a clearly-labeled one). Exactly one record per name; no duplicates. After this, the `# === Agent-Skills Gaps ===` section should be EMPTY (all 9 gaps shipped). Static/structural verification; pass not required.
