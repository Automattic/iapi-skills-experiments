# Review: WordPress Design System (wpds) UI scenario (campaign 6/9)

## Origin

Owner *"kick off reviews from the gaps … include the deferred areas"* + *"Relax constraints, ship all"*. Campaign review **6 of 9**. Ships the `wpds` gap (catalog stub `wpds-component-ui`, sub-classed harness-wall — JS/React UI).

## Goal

Ship **1 judge-only** scenario: build a small UI using **WordPress Design System (WPDS)** components. Promote the `wpds-component-ui` gap stub to a full record.

## Constraints (relaxed)

- The code-writer should **FETCH the agent-skills `wpds` SKILL.md** (`https://github.com/WordPress/agent-skills/tree/trunk/skills/wpds`) to learn exactly what WPDS means in this context (the `@wordpress/components` library — Button, Panel, Card, etc. — and/or a newer WordPress Design System package) and the expected component usage. Ground the scenario in that.
- **Grounding:** if WPDS == `@wordpress/components`, that library is documented **on-domain** at `developer.wordpress.org/block-editor/reference-guides/components/` (+ the Gutenberg Storybook); cite the canonical source(s) — on-domain where available, off-domain (the wpds SKILL.md / the package) otherwise.
- **Harness wall = recorded dependency:** the eval harness has no JS build/render step for a standalone React UI, so this is **judge-only** — the judge grades the produced JS/JSX statically (uses the right WPDS components/imports). Record the harness dependency in the catalog.
- New folder `eval/scenarios/wpds/<scenario>/`; user-voice **tool-agnostic-where-possible** prompt (asking for an admin/editor UI built with the WordPress component library; naming "WordPress Design System / WordPress components" is acceptable since the deliverable type is the task); `rubrics: []`; skill untouched; iAPI + existing records untouched.

## Scope

- **1 scenario:** `eval/scenarios/wpds/wpds-component-ui/` — judge-only (scenario.yaml only).
  - Prompt: ask to build a small, consistent UI (e.g. a settings panel or an editor sidebar control) using the official WordPress component library rather than hand-rolled HTML/CSS — pin a concrete small UI (e.g. a panel with a labeled toggle + a primary button).
  - Acceptance (judge-checkable on the produced JS/JSX): imports components from `@wordpress/components` (and renders them — e.g. `Panel`/`PanelBody`, `ToggleControl`, `Button` with `variant="primary"`); does NOT hand-roll equivalent raw HTML/CSS for those controls; uses the components per the library's API. Tune to the wpds skill's actual guidance.
- Catalog: **promote** `wpds-component-ui` IN PLACE / out of the gaps section to a full record (verbatim prompt+acceptance, honest `source_files`, `# Harness dependency:` note), under an implemented sub-header. Exactly one record; no duplicate. Static/structural verification; pass not required.
