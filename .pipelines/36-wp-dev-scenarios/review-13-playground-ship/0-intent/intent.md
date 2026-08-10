# Review: WordPress Playground Blueprint scenario (campaign 3/9)

## Origin

Owner directive *"kick off reviews from the gaps. Include the deferred areas as well"* + *"Relax constraints, ship all"*. Campaign review **3 of 9**. **Un-defers WordPress Playground** (deferred in review-8 for off-domain grounding + the JSON-artifact harness wall) — both now allowed (off-domain grounding OK; harness wall = recorded future dependency).

## Goal

Ship **1 judge-only** Playground scenario — author a **Blueprint JSON** that installs/loads a plugin and runs a setup step. Promote the `playground-blueprint-plugin-load` deferred stub to a full record.

## Reuse review-8 research (authoritative)

`.pipelines/36-wp-dev-scenarios/review-8-playground/1-spec/spec-research.md`: the Blueprint JSON API (`steps` incl. `installPlugin`, `login`, `setSiteOptions`, `runPHP`; `landingPage`) is documented off-domain at `wordpress.github.io/wordpress-playground/`; the harness cannot run Playground (no Blueprint runner) → **judge-only** (the agent authors the blueprint JSON; the judge grades its structure).

## Scope

- **1 judge-only scenario:** `eval/scenarios/playground/playground-blueprint-plugin-load/` — `scenario.yaml` ONLY (no e2e). New `playground/` topic folder.
  - Prompt (user-voice, **tool-agnostic** as far as possible — the user asks for a one-click Playground setup that boots WordPress with a given plugin installed/active and some initial setup): the deliverable is a Blueprint JSON.
  - Acceptance (judge-checkable on the produced JSON): valid Blueprint shape (`$schema`/`steps` array), an `installPlugin` step (or equivalent) loading the named plugin, the plugin is activated, and a setup step (e.g. `setSiteOptions`/`login`/`runPHP`) per the prompt; the JSON parses.
  - **Harness dependency recorded:** the eval harness has no Blueprint runner, so this is graded statically by the judge on the produced JSON; note the dependency in the catalog (like the abilities audit/verify + Skillsmith notes).
- **Grounding (off-domain):** cite `wordpress.github.io/wordpress-playground/blueprints/...` honestly in `source_files`; `source: agent-skills` or a playground source as appropriate.
- Catalog: **promote** `playground-blueprint-plugin-load` to a full record IN PLACE (drop the `# Deferred:` note; add verbatim prompt/acceptance; add a `# Harness dependency:` note). Exactly one record — no duplicate.

## Constraints

- New folder layout `eval/scenarios/playground/<scenario>/`; `rubrics: []`; skill untouched; existing scenarios + iAPI `_candidates.yaml` untouched. Static/structural verification; pass not required.
