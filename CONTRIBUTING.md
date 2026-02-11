# Contributing

This repo is a sandbox for experimenting with Interactivity API agent skills. The bar for contributing here is intentionally low -- iterate quickly, validate, then contribute polished skills upstream.

## Skill Structure

Each skill follows the structure from the official [WordPress/agent-skills](https://github.com/WordPress/agent-skills) repo:

```
skills/<skill-name>/
  SKILL.md              # Main instructions (short, procedural)
  references/           # Deep-dive docs on specific topics
    *.md
  scripts/              # Deterministic helpers (optional)
    *.mjs
```

### SKILL.md Format

Every `SKILL.md` needs:

1. **YAML frontmatter** -- `name`, `description`, and `compatibility`
2. **When to use** -- Conditions that trigger this skill
3. **Inputs required** -- What the AI needs to gather first
4. **Procedure** -- Step-by-step checklist
5. **Verification** -- How to confirm it worked
6. **Failure modes / debugging** -- Common problems and fixes
7. **Escalation** -- When to ask for human help

See the [official authoring guide](https://github.com/WordPress/agent-skills/blob/trunk/docs/authoring-guide.md) for full details.

### References

Put detailed topic documentation in `references/`. Keep `SKILL.md` short and push depth into reference files.

### Scripts

Optional helper scripts go in `scripts/`. Use `.mjs` (ES modules) and keep them deterministic -- no network calls, no side effects beyond stdout.

## Workflow

1. Make changes to skill files under `skills/`.
2. Test by using the skill with an AI assistant on real tasks.
3. Iterate based on results.
4. When ready, contribute upstream to [WordPress/agent-skills](https://github.com/WordPress/agent-skills).

## Official Contributing Guide

For the full skill authoring standards and conventions, refer to the official repo's [CONTRIBUTING.md](https://github.com/WordPress/agent-skills/blob/trunk/CONTRIBUTING.md) and [Authoring Guide](https://github.com/WordPress/agent-skills/blob/trunk/docs/authoring-guide.md).
