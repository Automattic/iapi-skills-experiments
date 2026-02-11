# CLAUDE.md

## Project Context

This repository is an experimentation space for developing WordPress Interactivity API (IAPI) agent skills. Skills developed here are intended to eventually be contributed to the official [WordPress/agent-skills](https://github.com/WordPress/agent-skills) repository.

## Repository Layout

- `skills/wp-interactivity-api/` -- The main skill being developed
  - `SKILL.md` -- Main skill instructions (YAML frontmatter + procedural steps)
  - `references/` -- Deep-dive reference documents
  - `scripts/` -- Helper scripts (`.mjs`, ES modules)
- `shared/scripts/` -- Shared tooling
- `shared/references/` -- Shared reference data
- `docs/` -- Development and process documentation

## Key Conventions

- Follow the official agent-skills [authoring guide](https://github.com/WordPress/agent-skills/blob/trunk/docs/authoring-guide.md) for SKILL.md format.
- Every SKILL.md must have YAML frontmatter with `name`, `description`, and `compatibility`.
- Keep SKILL.md concise and procedural. Push detailed explanations into `references/` files.
- Scripts must be `.mjs` (ES modules), deterministic, and side-effect-free.
- Target WordPress 6.9+ and PHP 7.2.24+.

## When Editing Skills

1. Read the existing SKILL.md and references before making changes.
2. Keep procedures as step-by-step checklists.
3. Include verification steps so the AI can confirm its work.
4. Document failure modes and debugging steps.
5. Add concrete examples, not abstract theory.

## Important References

- Official repo: https://github.com/WordPress/agent-skills
- Interactivity API docs: https://developer.wordpress.org/block-editor/reference-guides/interactivity-api/
