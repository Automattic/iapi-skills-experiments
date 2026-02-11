# IAPI Skills Experiments

An experimentation space for developing and iterating on **Interactivity API (IAPI) agent skills** before contributing them to the official [WordPress agent-skills](https://github.com/WordPress/agent-skills) repository.

## What Are Agent Skills?

Agent Skills are portable bundles of instructions, references, and scripts that teach AI coding assistants how to work with WordPress APIs correctly. This repo focuses specifically on skills related to the **WordPress Interactivity API**.

## Repository Structure

```
skills/
  wp-interactivity-api/
    SKILL.md              # Main skill instructions
    references/           # Deep-dive docs on specific topics
    scripts/              # Deterministic helpers (detection, validation)
shared/
  scripts/                # Shared tooling (validation, scaffolding)
  references/             # Shared reference data
docs/                     # Development and process documentation
```

## Quick Start

1. Clone this repo:
   ```bash
   git clone https://github.com/santosguillamot/iapi-skills-experiments.git
   cd iapi-skills-experiments
   ```

2. Explore the skill under `skills/wp-interactivity-api/`.

3. Edit and iterate on `SKILL.md` and the `references/` files.

4. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on skill structure and validation.

## Relationship to the Official Repo

This is a **sandbox for experimentation**. Once skills are validated and polished here, they should be contributed upstream to the official [WordPress/agent-skills](https://github.com/WordPress/agent-skills) repository following their [contributing guidelines](https://github.com/WordPress/agent-skills/blob/trunk/CONTRIBUTING.md).

## License

MIT -- see [LICENSE](LICENSE).
