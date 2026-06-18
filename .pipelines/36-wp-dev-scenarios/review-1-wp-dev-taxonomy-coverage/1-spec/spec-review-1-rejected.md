# Spec Review

## Verdict: rejected

## Summary

The spec is thorough, well-structured, and correctly aligned with the intent and consolidated requirements across nearly every dimension: WHAT-not-HOW is preserved; first-area pick and taxonomy content are correctly deferred to design; all acceptance criteria are in Given-When-Then form; static/structural verification is consistently enforced; the two-layer artifact model (taxonomy + catalog), flat discovery constraints, v1 non-duplication, and skill-untouched requirements are all present and internally consistent. One issue warrants rejection: Requirement 8 and Acceptance Criterion 8 require that "each acceptance point traces to an official documentation page (cited URL)" but do not specify WHERE the citation lives. This produces a genuine two-implementer divergence — one embeds URLs in `scenario.yaml` acceptance strings, another tracks them only in the catalog's source provenance field — and both readings are consistent with isolated parts of the spec. The first reading conflicts with R9 (which bars catalog-only fields from `scenario.yaml`) and with the v1 precedent (no URLs in any acceptance string); the second reading makes AC8 non-verifiable from the `scenario.yaml` alone. The fix is a single clarifying sentence.

## Issues

### Issue 1: R8 / AC8 — "cited URL" for acceptance points is ambiguous about where the citation lives

**What's wrong:**
Requirement 8 states: "each acceptance point traces to an official documentation page (cited URL)." Acceptance Criterion 8 states: "each is supported by an official developer.wordpress.org documentation page (cited URL)." Neither says WHERE the citation lives. There are two plausible readings:

- Reading A: the citation is embedded in the acceptance string itself inside `scenario.yaml` — i.e., each acceptance line includes a URL or a parenthetical reference. This interpretation is consistent with the literal phrase "each acceptance point … (cited URL)" but conflicts with R9, which bars catalog-only fields from `scenario.yaml`, and with the v1 precedent (all four v1 scenario.yaml files contain zero URLs in their acceptance strings).

- Reading B: traceability lives in the catalog's `source_files`/`source` provenance field (the `_candidates.yaml` precedent), not in the `scenario.yaml` at all. Under this reading, AC8 is not checkable by inspecting `scenario.yaml` alone — a reviewer would need to look up the corresponding catalog entry and verify coverage.

Reading A and Reading B produce materially different implemented artifacts. Under Reading A, `scenario.yaml` acceptance lists look like:
```
- "Plugin registers the taxonomy on init. (https://developer.wordpress.org/plugins/taxonomies/)"
```
Under Reading B, the acceptance string is clean and the catalog entry carries the URL. Neither reading is clearly ruled out by the spec.

**Where in spec:** Section C R8 (line 46); Acceptance Criteria AC8 (line 100).

**Suggestion:** Add a single clarifying sentence to R8 and AC8 specifying where the citation must appear. The correct resolution (consistent with R9 and v1 precedent) is Reading B: traceability lives in the catalog's source provenance field, not in the `scenario.yaml` acceptance strings. Suggested addition to R8: "Source traceability for acceptance points is carried by the corresponding catalog entry's source provenance field, not embedded in the `scenario.yaml` acceptance strings — acceptance strings remain clean, human-readable check statements as in the v1 scenarios." AC8 should then test: "the corresponding catalog entry's source provenance field cites the developer.wordpress.org page that grounds the acceptance check."

**Why it matters:** A code writer who follows AC8 literally will embed URLs in every acceptance string, producing a `scenario.yaml` format that diverges from every existing scenario in the repo and arguably violates the spirit of R9. A code reviewer would then have conflicting spec criteria to adjudicate between (R9 vs AC8). The ambiguity is small in surface area but creates a real implementer divergence and a spec-internal tension.
