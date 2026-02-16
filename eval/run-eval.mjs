#!/usr/bin/env node

/**
 * Main eval orchestrator.
 *
 * Usage:
 *   node eval/run-eval.mjs [format|llm|e2e|all] [--scenarios=counter-block]
 *
 * Subcommands:
 *   format   — Format validation only (existing harness)
 *   llm      — LLM evaluation only (student + judge)
 *   e2e      — E2E testing only (requires cached LLM results + Docker)
 *   all      — All three stages (default)
 *
 * Options:
 *   --scenarios=name1,name2   Run only specified scenarios
 */

import fs from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";

// Load .env file from repo root if it exists.
const envPath = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "..",
  ".env"
);
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/);
    if (match && !(match[1] in process.env)) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, "");
    }
  }
}
import { loadConfig } from "./lib/config.mjs";
import { createProvider } from "./lib/providers/index.mjs";
import { loadSkillContext } from "./lib/skill-loader.mjs";
import { loadScenario, listScenarios } from "./lib/scenario-loader.mjs";
import { evaluate } from "./lib/judge.mjs";
import {
  reportFormatStage,
  reportLLMStage,
  reportE2EStage,
} from "./lib/reporter.mjs";
import { extractCode } from "./lib/code-extractor.mjs";
import { buildPlugin, cleanPlugins } from "./lib/plugin-builder.mjs";
import {
  writeWpEnvConfig,
  startEnv,
  createTestPost,
  stopEnv,
  cleanConfig,
} from "./lib/wp-env-manager.mjs";
import { runTests } from "./lib/playwright-runner.mjs";

const EVAL_DIR = path.dirname(new URL(import.meta.url).pathname);
const REPO_ROOT = path.join(EVAL_DIR, "..");
const CACHE_DIR = path.join(EVAL_DIR, ".cache");
const LLM_CACHE_PATH = path.join(CACHE_DIR, "llm-results.json");

// ---------------------------------------------------------------------------
// Cache helpers
// ---------------------------------------------------------------------------

function saveLLMCache(results) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(LLM_CACHE_PATH, JSON.stringify(results, null, 2));
}

function loadLLMCache() {
  if (!fs.existsSync(LLM_CACHE_PATH)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(LLM_CACHE_PATH, "utf8"));
}

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

  const studentResults = [];

  for (const studentConfig of config.students) {
    const studentLabel = `${studentConfig.provider}/${studentConfig.model}`;
    const student = createProvider(studentConfig);

    process.stdout.write(`\n  Student: ${studentLabel}\n`);

    const scenarios = [];

    for (const scenarioName of selectedNames) {
      const scenario = loadScenario(scenarioName);

      process.stdout.write(`    Running: ${scenarioName}...`);

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

      scenarios.push({
        scenario: scenarioName,
        results: judgeResult.results,
        generatedCode,
      });
    }

    studentResults.push({ student: studentLabel, scenarios });
  }

  // Cache results for standalone e2e runs.
  saveLLMCache(studentResults);

  return studentResults;
}

// ---------------------------------------------------------------------------
// Stage 3: E2E testing
// ---------------------------------------------------------------------------

function runE2ETestsForStudent(scenarioResults) {
  const e2eResults = [];
  const pluginPaths = [];
  const testPostConfigs = [];
  const scenariosToTest = [];

  // Phase 1: Extract code and build plugins.
  for (const sr of scenarioResults) {
    const scenario = loadScenario(sr.scenario);
    const e2eConfig = scenario.e2e;

    if (!e2eConfig) {
      e2eResults.push({
        scenario: sr.scenario,
        status: "SKIP",
        reason: "No e2e config in scenario.yaml",
      });
      continue;
    }

    // Extract code from LLM output.
    let extracted;
    try {
      extracted = extractCode(sr.generatedCode);
    } catch (err) {
      e2eResults.push({
        scenario: sr.scenario,
        status: "SKIP",
        reason: `Code extraction failed: ${err.message}`,
      });
      continue;
    }

    // Validate block.json is valid JSON.
    try {
      JSON.parse(extracted.blockJson);
    } catch {
      e2eResults.push({
        scenario: sr.scenario,
        status: "ERROR",
        reason: "block.json is not valid JSON",
      });
      continue;
    }

    // Build plugin.
    let pluginPath;
    try {
      pluginPath = buildPlugin({
        pluginSlug: e2eConfig.pluginSlug,
        blockName: e2eConfig.blockName,
        blockJson: extracted.blockJson,
        renderPhp: extracted.renderPhp,
        viewJs: extracted.viewJs,
      });
    } catch (err) {
      e2eResults.push({
        scenario: sr.scenario,
        status: "ERROR",
        reason: `Plugin build failed: ${err.message}`,
      });
      continue;
    }

    pluginPaths.push(pluginPath);
    scenariosToTest.push(sr.scenario);

    // Generate block markup for the test post.
    const blockMarkup = `<!-- wp:${e2eConfig.blockName} /-->`;
    testPostConfigs.push({
      slug: e2eConfig.testSlug,
      title: `Test: ${sr.scenario}`,
      blockMarkup,
    });
  }

  if (scenariosToTest.length === 0) {
    process.stdout.write("    No scenarios eligible for E2E testing.\n");
    return e2eResults;
  }

  // Phase 2: Start wp-env with all plugins.
  writeWpEnvConfig(pluginPaths);

  try {
    startEnv();
  } catch (err) {
    process.stdout.write(`    WARNING: ${err.message}\n`);
    process.stdout.write("    Skipping E2E for this student.\n");
    for (const name of scenariosToTest) {
      e2eResults.push({
        scenario: name,
        status: "SKIP",
        reason: err.message,
      });
    }
    return e2eResults;
  }

  try {
    // Phase 3: Create test posts.
    for (const postConfig of testPostConfigs) {
      createTestPost(postConfig);
    }

    // Phase 4: Run Playwright tests.
    process.stdout.write("\n    Running Playwright tests...\n");
    const playwrightResults = runTests(scenariosToTest);

    for (const result of playwrightResults.scenarios) {
      e2eResults.push(result);
    }
  } finally {
    // Phase 5: Cleanup.
    stopEnv();
    cleanPlugins();
    cleanConfig();
  }

  return e2eResults;
}

function runE2ETests(studentResults) {
  process.stdout.write("\nStage 3: E2E Testing\n");

  const allStudentE2E = [];

  for (const { student, scenarios } of studentResults) {
    process.stdout.write(`\n  Student: ${student}\n`);
    const e2eResults = runE2ETestsForStudent(scenarios);
    allStudentE2E.push({ student, scenarios: e2eResults });
  }

  return allStudentE2E;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const config = loadConfig();

  // Determine subcommand.
  const subcommand = process.argv[2] || "all";
  const validCommands = ["format", "llm", "e2e", "all"];
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
  let studentResults = null;

  if (command === "llm" || command === "all") {
    studentResults = await runLLMEvaluation(config);

    reportLLMStage({ students: studentResults });

    // Check for failures across all students.
    const hasFailures = studentResults.some((entry) =>
      entry.scenarios.some((s) => s.results.some((r) => !r.pass))
    );
    if (hasFailures) {
      exitCode = 1;
    }
  }

  // Stage 3: E2E testing.
  if (command === "e2e" || command === "all") {
    // For standalone e2e, load from cache.
    if (!studentResults) {
      const cached = loadLLMCache();
      if (!cached) {
        throw new Error(
          "No cached LLM results found. Run `npm run eval:llm` first."
        );
      }

      // Filter to selected scenarios if specified.
      const selectedNames = config.scenarios;
      if (selectedNames && selectedNames.length > 0) {
        studentResults = cached.map((entry) => ({
          ...entry,
          scenarios: entry.scenarios.filter((r) =>
            selectedNames.includes(r.scenario)
          ),
        }));
      } else {
        studentResults = cached;
      }
    }

    try {
      const e2eResults = runE2ETests(studentResults);
      reportE2EStage({ students: e2eResults });

      const hasFails = e2eResults.some((entry) =>
        entry.scenarios.some(
          (r) => r.status === "ERROR" || (r.failed && r.failed > 0)
        )
      );
      if (hasFails) {
        exitCode = 1;
      }
    } catch (err) {
      process.stdout.write(`\n  E2E stage error: ${err.message}\n`);
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
