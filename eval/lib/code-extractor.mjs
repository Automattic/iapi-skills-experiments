/**
 * Parse generated LLM output into individual files.
 *
 * Extracts block.json, render.php, and view.js from fenced code blocks
 * in the raw LLM output string.
 */

/**
 * Scoring patterns for identifying each file type from a fenced code block.
 */
const FILE_PATTERNS = {
  blockJson: {
    filenameHints: [/block\.json/i],
    languageHints: ["json"],
    contentHints: [/"name"\s*:/, /"title"\s*:/, /viewScriptModule|viewScript/],
  },
  renderPhp: {
    filenameHints: [/render\.php/i],
    languageHints: ["php"],
    contentHints: [
      /wp_interactivity_state/,
      /data-wp-interactive/,
      /<\?php/,
    ],
  },
  viewJs: {
    filenameHints: [/view\.js/i, /view\.mjs/i],
    languageHints: ["js", "javascript", "mjs"],
    contentHints: [
      /@wordpress\/interactivity/,
      /getContext|getElement|store/,
    ],
  },
};

/**
 * Extract all fenced code blocks from the raw output.
 *
 * Returns an array of { lang, filename, content } objects.
 */
function parseFencedBlocks(raw) {
  const blocks = [];
  // Match ```lang or ```filename or ```lang filename patterns.
  const fenceRegex = /```(\S*)?[ \t]*(\S*)?\n([\s\S]*?)```/g;
  let match;

  while ((match = fenceRegex.exec(raw)) !== null) {
    const lang = (match[1] || "").toLowerCase();
    const filename = (match[2] || "").toLowerCase();
    const content = match[3].trim();
    blocks.push({ lang, filename, content });
  }

  return blocks;
}

/**
 * Score a fenced block against the patterns for a given file type.
 */
function scoreBlock(block, patterns) {
  let score = 0;

  // Check filename hints (in lang or filename positions).
  for (const hint of patterns.filenameHints) {
    if (hint.test(block.lang) || hint.test(block.filename)) {
      score += 10;
    }
  }

  // Check language hints.
  for (const hint of patterns.languageHints) {
    if (block.lang === hint) {
      score += 3;
    }
  }

  // Check content hints.
  for (const hint of patterns.contentHints) {
    if (hint.test(block.content)) {
      score += 2;
    }
  }

  return score;
}

/**
 * Extract block.json, render.php, and view.js from the raw LLM output.
 *
 * @param {string} raw - The raw generated code string from the LLM.
 * @returns {{ blockJson: string, renderPhp: string, viewJs: string }}
 * @throws {Error} If any required file cannot be found.
 */
export function extractCode(raw) {
  const blocks = parseFencedBlocks(raw);

  if (blocks.length === 0) {
    throw new Error("No fenced code blocks found in generated output");
  }

  const result = {};
  const assigned = new Set();

  // For each file type, find the best-scoring block.
  for (const [fileType, patterns] of Object.entries(FILE_PATTERNS)) {
    let bestScore = 0;
    let bestIdx = -1;

    for (let i = 0; i < blocks.length; i++) {
      if (assigned.has(i)) continue;

      const score = scoreBlock(blocks[i], patterns);
      if (score > bestScore) {
        bestScore = score;
        bestIdx = i;
      }
    }

    if (bestIdx === -1 || bestScore === 0) {
      throw new Error(
        `Could not identify ${fileType} in generated output. ` +
          `Found ${blocks.length} code block(s) but none matched.`
      );
    }

    result[fileType] = blocks[bestIdx].content;
    assigned.add(bestIdx);
  }

  return /** @type {{ blockJson: string, renderPhp: string, viewJs: string }} */ (
    result
  );
}
