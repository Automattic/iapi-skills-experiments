# Code Plan Review

## Verdict: rejected

## Summary

The plan is thorough, well-structured, and largely correct. Scenario coverage is exact (68
scenarios, 9 migrate + 59 new, verified against both the proposal listing and the design
doc mapping table). Task ordering is sound (Task 1 and 2 parallel, Task 4 after Task 1,
Tasks 5-16 after Task 4 with Task 7 additionally gated on Task 2). The tooling changes
(`scenarioDirOf()` patch, Skillsmith SHA bump, rubric edit, `addLockProbe` helper) are
precisely specified and traceable to spec/design. All special cases are correctly handled
(`classic-theme-banner` off-convention scoping, `locked-private-store` via `addLockProbe`,
`pageview-analytics-bridge` inline analytics stub). One internal inconsistency in Task 7
must be resolved: the task title and goal state "8 new scenarios" while the files-to-change
list, files count, and acceptance criterion all say 7. This numerical contradiction is
specific enough to cause a code-writer to add a spurious eighth scenario to reconcile the
mismatch, breaking the 68-total count.

## Issues

### Issue 1: Task 7 title and goal claim "8 new scenarios" but the task body is for 7

**What's wrong:** Task 7 is headed "Author `state-and-context` group (8 new scenarios)"
and the Goal line reads "Author the 8 net-new `state-and-context` scenarios". However, the
"Files to change (create)" list enumerates exactly 7 directories (`nested-theme-card`,
`php-seeded-context`, `product-quantity-stepper`, `cart-count-cross-block`,
`locked-private-store`, `pageview-analytics-bridge`, `cross-namespace-now-playing`), and
the Acceptance criterion says "All 7 directories exist under
`eval/scenarios/state-and-context/`". The mapping table likewise shows exactly 7 rows
assigned to Task 7 (all marked "new"). The correct new count is 7: the group has 9 total
scenarios, 2 of which (`independent-counters`, `shared-state-tally`) migrate in Task 4,
leaving 7 to author in Task 7.

**Where in plan:** Task 7 header title and Goal line.

**Suggestion:** Change the task title to "Author `state-and-context` group (7 new
scenarios)" and the Goal line to "Author the 7 net-new `state-and-context` scenarios". No
other change is needed — the files list, the scenario count, and the acceptance are all
correct at 7.

**Why it matters:** A code-writer reading "8 net-new" against an acceptance that says
"All 7 directories" will see an unexplained discrepancy and may attempt to add a missing
eighth scenario (or conclude the plan is erroneous) rather than trusting the files list.
Either outcome risks corrupting the 68-scenario total or blocking the task.
