# Genericize provider/tool branding and bump the smart model

> **Origin**
> Review of the completed `34-skillsmith-integration` pipeline (base run), layered onto its open PR: [Automattic/wordpress-skill-experiments#35](https://github.com/Automattic/wordpress-skill-experiments/pull/35), which implements [issue #34](https://github.com/Automattic/wordpress-skill-experiments/issues/34).
>
> After reviewing the PR, the owner requested three changes:
>
> 1. **The WordPress skill is not a Claude skill** — it's usable with any provider. Reword where the *skill itself* is described as Claude-specific so it reads provider-agnostic. The `claude-code` testing-provider config and the "Claude Code is the agentic coding tool" dev-tooling note are real and stay; only the skill's own branding changes.
> 2. **Use Opus 4.8 as the smart model** in the Skillsmith configuration.
> 3. **Make the test-block example agnostic to Skillsmith** — rename the `skillsmith/testing-block` example to a neutral namespace like `wp-skill/testing-block`, and check for other mentions of the Skillsmith repo. The Skillsmith config/import stays — the repo uses Skillsmith as a tool.
>
> This file is self-contained; agents do not need to open the source PR or issue.

## Goal

The repo and its eval fixtures present the WordPress skill and its test scaffolding as tool- and provider-agnostic, while still consuming Skillsmith as the evaluation tool:

- The `wordpress-development` skill is described as a standalone, provider-agnostic skill — not a "Claude Code skill."
- The Skillsmith config's "smart" testing agent runs on Opus 4.8.
- The evaluation's example block drops the Skillsmith name for a neutral namespace such as `wp-skill/testing-block`, consistent with the block class the e2e tests assert on.

## Constraints

- Keep consuming Skillsmith as a tool: the `@automattic/skillsmith` dependency/import, the `.skillsmith/` output directory, the `claude-code` testing provider, and the `skillsmith.config.ts` structure all stay. Only the *smart model* value changes.
- Do not regress the eval suite: the block name and the derived `wp-block-…` CSS class the e2e specs locate on must stay consistent after the rename.

## Assumptions / directions to explore

Orchestrator's first-pass findings, recorded as open for the spec/research phases to confirm or correct:

- The only place the *skill itself* is branded Claude-specific is the `README.md` tagline ("A single Claude Code skill for WordPress development"). Other "Claude" mentions name the `claude-code` Skillsmith provider (`.env.example`, README env section, `skillsmith.config.ts`) or the project's dev tooling (`.rp.md`) and are out of scope.
- The "smart" model is the `opus` agent in `skillsmith.config.ts` (`model: "claude-opus-4-7"`, used for the `judge` and `improver` roles) → target `claude-opus-4-8`; the `haiku` test agent is unchanged.
- `skillsmith/testing-block` appears as the block name in `eval/utils/scaffold-plugin.ts`, `eval/prompts/testing-agent.md`, and every scenario `e2e.spec.mjs`, plus the derived class `wp-block-skillsmith-testing-block`; a `wp-skill` namespace changes both everywhere.
- Every other `skillsmith` reference (the `@automattic/skillsmith` import/dependency, `.skillsmith/` output, the README link to the Skillsmith repo) is legitimate tool usage and stays.
