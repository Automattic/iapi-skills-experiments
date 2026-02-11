/**
 * Build a valid WordPress plugin from extracted code files.
 *
 * Given { blockJson, renderPhp, viewJs } and scenario config,
 * writes a complete plugin directory under eval/wp-env/plugins/.
 */

import fs from "node:fs";
import path from "node:path";

const EVAL_DIR = path.dirname(new URL(import.meta.url).pathname);
const PLUGINS_DIR = path.join(EVAL_DIR, "..", "wp-env", "plugins");

/**
 * Normalize the viewScriptModule path in block.json to use the
 * correct relative path from src/ to build/view.js.
 */
function normalizeBlockJson(blockJsonStr) {
  const parsed = JSON.parse(blockJsonStr);

  // Ensure viewScriptModule points to the build directory.
  parsed.viewScriptModule = "file:../build/view.js";

  // Ensure render points to the local render.php.
  parsed.render = "file:./render.php";

  return JSON.stringify(parsed, null, 2);
}

/**
 * Generate the main plugin PHP file that registers the block.
 */
function generatePluginPhp(pluginSlug, blockName) {
  const pluginName = pluginSlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return `<?php
/**
 * Plugin Name: ${pluginName} (Eval)
 * Description: Auto-generated plugin for E2E evaluation.
 * Version: 1.0.0
 */

function ${pluginSlug.replace(/-/g, "_")}_register_block() {
    register_block_type( __DIR__ . '/src' );
}
add_action( 'init', '${pluginSlug.replace(/-/g, "_")}_register_block' );
`;
}

/**
 * Build a WordPress plugin from extracted code.
 *
 * @param {object} opts
 * @param {string} opts.pluginSlug - e.g. "interactive-counter"
 * @param {string} opts.blockName - e.g. "iapi/interactive-counter"
 * @param {string} opts.blockJson - Raw block.json content
 * @param {string} opts.renderPhp - Raw render.php content
 * @param {string} opts.viewJs - Raw view.js content
 * @returns {string} Path to the created plugin directory.
 */
export function buildPlugin({ pluginSlug, blockName, blockJson, renderPhp, viewJs }) {
  const pluginDir = path.join(PLUGINS_DIR, pluginSlug);
  const srcDir = path.join(pluginDir, "src");
  const buildDir = path.join(pluginDir, "build");

  // Clean and recreate.
  if (fs.existsSync(pluginDir)) {
    fs.rmSync(pluginDir, { recursive: true });
  }
  fs.mkdirSync(srcDir, { recursive: true });
  fs.mkdirSync(buildDir, { recursive: true });

  // Write main plugin file.
  fs.writeFileSync(
    path.join(pluginDir, `${pluginSlug}.php`),
    generatePluginPhp(pluginSlug, blockName)
  );

  // Write block.json (normalized).
  fs.writeFileSync(
    path.join(srcDir, "block.json"),
    normalizeBlockJson(blockJson)
  );

  // Write render.php.
  fs.writeFileSync(path.join(srcDir, "render.php"), renderPhp);

  // Write view.js.
  fs.writeFileSync(path.join(buildDir, "view.js"), viewJs);

  return pluginDir;
}

/**
 * Remove all generated plugins.
 */
export function cleanPlugins() {
  if (fs.existsSync(PLUGINS_DIR)) {
    for (const entry of fs.readdirSync(PLUGINS_DIR, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        fs.rmSync(path.join(PLUGINS_DIR, entry.name), { recursive: true });
      }
    }
  }
}
