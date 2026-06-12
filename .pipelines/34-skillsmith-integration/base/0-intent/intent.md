# Integrate the repo with Skillsmith and clean up what's now obsolete

> Source: GitHub issue [Automattic/wordpress-skill-experiments#34](https://github.com/Automattic/wordpress-skill-experiments/issues/34).
> This file is self-contained; agents do not need to open the source issue.

## Goal

The repo uses [Skillsmith](https://github.com/Automattic/skillsmith) as its skill-evaluation tool, and everything in the repo that no longer makes sense after that move is cleaned up.

## Context

- This repo was previously used to explore how to evaluate iapi-skills.
- That exploration concluded with the decision to build an agnostic, standalone evaluation tool instead: [Skillsmith](https://github.com/Automattic/skillsmith).
- Skillsmith is a harness with two parts: a **Skill Tester** that sends scenario prompts to LLMs loaded with a skill and validates the answers end-to-end in a real runtime (producing a pass/fail matrix per skill × model × test case), and an opt-in **Self-Improvement loop** that lets an agent edit a failing skill and re-run the tests until the suite passes. Project-specific behaviour is supplied through hooks; Skillsmith's README cites a "WordPress reference project" as its hook example (scaffolding a plugin per scenario, then running Playwright e2e specs via `wp-env`).

## Assumptions / directions to explore

- Parts of the existing evaluation machinery in this repo are likely superseded by Skillsmith and can be removed; what exactly qualifies is open for the agents to determine.
- The existing GitHub Actions workflows should be reviewed as part of this — some may no longer make sense and could need removal or replacement.
