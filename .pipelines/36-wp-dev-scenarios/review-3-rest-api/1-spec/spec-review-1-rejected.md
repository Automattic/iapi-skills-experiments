# Spec Review

## Verdict: rejected

## Summary

The spec is well-structured and covers all three targeted sub-areas (`register_rest_field`, `validate_callback`/`sanitize_callback`, `permission_callback`). The e2e channel descriptions are accurate and grounded in the actual installed package (v1.44.0). The 401-not-403 pin is correctly stated, the WHAT-not-HOW boundary is observed for prompt wording and exact new directory names, and all 18 acceptance criteria are in Given-When-Then form and statically checkable. One real defect exists: requirement 6 and AC 6 contradict each other and contradict the research recommendation on whether the global-parameters (`_fields`/`_embed`) sub-area must have a new catalog stub. A code-writer cannot resolve this ambiguity from the spec alone.

## Issues

### Issue 1: Requirement 6 mandates a catalog stub for `_fields`/`_embed`, but AC 6 and the Out of Scope section do not confirm this, and the research explicitly says to drop it

**What's wrong:** Requirement 6 opens with a blanket rule — "Each major uncovered REST API sub-area NOT implemented as a scenario is represented in the catalog as a lighter stub carrying a brief recorded reason" — and then lists global-parameters (`_fields`/`_embed`) as one such sub-area. Taken literally, this requires the code-writer to add a brand-new catalog entry for `_fields`/`_embed`, which does not currently exist in `_wp-dev-candidates.yaml`. However:

- The research (Q3-A3) explicitly says to "DROP" the `_fields`/`_embed` candidate — "Not a fit for the scaffold-plugin-edit harness. Drop (would be a usage scenario, out of scope)." No stub is recommended.
- AC 6 says the sub-area should be "recorded as out of scope with the reason" — which could mean (a) a new catalog stub, (b) the spec's own Out of Scope section (which already lists it as item 7), or (c) something else. The AC does not resolve the ambiguity.
- The Out of Scope section (item 7) records `_fields`/`_embed` as out of scope but says nothing about a catalog stub.
- Requirement 13 ("Stubs reconciled; no stale or mismatched records") describes only the three scenarios and `rest-api-authentication-nonce` — it does not mention a `_fields`/`_embed` stub — which implies no new stub is expected. This directly contradicts requirement 6's blanket rule.

The result: two implementations are possible. One code-writer adds a new `_fields`/`_embed` catalog stub (following requirement 6). Another does not (following requirement 13, the research, and the spirit of AC 6). Both can argue they followed the spec.

**Where in spec:** Requirement A.6 (blanket "represented in the catalog as a lighter stub" rule); AC 6 ("recorded as out of scope with the reason" — medium unspecified); Requirement D.13 (enumerates the catalog delta without mentioning a `_fields`/`_embed` stub); Out of Scope item 7 (records the reason but doesn't say "add a stub").

**Suggestion:** Make requirement 6 explicit about the medium. Either:
- Change the blanket rule to scope it only to sub-areas that already have stubs (matching the actual catalog state and requirement 13), and state that `_fields`/`_embed` is recorded solely in the spec's Out of Scope section (no new catalog entry required), OR
- Add a `_fields`/`_embed` stub to the catalog delta enumerated in requirement 13 and update AC 6 to say "When inspecting `_wp-dev-candidates.yaml`, Then a lighter stub exists for global-parameters…".

The research recommendation is to drop entirely (no stub), so the former is more consistent with the research. The key fix is removing the ambiguity so only one implementation is possible.

**Why it matters:** The catalog delta is one of the concrete, verifiable deliverables of this review. If "no stub needed" and "a stub is required" are both defensible readings, the code-reviewer cannot check compliance unambiguously, and a wrong implementation may not be caught until the doc phase.
