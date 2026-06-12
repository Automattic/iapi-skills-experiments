/**
 * Load SKILL.md and all reference documents into a single context string.
 *
 * The combined text is used as the system prompt for the student LLM,
 * mimicking how a real AI agent receives the skill.
 */

import fs from "node:fs";
import path from "node:path";

/**
 * Load skill context for a given skill name.
 *
 * @param {string} skillName - e.g. "wordpress-development"
 * @param {string} [repoRoot] - Repository root path.
 * @returns {string} Concatenated skill context.
 */
export function loadSkillContext(skillName, repoRoot = process.cwd()) {
  const skillDir = path.join(repoRoot, "skills", skillName);
  const skillPath = path.join(skillDir, "SKILL.md");

  if (!fs.existsSync(skillPath)) {
    throw new Error(`SKILL.md not found at ${skillPath}`);
  }

  const parts = [];

  // Main SKILL.md
  parts.push("# SKILL.md\n");
  parts.push(fs.readFileSync(skillPath, "utf8"));

  // Reference documents
  const refsDir = path.join(skillDir, "references");
  if (fs.existsSync(refsDir)) {
    const refFiles = fs
      .readdirSync(refsDir)
      .filter((f) => f.endsWith(".md"))
      .sort();

    for (const file of refFiles) {
      const refPath = path.join(refsDir, file);
      parts.push(`\n---\n# Reference: ${file}\n`);
      parts.push(fs.readFileSync(refPath, "utf8"));
    }
  }

  return parts.join("\n");
}
