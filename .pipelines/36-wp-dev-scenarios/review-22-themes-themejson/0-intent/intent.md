# Review: Themes theme.json scenario (sub-area campaign 3/3 — final)

## Origin

Owner *"kick all the subareas reviews"*. Final sub-area review **3 of 3**. Ships the last remaining within-area stub: `theme-json-custom-color-palette` (Themes area). Relaxed constraints (harness wall → judge-only with recorded dependency).

## Goal

Ship **1 judge-only** scenario — author a `theme.json` defining a custom color palette. Promote the `theme-json-custom-color-palette` stub to a full record.

## Scope

- **1 scenario:** `eval/scenarios/themes/theme-json-custom-color-palette/` — judge-only (scenario.yaml only). New scenario in the **existing `themes/` folder**.
  - Prompt: user-voice, ask to define a small set of custom theme colors that show up as selectable swatches in the editor's color pickers (the deliverable is a `theme.json`). Tool-agnostic where possible (naming "theme.json" is acceptable — the deliverable type is the task, as with Playground/wp-config scenarios).
  - Acceptance (judge-checkable on the produced JSON): a `theme.json` with a `$schema`/`version`; `settings.color.palette` is an array of color entries each with `slug`, `name`, and `color` (hex/CSS); at least 2 custom colors defined; valid JSON.
  - **Harness dependency:** `theme.json` is a theme-root artifact the plugin scaffold cannot ship (the same wall as the Playground blueprint / wp-config) → judge-graded statically on the produced JSON. Record the `# Harness dependency:` note in the catalog.
- **Grounding (on-domain):** `developer.wordpress.org/block-editor/reference-guides/theme-json-reference/` + `developer.wordpress.org/themes/block-themes/` (the existing stub's source).
- Catalog: **promote** `theme-json-custom-color-palette` IN PLACE to a full record (drop the `# Deferred:` note, add verbatim prompt+acceptance, add the `# Harness dependency:` note). Exactly one record; no duplicate. iAPI + existing scenarios/records untouched; skill untouched.

## Note

This completes the sub-area campaign — every within-area sub-topic stub now has a scenario (or was dropped as a confirmed duplicate). After this, the `_wp-dev-candidates.yaml` catalog should have **no remaining records without a prompt** (every record is either a full implemented scenario or an explicitly-dropped duplicate).
