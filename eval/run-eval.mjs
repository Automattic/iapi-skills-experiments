#!/usr/bin/env node

/**
 * Main eval orchestrator.
 *
 * Usage:
 *   node eval/run-eval.mjs [format|llm|all] [--scenarios=counter-block]
 *
 * Subcommands:
 *   format   — Format validation only (existing harness)
 *   llm      — LLM evaluation only (student + judge)
 *   all      — Both stages (default)
 *
 * Options:
 *   --scenarios=name1,name2   Run only specified scenarios
 */

import { execFileSync } from "node:child_process";
import path from "node:path";
import { loadConfig } from "./lib/config.mjs";
import { createProvider } from "./lib/providers/index.mjs";
import { loadSkillContext } from "./lib/skill-loader.mjs";
import { loadScenario, listScenarios } from "./lib/scenario-loader.mjs";
import { evaluate } from "./lib/judge.mjs";
import { reportFormatStage, reportLLMStage } from "./lib/reporter.mjs";

const EVAL_DIR = path.dirname(new URL(import.meta.url).pathname);
const REPO_ROOT = path.join(EVAL_DIR, "..");

// ---------------------------------------------------------------------------
// Stage 1: Format validation
// ---------------------------------------------------------------------------

function runFormatValidation() {
  const harnessPath = path.join(EVAL_DIR, "harness", "run.mjs");
  try {
    const output = execFileSync("node", [harnessPath, REPO_ROOT], {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });

    // Parse pass/fail counts from output.
    const match = output.match(/(\d+)\s+passed,\s+(\d+)\s+failed/);
    const passed = match ? parseInt(match[1], 10) : 0;
    const failed = match ? parseInt(match[2], 10) : 0;

    return { ok: true, passed, failed, output };
  } catch (err) {
    const output = err.stdout || err.message;
    const match = output.match(/(\d+)\s+passed,\s+(\d+)\s+failed/);
    const passed = match ? parseInt(match[1], 10) : 0;
    const failed = match ? parseInt(match[2], 10) : 0;

    return { ok: false, passed, failed, output };
  }
}

// ---------------------------------------------------------------------------
// Stage 2: LLM evaluation
// ---------------------------------------------------------------------------

async function runLLMEvaluation(config) {
  const student = createProvider(config.student);
  const judge = createProvider(config.judge);

  // Determine which scenarios to run.
  const allScenarios = listScenarios();
  const selectedNames =
    config.scenarios && config.scenarios.length > 0
      ? config.scenarios
      : allScenarios;

  // Validate scenario names.
  for (const name of selectedNames) {
    if (!allScenarios.includes(name)) {
      throw new Error(
        `Unknown scenario "${name}". Available: ${allScenarios.join(", ")}`
      );
    }
  }

  // Load skill context once (shared across scenarios).
  const skillContext = loadSkillContext(config.skill, REPO_ROOT);

  const results = [];

  for (const scenarioName of selectedNames) {
    const scenario = loadScenario(scenarioName);

    process.stdout.write(`  Running: ${scenarioName}...`);

    // Call student LLM with skill context as system prompt.
    const generatedCode = await student.complete({
      system: skillContext,
      user: scenario.prompt,
    });

    // Call judge LLM to evaluate the generated code.
    const judgeResult = await evaluate({
      judge,
      prompt: scenario.prompt,
      generatedCode,
      rubric: scenario.rubric,
    });

    const failCount = judgeResult.results.filter((r) => !r.pass).length;
    process.stdout.write(` ${failCount === 0 ? "PASS" : "FAIL"}\n`);

    results.push({
      scenario: scenarioName,
      results: judgeResult.results,
      generatedCode,
    });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const config = loadConfig();

  // Determine subcommand.
  const subcommand = process.argv[2] || "all";
  const validCommands = ["format", "llm", "all"];
  const command = validCommands.includes(subcommand) ? subcommand : "all";

  process.stdout.write("=== IAPI Skill Evaluation ===\n");

  let exitCode = 0;

  // Stage 1: Format validation.
  if (command === "format" || command === "all") {
    const formatResult = runFormatValidation();
    reportFormatStage(formatResult);

    if (!formatResult.ok) {
      exitCode = 1;
    }
  }

  // Stage 2: LLM evaluation.
  if (command === "llm" || command === "all") {
    const studentLabel = `${config.student.provider}/${config.student.model}`;
    const scenarioResults = await runLLMEvaluation(config);

    reportLLMStage({ studentLabel, scenarios: scenarioResults });

    // Check for failures.
    const hasFailures = scenarioResults.some((s) =>
      s.results.some((r) => !r.pass)
    );
    if (hasFailures) {
      exitCode = 1;
    }
  }

  process.exit(exitCode);
}

main().catch((err) => {
  process.stderr.write(`\nError: ${err.message}\n`);
  if (err.stack) {
    process.stderr.write(`${err.stack}\n`);
  }
  process.exit(2);
});
