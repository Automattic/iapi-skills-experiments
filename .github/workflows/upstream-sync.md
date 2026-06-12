---
name: Upstream iAPI Sync
description: Weekly tracker for WordPress Interactivity API changes that may affect skills

on:
  schedule:
    - cron: "0 10 * * 3" # Wednesday 10AM UTC

permissions:
  contents: read
  pull-requests: read

tools:
  github:
    toolsets: [repos, search, pull_requests]
    read-only: true
  web-fetch:
  bash: ["node", "npm", "cat", "grep", "ls", "head", "tail", "git"]

safe-outputs:
  create-pull-request:
    title-prefix: "[upstream-sync] "
    labels: [upstream-sync, automated]
    draft: true
  create-issue:
    title-prefix: "[upstream-sync] "
    labels: [upstream-sync, automated]

engine:
  id: claude
  model: claude-sonnet-4

timeout-minutes: 15
---

# Upstream Interactivity API Change Tracker

You are monitoring the WordPress Interactivity API for changes that may require updates to our coding agent skills.

## Step 1: Find Recent iAPI Changes

Search the `WordPress/gutenberg` repository for recently merged pull requests that touch the Interactivity API:

- Search for merged PRs from the **last 7 days** that modify files under `packages/interactivity/`
- Also check PRs modifying `packages/interactivity-router/`
- Focus on: new directives, API changes, deprecations, bug fixes that change behavior

## Step 2: Analyze Our Current Skills

Read the skill and reference files in this repository:

- `skills/wordpress-development/SKILL.md`
- `skills/wordpress-development/references/*.md`

Identify what our skills currently document about the Interactivity API.

## Step 3: Compare and Identify Gaps

For each upstream change found:

1. Determine if the change affects any documented behavior in our skill files
2. Check if new directives or API surface were added that we don't cover
3. Note any deprecations of patterns we currently recommend

## Step 4: Report

If there are **no relevant changes**, create an issue summarizing what was checked and that no action is needed.

If there **are relevant changes**, create a draft pull request that:

- Updates the affected reference files with new/changed API information
- Adds notes about deprecations if applicable
- Includes a summary of all upstream PRs reviewed in the PR description

Format the PR description as:

```markdown
## Upstream Changes

| PR | Title | Impact |
|----|-------|--------|
| gutenberg#XXXXX | Title here | Brief impact description |

## Proposed Skill Updates

- List of changes made to skill/reference files

## References

- Links to relevant upstream PRs
```
