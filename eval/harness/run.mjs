/**
 * Validation harness for Interactivity API skills.
 *
 * Adapted from the official WordPress agent-skills eval harness:
 * https://github.com/WordPress/agent-skills/blob/trunk/eval/harness/run.mjs
 *
 * The official harness validates all skills plus the wp-project-triage
 * detector. This version keeps only what's relevant for the iAPI skill.
 *
 * Usage:
 *   node eval/harness/run.mjs
 *   node eval/harness/run.mjs /path/to/repo
 */

import fs from "node:fs";
import path from "node:path";

// ---------------------------------------------------------------------------
// Helpers — carried over from the official harness.
// ---------------------------------------------------------------------------

function readUtf8(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function listSkillDirs(repoRoot) {
  const skillsRoot = path.join(repoRoot, "skills");
  if (!fs.existsSync(skillsRoot)) return [];
  return fs
    .readdirSync(skillsRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => path.join(skillsRoot, d.name));
}

/**
 * Minimal YAML frontmatter parser.
 * Supports simple "key: value" one-liners between --- fences.
 */
function parseFrontmatter(markdown) {
  const lines = markdown.split("\n");
  if (lines[0]?.trim() !== "---") return null;

  let endIndex = -1;
  for (let i = 1; i < Math.min(lines.length, 500); i += 1) {
    if (lines[i].trim() === "---") {
      endIndex = i;
      break;
    }
  }
  if (endIndex === -1) return null;

  const fmLines = lines.slice(1, endIndex);
  const metadata = {};

  for (const line of fmLines) {
    if (!line.trim()) continue;
    const m = line.match(/^\s*([A-Za-z0-9_-]+)\s*:\s*(.*)\s*$/);
    if (!m) continue;
    const key = m[1];
    const raw = m[2];
    const value = raw.replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1").trim();
    metadata[key] = value;
  }

  return {
    name:
      typeof metadata.name === "string" && metadata.name
        ? metadata.name
        : null,
    description:
      typeof metadata.description === "string" && metadata.description
        ? metadata.description
        : null,
    _raw: metadata,
  };
}

// Mirrors skills-ref validator intent (unicode letters/digits + hyphens, lowercase).
function validateSkillName(name) {
  if (name.length > 64) return `Skill name exceeds 64 chars (${name.length})`;
  if (name !== name.toLowerCase()) return "Skill name must be lowercase";
  if (name.startsWith("-") || name.endsWith("-"))
    return "Skill name cannot start or end with hyphen";
  if (name.includes("--"))
    return "Skill name cannot contain consecutive hyphens";
  const ok = /^[\p{Ll}\p{Nd}]+(?:-[\p{Ll}\p{Nd}]+)*$/u.test(name);
  if (!ok) return "Skill name contains invalid characters";
  return null;
}

// ---------------------------------------------------------------------------
// Assertions
// ---------------------------------------------------------------------------

let passCount = 0;
let failCount = 0;
const failures = [];

function assert(condition, message) {
  if (condition) {
    passCount += 1;
  } else {
    failCount += 1;
    failures.push(message);
  }
}

// ---------------------------------------------------------------------------
// Checks
// ---------------------------------------------------------------------------

/**
 * Frontmatter checks — same rules as the official harness (name, description,
 * naming conventions, description length) minus the compatibility contract
 * check which is specific to the multi-skill official repo.
 */
function validateFrontmatter(skillPath, repoRoot) {
  const relPath = path.relative(repoRoot, skillPath);

  assert(fs.existsSync(skillPath), `Missing SKILL.md: ${relPath}`);
  if (!fs.existsSync(skillPath)) return;

  const md = readUtf8(skillPath);
  const fm = parseFrontmatter(md);

  assert(fm !== null, `Missing YAML frontmatter in: ${relPath}`);
  if (!fm) return;

  assert(fm.name !== null, `Missing frontmatter 'name' in: ${relPath}`);
  assert(
    fm.description !== null,
    `Missing frontmatter 'description' in: ${relPath}`
  );

  if (fm.name) {
    const dir = path.basename(path.dirname(skillPath));
    assert(
      fm.name === dir,
      `Frontmatter name mismatch in ${relPath}: expected '${dir}', got '${fm.name}'`
    );

    const nameError = validateSkillName(fm.name);
    assert(!nameError, `Invalid skill name in ${relPath}: ${nameError}`);
  }

  if (fm.description) {
    assert(
      fm.description.length <= 1024,
      `Description too long in ${relPath} (${fm.description.length} chars)`
    );
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const repoRoot = process.argv[2] || process.cwd();

  process.stdout.write(`Evaluating skills in: ${repoRoot}\n\n`);

  const skillDirs = listSkillDirs(repoRoot);
  assert(skillDirs.length > 0, "No skills found under ./skills");

  for (const dir of skillDirs) {
    const skillPath = path.join(dir, "SKILL.md");
    validateFrontmatter(skillPath, repoRoot);
  }

  // Report.
  process.stdout.write(`\nResults: ${passCount} passed, ${failCount} failed\n`);

  if (failures.length > 0) {
    process.stdout.write("\nFailures:\n");
    for (const f of failures) {
      process.stdout.write(`  FAIL: ${f}\n`);
    }
    process.exit(1);
  }

  process.stdout.write("\nOK: all validation checks passed.\n");
}

main();
