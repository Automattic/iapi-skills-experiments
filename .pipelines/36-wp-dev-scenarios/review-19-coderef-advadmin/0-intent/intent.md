# Review: Code Reference + Advanced Administration scenarios (campaign 9/9 — final)

## Origin

Owner *"kick off reviews from the gaps … include the deferred areas"* + *"Relax constraints, ship all"*. Campaign review **9 of 9 (final)**. Ships the last two **deferred top-level areas** — Code Reference (stub `code-reference-hook-lookup`) and Advanced Administration (stub `wp-config-custom-constant`). Both were deferred on **area-shape / harness-wall** grounds (NOT off-domain — both are on-domain); the relaxed-constraints directive lifts those.

## Goal

Ship **2 judge-only** scenarios (report / config deliverables, not plugins). Promote both deferred stubs to full records.

## Constraints (relaxed)

- Both areas are **on-domain** (developer.wordpress.org) — grounding is not the issue; the **harness wall / area-shape** is. Ship judge-only and record the harness dependency.
- New folders `eval/scenarios/code-reference/` and `eval/scenarios/advanced-admin/`; user-voice prompts; `rubrics: []`; skill untouched; iAPI + existing records untouched.

## Scope

1. **`eval/scenarios/code-reference/code-reference-hook-lookup/`** — judge-only. The Code Reference is the cross-cutting API index; the area-unique task is a **lookup/document** deliverable (no plugin). Prompt: ask, using the WordPress reference docs, to identify the action/filter hooks fired during a given lifecycle point (e.g. `wp_head`) and document each hook's name and parameters. Acceptance (judge-checkable on the produced report): names the relevant hooks fired during `wp_head` (e.g. `wp_head`, `wp_enqueue_scripts`, `wp_print_styles`, …), documents each hook's type (action/filter) and parameters/signature, and is grounded in the reference. Source: on-domain `developer.wordpress.org/reference/hooks/...`. Record `# Harness dependency:` (documentation report, no plugin deliverable → judge-graded).

2. **`eval/scenarios/advanced-admin/wp-config-custom-constant/`** — judge-only. Prompt: ask to define a **custom configuration constant in `wp-config.php`** and use it in the plugin to gate behavior (e.g. enabling extra debug logging only when the constant is set). Acceptance (judge-checkable on the produced files): a `wp-config.php` snippet defines the named constant with `define()` (above the "stop editing" line); the plugin reads it with `defined()`/the constant to gate behavior; the value/behavior matches the prompt. Source: on-domain `developer.wordpress.org/apis/wp-config-php/` + `developer.wordpress.org/advanced-administration/...`. Record `# Harness dependency:` (the plugin scaffold can't ship a `wp-config.php`, so the produced snippet is judge-graded statically — mirrors theme.json/blueprint).

- Catalog: **promote both stubs IN PLACE** to full records — drop the `# Deferred:` comments, add verbatim prompt+acceptance, add `# Harness dependency:` notes; keep them under their existing `# === Area: Advanced Administration ===` / `# === Area: Code Reference ===` sections (rename the stub comment to an implemented note as needed). Update the catalog header's implemented-areas list to add Advanced Administration + Code Reference. Exactly one record per name; no duplicates. iAPI untouched; other records unchanged. Static/structural verification; pass not required.

## Note

This completes the campaign (all 9 reviews) and the full coverage push: every agent-skills gap + every deferred area now has a shipped scenario.
