# Local Development

This guide explains how to test skill changes locally in a WordPress project using the AI coding tools that support the Agent Skills standard.

## Overview

Skills are Markdown-based instructions (`SKILL.md` files) that AI coding agents discover and follow. Each tool looks for skills in specific directories.

This repo includes copies of the build/install scripts from the official [WordPress/agent-skills](https://github.com/WordPress/agent-skills) repository. These scripts package skills into the correct directory layout for each tool and install them into a target project.

## Build and install

### Step 1: Build

```bash
node shared/scripts/skillpack-build.mjs --clean
```

This creates packaged copies under `dist/` with the correct directory structure for each tool:

```
dist/
  codex/.codex/skills/wp-interactivity-api/SKILL.md
  vscode/.github/skills/wp-interactivity-api/SKILL.md
  claude/.claude/skills/wp-interactivity-api/SKILL.md
  cursor/.cursor/skills/wp-interactivity-api/SKILL.md
```

You can build for a specific target or skill:

```bash
# Only build for Claude Code
node shared/scripts/skillpack-build.mjs --clean --targets=claude

# Only build a specific skill
node shared/scripts/skillpack-build.mjs --clean --skills=wp-interactivity-api
```

### Step 2: Install

```bash
# Install into a WordPress project for Claude Code and Cursor
node shared/scripts/skillpack-install.mjs --dest=../my-wp-project --targets=claude,cursor

# Install globally for Claude Code
node shared/scripts/skillpack-install.mjs --global

# Install globally for Cursor
node shared/scripts/skillpack-install.mjs --targets=cursor-global

# Dry run (see what would be installed without making changes)
node shared/scripts/skillpack-install.mjs --dest=../my-wp-project --targets=claude --dry-run
```

## Recommended development workflow

1. **Clone this repo** next to your WordPress project:
   ```
   ~/code/
     iapi-skills-experiments/   <-- this repo
     my-wp-project/             <-- your WordPress project
   ```

2. **Build and install** into your project:
   ```bash
   cd iapi-skills-experiments
   node shared/scripts/skillpack-build.mjs --clean --targets=claude
   node shared/scripts/skillpack-install.mjs --dest=../my-wp-project --targets=claude
   ```

3. **Test** by opening your WordPress project in the AI tool and asking it to perform tasks that should trigger the skill.

4. After editing skills, **re-run build + install** to update the target project.

5. **Clean up** when done: remove the installed skill directories from the target project. The `dist/` directory is gitignored.

## Alternative: symlinks for faster iteration

For tools that support symlinks (Claude Code, Cursor, OpenCode), you can skip the build/install cycle and symlink the skill directory directly. Every edit is reflected immediately.

```bash
# Claude Code (project-level)
mkdir -p ../my-wp-project/.claude/skills
ln -s "$(pwd)/skills/wp-interactivity-api" ../my-wp-project/.claude/skills/wp-interactivity-api

# Claude Code (global)
mkdir -p ~/.claude/skills
ln -s "$(pwd)/skills/wp-interactivity-api" ~/.claude/skills/wp-interactivity-api

# Cursor (project-level)
mkdir -p ../my-wp-project/.cursor/skills
ln -s "$(pwd)/skills/wp-interactivity-api" ../my-wp-project/.cursor/skills/wp-interactivity-api
```

**Caveats:**
- **Codex ignores symlinks** — use the build/install workflow instead.
- Relative symlinks can break if you move directories. Use absolute paths (as shown above with `$(pwd)`).

## Skill directory locations by tool

Each tool scans specific paths. All project-level paths are relative to the root of the target repository.

| Tool | Project path | Global path |
|------|-------------|-------------|
| Claude Code | `<repo>/.claude/skills/<name>/` | `~/.claude/skills/<name>/` |
| Codex | `<repo>/.codex/skills/<name>/` | `~/.codex/skills/<name>/` |
| Cursor | `<repo>/.cursor/skills/<name>/` | `~/.cursor/skills/<name>/` |
| VS Code (Copilot) | `<repo>/.github/skills/<name>/` | — |
| OpenCode | `<repo>/.opencode/skills/<name>/` | `~/.config/opencode/skills/<name>/` |
