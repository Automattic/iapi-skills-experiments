# Doc plan — review-7-coding-standards

**Outcome: zero documentation tasks (empty plan) — correct for this change shape.**

(Compression note: authored inline by the orchestrator from the approved design doc, alongside the code plan, to reduce exposure to the harness's recurring background-agent watchdog stalls. The same empty-doc-plan conclusion was independently reached and reviewer-approved in all five prior scenario-shipping reviews for the identical change shape; the phase-5 doc-reviewer independently re-confirms no live doc is stale against the shipped code.)

What ships this review: 2 new `coding-standards-*` judge-only scenarios + an in-place edit of the candidate catalog `_wp-dev-candidates.yaml` (promote+rename one stub, add one record, one header-line fix). No live documentation goes stale:

- **No live doc enumerates scenarios, claims a count, asserts which areas the eval suite covers, or describes a scenario-naming convention.** (Verified repeatedly in prior reviews; the phase-5 doc-reviewer re-verifies.)
- The README's "two candidate catalogs" pointer stays accurate after an in-place catalog edit; the `(e.g. counter, cpt-register)` example stays illustrative.
- The one genuinely catalog-internal surface — the implemented-areas header line — is owned by **code Task 3** (not docs), whose acceptance includes adding "Coding Standards".
- Skill, prompts, rubric, `.rp.md`, and the iAPI `_candidates.yaml` are out of scope and untouched.

**Surfaces deliberately not changed (and why):** README (pointer/illustration stay accurate); `eval/prompts/*` and `eval/rubrics/*` (not scenario inventories); `.rp.md` (no scenario/catalog references); the skill (explicitly untouched this review); the iAPI catalog (different suite).

No project guardrails are declared.
