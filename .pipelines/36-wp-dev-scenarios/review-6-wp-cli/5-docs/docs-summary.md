# Docs summary — review-6-wp-cli (DEFER outcome): no-op

**Outcome: no documentation changes (correct for a defer).**

review-6 deferred the WP-CLI Commands area; the only shipped change is one catalog stub edit. No live documentation goes stale:

- **No live doc enumerates scenarios, claims a count, or asserts which areas are implemented.** The one surface that lists implemented areas — the catalog header line — was deliberately left unchanged (WP-CLI is NOT implemented this review), so it stays accurate.
- **The old stub name `wp-cli-eval-flush-rewrite` appears in zero live files.** The only repository hits are inside `.pipelines/**` planning artifacts (the review-5 and review-6 research docs + the review-6 intent), which are historical pipeline records, not live docs — expected and correct.
- **README pointers stay accurate** — the "two candidate catalogs" pointer and the `(e.g. counter, cpt-register)` illustration are unaffected by an in-place stub edit.
- **Skill, prompts, rubric, `.rp.md`, and the iAPI `_candidates.yaml`** are all byte-untouched.

## The recorded finding (the review's primary product)

The genuine WP-CLI *development* capability — registering a custom `wp` command via `WP_CLI::add_command` — is documented **only off-domain** (make.wordpress.org/cli handbook; developer.wordpress.org/cli/ 301-redirects to the built-in command reference). The on-domain command reference yields only scenarios that duplicate already-covered features. On-domain grounding has been a never-broken invariant (77/77 catalog URLs on developer.wordpress.org). The owner chose to **defer** rather than break that invariant. Framing-A e2e was empirically proven feasible via the `wpCli` stdout channel and is recorded in the deferred stub + spec so it can be promoted if the custom-command docs land on-domain or handbook grounding is explicitly allowed.
