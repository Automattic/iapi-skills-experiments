/**
 * Load scenario YAML files and merge with the general rubric.
 */

import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";

const EVAL_DIR = path.dirname(new URL(import.meta.url).pathname);
const SCENARIOS_DIR = path.join(EVAL_DIR, "..", "scenarios");
const GENERAL_RUBRIC_PATH = path.join(EVAL_DIR, "..", "rubrics", "general.yaml");

/**
 * Load the general (shared) rubric.
 *
 * @returns {{ criteria: Array<{ id: string, description: string }> }}
 */
function loadGeneralRubric() {
  const raw = fs.readFileSync(GENERAL_RUBRIC_PATH, "utf8");
  return parseYaml(raw);
}

/**
 * Load a single scenario by name.
 *
 * Returns the scenario config with a merged `rubric` array containing
 * both general and scenario-specific criteria.
 *
 * @param {string} scenarioName - Directory name under eval/scenarios/
 * @returns {object} Parsed scenario with merged rubric.
 */
export function loadScenario(scenarioName) {
  const scenarioPath = path.join(SCENARIOS_DIR, scenarioName, "scenario.yaml");

  if (!fs.existsSync(scenarioPath)) {
    throw new Error(`Scenario not found: ${scenarioPath}`);
  }

  const raw = fs.readFileSync(scenarioPath, "utf8");
  const scenario = parseYaml(raw);

  const general = loadGeneralRubric();

  // Merge general criteria + scenario-specific criteria.
  scenario.rubric = [
    ...general.criteria,
    ...(scenario.specific_rubric || []),
  ];

  return scenario;
}

/**
 * List all available scenario names.
 *
 * @returns {string[]} Array of scenario directory names.
 */
export function listScenarios() {
  if (!fs.existsSync(SCENARIOS_DIR)) return [];

  return fs
    .readdirSync(SCENARIOS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .filter((d) => {
      const yamlPath = path.join(SCENARIOS_DIR, d.name, "scenario.yaml");
      return fs.existsSync(yamlPath);
    })
    .map((d) => d.name)
    .sort();
}
