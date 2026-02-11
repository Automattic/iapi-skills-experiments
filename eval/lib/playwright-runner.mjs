/**
 * Run Playwright E2E tests and parse results.
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execSync } from "node:child_process";

const EVAL_DIR = path.dirname(new URL(import.meta.url).pathname);
const PLAYWRIGHT_CONFIG = path.join(EVAL_DIR, "..", "playwright.config.mjs");

/**
 * Run Playwright tests for the given scenario directories.
 *
 * @param {string[]} scenarioNames - Scenario directory names to test.
 * @returns {{ scenarios: Array<{ scenario: string, total: number, passed: number, failed: number, errors: string[] }> }}
 */
export function runTests(scenarioNames) {
  const resultsFile = path.join(
    os.tmpdir(),
    `playwright-results-${Date.now()}.json`
  );

  // Build test file paths.
  const testFiles = scenarioNames.map((name) =>
    path.join(EVAL_DIR, "..", "scenarios", name, "e2e.spec.mjs")
  );

  // Filter to only existing test files.
  const existingFiles = testFiles.filter((f) => fs.existsSync(f));

  if (existingFiles.length === 0) {
    return {
      scenarios: scenarioNames.map((name) => ({
        scenario: name,
        total: 0,
        passed: 0,
        failed: 0,
        errors: ["No e2e.spec.mjs found"],
      })),
    };
  }

  const cmd = [
    "npx",
    "playwright",
    "test",
    `--config=${PLAYWRIGHT_CONFIG}`,
    `--reporter=json`,
    ...existingFiles,
  ].join(" ");

  let rawOutput;
  try {
    rawOutput = execSync(cmd, {
      cwd: path.join(EVAL_DIR, ".."),
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
      env: {
        ...process.env,
        PLAYWRIGHT_JSON_OUTPUT_NAME: resultsFile,
      },
    });
  } catch (err) {
    // Playwright exits with non-zero on test failures — that's expected.
    rawOutput = err.stdout || "";
  }

  // Parse JSON results.
  let jsonResults;
  try {
    const raw = fs.existsSync(resultsFile)
      ? fs.readFileSync(resultsFile, "utf8")
      : rawOutput;
    jsonResults = JSON.parse(raw);
  } catch {
    // If JSON parsing fails, return all scenarios as failed.
    return {
      scenarios: scenarioNames.map((name) => ({
        scenario: name,
        total: 0,
        passed: 0,
        failed: 0,
        errors: ["Failed to parse Playwright JSON output"],
      })),
    };
  } finally {
    // Clean up temp file.
    if (fs.existsSync(resultsFile)) {
      fs.unlinkSync(resultsFile);
    }
  }

  return parseResults(jsonResults, scenarioNames);
}

/**
 * Parse Playwright JSON reporter output into per-scenario results.
 */
function parseResults(json, scenarioNames) {
  const scenarioMap = new Map(
    scenarioNames.map((name) => [
      name,
      { scenario: name, total: 0, passed: 0, failed: 0, errors: [] },
    ])
  );

  const suites = json.suites || [];

  for (const suite of suites) {
    // Determine which scenario this suite belongs to.
    const scenarioName = scenarioNames.find(
      (name) => suite.file && suite.file.includes(name)
    );
    if (!scenarioName) continue;

    const entry = scenarioMap.get(scenarioName);
    collectSpecs(suite, entry);
  }

  return { scenarios: Array.from(scenarioMap.values()) };
}

/**
 * Recursively collect spec results from a suite.
 */
function collectSpecs(suite, entry) {
  for (const spec of suite.specs || []) {
    for (const test of spec.tests || []) {
      entry.total += 1;
      const status = test.status || test.expectedStatus;

      if (status === "expected" || status === "passed") {
        entry.passed += 1;
      } else {
        entry.failed += 1;
        const errorMsg =
          test.results?.[0]?.error?.message || `${spec.title}: ${status}`;
        entry.errors.push(errorMsg);
      }
    }
  }

  for (const child of suite.suites || []) {
    collectSpecs(child, entry);
  }
}
