# Agent-skills coverage map

This durable artifact records how this repo's Skillsmith eval suite (`eval/scenarios/`) covers the **17 agent-skills topics** published under [`WordPress/agent-skills/skills`](https://github.com/WordPress/agent-skills/tree/trunk/skills). For each topic it records a coverage status (**Covered** / **Covered (partial)** / **Deferred-area** / **Gap**) and the rationale.

The nine **Gap** topics — those with no scenario *and* no prior catalog stub — each have a review-triggerable stub appended to `eval/scenarios/_wp-dev-candidates.yaml` under its `# === Agent-Skills Gaps ===` section. Each gap below cross-links to that stub's `name` and its sub-classification, so any gap can later trigger a dedicated review (the same way the existing area stubs seeded earlier reviews).

This is a planning artifact only — it feeds no runtime. The owner and future reviews are the audience.

## Status legend

- **Covered** — at least one topic folder of implemented scenarios maps to the agent-skills topic.
- **Covered (partial)** — implemented scenarios cover part of the topic; a sub-area is recorded as deferred elsewhere.
- **Deferred-area** — no scenarios; the topic is an explicit, reasoned catalog deferral (off-domain docs and/or a harness wall).
- **Gap** — no scenario and no prior catalog stub. Each gap gets a new stub in the `# === Agent-Skills Gaps ===` section, with a sub-classification:
  - **buildable-plugin** — fits the "build a plugin, grade the code" scenario shape; the most scenario-ready gaps.
  - **review-workflow** — an audit / classify / verify task that produces a report or result, not a plugin; may not fit the build-a-plugin-and-grade shape.
  - **harness-wall** — no PHP-plugin deliverable the current rubrics can grade (e.g. a JS/React UI, or a config-file analysis).

## Coverage table (all 17 topics)

| # | agent-skills topic | Status | Our coverage / rationale | Gap stub (`name`) → sub-class |
|---|---|---|---|---|
| 1 | wp-interactivity-api | **Covered** | `interactivity-api/` (11 scenarios) — strongest coverage. | — |
| 2 | wp-plugin-development | **Covered** | `plugins/` (9 scenarios) + `common-apis/` data storage. Partial on security (nonces/caps) and packaging. | — |
| 3 | wp-block-development | **Covered** | `block-editor/` (5 scenarios). | — |
| 4 | wp-rest-api | **Covered** | `rest-api/` (4 scenarios) + REST-adjacent Plugins scenarios (`post-meta-rest`, `settings-register`, `taxonomy-register` via `show_in_rest`). | — |
| 5 | wp-block-themes | **Covered (partial)** | `themes/` (3 scenarios) cover the classic-theme/plugin surface (enqueue, nav menus, sidebars) but NOT the block-theme core (`theme.json`, templates, Site Editor). The `theme-json-custom-color-palette` stub already records that block-theme core as a catalog deferral (harness wall). Coverage is real but incomplete. | — |
| 6 | blueprint | **Deferred-area** | Playground area; deferred via the `playground-blueprint-plugin-load` stub — off-domain docs + a non-plugin JSON artifact (harness wall). | — |
| 7 | wp-playground | **Deferred-area** | Same Playground deferral as `blueprint`. | — |
| 8 | wp-wpcli-and-ops | **Deferred-area** | WP-CLI Commands deferral (`wp-cli-custom-command` stub — off-domain docs) + Advanced Administration ops deferral (harness wall + overlap). | — |
| 9 | wp-abilities-api | **Gap** | No scenario, no prior stub. WP 6.9+ PHP `register_ability()` + REST exposure — the most scenario-shaped gap; fits the plugin scaffold. | `abilities-api-register` → **buildable-plugin** |
| 10 | wp-performance | **Gap** | No scenario, no prior stub. Performance-as-a-topic is uncovered; primitives partially overlap cron/transients/http, but profiling/caching is not graded today. | `performance-object-cache` → **buildable-plugin** |
| 11 | wp-abilities-audit | **Gap** | No scenario, no prior stub. Audits an existing REST surface for Abilities registrations; produces a report, not a plugin. | `abilities-audit-rest-surface` → **review-workflow** |
| 12 | wp-abilities-verify | **Gap** | No scenario, no prior stub. Verifies Abilities registrations and callback behavior; produces a verification result, not a plugin. | `abilities-verify-callbacks` → **review-workflow** |
| 13 | wp-phpstan | **Gap** | No scenario, no prior stub. Produces a `phpstan.neon` config + analysis, not a plugin deliverable the current rubrics grade. Distinct from our Coding Standards area (see cross-terminology below). | `phpstan-baseline` → **harness-wall** |
| 14 | wordpress-router | **Gap** | No scenario, no prior stub. Meta/orchestration skill (classify a codebase, route to a workflow); no PHP plugin deliverable. | `wordpress-router-classify` → **review-workflow** |
| 15 | wp-project-triage | **Gap** | No scenario, no prior stub. Meta/orchestration; deterministically inspects a repo and produces a structured triage report, not a plugin. | `project-triage-report` → **review-workflow** |
| 16 | wp-plugin-directory-guidelines | **Gap** | No scenario, no prior stub. Reviews a plugin against the WordPress.org Plugin Directory rules (GPL, naming, trademarks, freemium); lint-style, produces findings rather than a plugin. | `plugin-directory-review` → **review-workflow** |
| 17 | wpds | **Gap** | No scenario, no prior stub. Build a UI with WordPress Design System (WPDS) components — JS/React component UI; no PHP-plugin deliverable the current rubrics grade. | `wpds-component-ui` → **harness-wall** |

**Totals:** 4 Covered, 1 Covered (partial), 3 Deferred-area, 9 Gap = 17.

## Gap sub-classification summary

The nine gaps split three ways by how scenario-ready they are:

- **buildable-plugin (2)** — `abilities-api-register` (wp-abilities-api), `performance-object-cache` (wp-performance). These fit the existing "build a plugin, grade the code" shape and are the most ready to become real scenarios.
- **review-workflow (5)** — `abilities-audit-rest-surface` (wp-abilities-audit), `abilities-verify-callbacks` (wp-abilities-verify), `wordpress-router-classify` (wordpress-router), `project-triage-report` (wp-project-triage), `plugin-directory-review` (wp-plugin-directory-guidelines). These are audit/classify/verify tasks that produce a report or result; a future review must decide whether they fit the build-a-plugin-and-grade shape at all.
- **harness-wall (2)** — `phpstan-baseline` (wp-phpstan), `wpds-component-ui` (wpds). These have no PHP-plugin deliverable the current rubrics can grade.

## Cross-terminology (recorded explicitly)

Two places where our area names and the agent-skills topic names look adjacent but are genuinely distinct:

1. **Coding Standards ≠ `wp-phpstan`.** Our Coding Standards area (`coding-standards-php`, `coding-standards-inline-docs`) is **WPCS style + PHPDoc**, whereas agent-skills `wp-phpstan` is **PHPStan static type analysis**. Neither Coding Standards scenario covers PHPStan, and agent-skills has **no WPCS coding-standards skill** — so `wp-phpstan` is a genuine gap, and our Coding Standards area has no agent-skills counterpart at all.

2. **Themes ≠ `wp-block-themes` core.** Our Themes scenarios cover the **classic-theme/plugin API surface** (enqueue, nav-menu locations, sidebar/widget areas). The agent-skills `wp-block-themes` topic centers on **block-theme core** (`theme.json`, templates, Site Editor). The classic coverage is real but **partial** against the agent-skills topic; the block-theme core is recorded separately as the deferred `theme-json-custom-color-palette` catalog stub.

## Provenance

- Coverage statuses and rationales: this review's design doc (`2-design-doc/design-doc.md`, "Coverage Map") and spec research (`1-spec/spec-research.md`, Q3).
- Gap-stub `name`s and sub-classifications: verified against the shipped `# === Agent-Skills Gaps ===` section of `eval/scenarios/_wp-dev-candidates.yaml`.
- Source of truth for the 17 topics: [`WordPress/agent-skills/skills`](https://github.com/WordPress/agent-skills/tree/trunk/skills).
