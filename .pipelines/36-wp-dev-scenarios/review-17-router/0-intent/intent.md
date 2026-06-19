# Review: wordpress-router classify scenario (campaign 7/9)

## Origin

Owner *"kick off reviews from the gaps … include the deferred areas"* + *"Relax constraints, ship all"*. Campaign review **7 of 9**. Ships the `wordpress-router` gap (catalog stub `wordpress-router-classify`, sub-classed review-workflow / meta-orchestration — no PHP plugin deliverable).

## Goal

Ship **1 judge-only** scenario where the deliverable is a **classification + routing decision** (a report), not a plugin. Promote the `wordpress-router-classify` gap stub to a full record.

## Constraints (relaxed)

- The code-writer should **FETCH the agent-skills `wordpress-router` SKILL.md** (`https://github.com/WordPress/agent-skills/tree/trunk/skills/wordpress-router`) to learn the classification taxonomy / routing categories that skill uses, and ground the scenario + acceptance in it.
- **Off-domain grounding allowed**; cite the `wordpress-router` SKILL.md + any canonical WP project-type references honestly.
- **Harness wall = recorded dependency:** the deliverable is an analysis/routing report, not a plugin the harness runs → **judge-only** (the judge grades the produced classification/routing report). Record the harness dependency.
- New folder `eval/scenarios/wordpress-router/<scenario>/`; user-voice prompt; `rubrics: []`; skill untouched; iAPI + existing records untouched.

## Scope

- **1 scenario:** `eval/scenarios/wordpress-router/wordpress-router-classify/` — judge-only (scenario.yaml only).
  - Prompt: ask, given a described WordPress codebase/task, to classify what kind of WordPress work it is (e.g. plugin vs theme vs block vs site-config, and the relevant sub-area) and recommend/route to the appropriate development workflow — the deliverable is the classification + routing decision with a brief justification.
  - Acceptance (judge-checkable on the produced report): identifies the project/task type against the router's categories; gives a clear routing decision (which workflow/skill applies); justifies it from concrete signals; covers the categories the `wordpress-router` skill defines. Tune to the skill's actual taxonomy.
- Catalog: **promote** `wordpress-router-classify` — remove from `# === Agent-Skills Gaps ===`, add a full record (verbatim prompt+acceptance, honest `source_files`, `# Harness dependency:` note) under an implemented sub-header. Exactly one record; no duplicate. Static/structural verification; pass not required.
