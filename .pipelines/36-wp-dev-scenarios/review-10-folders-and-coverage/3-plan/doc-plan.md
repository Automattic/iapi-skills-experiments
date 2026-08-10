# Doc plan — review-10-folders-and-coverage

**Non-empty doc plan** (unlike prior reviews) — the folder reorganization changes documented facts about scenario layout, and the Skillsmith dependency + coverage map are durable artifacts the owner needs. Authored inline by the orchestrator from the approved design doc.

## Tasks

### Doc Task 1 — README: nested layout + Skillsmith dependency
- **Audience:** contributors / the owner.
- **Files:** `README.md` (the flat-layout references at lines ~31-38 and ~60-66, per the design doc).
- **Scope:** update the prose that describes scenarios as flat immediate children of `eval/scenarios/` to describe the **nested per-topic layout** (the 7 topic folders). Document the **Skillsmith nested-discovery dependency** clearly and actionably: the pinned `@automattic/skillsmith` discovers scenarios with a flat, non-recursive `readdir` and reports a basename `dirName`; nested per-topic scenarios require **two upstream changes** — (A) recursive discovery and (B) relative `dirName` (e.g. `plugins/cpt-register`) — and **until those land, nested scenarios are invisible to the pinned Skillsmith** (accepted; the owner will open the upstream issue). Keep the two-candidate-catalogs description accurate (catalogs stay at root, discovery-skipped).
- **Acceptance:** README no longer claims a flat scenario layout; the new topic-folder structure + the Skillsmith dependency (both upstream changes + the temporary-invisibility caveat) are documented; nothing else in README drifts.

### Doc Task 2 — Coverage map artifact (agent-skills)
- **Audience:** the owner / future reviews.
- **Files:** a durable coverage-map doc under the review's pipeline artifacts (e.g. `.pipelines/36-wp-dev-scenarios/review-10-folders-and-coverage/agent-skills-coverage-map.md`) — NOT a new `skills/` file.
- **Scope:** the full 17-skill covered / partial / deferred-area / gap table (matching the spec/design), with the 9 gaps cross-linked to their catalog gap stubs and sub-classification (buildable-plugin / review-workflow / harness-wall), so each gap can later trigger a review.
- **Acceptance:** all 17 agent-skills classified; the 9 gaps match the catalog stubs added in code Task 4; no `skills/` file created.

## Surfaces deliberately not changed
- The skill (`skills/wordpress-development/`) — untouched (this review reorganizes scenarios, not the skill).
- `eval/prompts/*`, `eval/rubrics/*`, `.rp.md` — no scenario-layout or coverage claims that go stale.
- The iAPI `_candidates.yaml` — byte-untouched.

No project guardrails are declared.
