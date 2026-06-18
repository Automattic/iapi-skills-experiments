# Design Doc Review

## Verdict: rejected

## Summary

The design doc is thorough, internally consistent, and well-grounded: the catalog mechanics are correctly reasoned (non-directory file skipped by `isDirectorySafe` guard A before the YAML check — verified verbatim against `enumerate.ts`), the first-area justification against all six criteria is solid, all six scenarios avoid v1 sub-areas, the correctness notes (32-char taxonomy key, `init`/`rest_api_init` for settings, cron cleanup alternatives, i18n auto-load caveat) are accurate, and the e2e lifecycle template matches the codebase conventions. One real defect prevents approval: three of the four WordPress Playground sub-area records lack concrete developer.wordpress.org URLs, substituting `(under playground resources)` as a placeholder — a clear violation of Acceptance Criterion 2, which requires every sub-area record to carry a source URL. This is the only rejection issue.

## Issues

### Issue 1: Three WordPress Playground sub-areas lack concrete source URLs

**What's wrong:** The Reference Taxonomy section for the WordPress Playground area lists four sub-areas. Three of them do not carry a developer.wordpress.org URL:

```
| Quick Start Guide | https://developer.wordpress.org/playground/wordpress-playground-resources/ |
| Blueprints (JSON) | (under playground resources) |
| Developers (programmatic API) | (under playground resources) |
| API Reference (Query / Blueprints / JS API) | (under playground resources) |
```

The placeholders `(under playground resources)` are not URLs. The landing page URL repeated for "Quick Start Guide" covers only the area-level entry; it does not serve as a concrete sub-area URL for the three remaining rows.

**Where in design doc:** Section "Reference taxonomy → Area: WordPress Playground" (lines listing the four Playground sub-areas).

**Suggestion:** Provide a concrete developer.wordpress.org URL for each of the three missing sub-areas. The research doc also marks these as `(under playground resources)` without resolving them; the writer must fetch the live sub-area URLs and fill them in. If the Playground site navigation genuinely collapses all sub-topics under a single landing URL (i.e., they are not individually addressable pages), the taxonomy entry should explicitly document that — either collapsing the three into one row at the landing URL with a note ("all sub-topics documented at the landing page, no individual sub-area URLs available"), or confirming the individual page URLs if they exist. The key requirement is that no sub-area row is left with a non-URL placeholder.

**Why it matters:** Spec Requirement 2 and Acceptance Criterion 2 are unambiguous: "Given any area or sub-area in the taxonomy, When reviewing its record, Then it carries a developer.wordpress.org source URL." Three sub-area records currently fail this check. The taxonomy's stated purpose is to be drift-auditable against actual developer.wordpress.org structure; rows with placeholder text cannot be audited. The fix is small (fetch and fill in three URLs, or restructure the Playground entry), but it must be done before the design is approved — the design writer cannot leave traceability gaps and delegate them to phase 4.
