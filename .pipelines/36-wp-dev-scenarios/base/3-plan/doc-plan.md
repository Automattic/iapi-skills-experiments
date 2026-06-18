# Doc Plan: Initial simple WordPress development scenarios

## Overview

The code phase adds four new self-describing Skillsmith eval scenarios under `eval/scenarios/` (`filter-body-class`, `shortcode-with-attr`, `cpt-register`, `rest-custom-endpoint`), broadening the suite beyond the Interactivity API. Each scenario carries its own `description`, `prompt`, and `acceptance` inside its `scenario.yaml`; the spec forbids duplicating that content in external docs (it would drift) and forbids touching or describing the skill (`skills/wordpress-development/`). A full sweep of the repository's live documentation found **no doc that goes stale** when these scenarios land: no doc enumerates scenarios exhaustively, claims a scenario count, or asserts "all scenarios target the Interactivity API." The only Interactivity-API "main topic" statement (`README.md` line 7) is explicitly scoped to the *skill*, which is unchanged by this work, so it stays accurate. Consequently this is a deliberately **near-empty doc plan**: it contains a single small, optional, drift-resistant README touch-up that keeps an illustrative example list representative of the now-broader suite. The justification for why every other doc surface is intentionally left untouched is recorded below under "Surfaces deliberately not changed."

## Guardrail scopes

No project guardrails. This project defines no scoped gates, so there is no guardrail scope to fill.

## Tasks

### Task 1: Refresh the README's single-scenario example list to reflect the broadened suite

- **Goal:** Update the illustrative scenario-name example(s) in the README's "Running evals → Single scenario" section so they no longer cite only Interactivity-API scenarios, keeping the example representative now that the suite spans non-Interactivity-API topics. This is a one-line illustrative refresh only — it must not turn into an enumeration of scenarios or a description of what each scenario does.
- **Audience:** Repository contributors and skill maintainers running evals locally from the README.
- **Files to change:**
  - `README.md` — only the "Running evals" → "Single scenario (the normal dev workflow)" subsection, specifically the sentence that gives example scenario directory names (currently around line 31: "Scenario names are the bare directory names under `eval/scenarios/` (e.g. `counter`, `async-fetch`).") and/or the worked `npx skillsmith <name>` example beneath it.
- **Sections / scope:**
  - **Touch:** the illustrative example scenario name(s) in the "Single scenario" subsection — add or substitute at least one of the four new non-Interactivity-API scenario directory names (`filter-body-class`, `shortcode-with-attr`, `cpt-register`, or `rest-custom-endpoint`) as an example, drawing the exact directory name from what actually exists under `eval/scenarios/` at phase-5 time.
  - **Do NOT touch:** the "Skill structure" section (line 7) — it describes the *skill*, which is unchanged and out of scope; the "Prerequisites", "Environment setup", "Full matrix", "Report location", and "Agent cap (R12)" sections; any wording about the run mechanics, report paths, or the agent cap. Do **not** convert the example into an exhaustive scenario list, and do **not** restate any scenario's `description`/`prompt`/`acceptance` (that content lives in each `scenario.yaml` and would drift). Keep it to illustrative example name(s) only.
- **Depends on:** none
- **Traces to:** Spec Requirement 1 (broaden beyond the Interactivity API) and Acceptance Criterion 1 (suite now spans non-Interactivity-API topic areas); Code plan Tasks 1–4 (the four new scenario directories whose names this example should reflect).
- **Acceptance:**
  - A reader of the README's "Single scenario" subsection sees at least one example scenario name that is a non-Interactivity-API scenario actually present under `eval/scenarios/`, so the illustrative list reflects the broadened suite.
  - The example name(s) used exactly match real directory names under `eval/scenarios/` as they exist when the task runs (verified against the filesystem, not assumed).
  - The change is confined to the "Single scenario" subsection; no other README section is modified, and the "Skill structure" section is left untouched.
  - The README does not gain an exhaustive scenario enumeration and does not restate any `scenario.yaml` `description`/`prompt`/`acceptance` text.

## Surfaces deliberately not changed (and why)

This section records the end-to-end documentation sweep so a reviewer can confirm no live doc was left out of sync. Each surface below references the eval suite, scenarios, or the Interactivity API, and each is intentionally excluded.

- **`README.md` "Skill structure" (line 7) — "Currently the main topic is the Interactivity API."** Out of scope: this sentence describes the **skill** under `skills/wordpress-development/`, which this work does not modify (Spec Requirement 11 / Acceptance Criterion 9; Out of Scope item 3). The statement remains factually accurate after the scenarios land. Editing it would mean documenting skill content the spec forbids.
- **`eval/prompts/improver.md` — "Keep it focused on the Interactivity API, and not whole WordPress."** Out of scope: this prompt governs growing the **skill**, which is explicitly deferred follow-up work (Out of Scope item 3). Broadening it here would anticipate skill changes that this batch does not make.
- **`eval/prompts/testing-agent.md` — block-scaffold instructions (`wp-skill/testing-block`, `get_block_wrapper_attributes()`).** Out of scope: this is a harness/scaffold-facing prompt. The design doc establishes that the block scaffold is consumed unchanged and that the new non-block scenarios coexist with it without modification (Design "Explicitly NOT modified"; Out of Scope item 7). Touching it would be a harness change.
- **`eval/rubrics/wp-interactivity-api-best-practices.md` — the Interactivity-API rubric.** Out of scope: the design adds **zero** new rubrics and leaves this one untouched (Spec Requirement 9 / Acceptance Criterion 8; Design "Add zero new shared rubrics"). It applies only to Interactivity-API scenarios and is unaffected.
- **Each new scenario's `scenario.yaml` (`description`, `prompt`, `acceptance`).** Not a doc-plan surface: these are authored by the code phase (Code plan Tasks 1–4) and are the canonical, self-describing source for each scenario. The spec forbids duplicating them in external docs because that content would drift.
