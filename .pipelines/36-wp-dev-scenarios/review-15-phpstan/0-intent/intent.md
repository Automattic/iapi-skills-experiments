# Review: PHPStan static-analysis scenario (campaign 5/9)

## Origin

Owner *"kick off reviews from the gaps … include the deferred areas"* + *"Relax constraints, ship all"*. Campaign review **5 of 9**. Ships the `wp-phpstan` gap (catalog stub `phpstan-baseline`, sub-classed harness-wall).

## Goal

Ship **1 judge-only** static-analysis scenario: set up **PHPStan** analysis for a plugin (PHPStan + the WordPress extension/stubs, a `phpstan.neon` at a chosen level), and either fix the reported type issues or generate a baseline. Promote the `phpstan-baseline` gap stub to a full record.

## Constraints (relaxed)

- **Off-domain grounding allowed** — PHPStan is not documented on developer.wordpress.org. Cite the canonical sources honestly in `source_files`: phpstan.org, the `szepeviktor/phpstan-wordpress` extension (GitHub), and the agent-skills `wp-phpstan` SKILL.md (`https://github.com/WordPress/agent-skills/tree/trunk/skills/wp-phpstan`). The code-writer should FETCH the `wp-phpstan` SKILL.md to ground the scenario in what that skill actually teaches (level, extension, stubs, baseline-vs-fix).
- **Harness wall = recorded dependency:** the eval harness can't run PHPStan, so this is **judge-only** — the judge grades the produced `phpstan.neon` config + the plugin code statically. Record the harness dependency in the catalog (like the abilities/Playground notes).
- New folder `eval/scenarios/phpstan/<scenario>/`; user-voice, **tool-agnostic-where-possible** prompt (the deliverable is static-analysis setup; naming "static analysis"/PHPStan is acceptable since the deliverable type IS the task, like the WP-CLI/Playground scenarios); `rubrics: []`; skill untouched; iAPI + existing records untouched.

## Scope

- **1 scenario:** `eval/scenarios/phpstan/phpstan-baseline/` — judge-only (scenario.yaml only).
  - Prompt: ask to set up PHPStan static analysis for the plugin so type errors are caught (with the WordPress-aware extension and a sensible level), and handle the reported issues (fix them, or grandfather them with a baseline).
  - Acceptance (judge-checkable on the produced files): a `phpstan.neon`/`.dist` config exists declaring a `level` and including the WordPress extension/stubs (`szepeviktor/phpstan-wordpress`); the analysis target paths are set; either type errors are addressed in the PHP or a `phpstan-baseline.neon` is generated and referenced. Tune the exact checks to the `wp-phpstan` skill's actual guidance.
  - **Note distinction from our Coding Standards area:** WPCS style/PHPDoc (review-7) is NOT PHPStan type analysis — these are distinct disciplines; keep this scenario about static type analysis.
- Catalog: **promote** `phpstan-baseline` IN PLACE to a full record (drop the `# Gap` stub markers, add verbatim prompt/acceptance, add a `# Harness dependency:` note), under an implemented sub-header. Exactly one record; remove from the gaps section. Static/structural verification; pass not required.
