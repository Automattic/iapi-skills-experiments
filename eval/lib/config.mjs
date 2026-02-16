/**
 * Load eval.config.yaml and merge with CLI arguments.
 */

import fs from "node:fs";
import path from "node:path";
import { parse as parseYaml } from "yaml";

const EVAL_DIR = path.dirname(new URL(import.meta.url).pathname);
const CONFIG_PATH = path.join(EVAL_DIR, "..", "eval.config.yaml");

/**
 * Parse --key=value CLI args into an object.
 */
function parseCLIArgs(argv) {
  const args = {};
  for (const arg of argv) {
    const match = arg.match(/^--(\w[\w-]*)=(.*)$/);
    if (match) {
      args[match[1]] = match[2];
    }
  }
  return args;
}

/**
 * Load config from eval.config.yaml and merge CLI overrides.
 *
 * CLI args supported:
 *   --scenarios=counter-block,toggle-visibility
 */
export function loadConfig(argv = process.argv.slice(2)) {
  const raw = fs.readFileSync(CONFIG_PATH, "utf8");
  const config = parseYaml(raw);

  // Normalize singular `student:` → `students:[]` for backward compat.
  if (config.student && !config.students) {
    config.students = [config.student];
    delete config.student;
  }

  const cliArgs = parseCLIArgs(argv);

  // Override scenarios from CLI.
  if (cliArgs.scenarios) {
    config.scenarios = cliArgs.scenarios.split(",").map((s) => s.trim());
  }

  return config;
}
