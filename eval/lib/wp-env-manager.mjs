/**
 * Manage wp-env lifecycle for E2E testing.
 *
 * Handles writing .wp-env.json, starting/stopping the environment,
 * and creating test posts via WP-CLI.
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const EVAL_DIR = path.dirname(new URL(import.meta.url).pathname);
const WP_ENV_DIR = path.join(EVAL_DIR, "..", "wp-env");
const WP_ENV_CONFIG = path.join(WP_ENV_DIR, ".wp-env.json");

/**
 * Run a command in the wp-env directory.
 */
function run(cmd, opts = {}) {
  return execSync(cmd, {
    cwd: WP_ENV_DIR,
    encoding: "utf8",
    stdio: opts.stdio || ["pipe", "pipe", "pipe"],
    ...opts,
  });
}

/**
 * Write .wp-env.json with the given plugin paths.
 *
 * @param {string[]} pluginPaths - Absolute paths to plugin directories.
 */
export function writeWpEnvConfig(pluginPaths) {
  // Convert absolute paths to relative paths from wp-env dir.
  const relativePaths = pluginPaths.map((p) =>
    "./" + path.relative(WP_ENV_DIR, p)
  );

  const config = {
    core: null,
    plugins: relativePaths,
  };

  fs.mkdirSync(WP_ENV_DIR, { recursive: true });
  fs.writeFileSync(WP_ENV_CONFIG, JSON.stringify(config, null, 2) + "\n");
}

/**
 * Start wp-env and enable pretty permalinks.
 *
 * @throws {Error} If Docker is not running or wp-env fails to start.
 */
export function startEnv() {
  // Check if Docker is running.
  try {
    execSync("docker info", { stdio: "pipe", encoding: "utf8" });
  } catch {
    throw new Error(
      "Docker is not running. Start Docker Desktop and try again."
    );
  }

  process.stdout.write("  Starting wp-env...\n");
  run("npx wp-env start", { stdio: ["pipe", "pipe", "pipe"] });

  // Enable pretty permalinks.
  run(
    'npx wp-env run cli wp rewrite structure "/%postname%/" --hard',
    { stdio: ["pipe", "pipe", "pipe"] }
  );

  process.stdout.write("  wp-env ready at http://localhost:8888\n");
}

/**
 * Create a test post containing the given block markup.
 *
 * @param {object} opts
 * @param {string} opts.slug - Post slug (e.g. "test-counter")
 * @param {string} opts.title - Post title
 * @param {string} opts.blockMarkup - Block HTML to insert as post content
 */
export function createTestPost({ slug, title, blockMarkup }) {
  // Escape single quotes in the markup for shell safety.
  const escaped = blockMarkup.replace(/'/g, "'\\''");

  run(
    `npx wp-env run cli wp post create --post_type=post --post_status=publish --post_name='${slug}' --post_title='${title}' --post_content='${escaped}'`
  );

  process.stdout.write(`  Created test post: /${slug}/\n`);
}

/**
 * Stop wp-env.
 */
export function stopEnv() {
  try {
    run("npx wp-env stop", { stdio: ["pipe", "pipe", "pipe"] });
    process.stdout.write("  wp-env stopped.\n");
  } catch {
    // Ignore errors on stop (may already be stopped).
  }
}

/**
 * Clean up .wp-env.json.
 */
export function cleanConfig() {
  if (fs.existsSync(WP_ENV_CONFIG)) {
    fs.unlinkSync(WP_ENV_CONFIG);
  }
}
